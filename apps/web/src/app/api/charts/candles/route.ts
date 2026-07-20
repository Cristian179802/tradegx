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

  // limităm la ultimele 400 pentru performanță
  const trimmed = candles.slice(-400).map((c) => ({
    time: c.time, open: c.open, high: c.high, low: c.low, close: c.close,
  }));

  return NextResponse.json({ ok: true, symbol, candles: trimmed });
}
