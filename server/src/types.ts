export type TradeSide = "buy" | "sell";

export interface StockDefinition {
  symbol: string;
  name: string;
  sector: string;
  initialPrice: number;
  volatility: number;
  beta: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: TradeSide;
  shares: number;
  price: number;
  total: number;
  at: string;
}

export interface PersistedState {
  cash: number;
  holdings: Record<string, number>;
  prices: Record<string, number>;
  history: Record<string, number[]>;
  transactions: Trade[];
  lastUpdated: string;
}

export interface StockQuote extends StockDefinition {
  price: number;
  changePercent: number;
  history: number[];
}

export interface MarketSnapshot {
  cash: number;
  holdings: Record<string, number>;
  stocks: StockQuote[];
  transactions: Trade[];
  portfolioValue: number;
  totalValue: number;
  totalReturn: number;
  lastUpdated: string;
}
