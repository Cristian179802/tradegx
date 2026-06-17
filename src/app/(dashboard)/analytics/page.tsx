import type { Metadata } from "next";
import Link from "next/link";
import { FileDown } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "./analytics-client";

export const metadata: Metadata = { title: "Analiză Performanță" };

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { prisma } = await import("@/lib/prisma");
  const userId = session.user.id;

  const [accounts, closedTrades] = await Promise.all([
    prisma.tradingAccount.findMany({
      where: { userId },
      select: { id: true, name: true, currency: true, initialBalance: true, balance: true },
    }),
    prisma.trade.findMany({
      where: {
        account: { userId },
        OR: [{ status: "CLOSED" }, { pnlMoney: { not: null } }],
      },
      select: {
        id: true,
        symbol: true,
        direction: true,
        instrumentType: true,
        setupType: true,
        killzone: true,
        pnlMoney: true,
        pnlPercent: true,
        riskMoney: true,
        commission: true,
        swap: true,
        durationMinutes: true,
        entryTime: true,
        exitTime: true,
        lotSize: true,
        entryPrice: true,
        exitPrice: true,
        account: { select: { currency: true } },
      },
      orderBy: { entryTime: "asc" },
    }),
  ]);

  if (closedTrades.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Analiză Performanță</h1>
            <p className="text-sm text-zinc-500 mt-1">Statistici detaliate ale tranzacțiilor tale</p>
          </div>
        </div>
        <AnalyticsClient data={{ empty: true }} />
      </div>
    );
  }

  const primaryCurrency = accounts[0]?.currency ?? "USD";
  const initialBalance = accounts.reduce((sum, a) => sum + Number(a.initialBalance), 0);

  // Helper: use exitTime when available, fall back to entryTime (MT5 imports may lack exitTime)
  const tradeDate = (t: { exitTime: Date | null; entryTime: Date }) =>
    t.exitTime ?? t.entryTime;

  // Equity curve
  let runningBalance = initialBalance;
  const equityCurve = closedTrades.map((t) => {
    const pnl = Number(t.pnlMoney ?? 0);
    runningBalance += pnl;
    return {
      date: new Date(tradeDate(t)).toISOString().slice(0, 10),
      balance: parseFloat(runningBalance.toFixed(2)),
      pnl: parseFloat(pnl.toFixed(2)),
    };
  });

  // Monthly P&L
  const monthlyMap = new Map<string, number>();
  for (const t of closedTrades) {
    const key = new Date(tradeDate(t)).toISOString().slice(0, 7);
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + Number(t.pnlMoney ?? 0));
  }
  const monthlyPnl = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, pnl]) => ({ month, pnl: parseFloat(pnl.toFixed(2)) }));

  // Win rate by day
  const dayNames = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"];
  const dayMap = new Map<number, { wins: number; total: number }>();
  for (let i = 0; i < 7; i++) dayMap.set(i, { wins: 0, total: 0 });
  for (const t of closedTrades) {
    const day = new Date(tradeDate(t)).getDay();
    const entry = dayMap.get(day)!;
    entry.total++;
    if (Number(t.pnlMoney ?? 0) > 0) entry.wins++;
  }
  const winRateByDay = Array.from(dayMap.entries()).map(([day, { wins, total }]) => ({
    day: dayNames[day],
    winRate: total > 0 ? parseFloat(((wins / total) * 100).toFixed(1)) : 0,
    total,
  }));

  // Win rate by instrument
  const instrMap = new Map<string, { wins: number; total: number; pnl: number }>();
  for (const t of closedTrades) {
    const key = t.instrumentType;
    const entry = instrMap.get(key) ?? { wins: 0, total: 0, pnl: 0 };
    entry.total++;
    const pnl = Number(t.pnlMoney ?? 0);
    entry.pnl += pnl;
    if (pnl > 0) entry.wins++;
    instrMap.set(key, entry);
  }
  const winRateByInstrument = Array.from(instrMap.entries()).map(([instrument, { wins, total, pnl }]) => ({
    instrument,
    winRate: parseFloat(((wins / total) * 100).toFixed(1)),
    total,
    pnl: parseFloat(pnl.toFixed(2)),
  }));

  // Setup performance
  const setupMap = new Map<string, { wins: number; total: number; pnl: number }>();
  for (const t of closedTrades) {
    if (!t.setupType) continue;
    const key = t.setupType;
    const entry = setupMap.get(key) ?? { wins: 0, total: 0, pnl: 0 };
    entry.total++;
    const pnl = Number(t.pnlMoney ?? 0);
    entry.pnl += pnl;
    if (pnl > 0) entry.wins++;
    setupMap.set(key, entry);
  }
  const setupPerformance = Array.from(setupMap.entries())
    .map(([setup, { wins, total, pnl }]) => ({
      setup,
      winRate: parseFloat(((wins / total) * 100).toFixed(1)),
      total,
      pnl: parseFloat(pnl.toFixed(2)),
      avgPnl: parseFloat((pnl / total).toFixed(2)),
    }))
    .sort((a, b) => b.pnl - a.pnl);

  // P&L distribution
  const pnlValues = closedTrades.map((t) => Number(t.pnlMoney ?? 0));
  const maxAbs = Math.max(...pnlValues.map(Math.abs), 1);
  const bucketSize = Math.ceil(maxAbs / 5 / 10) * 10 || 10;
  const bucketMap = new Map<number, number>();
  for (const pnl of pnlValues) {
    const bucket = Math.floor(pnl / bucketSize) * bucketSize;
    bucketMap.set(bucket, (bucketMap.get(bucket) ?? 0) + 1);
  }
  const pnlDistribution = Array.from(bucketMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([bucket, count]) => ({
      range: `${bucket >= 0 ? "+" : ""}${bucket}`,
      count,
      positive: bucket >= 0,
    }));

  // Summary
  const wins = pnlValues.filter((p) => p > 0);
  const losses = pnlValues.filter((p) => p < 0);
  const totalPnl = pnlValues.reduce((s, p) => s + p, 0);
  const grossProfit = wins.reduce((s, p) => s + p, 0);
  const grossLoss = Math.abs(losses.reduce((s, p) => s + p, 0));
  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : null;
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
  const bestTrade = pnlValues.length > 0 ? Math.max(...pnlValues) : 0;
  const worstTrade = pnlValues.length > 0 ? Math.min(...pnlValues) : 0;
  const rrTrades = closedTrades.filter(
    (t) => t.riskMoney && Number(t.riskMoney) > 0 && Number(t.pnlMoney ?? 0) > 0
  );
  const avgRR =
    rrTrades.length > 0
      ? rrTrades.reduce((sum, t) => sum + Math.abs(Number(t.pnlMoney!) / Number(t.riskMoney!)), 0) / rrTrades.length
      : 0;
  let peak = initialBalance;
  let maxDrawdown = 0;
  let bal = initialBalance;
  for (const t of closedTrades) {
    bal += Number(t.pnlMoney ?? 0);
    if (bal > peak) peak = bal;
    const dd = peak > 0 ? ((peak - bal) / peak) * 100 : 0;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  const data = {
    empty: false,
    currency: primaryCurrency,
    summary: {
      totalTrades: closedTrades.length,
      winRate: parseFloat(winRate.toFixed(1)),
      totalPnl: parseFloat(totalPnl.toFixed(2)),
      profitFactor: profitFactor !== null ? parseFloat(profitFactor.toFixed(2)) : null,
      avgWin: parseFloat(avgWin.toFixed(2)),
      avgLoss: parseFloat(avgLoss.toFixed(2)),
      bestTrade: parseFloat(bestTrade.toFixed(2)),
      worstTrade: parseFloat(worstTrade.toFixed(2)),
      avgRR: parseFloat(avgRR.toFixed(2)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    },
    equityCurve,
    monthlyPnl,
    winRateByDay,
    winRateByInstrument,
    setupPerformance,
    pnlDistribution,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Analiză Performanță</h1>
          <p className="text-sm text-zinc-500 mt-1">Statistici detaliate ale tranzacțiilor tale</p>
        </div>
        <Link
          href="/report"
          target="_blank"
          className="shrink-0 flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 hover:border-indigo-500/50 text-zinc-200 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
        >
          <FileDown className="w-4 h-4 text-indigo-400" />
          Export PDF
        </Link>
      </div>
      <AnalyticsClient data={data} />
    </div>
  );
}
