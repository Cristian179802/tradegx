import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;

  const backtest = await prisma.backtest.findFirst({
    where: { id, strategy: { userId: session.user.id } },
    include: {
      strategy: { select: { id: true, name: true, type: true, color: true, rules: true } },
      trades: { orderBy: { entryTime: "asc" }, take: 500 },
    },
  });

  if (!backtest) return NextResponse.json({ error: "Negăsit" }, { status: 404 });

  // Serialize Decimal fields
  return NextResponse.json({
    ...backtest,
    winRate:        backtest.winRate?.toString() ?? null,
    profitFactor:   backtest.profitFactor?.toString() ?? null,
    maxDrawdown:    backtest.maxDrawdown?.toString() ?? null,
    maxDrawdownPct: backtest.maxDrawdownPct?.toString() ?? null,
    sharpeRatio:    backtest.sharpeRatio?.toString() ?? null,
    sortinoRatio:   backtest.sortinoRatio?.toString() ?? null,
    netPnl:         backtest.netPnl?.toString() ?? null,
    expectancy:     backtest.expectancy?.toString() ?? null,
    avgRR:          backtest.avgRR?.toString() ?? null,
    initialBalance: backtest.initialBalance?.toString() ?? null,
    finalBalance:   backtest.finalBalance?.toString() ?? null,
    riskPerTrade:   backtest.riskPerTrade?.toString() ?? null,
    commission:     backtest.commission.toString(),
    spread:         backtest.spread.toString(),
    trades: backtest.trades.map((t) => ({
      ...t,
      entryPrice:      t.entryPrice.toString(),
      exitPrice:       t.exitPrice.toString(),
      stopLoss:        t.stopLoss?.toString() ?? null,
      takeProfit:      t.takeProfit?.toString() ?? null,
      pnl:             t.pnl.toString(),
      commission:      t.commission.toString(),
      riskRewardRatio: t.riskRewardRatio?.toString() ?? null,
      lotSize:         t.lotSize.toString(),
    })),
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;
  const backtest = await prisma.backtest.findFirst({
    where: { id, strategy: { userId: session.user.id } },
  });
  if (!backtest) return NextResponse.json({ error: "Negăsit" }, { status: 404 });

  await prisma.backtest.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
