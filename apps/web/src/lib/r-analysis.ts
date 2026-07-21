import { prisma } from "@/lib/prisma";

// ── Analiză R-multiple (instant, doar din DB) ────────────────────────────────
// R = pnl / risc înregistrat pe fiecare tranzacție. Baza managementului de risc.

export interface RBucket { label: string; from: number; to: number; count: number; kind: "loss" | "win" }
export interface RAnalysis {
  empty: boolean;
  withR: number;         // câte tranzacții au risc înregistrat
  total: number;
  expectancyR: number | null;
  avgWinR: number | null;
  avgLossR: number | null;
  bestR: number | null;
  worstR: number | null;
  buckets: RBucket[];
  currency: string;
}

const BUCKET_DEFS: { label: string; from: number; to: number; kind: "loss" | "win" }[] = [
  { label: "≤ -2R", from: -Infinity, to: -2, kind: "loss" },
  { label: "-2R", from: -2, to: -1, kind: "loss" },
  { label: "-1R", from: -1, to: 0, kind: "loss" },
  { label: "+1R", from: 0, to: 1, kind: "win" },
  { label: "+2R", from: 1, to: 2, kind: "win" },
  { label: "+3R", from: 2, to: 3, kind: "win" },
  { label: "≥ +3R", from: 3, to: Infinity, kind: "win" },
];

export async function getRAnalysis(userId: string): Promise<RAnalysis> {
  const account = await prisma.tradingAccount.findFirst({ where: { userId }, select: { currency: true } });
  const trades = await prisma.trade.findMany({
    where: { account: { userId }, OR: [{ status: "CLOSED" }, { pnlMoney: { not: null } }] },
    select: { pnlMoney: true, riskMoney: true },
  });

  const currency = account?.currency ?? "USD";
  const rVals: number[] = [];
  for (const t of trades) {
    const risk = Number(t.riskMoney ?? 0);
    if (risk > 0) rVals.push(Number(t.pnlMoney ?? 0) / risk);
  }

  if (rVals.length === 0) {
    return { empty: true, withR: 0, total: trades.length, expectancyR: null, avgWinR: null, avgLossR: null, bestR: null, worstR: null, buckets: [], currency };
  }

  const wins = rVals.filter((r) => r > 0);
  const losses = rVals.filter((r) => r <= 0);
  const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);

  const buckets: RBucket[] = BUCKET_DEFS.map((b) => ({
    ...b,
    count: rVals.filter((r) => r > b.from && r <= b.to).length,
  }));

  return {
    empty: false,
    withR: rVals.length,
    total: trades.length,
    expectancyR: +(avg(rVals) ?? 0).toFixed(3),
    avgWinR: wins.length ? +avg(wins)!.toFixed(2) : null,
    avgLossR: losses.length ? +avg(losses)!.toFixed(2) : null,
    bestR: +Math.max(...rVals).toFixed(2),
    worstR: +Math.min(...rVals).toFixed(2),
    buckets,
    currency,
  };
}
