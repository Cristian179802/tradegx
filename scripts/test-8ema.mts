// Test 8 EMA strategy combinations on EURUSD
// npx tsx scripts/test-8ema.mts

import { runBacktest } from "../src/lib/backtest-engine.js";
import type { Candle } from "../src/lib/backtest-engine.js";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

async function fetchYahoo(ticker: string, interval: string, days: number): Promise<Candle[]> {
  const now = Math.floor(Date.now() / 1000);
  const from = now - days * 86400;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&period1=${from}&period2=${now}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (!r.ok) { if (attempt < 2) { await new Promise(x => setTimeout(x, 1500)); continue; } throw new Error(`HTTP ${r.status}`); }
      const j = await r.json() as { chart: { result?: Array<{ timestamp: number[]; indicators: { quote: Array<{ open: number[]; high: number[]; low: number[]; close: number[]; volume: number[] }> } }> } };
      const res = j.chart.result?.[0]; if (!res) throw new Error("no data");
      const q = res.indicators.quote[0];
      return res.timestamp.map((t, i) => ({ time: t * 1000, open: q.open[i], high: q.high[i], low: q.low[i], close: q.close[i], volume: q.volume[i] ?? 0 }))
        .filter(c => c.close > 0 && c.high >= c.low);
    } catch (e) { if (attempt < 2) await new Promise(x => setTimeout(x, 1500)); else throw e; }
  }
  throw new Error("failed");
}

