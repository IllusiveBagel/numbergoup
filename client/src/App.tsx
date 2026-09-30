import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { MarketState, StockQuote, Trade } from "./types";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const shortMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

export default function App() {
  const [market, setMarket] = useState<MarketState | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState("NVDA");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [shares, setShares] = useState("1");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/state");
      if (!response.ok) throw new Error("Market data is temporarily unavailable.");
      const state = (await response.json()) as MarketState;
      setMarket(state);
      setSelectedSymbol((current) =>
        state.stocks.some((stock) => stock.symbol === current) ? current : state.stocks[0]?.symbol ?? "",
      );
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to connect to the market.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 5_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const selectedStock = market?.stocks.find((stock) => stock.symbol === selectedSymbol);
  const ownedShares = market?.holdings[selectedSymbol] ?? 0;
  const quantity = Number(shares);
  const estimatedTotal = selectedStock && Number.isSafeInteger(quantity) && quantity > 0
    ? selectedStock.price * quantity
    : 0;

  const onTrade = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setOrdering(true);
    try {
      const response = await fetch("/api/trade", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ symbol: selectedSymbol, side, shares: quantity }),
      });
      const result = (await response.json()) as { error?: string; state?: MarketState; trade?: Trade };
      if (!response.ok || !result.state) throw new Error(result.error ?? "Order could not be placed.");
      setMarket(result.state);
      setMessage(`${side === "buy" ? "Bought" : "Sold"} ${quantity} ${selectedSymbol} share${quantity === 1 ? "" : "s"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Order could not be placed.");
    } finally {
      setOrdering(false);
    }
  };

  const dateLabel = useMemo(() => {
    if (!market) return "Connecting";
    return new Date(market.lastUpdated).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
  }, [market?.lastUpdated]);

  if (loading && !market) {
    return <div className="center-state"><span className="loader" /> Connecting to your market…</div>;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Numbergoup home">
          <span className="brand-mark">n<span>↑</span></span>
          <span>number<span className="brand-light">goup</span></span>
        </a>
        <div className="market-status"><span className="live-dot" /> SIMULATED MARKET <span className="status-divider">·</span> UPDATING LIVE</div>
        <div className="topbar-right"><span className="avatar">Y</span><span className="player-name">Your portfolio</span></div>
      </header>

      <main className="dashboard">
        <section className="welcome-row">
          <div>
            <p className="eyebrow">PAPER TRADING ACCOUNT</p>
            <h1>Good things take <span>market time.</span></h1>
            <p className="subtitle">Build your portfolio. The market keeps moving while you’re away.</p>
          </div>
          <div className="market-clock"><span className="live-dot" /> Market active <span>·</span> {dateLabel}</div>
        </section>

        <section className="overview-grid" aria-label="Portfolio overview">
          <article className="metric-card total-card">
            <div className="metric-heading">TOTAL ACCOUNT VALUE <span className="metric-icon">◈</span></div>
            <div className="metric-value">{money.format(market?.totalValue ?? 0)}</div>
            <div className={`metric-change ${tone(market?.totalReturn ?? 0)}`}>
              <span>{(market?.totalReturn ?? 0) >= 0 ? "↗" : "↘"} {(market?.totalReturn ?? 0) >= 0 ? "+" : ""}{(market?.totalReturn ?? 0).toFixed(2)}%</span>
              <span className="change-caption">overall return</span>
            </div>
            <MiniChart values={selectedStock?.history ?? []} positive={(market?.totalReturn ?? 0) >= 0} />
          </article>
          <MetricCard label="AVAILABLE CASH" value={money.format(market?.cash ?? 0)} caption="Ready to invest" icon="$" />
          <MetricCard label="INVESTED" value={money.format(market?.portfolioValue ?? 0)} caption="Across your positions" icon="▥" />
          <MetricCard label="OPEN POSITIONS" value={String(Object.keys(market?.holdings ?? {}).length)} caption="Stocks in your portfolio" icon="◫" />
        </section>

        {message && <div className={`notice ${message.includes("Bought") || message.includes("Sold") ? "success" : "error"}`} role="status">{message}</div>}

        <section className="workspace">
          <article className="panel watchlist-panel">
            <div className="panel-heading">
              <div><h2>Market watch</h2><p>Pick a company to explore</p></div>
              <span className="market-count">{market?.stocks.length ?? 0} ASSETS</span>
            </div>
            <div className="stock-list">
              {market?.stocks.map((stock) => (
                <StockRow
                  key={stock.symbol}
                  stock={stock}
                  active={selectedSymbol === stock.symbol}
                  shares={market.holdings[stock.symbol] ?? 0}
                  onClick={() => setSelectedSymbol(stock.symbol)}
                />
              ))}
            </div>
            <div className="watchlist-foot"><span className="live-dot" /> Prices update continuously</div>
          </article>

          <section className="main-column">
            {selectedStock ? (
              <StockDetail
                stock={selectedStock}
                shares={ownedShares}
                side={side}
                setSide={setSide}
                quantity={shares}
                setQuantity={setShares}
                estimatedTotal={estimatedTotal}
                cash={market?.cash ?? 0}
                ordering={ordering}
                onTrade={onTrade}
              />
            ) : <article className="panel empty-panel">Waiting for market data…</article>}

            <article className="panel activity-panel">
              <div className="panel-heading">
                <div><h2>Recent activity</h2><p>Your latest trades</p></div>
                <span className="activity-count">{market?.transactions.length ?? 0} / 100</span>
              </div>
              <TradeHistory trades={market?.transactions ?? []} stocks={market?.stocks ?? []} />
            </article>
          </section>
        </section>
        <footer className="footer-note">A little game of what if. All prices and trades are simulated and have no real-world value.</footer>
      </main>
    </div>
  );
}

function MetricCard({ label, value, caption, icon }: { label: string; value: string; caption: string; icon: string }) {
  return <article className="metric-card small-metric">
    <div className="metric-heading">{label}<span className="metric-icon">{icon}</span></div>
    <div className="metric-value">{value}</div>
    <div className="change-caption">{caption}</div>
  </article>;
}

function StockRow({ stock, active, shares, onClick }: { stock: StockQuote; active: boolean; shares: number; onClick: () => void }) {
  return <button className={`stock-row ${active ? "active" : ""}`} onClick={onClick}>
    <span className={`stock-avatar ${stock.symbol.slice(0, 1).toLowerCase()}`}>{stock.symbol.slice(0, 1)}</span>
    <span className="stock-ident"><strong>{stock.symbol}</strong><small>{stock.name}</small></span>
    <span className="stock-price"><strong>{money.format(stock.price)}</strong><small className={tone(stock.changePercent)}>{formatPercent(stock.changePercent)}</small></span>
    {shares > 0 && <span className="holding-dot" aria-label={`${shares} shares owned`} />}
  </button>;
}

function StockDetail({
  stock, shares, side, setSide, quantity, setQuantity, estimatedTotal, cash, ordering, onTrade,
}: {
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
}) {
  return <article className="panel detail-panel">
    <div className="detail-heading">
      <div className="detail-company">
        <span className={`stock-avatar large ${stock.symbol.slice(0, 1).toLowerCase()}`}>{stock.symbol.slice(0, 1)}</span>
        <div><div className="company-title">{stock.name} <span className="symbol-tag">{stock.symbol}</span></div><div className="company-sector">{stock.sector}</div></div>
      </div>
      <span className="exchange-tag">SIMULATED</span>
    </div>
    <div className="quote-line">
      <div><span className="quote-price">{money.format(stock.price)}</span><span className={`quote-change ${tone(stock.changePercent)}`}>{formatPercent(stock.changePercent)}</span></div>
      <span className="chart-period">LAST 60 MIN</span>
    </div>
    <div className="chart-wrap"><PriceChart stock={stock} /></div>
    <div className="chart-labels"><span>60 min ago</span><span>Now</span></div>
    <div className="stock-facts">
      <div><span>Sector</span><strong>{stock.sector}</strong></div>
      <div><span>Volatility</span><strong>{Math.round(stock.volatility * 100)}%</strong></div>
      <div><span>Your shares</span><strong>{shares.toLocaleString()}</strong></div>
      <div><span>Position value</span><strong>{money.format(shares * stock.price)}</strong></div>
    </div>
    <form className="order-box" onSubmit={onTrade}>
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
    </form>
  </article>;
}

function PriceChart({ stock }: { stock: StockQuote }) {
  const points = stock.history.length ? stock.history : [stock.price];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const coordinates = points.map((value, index) => {
    const x = points.length === 1 ? 0 : (index / (points.length - 1)) * 100;
    const y = 88 - ((value - min) / range) * 76;
    return `${x},${y}`;
  }).join(" ");
  const positive = points[points.length - 1]! >= points[0]!;
  const color = positive ? "#27bd89" : "#f36b79";
  return <svg className="price-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`${stock.symbol} recent price chart`}>
    <defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".2" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
    {[25, 50, 75].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} className="chart-gridline" />)}
    <polygon points={`0,100 ${coordinates} 100,100`} fill="url(#chart-fill)" />
    <polyline points={coordinates} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
  </svg>;
}

function MiniChart({ values, positive }: { values: number[]; positive: boolean }) {
  if (values.length < 2) return <div className="mini-chart empty" />;
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const coords = values.map((value, i) => `${(i / (values.length - 1)) * 100},${25 - ((value - min) / range) * 21}`).join(" ");
  return <svg className="mini-chart" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><polyline points={coords} fill="none" stroke={positive ? "#36d5a0" : "#fa7882"} strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>;
}

function TradeHistory({ trades, stocks }: { trades: Trade[]; stocks: StockQuote[] }) {
  if (!trades.length) return <div className="empty-activity"><span className="empty-icon">↗</span><strong>No trades just yet</strong><span>Your completed orders will show up here.</span></div>;
  return <div className="trade-table-wrap"><table className="trade-table">
    <thead><tr><th>COMPANY</th><th>TYPE</th><th>SHARES</th><th>PRICE</th><th>TOTAL</th><th>TIME</th></tr></thead>
    <tbody>{[...trades].reverse().slice(0, 6).map((trade) => <tr key={trade.id}>
      <td><strong>{trade.symbol}</strong><small>{stocks.find((stock) => stock.symbol === trade.symbol)?.name ?? ""}</small></td>
      <td><span className={`trade-pill ${trade.side}`}>{trade.side}</span></td>
      <td>{trade.shares}</td><td>{money.format(trade.price)}</td><td className="trade-total">{money.format(trade.total)}</td>
      <td className="trade-time">{new Date(trade.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</td>
    </tr>)}</tbody>
  </table></div>;
}

function tone(value: number): string {
  return value >= 0 ? "positive" : "negative";
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}
