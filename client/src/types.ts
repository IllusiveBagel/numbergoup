export interface StockQuote {
  symbol: string;
  name: string;
  sector: string;
  initialPrice: number;
  volatility: number;
  beta: number;
  price: number;
  changePercent: number;
  history: number[];
}

export interface Trade {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  shares: number;
  price: number;
  total: number;
  at: string;
}

export interface MarketState {
  cash: number;
  holdings: Record<string, number>;
  stocks: StockQuote[];
  transactions: Trade[];
  portfolioValue: number;
  totalValue: number;
  totalReturn: number;
  lastUpdated: string;
}

export type Page = "trading" | "activity";
