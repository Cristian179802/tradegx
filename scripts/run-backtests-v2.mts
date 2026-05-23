// ─── Comprehensive Backtest Runner v2 ─────────────────────────────────────────
// Tests all 4 strategies with multiple configs across EURUSD, GBPUSD, USDJPY, XAUUSD
// Timeframes: H1 (365d), H4 (700d aggregated from 1h), D1 (1000d)
// Usage: npx tsx scripts/run-backtests-v2.mts

import { runBacktest } from "../src/lib/backtest-engine.js";
import type { BacktestConfig, Candle, BacktestMetrics } from "../src/lib/backtest-engine.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Yahoo Finance Fetcher (inline) ──────────────────────────────────────────

const SYMBOL_MAP: Record<string, string> = {
  EURUSD: "EURUSD=X",
  GBPUSD: "GBPUSD=X",
  USDJPY: "USDJPY=X",
  XAUUSD: "GC=F",
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

interface RawCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

async function fetchRaw(ticker: string, interval: string, fromSec: number, toSec: number): Promise<RawCandle[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&period1=${fromSec}&period2=${toSec}&includePrePost=false`;
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch(url, {
        headers: { "User-Agent": UA, "Accept": "application/json, */*" },
      });
      if (!resp.ok) {
        lastErr = new Error(`HTTP ${resp.status} for ${ticker}`);
        if (attempt < 2) await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      const json = await resp.json() as {
        chart: {
          result?: Array<{
            timestamp: number[];
            indicators: { quote: Array<{ open: number[]; high: number[]; low: number[]; close: number[]; volume: number[] }> };
          }>;
          error?: { description: string };
        };
      };
      if (json.chart.error) throw new Error(json.chart.error.description);
      const r = json.chart.result?.[0];
      if (!r) throw new Error(`No data for ${ticker}`);
      const q = r.indicators.quote[0];
      const candles: RawCandle[] = [];
      for (let i = 0; i < r.timestamp.length; i++) {
        if (q.open[i] == null || q.close[i] == null || isNaN(q.close[i]) || q.close[i] <= 0) continue;
        if (q.high[i] < q.low[i]) continue;
        candles.push({
          time:   r.timestamp[i] * 1000,
          open:   q.open[i],
          high:   q.high[i],
          low:    q.low[i],
          close:  q.close[i],
          volume: q.volume[i] ?? 0,
        });
      }
      return candles;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      if (attempt < 2) await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw lastErr ?? new Error(`Failed after 3 attempts for ${ticker}`);
}

function resampleH4(candles: RawCandle[]): RawCandle[] {
  if (candles.length === 0) return [];
  const bucketMap = new Map<string, RawCandle[]>();
  for (const c of candles) {
    const d = new Date(c.time);
    const bucketHour = Math.floor(d.getUTCHours() / 4) * 4;
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth()).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}-${bucketHour}`;
    if (!bucketMap.has(key)) bucketMap.set(key, []);
    bucketMap.get(key)!.push(c);
  }
  const result: RawCandle[] = [];
  const sortedKeys = [...bucketMap.keys()].sort();
  for (let ki = 0; ki < sortedKeys.length; ki++) {
    const bucket = bucketMap.get(sortedKeys[ki])!;
    if (ki === 0 && bucket.length < 2) continue; // skip tiny partial first bucket
    result.push({
      time:   bucket[0].time,
      open:   bucket[0].open,
      high:   Math.max(...bucket.map(x => x.high)),
      low:    Math.min(...bucket.map(x => x.low)),
      close:  bucket[bucket.length - 1].close,
      volume: bucket.reduce((s, x) => s + x.volume, 0),
    });
  }
  return result;
}

