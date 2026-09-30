interface MarketHeaderProps {
  dateLabel: string;
}

export default function MarketHeader({ dateLabel }: MarketHeaderProps) {
  return <>
    <header className="topbar">
      <a className="brand" href="/" aria-label="Numbergoup home">
        <span className="brand-mark">n<span>↑</span></span>
        <span>number<span className="brand-light">goup</span></span>
      </a>
      <div className="market-status"><span className="live-dot" /> SIMULATED MARKET <span className="status-divider">·</span> UPDATING LIVE</div>
      <div className="topbar-right"><span className="avatar">Y</span><span className="player-name">Your portfolio</span></div>
    </header>
    <section className="welcome-row">
      <div>
        <p className="eyebrow">PAPER TRADING ACCOUNT <span className="eyebrow-divider">/</span> TRADER TERMINAL</p>
        <h1>Good things take <span>market time.</span></h1>
        <p className="subtitle">Build your portfolio. The market keeps moving while you’re away.</p>
      </div>
      <div className="market-clock"><span className="live-dot" /> Market active <span>·</span> {dateLabel}</div>
    </section>
  </>;
}
