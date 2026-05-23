// ─── TradeGX Backtesting Engine ───────────────────────────────────────────
// Pure functions — no I/O, no Prisma. Receives candles + config, returns results.

import type { Candle } from "./yahoo-finance";
export type { Candle };

// ─── Strategy Types & Rules ───────────────────────────────────────────────────

export type StrategyType = "EMA_CROSSOVER" | "SESSION_BREAKOUT" | "RSI_REVERSAL" | "TREND_FOLLOWING" | "CUSTOM";

export interface EmaCrossoverRules {
  fastPeriod: number;
  slowPeriod: number;
  trendPeriod: number;    // 0 = disabled
  atrPeriod: number;
  slMultiplier: number;
  rrRatio: number;
  // Optional filters
  rsiFilter: number;      // 0 = disabled; only enter BUY when RSI < X, SELL when RSI > (100-X)
  rsiPeriod: number;
  macdConfirm: boolean;   // require MACD line to be bullish/bearish
  trailingStop: boolean;  // use trailing stop instead of fixed SL
}

export interface SessionBreakoutRules {
  session: "ASIAN" | "LONDON" | "NEW_YORK" | "ALL";
  slMultiplier: number;
  rrRatio: number;
  atrPeriod: number;
  minRangePips: number;   // 0 = no minimum; skip session if range < X pips
  retestEntry: boolean;   // wait for retest of breakout level before entry
  rsiFilter: number;      // 0 = disabled
}

export interface RsiReversalRules {
  rsiPeriod: number;
  oversold: number;
  overbought: number;
  emaFilter: number;      // 0 = disabled
  atrPeriod: number;
  slMultiplier: number;
  rrRatio: number;
  // Extra filters
  stochConfirm: boolean;  // require stochastic to confirm
  stochK: number;
  stochD: number;
  stochOversold: number;
  stochOverbought: number;
  bollFilter: boolean;    // only enter at Bollinger extremes
  bollPeriod: number;
}

export interface TrendFollowingRules {
  emaPeriod: number;
  emaSlow: number;        // second EMA for confluence (0 = disabled)
  adxPeriod: number;
  adxThreshold: number;
  pullbackBars: number;
  atrPeriod: number;
  slMultiplier: number;
  rrRatio: number;
  // Extra
  requireDiCross: boolean;  // require DI+ > DI- for BUY (and vice versa)
  macdFilter: boolean;      // require MACD to confirm direction
  macdFast: number;
  macdSlow: number;
  macdSignal: number;
}

// ─── Custom Strategy Rules ────────────────────────────────────────────────────

export type IndicatorRefType =
  | "EMA" | "SMA" | "RSI" | "ATR"
  | "MACD_LINE" | "MACD_SIGNAL" | "MACD_HIST"
  | "BOLL_UPPER" | "BOLL_MIDDLE" | "BOLL_LOWER"
  | "STOCH_K" | "STOCH_D"
  | "ADX" | "DI_PLUS" | "DI_MINUS"
  | "CLOSE" | "HIGH" | "LOW" | "OPEN"
  | "PREV_CLOSE" | "PREV_HIGH" | "PREV_LOW"
  | "VALUE";

export type ConditionOperator =
  | "crosses_above" | "crosses_below"
  | "is_above" | "is_below"
  | "is_above_by_pct" | "is_below_by_pct";

export interface IndicatorRef {
  type: IndicatorRefType;
  period?: number;   // primary period
  period2?: number;  // secondary (slow EMA for MACD, D-period for Stoch, stddev for Boll)
  period3?: number;  // tertiary (signal period for MACD)
  value?: number;    // for VALUE type
}

export interface CustomCondition {
  id: string;
  left: IndicatorRef;
  op: ConditionOperator;
  right: IndicatorRef;
  pctValue?: number; // for is_above_by_pct / is_below_by_pct operators
}

export interface TrendFilterConfig {
  enabled: boolean;
  type: "EMA" | "SMA";
  period: number;
}

export interface CustomRules {
  entryLong: CustomCondition[];
  entryShort: CustomCondition[];
  slMultiplier: number;
  rrRatio: number;
  trendFilter: TrendFilterConfig;
  atrPeriod: number;
}

export type StrategyRules = EmaCrossoverRules | SessionBreakoutRules | RsiReversalRules | TrendFollowingRules | CustomRules;

// ─── Config & Result Types ────────────────────────────────────────────────────

export interface BacktestConfig {
  strategyType: StrategyType;
  rules: StrategyRules;
  symbol: string;
  initialBalance: number;
  riskPerTrade: number;   // percent e.g. 1.0
  commission: number;     // USD per lot per side (e.g. 7)
  spread: number;         // price units e.g. 0.0002 for EURUSD
}

export interface SimTrade {
  entryTime: Date;
  exitTime: Date;
  direction: "BUY" | "SELL";
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  pnl: number;
  commission: number;
  riskRewardRatio: number;
  exitReason: "TP" | "SL" | "EOD";
}

export interface BacktestMetrics {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  grossProfit: number;
  grossLoss: number;
  netPnl: number;
  profitFactor: number;
  expectancy: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  avgRR: number;
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
  totalCommission: number;
  finalBalance: number;
}

export interface BacktestResult {
  trades: SimTrade[];
  metrics: BacktestMetrics;
  equityCurve: { date: string; balance: number; pnl: number }[];
  monthlyPnl: { month: string; pnl: number; trades: number; winRate: number }[];
  totalBars: number;
}

// ─── Technical Indicators ─────────────────────────────────────────────────────

function calcEMA(data: number[], period: number): number[] {
  if (data.length < period) return new Array(data.length).fill(NaN);
  const k = 2 / (period + 1);
  const out = new Array(data.length).fill(NaN);
  // Seed with SMA of first `period` values
  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i];
  out[period - 1] = sum / period;
  for (let i = period; i < data.length; i++) {
    out[i] = data[i] * k + out[i - 1] * (1 - k);
  }
  return out;
}

function calcSMA(data: number[], period: number): number[] {
  const out = new Array(data.length).fill(NaN);
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j];
    out[i] = sum / period;
  }
  return out;
}

function calcATR(highs: number[], lows: number[], closes: number[], period = 14): number[] {
  const n = highs.length;
  const trs = new Array(n).fill(NaN);
  for (let i = 1; i < n; i++) {
    trs[i] = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
  }
  const out = new Array(n).fill(NaN);
  // Seed with SMA
  let sumTr = 0;
  for (let i = 1; i <= period; i++) sumTr += trs[i];
  out[period] = sumTr / period;
  // Wilder smoothing
  for (let i = period + 1; i < n; i++) {
    out[i] = (out[i - 1] * (period - 1) + trs[i]) / period;
  }
  return out;
}

