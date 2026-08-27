import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { fetchHistoricalCandles } from "@/lib/yahoo-finance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TV interval → timeframe intern + fereastră
const TF_MAP: Record<string, { tf: string; days: number }> = {
  "5":   { tf: "M5",  days: 5 },
  "15":  { tf: "M15", days: 12 },
  "30":  { tf: "M30", days: 25 },
  "60":  { tf: "H1",  days: 60 },
  "240": { tf: "H4",  days: 180 },
  "D":   { tf: "D1",  days: 730 },
  "W":   { tf: "W1",  days: 365 * 5 },
};

// Lumânări reale pentru chartul cu overlay SMC. GET → merge și pe contul demo.
export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const symbol = (req.nextUrl.searchParams.get("symbol") ?? "EURUSD")
    .toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const cfg = TF_MAP[req.nextUrl.searchParams.get("tf") ?? "60"] ?? TF_MAP["60"]!;

  const end = new Date();
  const start = new Date(end.getTime() - cfg.days * 864e5);

  let candles: Awaited<ReturnType<typeof fetchHistoricalCandles>> = [];
  try {
    candles = await fetchHistoricalCandles(symbol, cfg.tf, start, end);
  } catch {
    candles = [];
  }
  if (!candles || candles.length < 20) {
    return NextResponse.json({ error: "Date insuficiente pentru acest simbol.", code: "NO_DATA" }, { status: 422 });
  }

  // Limităm la ultimele 400 pentru performanță (v = volum, pt. harta 3D).
  //
  // Timpul se convertește în SECUNDE. `fetchHistoricalCandles` întoarce
  // milisecunde (convenția JavaScript), dar lightweight-charts citește numerele ca
  // secunde Unix. Trimise ca atare, o lumânare de azi ajungea în anul 58624 — de
  // acolo veneau cifrele de pe axa de timp, care erau ANI, nu ore.
  //
  // Stricau și altceva, mai greu de observat: /api/charts/trades întoarce timpul
  // corect, în secunde, deci marcajele tranzacțiilor tale cădeau la 58 de mii de
  // ani distanță de lumânări și nu se vedeau niciodată. Conversia se face aici,
  // într-un singur loc, ca toate straturile graficului să vorbească aceeași unitate.
  const trimmed = candles.slice(-400).map((c) => ({
    time: Math.floor(c.time / 1000),
    open: c.open, high: c.high, low: c.low, close: c.close, v: c.volume ?? 0,
  }));

  return NextResponse.json({ ok: true, symbol, candles: trimmed });
}