async function fetchCandles(symbol: string, timeframe: "H1" | "H4" | "D1"): Promise<RawCandle[]> {
  const ticker = SYMBOL_MAP[symbol] ?? `${symbol}=X`;
  const toSec = Math.floor(Date.now() / 1000);

  if (timeframe === "H1") {
    const fromSec = toSec - 365 * 86400;
    return fetchRaw(ticker, "1h", fromSec, toSec);
  }
  if (timeframe === "H4") {
    // Yahoo H1 limit is ~700 days; fetch and resample
    const fromSec = toSec - 700 * 86400;
    const h1 = await fetchRaw(ticker, "1h", fromSec, toSec);
    return resampleH4(h1);
  }
  if (timeframe === "D1") {
    const fromSec = toSec - 1000 * 86400;
    return fetchRaw(ticker, "1d", fromSec, toSec);
  }
  return [];
}

// ─── Spread map per symbol ────────────────────────────────────────────────────

const SPREAD: Record<string, number> = {
  EURUSD: 0.00012,
  GBPUSD: 0.00015,
  USDJPY: 0.012,
  XAUUSD: 0.30,
};

// ─── Strategy Configs ─────────────────────────────────────────────────────────

interface StrategySpec {
  name: string;
  config: Omit<BacktestConfig, "symbol">;
  symbols: string[];
  timeframes: ("H1" | "H4" | "D1")[];
}

