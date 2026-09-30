import type { FormEvent } from "react";
import { money } from "../utils/format";

interface OrderFormProps {
  stock: { symbol: string };
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

export default function OrderForm({
  stock, shares, side, setSide, quantity, setQuantity, estimatedTotal, cash, ordering, onTrade,
}: OrderFormProps) {
  return <form className="order-box" onSubmit={onTrade}>
    <div className="order-topline"><div><h3>Place an order</h3><p>Market order · fills instantly</p></div><span>1 share min.</span></div>
    <div className="order-controls">
      <div className="side-toggle" role="group" aria-label="Order side">
        <button type="button" className={side === "buy" ? "selected buy" : ""} onClick={() => setSide("buy")}>Buy</button>
        <button type="button" className={side === "sell" ? "selected sell" : ""} onClick={() => setSide("sell")}>Sell</button>
      </div>
      <label className="shares-input"><span>SHARES</span><input type="number" min="1" step="1" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label>
    </div>
    <div className="order-summary"><span>Estimated total</span><strong>{money.format(estimatedTotal)}</strong></div>
    <div className="order-summary secondary"><span>{side === "buy" ? "Available to invest" : "Available to sell"}</span><span>{side === "buy" ? money.format(cash) : `${shares.toLocaleString()} shares`}</span></div>
    <button className={`submit-order ${side}`} type="submit" disabled={ordering || !Number.isSafeInteger(Number(quantity)) || Number(quantity) < 1 || (side === "buy" && estimatedTotal > cash) || (side === "sell" && Number(quantity) > shares)}>
      {ordering ? "Placing order…" : `${side === "buy" ? "Buy" : "Sell"} ${stock.symbol}`}
      {!ordering && <span>→</span>}
    </button>
  </form>;
}
