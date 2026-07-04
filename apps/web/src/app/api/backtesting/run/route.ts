import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { fetchHistoricalCandles } from "@/lib/yahoo-finance";
import { runBacktest } from "@/lib/backtest-engine";
import type { StrategyType, StrategyRules } from "@/lib/backtest-engine";
import { hasPro, FREE_LIMITS } from "@/lib/plan";

const schema = z.object({
  strategyId:     z.string().cuid(),
  symbol:         z.string().min(3).max(10),
  timeframe:      z.enum(["M5","M15","M30","H1","H4","D1","W1"]),
  startDate:      z.string(),
  endDate:        z.string(),
  initialBalance: z.number().positive().max(10_000_000).default(10000),
  commission:     z.number().min(0).max(100).default(7),
  spread:         z.number().min(0).max(0.01).default(0.0002),
  riskPerTrade:   z.number().min(0.1).max(10).default(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Date invalide", details: parsed.error.flatten() }, { status: 400 });
  }

  const { strategyId, symbol, timeframe, startDate, endDate,
          initialBalance, commission, spread, riskPerTrade } = parsed.data;

  // Verify strategy ownership
  const strategy = await prisma.strategy.findFirst({
    where: { id: strategyId, userId: session.user.id, isActive: true },
  });
  if (!strategy) return NextResponse.json({ error: "Strategie negăsită" }, { status: 404 });

  // Plan FREE: maximum 3 backteste pe luna calendaristică curentă
  if (!(await hasPro(session.user.id))) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const used = await prisma.backtest.count({
      where: {
        strategy: { userId: session.user.id },
        createdAt: { gte: monthStart },
      },
    });
    if (used >= FREE_LIMITS.backtestsPerMonth) {
      return NextResponse.json(
        {
          error: `Ai folosit cele ${FREE_LIMITS.backtestsPerMonth} backteste gratuite ale lunii. Treci la PRO pentru backtesting nelimitat.`,
          code: "PRO_REQUIRED",
          upgradeUrl: "/pricing",
        },
        { status: 402 }
      );
    }
  }

  // Create backtest record (RUNNING)
  const backtest = await prisma.backtest.create({
    data: {
      strategyId,
      symbol: symbol.toUpperCase(),
      timeframe: timeframe as never,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: "RUNNING",
      initialBalance,
      commission,
      spread,
      riskPerTrade,
    },
  });

  try {
    // Fetch historical data
    const candles = await fetchHistoricalCandles(
      symbol.toUpperCase(),
      timeframe,
      new Date(startDate),
      new Date(endDate)
    );

    if (candles.length < 50) {
      await prisma.backtest.update({
        where: { id: backtest.id },
        data: { status: "FAILED", errorMessage: `Date insuficiente: ${candles.length} lumânări găsite. Alege o perioadă mai lungă sau un timeframe mai mare.` },
      });
      return NextResponse.json({ backtestId: backtest.id, error: "Date insuficiente" }, { status: 200 });
    }

    // Validate that strategy.rules is a non-null object before passing to engine
    if (!strategy.rules || typeof strategy.rules !== "object" || Array.isArray(strategy.rules)) {
      await prisma.backtest.update({
        where: { id: backtest.id },
        data: { status: "FAILED", errorMessage: "Regulile strategiei sunt invalide sau lipsesc. Editează strategia și salvează din nou." },
      });
      return NextResponse.json({ backtestId: backtest.id, error: "Reguli invalide" }, { status: 200 });
    }

    // Run the engine
    const result = runBacktest(candles, {
      strategyType: strategy.type as StrategyType,
      rules:        strategy.rules as unknown as StrategyRules,
      symbol:       symbol.toUpperCase(),
      initialBalance,
      riskPerTrade,
      commission,
      spread,
    });

    const { trades, metrics, equityCurve, monthlyPnl, totalBars } = result;

    // Save results
    await prisma.$transaction(async (tx) => {
      await tx.backtest.update({
        where: { id: backtest.id },
        data: {
          status:        "COMPLETED",
          totalTrades:   metrics.totalTrades,
          winRate:       metrics.winRate,
          profitFactor:  metrics.profitFactor,
          maxDrawdown:   metrics.maxDrawdown,
          maxDrawdownPct: metrics.maxDrawdownPct,
          sharpeRatio:   metrics.sharpeRatio,
          sortinoRatio:  metrics.sortinoRatio,
          netPnl:        metrics.netPnl,
          expectancy:    metrics.expectancy,
          avgRR:         metrics.avgRR,
          totalBars,
          finalBalance:  metrics.finalBalance,
          equityCurve:   equityCurve as never,
          monthlyPnl:    monthlyPnl as never,
        },
      });

      // Insert trades in batches of 500
      if (trades.length > 0) {
        const BATCH = 500;
        for (let i = 0; i < trades.length; i += BATCH) {
          const batch = trades.slice(i, i + BATCH);
          await tx.backtestTrade.createMany({
            data: batch.map((t) => ({
              backtestId:     backtest.id,
              symbol:         symbol.toUpperCase(),
              direction:      t.direction,
              entryPrice:     t.entryPrice,
              exitPrice:      t.exitPrice,
              entryTime:      t.entryTime,
              exitTime:       t.exitTime,
              lotSize:        t.lotSize,
              stopLoss:       t.stopLoss,
              takeProfit:     t.takeProfit,
              pnl:            t.pnl,
              commission:     t.commission,
              riskRewardRatio: t.riskRewardRatio,
              exitReason:     t.exitReason,
            })),
          });
        }
      }
    });

    return NextResponse.json({ backtestId: backtest.id, status: "COMPLETED" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Eroare necunoscută";
    await prisma.backtest.update({
      where: { id: backtest.id },
      data: { status: "FAILED", errorMessage: msg },
    });
    return NextResponse.json({ backtestId: backtest.id, error: msg }, { status: 200 });
  }
}
