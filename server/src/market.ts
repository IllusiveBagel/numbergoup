import type {
  MarketSnapshot,
  PersistedState,
  StockDefinition,
  Trade,
  TradeSide,
} from "./types.js";

export const STARTING_CASH = 10_000;
const HISTORY_LIMIT = 60;
const TRANSACTION_LIMIT = 100;
const YEAR_SECONDS = 365.25 * 24 * 60 * 60;

export class MarketError extends Error {}

export const STOCKS: StockDefinition[] = [
  { symbol: "NVDA", name: "Nvidia", sector: "Semiconductors", initialPrice: 142.5, volatility: 0.58, beta: 1.5 },
  { symbol: "AAPL", name: "Apple", sector: "Technology", initialPrice: 227.4, volatility: 0.28, beta: 1.1 },
  { symbol: "MSFT", name: "Microsoft", sector: "Technology", initialPrice: 510.2, volatility: 0.25, beta: 1.0 },
  { symbol: "AMZN", name: "Amazon", sector: "Consumer", initialPrice: 221.8, volatility: 0.34, beta: 1.2 },
  { symbol: "TSLA", name: "Tesla", sector: "Automotive", initialPrice: 338.6, volatility: 0.72, beta: 1.7 },
  { symbol: "JPM", name: "JPMorgan", sector: "Finance", initialPrice: 297.3, volatility: 0.24, beta: 1.0 },
  { symbol: "KO", name: "Coca-Cola", sector: "Consumer staples", initialPrice: 71.9, volatility: 0.16, beta: 0.6 },
  { symbol: "XOM", name: "Exxon Mobil", sector: "Energy", initialPrice: 114.6, volatility: 0.25, beta: 0.9 },
];

export function createInitialState(now = new Date()): PersistedState {
  const prices = Object.fromEntries(STOCKS.map((stock) => [stock.symbol, stock.initialPrice]));
  return {
    cash: STARTING_CASH,
    holdings: {},
    prices,
    history: Object.fromEntries(STOCKS.map((stock) => [stock.symbol, [stock.initialPrice]])),
    transactions: [],
    lastUpdated: now.toISOString(),
  };
}