function calcRSI(closes: number[], period = 14): number[] {
  const n = closes.length;
  const out = new Array(n).fill(NaN);
  if (n <= period) return out;

  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < n; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

function calcADX(highs: number[], lows: number[], closes: number[], period = 14): number[] {
  const n = highs.length;
  const out = new Array(n).fill(NaN);
  if (n < period * 2 + 2) return out;

  const plusDM: number[] = [0];
  const minusDM: number[] = [0];
  const tr: number[] = [0];

  for (let i = 1; i < n; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    tr.push(Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    ));
  }

  let smTr = tr.slice(1, period + 1).reduce((a, b) => a + b, 0);
  let smPlus = plusDM.slice(1, period + 1).reduce((a, b) => a + b, 0);
  let smMinus = minusDM.slice(1, period + 1).reduce((a, b) => a + b, 0);

  const dx: number[] = new Array(period).fill(NaN);
  for (let i = period; i < n - 1; i++) {
    smTr = smTr - smTr / period + tr[i + 1];
    smPlus = smPlus - smPlus / period + plusDM[i + 1];
    smMinus = smMinus - smMinus / period + minusDM[i + 1];
    const plusDI = smTr > 0 ? (smPlus / smTr) * 100 : 0;
    const minusDI = smTr > 0 ? (smMinus / smTr) * 100 : 0;
    const dxVal = plusDI + minusDI > 0 ? (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100 : 0;
    dx.push(dxVal);
  }
  dx.push(NaN); // last bar

  // ADX = Wilder smoothing of DX — seed from first `period` valid DX values
  const validDx = dx.filter((v) => !isNaN(v));
  if (validDx.length < period) return out;
  const seedSlice = validDx.slice(0, period);
  let adx = seedSlice.reduce((a, b) => a + b, 0) / period;
  // Find the index in the original dx array where the period-th valid value lives
  let validCount = 0;
  let startIdx = 0;
  for (let i = 0; i < dx.length; i++) {
    if (!isNaN(dx[i])) {
      validCount++;
      if (validCount === period) { startIdx = i; break; }
    }
  }
  out[startIdx] = adx;
  for (let i = startIdx + 1; i < n; i++) {
    if (!isNaN(dx[i])) adx = (adx * (period - 1) + dx[i]) / period;
    out[i] = adx;
  }
  return out;
}

function calcMACD(
  closes: number[],
  fast = 12, slow = 26, signal = 9
): { line: number[]; sig: number[]; hist: number[] } {
  const fastEma = calcEMA(closes, fast);
  const slowEma = calcEMA(closes, slow);
  const n = closes.length;
  const line = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (!isNaN(fastEma[i]) && !isNaN(slowEma[i])) line[i] = fastEma[i] - slowEma[i];
  }
  const validLine = line.map((v) => (isNaN(v) ? 0 : v));
  const sig = calcEMA(validLine, signal);
  const hist = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (!isNaN(line[i]) && !isNaN(sig[i])) hist[i] = line[i] - sig[i];
  }
  return { line, sig, hist };
}

function calcBollinger(
  closes: number[],
  period = 20,
  stdMult = 2.0
): { upper: number[]; middle: number[]; lower: number[] } {
  const n = closes.length;
  const middle = calcSMA(closes, period);
  const upper = new Array(n).fill(NaN);
  const lower = new Array(n).fill(NaN);
  for (let i = period - 1; i < n; i++) {
    let sq = 0;
    for (let j = i - period + 1; j <= i; j++) sq += (closes[j] - middle[i]) ** 2;
    const sd = Math.sqrt(sq / period);
    upper[i] = middle[i] + stdMult * sd;
    lower[i] = middle[i] - stdMult * sd;
  }
  return { upper, middle, lower };
}

function calcStochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  kPeriod = 14,
  dPeriod = 3
): { k: number[]; d: number[] } {
  const n = closes.length;
  const rawK = new Array(n).fill(NaN);
  for (let i = kPeriod - 1; i < n; i++) {
    const lo = Math.min(...lows.slice(i - kPeriod + 1, i + 1));
    const hi = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
    rawK[i] = hi === lo ? 50 : ((closes[i] - lo) / (hi - lo)) * 100;
  }
  const d = calcSMA(rawK.map((v) => (isNaN(v) ? 0 : v)), dPeriod);
  return { k: rawK, d };
}

function calcDIPlusMinus(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14
): { diPlus: number[]; diMinus: number[] } {
  const n = highs.length;
  const diPlus  = new Array(n).fill(NaN);
  const diMinus = new Array(n).fill(NaN);
  if (n < period + 2) return { diPlus, diMinus };

  const plusDM: number[]  = [0];
  const minusDM: number[] = [0];
  const tr: number[]      = [0];
  for (let i = 1; i < n; i++) {
    const up   = highs[i] - highs[i - 1];
    const down = lows[i - 1] - lows[i];
    plusDM.push(up > down && up > 0 ? up : 0);
    minusDM.push(down > up && down > 0 ? down : 0);
    tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
  }
  let smTr = tr.slice(1, period + 1).reduce((a, b) => a + b, 0);
  let smP  = plusDM.slice(1, period + 1).reduce((a, b) => a + b, 0);
  let smM  = minusDM.slice(1, period + 1).reduce((a, b) => a + b, 0);
  diPlus[period]  = smTr > 0 ? (smP / smTr) * 100 : 0;
  diMinus[period] = smTr > 0 ? (smM / smTr) * 100 : 0;
  for (let i = period + 1; i < n; i++) {
    smTr = smTr - smTr / period + tr[i];
    smP  = smP  - smP  / period + plusDM[i];
    smM  = smM  - smM  / period + minusDM[i];
    diPlus[i]  = smTr > 0 ? (smP / smTr) * 100 : 0;
    diMinus[i] = smTr > 0 ? (smM / smTr) * 100 : 0;
  }
  return { diPlus, diMinus };
}

// ─── Pip value & lot sizing ────────────────────────────────────────────────────