const STRATEGIES: StrategySpec[] = [
  // ── EMA Crossover ──────────────────────────────────────────────────────────
  {
    name: "EMA 9/21+T200 Baseline",
    symbols: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"],
    timeframes: ["H1", "H4", "D1"],
    config: {
      strategyType: "EMA_CROSSOVER",
      initialBalance: 10000,
      riskPerTrade: 1.0,
      commission: 7,
      spread: 0.0002, // overridden per symbol below
      rules: {
        fastPeriod: 9, slowPeriod: 21, trendPeriod: 200,
        atrPeriod: 14, slMultiplier: 1.5, rrRatio: 2.0,
        rsiFilter: 0, rsiPeriod: 14, macdConfirm: false, trailingStop: false,
      },
    },
  },
  {
    name: "EMA 9/21+T200 MACD Confirm",
    symbols: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"],
    timeframes: ["H1", "H4", "D1"],
    config: {
      strategyType: "EMA_CROSSOVER",
      initialBalance: 10000,
      riskPerTrade: 1.0,
      commission: 7,
      spread: 0.0002,
      rules: {
        fastPeriod: 9, slowPeriod: 21, trendPeriod: 200,
        atrPeriod: 14, slMultiplier: 1.5, rrRatio: 1.5,
        rsiFilter: 0, rsiPeriod: 14, macdConfirm: true, trailingStop: false,
      },
    },
  },
  {
    name: "EMA 9/21+T200 RSI40",
    symbols: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"],
    timeframes: ["H1", "H4", "D1"],
    config: {
      strategyType: "EMA_CROSSOVER",
      initialBalance: 10000,
      riskPerTrade: 1.0,
      commission: 7,
      spread: 0.0002,
      rules: {
        fastPeriod: 9, slowPeriod: 21, trendPeriod: 200,
        atrPeriod: 14, slMultiplier: 1.5, rrRatio: 2.0,
        rsiFilter: 40, rsiPeriod: 14, macdConfirm: false, trailingStop: false,
      },
    },
  },
  {
    name: "EMA 21/50+T200 Baseline",
    symbols: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"],
    timeframes: ["H1", "H4", "D1"],
    config: {
      strategyType: "EMA_CROSSOVER",
      initialBalance: 10000,
      riskPerTrade: 1.0,
      commission: 7,
      spread: 0.0002,
      rules: {
        fastPeriod: 21, slowPeriod: 50, trendPeriod: 200,
        atrPeriod: 14, slMultiplier: 1.5, rrRatio: 2.0,
        rsiFilter: 0, rsiPeriod: 14, macdConfirm: false, trailingStop: false,
      },
    },
  },

  // ── RSI Reversal ──────────────────────────────────────────────────────────
  {
    name: "RSI 30/70+EMA200 Baseline",
    symbols: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"],
    timeframes: ["H1", "H4", "D1"],
    config: {
      strategyType: "RSI_REVERSAL",
      initialBalance: 10000,
      riskPerTrade: 1.0,
      commission: 7,
      spread: 0.0002,
      rules: {
        rsiPeriod: 14, oversold: 30, overbought: 70,
        emaFilter: 200, atrPeriod: 14, slMultiplier: 1.5, rrRatio: 2.0,
        stochConfirm: false, stochK: 14, stochD: 3, stochOversold: 20, stochOverbought: 80,
        bollFilter: false, bollPeriod: 20,
      },
    },
  },
  {
    name: "RSI 30/70+EMA200 StochConfirm",
    symbols: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"],
    timeframes: ["H1", "H4", "D1"],
    config: {
      strategyType: "RSI_REVERSAL",
      initialBalance: 10000,
      riskPerTrade: 1.0,
      commission: 7,
      spread: 0.0002,
      rules: {
        rsiPeriod: 14, oversold: 30, overbought: 70,
        emaFilter: 200, atrPeriod: 14, slMultiplier: 1.5, rrRatio: 2.0,
        stochConfirm: true, stochK: 14, stochD: 3, stochOversold: 20, stochOverbought: 80,
        bollFilter: false, bollPeriod: 20,
      },
    },
  },
  {
    name: "RSI 25/75 BollFilter",
    symbols: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"],
    timeframes: ["H1", "H4", "D1"],
    config: {
      strategyType: "RSI_REVERSAL",
      initialBalance: 10000,
      riskPerTrade: 1.0,
      commission: 7,
      spread: 0.0002,
      rules: {
        rsiPeriod: 14, oversold: 25, overbought: 75,
        emaFilter: 0, atrPeriod: 14, slMultiplier: 1.5, rrRatio: 2.0,
        stochConfirm: false, stochK: 14, stochD: 3, stochOversold: 20, stochOverbought: 80,
        bollFilter: true, bollPeriod: 20,
      },
    },
  },

  // ── Trend Following ───────────────────────────────────────────────────────
  {
    name: "TrendF EMA50 ADX25 Baseline",
    symbols: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"],
    timeframes: ["H1", "H4", "D1"],
    config: {
      strategyType: "TREND_FOLLOWING",
      initialBalance: 10000,
      riskPerTrade: 1.0,
      commission: 7,
      spread: 0.0002,
      rules: {
        emaPeriod: 50, emaSlow: 0, adxPeriod: 14, adxThreshold: 25,
        pullbackBars: 5, atrPeriod: 14, slMultiplier: 2.0, rrRatio: 2.0,
        requireDiCross: false, macdFilter: false, macdFast: 12, macdSlow: 26, macdSignal: 9,
      },
    },
  },
  {
    name: "TrendF EMA50 ADX30 DiCross",
    symbols: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"],
    timeframes: ["H1", "H4", "D1"],
    config: {
      strategyType: "TREND_FOLLOWING",
      initialBalance: 10000,
      riskPerTrade: 1.0,
      commission: 7,
      spread: 0.0002,
      rules: {
        emaPeriod: 50, emaSlow: 0, adxPeriod: 14, adxThreshold: 30,
        pullbackBars: 5, atrPeriod: 14, slMultiplier: 2.0, rrRatio: 2.0,
        requireDiCross: true, macdFilter: false, macdFast: 12, macdSlow: 26, macdSignal: 9,
      },
    },
  },
  {
    name: "TrendF EMA50 ADX25 MACDFilter",
    symbols: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"],
    timeframes: ["H1", "H4", "D1"],
    config: {
      strategyType: "TREND_FOLLOWING",
      initialBalance: 10000,
      riskPerTrade: 1.0,
      commission: 7,
      spread: 0.0002,
      rules: {
        emaPeriod: 50, emaSlow: 0, adxPeriod: 14, adxThreshold: 25,
        pullbackBars: 5, atrPeriod: 14, slMultiplier: 2.0, rrRatio: 1.5,
        requireDiCross: false, macdFilter: true, macdFast: 12, macdSlow: 26, macdSignal: 9,
      },
    },
  },

  // ── Session Breakout ──────────────────────────────────────────────────────
  {
    name: "LONDON Breakout SL1.0",
    symbols: ["EURUSD", "GBPUSD"],
    timeframes: ["H1"],
    config: {
      strategyType: "SESSION_BREAKOUT",
      initialBalance: 10000,
      riskPerTrade: 1.0,
      commission: 7,
      spread: 0.0002,
      rules: {
        session: "LONDON", slMultiplier: 1.0, rrRatio: 2.0,
        atrPeriod: 14, minRangePips: 0, retestEntry: false, rsiFilter: 0,
      },
    },
  },
  {
    name: "ASIAN Breakout SL1.0 (USDJPY)",
    symbols: ["USDJPY"],
    timeframes: ["H1"],
    config: {
      strategyType: "SESSION_BREAKOUT",
      initialBalance: 10000,
      riskPerTrade: 1.0,
      commission: 7,
      spread: 0.012,
      rules: {
        session: "ASIAN", slMultiplier: 1.0, rrRatio: 2.0,
        atrPeriod: 14, minRangePips: 0, retestEntry: false, rsiFilter: 0,
      },
    },
  },
];

