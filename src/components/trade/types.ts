export interface InstrumentInfo {
  symbol: string;
  description: string;
  digits: number;
  pipSize: number;
  contractSize: number;
  minLot: number;
  maxLot: number;
  spreadPips: number;
  commissionPerLot: number;
  base: string;
  quote: string;
}

export interface Metrics {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number | null;
  floatingPnl: number;
}

export interface AccountSummary {
  id: string;
  login: number;
  type: "DEMO" | "LIVE";
  currency: string;
  balance: number;
  leverage: number;
  metrics: Metrics;
  openPositions: number;
}

export interface PositionRow {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  volume: number;
  openPrice: number;
  currentPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  margin: number;
  commission: number;
  profit: number;
  openedAt: string;
}

export interface OrderRow {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT" | "STOP";
  volume: number;
  price: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  status: string;
  reason: string | null;
  createdAt: string;
}

export interface AccountState {
  account: Omit<AccountSummary, "metrics" | "openPositions">;
  positions: PositionRow[];
  orders: OrderRow[];
  metrics: Metrics;
}
