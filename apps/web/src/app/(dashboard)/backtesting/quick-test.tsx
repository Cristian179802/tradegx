"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart2,
  Loader2,
  Play,
  TrendingUp,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

// ── Testează instant ────────────────────────────────────────────────────────
// Rulează un backtest REAL (date Yahoo) în 3 click-uri, fără configurare:
// alegi strategia → simbolul → perioada. Strategia „⚡" se creează automat cu
// parametri validați și se reutilizează la rulările următoare.
// Perioadele sunt limitate per timeframe la ce POATE livra Yahoo (M15 max
// ~55 zile, H1 max ~700 zile) — zero rulări eșuate din date insuficiente.

const PRESETS = [
  {
    type: "EMA_CROSSOVER",
    name: "EMA Crossover",
    icon: TrendingUp,
    color: "#6366f1",
    desc: "Intersecția mediilor 9/21 cu filtru de trend 200. Clasicul care prinde tendințele.",
    rules: {
      fastPeriod: 9, slowPeriod: 21, trendPeriod: 200,
      atrPeriod: 14, slMultiplier: 1.5, rrRatio: 2.0,
      rsiFilter: 0, rsiPeriod: 14, macdConfirm: false, trailingStop: false,
    },
  },
  {
    type: "RSI_REVERSAL",
    name: "RSI Reversal",
    icon: Activity,
    color: "#a78bfa",
    desc: "Cumpără oversold, vinde overbought — cu filtru EMA 50. Pentru piețe în range.",
    rules: {
      rsiPeriod: 14, oversold: 30, overbought: 70, emaFilter: 50,
      atrPeriod: 14, slMultiplier: 1.5, rrRatio: 2.0,
      stochConfirm: false, stochK: 14, stochD: 3, stochOversold: 20, stochOverbought: 80,
      bollFilter: false, bollPeriod: 20,
    },
  },
  {
    type: "SESSION_BREAKOUT",
    name: "London Breakout",
    icon: Zap,
    color: "#f59e0b",
    desc: "Sparge range-ul sesiunii Asia la deschiderea Londrei. Preferatul intraday.",
    rules: {
      session: "LONDON", slMultiplier: 1.0, rrRatio: 2.0,
      atrPeriod: 14, minRangePips: 0, retestEntry: false, rsiFilter: 0,
    },
  },
  {
    type: "TREND_FOLLOWING",
    name: "Trend Following",
    icon: BarChart2,
    color: "#34d399",
    desc: "Pullback la EMA 50 în trend confirmat de ADX. Intră doar când trendul e real.",
    rules: {
      emaPeriod: 50, emaSlow: 0, adxPeriod: 14, adxThreshold: 25, pullbackBars: 3,
      atrPeriod: 14, slMultiplier: 1.5, rrRatio: 2.0,
      requireDiCross: false, macdFilter: false, macdFast: 12, macdSlow: 26, macdSignal: 9,
    },
  },
] as const;

const QUICK_SYMBOLS = ["EURUSD", "XAUUSD", "GBPUSD", "USDJPY", "BTCUSD", "US30"];

const ALL_SYMBOLS: { group: string; symbols: string[] }[] = [
  { group: "Forex Majors", symbols: ["EURUSD","GBPUSD","USDJPY","USDCHF","AUDUSD","NZDUSD","USDCAD"] },
  { group: "Forex Minors", symbols: ["EURGBP","EURJPY","GBPJPY","EURCAD","EURCHF","GBPCHF","EURAUD","GBPAUD","AUDCAD","AUDNZD","CADJPY","CHFJPY","NZDJPY","GBPNZD"] },
  { group: "Metale", symbols: ["XAUUSD","XAGUSD","XPTUSD"] },
  { group: "Indici", symbols: ["US30","NAS100","SP500","US2000"] },
  { group: "Crypto", symbols: ["BTCUSD","ETHUSD","BNBUSD","SOLUSD","XRPUSD"] },
  { group: "Energie", symbols: ["CRUDE","BRENT","NATGAS"] },
];

// Perioade VALIDE per timeframe (limitele reale ale datelor Yahoo)
const TF_PERIODS: Record<string, { days: number; label: string }[]> = {
  M15: [
    { days: 30, label: "1 lună" },
    { days: 55, label: "2 luni" },
  ],
  H1: [
    { days: 90, label: "3 luni" },
    { days: 180, label: "6 luni" },
    { days: 365, label: "1 an" },
    { days: 690, label: "2 ani" },
  ],
  H4: [
    { days: 180, label: "6 luni" },
    { days: 365, label: "1 an" },
    { days: 690, label: "2 ani" },
  ],
  D1: [
    { days: 365, label: "1 an" },
    { days: 1095, label: "3 ani" },
    { days: 1825, label: "5 ani" },
  ],
};

const TFS = ["M15", "H1", "H4", "D1"] as const;

interface ExistingStrategy {
  id: string;
  name: string;
  type: string;
}

