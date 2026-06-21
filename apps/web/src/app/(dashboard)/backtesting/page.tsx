import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BacktestingClient } from "./backtesting-client";

export const metadata: Metadata = { title: "Backtesting" };

export default async function BacktestingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [strategies, recentBacktests] = await Promise.all([
    prisma.strategy.findMany({
      where: { userId: session.user.id, isActive: true },
      include: {
        _count: { select: { backtests: true } },
        backtests: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, status: true, netPnl: true, winRate: true, totalTrades: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),

    prisma.backtest.findMany({
      where: { strategy: { userId: session.user.id } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        symbol: true,
        timeframe: true,
        startDate: true,
        endDate: true,
        status: true,
        totalTrades: true,
        winRate: true,
        netPnl: true,
        profitFactor: true,
        maxDrawdownPct: true,
        sharpeRatio: true,
        initialBalance: true,
        createdAt: true,
        strategy: { select: { name: true, type: true, color: true } },
      },
    }),
  ]);

  const strategiesData = strategies.map((s) => ({
    ...s,
    backtests: s.backtests.map((b) => ({
      ...b,
      netPnl:   b.netPnl?.toString() ?? null,
      winRate:  b.winRate?.toString() ?? null,
      createdAt: b.createdAt.toISOString(),
    })),
  }));

  const backtestsData = recentBacktests.map((b) => ({
    ...b,
    startDate:      b.startDate.toISOString(),
    endDate:        b.endDate.toISOString(),
    createdAt:      b.createdAt.toISOString(),
    winRate:        b.winRate?.toString() ?? null,
    netPnl:         b.netPnl?.toString() ?? null,
    profitFactor:   b.profitFactor?.toString() ?? null,
    maxDrawdownPct: b.maxDrawdownPct?.toString() ?? null,
    sharpeRatio:    b.sharpeRatio?.toString() ?? null,
    initialBalance: b.initialBalance?.toString() ?? null,
  }));

  return (
    <BacktestingClient
      strategies={strategiesData}
      recentBacktests={backtestsData}
    />
  );
}
