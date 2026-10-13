import { describe, expect, it } from "vitest";
import {
  accountMetrics,
  isFxMarketOpen,
  isValidLot,
  marginUSD,
  pnlUSD,
  quoteFromMid,
  rateToUSD,
  shouldTriggerPending,
  stopHit,
  validatePendingPrice,
  validateStops,
  type InstrumentSpec,
  type QuoteMap,
} from "./math";

const spec = (symbol: string, digits = 5, pipSize = 0.0001): InstrumentSpec => ({
  symbol,
  base: symbol.slice(0, 3),
  quote: symbol.slice(3),
  digits,
  pipSize,
  contractSize: 100_000,
});

const quotes: QuoteMap = {
  EURUSD: { bid: 1.1, ask: 1.1 },
  USDJPY: { bid: 150, ask: 150 },
  GBPUSD: { bid: 1.25, ask: 1.25 },
};

describe("pricing", () => {
  it("applies spread symmetrically around mid", () => {
    expect(quoteFromMid(1.1, 2, 0.0001, 5)).toEqual({ bid: 1.0999, ask: 1.1001 });
    expect(quoteFromMid(150, 2, 0.01, 3)).toEqual({ bid: 149.99, ask: 150.01 });
  });

  it("converts currencies to USD via direct and inverse pairs", () => {
    expect(rateToUSD("USD", quotes)).toBe(1);
    expect(rateToUSD("EUR", quotes)).toBeCloseTo(1.1);
    expect(rateToUSD("JPY", quotes)).toBeCloseTo(1 / 150);
    expect(rateToUSD("CHF", quotes)).toBeNull();
  });
});

describe("profit and margin", () => {
  it("computes USD P&L for USD-quoted pairs", () => {
    expect(pnlUSD(spec("EURUSD"), "BUY", 1, 1.1, 1.101, quotes)).toBeCloseTo(100);
    expect(pnlUSD(spec("EURUSD"), "SELL", 0.1, 1.1, 1.101, quotes)).toBeCloseTo(-10);
  });

  it("converts JPY P&L to USD", () => {
    // 1 lot USDJPY, +1.00 yen = 100,000 JPY = $666.67 at 150
    expect(pnlUSD(spec("USDJPY", 3, 0.01), "BUY", 1, 149, 150, quotes)).toBeCloseTo(666.67, 1);
  });

  it("computes margin in USD with leverage", () => {
    expect(marginUSD(spec("EURUSD"), 1, 100, quotes)).toBeCloseTo(1100);
    expect(marginUSD(spec("USDJPY", 3, 0.01), 1, 100, quotes)).toBeCloseTo(1000);
  });

  it("computes account metrics", () => {
    const m = accountMetrics(1000, [
      { margin: 100, profit: -50 },
      { margin: 100, profit: 20 },
    ]);
    expect(m).toEqual({ balance: 1000, equity: 970, margin: 200, freeMargin: 770, marginLevel: 485, floatingPnl: -30 });
    expect(accountMetrics(500, []).marginLevel).toBeNull();
  });
});

describe("order rules", () => {
  const q = { bid: 1.0999, ask: 1.1001 };

  it("triggers pending orders on the correct side of the book", () => {
    expect(shouldTriggerPending({ side: "BUY", type: "LIMIT", price: 1.1001 }, q)).toBe(true);
    expect(shouldTriggerPending({ side: "BUY", type: "LIMIT", price: 1.1 }, q)).toBe(false);
    expect(shouldTriggerPending({ side: "BUY", type: "STOP", price: 1.1002 }, q)).toBe(false);
    expect(shouldTriggerPending({ side: "SELL", type: "LIMIT", price: 1.0999 }, q)).toBe(true);
    expect(shouldTriggerPending({ side: "SELL", type: "STOP", price: 1.0999 }, q)).toBe(true);
    expect(shouldTriggerPending({ side: "SELL", type: "STOP", price: 1.0998 }, q)).toBe(false);
  });

  it("detects stop loss and take profit hits using the closing price", () => {
    expect(stopHit({ side: "BUY", stopLoss: 1.0999, takeProfit: null }, q)).toBe("SL");
    expect(stopHit({ side: "BUY", stopLoss: null, takeProfit: 1.0999 }, q)).toBe("TP");
    expect(stopHit({ side: "SELL", stopLoss: 1.1001, takeProfit: null }, q)).toBe("SL");
    expect(stopHit({ side: "SELL", stopLoss: null, takeProfit: 1.1001 }, q)).toBe("TP");
    expect(stopHit({ side: "BUY", stopLoss: 1.09, takeProfit: 1.2 }, q)).toBeNull();
  });

  it("validates stop placement", () => {
    expect(validateStops("BUY", 1.1, 1.09, 1.12)).toBeNull();
    expect(validateStops("BUY", 1.1, 1.11, null)).toMatch(/Stop loss/);
    expect(validateStops("SELL", 1.1, 1.11, 1.09)).toBeNull();
    expect(validateStops("SELL", 1.1, null, 1.11)).toMatch(/Take profit/);
  });

  it("validates pending prices", () => {
    expect(validatePendingPrice("BUY", "LIMIT", 1.09, q)).toBeNull();
    expect(validatePendingPrice("BUY", "LIMIT", 1.2, q)).not.toBeNull();
    expect(validatePendingPrice("SELL", "STOP", 1.09, q)).toBeNull();
    expect(validatePendingPrice("SELL", "STOP", 1.2, q)).not.toBeNull();
  });

  it("validates lot sizes", () => {
    expect(isValidLot(0.01, 0.01, 50)).toBe(true);
    expect(isValidLot(0.15, 0.01, 50)).toBe(true);
    expect(isValidLot(0.015, 0.01, 50)).toBe(false);
    expect(isValidLot(51, 0.01, 50)).toBe(false);
  });

  it("knows FX market hours", () => {
    expect(isFxMarketOpen(new Date("2026-10-13T12:00:00Z"))).toBe(true); // Tuesday
    expect(isFxMarketOpen(new Date("2026-10-17T12:00:00Z"))).toBe(false); // Saturday
    expect(isFxMarketOpen(new Date("2026-10-16T22:30:00Z"))).toBe(false); // Friday after close
    expect(isFxMarketOpen(new Date("2026-10-18T22:30:00Z"))).toBe(true); // Sunday after open
  });
});
