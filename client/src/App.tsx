import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import MarketHeader from "./components/MarketHeader";
import PortfolioOverview from "./components/PortfolioOverview";
import StockDetail from "./components/StockDetail";
import TradeHistory from "./components/TradeHistory";
import Watchlist from "./components/Watchlist";
import type { MarketState, Trade } from "./types";

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
      <MarketHeader dateLabel={dateLabel} />
      <main className="dashboard">
        <PortfolioOverview market={market} selectedStock={selectedStock} />
        {message && <div className={`notice ${message.includes("Bought") || message.includes("Sold") ? "success" : "error"}`} role="status">{message}</div>}
        <section className="workspace">
          <Watchlist
            stocks={market?.stocks ?? []}
            holdings={market?.holdings ?? {}}
            selectedSymbol={selectedSymbol}
            onSelect={setSelectedSymbol}
          />
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
            <TradeHistory trades={market?.transactions ?? []} stocks={market?.stocks ?? []} />
          </section>
        </section>
        <footer className="footer-note">A little game of what if. All prices and trades are simulated and have no real-world value.</footer>
      </main>
    </div>
  );
}