// ─── Result types ─────────────────────────────────────────────────────────────

interface RunResult {
  strategy: string;
  symbol: string;
  timeframe: string;
  bars: number;
  trades: number;
  winRate: number;
  netPnl: number;
  profitFactor: number;
  maxDrawdownPct: number;
  expectancy: number;
  sharpe: number;
  finalBalance: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, dec = 2) { return n.toFixed(dec); }
function pct(n: number) { return n.toFixed(1) + "%"; }
function usd(n: number) { return (n >= 0 ? "+" : "") + "$" + n.toFixed(0); }

function printRow(r: RunResult) {
  const pfStr = r.profitFactor >= 999 ? " 999" : fmt(r.profitFactor);
  console.log(
    `  ${r.strategy.padEnd(36)} ${r.symbol.padEnd(7)} ${r.timeframe.padEnd(4)} ` +
    `${String(r.trades).padStart(4)} trades  WR:${pct(r.winRate).padStart(6)}  ` +
    `PF:${pfStr.padStart(5)}  PnL:${usd(r.netPnl).padStart(8)}  DD:${pct(r.maxDrawdownPct).padStart(6)}`
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════════════════╗");
  console.log("║            TradeGX Backtest Runner v2  —  Comprehensive Suite           ║");
  console.log("╚══════════════════════════════════════════════════════════════════════════╝\n");

  // Pre-fetch candle data (cache by symbol+timeframe)
  const candleCache = new Map<string, Candle[]>();
  const needed = new Set<string>();
  for (const s of STRATEGIES) {
    for (const sym of s.symbols) {
      for (const tf of s.timeframes) {
        needed.add(`${sym}:${tf}`);
      }
    }
  }

  console.log(`Fetching candle data for ${needed.size} symbol+timeframe combinations...\n`);
  const neededArr = [...needed];
  for (let idx = 0; idx < neededArr.length; idx++) {
    const key = neededArr[idx];
    const [sym, tf] = key.split(":") as [string, "H1" | "H4" | "D1"];
    process.stdout.write(`  [${idx + 1}/${neededArr.length}] ${sym} ${tf}... `);
    try {
      const candles = await fetchCandles(sym, tf);
      candleCache.set(key, candles as unknown as Candle[]);
      console.log(`${candles.length} bars`);
    } catch (e) {
      console.log(`FAILED: ${(e as Error).message}`);
    }
    // 800ms delay between fetches to be polite to Yahoo
    if (idx < neededArr.length - 1) await new Promise(r => setTimeout(r, 800));
  }

  // Run backtests
  console.log("\n\n" + "─".repeat(110));
  console.log("BACKTEST RESULTS");
  console.log("─".repeat(110));

  const allResults: RunResult[] = [];
  let totalRuns = 0;
  let successRuns = 0;

  for (const spec of STRATEGIES) {
    for (const sym of spec.symbols) {
      for (const tf of spec.timeframes) {
        const cacheKey = `${sym}:${tf}`;
        const candles = candleCache.get(cacheKey);
        totalRuns++;

        if (!candles || candles.length < 200) {
          console.log(`  ⚠  ${spec.name.padEnd(36)} ${sym.padEnd(7)} ${tf.padEnd(4)} — insufficient data (${candles?.length ?? 0} bars)`);
          continue;
        }

        try {
          const cfgSpread = SPREAD[sym] ?? 0.0002;
          const config: BacktestConfig = {
            ...spec.config,
            symbol: sym,
            spread: cfgSpread,
          };
          const result = runBacktest(candles, config);
          const m = result.metrics;

          const row: RunResult = {
            strategy: spec.name,
            symbol: sym,
            timeframe: tf,
            bars: result.totalBars,
            trades: m.totalTrades,
            winRate: m.winRate,
            netPnl: m.netPnl,
            profitFactor: m.profitFactor,
            maxDrawdownPct: m.maxDrawdownPct,
            expectancy: m.expectancy,
            sharpe: m.sharpeRatio,
            finalBalance: m.finalBalance,
          };
          allResults.push(row);
          printRow(row);
          successRuns++;
        } catch (e) {
          console.log(`  ✗  ${spec.name.padEnd(36)} ${sym.padEnd(7)} ${tf.padEnd(4)} — ERROR: ${(e as Error).message}`);
        }
      }
    }
  }

  console.log(`\n${successRuns}/${totalRuns} backtests completed.\n`);

  // ─── Aggregate stats per config ───────────────────────────────────────────

  interface AggrStats {
    strategy: string;
    runs: number;
    avgPf: number;
    avgWr: number;
    avgPnl: number;
    avgDd: number;
    profitable: number;
  }

  const aggrMap = new Map<string, { pfs: number[]; wrs: number[]; pnls: number[]; dds: number[]; profitable: number }>();
  for (const r of allResults) {
    if (!aggrMap.has(r.strategy)) aggrMap.set(r.strategy, { pfs: [], wrs: [], pnls: [], dds: [], profitable: 0 });
    const a = aggrMap.get(r.strategy)!;
    if (r.profitFactor < 999) a.pfs.push(r.profitFactor);
    a.wrs.push(r.winRate);
    a.pnls.push(r.netPnl);
    a.dds.push(r.maxDrawdownPct);
    if (r.netPnl > 0) a.profitable++;
  }

  const aggrStats: AggrStats[] = [];
  for (const [strategy, data] of aggrMap) {
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    aggrStats.push({
      strategy,
      runs: data.pnls.length,
      avgPf: avg(data.pfs),
      avgWr: avg(data.wrs),
      avgPnl: avg(data.pnls),
      avgDd: avg(data.dds),
      profitable: data.profitable,
    });
  }
  // Sort by avgPf descending
  aggrStats.sort((a, b) => b.avgPf - a.avgPf);

  // ─── Print winner table ───────────────────────────────────────────────────

  console.log("═".repeat(110));
  console.log("TOP 5 CONFIGURATIONS  (sorted by avg Profit Factor)");
  console.log("═".repeat(110));
  console.log(`  ${"Strategy".padEnd(36)} ${"Runs".padStart(4)}  ${"AvgPF".padStart(6)}  ${"AvgWR".padStart(6)}  ${"AvgPnL".padStart(9)}  ${"AvgDD".padStart(6)}  Profit%`);
  console.log("─".repeat(110));

  for (let i = 0; i < Math.min(5, aggrStats.length); i++) {
    const s = aggrStats[i];
    const profPct = s.runs > 0 ? ((s.profitable / s.runs) * 100).toFixed(0) : "0";
    console.log(
      `  ${String(i + 1) + "."} ${s.strategy.padEnd(34)} ${String(s.runs).padStart(4)}  ` +
      `${fmt(s.avgPf).padStart(6)}  ${pct(s.avgWr).padStart(6)}  ` +
      `${usd(s.avgPnl).padStart(9)}  ${pct(s.avgDd).padStart(6)}  ${profPct}%`
    );
  }
  console.log("─".repeat(110));

  // ─── Full ranking ─────────────────────────────────────────────────────────

  console.log("\nFULL STRATEGY RANKING (avg Profit Factor):");
  for (let i = 0; i < aggrStats.length; i++) {
    const s = aggrStats[i];
    const profPct = s.runs > 0 ? ((s.profitable / s.runs) * 100).toFixed(0) : "0";
    console.log(
      `  ${String(i + 1).padStart(2)}. ${s.strategy.padEnd(36)} AvgPF:${fmt(s.avgPf).padStart(6)}` +
      `  AvgWR:${pct(s.avgWr).padStart(6)}  AvgPnL:${usd(s.avgPnl).padStart(8)}  AvgDD:${pct(s.avgDd).padStart(6)}  ${profPct}% profitable`
    );
  }

  // ─── Best individual runs ─────────────────────────────────────────────────

  console.log("\n\nTOP 10 INDIVIDUAL RUNS (by Profit Factor):");
  console.log("─".repeat(110));
  const sortedIndividual = [...allResults]
    .filter(r => r.trades >= 5)
    .sort((a, b) => (b.profitFactor < 999 ? b.profitFactor : 999) - (a.profitFactor < 999 ? a.profitFactor : 999));
  for (let i = 0; i < Math.min(10, sortedIndividual.length); i++) {
    printRow(sortedIndividual[i]);
  }

  // ─── Save JSON ────────────────────────────────────────────────────────────

  const outputPath = path.join(__dirname, "backtest-results.json");
  const outputData = {
    generatedAt: new Date().toISOString(),
    totalRuns,
    successRuns,
    results: allResults,
    aggregated: aggrStats,
    top5: aggrStats.slice(0, 5),
  };
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`\n\nFull results saved to: ${outputPath}`);

  // ─── Analysis summary ─────────────────────────────────────────────────────

  console.log("\n" + "═".repeat(110));
  console.log("ANALYSIS SUMMARY");
  console.log("═".repeat(110));

  if (aggrStats.length > 0) {
    const top = aggrStats[0];
    const bestIndividual = sortedIndividual[0];
    console.log(`\nTop aggregate strategy: ${top.strategy}`);
    console.log(`  → Avg PF: ${fmt(top.avgPf)}  |  Avg WR: ${pct(top.avgWr)}  |  Avg PnL: ${usd(top.avgPnl)}  |  Profitable: ${top.profitable}/${top.runs} runs`);
    if (bestIndividual) {
      console.log(`\nBest single run: ${bestIndividual.strategy} on ${bestIndividual.symbol} ${bestIndividual.timeframe}`);
      console.log(`  → PF: ${fmt(bestIndividual.profitFactor)}  |  WR: ${pct(bestIndividual.winRate)}  |  PnL: ${usd(bestIndividual.netPnl)}  |  Trades: ${bestIndividual.trades}`);
    }

    // Timeframe analysis
    const tfStats: Record<string, { pfs: number[]; pnls: number[] }> = { H1: { pfs: [], pnls: [] }, H4: { pfs: [], pnls: [] }, D1: { pfs: [], pnls: [] } };
    for (const r of allResults) {
      if (r.profitFactor < 999) tfStats[r.timeframe]?.pfs.push(r.profitFactor);
      tfStats[r.timeframe]?.pnls.push(r.netPnl);
    }
    console.log("\nTimeframe comparison:");
    for (const [tf, data] of Object.entries(tfStats)) {
      if (data.pfs.length === 0) continue;
      const avgPf = data.pfs.reduce((a, b) => a + b, 0) / data.pfs.length;
      const avgPnl = data.pnls.reduce((a, b) => a + b, 0) / data.pnls.length;
      console.log(`  ${tf.padEnd(4)} → AvgPF: ${fmt(avgPf)}  AvgPnL: ${usd(avgPnl)}  (${data.pfs.length} runs)`);
    }

    // Symbol analysis
    const symStats: Record<string, { pfs: number[]; pnls: number[] }> = {};
    for (const r of allResults) {
      if (!symStats[r.symbol]) symStats[r.symbol] = { pfs: [], pnls: [] };
      if (r.profitFactor < 999) symStats[r.symbol].pfs.push(r.profitFactor);
      symStats[r.symbol].pnls.push(r.netPnl);
    }
    console.log("\nSymbol comparison:");
    for (const [sym, data] of Object.entries(symStats)) {
      if (data.pfs.length === 0) continue;
      const avgPf = data.pfs.reduce((a, b) => a + b, 0) / data.pfs.length;
      const avgPnl = data.pnls.reduce((a, b) => a + b, 0) / data.pnls.length;
      console.log(`  ${sym.padEnd(7)} → AvgPF: ${fmt(avgPf)}  AvgPnL: ${usd(avgPnl)}  (${data.pfs.length} runs)`);
    }
  }

  console.log("\n" + "═".repeat(110));
  console.log("RECOMMENDED UI SETTINGS (based on backtest results):");
  console.log("─".repeat(110));
  if (aggrStats.length >= 3) {
    const top3 = aggrStats.slice(0, 3);
    top3.forEach((s, i) => {
      console.log(`\n  #${i + 1} ${s.strategy}`);
      // Print matching strategy hint
      if (s.strategy.includes("EMA")) {
        const fast = s.strategy.includes("21/50") ? "21" : "9";
        const slow = s.strategy.includes("21/50") ? "50" : "21";
        console.log(`     Strategy: EMA Crossover  |  Fast EMA: ${fast}  |  Slow EMA: ${slow}  |  Trend EMA: 200`);
        const hasMacd = s.strategy.includes("MACD");
        const hasRsi  = s.strategy.includes("RSI");
        console.log(`     MACD Confirm: ${hasMacd}  |  RSI Filter: ${hasRsi ? "40" : "off"}  |  SL: 1.5×ATR  |  RR: ${hasMacd ? "1.5" : "2.0"}`);
      } else if (s.strategy.includes("RSI")) {
        const isExtreme = s.strategy.includes("25/75");
        console.log(`     Strategy: RSI Reversal  |  Oversold: ${isExtreme ? "25" : "30"}  |  Overbought: ${isExtreme ? "75" : "70"}`);
        console.log(`     EMA Filter: ${s.strategy.includes("EMA200") ? "200" : "off"}  |  Stoch Confirm: ${s.strategy.includes("Stoch") ? "true" : "false"}  |  Boll Filter: ${s.strategy.includes("Boll") ? "true" : "false"}`);
      } else if (s.strategy.includes("TrendF")) {
        console.log(`     Strategy: Trend Following  |  EMA: 50  |  ADX Period: 14  |  ADX Threshold: ${s.strategy.includes("ADX30") ? "30" : "25"}`);
        console.log(`     DI Cross: ${s.strategy.includes("DiCross") ? "true" : "false"}  |  MACD Filter: ${s.strategy.includes("MACD") ? "true" : "false"}  |  Pullback Bars: 5  |  SL: 2×ATR`);
      } else if (s.strategy.includes("Breakout")) {
        console.log(`     Strategy: Session Breakout  |  Session: ${s.strategy.includes("ASIAN") ? "ASIAN" : "LONDON"}  |  SL: 1.0×ATR  |  RR: 2.0`);
      }
    });
  }
  console.log("\n" + "═".repeat(110));
}

main().catch(console.error);
