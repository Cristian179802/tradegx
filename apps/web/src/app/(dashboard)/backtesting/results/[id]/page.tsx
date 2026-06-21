import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ResultsClient } from "./results-client";

export const metadata: Metadata = { title: "Rezultate Backtest" };

export default async function BacktestResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const backtest = await prisma.backtest.findFirst({
    where: { id, strategy: { userId: session.user.id } },
    include: {
      strategy: { select: { id: true, name: true, type: true, color: true, rules: true } },
      trades: { orderBy: { entryTime: "asc" }, take: 1000 },
    },
  });

  if (!backtest) notFound();

  // Serialize all Decimal / Date fields
  const data = {
    id: backtest.id,
    symbol: backtest.symbol,
    timeframe: backtest.timeframe,
    startDate: backtest.startDate.toISOString(),
    endDate: backtest.endDate.toISOString(),
    createdAt: backtest.createdAt.toISOString(),
    status: backtest.status,
    errorMessage: backtest.errorMessage,
    totalBars: backtest.totalBars,

    // numeric metrics — all strings (Decimal serialization)
    totalTrades: backtest.totalTrades,
    winRate: backtest.winRate?.toString() ?? null,
    profitFactor: backtest.profitFactor?.toString() ?? null,
    maxDrawdown: backtest.maxDrawdown?.toString() ?? null,
    maxDrawdownPct: backtest.maxDrawdownPct?.toString() ?? null,
    sharpeRatio: backtest.sharpeRatio?.toString() ?? null,
    sortinoRatio: backtest.sortinoRatio?.toString() ?? null,
    netPnl: backtest.netPnl?.toString() ?? null,
    expectancy: backtest.expectancy?.toString() ?? null,
    avgRR: backtest.avgRR?.toString() ?? null,
    initialBalance: backtest.initialBalance?.toString() ?? null,
    finalBalance: backtest.finalBalance?.toString() ?? null,
    riskPerTrade: backtest.riskPerTrade?.toString() ?? null,
    commission: backtest.commission.toString(),
    spread: backtest.spread.toString(),

    // JSON fields
    equityCurve: (backtest.equityCurve as { date: string; balance?: number; equity?: number; pnl?: number }[] | null)
      ?.map(p => ({ date: p.date, balance: p.balance ?? p.equity ?? 0, pnl: p.pnl ?? 0 })) ?? null,
    monthlyPnl: backtest.monthlyPnl as { month: string; pnl: number }[] | null,

    strategy: backtest.strategy,

    trades: backtest.trades.map((t) => ({
      id: t.id,
      direction: t.direction,
      entryTime: t.entryTime.toISOString(),
      exitTime: t.exitTime.toISOString(),
      entryPrice: t.entryPrice.toString(),
      exitPrice: t.exitPrice.toString(),
      stopLoss: t.stopLoss?.toString() ?? null,
      takeProfit: t.takeProfit?.toString() ?? null,
      lotSize: t.lotSize.toString(),
      pnl: t.pnl.toString(),
      commission: t.commission.toString(),
      riskRewardRatio: t.riskRewardRatio?.toString() ?? null,
      exitReason: t.exitReason,
    })),
  };

  return <ResultsClient backtest={data} />;
}
