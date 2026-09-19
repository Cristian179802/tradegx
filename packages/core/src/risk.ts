// ── Risk Engine — logică pură, partajată între web și mobile ──────────────────
// SINGURA sursă de adevăr pentru calculele de risc. Nu rescrie nicăieri.
//
// Valoarea unui pip stă în `pip.ts` și se CALCULEAZĂ din preț și din moneda
// contului. Vezi comentariul de acolo pentru ce se strica înainte.

import { pipSize, pipValue, type Cursuri } from "./pip";

export { pipSize };

/** Raport Risk:Reward dintr-un trade. */
export function riskReward(entry: number, stopLoss: number, takeProfit: number): number | null {
  const risk = Math.abs(entry - stopLoss);
  const reward = Math.abs(takeProfit - entry);
  if (risk <= 0) return null;
  return +(reward / risk).toFixed(2);
}

/** Distanța până la stop, în pips. */
export function stopPips(entryPrice: number, stopLoss: number, symbol: string): number {
  return Math.abs(entryPrice - stopLoss) / pipSize(symbol);
}

export interface ParamRisc {
  entryPrice: number;
  stopLoss: number;
  lotSize: number;
  symbol?: string;
  contractSize?: number;
  /** Prețul curent; implicit `entryPrice`, care e tot un preț al simbolului. */
  price?: number;
  accountCurrency?: string;
  rates?: Cursuri;
  /** Valoarea pipului pe lot, dacă o știi de la broker. Ocolește calculul. */
  pipValuePerLot?: number;
}

/**
 * Câți bani riști: distanța până la stop, în pips, × valoarea pipului × loturi.
 * `null` când valoarea pipului nu poate fi aflată (lipsește un curs).
 */
export function calcRiskMoney(params: ParamRisc): number | null {
  const { entryPrice, stopLoss, lotSize, symbol = "EURUSD" } = params;
  const vp = params.pipValuePerLot ?? pipValue({
    symbol,
    price: params.price ?? entryPrice,
    accountCurrency: params.accountCurrency,
    contractSize: params.contractSize,
    rates: params.rates,
  });
  if (vp == null) return null;
  return +(stopPips(entryPrice, stopLoss, symbol) * vp * lotSize).toFixed(2);
}

export interface ParamPozitie {
  balance: number;
  riskPct: number;
  entryPrice: number;
  stopLoss: number;
  symbol?: string;
  contractSize?: number;
  price?: number;
  accountCurrency?: string;
  rates?: Cursuri;
  pipValuePerLot?: number;
}

/**
 * Mărimea poziției, în loturi, pentru un risc procentual dat din cont.
 * `null` când valoarea pipului nu poate fi aflată — caz în care interfața
 * trebuie să CEARĂ valoarea, nu să afișeze o cifră inventată.
 */
export function positionSize(params: ParamPozitie): number | null {
  const { balance, riskPct, entryPrice, stopLoss, symbol = "EURUSD" } = params;
  const vp = params.pipValuePerLot ?? pipValue({
    symbol,
    price: params.price ?? entryPrice,
    accountCurrency: params.accountCurrency,
    contractSize: params.contractSize,
    rates: params.rates,
  });
  if (vp == null || vp <= 0) return null;

  const pips = stopPips(entryPrice, stopLoss, symbol);
  if (!(pips > 0)) return null;

  const riskMoney = balance * (riskPct / 100);
  return +(riskMoney / (pips * vp)).toFixed(2);
}

/** Expectanța pe tranzacție, în R: (winRate × R:R) − rata de pierdere. */
export function expectancyR(winRatePct: number, rr: number): number {
  const w = winRatePct / 100;
  return +(w * rr - (1 - w)).toFixed(3);
}

/**
 * Risc de ruină prin simulare Monte Carlo (sizing procentual din cont).
 * Returnează procentul de scenarii în care contul atinge pragul de drawdown.
 *
 * `aleator` se poate injecta ca să fie testabil determinist; implicit
 * `Math.random`.
 */
export function riskOfRuin(params: {
  winRatePct: number;
  riskPct: number;
  rr: number;
  drawdownPct: number;
  trades: number;
  simulations?: number;
  aleator?: () => number;
}): number {
  const {
    winRatePct, riskPct, rr, drawdownPct, trades,
    simulations = 5000, aleator = Math.random,
  } = params;

  const ruinLevel = 1 - drawdownPct / 100;
  const winFrac = winRatePct / 100;
  const r = riskPct / 100;
  let ruined = 0;

  for (let s = 0; s < simulations; s++) {
    let bal = 1;
    for (let t = 0; t < trades; t++) {
      bal *= aleator() < winFrac ? 1 + r * rr : 1 - r;
      if (bal <= ruinLevel) { ruined++; break; }
    }
  }
  return +((ruined / simulations) * 100).toFixed(2);
}