export function restoreState(saved: unknown): PersistedState {
  if (typeof saved !== "object" || saved === null) return createInitialState();
  const input = saved as Partial<PersistedState>;
  if (typeof input.cash !== "number" || !Number.isFinite(input.cash) || input.cash < 0) return createInitialState();

  const base = createInitialState();
  for (const stock of STOCKS) {
    const price = input.prices?.[stock.symbol];
    if (typeof price === "number" && Number.isFinite(price) && price > 0) base.prices[stock.symbol] = price;
    const history = input.history?.[stock.symbol];
    if (Array.isArray(history)) {
      const validHistory = history.filter(
        (value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0,
      );
      if (validHistory.length) base.history[stock.symbol] = validHistory.slice(-HISTORY_LIMIT);
    }
    const shares = input.holdings?.[stock.symbol];
    if (typeof shares === "number" && Number.isSafeInteger(shares) && shares > 0) {
      base.holdings[stock.symbol] = shares;
    }
  }
  base.cash = input.cash;
  if (Array.isArray(input.transactions)) {
    base.transactions = input.transactions
      .filter(isTrade)
      .slice(-TRANSACTION_LIMIT);
  }
  if (typeof input.lastUpdated === "string" && Number.isFinite(Date.parse(input.lastUpdated))) {
    base.lastUpdated = input.lastUpdated;
  }
  return base;
}

function isTrade(value: unknown): value is Trade {
  if (typeof value !== "object" || value === null) return false;
  const trade = value as Partial<Trade>;
  return (
    typeof trade.id === "string" &&
    typeof trade.symbol === "string" &&
    STOCKS.some((stock) => stock.symbol === trade.symbol) &&
    (trade.side === "buy" || trade.side === "sell") &&
    Number.isSafeInteger(trade.shares) &&
    (trade.shares ?? 0) > 0 &&
    typeof trade.price === "number" &&
    Number.isFinite(trade.price) &&
    typeof trade.total === "number" &&
    Number.isFinite(trade.total) &&
    typeof trade.at === "string"
  );
}

export class MarketEngine {
  private state: PersistedState;
  private lastTickMs: number;

  constructor(
    initialState: PersistedState = createInitialState(),
    private readonly random: () => number = Math.random,
  ) {
    this.state = restoreState(initialState);
    this.lastTickMs = Date.now();
  }

  snapshot(): MarketSnapshot {
    const stocks = STOCKS.map((definition) => {
      const history = this.state.history[definition.symbol] ?? [definition.initialPrice];
      const price = this.state.prices[definition.symbol] ?? definition.initialPrice;
      const firstPrice = history[0] ?? price;
      return {
        ...definition,
        price,
        changePercent: firstPrice === 0 ? 0 : ((price - firstPrice) / firstPrice) * 100,
        history,
      };
    });
    const portfolioValue = stocks.reduce(
      (value, stock) => value + stock.price * (this.state.holdings[stock.symbol] ?? 0),
      0,
    );
    return {
      cash: this.state.cash,
      holdings: { ...this.state.holdings },
      stocks,
      transactions: [...this.state.transactions],
      portfolioValue,
      totalValue: this.state.cash + portfolioValue,
      totalReturn: ((this.state.cash + portfolioValue - STARTING_CASH) / STARTING_CASH) * 100,
      lastUpdated: this.state.lastUpdated,
    };
  }

  persistedState(): PersistedState {
    return structuredClone(this.state);
  }

  trade(symbol: string, side: TradeSide, shares: number): Trade {
    const definition = STOCKS.find((stock) => stock.symbol === symbol);
    if (!definition) throw new MarketError("Choose a listed stock.");
    if (side !== "buy" && side !== "sell") throw new MarketError("Choose buy or sell.");
    if (!Number.isSafeInteger(shares) || shares <= 0) throw new MarketError("Shares must be a positive whole number.");

    const price = this.state.prices[symbol] ?? definition.initialPrice;
    const total = roundMoney(price * shares);
    const owned = this.state.holdings[symbol] ?? 0;
    if (side === "buy" && total > this.state.cash) throw new MarketError("Not enough cash for this order.");
    if (side === "sell" && shares > owned) throw new MarketError("You do not own enough shares to sell.");

    if (side === "buy") {
      this.state.cash = roundMoney(this.state.cash - total);
      this.state.holdings[symbol] = owned + shares;
    } else {
      this.state.cash = roundMoney(this.state.cash + total);
      const remaining = owned - shares;
      if (remaining === 0) delete this.state.holdings[symbol];
      else this.state.holdings[symbol] = remaining;
    }
    const trade: Trade = {
      id: `${Date.now()}-${this.random().toString(36).slice(2, 9)}`,
      symbol,
      side,
      shares,
      price,
      total,
      at: new Date().toISOString(),
    };
    this.state.transactions = [...this.state.transactions, trade].slice(-TRANSACTION_LIMIT);
    return trade;
  }

  tick(now = Date.now()): void {
    const elapsedSeconds = Math.min(Math.max((now - this.lastTickMs) / 1000, 0), 60);
    if (elapsedSeconds === 0) return;
    const dt = elapsedSeconds / YEAR_SECONDS;
    const marketMove = normalRandom(this.random);
    for (const stock of STOCKS) {
      const idiosyncraticMove = normalRandom(this.random);
      const beta = stock.beta;
      const marketExposure = beta / 2;
      const combinedMove =
        marketExposure * marketMove +
        Math.sqrt(Math.max(1 - marketExposure * marketExposure, 0)) * idiosyncraticMove;
      const logReturn = 0.06 * dt + stock.volatility * Math.sqrt(dt) * combinedMove;
      const nextPrice = Math.max(0.01, (this.state.prices[stock.symbol] ?? stock.initialPrice) * Math.exp(logReturn));
      const roundedPrice = roundMoney(nextPrice);
      this.state.prices[stock.symbol] = roundedPrice;
      const history = this.state.history[stock.symbol] ?? [];
      if (history.length === 0 || now - this.lastTickMs >= 30_000) {
        this.state.history[stock.symbol] = [...history, roundedPrice].slice(-HISTORY_LIMIT);
      }
    }
    this.lastTickMs = now;
    this.state.lastUpdated = new Date(now).toISOString();
  }
}

function normalRandom(random: () => number): number {
  const first = Math.max(random(), Number.EPSILON);
  const second = random();
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
}

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}
