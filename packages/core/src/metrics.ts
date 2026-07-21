// ── Metrici de performanță instituționale — logică pură, partajată ────────────
// Formule standard folosite de prop firm-uri și fonduri. Fără dependințe.

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

export function stdDev(xs: number[], sample = true): number {
  const n = xs.length;
  if (n < 2) return 0;
  const m = mean(xs);
  const variance = xs.reduce((s, x) => s + (x - m) ** 2, 0) / (n - (sample ? 1 : 0));
  return Math.sqrt(variance);
}

/** Deviația de jos (doar randamentele sub prag) — pentru Sortino. */
export function downsideDev(xs: number[], target = 0): number {
  const downs = xs.map((x) => Math.min(0, x - target) ** 2);
  const n = xs.length;
  if (n === 0) return 0;
  return Math.sqrt(downs.reduce((s, x) => s + x, 0) / n);
}

/** Sharpe anualizat din randamente periodice (implicit zilnice → ×√252). */
export function sharpe(returns: number[], periodsPerYear = 252, riskFree = 0): number | null {
  if (returns.length < 2) return null;
  const excess = returns.map((r) => r - riskFree / periodsPerYear);
  const sd = stdDev(excess);
  if (sd === 0) return null;
  return (mean(excess) / sd) * Math.sqrt(periodsPerYear);
}

/** Sortino anualizat (penalizează doar volatilitatea negativă). */
export function sortino(returns: number[], periodsPerYear = 252, riskFree = 0): number | null {
  if (returns.length < 2) return null;
  const excess = returns.map((r) => r - riskFree / periodsPerYear);
  const dd = downsideDev(excess, 0);
  if (dd === 0) return null;
  return (mean(excess) / dd) * Math.sqrt(periodsPerYear);
}

export interface DrawdownResult {
  maxDrawdownPct: number; // 0..1 (fracție)
  peak: number;
  trough: number;
}

/** Max drawdown dintr-o curbă de echitate (valori absolute cumulate). */
export function maxDrawdown(equity: number[]): DrawdownResult {
  let peak = equity[0] ?? 0;
  let maxDD = 0;
  let ddPeak = peak, ddTrough = peak;
  let curPeak = peak;
  for (const v of equity) {
    if (v > peak) peak = v;
    curPeak = peak;
    const dd = curPeak > 0 ? (curPeak - v) / curPeak : 0;
    if (dd > maxDD) { maxDD = dd; ddPeak = curPeak; ddTrough = v; }
  }
  return { maxDrawdownPct: maxDD, peak: ddPeak, trough: ddTrough };
}

/** CAGR din echitate inițială/finală și zile scurse. */
export function cagr(initial: number, final: number, days: number): number | null {
  if (initial <= 0 || days <= 0) return null;
  const years = days / 365;
  if (years <= 0) return null;
  return Math.pow(final / initial, 1 / years) - 1;
}

/** Calmar = randament anualizat / max drawdown. */
export function calmar(annualReturn: number | null, maxDDPct: number): number | null {
  if (annualReturn == null || maxDDPct <= 0) return null;
  return annualReturn / maxDDPct;
}

export interface TradeStat {
  pnl: number;      // net money
  rMultiple?: number | null; // pnl / risk
}

export interface EdgeMetrics {
  totalTrades: number;
  wins: number;
  losses: number;
  winRatePct: number;
  grossWin: number;
  grossLoss: number;
  netPnl: number;
  profitFactor: number | null;
  avgWin: number;
  avgLoss: number;
  payoff: number | null;       // avgWin / avgLoss
  expectancyMoney: number;     // media pnl per trade
  expectancyR: number | null;  // media R (dacă avem risk)
  bestTrade: number;
  worstTrade: number;
}

/** Statistici de „edge" din tranzacții (bani + R). */
export function edgeMetrics(trades: TradeStat[]): EdgeMetrics {
  const n = trades.length;
  const pnls = trades.map((t) => t.pnl);
  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);
  const grossWin = wins.reduce((s, p) => s + p, 0);
  const grossLoss = Math.abs(losses.reduce((s, p) => s + p, 0));
  const avgWin = wins.length ? grossWin / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  const rVals = trades.map((t) => t.rMultiple).filter((r): r is number => r != null && Number.isFinite(r));
  return {
    totalTrades: n,
    wins: wins.length,
    losses: losses.length,
    winRatePct: n ? (wins.length / n) * 100 : 0,
    grossWin,
    grossLoss,
    netPnl: grossWin - grossLoss,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : wins.length ? null : 0, // null = ∞
    avgWin,
    avgLoss,
    payoff: avgLoss > 0 ? avgWin / avgLoss : null,
    expectancyMoney: n ? mean(pnls) : 0,
    expectancyR: rVals.length ? mean(rVals) : null,
    bestTrade: pnls.length ? Math.max(...pnls) : 0,
    worstTrade: pnls.length ? Math.min(...pnls) : 0,
  };
}
