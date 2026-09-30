export const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export const shortMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

export function tone(value: number): string {
  return value >= 0 ? "positive" : "negative";
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}