function pipSize(symbol: string): number {
  // Gold/Silver/Metals: pip = $0.01
  if (symbol === "XAUUSD" || symbol === "XAGUSD" || symbol === "XPTUSD") return 0.01;
  // Indices (US30, NAS100, SP500, etc.): pip = 1 point
  if (["US30","NAS100","SP500","US2000","GER40","UK100"].some(s => symbol.includes(s))) return 1.0;
  // Crypto: pip = $0.01
  if (symbol.includes("BTC") || symbol.includes("ETH") || symbol.includes("BNB") || symbol.includes("SOL") || symbol.includes("XRP")) return 0.01;
  // Oil/Commodities: pip = $0.01
  if (symbol === "CRUDE" || symbol === "BRENT" || symbol === "NATGAS") return 0.01;
  // JPY pairs
  if (symbol.includes("JPY")) return 0.01;
  // Standard forex
  return 0.0001;
}

function pipValue(symbol: string): number {
  // USD value of 1 pip for 1 standard lot
  // Gold: 100 oz lot, $0.01 pip → $1/pip
  if (symbol === "XAUUSD") return 1;
  // Silver: 5000 oz lot, $0.001 pip → $5/pip
  if (symbol === "XAGUSD") return 5;
  // Platinum: 50 oz lot
  if (symbol === "XPTUSD") return 0.5;
  // Indices: ~$5 per pip per mini-lot (use $5 for simplicity at 0.01 lot level)
  if (["US30","NAS100","SP500","US2000"].some(s => symbol.includes(s))) return 5;
  // Crypto: very variable, use $1/pip as conservative estimate
  if (symbol.includes("BTC") || symbol.includes("ETH")) return 1;
  if (symbol.includes("BNB") || symbol.includes("SOL") || symbol.includes("XRP")) return 1;
  // Oil: 1000 barrels per lot, $0.01 pip → $10/pip
  if (symbol === "CRUDE" || symbol === "BRENT") return 10;
  // JPY pairs
  if (symbol.includes("JPY")) return 1000;
  // Standard forex: $10/pip
  return 10;
}

function calcLotSize(
  balance: number,
  riskPct: number,
  entryPrice: number,
  stopLossPrice: number,
  symbol: string
): number {
  const riskAmount = balance * (riskPct / 100);
  const slDistance = Math.abs(entryPrice - stopLossPrice);
  const slPips = slDistance / pipSize(symbol);
  if (slPips <= 0) return 0.01;
  const pv = pipValue(symbol);
  const lots = riskAmount / (slPips * pv);
  return Math.max(0.01, Math.min(parseFloat(lots.toFixed(2)), 50));
}

// ─── Session helpers ──────────────────────────────────────────────────────────

const SESSION_HOURS: Record<string, { start: number; end: number }> = {
  ASIAN:    { start: 0,  end: 9  },
  LONDON:   { start: 7,  end: 16 },
  NEW_YORK: { start: 12, end: 21 },
};

function utcHour(ms: number): number {
  return new Date(ms).getUTCHours();
}

// ─── Strategy Signal Generators ───────────────────────────────────────────────

type Signal = { direction: "BUY" | "SELL"; sl: number; tp: number } | null;

function emaCrossSignal(
  i: number,
  candles: Candle[],
  fastEma: number[],
  slowEma: number[],
  trendEma: number[],
  atr: number[],
  rules: EmaCrossoverRules,
  rsi: number[],
  macdHist: number[]
): Signal {
  if (i < 1 || isNaN(fastEma[i]) || isNaN(slowEma[i]) || isNaN(atr[i])) return null;

  const crossedUp   = fastEma[i] > slowEma[i] && fastEma[i - 1] <= slowEma[i - 1];
  const crossedDown = fastEma[i] < slowEma[i] && fastEma[i - 1] >= slowEma[i - 1];

  // Trend filter: disabled when trendPeriod <= 0
  const bullTrend = rules.trendPeriod <= 0 || (!isNaN(trendEma[i]) && candles[i].close > trendEma[i]);
  const bearTrend = rules.trendPeriod <= 0 || (!isNaN(trendEma[i]) && candles[i].close < trendEma[i]);

  // RSI filter: disabled when rsiFilter <= 0
  const rsiOk_buy  = rules.rsiFilter <= 0 || isNaN(rsi[i]) || rsi[i] < rules.rsiFilter;
  const rsiOk_sell = rules.rsiFilter <= 0 || isNaN(rsi[i]) || rsi[i] > (100 - rules.rsiFilter);

  // MACD confirm filter
  const macdOk_buy  = !rules.macdConfirm || (!isNaN(macdHist[i]) && macdHist[i] > 0);
  const macdOk_sell = !rules.macdConfirm || (!isNaN(macdHist[i]) && macdHist[i] < 0);

  const sl = atr[i] * rules.slMultiplier;
  if (crossedUp && bullTrend && rsiOk_buy && macdOk_buy) {
    const entry = candles[i].close;
    return { direction: "BUY", sl: entry - sl, tp: entry + sl * rules.rrRatio };
  }
  if (crossedDown && bearTrend && rsiOk_sell && macdOk_sell) {
    const entry = candles[i].close;
    return { direction: "SELL", sl: entry + sl, tp: entry - sl * rules.rrRatio };
  }
  return null;
}

// Per-session state for breakout tracking (keyed by session type)
interface SessionState {
  sesHigh: number;
  sesLow: number;
  sessionEndIdx: number;   // bar index where session ended
  firedThisSession: boolean;
}