export function QuickTest({ strategies }: { strategies: ExistingStrategy[] }) {
  const router = useRouter();
  const { toast } = useToast();

  const [preset, setPreset] = React.useState<(typeof PRESETS)[number]>(PRESETS[0]);
  const [symbol, setSymbol] = React.useState("EURUSD");
  const [tf, setTf] = React.useState<string>("H1");
  const [days, setDays] = React.useState(180);
  const [running, setRunning] = React.useState(false);

  const periods = TF_PERIODS[tf] ?? TF_PERIODS.H1;

  // La schimbarea timeframe-ului, perioada rămâne mereu una validă
  const changeTf = (newTf: string) => {
    setTf(newTf);
    const allowed = TF_PERIODS[newTf] ?? TF_PERIODS.H1;
    if (!allowed.some((p) => p.days === days)) {
      setDays(allowed[Math.min(1, allowed.length - 1)].days);
    }
  };

  async function run() {
    setRunning(true);
    try {
      // 1. Reutilizează strategia rapidă existentă sau creeaz-o acum
      let strategyId = strategies.find(
        (s) => s.type === preset.type && s.name.startsWith("⚡")
      )?.id;

      if (!strategyId) {
        const createRes = await fetch("/api/backtesting/strategies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `⚡ ${preset.name} — Test rapid`,
            type: preset.type,
            color: preset.color,
            description: preset.desc,
            rules: preset.rules,
          }),
        });
        if (!createRes.ok) throw new Error("Nu am putut crea strategia.");
        const created = await createRes.json();
        strategyId = created.id as string;
      }

      // 2. Rulează pe date reale
      const end = new Date();
      const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

      const runRes = await fetch("/api/backtesting/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategyId,
          symbol,
          timeframe: tf,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          initialBalance: 10000,
          commission: 7,
          spread: 0.0002,
          riskPerTrade: 1,
        }),
      });
      const result = await runRes.json();

      if (result.error) {
        toast({
          title: "Backtest eșuat",
          description: String(result.error),
          variant: "destructive",
        });
        router.refresh();
        return;
      }

      router.push(`/backtesting/results/${result.backtestId}`);
    } catch (err) {
      toast({
        title: "Eroare",
        description: err instanceof Error ? err.message : "Încearcă din nou.",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="relative rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/[0.07] via-zinc-900/80 to-zinc-900/80 p-5 overflow-hidden">
      {/* Linie neon sus */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-4 h-4 text-indigo-400" />
        <h2 className="text-sm font-black text-zinc-100 uppercase tracking-wide">
          Testează instant
        </h2>
        <span className="text-[10px] font-bold text-indigo-400/80 border border-indigo-500/30 rounded-full px-2 py-0.5">
          fără configurare
        </span>
      </div>
      <p className="text-xs text-zinc-500 mb-4">
        Alege o strategie, un simbol și o perioadă — rulăm pe date istorice reale în câteva secunde.
      </p>

      {/* 1. Strategia */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
        {PRESETS.map((p) => {
          const Icon = p.icon;
          const active = preset.type === p.type;
          return (
            <button
              key={p.type}
              onClick={() => setPreset(p)}
              className={cn(
                "text-left rounded-xl border p-3 transition-all",
                active
                  ? "border-indigo-500/60 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                  : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700"
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${p.color}22`, border: `1px solid ${p.color}55` }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: p.color }} />
                </div>
                <span className={cn("text-xs font-bold", active ? "text-zinc-100" : "text-zinc-300")}>
                  {p.name}
                </span>
              </div>
              <p className="text-[10px] leading-relaxed text-zinc-500 line-clamp-2">{p.desc}</p>
            </button>
          );
        })}
      </div>

      {/* 2. Simbol + Timeframe + Perioadă */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5">Simbol</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {QUICK_SYMBOLS.map((s) => (
              <button
                key={s}
                onClick={() => setSymbol(s)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors",
                  symbol === s
                    ? "border-indigo-500/60 bg-indigo-500/15 text-indigo-300"
                    : "border-zinc-800 bg-zinc-950/40 text-zinc-500 hover:text-zinc-300"
                )}
              >
                {s}
              </button>
            ))}
            <select
              value={QUICK_SYMBOLS.includes(symbol) ? "" : symbol}
              onChange={(e) => e.target.value && setSymbol(e.target.value)}
              className={cn(
                "px-2 py-1 rounded-lg text-[11px] font-bold border bg-zinc-950/60 outline-none cursor-pointer",
                !QUICK_SYMBOLS.includes(symbol)
                  ? "border-indigo-500/60 text-indigo-300"
                  : "border-zinc-800 text-zinc-500"
              )}
            >
              <option value="">altele…</option>
              {ALL_SYMBOLS.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.symbols.filter((s) => !QUICK_SYMBOLS.includes(s)).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5">Timeframe</p>
          <div className="flex gap-1.5">
            {TFS.map((t) => (
              <button
                key={t}
                onClick={() => changeTf(t)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors",
                  tf === t
                    ? "border-indigo-500/60 bg-indigo-500/15 text-indigo-300"
                    : "border-zinc-800 bg-zinc-950/40 text-zinc-500 hover:text-zinc-300"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5">Perioadă</p>
          <div className="flex gap-1.5">
            {periods.map((p) => (
              <button
                key={p.days}
                onClick={() => setDays(p.days)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors",
                  days === p.days
                    ? "border-indigo-500/60 bg-indigo-500/15 text-indigo-300"
                    : "border-zinc-800 bg-zinc-950/40 text-zinc-500 hover:text-zinc-300"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Rulează */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] text-zinc-600">
          {preset.name} · {symbol} · {tf} · {periods.find((p) => p.days === days)?.label} ·
          cont 10.000$ · risc 1%/trade — poți rafina totul din builderul complet.
        </p>
        <button
          onClick={run}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-60"
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Rulează pe date reale…
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Rulează backtest-ul
            </>
          )}
        </button>
      </div>
    </div>
  );
}
