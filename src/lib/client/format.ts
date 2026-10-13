export const usd = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export const signedUsd = (n: number) => `${n >= 0 ? "+" : "-"}${usd(Math.abs(n))}`;

export const price = (n: number | null | undefined, digits: number) => (n == null ? "—" : n.toFixed(digits));

export const pnlClass = (n: number) => (n > 0 ? "text-up" : n < 0 ? "text-down" : "text-slate-300");

export const dateTime = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleString(undefined, { dateStyle: "short", timeStyle: "medium" }) : "—";

export const digitsFor = (symbol: string) => (symbol.endsWith("JPY") ? 3 : 5);