function sessionBreakoutSignal(
  i: number,
  candles: Candle[],
  atr: number[],
  rules: SessionBreakoutRules,
  rsi: number[],
  sessionState: Map<string, SessionState>,
  symbol: string
): Signal {
  if (isNaN(atr[i])) return null;

  const sessKey = rules.session === "ALL" ? "LONDON" : rules.session;
  const sessDef = SESSION_HOURS[sessKey];
  const h = utcHour(candles[i].time);

  // ── Update session state: scan backwards to find the most recent completed session
  // We detect when the current hour is OUTSIDE the session but previous bar was INSIDE
  const prevH = i > 0 ? utcHour(candles[i - 1].time) : -1;
  const wasInSession = prevH >= sessDef.start && prevH < sessDef.end;
  const nowOutSession = h < sessDef.start || h >= sessDef.end;

  if (wasInSession && nowOutSession) {
    // Session just ended — collect session high/low from bars within the session
    let sesHigh = -Infinity;
    let sesLow = Infinity;
    for (let j = i - 1; j >= 0; j--) {
      const jh = utcHour(candles[j].time);
      if (jh >= sessDef.start && jh < sessDef.end) {
        sesHigh = Math.max(sesHigh, candles[j].high);
        sesLow  = Math.min(sesLow,  candles[j].low);
      } else if (jh < sessDef.start) {
        break; // went past session start
      }
    }
    if (isFinite(sesHigh) && isFinite(sesLow) && sesHigh > sesLow) {
      sessionState.set(sessKey, {
        sesHigh, sesLow,
        sessionEndIdx: i - 1,
        firedThisSession: false,
      });
    }
  }

  const state = sessionState.get(sessKey);
  if (!state || state.firedThisSession) return null;

  // Only watch N=8 bars after the session ended
  const barsSinceEnd = i - state.sessionEndIdx;
  if (barsSinceEnd <= 0 || barsSinceEnd > 8) return null;

  const { sesHigh, sesLow } = state;

  // minRangePips check using correct pipSize for the symbol
  if (rules.minRangePips > 0) {
    const rangeInPips = (sesHigh - sesLow) / pipSize(symbol);
    if (rangeInPips < rules.minRangePips) return null;
  }

  const sl = atr[i] * rules.slMultiplier;

  // BUY: close breaks ABOVE session high
  if (candles[i].close > sesHigh) {
    // RSI momentum filter for BUY: RSI must be > (100 - rsiFilter) i.e. showing upward momentum
    if (rules.rsiFilter > 0 && !isNaN(rsi[i]) && rsi[i] <= (100 - rules.rsiFilter)) return null;
    const entry = candles[i].close;
    state.firedThisSession = true;
    return { direction: "BUY", sl: entry - sl, tp: entry + sl * rules.rrRatio };
  }

  // SELL: close breaks BELOW session low
  if (candles[i].close < sesLow) {
    // RSI momentum filter for SELL: RSI must be < rsiFilter
    if (rules.rsiFilter > 0 && !isNaN(rsi[i]) && rsi[i] >= rules.rsiFilter) return null;
    const entry = candles[i].close;
    state.firedThisSession = true;
    return { direction: "SELL", sl: entry + sl, tp: entry - sl * rules.rrRatio };
  }

  return null;
}

function rsiReversalSignal(
  i: number,
  candles: Candle[],
  rsi: number[],
  emaFilter: number[],
  atr: number[],
  rules: RsiReversalRules,
  stochK: number[],
  bollLower: number[],
  bollUpper: number[]
): Signal {
  if (i < 1 || isNaN(rsi[i]) || isNaN(rsi[i - 1]) || isNaN(atr[i])) return null;

  const sl = atr[i] * rules.slMultiplier;
  const useEma = rules.emaFilter > 0 && !isNaN(emaFilter[i]);

  // RSI crosses back above oversold → BUY
  if (rsi[i] > rules.oversold && rsi[i - 1] <= rules.oversold) {
    const bullFilter = !useEma || candles[i].close > emaFilter[i];
    // Stochastic confirm: stochK must also be below stochOversold
    const stochOk = !rules.stochConfirm || isNaN(stochK[i]) || stochK[i] < rules.stochOversold;
    // Bollinger filter: price must be below lower band
    const bollOk = !rules.bollFilter || isNaN(bollLower[i]) || candles[i].close < bollLower[i];
    if (bullFilter && stochOk && bollOk) {
      const entry = candles[i].close;
      return { direction: "BUY", sl: entry - sl, tp: entry + sl * rules.rrRatio };
    }
  }
  // RSI crosses back below overbought → SELL
  if (rsi[i] < rules.overbought && rsi[i - 1] >= rules.overbought) {
    const bearFilter = !useEma || candles[i].close < emaFilter[i];
    // Stochastic confirm: stochK must also be above stochOverbought
    const stochOk = !rules.stochConfirm || isNaN(stochK[i]) || stochK[i] > rules.stochOverbought;
    // Bollinger filter: price must be above upper band
    const bollOk = !rules.bollFilter || isNaN(bollUpper[i]) || candles[i].close > bollUpper[i];
    if (bearFilter && stochOk && bollOk) {
      const entry = candles[i].close;
      return { direction: "SELL", sl: entry + sl, tp: entry - sl * rules.rrRatio };
    }
  }
  return null;
}

function trendFollowingSignal(
  i: number,
  candles: Candle[],
  ema: number[],
  adx: number[],
  atr: number[],
  rules: TrendFollowingRules,
  diPlus: number[],
  diMinus: number[],
  macdHist: number[],
  slowEma: number[]
): Signal {
  if (isNaN(ema[i]) || isNaN(adx[i]) || isNaN(atr[i])) return null;
  if (adx[i] < rules.adxThreshold) return null; // Not trending

  const sl = atr[i] * rules.slMultiplier;

  // DI cross filter
  const diOk_buy  = !rules.requireDiCross || isNaN(diPlus[i])  || diPlus[i] > diMinus[i];
  const diOk_sell = !rules.requireDiCross || isNaN(diMinus[i]) || diMinus[i] > diPlus[i];

  // MACD histogram filter
  const macdOk_buy  = !rules.macdFilter || isNaN(macdHist[i]) || macdHist[i] > 0;
  const macdOk_sell = !rules.macdFilter || isNaN(macdHist[i]) || macdHist[i] < 0;

  // Slow EMA confluence (disabled when emaSlow <= 0)
  const slowEmaOk_buy  = rules.emaSlow <= 0 || isNaN(slowEma[i]) || candles[i].close > slowEma[i];
  const slowEmaOk_sell = rules.emaSlow <= 0 || isNaN(slowEma[i]) || candles[i].close < slowEma[i];

  // Bullish: price above EMA
  if (candles[i].close > ema[i] && diOk_buy && macdOk_buy && slowEmaOk_buy) {
    // Improved pullback detection: at least one of the last pullbackBars had its LOW
    // within 1 ATR of the EMA value at that bar, AND current bar is a bullish close
    let wasPullback = false;
    for (let j = i - 1; j >= Math.max(0, i - rules.pullbackBars); j--) {
      if (!isNaN(ema[j]) && !isNaN(atr[j]) && Math.abs(candles[j].low - ema[j]) < atr[j]) {
        wasPullback = true;
        break;
      }
    }
    if (wasPullback && candles[i].close > candles[i].open) {
      const entry = candles[i].close;
      return { direction: "BUY", sl: entry - sl, tp: entry + sl * rules.rrRatio };
    }
  }

  // Bearish: price below EMA
  if (candles[i].close < ema[i] && diOk_sell && macdOk_sell && slowEmaOk_sell) {
    // Improved pullback: at least one bar's HIGH was within 1 ATR of EMA, AND bearish close
    let wasPullback = false;
    for (let j = i - 1; j >= Math.max(0, i - rules.pullbackBars); j--) {
      if (!isNaN(ema[j]) && !isNaN(atr[j]) && Math.abs(candles[j].high - ema[j]) < atr[j]) {
        wasPullback = true;
        break;
      }
    }
    if (wasPullback && candles[i].close < candles[i].open) {
      const entry = candles[i].close;
      return { direction: "SELL", sl: entry + sl, tp: entry - sl * rules.rrRatio };
    }
  }
  return null;
}

