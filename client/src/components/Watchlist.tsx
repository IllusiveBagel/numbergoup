import type { StockQuote } from "../types";
import { money, tone, formatPercent } from "../utils/format";

interface WatchlistProps {
  stocks: StockQuote[];
  holdings: Record<string, number>;
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
}

export default function Watchlist({ stocks, holdings, selectedSymbol, onSelect }: WatchlistProps) {
  return <article className="panel watchlist-panel">
    <div className="panel-heading">
      <div><h2>Market watch</h2><p>Pick a company to explore</p></div>
      <span className="market-count">{stocks.length} ASSETS</span>
    </div>
    <div className="stock-list">
      {stocks.map((stock) => (
        <button
          key={stock.symbol}
          className={`stock-row ${selectedSymbol === stock.symbol ? "active" : ""}`}
          onClick={() => onSelect(stock.symbol)}
          aria-pressed={selectedSymbol === stock.symbol}
        >
          <span className={`stock-avatar ${stock.symbol.slice(0, 1).toLowerCase()}`}>{stock.symbol.slice(0, 1)}</span>
          <span className="stock-ident"><strong>{stock.symbol}</strong><small>{stock.name}</small></span>
          <span className="stock-price"><strong>{money.format(stock.price)}</strong><small className={tone(stock.changePercent)}>{formatPercent(stock.changePercent)}</small></span>
          {(holdings[stock.symbol] ?? 0) > 0 && <span className="holding-dot" aria-label={`${holdings[stock.symbol]} shares owned`} />}
        </button>
      ))}
    </div>
    <div className="watchlist-foot"><span className="live-dot" /> Prices update continuously</div>
  </article>;
}
