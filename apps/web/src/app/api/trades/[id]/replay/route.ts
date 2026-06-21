import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchHistoricalCandles } from "@/lib/yahoo-finance";

export const maxDuration = 30;

// Alege timeframe-ul potrivit în funcție de durata tranzacției
function pickTimeframe(durationMs: number): string {
  const h = durationMs / 3_600_000;
  if (h <= 4) return "M5";
  if (h <= 24) return "M15";
  if (h <= 24 * 5) return "H1";
  if (h <= 24 * 30) return "H4";
  return "D1";
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;
  const trade = await prisma.trade.findFirst({
    where: { id, account: { userId: session.user.id } },
    select: {
      symbol: true, direction: true, entryPrice: true, exitPrice: true,
      entryTime: true, exitTime: true, stopLoss: true, takeProfit: true,
    },
  });
  if (!trade) return NextResponse.json({ error: "Tranzacție negăsită" }, { status: 404 });

  const entry = new Date(trade.entryTime);
  const exit = trade.exitTime ? new Date(trade.exitTime) : new Date(entry.getTime() + 4 * 3_600_000);
  const durationMs = Math.max(exit.getTime() - entry.getTime(), 60_000);
  const timeframe = pickTimeframe(durationMs);

  // Buffer de context înainte/după trade (40% din durată de fiecare parte, minim 2h)
  const buffer = Math.max(durationMs * 0.4, 2 * 3_600_000);
  const from = new Date(entry.getTime() - buffer);
  const to = new Date(exit.getTime() + buffer);

  let candles: { time: number; open: number; high: number; low: number; close: number }[] = [];
  let dataError: string | null = null;
  try {
    const raw = await fetchHistoricalCandles(trade.symbol, timeframe, from, to);
    candles = raw.map((c) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close }));
  } catch (e) {
    dataError = e instanceof Error ? e.message : "Date indisponibile";
  }

  return NextResponse.json({
    symbol: trade.symbol,
    direction: trade.direction,
    timeframe,
    entryPrice: Number(trade.entryPrice),
    exitPrice: trade.exitPrice != null ? Number(trade.exitPrice) : null,
    stopLoss: trade.stopLoss != null ? Number(trade.stopLoss) : null,
    takeProfit: trade.takeProfit != null ? Number(trade.takeProfit) : null,
    entryTime: entry.toISOString(),
    exitTime: exit.toISOString(),
    candles,
    dataError,
  });
}