// ─── Custom Strategy: precompute cache key for an IndicatorRef ────────────────

function indicatorCacheKey(ref: IndicatorRef): string | null {
  switch (ref.type) {
    case "EMA":        return `EMA_${ref.period ?? 14}`;
    case "SMA":        return `SMA_${ref.period ?? 14}`;
    case "RSI":        return `RSI_${ref.period ?? 14}`;
    case "ATR":        return `ATR_${ref.period ?? 14}`;
    case "ADX":        return `ADX_${ref.period ?? 14}`;
    case "DI_PLUS":    return `DI_PLUS_${ref.period ?? 14}`;
    case "DI_MINUS":   return `DI_MINUS_${ref.period ?? 14}`;
    case "MACD_LINE":  return `MACD_LINE_${ref.period ?? 12}_${ref.period2 ?? 26}_${ref.period3 ?? 9}`;
    case "MACD_SIGNAL":return `MACD_SIGNAL_${ref.period ?? 12}_${ref.period2 ?? 26}_${ref.period3 ?? 9}`;
    case "MACD_HIST":  return `MACD_HIST_${ref.period ?? 12}_${ref.period2 ?? 26}_${ref.period3 ?? 9}`;
    case "BOLL_UPPER": return `BOLL_UPPER_${ref.period ?? 20}_${ref.period2 ?? 2}`;
    case "BOLL_MIDDLE":return `BOLL_MIDDLE_${ref.period ?? 20}_${ref.period2 ?? 2}`;
    case "BOLL_LOWER": return `BOLL_LOWER_${ref.period ?? 20}_${ref.period2 ?? 2}`;
    case "STOCH_K":    return `STOCH_K_${ref.period ?? 14}_${ref.period2 ?? 3}`;
    case "STOCH_D":    return `STOCH_D_${ref.period ?? 14}_${ref.period2 ?? 3}`;
    default: return null; // CLOSE, HIGH, LOW, OPEN, PREV_*, VALUE — no cache needed
  }
}

function precomputeRef(
  ref: IndicatorRef,
  candles: Candle[],
  cache: Map<string, number[]>
): void {
  const key = indicatorCacheKey(ref);
  if (!key || cache.has(key)) return;
  const closes = candles.map((c) => c.close);
  const highs  = candles.map((c) => c.high);
  const lows   = candles.map((c) => c.low);
  switch (ref.type) {
    case "EMA":   cache.set(key, calcEMA(closes, ref.period ?? 14)); break;
    case "SMA":   cache.set(key, calcSMA(closes, ref.period ?? 14)); break;
    case "RSI":   cache.set(key, calcRSI(closes, ref.period ?? 14)); break;
    case "ATR":   cache.set(key, calcATR(highs, lows, closes, ref.period ?? 14)); break;
    case "ADX":   cache.set(key, calcADX(highs, lows, closes, ref.period ?? 14)); break;
    case "DI_PLUS":
    case "DI_MINUS": {
      const p = ref.period ?? 14;
      const kPlus  = `DI_PLUS_${p}`;
      const kMinus = `DI_MINUS_${p}`;
      if (!cache.has(kPlus) || !cache.has(kMinus)) {
        const { diPlus, diMinus } = calcDIPlusMinus(highs, lows, closes, p);
        cache.set(kPlus, diPlus);
        cache.set(kMinus, diMinus);
      }
      break;
    }
    case "MACD_LINE":
    case "MACD_SIGNAL":
    case "MACD_HIST": {
      const f = ref.period ?? 12, s = ref.period2 ?? 26, sig = ref.period3 ?? 9;
      const kL = `MACD_LINE_${f}_${s}_${sig}`;
      const kS = `MACD_SIGNAL_${f}_${s}_${sig}`;
      const kH = `MACD_HIST_${f}_${s}_${sig}`;
      if (!cache.has(kL)) {
        const { line, sig: sigArr, hist } = calcMACD(closes, f, s, sig);
        cache.set(kL, line); cache.set(kS, sigArr); cache.set(kH, hist);
      }
      break;
    }
    case "BOLL_UPPER":
    case "BOLL_MIDDLE":
    case "BOLL_LOWER": {
      const bp = ref.period ?? 20, std = ref.period2 ?? 2;
      const kU = `BOLL_UPPER_${bp}_${std}`;
      const kM = `BOLL_MIDDLE_${bp}_${std}`;
      const kLo = `BOLL_LOWER_${bp}_${std}`;
      if (!cache.has(kU)) {
        const { upper, middle, lower } = calcBollinger(closes, bp, std);
        cache.set(kU, upper); cache.set(kM, middle); cache.set(kLo, lower);
      }
      break;
    }
    case "STOCH_K":
    case "STOCH_D": {
      const kp = ref.period ?? 14, dp = ref.period2 ?? 3;
      const kK = `STOCH_K_${kp}_${dp}`;
      const kD = `STOCH_D_${kp}_${dp}`;
      if (!cache.has(kK)) {
        const { k, d } = calcStochastic(highs, lows, closes, kp, dp);
        cache.set(kK, k); cache.set(kD, d);
      }
      break;
    }
  }
}

// ─── Custom Strategy Signal ───────────────────────────────────────────────────

