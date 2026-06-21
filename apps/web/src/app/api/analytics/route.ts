import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const userId = session.user.id;

  const [accounts, closedTrades] = await Promise.all([
    prisma.tradingAccount.findMany({
      where: { userId },
      select: { id: true, name: true, currency: true, initialBalance: true, balance: true },
    }),
    prisma.trade.findMany({
      where: { account: { userId }, status: "CLOSED" },
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
      orderBy: { exitTime: "asc" },
    }),
  ]);

  if (closedTrades.length === 0) {
    return NextResponse.json({ empty: true });
  }

  const primaryCurrency = accounts[0]?.currency ?? "USD";

  // --- Equity curve ---
  const initialBalance = accounts.reduce(
    (sum, a) => sum + Number(a.initialBalance),
    0
  );
  let runningBalance = initialBalance;
  const equityCurve = closedTrades.map((t) => {
    const pnl = Number(t.pnlMoney ?? 0);
    runningBalance += pnl;
    return {
      date: t.exitTime ? new Date(t.exitTime).toISOString().slice(0, 10) : null,
      balance: parseFloat(runningBalance.toFixed(2)),
      pnl: parseFloat(pnl.toFixed(2)),
    };
  });

  // --- Monthly P&L ---
  const monthlyMap = new Map<string, number>();
  for (const t of closedTrades) {
    if (!t.exitTime) continue;
    const key = new Date(t.exitTime).toISOString().slice(0, 7); // YYYY-MM
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + Number(t.pnlMoney ?? 0));
  }
  const monthlyPnl = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, pnl]) => ({ month, pnl: parseFloat(pnl.toFixed(2)) }));

  // --- Win rate by day of week ---
  const dayNames = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"];
  const dayMap = new Map<number, { wins: number; total: number }>();
  for (let i = 0; i < 7; i++) dayMap.set(i, { wins: 0, total: 0 });
  for (const t of closedTrades) {
    if (!t.exitTime) continue;
    const day = new Date(t.exitTime).getDay();
    const entry = dayMap.get(day)!;
    entry.total++;
    if (Number(t.pnlMoney ?? 0) > 0) entry.wins++;
  }
  const winRateByDay = Array.from(dayMap.entries()).map(([day, { wins, total }]) => ({
    day: dayNames[day],
    winRate: total > 0 ? parseFloat(((wins / total) * 100).toFixed(1)) : 0,
    total,
  }));

  // --- Win rate by instrument ---
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

  // --- Setup performance ---
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

  // --- P&L distribution (histogram) ---
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

  // --- Summary stats ---
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
  const avgRR =
    closedTrades
      .filter((t) => t.riskMoney && Number(t.riskMoney) > 0 && Number(t.pnlMoney ?? 0) > 0)
      .reduce((sum, t) => {
        return sum + Math.abs(Number(t.pnlMoney!) / Number(t.riskMoney!));
      }, 0) /
      (closedTrades.filter(
        (t) => t.riskMoney && Number(t.riskMoney) > 0 && Number(t.pnlMoney ?? 0) > 0
      ).length || 1);

  // Max drawdown
  let peak = initialBalance;
  let maxDrawdown = 0;
  let bal = initialBalance;
  for (const t of closedTrades) {
    bal += Number(t.pnlMoney ?? 0);
    if (bal > peak) peak = bal;
    const dd = ((peak - bal) / peak) * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  return NextResponse.json({
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
  });
}
