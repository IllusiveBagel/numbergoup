import assert from "node:assert/strict";
import { test } from "node:test";
import { MarketEngine, STARTING_CASH, createInitialState, restoreState } from "../dist/src/market.js";

test("starts with a diversified market and the virtual cash balance", () => {
  const market = new MarketEngine();
  const state = market.snapshot();

  assert.equal(state.cash, STARTING_CASH);
  assert.equal(state.totalValue, STARTING_CASH);
  assert.equal(state.stocks.length, 8);
  assert.ok(state.stocks.every((stock) => stock.price > 0));
});

test("buying and selling shares updates cash, holdings, and activity", () => {
  const market = new MarketEngine(createInitialState(), () => 0.5);
  const stock = market.snapshot().stocks.find((item) => item.symbol === "AAPL");
  assert.ok(stock);

  const purchase = market.trade("AAPL", "buy", 2);
  assert.equal(purchase.total, Math.round(stock.price * 2 * 100) / 100);
  assert.equal(market.snapshot().holdings.AAPL, 2);
  assert.equal(market.snapshot().cash, STARTING_CASH - purchase.total);

  const sale = market.trade("AAPL", "sell", 1);
  assert.equal(sale.total, purchase.total / 2);
  assert.equal(market.snapshot().holdings.AAPL, 1);
  assert.equal(market.snapshot().transactions.length, 2);
});

test("rejects invalid orders without changing the account", () => {
  const market = new MarketEngine();
  assert.throws(() => market.trade("UNKNOWN", "buy", 1), /listed stock/);
  assert.throws(() => market.trade("AAPL", "buy", 0), /positive whole number/);
  assert.throws(() => market.trade("AAPL", "buy", 1.5), /positive whole number/);
  assert.throws(() => market.trade("AAPL", "buy", 1_000_000), /Not enough cash/);
  assert.throws(() => market.trade("AAPL", "sell", 1), /do not own enough/);
  assert.equal(market.snapshot().cash, STARTING_CASH);
  assert.deepEqual(market.snapshot().holdings, {});
});

test("continuous ticks move prices and retain a bounded price history", () => {
  const market = new MarketEngine(createInitialState(), () => 0.1);
  const before = market.snapshot().stocks[0];
  assert.ok(before);

  market.tick(Date.now() + 60_000);
  const after = market.snapshot().stocks[0];
  assert.ok(after);
  assert.notEqual(after.price, before.price);
  assert.equal(after.history.length, 2);
  assert.equal(market.persistedState().lastUpdated, after && market.snapshot().lastUpdated);

  const start = Date.now();
  for (let minute = 1; minute <= 65; minute += 1) market.tick(start + minute * 60_000);
  assert.equal(market.snapshot().stocks[0].history.length, 60);
});

test("restores only valid known symbols from persisted state", () => {
  const restored = restoreState({
    cash: 123,
    holdings: { AAPL: 3, UNKNOWN: 50, NVDA: -2 },
    prices: { AAPL: 99, UNKNOWN: 200, MSFT: -1 },
    history: { AAPL: [95, 99, "bad"] },
    transactions: [],
    lastUpdated: "2025-01-01T00:00:00.000Z",
  });

  assert.equal(restored.cash, 123);
  assert.deepEqual(restored.holdings, { AAPL: 3 });
  assert.equal(restored.prices.AAPL, 99);
  assert.equal(restored.prices.UNKNOWN, undefined);
  assert.deepEqual(restored.history.AAPL, [95, 99]);
});