function customSignal(
  i: number,
  candles: Candle[],
  atr: number[],
  rules: CustomRules,
  cache: Map<string, number[]>
): Signal {
  if (i < 1 || isNaN(atr[i])) return null;
  if (rules.entryLong.length === 0 && rules.entryShort.length === 0) return null;

  const getVal = (ref: IndicatorRef, idx: number): number => {
    const key = indicatorCacheKey(ref);
    switch (ref.type) {
      case "VALUE":      return ref.value ?? 0;
      case "CLOSE":      return candles[idx].close;
      case "HIGH":       return candles[idx].high;
      case "LOW":        return candles[idx].low;
      case "OPEN":       return candles[idx].open;
      case "PREV_CLOSE": return idx > 0 ? candles[idx - 1].close : candles[idx].close;
      case "PREV_HIGH":  return idx > 0 ? candles[idx - 1].high  : candles[idx].high;
      case "PREV_LOW":   return idx > 0 ? candles[idx - 1].low   : candles[idx].low;
      default: return key ? (cache.get(key)?.[idx] ?? NaN) : NaN;
    }
  };

  const evalCond = (cond: CustomCondition, idx: number): boolean => {
    const cl = getVal(cond.left, idx);
    const cr = getVal(cond.right, idx);
    if (isNaN(cl) || isNaN(cr)) return false;
    const pl = idx > 0 ? getVal(cond.left,  idx - 1) : cl;
    const pr = idx > 0 ? getVal(cond.right, idx - 1) : cr;
    switch (cond.op) {
      case "crosses_above":    return pl <= pr && cl > cr;
      case "crosses_below":    return pl >= pr && cl < cr;
      case "is_above":         return cl > cr;
      case "is_below":         return cl < cr;
      case "is_above_by_pct":  return cr !== 0 && ((cl - cr) / Math.abs(cr)) * 100 > (cond.pctValue ?? 1);
      case "is_below_by_pct":  return cr !== 0 && ((cr - cl) / Math.abs(cr)) * 100 > (cond.pctValue ?? 1);
      default: return false;
    }
  };

  // Trend filter
  let bullBias = true;
  let bearBias = true;
  if (rules.trendFilter?.enabled) {
    const tfKey = `${rules.trendFilter.type}_${rules.trendFilter.period}`;
    const tv = cache.get(tfKey)?.[i] ?? NaN;
    if (!isNaN(tv)) {
      bullBias = candles[i].close > tv;
      bearBias = candles[i].close < tv;
    }
  }

  const sl = atr[i] * (rules.slMultiplier ?? 1.5);

  if (bullBias && rules.entryLong.length > 0 && rules.entryLong.every((c) => evalCond(c, i))) {
    const entry = candles[i].close;
    return { direction: "BUY", sl: entry - sl, tp: entry + sl * (rules.rrRatio ?? 2) };
  }
  if (bearBias && rules.entryShort.length > 0 && rules.entryShort.every((c) => evalCond(c, i))) {
    const entry = candles[i].close;
    return { direction: "SELL", sl: entry + sl, tp: entry - sl * (rules.rrRatio ?? 2) };
  }
  return null;
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

export function runBacktest(candles: Candle[], config: BacktestConfig): BacktestResult {
  const { strategyType, rules, symbol, initialBalance, riskPerTrade, commission, spread } = config;

  // Pre-compute indicators based on strategy type
  const closes = candles.map((c) => c.close);
  const highs  = candles.map((c) => c.high);
  const lows   = candles.map((c) => c.low);
  const atr14  = calcATR(highs, lows, closes, 14);

  let fastEmaArr:   number[] = [];
  let slowEmaArr:   number[] = [];
  let trendEmaArr:  number[] = [];
  let rsiArr:       number[] = [];
  let emaFilterArr: number[] = [];
  let adxArr:       number[] = [];
  // EMA_CROSSOVER extras
  let emaCrossRsiArr:    number[] = [];
  let emaCrossMacdHist:  number[] = [];
  // RSI_REVERSAL extras
  let rsiRevStochK:   number[] = [];
  let rsiRevBollLow:  number[] = [];
  let rsiRevBollUp:   number[] = [];
  // TREND_FOLLOWING extras
  let tfDiPlus:    number[] = [];
  let tfDiMinus:   number[] = [];
  let tfMacdHist:  number[] = [];
  let tfSlowEma:   number[] = [];
  // SESSION_BREAKOUT state
  const sessionState = new Map<string, SessionState>();
  // SESSION_BREAKOUT rsi
  let sessRsiArr: number[] = [];

  const customCache = new Map<string, number[]>();
  let warmup = 50;

  if (strategyType === "EMA_CROSSOVER") {
    const r = rules as EmaCrossoverRules;
    fastEmaArr  = calcEMA(closes, r.fastPeriod);
    slowEmaArr  = calcEMA(closes, r.slowPeriod);
    trendEmaArr = r.trendPeriod > 0 ? calcEMA(closes, r.trendPeriod) : closes.map(() => NaN);
    // RSI for rsiFilter
    if (r.rsiFilter > 0) {
      emaCrossRsiArr = calcRSI(closes, r.rsiPeriod > 0 ? r.rsiPeriod : 14);
    }
    // MACD for macdConfirm
    if (r.macdConfirm) {
      const { hist } = calcMACD(closes, 12, 26, 9);
      emaCrossMacdHist = hist;
    }
    const macdWarmup = r.macdConfirm ? 26 + 9 + 5 : 0;
    warmup = Math.max(r.slowPeriod, r.trendPeriod > 0 ? r.trendPeriod : 0, macdWarmup) + 5;
  } else if (strategyType === "RSI_REVERSAL") {
    const r = rules as RsiReversalRules;
    rsiArr       = calcRSI(closes, r.rsiPeriod);
    emaFilterArr = r.emaFilter > 0 ? calcEMA(closes, r.emaFilter) : closes.map(() => NaN);
    // Stochastic confirm
    if (r.stochConfirm) {
      const { k } = calcStochastic(highs, lows, closes, r.stochK > 0 ? r.stochK : 14, r.stochD > 0 ? r.stochD : 3);
      rsiRevStochK = k;
    }
    // Bollinger filter
    if (r.bollFilter) {
      const { upper, lower } = calcBollinger(closes, r.bollPeriod > 0 ? r.bollPeriod : 20);
      rsiRevBollLow = lower;
      rsiRevBollUp  = upper;
    }
    const bollWarmup = r.bollFilter ? (r.bollPeriod > 0 ? r.bollPeriod : 20) : 0;
    const stochWarmup = r.stochConfirm ? (r.stochK > 0 ? r.stochK : 14) : 0;
    warmup = Math.max(r.rsiPeriod + 5, r.emaFilter > 0 ? r.emaFilter + 5 : 0, bollWarmup + 5, stochWarmup + 5);
  } else if (strategyType === "TREND_FOLLOWING") {
    const r = rules as TrendFollowingRules;
    fastEmaArr = calcEMA(closes, r.emaPeriod);
    adxArr     = calcADX(highs, lows, closes, r.adxPeriod);
    // DI+ / DI- for requireDiCross
    if (r.requireDiCross) {
      const { diPlus, diMinus } = calcDIPlusMinus(highs, lows, closes, r.adxPeriod);
      tfDiPlus  = diPlus;
      tfDiMinus = diMinus;
    }
    // MACD filter
    if (r.macdFilter) {
      const fast = r.macdFast > 0 ? r.macdFast : 12;
      const slow = r.macdSlow > 0 ? r.macdSlow : 26;
      const sig  = r.macdSignal > 0 ? r.macdSignal : 9;
      const { hist } = calcMACD(closes, fast, slow, sig);
      tfMacdHist = hist;
    }
    // Slow EMA confluence
    if (r.emaSlow > 0) {
      tfSlowEma = calcEMA(closes, r.emaSlow);
    }
    const macdWarmup = r.macdFilter ? ((r.macdSlow > 0 ? r.macdSlow : 26) + (r.macdSignal > 0 ? r.macdSignal : 9) + 5) : 0;
    const slowEmaWarmup = r.emaSlow > 0 ? r.emaSlow : 0;
    warmup = Math.max(r.emaPeriod, r.adxPeriod * 2, macdWarmup, slowEmaWarmup) + 10;
  } else if (strategyType === "SESSION_BREAKOUT") {
    const r = rules as SessionBreakoutRules;
    if (r.rsiFilter > 0) {
      sessRsiArr = calcRSI(closes, 14);
    }
    warmup = 24; // need at least one full session worth of bars
  } else if (strategyType === "CUSTOM") {
    const r = rules as CustomRules;
    const allConds = [...(r.entryLong ?? []), ...(r.entryShort ?? [])];
    for (const cond of allConds) {
      precomputeRef(cond.left,  candles, customCache);
      precomputeRef(cond.right, candles, customCache);
    }
    if (r.trendFilter?.enabled) {
      const tfRef: IndicatorRef = { type: r.trendFilter.type, period: r.trendFilter.period };
      precomputeRef(tfRef, candles, customCache);
    }
    const maxPeriod = allConds.flatMap((c) => [c.left, c.right])
      .reduce((m, ref) => {
        const p = Math.max(ref.period ?? 0, ref.period2 ?? 0, ref.period3 ?? 0);
        return Math.max(m, p);
      }, r.trendFilter?.enabled ? r.trendFilter.period : 0);
    warmup = Math.max(maxPeriod + 10, 50);
  }

  // Main simulation loop
  const trades: SimTrade[] = [];
  let balance = initialBalance;
  let openTrade: {
    direction: "BUY" | "SELL";
    entryPrice: number; entryTime: Date;
    sl: number; tp: number;
    lotSize: number; commission: number;
  } | null = null;

  const equityPoints: { time: number; equity: number }[] = [
    { time: candles[0]?.time ?? 0, equity: initialBalance },
  ];

  for (let i = warmup; i < candles.length; i++) {
    const c = candles[i];

    if (openTrade) {
      // ── Trailing stop (EMA_CROSSOVER only) ──────────────────────────────
      if (strategyType === "EMA_CROSSOVER" && (rules as EmaCrossoverRules).trailingStop) {
        const atrVal = !isNaN(atr14[i]) ? atr14[i] : 0;
        if (openTrade.direction === "BUY" && c.high > openTrade.entryPrice) {
          const newSl = c.high - atrVal;
          if (newSl > openTrade.sl) openTrade.sl = newSl;
        } else if (openTrade.direction === "SELL" && c.low < openTrade.entryPrice) {
          const newSl = c.low + atrVal;
          if (newSl < openTrade.sl) openTrade.sl = newSl;
        }
      }

      // Check if TP or SL hit intra-bar
      let exitPrice: number | null = null;
      let exitReason: "TP" | "SL" | "EOD" = "EOD";

      if (openTrade.direction === "BUY") {
        if (c.low <= openTrade.sl) { exitPrice = openTrade.sl; exitReason = "SL"; }
        else if (c.high >= openTrade.tp) { exitPrice = openTrade.tp; exitReason = "TP"; }
      } else {
        if (c.high >= openTrade.sl) { exitPrice = openTrade.sl; exitReason = "SL"; }
        else if (c.low <= openTrade.tp) { exitPrice = openTrade.tp; exitReason = "TP"; }
      }

      if (exitPrice !== null) {
        const rawPnl = openTrade.direction === "BUY"
          ? (exitPrice - openTrade.entryPrice) / pipSize(symbol) * pipValue(symbol) * openTrade.lotSize
          : (openTrade.entryPrice - exitPrice) / pipSize(symbol) * pipValue(symbol) * openTrade.lotSize;
        const totalComm = openTrade.commission * 2; // entry + exit
        const netPnl = rawPnl - totalComm;

        const rr = Math.abs(openTrade.tp - openTrade.entryPrice) /
                   Math.abs(openTrade.sl - openTrade.entryPrice);

        trades.push({
          entryTime:      openTrade.entryTime,
          exitTime:       new Date(c.time),
          direction:      openTrade.direction,
          entryPrice:     openTrade.entryPrice,
          exitPrice,
          stopLoss:       openTrade.sl,
          takeProfit:     openTrade.tp,
          lotSize:        openTrade.lotSize,
          pnl:            parseFloat(netPnl.toFixed(2)),
          commission:     parseFloat(totalComm.toFixed(2)),
          riskRewardRatio: parseFloat(rr.toFixed(2)),
          exitReason,
        });

        balance += netPnl;
        equityPoints.push({ time: c.time, equity: parseFloat(balance.toFixed(2)) });
        openTrade = null;
      }
      continue; // one trade at a time
    }

    // Generate signal
    let signal: Signal = null;
    if (strategyType === "EMA_CROSSOVER") {
      signal = emaCrossSignal(i, candles, fastEmaArr, slowEmaArr, trendEmaArr, atr14, rules as EmaCrossoverRules, emaCrossRsiArr, emaCrossMacdHist);
    } else if (strategyType === "SESSION_BREAKOUT") {
      signal = sessionBreakoutSignal(i, candles, atr14, rules as SessionBreakoutRules, sessRsiArr, sessionState, symbol);
    } else if (strategyType === "RSI_REVERSAL") {
      signal = rsiReversalSignal(i, candles, rsiArr, emaFilterArr, atr14, rules as RsiReversalRules, rsiRevStochK, rsiRevBollLow, rsiRevBollUp);
    } else if (strategyType === "TREND_FOLLOWING") {
      signal = trendFollowingSignal(i, candles, fastEmaArr, adxArr, atr14, rules as TrendFollowingRules, tfDiPlus, tfDiMinus, tfMacdHist, tfSlowEma);
    } else if (strategyType === "CUSTOM") {
      signal = customSignal(i, candles, atr14, rules as CustomRules, customCache);
    }

    if (signal) {
      const entryPrice = signal.direction === "BUY"
        ? c.close + spread : c.close - spread;
      const lots = calcLotSize(balance, riskPerTrade, entryPrice, signal.sl, symbol);
      if (lots <= 0) continue;

      const comm = commission * lots;
      openTrade = {
        direction:  signal.direction,
        entryPrice,
        entryTime:  new Date(c.time),
        sl:         signal.sl,
        tp:         signal.tp,
        lotSize:    lots,
        commission: comm,
      };
    }
  }

  // Force close any open trade at last bar
  if (openTrade) {
    const lastC = candles[candles.length - 1];
    const exitPrice = lastC.close;
    const rawPnl = openTrade.direction === "BUY"
      ? (exitPrice - openTrade.entryPrice) / pipSize(symbol) * pipValue(symbol) * openTrade.lotSize
      : (openTrade.entryPrice - exitPrice) / pipSize(symbol) * pipValue(symbol) * openTrade.lotSize;
    const totalComm = openTrade.commission * 2;
    const netPnl = rawPnl - totalComm;
    const rr = Math.abs(openTrade.tp - openTrade.entryPrice) /
               Math.abs(openTrade.sl - openTrade.entryPrice);
    trades.push({
      entryTime: openTrade.entryTime,
      exitTime: new Date(lastC.time),
      direction: openTrade.direction,
      entryPrice: openTrade.entryPrice,
      exitPrice,
      stopLoss: openTrade.sl,
      takeProfit: openTrade.tp,
      lotSize: openTrade.lotSize,
      pnl: parseFloat(netPnl.toFixed(2)),
      commission: parseFloat(totalComm.toFixed(2)),
      riskRewardRatio: parseFloat(rr.toFixed(2)),
      exitReason: "EOD",
    });
    balance += netPnl;
    equityPoints.push({ time: lastC.time, equity: parseFloat(balance.toFixed(2)) });
  }

  // ─── Metrics Calculation ───────────────────────────────────────────────────
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const netPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
  const expectancy = trades.length > 0
    ? (avgWin * (winRate / 100)) - (avgLoss * (1 - winRate / 100))
    : 0;
  const avgRR = trades.length > 0
    ? trades.reduce((s, t) => s + t.riskRewardRatio, 0) / trades.length
    : 0;
  const totalCommission = trades.reduce((s, t) => s + t.commission, 0);

  // Max drawdown
  let peak = initialBalance;
  let maxDrawdown = 0;
  let maxDrawdownPct = 0;
  let runBal = initialBalance;
  for (const t of trades) {
    runBal += t.pnl;
    if (runBal > peak) peak = runBal;
    const dd = peak - runBal;
    const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
    if (dd > maxDrawdown) maxDrawdown = dd;
    if (ddPct > maxDrawdownPct) maxDrawdownPct = ddPct;
  }

  // Sharpe & Sortino (annualized, based on trade returns)
  let sharpeRatio = 0, sortinoRatio = 0;
  if (trades.length >= 2) {
    const returns = trades.map((t) => t.pnl / initialBalance);
    const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const downDev = Math.sqrt(
      returns.filter((r) => r < 0).reduce((s, r) => s + r ** 2, 0) /
      Math.max(returns.filter((r) => r < 0).length, 1)
    );
    const annFactor = Math.sqrt(252); // approximate trades/year
    sharpeRatio = stdDev > 0 ? (mean / stdDev) * annFactor : 0;
    sortinoRatio = downDev > 0 ? (mean / downDev) * annFactor : 0;
  }

  // Equity curve (daily aggregation)
  const dailyMap = new Map<string, number>();
  for (const pt of equityPoints) {
    const day = new Date(pt.time).toISOString().slice(0, 10);
    dailyMap.set(day, pt.equity);
  }
  const equityCurve = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, bal]) => ({ date, balance: bal, pnl: parseFloat((bal - initialBalance).toFixed(2)) }));

  // Monthly P&L
  const monthlyMap = new Map<string, { pnl: number; wins: number; total: number }>();
  for (const t of trades) {
    const month = t.exitTime.toISOString().slice(0, 7);
    const entry = monthlyMap.get(month) ?? { pnl: 0, wins: 0, total: 0 };
    entry.pnl += t.pnl;
    entry.total++;
    if (t.pnl > 0) entry.wins++;
    monthlyMap.set(month, entry);
  }
  const monthlyPnl = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { pnl, wins, total }]) => ({
      month,
      pnl: parseFloat(pnl.toFixed(2)),
      trades: total,
      winRate: total > 0 ? parseFloat(((wins / total) * 100).toFixed(1)) : 0,
    }));

  const metrics: BacktestMetrics = {
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: parseFloat(winRate.toFixed(1)),
    grossProfit: parseFloat(grossProfit.toFixed(2)),
    grossLoss: parseFloat(grossLoss.toFixed(2)),
    netPnl: parseFloat(netPnl.toFixed(2)),
    profitFactor: parseFloat(Math.min(profitFactor, 999).toFixed(2)),
    expectancy: parseFloat(expectancy.toFixed(2)),
    sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
    sortinoRatio: parseFloat(sortinoRatio.toFixed(2)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    maxDrawdownPct: parseFloat(maxDrawdownPct.toFixed(2)),
    avgRR: parseFloat(avgRR.toFixed(2)),
    avgWin: parseFloat(avgWin.toFixed(2)),
    avgLoss: parseFloat(avgLoss.toFixed(2)),
    bestTrade: trades.length > 0 ? Math.max(...trades.map((t) => t.pnl)) : 0,
    worstTrade: trades.length > 0 ? Math.min(...trades.map((t) => t.pnl)) : 0,
    totalCommission: parseFloat(totalCommission.toFixed(2)),
    finalBalance: parseFloat(balance.toFixed(2)),
  };

  return { trades, metrics, equityCurve, monthlyPnl, totalBars: candles.length };
}
