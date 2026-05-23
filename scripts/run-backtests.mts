// ─── Backtest Runner Script ────────────────────────────────────────────────────
// Fetches 1 year of H1 data from Yahoo Finance and runs all 4 strategies
// Usage: npx tsx scripts/run-backtests.mts

import { runBacktest } from "../src/lib/backtest-engine.js";
import type { BacktestConfig, Candle, BacktestMetrics } from "../src/lib/backtest-engine.js";

// ─── Yahoo Finance Fetcher (inline, no import issues) ────────────────────────

const SYMBOL_MAP: Record<string, string> = {
  EURUSD: "EURUSD=X", GBPUSD: "GBPUSD=X", XAUUSD: "GC=F",
  NAS100: "NQ=F", BTCUSD: "BTC-USD", USDJPY: "USDJPY=X",
};

interface Candle_ { time: number; open: number; high: number; low: number; close: number; volume: number; }

async function fetchCandles(symbol: string, days = 365): Promise<Candle_[]> {
  const ticker = SYMBOL_MAP[symbol] ?? symbol;
  const to = Math.floor(Date.now() / 1000);
  const from = to - days * 86400;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1h&period1=${from}&period2=${to}&events=history`;

  let resp: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      resp = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
        },
      });
      if (resp.ok) break;
    } catch (e) {
      if (attempt === 2) throw e;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  if (!resp?.ok) throw new Error(`HTTP ${resp?.status} for ${symbol}`);

  const json = await resp.json() as {
    chart: {
      result: Array<{
        timestamp: number[];
        indicators: {
          quote: Array<{ open: number[]; high: number[]; low: number[]; close: number[]; volume: number[] }>;
        };
      }>;
      error?: { description: string };
    };
  };

  if (json.chart.error) throw new Error(json.chart.error.description);
  const r = json.chart.result?.[0];
  if (!r) throw new Error(`No data for ${symbol}`);

  const q = r.indicators.quote[0];
  const candles: Candle_[] = [];
  for (let i = 0; i < r.timestamp.length; i++) {
    if (q.open[i] == null || q.close[i] == null) continue;
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
}

// ─── Strategy Configs to Test ────────────────────────────────────────────────

const STRATEGIES: { name: string; config: BacktestConfig }[] = [
  // 1. EMA Crossover — classic 9/21 with 200 trend filter
  {
    name: "EMA 9/21 + Trend200",
    config: {
      strategyType: "EMA_CROSSOVER",
      symbol: "EURUSD",
      initialBalance: 10000,
      riskPerTrade: 1.0,
      commission: 7,
      spread: 0.0002,
      rules: {
        fastPeriod: 9, slowPeriod: 21, trendPeriod: 200,
        atrPeriod: 14, slMultiplier: 1.5, rrRatio: 2.0,
        rsiFilter: 0, rsiPeriod: 14, macdConfirm: false, trailingStop: false,
      },
    },
  },
  // 2. EMA Crossover — aggressive 5/13 no filter
  {
    name: "EMA 5/13 Aggresiv",
    config: {
      strategyType: "EMA_CROSSOVER",
      symbol: "EURUSD",
      initialBalance: 10000,
      riskPerTrade: 1.0,
      commission: 7,
      spread: 0.0002,
      rules: {
        fastPeriod: 5, slowPeriod: 13, trendPeriod: 0,
        atrPeriod: 14, slMultiplier: 1.2, rrRatio: 1.5,
        rsiFilter: 0, rsiPeriod: 14, macdConfirm: false, trailingStop: false,
      },
    },
  },
  // 3. EMA Crossover cu trailing stop
  {
    name: "EMA 9/21 Trailing Stop",
    config: {
      strategyType: "EMA_CROSSOVER",
      symbol: "EURUSD",
      initialBalance: 10000,
      riskPerTrade: 1.0,
      commission: 7,
      spread: 0.0002,
      rules: {
        fastPeriod: 9, slowPeriod: 21, trendPeriod: 200,
        atrPeriod: 14, slMultiplier: 1.5, rrRatio: 2.0,
        rsiFilter: 0, rsiPeriod: 14, macdConfirm: false, trailingStop: true,
      },
    },
  },
  // 4. RSI Reversal — standard
  {
    name: "RSI Reversal 30/70",
    config: {
      strategyType: "RSI_REVERSAL",
      symbol: "EURUSD",
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
  // 5. RSI cu nivele mai extreme
  {
    name: "RSI Reversal 20/80 Extreme",
    config: {
      strategyType: "RSI_REVERSAL",
      symbol: "EURUSD",
      initialBalance: 10000,
      riskPerTrade: 1.0,
      commission: 7,
      spread: 0.0002,
      rules: {
        rsiPeriod: 14, oversold: 20, overbought: 80,
        emaFilter: 0, atrPeriod: 14, slMultiplier: 2.0, rrRatio: 2.5,
        stochConfirm: false, stochK: 14, stochD: 3, stochOversold: 20, stochOverbought: 80,
        bollFilter: false, bollPeriod: 20,
      },
    },
  },
  // 6. Trend Following cu ADX
  {
    name: "Trend Following ADX>25",
    config: {
      strategyType: "TREND_FOLLOWING",
      symbol: "EURUSD",
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
  // 7. Session Breakout — London
  {
    name: "London Breakout",
    config: {
      strategyType: "SESSION_BREAKOUT",
      symbol: "GBPUSD",
      initialBalance: 10000,
      riskPerTrade: 1.0,
      commission: 7,
      spread: 0.0002,
      rules: {
        session: "LONDON", slMultiplier: 1.5, rrRatio: 2.0,
        atrPeriod: 14, minRangePips: 0, retestEntry: false, rsiFilter: 0,
      },
    },
  },
  // 8. Session Breakout — New York
  {
    name: "New York Breakout",
    config: {
      strategyType: "SESSION_BREAKOUT",
      symbol: "GBPUSD",
      initialBalance: 10000,
      riskPerTrade: 1.0,
      commission: 7,
      spread: 0.0002,
      rules: {
        session: "NEW_YORK", slMultiplier: 1.5, rrRatio: 2.0,
        atrPeriod: 14, minRangePips: 0, retestEntry: false, rsiFilter: 0,
      },
    },
  },
  // 9. EMA Crossover pe XAUUSD (Gold)
  {
    name: "EMA 9/21 pe GOLD",
    config: {
      strategyType: "EMA_CROSSOVER",
      symbol: "XAUUSD",
      initialBalance: 10000,
      riskPerTrade: 1.0,
      commission: 7,
      spread: 0.5,
      rules: {
        fastPeriod: 9, slowPeriod: 21, trendPeriod: 200,
        atrPeriod: 14, slMultiplier: 1.5, rrRatio: 2.0,
        rsiFilter: 0, rsiPeriod: 14, macdConfirm: false, trailingStop: false,
      },
    },
  },
  // 10. Custom: RSI + EMA confluence (RSI crosses above 30 AND price above EMA50)
  {
    name: "Custom: RSI+EMA Confluence",
    config: {
      strategyType: "CUSTOM",
      symbol: "EURUSD",
      initialBalance: 10000,
      riskPerTrade: 1.0,
      commission: 7,
      spread: 0.0002,
      rules: {
        entryLong: [
          { id: "1", left: { type: "RSI", period: 14 }, op: "crosses_above", right: { type: "VALUE", value: 30 } },
          { id: "2", left: { type: "CLOSE" }, op: "is_above", right: { type: "EMA", period: 50 } },
        ],
        entryShort: [
          { id: "3", left: { type: "RSI", period: 14 }, op: "crosses_below", right: { type: "VALUE", value: 70 } },
          { id: "4", left: { type: "CLOSE" }, op: "is_below", right: { type: "EMA", period: 50 } },
        ],
        slMultiplier: 1.5, rrRatio: 2.0,
        trendFilter: { enabled: true, type: "EMA", period: 200 },
        atrPeriod: 14,
      },
    },
  },
];

// ─── Pretty Print ────────────────────────────────────────────────────────────

function pct(v: number) { return v.toFixed(1) + "%"; }
function usd(v: number) { return (v >= 0 ? "+" : "") + "$" + v.toFixed(2); }
function rating(m: BacktestMetrics): string {
  let score = 0;
  if (m.winRate >= 50) score++;
  if (m.profitFactor >= 1.5) score++;
  if (m.netPnl > 0) score++;
  if (m.maxDrawdownPct < 15) score++;
  if (m.expectancy > 0) score++;
  if (score >= 5) return "⭐⭐⭐ EXCELENT";
  if (score >= 4) return "⭐⭐ BUN";
  if (score >= 3) return "⭐ MEDIU";
  return "❌ SLAB";
}

function printResult(name: string, symbol: string, m: BacktestMetrics, bars: number) {
  const arrow = m.netPnl > 0 ? "📈" : "📉";
  console.log(`\n${"─".repeat(60)}`);
  console.log(`${arrow} ${name} (${symbol})`);
  console.log(`${"─".repeat(60)}`);
  console.log(`  Trades:       ${m.totalTrades}  (${m.wins}W / ${m.losses}L)  |  Bare: ${bars}`);
  console.log(`  Win Rate:     ${pct(m.winRate)}   |  Profit Factor: ${m.profitFactor}`);
  console.log(`  Net P&L:      ${usd(m.netPnl)}   |  Final Bal: $${m.finalBalance.toFixed(2)}`);
  console.log(`  Expectancy:   ${usd(m.expectancy)}/trade   |  Avg RR: ${m.avgRR}`);
  console.log(`  Max DD:       ${pct(m.maxDrawdownPct)} ($${m.maxDrawdown.toFixed(0)})`);
  console.log(`  Sharpe:       ${m.sharpeRatio}   |  Sortino: ${m.sortinoRatio}`);
  console.log(`  Best/Worst:   ${usd(m.bestTrade)} / ${usd(m.worstTrade)}`);
  console.log(`  Commission:   $${m.totalCommission.toFixed(2)} total`);
  console.log(`  RATING:       ${rating(m)}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║       TradeGx Backtest Runner — 365 zile H1             ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  // Pre-fetch candles (cache per symbol)
  const candleCache = new Map<string, Candle[]>();
  const symbols = [...new Set(STRATEGIES.map(s => s.config.symbol))];

  console.log(`\nFetching date pentru: ${symbols.join(", ")}...`);
  for (const sym of symbols) {
    process.stdout.write(`  ${sym}... `);
    try {
      const candles = await fetchCandles(sym, 365);
      candleCache.set(sym, candles as unknown as Candle[]);
      console.log(`${candles.length} bare`);
    } catch (e) {
      console.log(`EROARE: ${(e as Error).message}`);
    }
    await new Promise(r => setTimeout(r, 600)); // politicos cu Yahoo
  }

  // Run backtests
  console.log("\n\nRezultate Backtesting:");

  const summary: { name: string; pnl: number; wr: number; pf: number; dd: number; rating: string }[] = [];

  for (const { name, config } of STRATEGIES) {
    const candles = candleCache.get(config.symbol);
    if (!candles || candles.length < 100) {
      console.log(`\n⚠️  ${name}: date insuficiente`);
      continue;
    }

    try {
      const result = runBacktest(candles as Candle[], config);
      printResult(name, config.symbol, result.metrics, result.totalBars);
      summary.push({
        name,
        pnl: result.metrics.netPnl,
        wr: result.metrics.winRate,
        pf: result.metrics.profitFactor,
        dd: result.metrics.maxDrawdownPct,
        rating: rating(result.metrics),
      });
    } catch (e) {
      console.log(`\n❌ ${name}: ${(e as Error).message}`);
    }
  }

  // Final ranking
  console.log("\n\n" + "═".repeat(60));
  console.log("CLASAMENT FINAL (sortate după P&L Net)");
  console.log("═".repeat(60));
  summary.sort((a, b) => b.pnl - a.pnl);
  summary.forEach((s, i) => {
    console.log(`${i + 1}. ${s.name.padEnd(35)} ${s.rating.padEnd(20)} P&L: ${usd(s.pnl)} | WR: ${pct(s.wr)} | DD: ${pct(s.dd)}`);
  });

  const profitable = summary.filter(s => s.pnl > 0);
  console.log(`\n✅ Profitabile: ${profitable.length}/${summary.length}`);
}

main().catch(console.error);
