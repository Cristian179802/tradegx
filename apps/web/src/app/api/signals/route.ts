import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";
import { getOrCreateTodaySignals, textSemnal, todayKey } from "@/lib/ai-signals";
import { hasPro, PRO_REQUIRED } from "@/lib/plan";
import { limbaUtilizatorului, type Limba } from "@/lib/limba-utilizator";

export const maxDuration = 60; // generarea AI poate dura

function serialize(s: Awaited<ReturnType<typeof prisma.aiSignal.findMany>>[number], limba: Limba) {
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
    ...textSemnal(s, limba),
    status: s.status,
    createdAt: s.createdAt.toISOString(),
  };
}

/**
 * Limba textelor. Aplicația o trimite explicit (`?lang=en`) — e limba afișată
 * pe telefon chiar acum. Site-ul o are în cookie-ul de limbă. Fără niciuna
 * (alt client), rămâne preferința salvată în cont.
 */
async function limbaCererii(req: Request, userId: string): Promise<Limba> {
  const lang = new URL(req.url).searchParams.get("lang");
  if (lang === "en" || lang === "ro") return lang;
  const cookie = (await cookies()).get("locale")?.value;
  if (cookie === "en" || cookie === "ro") return cookie;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { language: true } });
  return limbaUtilizatorului(user?.language);
}

// GET — semnalele existente pentru azi (rapid, fără generare)
export async function GET(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (!(await hasPro(userId))) return NextResponse.json(PRO_REQUIRED, { status: 402 });

  const limba = await limbaCererii(req, userId);
  const signals = await prisma.aiSignal.findMany({
    where: { date: todayKey() },
    orderBy: { confidence: "desc" },
  });

  return NextResponse.json({
    date: todayKey(),
    signals: signals.map((s) => serialize(s, limba)),
    needsGeneration: signals.length === 0,
    // Distinge „AI-ul a analizat și n-a găsit nimic" de „AI-ul n-a rulat".
    available: !!process.env.ANTHROPIC_API_KEY,
  });
}

// POST — generează semnalele zilei dacă lipsesc (poate dura ~10-20s)
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (!(await hasPro(userId))) return NextResponse.json(PRO_REQUIRED, { status: 402 });

  const limba = await limbaCererii(req, userId);
  const { signals, outcome } = await getOrCreateTodaySignals();

  return NextResponse.json({
    date: todayKey(),
    signals: signals.map((s) => serialize(s, limba)),
    generated: true,
    available: !!process.env.ANTHROPIC_API_KEY,
    // Clientul are nevoie de motiv ca sa nu prezinte un esec drept concluzie.
    outcome,
  });
}
