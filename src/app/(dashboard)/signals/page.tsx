import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { todayKey } from "@/lib/ai-signals";
import { SignalsClient } from "./signals-client";

export const metadata: Metadata = { title: "Semnale AI" };

export default async function SignalsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const signals = await prisma.aiSignal.findMany({
    where: { date: todayKey() },
    orderBy: { confidence: "desc" },
  });

  const serialized = signals.map((s) => ({
    id: s.id,
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
  }));

  return <SignalsClient initialSignals={serialized} date={todayKey()} />;
}
