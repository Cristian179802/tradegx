// ── Detecție SMC/ICT algoritmică — logică pură, fără AI ───────────────────────
// Intrare: lumânări OHLC. Ieșire: order blocks, fair value gaps, lichiditate
// (equal highs/lows) și structura pieței (BOS / CHoCH). Partajat web + mobile.

export interface SmcCandle {
  time: number; // Unix secunde
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface Zone {
  type: "bull" | "bear";
  time: number;   // timpul de start (stânga zonei)
  top: number;
  bottom: number;
  mitigated: boolean;
}
export interface LiquidityLevel {
  type: "buy" | "sell"; // buy-side = equal highs (deasupra), sell-side = equal lows (dedesubt)
  price: number;
  time: number; // primul punct
}
export interface StructurePoint {
  type: "BOS" | "CHOCH";
  dir: "up" | "down";
  time: number;
  price: number;
}
export interface SmcResult {
  orderBlocks: Zone[];
  fvgs: Zone[];
  liquidity: LiquidityLevel[];
  structure: StructurePoint[];
  lastTime: number;
}

function avgRange(c: SmcCandle[], end: number, n = 14): number {
  let sum = 0, cnt = 0;
  for (let i = Math.max(0, end - n); i < end; i++) { sum += c[i]!.high - c[i]!.low; cnt++; }
  return cnt ? sum / cnt : 0;
}

/** Puncte de swing: extrem local pe fereastra [i-k, i+k]. */
function swingPoints(c: SmcCandle[], k = 2): { highs: number[]; lows: number[] } {
  const highs: number[] = [], lows: number[] = [];
  for (let i = k; i < c.length - k; i++) {
    let isHigh = true, isLow = true;
    for (let j = i - k; j <= i + k; j++) {
      if (j === i) continue;
      if (c[j]!.high >= c[i]!.high) isHigh = false;
      if (c[j]!.low <= c[i]!.low) isLow = false;
    }
    if (isHigh) highs.push(i);
    if (isLow) lows.push(i);
  }
  return { highs, lows };
}

/**
 * Analiză SMC completă. `maxEach` limitează numărul de elemente per categorie
 * (cele mai recente), ca graficul să rămână curat.
 */
export function detectSMC(candles: SmcCandle[], maxEach = 6): SmcResult {
  const c = candles;
  const n = c.length;
  const empty: SmcResult = { orderBlocks: [], fvgs: [], liquidity: [], structure: [], lastTime: n ? c[n - 1]!.time : 0 };
  if (n < 20) return empty;

  const lastTime = c[n - 1]!.time;
  const { highs, lows } = swingPoints(c, 2);

  // ── Fair Value Gaps (imbalance pe 3 lumânări) ──
  const fvgs: Zone[] = [];
  for (let i = 2; i < n; i++) {
    const a = c[i - 2]!, cc = c[i]!;
    if (cc.low > a.high) {
      // gol bullish între high[i-2] și low[i]
      const bottom = a.high, top = cc.low;
      let mitigated = false;
      for (let j = i + 1; j < n; j++) if (c[j]!.low <= bottom) { mitigated = true; break; }
      fvgs.push({ type: "bull", time: c[i - 1]!.time, top, bottom, mitigated });
    } else if (cc.high < a.low) {
      const top = a.low, bottom = cc.high;
      let mitigated = false;
      for (let j = i + 1; j < n; j++) if (c[j]!.high >= top) { mitigated = true; break; }
      fvgs.push({ type: "bear", time: c[i - 1]!.time, top, bottom, mitigated });
    }
  }

  // ── Order Blocks (ultima lumânare opusă înainte de displacement) ──
  const orderBlocks: Zone[] = [];
  for (let i = 2; i < n - 1; i++) {
    const disp = c[i]!;
    const rng = disp.high - disp.low;
    const ar = avgRange(c, i);
    if (ar <= 0 || rng < ar * 1.5) continue; // fără displacement clar

    if (disp.close > disp.open) {
      // displacement bullish → OB = ultima lumânare bearish anterioară
      for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
        if (c[j]!.close < c[j]!.open) {
          const top = c[j]!.high, bottom = c[j]!.low;
          if (disp.close > top) {
            let mitigated = false;
            for (let m = i + 1; m < n; m++) if (c[m]!.low <= top) { mitigated = true; break; }
            orderBlocks.push({ type: "bull", time: c[j]!.time, top, bottom, mitigated });
          }
          break;
        }
      }
    } else if (disp.close < disp.open) {
      for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
        if (c[j]!.close > c[j]!.open) {
          const top = c[j]!.high, bottom = c[j]!.low;
          if (disp.close < bottom) {
            let mitigated = false;
            for (let m = i + 1; m < n; m++) if (c[m]!.high >= bottom) { mitigated = true; break; }
            orderBlocks.push({ type: "bear", time: c[j]!.time, top, bottom, mitigated });
          }
          break;
        }
      }
    }
  }

  // ── Lichiditate: equal highs / equal lows ──
  const ref = c[n - 1]!.close || 1;
  const tol = Math.max(avgRange(c, n) * 0.15, ref * 0.0006); // toleranță adaptivă
  const liquidity: LiquidityLevel[] = [];
  const clusterLevels = (idxs: number[], kind: "buy" | "sell") => {
    const used = new Set<number>();
    for (let a = 0; a < idxs.length; a++) {
      if (used.has(a)) continue;
      const price = kind === "buy" ? c[idxs[a]!]!.high : c[idxs[a]!]!.low;
      const group = [idxs[a]!];
      for (let b = a + 1; b < idxs.length; b++) {
        const p2 = kind === "buy" ? c[idxs[b]!]!.high : c[idxs[b]!]!.low;
        if (Math.abs(p2 - price) <= tol) { group.push(idxs[b]!); used.add(b); }
      }
      if (group.length >= 2) {
        const lvl = kind === "buy" ? Math.max(...group.map((g) => c[g]!.high)) : Math.min(...group.map((g) => c[g]!.low));
        liquidity.push({ type: kind, price: lvl, time: c[group[0]!]!.time });
      }
    }
  };
  clusterLevels(highs, "buy");
  clusterLevels(lows, "sell");

  // ── Structură: BOS / CHoCH ──
  const structure: StructurePoint[] = [];
  const swingSeq = [...highs.map((i) => ({ i, t: "H" as const })), ...lows.map((i) => ({ i, t: "L" as const }))].sort((a, b) => a.i - b.i);
  let lastHigh: number | null = null, lastLow: number | null = null;
  let trend: "up" | "down" | null = null;
  for (let i = 1; i < n; i++) {
    // actualizează ultimul swing confirmat până la i
    for (const s of swingSeq) {
      if (s.i >= i) break;
      if (s.t === "H") lastHigh = c[s.i]!.high;
      else lastLow = c[s.i]!.low;
    }
    const close = c[i]!.close;
    if (lastHigh != null && close > lastHigh) {
      const type = trend === "down" ? "CHOCH" : "BOS";
      structure.push({ type, dir: "up", time: c[i]!.time, price: lastHigh });
      trend = "up"; lastHigh = null;
    } else if (lastLow != null && close < lastLow) {
      const type = trend === "up" ? "CHOCH" : "BOS";
      structure.push({ type, dir: "down", time: c[i]!.time, price: lastLow });
      trend = "down"; lastLow = null;
    }
  }

  const recent = <T,>(arr: T[]) => arr.slice(-maxEach);
  // preferă zonele nemitigate (active), completează cu cele recente
  const pickZones = (z: Zone[]) => {
    const active = z.filter((x) => !x.mitigated);
    const chosen = active.length >= maxEach ? active.slice(-maxEach) : [...z].slice(-maxEach);
    return chosen;
  };

  return {
    orderBlocks: pickZones(orderBlocks),
    fvgs: pickZones(fvgs),
    liquidity: recent(liquidity),
    structure: structure.slice(-maxEach - 2),
    lastTime,
  };
}
