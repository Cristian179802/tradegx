// ── Risk Engine — logică pură, partajată între web și mobile ──────────────────
// SINGURA sursă de adevăr pentru calculele de risc. Nu rescrie nicăieri.

/** Dimensiunea unui pip pentru un simbol (0.01 pentru perechi JPY, 0.0001 altfel). */
export function pipSize(symbol: string): number {
  return /JPY/i.test(symbol) ? 0.01 : 0.0001;
}

/** Valoarea bănească riscată = |entry − SL| × lot × contractSize. */
export function calcRiskMoney(params: {
  entryPrice: number;
  stopLoss: number;
  lotSize: number;
  symbol?: string;
  contractSize?: number;
}): number {
  const { entryPrice, stopLoss, lotSize, symbol = "", contractSize = 100_000 } = params;
  const diff = Math.abs(entryPrice - stopLoss);
  const isJPY = /JPY/i.test(symbol);
  const pip = isJPY ? 0.01 : 0.0001;
  // diff în pips × valoare pip; păstrat compatibil cu calcRisk din web
  return (diff / pip) * (pip * lotSize * contractSize);
}

/** Raport Risk:Reward dintr-un trade. */
export function riskReward(entry: number, stopLoss: number, takeProfit: number): number | null {
  const risk = Math.abs(entry - stopLoss);
  const reward = Math.abs(takeProfit - entry);
  if (risk <= 0) return null;
  return +(reward / risk).toFixed(2);
}

/** Dimensiunea poziției (loturi) pentru un risc procentual dat din cont. */
export function positionSize(params: {
  balance: number;
  riskPct: number;
  entryPrice: number;
  stopLoss: number;
  symbol?: string;
  contractSize?: number;
}): number {
  const { balance, riskPct, entryPrice, stopLoss, symbol = "", contractSize = 100_000 } = params;
  const riskMoney = balance * (riskPct / 100);
  const pip = /JPY/i.test(symbol) ? 0.01 : 0.0001;
  const stopPips = Math.abs(entryPrice - stopLoss) / pip;
  const pipValuePerLot = pip * contractSize;
  if (stopPips <= 0 || pipValuePerLot <= 0) return 0;
  return +(riskMoney / (stopPips * pipValuePerLot)).toFixed(2);
}

/** Expectanța pe tranzacție, în R: (winRate × R:R) − rata de pierdere. */
export function expectancyR(winRatePct: number, rr: number): number {
  const w = winRatePct / 100;
  return +(w * rr - (1 - w)).toFixed(3);
}

/**
 * Risc de ruină prin simulare Monte Carlo (sizing procentual din cont).
 * Returnează procentul de scenarii în care contul atinge pragul de drawdown.
 */
export function riskOfRuin(params: {
  winRatePct: number;
  riskPct: number;
  rr: number;
  drawdownPct: number;
  trades: number;
  simulations?: number;
}): number {
  const { winRatePct, riskPct, rr, drawdownPct, trades, simulations = 5000 } = params;
  const ruinLevel = 1 - drawdownPct / 100;
  const winFrac = winRatePct / 100;
  const r = riskPct / 100;
  let ruined = 0;
  for (let s = 0; s < simulations; s++) {
    let bal = 1;
    for (let t = 0; t < trades; t++) {
      bal *= Math.random() < winFrac ? 1 + r * rr : 1 - r;
      if (bal <= ruinLevel) { ruined++; break; }
    }
  }
  return +((ruined / simulations) * 100).toFixed(2);
}