function aggH4(h1: Candle[]): Candle[] {
  const m = new Map<string, Candle[]>();
  for (const c of h1) {
    const d = new Date(c.time);
    const k = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${Math.floor(d.getUTCHours() / 4)}`;
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(c);
  }
  return [...m.values()]
    .map(b => ({ time: b[0].time, open: b[0].open, high: Math.max(...b.map(x => x.high)), low: Math.min(...b.map(x => x.low)), close: b[b.length - 1].close, volume: 0 }))
    .filter(c => c.high >= c.low && c.open > 0)
    .sort((a, b) => a.time - b.time);
}

// All 8 EMA combinations to test
const TESTS = [
  // 8/13 — fast scalp pair
  { n: "8/13  noT  RR1.0",     sl: 1.5, rr: 1.0, slow: 13, trend: 0,   macd: false },
  { n: "8/13  noT  RR1.5",     sl: 1.5, rr: 1.5, slow: 13, trend: 0,   macd: false },
  { n: "8/13  MACD RR1.0",     sl: 1.5, rr: 1.0, slow: 13, trend: 0,   macd: true  },
  { n: "8/13  MACD RR1.5",     sl: 1.5, rr: 1.5, slow: 13, trend: 0,   macd: true  },
  // 8/21 — classic combination
  { n: "8/21  noT  RR1.0",     sl: 1.5, rr: 1.0, slow: 21, trend: 0,   macd: false },
  { n: "8/21  noT  RR1.5",     sl: 1.5, rr: 1.5, slow: 21, trend: 0,   macd: false },
  { n: "8/21  noT  RR2.0",     sl: 1.5, rr: 2.0, slow: 21, trend: 0,   macd: false },
  { n: "8/21  MACD RR1.0",     sl: 1.5, rr: 1.0, slow: 21, trend: 0,   macd: true  },
  { n: "8/21  MACD RR1.5",     sl: 1.5, rr: 1.5, slow: 21, trend: 0,   macd: true  },
  { n: "8/21  MACD RR2.0",     sl: 1.5, rr: 2.0, slow: 21, trend: 0,   macd: true  },
  { n: "8/21  +T200 RR1.5",    sl: 1.5, rr: 1.5, slow: 21, trend: 200, macd: false },
  { n: "8/21  +T200 MACD 1.5", sl: 1.5, rr: 1.5, slow: 21, trend: 200, macd: true  },
  { n: "8/21  SL0.7 MACD 1.5", sl: 0.7, rr: 1.5, slow: 21, trend: 0,   macd: true  },
  { n: "8/21  SL1.0 MACD 1.5", sl: 1.0, rr: 1.5, slow: 21, trend: 0,   macd: true  },
  // 8/34 — Fibonacci pair
  { n: "8/34  noT  RR1.5",     sl: 1.5, rr: 1.5, slow: 34, trend: 0,   macd: false },
  { n: "8/34  noT  RR2.0",     sl: 1.5, rr: 2.0, slow: 34, trend: 0,   macd: false },
  { n: "8/34  MACD RR1.5",     sl: 1.5, rr: 1.5, slow: 34, trend: 0,   macd: true  },
  { n: "8/34  MACD RR2.0",     sl: 1.5, rr: 2.0, slow: 34, trend: 0,   macd: true  },
  { n: "8/34  +T200 MACD 1.5", sl: 1.5, rr: 1.5, slow: 34, trend: 200, macd: true  },
  // 8/55 — Fibonacci pair slow
  { n: "8/55  noT  RR2.0",     sl: 1.5, rr: 2.0, slow: 55, trend: 0,   macd: false },
  { n: "8/55  MACD RR1.5",     sl: 1.5, rr: 1.5, slow: 55, trend: 0,   macd: true  },
  { n: "8/55  MACD RR2.0",     sl: 1.5, rr: 2.0, slow: 55, trend: 0,   macd: true  },
];

const TFS = ["H1", "H4", "D1"] as const;

const icon = (pf: number, pnl: number) => pf > 1 && pnl > 0 ? "✅" : pf >= 0.9 ? "⚠️ " : "❌";
const pfFmt = (pf: number) => pf >= 999 ? " ∞  " : pf.toFixed(2);
const pnlFmt = (n: number) => (n >= 0 ? `+$${n.toFixed(0)}` : `-$${Math.abs(n).toFixed(0)}`).padStart(8);

interface Res { n: string; tf: string; pf: number; wr: number; pnl: number; dd: number; trades: number; }

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════════════╗");
  console.log("║  EURUSD — 8 EMA strategy: 22 combos × H1 / H4 / D1 (66 tests)  ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝\n");

  process.stdout.write("Fetching EURUSD... ");
  const h1 = await fetchYahoo("EURUSD=X", "1h", 700);
  await new Promise(r => setTimeout(r, 800));
  const d1 = await fetchYahoo("EURUSD=X", "1d", 1000);
  const h4 = aggH4(h1);
  console.log(`H1:${h1.length}  H4:${h4.length}  D1:${d1.length}\n`);

  const cmap: Record<string, Candle[]> = { H1: h1, H4: h4, D1: d1 };
  const results: Res[] = [];

  console.log(`  ${"STRATEGY".padEnd(26)} TF   Trades  WR        PF      PnL       DD`);
  console.log("  " + "─".repeat(72));

  for (const t of TESTS) {
    for (const tf of TFS) {
      const candles = cmap[tf];
      const res = runBacktest(candles, {
        strategyType: "EMA_CROSSOVER",
        symbol: "EURUSD",
        initialBalance: 10000,
        riskPerTrade: 1,
        commission: 7,
        spread: 0.0002,
        rules: {
          fastPeriod: 8, slowPeriod: t.slow, trendPeriod: t.trend,
          atrPeriod: 14, slMultiplier: t.sl, rrRatio: t.rr,
          rsiFilter: 0, rsiPeriod: 14, macdConfirm: t.macd, trailingStop: false,
        },
      });
      const m = res.metrics;
      results.push({ n: t.n, tf, pf: m.profitFactor, wr: m.winRate, pnl: m.netPnl, dd: m.maxDrawdownPct, trades: m.totalTrades });
      console.log(`  ${icon(m.profitFactor, m.netPnl)} ${t.n.padEnd(24)} ${tf.padEnd(4)} ${String(m.totalTrades).padStart(5)}   WR:${m.winRate.toFixed(1).padStart(5)}%  PF:${pfFmt(m.profitFactor).padStart(5)}  ${pnlFmt(m.netPnl)}  DD:${m.maxDrawdownPct.toFixed(1)}%`);
    }
  }

  // Winners
  const wins = results.filter(r => r.pf > 1 && r.pnl > 0 && r.trades >= 3).sort((a, b) => b.pf - a.pf);
  console.log(`\n\n  🏆  PROFITABILE (${wins.length} din ${results.length}):`);
  console.log("  " + "─".repeat(72));
  if (!wins.length) {
    console.log("  Niciun config profitabil cu PF>1 și ≥3 trades.");
  } else {
    wins.forEach((r, i) => console.log(`  ${String(i + 1).padStart(2)}. ✅ ${r.n.padEnd(24)} ${r.tf}  PF:${pfFmt(r.pf)}  WR:${r.wr.toFixed(1)}%  PnL:${pnlFmt(r.pnl)}  DD:${r.dd.toFixed(1)}%  (${r.trades} trades)`));
  }

  // Best by TF
  console.log("\n  📊 CEL MAI BUN PE FIECARE TIMEFRAME:");
  for (const tf of TFS) {
    const best = results.filter(r => r.tf === tf && r.trades >= 3).sort((a, b) => b.pf - a.pf)[0];
    if (best) console.log(`     ${tf}: "${best.n}"  PF:${pfFmt(best.pf)}  WR:${best.wr.toFixed(1)}%  PnL:${pnlFmt(best.pnl)}  (${best.trades} trades)`);
  }

  // Overall best
  const overallBest = [...results].filter(r => r.trades >= 5).sort((a, b) => b.pf - a.pf)[0];
  console.log(`\n  🎯 OVERALL BEST (≥5 trades): "${overallBest?.n}" pe ${overallBest?.tf}`);
  if (overallBest) console.log(`     PF:${pfFmt(overallBest.pf)}  WR:${overallBest.wr.toFixed(1)}%  PnL:${pnlFmt(overallBest.pnl)}  DD:${overallBest.dd.toFixed(1)}%  (${overallBest.trades} trades)\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
