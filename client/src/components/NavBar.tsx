type Page = "trading" | "activity";

interface NavBarProps {
  dateLabel: string;
  page: Page;
  onNavigate: (page: Page) => void;
}

export default function NavBar({ dateLabel, page, onNavigate }: NavBarProps) {
  return (
    <header className="topbar">
      <a className="brand" href="/" aria-label="Numbergoup home">
        <span className="brand-mark">n<span>↑</span></span>
        <span>number<span className="brand-light">goup</span></span>
      </a>
      <nav className="nav-tabs" aria-label="Primary">
        <button type="button" className={page === "trading" ? "selected" : ""} onClick={() => onNavigate("trading")}>Trading</button>
        <button type="button" className={page === "activity" ? "selected" : ""} onClick={() => onNavigate("activity")}>Activity</button>
      </nav>
      <div className="market-status"><span className="live-dot" /> SIMULATED <span className="status-divider">·</span> {dateLabel}</div>
    </header>
  );
}
