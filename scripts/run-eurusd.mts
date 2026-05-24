// ─── EURUSD Deep-Dive Backtest ─────────────────────────────────────────────────
// Tests 35+ configs on EURUSD: mean reversion, ranging strategies, session-based
// Focus: finding what actually works on a ranging, low-trend market
// Usage: npx tsx scripts/run-eurusd.mts

import { runBacktest } from "../src/lib/backtest-engine.js";
import type { BacktestConfig, Candle } from "../src/lib/backtest-engine.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Yahoo Finance Fetcher ────────────────────────────────────────────────────

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

interface RawCandle { time: number; open: number; high: number; low: number; close: number; volume: number; }

async function fetchRaw(ticker: string, interval: string, fromSec: number, toSec: number): Promise<RawCandle[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&period1=${fromSec}&period2=${toSec}&includePrePost=false`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/json" } });
      if (!resp.ok) { if (attempt < 2) { await sleep(2000 * (attempt + 1)); continue; } throw new Error(`HTTP ${resp.status}`); }
      const json = await resp.json() as { chart: { result?: Array<{ timestamp: number[]; indicators: { quote: Array<{ open: number[]; high: number[]; low: number[]; close: number[]; volume: number[] }> } }>; error?: { description: string } } };
      if (json.chart.error) throw new Error(json.chart.error.description);
      const r = json.chart.result?.[0]; if (!r) throw new Error("No data");
      const q = r.indicators.quote[0];
      return r.timestamp.map((t, i) => ({ time: t * 1000, open: q.open[i], high: q.high[i], low: q.low[i], close: q.close[i], volume: q.volume[i] ?? 0 }))
        .filter(c => c.open != null && c.close != null && !isNaN(c.close) && c.close > 0 && c.high >= c.low);
    } catch (e) {
      if (attempt < 2) await sleep(2000 * (attempt + 1)); else throw e;
    }
  }
  throw new Error("Failed after 3 attempts");
}

function aggregateH4(h1: RawCandle[]): RawCandle[] {
  const groups = new Map<string, RawCandle[]>();
  for (const c of h1) {
    const d = new Date(c.time); const slot = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${Math.floor(d.getUTCHours() / 4)}`;
    if (!groups.has(slot)) groups.set(slot, []);
    groups.get(slot)!.push(c);
  }
  return Array.from(groups.values()).map(bars => ({
    time: bars[0].time, open: bars[0].open,
    high: Math.max(...bars.map(b => b.high)), low: Math.min(...bars.map(b => b.low)),
    close: bars[bars.length - 1].close, volume: bars.reduce((s, b) => s + b.volume, 0),
  })).filter(c => c.high >= c.low && c.open > 0).sort((a, b) => a.time - b.time);
}

function toCandles(raw: RawCandle[]): Candle[] {
  return raw.map(c => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume }));
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── Test Configurations ──────────────────────────────────────────────────────

type CfgBase = Omit<BacktestConfig, "symbol">;
interface TestConfig { name: string; cfg: CfgBase; tfs: string[]; }

