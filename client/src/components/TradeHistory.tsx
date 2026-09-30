import type { StockQuote, Trade } from "../types";
import { money } from "../utils/format";

interface TradeHistoryProps {
  trades: Trade[];
  stocks: StockQuote[];
}

export default function TradeHistory({ trades, stocks }: TradeHistoryProps) {
  const visible = [...trades].reverse();
  return <article className="panel activity-panel">
    <div className="panel-heading">
      <div><h2>Recent activity</h2><p>Your latest trades</p></div>
      <span className="activity-count">{trades.length} / 100</span>
    </div>
    {!trades.length ? (
      <div className="empty-activity"><span className="empty-icon">↗</span><strong>No trades just yet</strong><span>Your completed orders will show up here.</span></div>
    ) : (
      <div className="trade-table-wrap"><table className="trade-table">
        <thead><tr><th>COMPANY</th><th>TYPE</th><th>SHARES</th><th>PRICE</th><th>TOTAL</th><th>TIME</th></tr></thead>
        <tbody>{visible.map((trade) => <tr key={trade.id}>
          <td><strong>{trade.symbol}</strong><small>{stocks.find((stock) => stock.symbol === trade.symbol)?.name ?? ""}</small></td>
          <td><span className={`trade-pill ${trade.side}`}>{trade.side}</span></td>
          <td>{trade.shares}</td><td>{money.format(trade.price)}</td><td className="trade-total">{money.format(trade.total)}</td>
          <td className="trade-time">{new Date(trade.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</td>
        </tr>)}</tbody>
      </table></div>
    )}
  </article>;
}
