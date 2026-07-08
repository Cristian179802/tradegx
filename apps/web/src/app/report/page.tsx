import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ReportClient } from "./report-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reportPage");
  return { title: t("metaTitle") };
}

const SETUP_LABEL: Record<string, string> = {
  ORDER_BLOCK: "Order Block", FAIR_VALUE_GAP: "Fair Value Gap", LIQUIDITY_SWEEP: "Liquidity Sweep",
  BOS: "Break of Structure", CHOCH: "Change of Character", BREAKER: "Breaker",
  MITIGATION: "Mitigation", REJECTION: "Rejection", TREND_FOLLOW: "Trend Follow",
  SCALP: "Scalp",
};

export default async function ReportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const t = await getTranslations("reportPage");

  const INSTRUMENT_LABEL: Record<string, string> = {
    FOREX: t("instrForex"), CRYPTO: t("instrCrypto"), METALS: t("instrMetals"), INDICES: t("instrIndices"),
    COMMODITIES: t("instrCommodities"), STOCKS: t("instrStocks"), CFD: t("instrCfd"),
  };

  const userId = session.user.id;

  const [accounts, trades] = await Promise.all([
    prisma.tradingAccount.findMany({
      where: { userId },
      select: { currency: true, initialBalance: true, balance: true },
    }),
    prisma.trade.findMany({
      where: { account: { userId }, OR: [{ status: "CLOSED" }, { pnlMoney: { not: null } }] },
      select: {
        symbol: true, instrumentType: true, setupType: true,
        pnlMoney: true, riskMoney: true, entryTime: true, exitTime: true,
      },
      orderBy: { entryTime: "asc" },
    }),
  ]);

  const currency = accounts[0]?.currency ?? "USD";
  const initialBalance = accounts.reduce((s, a) => s + Number(a.initialBalance), 0);
  const tradeDate = (t: { exitTime: Date | null; entryTime: Date }) => t.exitTime ?? t.entryTime;

  const pnlValues = trades.map((t) => Number(t.pnlMoney ?? 0));
  const wins = pnlValues.filter((p) => p > 0);
  const losses = pnlValues.filter((p) => p < 0);
  const totalPnl = pnlValues.reduce((s, p) => s + p, 0);
  const grossProfit = wins.reduce((s, p) => s + p, 0);
  const grossLoss = Math.abs(losses.reduce((s, p) => s + p, 0));
  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : null;
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const bestTrade = pnlValues.length > 0 ? Math.max(...pnlValues) : 0;
  const worstTrade = pnlValues.length > 0 ? Math.min(...pnlValues) : 0;

  const rrTrades = trades.filter((t) => t.riskMoney && Number(t.riskMoney) > 0 && Number(t.pnlMoney ?? 0) > 0);
  const avgRR = rrTrades.length > 0
    ? rrTrades.reduce((s, t) => s + Math.abs(Number(t.pnlMoney!) / Number(t.riskMoney!)), 0) / rrTrades.length
    : 0;

  let peak = initialBalance, bal = initialBalance, maxDrawdown = 0;
  for (const t of trades) {
    bal += Number(t.pnlMoney ?? 0);
    if (bal > peak) peak = bal;
    const dd = peak > 0 ? ((peak - bal) / peak) * 100 : 0;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // P&L lunar
  const monthlyMap = new Map<string, { pnl: number; trades: number }>();
  for (const t of trades) {
    const key = new Date(tradeDate(t)).toISOString().slice(0, 7);
    const e = monthlyMap.get(key) ?? { pnl: 0, trades: 0 };
    e.pnl += Number(t.pnlMoney ?? 0);
    e.trades++;
    monthlyMap.set(key, e);
  }
  const monthly = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, pnl: +v.pnl.toFixed(2), trades: v.trades }));

  // Performanță pe instrument
  const instrMap = new Map<string, { wins: number; total: number; pnl: number }>();
  for (const t of trades) {
    const e = instrMap.get(t.instrumentType) ?? { wins: 0, total: 0, pnl: 0 };
    e.total++;
    const pnl = Number(t.pnlMoney ?? 0);
    e.pnl += pnl;
    if (pnl > 0) e.wins++;
    instrMap.set(t.instrumentType, e);
  }
  const byInstrument = Array.from(instrMap.entries())
    .map(([k, v]) => ({
      label: INSTRUMENT_LABEL[k] ?? k,
      winRate: +((v.wins / v.total) * 100).toFixed(1),
      total: v.total, pnl: +v.pnl.toFixed(2),
    }))
    .sort((a, b) => b.pnl - a.pnl);

  // Performanță pe setup
  const setupMap = new Map<string, { wins: number; total: number; pnl: number }>();
  for (const t of trades) {
    if (!t.setupType) continue;
    const e = setupMap.get(t.setupType) ?? { wins: 0, total: 0, pnl: 0 };
    e.total++;
    const pnl = Number(t.pnlMoney ?? 0);
    e.pnl += pnl;
    if (pnl > 0) e.wins++;
    setupMap.set(t.setupType, e);
  }
  const bySetup = Array.from(setupMap.entries())
    .map(([k, v]) => ({
      label: k === "OTHER" ? t("setupOther") : (SETUP_LABEL[k] ?? k),
      winRate: +((v.wins / v.total) * 100).toFixed(1),
      total: v.total, pnl: +v.pnl.toFixed(2),
    }))
    .sort((a, b) => b.pnl - a.pnl);

  return (
    <ReportClient
      data={{
        userName: session.user.name ?? "Trader",
        currency,
        empty: trades.length === 0,
        summary: {
          totalTrades: trades.length,
          winRate: +winRate.toFixed(1),
          totalPnl: +totalPnl.toFixed(2),
          profitFactor: profitFactor !== null ? +profitFactor.toFixed(2) : null,
          avgWin: +avgWin.toFixed(2),
          avgLoss: +avgLoss.toFixed(2),
          bestTrade: +bestTrade.toFixed(2),
          worstTrade: +worstTrade.toFixed(2),
          avgRR: +avgRR.toFixed(2),
          maxDrawdown: +maxDrawdown.toFixed(2),
        },
        monthly,
        byInstrument,
        bySetup,
      }}
    />
  );
}
