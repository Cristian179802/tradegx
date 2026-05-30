import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = { title: "Panou de Control" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const [
    accounts,
    tradeStats,
    wins,
    grossProfit,
    grossLoss,
    recentTrades,
    pairGroups,
    dailyTrades,
  ] = await Promise.all([
    // Trading accounts
    prisma.tradingAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),

    // Overall stats — CLOSED or has pnlMoney (covers MT5 imports)
    prisma.trade.aggregate({
      where: { account: { userId }, OR: [{ status: "CLOSED" }, { pnlMoney: { not: null } }] },
      _count: { _all: true },
      _sum: { pnlMoney: true },
    }),

    // Win count
    prisma.trade.count({
      where: { account: { userId }, OR: [{ status: "CLOSED" }, { pnlMoney: { not: null } }], pnlMoney: { gt: 0 } },
    }),

    // Gross profit
    prisma.trade.aggregate({
      where: { account: { userId }, OR: [{ status: "CLOSED" }, { pnlMoney: { not: null } }], pnlMoney: { gt: 0 } },
      _sum: { pnlMoney: true },
    }),

    // Gross loss
    prisma.trade.aggregate({
      where: { account: { userId }, OR: [{ status: "CLOSED" }, { pnlMoney: { not: null } }], pnlMoney: { lt: 0 } },
      _sum: { pnlMoney: true },
    }),

    // Last 30 settled trades (CLOSED or has pnlMoney)
    prisma.trade.findMany({
      where: { account: { userId }, OR: [{ status: "CLOSED" }, { pnlMoney: { not: null } }] },
      orderBy: { entryTime: "desc" },
      take: 30,
      select: {
        id: true,
        symbol: true,
        direction: true,
        lotSize: true,
        pnlMoney: true,
        pnlPips: true,
        entryTime: true,
        exitTime: true,
      },
    }),

    // Top pairs by volume (group by symbol)
    prisma.trade.groupBy({
      by: ["symbol"],
      where: { account: { userId }, OR: [{ status: "CLOSED" }, { pnlMoney: { not: null } }] },
      _count: { _all: true },
      _sum: { pnlMoney: true },
      orderBy: { _count: { symbol: "desc" } },
      take: 5,
    }),

    // Daily PnL for equity curve (last 30 days)
    prisma.trade.findMany({
      where: {
        account: { userId },
        OR: [{ status: "CLOSED" }, { pnlMoney: { not: null } }],
        entryTime: { gte: thirtyDaysAgo },
      },
      orderBy: { entryTime: "asc" },
      select: { exitTime: true, entryTime: true, pnlMoney: true },
    }),

  ]);

  const totalTrades = tradeStats._count._all;
  const netPnl = Number(tradeStats._sum.pnlMoney ?? 0);
  const losses = totalTrades - wins;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : null;
  const gp = Number(grossProfit._sum.pnlMoney ?? 0);
  const gl = Math.abs(Number(grossLoss._sum.pnlMoney ?? 0));
  const profitFactor = gl > 0 ? gp / gl : null;
  const primaryCurrency = accounts[0]?.currency ?? "USD";

  // Best / worst / avg trades
  const pnlValues = recentTrades.map((t) => Number(t.pnlMoney ?? 0));
  const winAmounts = pnlValues.filter((p) => p > 0);
  const lossAmounts = pnlValues.filter((p) => p < 0);
  const bestTrade = winAmounts.length > 0 ? Math.max(...winAmounts) : 0;
  const worstTrade = lossAmounts.length > 0 ? Math.min(...lossAmounts) : 0;
  const avgWin = winAmounts.length > 0 ? winAmounts.reduce((s, p) => s + p, 0) / winAmounts.length : 0;
  const avgLoss = lossAmounts.length > 0 ? Math.abs(lossAmounts.reduce((s, p) => s + p, 0) / lossAmounts.length) : 0;

  // Equity curve: construiește harta zilnică ÎNAINTE de drawdown (e folosită la ambele)
  const dailyMap = new Map<string, number>();
  for (const t of dailyTrades) {
    const dateSource = t.exitTime ?? t.entryTime;
    if (!dateSource) continue;
    const day = new Date(dateSource).toISOString().slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + Number(t.pnlMoney ?? 0));
  }

  // Max drawdown calculat din toate zilele disponibile (mai precis decât per-trade)
  let peak = 0;
  let runBal = 0;
  let maxDD = 0;
  const allDaysSorted = Array.from(dailyMap.entries()).sort(([a], [b]) => a.localeCompare(b));
  for (const [, dayPnl] of allDaysSorted) {
    runBal += dayPnl;
    if (runBal > peak) peak = runBal;
    const dd = peak > 0 ? ((peak - runBal) / peak) * 100 : 0;
    if (dd > maxDD) maxDD = dd;
  }

  // Sparkline data — ultimele 10 zile cu date
  const sortedDays = allDaysSorted.slice(-10);
  const sparkPnl = sortedDays.map(([, v]) => v);

  // Pair performance
  const pairPerformance = pairGroups.map((g) => ({
    symbol: g.symbol,
    pnl: Number(g._sum.pnlMoney ?? 0),
    trades: g._count._all,
  }));

  // Sparklines reale — evoluție cumulativă per zi (ultimele 10 zile cu date)
  const cumulativePnl: number[] = [];
  let cum = 0;
  for (const [, v] of sortedDays) { cum += v; cumulativePnl.push(cum); }

  // Win-rate zilnic cumulativ (aproximat din recentTrades sortate pe zi)
  const dailyWinRate: number[] = sortedDays.map(([day]) => {
    const dayTrades = recentTrades.filter((t) => {
      const d = new Date(t.exitTime ?? t.entryTime).toISOString().slice(0, 10);
      return d <= day;
    });
    if (dayTrades.length === 0) return winRate ?? 0;
    const w = dayTrades.filter((t) => Number(t.pnlMoney ?? 0) > 0).length;
    return (w / dayTrades.length) * 100;
  });

  // Drawdown cumulativ pe zi
  const dailyDD: number[] = [];
  let ddPeak = 0; let ddBal = 0;
  for (const [, v] of sortedDays) {
    ddBal += v;
    if (ddBal > ddPeak) ddPeak = ddBal;
    dailyDD.push(ddPeak > 0 ? ((ddPeak - ddBal) / ddPeak) * 100 : 0);
  }

  const sparklines = {
    pnl:          cumulativePnl.length >= 2 ? cumulativePnl : [0, 0],
    winRate:      dailyWinRate.length  >= 2 ? dailyWinRate  : [winRate ?? 0, winRate ?? 0],
    profitFactor: sparkPnl.length      >= 2 ? sparkPnl      : [0, 0],
    drawdown:     dailyDD.length       >= 2 ? dailyDD       : [0, 0],
    trades:       sortedDays.map((_, i) => i + 1),
  };

  return (
    <DashboardClient
      data={{
        userName: session.user.name?.split(" ")[0] ?? "Trader",
        totalTrades,
        netPnl,
        winRate,
        profitFactor,
        maxDrawdown: maxDD > 0 ? maxDD : null,
        wins,
        losses,
        bestTrade,
        worstTrade,
        avgWin,
        avgLoss,
        currency: primaryCurrency,
        recentTrades: recentTrades.slice(0, 8).map((t) => ({
          id: t.id,
          symbol: t.symbol,
          direction: t.direction,
          lotSize: Number(t.lotSize),
          pnlMoney: t.pnlMoney !== null ? Number(t.pnlMoney) : null,
          pnlPips: t.pnlPips !== null ? Number(t.pnlPips) : null,
          entryTime: new Date(t.entryTime).toISOString(),
          exitTime: t.exitTime ? new Date(t.exitTime).toISOString() : null,
        })),
        pairPerformance,
        sparklines,
      }}
    />
  );
}
