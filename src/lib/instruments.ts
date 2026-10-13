export interface InstrumentMeta {
  symbol: string;
  base: string;
  quote: string;
  description: string;
  yahoo: string;
  digits: number;
  pipSize: number;
  spreadPips: number;
  seedPrice: number;
}

export const INSTRUMENTS: InstrumentMeta[] = [
  { symbol: "EURUSD", base: "EUR", quote: "USD", description: "Euro vs US Dollar", yahoo: "EURUSD=X", digits: 5, pipSize: 0.0001, spreadPips: 1.2, seedPrice: 1.1 },
  { symbol: "GBPUSD", base: "GBP", quote: "USD", description: "British Pound vs US Dollar", yahoo: "GBPUSD=X", digits: 5, pipSize: 0.0001, spreadPips: 1.5, seedPrice: 1.3 },
  { symbol: "USDJPY", base: "USD", quote: "JPY", description: "US Dollar vs Japanese Yen", yahoo: "USDJPY=X", digits: 3, pipSize: 0.01, spreadPips: 1.3, seedPrice: 150 },
  { symbol: "USDCHF", base: "USD", quote: "CHF", description: "US Dollar vs Swiss Franc", yahoo: "USDCHF=X", digits: 5, pipSize: 0.0001, spreadPips: 1.6, seedPrice: 0.85 },
  { symbol: "AUDUSD", base: "AUD", quote: "USD", description: "Australian Dollar vs US Dollar", yahoo: "AUDUSD=X", digits: 5, pipSize: 0.0001, spreadPips: 1.4, seedPrice: 0.65 },
  { symbol: "USDCAD", base: "USD", quote: "CAD", description: "US Dollar vs Canadian Dollar", yahoo: "USDCAD=X", digits: 5, pipSize: 0.0001, spreadPips: 1.8, seedPrice: 1.37 },
  { symbol: "NZDUSD", base: "NZD", quote: "USD", description: "New Zealand Dollar vs US Dollar", yahoo: "NZDUSD=X", digits: 5, pipSize: 0.0001, spreadPips: 1.9, seedPrice: 0.6 },
  { symbol: "EURGBP", base: "EUR", quote: "GBP", description: "Euro vs British Pound", yahoo: "EURGBP=X", digits: 5, pipSize: 0.0001, spreadPips: 1.5, seedPrice: 0.85 },
  { symbol: "EURJPY", base: "EUR", quote: "JPY", description: "Euro vs Japanese Yen", yahoo: "EURJPY=X", digits: 3, pipSize: 0.01, spreadPips: 1.9, seedPrice: 165 },
  { symbol: "GBPJPY", base: "GBP", quote: "JPY", description: "British Pound vs Japanese Yen", yahoo: "GBPJPY=X", digits: 3, pipSize: 0.01, spreadPips: 2.5, seedPrice: 195 },
];

export const INSTRUMENT_META: Record<string, InstrumentMeta> = Object.fromEntries(
  INSTRUMENTS.map((i) => [i.symbol, i]),
);

export const CONTRACT_SIZE = 100_000;
export const MARGIN_CALL_LEVEL = 100;
export const STOP_OUT_LEVEL = 50;
export const LEVERAGE_OPTIONS = [10, 30, 50, 100, 200, 500];