const TESTS: TestConfig[] = [

  // ══════════════════════════════════════════════════════════════════════════
  //  GROUP 1 — EMA CROSSOVER (varied periods & RR)
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: "EMA 5/13 no filter RR1.5",
    tfs: ["H1","H4","D1"],
    cfg: { strategyType: "EMA_CROSSOVER", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { fastPeriod:5, slowPeriod:13, trendPeriod:0, atrPeriod:14, slMultiplier:1.5, rrRatio:1.5, rsiFilter:0, rsiPeriod:14, macdConfirm:false, trailingStop:false } },
  },
  {
    name: "EMA 5/13 no filter RR1.0",
    tfs: ["H1","H4"],
    cfg: { strategyType: "EMA_CROSSOVER", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { fastPeriod:5, slowPeriod:13, trendPeriod:0, atrPeriod:14, slMultiplier:1.0, rrRatio:1.0, rsiFilter:0, rsiPeriod:14, macdConfirm:false, trailingStop:false } },
  },
  {
    name: "EMA 9/21 no trend RR1.5",
    tfs: ["H1","H4","D1"],
    cfg: { strategyType: "EMA_CROSSOVER", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { fastPeriod:9, slowPeriod:21, trendPeriod:0, atrPeriod:14, slMultiplier:1.5, rrRatio:1.5, rsiFilter:0, rsiPeriod:14, macdConfirm:false, trailingStop:false } },
  },
  {
    name: "EMA 9/21 +T200 RR1.5",
    tfs: ["H1","H4","D1"],
    cfg: { strategyType: "EMA_CROSSOVER", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { fastPeriod:9, slowPeriod:21, trendPeriod:200, atrPeriod:14, slMultiplier:1.5, rrRatio:1.5, rsiFilter:0, rsiPeriod:14, macdConfirm:false, trailingStop:false } },
  },
  {
    name: "EMA 9/21 MACD RR1.5",
    tfs: ["H1","H4","D1"],
    cfg: { strategyType: "EMA_CROSSOVER", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { fastPeriod:9, slowPeriod:21, trendPeriod:0, atrPeriod:14, slMultiplier:1.5, rrRatio:1.5, rsiFilter:0, rsiPeriod:14, macdConfirm:true, trailingStop:false } },
  },
  {
    name: "EMA 21/50 no filter RR2.0",
    tfs: ["H1","H4","D1"],
    cfg: { strategyType: "EMA_CROSSOVER", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { fastPeriod:21, slowPeriod:50, trendPeriod:0, atrPeriod:14, slMultiplier:1.5, rrRatio:2.0, rsiFilter:0, rsiPeriod:14, macdConfirm:false, trailingStop:false } },
  },
  {
    name: "EMA 50/200 Golden Cross",
    tfs: ["D1"],
    cfg: { strategyType: "EMA_CROSSOVER", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { fastPeriod:50, slowPeriod:200, trendPeriod:0, atrPeriod:14, slMultiplier:2.0, rrRatio:3.0, rsiFilter:0, rsiPeriod:14, macdConfirm:false, trailingStop:false } },
  },
  {
    name: "EMA 9/21 Trailing Stop",
    tfs: ["H1","H4"],
    cfg: { strategyType: "EMA_CROSSOVER", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { fastPeriod:9, slowPeriod:21, trendPeriod:0, atrPeriod:14, slMultiplier:1.5, rrRatio:2.0, rsiFilter:0, rsiPeriod:14, macdConfirm:false, trailingStop:true } },
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  GROUP 2 — RSI REVERSAL (mean reversion — best for ranging)
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: "RSI 30/70 no filter RR1.5",
    tfs: ["H1","H4","D1"],
    cfg: { strategyType: "RSI_REVERSAL", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { rsiPeriod:14, oversold:30, overbought:70, emaFilter:0, atrPeriod:14, slMultiplier:1.5, rrRatio:1.5, stochConfirm:false, stochK:14, stochD:3, stochOversold:20, stochOverbought:80, bollFilter:false, bollPeriod:20 } },
  },
  {
    name: "RSI 30/70 no filter RR1.0",
    tfs: ["H1","H4"],
    cfg: { strategyType: "RSI_REVERSAL", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { rsiPeriod:14, oversold:30, overbought:70, emaFilter:0, atrPeriod:14, slMultiplier:1.0, rrRatio:1.0, stochConfirm:false, stochK:14, stochD:3, stochOversold:20, stochOverbought:80, bollFilter:false, bollPeriod:20 } },
  },
  {
    name: "RSI 25/75 no filter RR2.0",
    tfs: ["H1","H4","D1"],
    cfg: { strategyType: "RSI_REVERSAL", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { rsiPeriod:14, oversold:25, overbought:75, emaFilter:0, atrPeriod:14, slMultiplier:1.5, rrRatio:2.0, stochConfirm:false, stochK:14, stochD:3, stochOversold:20, stochOverbought:80, bollFilter:false, bollPeriod:20 } },
  },
  {
    name: "RSI 35/65 no filter RR1.5",
    tfs: ["H1","H4"],
    cfg: { strategyType: "RSI_REVERSAL", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { rsiPeriod:14, oversold:35, overbought:65, emaFilter:0, atrPeriod:14, slMultiplier:1.5, rrRatio:1.5, stochConfirm:false, stochK:14, stochD:3, stochOversold:20, stochOverbought:80, bollFilter:false, bollPeriod:20 } },
  },
  {
    name: "RSI 30/70 + Bollinger RR1.5",
    tfs: ["H1","H4","D1"],
    cfg: { strategyType: "RSI_REVERSAL", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { rsiPeriod:14, oversold:30, overbought:70, emaFilter:0, atrPeriod:14, slMultiplier:1.5, rrRatio:1.5, stochConfirm:false, stochK:14, stochD:3, stochOversold:20, stochOverbought:80, bollFilter:true, bollPeriod:20 } },
  },
  {
    name: "RSI 30/70 + Bollinger RR1.0",
    tfs: ["H1","H4"],
    cfg: { strategyType: "RSI_REVERSAL", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { rsiPeriod:14, oversold:30, overbought:70, emaFilter:0, atrPeriod:14, slMultiplier:1.0, rrRatio:1.0, stochConfirm:false, stochK:14, stochD:3, stochOversold:20, stochOverbought:80, bollFilter:true, bollPeriod:20 } },
  },
  {
    name: "RSI 25/75 + Bollinger RR1.5",
    tfs: ["H1","H4","D1"],
    cfg: { strategyType: "RSI_REVERSAL", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { rsiPeriod:14, oversold:25, overbought:75, emaFilter:0, atrPeriod:14, slMultiplier:1.5, rrRatio:1.5, stochConfirm:false, stochK:14, stochD:3, stochOversold:20, stochOverbought:80, bollFilter:true, bollPeriod:20 } },
  },
  {
    name: "RSI 30/70 + Stoch RR1.5",
    tfs: ["H1","H4"],
    cfg: { strategyType: "RSI_REVERSAL", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { rsiPeriod:14, oversold:30, overbought:70, emaFilter:0, atrPeriod:14, slMultiplier:1.5, rrRatio:1.5, stochConfirm:true, stochK:14, stochD:3, stochOversold:25, stochOverbought:75, bollFilter:false, bollPeriod:20 } },
  },
  {
    name: "RSI 30/70 + Stoch + Boll RR1.5",
    tfs: ["H1","H4"],
    cfg: { strategyType: "RSI_REVERSAL", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { rsiPeriod:14, oversold:30, overbought:70, emaFilter:0, atrPeriod:14, slMultiplier:1.5, rrRatio:1.5, stochConfirm:true, stochK:14, stochD:3, stochOversold:25, stochOverbought:75, bollFilter:true, bollPeriod:20 } },
  },
  {
    name: "RSI(7) 25/75 + Boll RR1.5",
    tfs: ["H1","H4"],
    cfg: { strategyType: "RSI_REVERSAL", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { rsiPeriod:7, oversold:25, overbought:75, emaFilter:0, atrPeriod:14, slMultiplier:1.5, rrRatio:1.5, stochConfirm:false, stochK:14, stochD:3, stochOversold:20, stochOverbought:80, bollFilter:true, bollPeriod:20 } },
  },
  {
    name: "RSI(21) 30/70 + Boll RR2.0",
    tfs: ["H1","H4","D1"],
    cfg: { strategyType: "RSI_REVERSAL", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { rsiPeriod:21, oversold:30, overbought:70, emaFilter:0, atrPeriod:14, slMultiplier:1.5, rrRatio:2.0, stochConfirm:false, stochK:14, stochD:3, stochOversold:20, stochOverbought:80, bollFilter:true, bollPeriod:20 } },
  },
  // SL mai mic = mai multe câștiguri mici (scalp-style)
  {
    name: "RSI 30/70 + Boll SL0.7 RR1.5",
    tfs: ["H1"],
    cfg: { strategyType: "RSI_REVERSAL", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { rsiPeriod:14, oversold:30, overbought:70, emaFilter:0, atrPeriod:14, slMultiplier:0.7, rrRatio:1.5, stochConfirm:false, stochK:14, stochD:3, stochOversold:20, stochOverbought:80, bollFilter:true, bollPeriod:20 } },
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  GROUP 3 — TREND FOLLOWING (strict — only on strong trend moments)
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: "TrendF EMA50 ADX30 DiCross RR2.0",
    tfs: ["H1","H4","D1"],
    cfg: { strategyType: "TREND_FOLLOWING", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { emaPeriod:50, emaSlow:0, adxPeriod:14, adxThreshold:30, pullbackBars:5, atrPeriod:14, slMultiplier:1.5, rrRatio:2.0, requireDiCross:true, macdFilter:false, macdFast:12, macdSlow:26, macdSignal:9 } },
  },
  {
    name: "TrendF EMA50 ADX35 DiCross+MACD",
    tfs: ["H1","H4","D1"],
    cfg: { strategyType: "TREND_FOLLOWING", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { emaPeriod:50, emaSlow:200, adxPeriod:14, adxThreshold:35, pullbackBars:3, atrPeriod:14, slMultiplier:1.5, rrRatio:2.0, requireDiCross:true, macdFilter:true, macdFast:12, macdSlow:26, macdSignal:9 } },
  },
  {
    name: "TrendF EMA20 ADX25 MACD RR1.5",
    tfs: ["H1","H4"],
    cfg: { strategyType: "TREND_FOLLOWING", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { emaPeriod:20, emaSlow:0, adxPeriod:14, adxThreshold:25, pullbackBars:3, atrPeriod:14, slMultiplier:1.5, rrRatio:1.5, requireDiCross:false, macdFilter:true, macdFast:12, macdSlow:26, macdSignal:9 } },
  },
  {
    name: "TrendF EMA100 ADX30 DiCross RR3.0",
    tfs: ["H4","D1"],
    cfg: { strategyType: "TREND_FOLLOWING", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { emaPeriod:100, emaSlow:0, adxPeriod:14, adxThreshold:30, pullbackBars:5, atrPeriod:14, slMultiplier:2.0, rrRatio:3.0, requireDiCross:true, macdFilter:false, macdFast:12, macdSlow:26, macdSignal:9 } },
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  GROUP 4 — SESSION BREAKOUT (NY session for EURUSD — Fed/data releases)
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: "NY Breakout SL1.0 RR2.0",
    tfs: ["H1"],
    cfg: { strategyType: "SESSION_BREAKOUT", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { session:"NEW_YORK", slMultiplier:1.0, rrRatio:2.0, atrPeriod:14, minRangePips:0, retestEntry:false, rsiFilter:0 } },
  },
  {
    name: "NY Breakout SL0.5 RR1.5",
    tfs: ["H1"],
    cfg: { strategyType: "SESSION_BREAKOUT", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { session:"NEW_YORK", slMultiplier:0.5, rrRatio:1.5, atrPeriod:14, minRangePips:0, retestEntry:false, rsiFilter:0 } },
  },
  {
    name: "London Breakout minRange20 RR2.0",
    tfs: ["H1"],
    cfg: { strategyType: "SESSION_BREAKOUT", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { session:"LONDON", slMultiplier:1.0, rrRatio:2.0, atrPeriod:14, minRangePips:20, retestEntry:false, rsiFilter:0 } },
  },
  {
    name: "Asian Breakout RR1.5",
    tfs: ["H1"],
    cfg: { strategyType: "SESSION_BREAKOUT", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { session:"ASIAN", slMultiplier:1.0, rrRatio:1.5, atrPeriod:14, minRangePips:0, retestEntry:false, rsiFilter:0 } },
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  GROUP 5 — CUSTOM: Bollinger Band Squeeze (best for ranging markets)
  //  BUY: price touches lower BB AND RSI < 35 → fade the extreme
  //  SELL: price touches upper BB AND RSI > 65 → fade the extreme
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: "Boll Squeeze RSI35 RR1.5",
    tfs: ["H1","H4"],
    cfg: { strategyType: "RSI_REVERSAL", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { rsiPeriod:14, oversold:35, overbought:65, emaFilter:0, atrPeriod:14, slMultiplier:1.5, rrRatio:1.5, stochConfirm:false, stochK:14, stochD:3, stochOversold:20, stochOverbought:80, bollFilter:true, bollPeriod:20 } },
  },
  {
    name: "Boll Squeeze RSI35 SL0.7 RR1.5",
    tfs: ["H1"],
    cfg: { strategyType: "RSI_REVERSAL", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { rsiPeriod:14, oversold:35, overbought:65, emaFilter:0, atrPeriod:14, slMultiplier:0.7, rrRatio:1.5, stochConfirm:false, stochK:14, stochD:3, stochOversold:20, stochOverbought:80, bollFilter:true, bollPeriod:20 } },
  },
  {
    name: "Boll Squeeze RSI40 RR1.0",
    tfs: ["H1","H4"],
    cfg: { strategyType: "RSI_REVERSAL", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { rsiPeriod:14, oversold:40, overbought:60, emaFilter:0, atrPeriod:14, slMultiplier:1.0, rrRatio:1.0, stochConfirm:false, stochK:14, stochD:3, stochOversold:20, stochOverbought:80, bollFilter:true, bollPeriod:20 } },
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  GROUP 6 — CUSTOM: MACD Histogram Reversal (momentum shifts)
  //  Tests EMA Crossover cu MACD confirm și SL mic
  // ══════════════════════════════════════════════════════════════════════════
  {
    name: "EMA 9/21 MACD SL1.0 RR1.0",
    tfs: ["H1","H4"],
    cfg: { strategyType: "EMA_CROSSOVER", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { fastPeriod:9, slowPeriod:21, trendPeriod:0, atrPeriod:14, slMultiplier:1.0, rrRatio:1.0, rsiFilter:0, rsiPeriod:14, macdConfirm:true, trailingStop:false } },
  },
  {
    name: "EMA 9/21 MACD SL1.0 RR1.5",
    tfs: ["H1","H4"],
    cfg: { strategyType: "EMA_CROSSOVER", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { fastPeriod:9, slowPeriod:21, trendPeriod:0, atrPeriod:14, slMultiplier:1.0, rrRatio:1.5, rsiFilter:0, rsiPeriod:14, macdConfirm:true, trailingStop:false } },
  },
  {
    name: "EMA 5/13 MACD SL1.0 RR1.5",
    tfs: ["H1","H4"],
    cfg: { strategyType: "EMA_CROSSOVER", initialBalance: 10000, riskPerTrade: 1, commission: 7, spread: 0.0002,
      rules: { fastPeriod:5, slowPeriod:13, trendPeriod:0, atrPeriod:14, slMultiplier:1.0, rrRatio:1.5, rsiFilter:0, rsiPeriod:14, macdConfirm:true, trailingStop:false } },
  },

];

