// @tradegx/core — logică pură partajată între web și mobile.
// SINGURA sursă de adevăr pentru risc, SMC și tipuri shared.

export * from "./risk";
export * from "./metrics";
export * from "./smc";
export * from "./smc-detect";
export * from "./auth";

// Tipuri de domeniu partajate (aliniate cu Prisma, fără a importa @prisma/client)
export type TradeDirection = "BUY" | "SELL";
export type TradeStatus = "OPEN" | "CLOSED" | "CANCELLED";
export type AccountType = "DEMO" | "CHALLENGE" | "LIVE";

export interface SharedTrade {
  id: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number | null;
  lotSize: number;
  stopLoss: number | null;
  takeProfit: number | null;
  pnlMoney: number | null;
  status: TradeStatus;
  entryTime: string;
  exitTime: string | null;
}
