import { useState } from "react";
import type { PointerEvent } from "react";
import type { StockQuote } from "../types";
import { money, tone, formatPercent } from "../utils/format";

interface TradingChartProps {
  stock: StockQuote;
}

const plot = { left: 12, right: 890, top: 20, bottom: 244 };

export default function TradingChart({ stock }: TradingChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const values = stock.history.length ? stock.history : [stock.price];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max((max - min) * 0.12, max * 0.001);
  const low = Math.max(0.01, min - padding);
  const high = max + padding;
  const range = high - low || 1;
  const xFor = (index: number) => values.length === 1
    ? (plot.left + plot.right) / 2
    : plot.left + (index / (values.length - 1)) * (plot.right - plot.left);
  const yFor = (value: number) => plot.bottom - ((value - low) / range) * (plot.bottom - plot.top);
  const coordinates = values.map((value, index) => `${xFor(index)},${yFor(value)}`).join(" ");
  const positive = values[values.length - 1]! >= values[0]!;
  const color = positive ? "#39d6a0" : "#f47783";
  const hoveredValue = hoveredIndex === null ? null : values[hoveredIndex]!;
  const hoverX = hoveredIndex === null ? 0 : xFor(hoveredIndex);
  const hoverY = hoveredValue === null ? 0 : yFor(hoveredValue);
  const axisValues = Array.from({ length: 5 }, (_, index) => high - (range * index) / 4);

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (values.length < 2) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const chartX = ((event.clientX - bounds.left) / bounds.width) * 1000;
    const ratio = Math.max(0, Math.min(1, (chartX - plot.left) / (plot.right - plot.left)));
    setHoveredIndex(Math.round(ratio * (values.length - 1)));
  };

  const minutesAgo = hoveredIndex === null ? 0 : values.length - 1 - hoveredIndex;
  const tooltipLeft = values.length < 2 ? 50 : Math.max(8, Math.min(92, (hoveredIndex! / (values.length - 1)) * 100));

  return <section className="chart-section" aria-label={`${stock.symbol} price chart`}>
    <div className="chart-toolbar">
      <div className="quote-line">
        <div><span className="quote-price">{money.format(stock.price)}</span><span className={`quote-change ${tone(stock.changePercent)}`}>{formatPercent(stock.changePercent)}</span></div>
        <span className="quote-caption">LAST PRICE <b>USD</b></span>
      </div>
      <div className="chart-controls">
        <div className="chart-intervals" aria-label="Chart timeframe">
          <button type="button" className="selected" aria-pressed="true">1H</button>
          <button type="button" disabled title="The market provides the most recent 60 minutes of history">1D</button>
          <button type="button" disabled title="The market provides the most recent 60 minutes of history">1W</button>
        </div>
        <span className="chart-frequency">● 1 MIN</span>
      </div>
    </div>
    <div className="chart-wrap">
      <svg
        className="price-chart"
        viewBox="0 0 1000 270"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${stock.symbol} price history over the last ${Math.max(values.length - 1, 1)} minutes`}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {axisValues.map((value, index) => {
          const y = plot.top + (index / 4) * (plot.bottom - plot.top);
          return <g key={index}>
            <line x1={plot.left} x2={plot.right} y1={y} y2={y} className="chart-gridline" />
            <text x="906" y={y + 3} className="chart-axis-label">{money.format(value)}</text>
          </g>;
        })}
        {[0, 15, 30, 45, 60].map((minute) => {
          const x = plot.left + (minute / 60) * (plot.right - plot.left);
          return <line key={minute} x1={x} x2={x} y1={plot.top} y2={plot.bottom} className="chart-gridline vertical" />;
        })}
        <polygon points={`${plot.left},${plot.bottom} ${coordinates} ${plot.right},${plot.bottom}`} fill="url(#chart-fill)" />
        <polyline points={coordinates} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <line x1={plot.left} x2={plot.right} y1={yFor(stock.price)} y2={yFor(stock.price)} className="current-price-line" />
        {hoveredIndex !== null && <>
          <line x1={hoverX} x2={hoverX} y1={plot.top} y2={plot.bottom} className="chart-crosshair" />
          <circle cx={hoverX} cy={hoverY} r="4" fill={color} stroke="#0d1724" strokeWidth="2" />
        </>}
      </svg>
      {hoveredValue !== null && <div className="chart-tooltip" style={{ left: `${tooltipLeft}%` }}>
        <strong>{money.format(hoveredValue)}</strong>
        <span>{minutesAgo === 0 ? "Now" : `${minutesAgo} min ago`}</span>
      </div>}
    </div>
    <div className="chart-labels"><span>60 min ago</span><span>45 min</span><span>30 min</span><span>15 min</span><span>Now</span></div>
  </section>;
}
