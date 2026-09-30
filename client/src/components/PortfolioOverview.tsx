import type { MarketState, StockQuote } from "../types";
import { money, tone } from "../utils/format";

interface PortfolioOverviewProps {
  market: MarketState | null;
  selectedStock?: StockQuote;
}

export default function PortfolioOverview({ market, selectedStock }: PortfolioOverviewProps) {
  const totalReturn = market?.totalReturn ?? 0;
  return <section className="overview-grid" aria-label="Portfolio overview">
    <article className="metric-card total-card">
      <div className="metric-heading">TOTAL ACCOUNT VALUE <span className="metric-icon">◈</span></div>
      <div className="metric-value">{money.format(market?.totalValue ?? 0)}</div>
      <div className={`metric-change ${tone(totalReturn)}`}>
        <span>{totalReturn >= 0 ? "↗" : "↘"} {totalReturn >= 0 ? "+" : ""}{totalReturn.toFixed(2)}%</span>
        <span className="change-caption">overall return</span>
      </div>
      <MiniChart values={selectedStock?.history ?? []} positive={totalReturn >= 0} />
    </article>
    <MetricCard label="AVAILABLE CASH" value={money.format(market?.cash ?? 0)} caption="Ready to invest" icon="$" />
    <MetricCard label="INVESTED" value={money.format(market?.portfolioValue ?? 0)} caption="Across your positions" icon="▥" />
    <MetricCard label="OPEN POSITIONS" value={String(Object.keys(market?.holdings ?? {}).length)} caption="Stocks in your portfolio" icon="◫" />
  </section>;
}

function MetricCard({ label, value, caption, icon }: { label: string; value: string; caption: string; icon: string }) {
  return <article className="metric-card small-metric">
    <div className="metric-heading">{label}<span className="metric-icon">{icon}</span></div>
    <div className="metric-value">{value}</div>
    <div className="change-caption">{caption}</div>
  </article>;
}

function MiniChart({ values, positive }: { values: number[]; positive: boolean }) {
  if (values.length < 2) return <div className="mini-chart empty" />;
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const coords = values.map((value, i) => `${(i / (values.length - 1)) * 100},${25 - ((value - min) / range) * 21}`).join(" ");
  return <svg className="mini-chart" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
    <polyline points={coords} fill="none" stroke={positive ? "#36d5a0" : "#fa7882"} strokeWidth="2" vectorEffect="non-scaling-stroke" />
  </svg>;
}
