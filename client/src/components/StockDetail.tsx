import type { FormEvent } from "react";
import OrderForm from "./OrderForm";
import TradingChart from "./TradingChart";
import type { StockQuote } from "../types";
import { money } from "../utils/format";

interface StockDetailProps {
  stock: StockQuote;
  shares: number;
  side: "buy" | "sell";
  setSide: (side: "buy" | "sell") => void;
  quantity: string;
  setQuantity: (quantity: string) => void;
  estimatedTotal: number;
  cash: number;
  ordering: boolean;
  onTrade: (event: FormEvent<HTMLFormElement>) => void;
}

export default function StockDetail(props: StockDetailProps) {
  const { stock, shares } = props;
  return <article className="panel detail-panel">
    <div className="detail-heading">
      <div className="detail-company">
        <span className={`stock-avatar large ${stock.symbol.slice(0, 1).toLowerCase()}`}>{stock.symbol.slice(0, 1)}</span>
        <div><div className="company-title">{stock.name} <span className="symbol-tag">{stock.symbol}</span></div><div className="company-sector">{stock.sector}</div></div>
      </div>
      <span className="exchange-tag"><span className="live-dot" /> SIMULATED</span>
    </div>
    <TradingChart stock={stock} />
    <div className="stock-facts">
      <div><span>Sector</span><strong>{stock.sector}</strong></div>
      <div><span>Volatility</span><strong>{Math.round(stock.volatility * 100)}%</strong></div>
      <div><span>Your shares</span><strong>{shares.toLocaleString()}</strong></div>
      <div><span>Position value</span><strong>{money.format(shares * stock.price)}</strong></div>
    </div>
    <OrderForm {...props} />
  </article>;
}
