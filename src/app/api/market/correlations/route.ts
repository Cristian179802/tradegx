import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchHistoricalCandles } from "@/lib/yahoo-finance";

export const maxDuration = 60;

// Perechile pentru matricea de corelație
const SYMBOLS = ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD", "XAUUSD"];

let CACHE: { at: number; data: unknown } | null = null;
const TTL = 6 * 60 * 60_000; // 6 ore — corelațiile se mișcă lent

function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return 0;
  let sa = 0, sb = 0;
  for (let i = 0; i < n; i++) { sa += a[i]; sb += b[i]; }
  const ma = sa / n, mb = sb / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const xa = a[i] - ma, xb = b[i] - mb;
    num += xa * xb; da += xa * xa; db += xb * xb;
  }
  const den = Math.sqrt(da * db);
  return den > 0 ? num / den : 0;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  if (CACHE && Date.now() - CACHE.at < TTL) {
    return NextResponse.json(CACHE.data);
  }

  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 60); // ~45 lumânări de tranzacționare

  // Ia date D1 pentru toate simbolurile în paralel
  const results = await Promise.allSettled(
    SYMBOLS.map((s) => fetchHistoricalCandles(s, "D1", start, end))
  );

  // Construiește map time→close pentru fiecare simbol valid
  const closeMaps: (Map<number, number> | null)[] = results.map((r) =>
    r.status === "fulfilled" && r.value.length >= 10
      ? new Map(r.value.map((c) => [Math.floor(c.time / 86_400_000), c.close]))
      : null
  );

  // Timpii comuni tuturor seriilor valide
  const validIdx = closeMaps.map((m, i) => (m ? i : -1)).filter((i) => i >= 0);
  if (validIdx.length < 2) {
    return NextResponse.json({ symbols: SYMBOLS, matrix: null, error: "Date insuficiente" });
  }

  const firstMap = closeMaps[validIdx[0]]!;
  const commonDays = [...firstMap.keys()]
    .filter((d) => validIdx.every((i) => closeMaps[i]!.has(d)))
    .sort((a, b) => a - b);

  // Serii de randamente (close-to-close) pe zilele comune
  const returns: (number[] | null)[] = SYMBOLS.map((_, i) => {
    const m = closeMaps[i];
    if (!m) return null;
    const closes = commonDays.map((d) => m.get(d)!);
    const ret: number[] = [];
    for (let k = 1; k < closes.length; k++) {
      ret.push(closes[k - 1] > 0 ? closes[k] / closes[k - 1] - 1 : 0);
    }
    return ret;
  });

  // Matricea de corelație
  const matrix: (number | null)[][] = SYMBOLS.map((_, i) =>
    SYMBOLS.map((__, j) => {
      const ri = returns[i], rj = returns[j];
      if (!ri || !rj) return null;
      if (i === j) return 1;
      return +pearson(ri, rj).toFixed(2);
    })
  );

  const data = { symbols: SYMBOLS, matrix, days: commonDays.length };
  CACHE = { at: Date.now(), data };
  return NextResponse.json(data);
}