// ─── Main Runner ──────────────────────────────────────────────────────────────

interface Result {
  name: string; tf: string; trades: number; winRate: number;
  pf: number; pnl: number; dd: number; sharpe: number; profitable: boolean;
}

function bar(label: string, width = 76) { console.log(`\n${"─".repeat(width)}\n${label}\n${"─".repeat(width)}`); }
function pct(n: number) { return `${n.toFixed(1)}%`; }
function pfFmt(n: number) { return n >= 999 ? " ∞  " : n.toFixed(2); }
function pnlFmt(n: number) { const s = n >= 0 ? `+$${n.toFixed(0)}` : `-$${Math.abs(n).toFixed(0)}`; return s.padStart(8); }
function row(r: Result) {
  const icon = r.profitable ? "✅" : r.pf >= 0.9 ? "⚠️ " : "❌";
  console.log(`  ${icon} ${r.name.padEnd(38)} ${r.tf.padEnd(4)} ${String(r.trades).padStart(4)} trades  WR:${pct(r.winRate).padStart(6)}  PF:${pfFmt(r.pf).padStart(5)}  PnL:${pnlFmt(r.pnl)}  DD:${pct(r.dd).padStart(6)}`);
}

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════════════════════╗");
  console.log("║          EURUSD DEEP-DIVE — 35+ configs × H1/H4/D1                     ║");
  console.log("║          Focus: mean reversion, Bollinger, RSI extremes                 ║");
  console.log("╚══════════════════════════════════════════════════════════════════════════╝\n");

  // Fetch data — Yahoo H1 max ~730 days, D1 up to 1500 days
  const now = Math.floor(Date.now() / 1000);
  const from1h = now - 700 * 86400;   // 700 days for H1 (safe limit)
  const fromD1 = now - 1000 * 86400;  // 1000 days for D1

  process.stdout.write("Fetching EURUSD data...");
  const raw1h = await fetchRaw("EURUSD=X", "1h", from1h, now);
  await sleep(900);
  const rawD1 = await fetchRaw("EURUSD=X", "1d", fromD1, now);
  const raw4h = aggregateH4(raw1h);

  const candleMap: Record<string, Candle[]> = {
    H1: toCandles(raw1h),
    H4: toCandles(raw4h),
    D1: toCandles(rawD1),
  };
  console.log(` H1: ${candleMap.H1.length} bars  H4: ${candleMap.H4.length} bars  D1: ${candleMap.D1.length} bars\n`);

  // Determine date ranges per TF
  const dateRange = (candles: Candle[]) => ({ start: candles[0].time, end: candles[candles.length - 1].time });

  const results: Result[] = [];
  let total = 0;
  TESTS.forEach(t => { total += t.tfs.length; });

  let done = 0;
  for (const test of TESTS) {
    for (const tf of test.tfs) {
      const candles = candleMap[tf];
      const { start, end } = dateRange(candles);
      done++;
      process.stdout.write(`\r  Running [${done}/${total}] ${test.name} / ${tf}...          `);
      try {
        const res = runBacktest(candles, { ...test.cfg, symbol: "EURUSD" });
        const m = res.metrics;
        results.push({
          name: test.name, tf,
          trades: m.totalTrades,
          winRate: m.winRate,
          pf: m.profitFactor ?? 0,
          pnl: m.netPnl,
          dd: m.maxDrawdownPct,
          sharpe: m.sharpeRatio ?? 0,
          profitable: m.netPnl > 0 && (m.profitFactor ?? 0) > 1.0 && m.totalTrades >= 3,
        });
      } catch (e) {
        results.push({ name: test.name, tf, trades: 0, winRate: 0, pf: 0, pnl: 0, dd: 0, sharpe: 0, profitable: false });
      }
    }
  }
  console.log("\r" + " ".repeat(70) + "\r");

  // ── Print grouped results ─────────────────────────────────────────────────

  const groups = [
    { label: "GROUP 1 — EMA CROSSOVER", prefix: "EMA" },
    { label: "GROUP 2 — RSI REVERSAL (mean reversion)", prefix: "RSI" },
    { label: "GROUP 3 — TREND FOLLOWING", prefix: "TrendF" },
    { label: "GROUP 4 — SESSION BREAKOUT", prefix: ["NY","London","Asian"] },
    { label: "GROUP 5 — BOLLINGER SQUEEZE", prefix: "Boll" },
    { label: "GROUP 6 — EMA + MACD (tight SL)", prefix: "EMA 9/21 MACD SL" },
  ];

  for (const g of groups) {
    bar(g.label);
    const gResults = results.filter(r => {
      if (Array.isArray(g.prefix)) return g.prefix.some(p => r.name.startsWith(p));
      return r.name.startsWith(g.prefix as string);
    });
    if (gResults.length === 0) continue;
    gResults.forEach(row);
  }

  // ── Top profitable runs ───────────────────────────────────────────────────
  bar("🏆  TOP 15 — EURUSD profitable runs (PF > 1.0, ≥ 3 trades)", 76);
  const profitable = results
    .filter(r => r.pf > 1.0 && r.trades >= 3)
    .sort((a, b) => b.pf - a.pf)
    .slice(0, 15);

  if (profitable.length === 0) {
    console.log("  ⚠️  No profitable configs found with ≥3 trades");
  } else {
    profitable.forEach((r, i) => {
      console.log(`  ${String(i+1).padStart(2)}. ✅ ${r.name.padEnd(38)} ${r.tf.padEnd(4)}  PF:${pfFmt(r.pf).padStart(5)}  WR:${pct(r.winRate).padStart(6)}  PnL:${pnlFmt(r.pnl)}  DD:${pct(r.dd).padStart(6)}  Trades:${r.trades}`);
    });
  }

  // ── Near-miss (PF 0.85-1.0) ───────────────────────────────────────────────
  bar("⚠️   NEAR MISS (PF 0.85–1.0, could be profitable with tweaks)", 76);
  const nearMiss = results
    .filter(r => r.pf >= 0.85 && r.pf < 1.0 && r.trades >= 5)
    .sort((a, b) => b.pf - a.pf)
    .slice(0, 8);
  nearMiss.forEach(r => console.log(`     ${r.name.padEnd(38)} ${r.tf.padEnd(4)}  PF:${pfFmt(r.pf)}  WR:${pct(r.winRate)}  PnL:${pnlFmt(r.pnl)}  Trades:${r.trades}`));

  // ── By timeframe stats ───────────────────────────────────────────────────
  bar("📊  TIMEFRAME COMPARISON (EURUSD)", 76);
  for (const tf of ["H1","H4","D1"]) {
    const tfR = results.filter(r => r.tf === tf && r.trades > 0);
    if (tfR.length === 0) continue;
    const avgPF = tfR.reduce((s, r) => s + r.pf, 0) / tfR.length;
    const avgPnl = tfR.reduce((s, r) => s + r.pnl, 0) / tfR.length;
    const profCount = tfR.filter(r => r.pf > 1.0).length;
    console.log(`  ${tf}:  AvgPF ${avgPF.toFixed(2)}  AvgPnL ${pnlFmt(avgPnl)}  ${profCount}/${tfR.length} profitable`);
  }

  // ── Best strategy TYPE ────────────────────────────────────────────────────
  bar("🔍  STRATEGY TYPE COMPARISON (EURUSD)", 76);
  const typeMap: Record<string, string> = { EMA_CROSSOVER:"EMA Cross", RSI_REVERSAL:"RSI Reversal", TREND_FOLLOWING:"Trend Following", SESSION_BREAKOUT:"Session Breakout" };
  const byType: Record<string, Result[]> = {};
  for (const r of results) {
    const t = TESTS.find(t => t.name === r.name)?.cfg.strategyType ?? "UNKNOWN";
    if (!byType[t]) byType[t] = [];
    byType[t].push(r);
  }
  for (const [type, rs] of Object.entries(byType)) {
    const valid = rs.filter(r => r.trades > 0);
    if (valid.length === 0) continue;
    const avgPF = valid.reduce((s, r) => s + r.pf, 0) / valid.length;
    const avgPnl = valid.reduce((s, r) => s + r.pnl, 0) / valid.length;
    const best = [...valid].sort((a, b) => b.pf - a.pf)[0];
    console.log(`  ${(typeMap[type] ?? type).padEnd(18)}  AvgPF: ${avgPF.toFixed(2)}  AvgPnL: ${pnlFmt(avgPnl)}  Best: ${best.name} (${best.tf}) PF ${pfFmt(best.pf)}`);
  }

  // ── Final recommendation ──────────────────────────────────────────────────
  bar("💡  CONCLUSION & RECOMMENDATIONS FOR EURUSD", 76);
  const topConfig = profitable[0];
  if (topConfig) {
    console.log(`  Best config: "${topConfig.name}" on ${topConfig.tf}`);
    console.log(`  → PF ${pfFmt(topConfig.pf)}  WR ${pct(topConfig.winRate)}  PnL ${pnlFmt(topConfig.pnl)}  DD ${pct(topConfig.dd)}\n`);
  }
  const topByTf: Record<string, Result | undefined> = {};
  for (const tf of ["H1","H4","D1"]) topByTf[tf] = [...results].filter(r => r.tf === tf && r.trades >= 3).sort((a,b) => b.pf - a.pf)[0];
  console.log("  Best per timeframe:");
  for (const [tf, r] of Object.entries(topByTf)) {
    if (r) console.log(`    ${tf}: "${r.name}"  PF ${pfFmt(r.pf)}  WR ${pct(r.winRate)}  PnL ${pnlFmt(r.pnl)}  (${r.trades} trades)`);
  }

  // Save JSON
  const out = path.join(__dirname, "eurusd-results.json");
  fs.writeFileSync(out, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
  console.log(`\n  Full results saved to: ${out}\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
