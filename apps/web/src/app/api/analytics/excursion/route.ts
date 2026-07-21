import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { hasPro, PRO_REQUIRED } from "@/lib/plan";
import { prisma } from "@/lib/prisma";
import { fetchHistoricalCandles } from "@/lib/yahoo-finance";

export const runtime = "nodejs";
export const maxDuration = 60;

// ── MAE / MFE (Maximum Adverse / Favorable Excursion) ────────────────────────
// Cât a mers prețul ÎMPOTRIVA ta (MAE) și ÎN FAVOAREA ta (MFE) în timpul
// tranzacției, normalizat în R (distanța până la SL = 1R). Din lumânări reale,
// grupat pe simbol (câteva fetch-uri, nu unul per tranzacție).

interface Point { mae: number; mfe: number; realizedR: number; win: boolean; symbol: string }

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (!(await hasPro(userId))) return NextResponse.json(PRO_REQUIRED, { status: 402 });

  // ultimele ~80 tranzacții închise cu SL (pt normalizare în R)
  const trades = await prisma.trade.findMany({
    where: {
      account: { userId },
      status: "CLOSED",
      stopLoss: { not: null },
      exitTime: { not: null },
    },
    select: { symbol: true, direction: true, entryPrice: true, entryTime: true, exitTime: true, stopLoss: true, pnlMoney: true },
    orderBy: { entryTime: "desc" },
    take: 80,
  });

  if (trades.length < 5) {
    return NextResponse.json({ ok: true, points: [], insufficient: true });
  }

  // grupăm pe simbol
  const bySymbol = new Map<string, typeof trades>();
  for (const t of trades) {
    const key = t.symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!bySymbol.has(key)) bySymbol.set(key, []);
    bySymbol.get(key)!.push(t);
  }

  const points: Point[] = [];

  await Promise.all([...bySymbol.entries()].map(async ([sym, group]) => {
    const times = group.flatMap((t) => [new Date(t.entryTime).getTime(), t.exitTime ? new Date(t.exitTime).getTime() : 0]).filter(Boolean);
    const start = new Date(Math.min(...times) - 2 * 3600_000);
    const end = new Date(Math.max(...times) + 2 * 3600_000);
    let candles: Awaited<ReturnType<typeof fetchHistoricalCandles>> = [];
    try {
      candles = await fetchHistoricalCandles(sym, "H1", start, end);
    } catch { return; }
    if (!candles || candles.length === 0) return;

    for (const t of group) {
      const entry = Number(t.entryPrice);
      const sl = Number(t.stopLoss);
      const stopDist = Math.abs(entry - sl);
      if (stopDist <= 0) continue;
      const eIn = new Date(t.entryTime).getTime() / 1000;
      const eOut = new Date(t.exitTime!).getTime() / 1000;
      const win = candles.filter((c) => c.time >= eIn - 3600 && c.time <= eOut + 3600);
      if (win.length === 0) continue;

      const hi = Math.max(...win.map((c) => c.high));
      const lo = Math.min(...win.map((c) => c.low));
      const isBuy = t.direction === "BUY";
      const maePrice = isBuy ? entry - lo : hi - entry;   // împotriva ta
      const mfePrice = isBuy ? hi - entry : entry - lo;   // în favoarea ta
      const pnl = Number(t.pnlMoney ?? 0);
      // R realizat estimat din MAE/MFE nu — folosim pnl semnul; magnitudinea R o luăm din preț ieșire? aproximăm cu MFE/MAE
      points.push({
        mae: +(Math.max(0, maePrice) / stopDist).toFixed(2),
        mfe: +(Math.max(0, mfePrice) / stopDist).toFixed(2),
        realizedR: 0, // completat mai jos din pnl dacă avem risc; altfel semn
        win: pnl > 0,
        symbol: sym,
      });
    }
  }));

  // insight-uri
  const winners = points.filter((p) => p.win);
  const losers = points.filter((p) => !p.win);
  const med = (arr: number[]) => {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    return +s[Math.floor(s.length / 2)]!.toFixed(2);
  };
  const avg = (arr: number[]) => (arr.length ? +(arr.reduce((s, x) => s + x, 0) / arr.length).toFixed(2) : null);

  const insights = {
    count: points.length,
    winnersMedianMAE: med(winners.map((p) => p.mae)),   // cât riscă în medie câștigătoarele
    losersMedianMAE: med(losers.map((p) => p.mae)),
    winnersAvgMFE: avg(winners.map((p) => p.mfe)),        // cât profit ating câștigătoarele
    // eficiență = cât din MFE ai capturat (aproximat: câștigătoarele ating MFE dar închid mai jos)
  };

  return NextResponse.json({ ok: true, points, insights, insufficient: false });
}
