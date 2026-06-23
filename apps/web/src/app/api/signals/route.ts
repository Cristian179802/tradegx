import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateTodaySignals, todayKey } from "@/lib/ai-signals";

export const maxDuration = 60; // generarea AI poate dura

function serialize(s: Awaited<ReturnType<typeof prisma.aiSignal.findMany>>[number]) {
  return {
    id: s.id,
    date: s.date,
    symbol: s.symbol,
    instrumentType: s.instrumentType,
    direction: s.direction,
    timeframe: s.timeframe,
    entryPrice: Number(s.entryPrice),
    stopLoss: Number(s.stopLoss),
    takeProfit: Number(s.takeProfit),
    takeProfit2: s.takeProfit2 != null ? Number(s.takeProfit2) : null,
    riskReward: Number(s.riskReward),
    confidence: s.confidence,
    setupType: s.setupType,
    bias: s.bias,
    session: s.session,
    rationale: s.rationale,
    confirmation: s.confirmation,
    invalidation: s.invalidation,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
  };
}

// GET — semnalele existente pentru azi (rapid, fără generare)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const signals = await prisma.aiSignal.findMany({
    where: { date: todayKey() },
    orderBy: { confidence: "desc" },
  });

  return NextResponse.json({
    date: todayKey(),
    signals: signals.map(serialize),
    needsGeneration: signals.length === 0,
  });
}

// POST — generează semnalele zilei dacă lipsesc (poate dura ~10-20s)
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const signals = await getOrCreateTodaySignals();

  return NextResponse.json({
    date: todayKey(),
    signals: signals.map(serialize),
    generated: true,
  });
}
