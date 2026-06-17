"use client";

import * as React from "react";
import { Gauge, Dices, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Activity, Grid3x3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CorrelationHeatmap } from "@/components/tools/correlation-heatmap";

// ════════════════════════════════════════════════════════════════════════════
// CURRENCY STRENGTH METER
// ════════════════════════════════════════════════════════════════════════════

const STRENGTH_PAIRS = ["EUR/USD", "GBP/USD", "AUD/USD", "NZD/USD", "USD/JPY", "USD/CHF", "USD/CAD"];
const CCY_FLAGS: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵", CHF: "🇨🇭", AUD: "🇦🇺", CAD: "🇨🇦", NZD: "🇳🇿",
};

function CurrencyStrength() {
  const [strengths, setStrengths] = React.useState<{ ccy: string; value: number }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [updated, setUpdated] = React.useState<string>("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/integrations/twelvedata/quote?symbols=${encodeURIComponent(STRENGTH_PAIRS.join(","))}`,
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const data = await res.json();
      const quotes: Record<string, { percent_change?: string }> = data.quotes ?? {};

      const acc: Record<string, number> = {};
      const cnt: Record<string, number> = {};
      for (const pair of STRENGTH_PAIRS) {
        const q = quotes[pair];
        if (!q || q.percent_change == null) continue;
        const pct = Number(q.percent_change);
        if (!Number.isFinite(pct)) continue;
        const [base, quote] = pair.split("/");
        acc[base] = (acc[base] ?? 0) + pct; cnt[base] = (cnt[base] ?? 0) + 1;
        acc[quote] = (acc[quote] ?? 0) - pct; cnt[quote] = (cnt[quote] ?? 0) + 1;
      }
      const result = Object.keys(CCY_FLAGS)
        .map((ccy) => ({ ccy, value: cnt[ccy] ? acc[ccy] / cnt[ccy] : 0 }))
        .sort((a, b) => b.value - a.value);

      if (result.some((r) => r.value !== 0)) {
        setStrengths(result);
        setUpdated(new Date().toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const maxAbs = Math.max(...strengths.map((s) => Math.abs(s.value)), 0.1);

  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/80 p-5 premium-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/12 border border-emerald-500/20 flex items-center justify-center">
            <Gauge className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-200">Forța Valutelor</h2>
            <p className="text-[11px] text-zinc-600">Ce monede sunt puternice/slabe acum</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="text-zinc-500 hover:text-zinc-300 transition-colors" title="Reîmprospătează">
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {loading && strengths.length === 0 ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-7 bg-zinc-800/50 rounded animate-pulse" />)}</div>
      ) : strengths.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-8">Date indisponibile momentan.</p>
      ) : (
        <div className="space-y-2">
          {strengths.map((s, i) => {
            const pos = s.value >= 0;
            const widthPct = (Math.abs(s.value) / maxAbs) * 50; // 50% = jumătate, centrat
            return (
              <div key={s.ccy} className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-400 w-12 shrink-0">{CCY_FLAGS[s.ccy]} {s.ccy}</span>
                {/* Bară centrată: slab în stânga (roșu), puternic în dreapta (verde) */}
                <div className="flex-1 flex items-center h-6">
                  <div className="w-1/2 flex justify-end">
                    {!pos && <div className="h-2.5 rounded-l-full bg-gradient-to-l from-rose-500 to-rose-600" style={{ width: `${widthPct * 2}%` }} />}
                  </div>
                  <div className="w-px h-4 bg-zinc-700 shrink-0" />
                  <div className="w-1/2 flex justify-start">
                    {pos && <div className="h-2.5 rounded-r-full bg-gradient-to-r from-emerald-500 to-emerald-600" style={{ width: `${widthPct * 2}%` }} />}
                  </div>
                </div>
                <span className={cn("text-[11px] font-bold num w-12 text-right shrink-0", pos ? "text-emerald-400" : "text-rose-400")}>
                  {pos ? "+" : ""}{s.value.toFixed(2)}
                </span>
                {i === 0 && <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />}
                {i === strengths.length - 1 && <TrendingDown className="w-3 h-3 text-rose-400 shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
      {updated && <p className="text-[10px] text-zinc-600 mt-3 text-right">Actualizat {updated} · scor relativ pe variația zilei</p>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// RISK OF RUIN CALCULATOR (Monte Carlo)
// ════════════════════════════════════════════════════════════════════════════

function simulateRoR(winRate: number, riskPct: number, rr: number, drawdownPct: number, trades: number, sims = 5000): number {
  const ruinLevel = 1 - drawdownPct / 100; // ex 50% → 0.5
  const winFrac = winRate / 100;
  const r = riskPct / 100;
  let ruined = 0;
  for (let s = 0; s < sims; s++) {
    let bal = 1;
    for (let t = 0; t < trades; t++) {
      if (Math.random() < winFrac) bal *= 1 + r * rr;
      else bal *= 1 - r;
      if (bal <= ruinLevel) { ruined++; break; }
    }
  }
  return (ruined / sims) * 100;
}

function RiskOfRuin() {
  const [winRate, setWinRate] = React.useState(50);
  const [riskPct, setRiskPct] = React.useState(1);
  const [rr, setRr] = React.useState(2);
  const [drawdown, setDrawdown] = React.useState(50);
  const [trades, setTrades] = React.useState(200);

  const ror = React.useMemo(
    () => simulateRoR(winRate, riskPct, rr, drawdown, trades),
    [winRate, riskPct, rr, drawdown, trades]
  );

  // Expectanță pe trade (în R)
  const expectancy = (winRate / 100) * rr - (1 - winRate / 100);
  const edgeColor = expectancy > 0 ? "text-emerald-400" : expectancy < 0 ? "text-rose-400" : "text-zinc-400";

  const rorColor = ror < 1 ? "text-emerald-400" : ror < 10 ? "text-amber-400" : "text-rose-400";
  const rorLabel = ror < 1 ? "Foarte scăzut — sustenabil" : ror < 10 ? "Moderat — atenție la sizing" : ror < 30 ? "Ridicat — reduce riscul" : "Periculos — vei pierde contul";

  const Field = ({ label, value, min, max, step, suffix, onChange }: {
    label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (v: number) => void;
  }) => (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs text-zinc-400 font-medium">{label}</label>
        <span className="text-sm font-bold text-indigo-300 num bg-indigo-500/10 px-2 py-0.5 rounded-md">{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-indigo-500" />
    </div>
  );

  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/80 p-5 premium-card">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-rose-500/12 border border-rose-500/20 flex items-center justify-center">
          <Dices className="w-4 h-4 text-rose-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-zinc-200">Risc de Ruină</h2>
          <p className="text-[11px] text-zinc-600">Probabilitatea de a-ți distruge contul</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4 mb-5">
        <Field label="Win Rate" value={winRate} min={10} max={90} step={1} suffix="%" onChange={setWinRate} />
        <Field label="Risc per trade" value={riskPct} min={0.25} max={10} step={0.25} suffix="%" onChange={setRiskPct} />
        <Field label="Risk:Reward" value={rr} min={0.5} max={5} step={0.25} suffix="R" onChange={setRr} />
        <Field label="Prag ruină (drawdown)" value={drawdown} min={20} max={100} step={5} suffix="%" onChange={setDrawdown} />
        <Field label="Orizont (nr. tranzacții)" value={trades} min={50} max={1000} step={50} onChange={setTrades} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-zinc-800/40 border border-zinc-700/40 p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Expectanță / trade</p>
          <p className={cn("text-2xl font-black num", edgeColor)}>{expectancy >= 0 ? "+" : ""}{expectancy.toFixed(2)}R</p>
          <p className="text-[10px] text-zinc-600 mt-1">{expectancy > 0 ? "Ai avantaj statistic" : "Fără avantaj — strategie pierzătoare"}</p>
        </div>
        <div className={cn("rounded-xl border p-4 text-center",
          ror < 1 ? "bg-emerald-500/8 border-emerald-500/20" : ror < 10 ? "bg-amber-500/8 border-amber-500/20" : "bg-rose-500/8 border-rose-500/20")}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Risc de ruină</p>
          <p className={cn("text-2xl font-black num", rorColor)}>{ror < 0.1 && ror > 0 ? "<0.1" : ror.toFixed(1)}%</p>
          <p className={cn("text-[10px] mt-1", rorColor)}>{rorLabel}</p>
        </div>
      </div>
      <p className="text-[10px] text-zinc-600 mt-3 flex items-center gap-1.5">
        <AlertTriangle className="w-3 h-3" /> Simulare Monte Carlo (5000 scenarii) cu sizing procentual din cont. Orientativ.
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGINA UNELTE
// ════════════════════════════════════════════════════════════════════════════

export function ToolsClient() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Unelte Pro</h1>
        </div>
        <p className="text-sm text-zinc-500">Analiză de piață și management al riscului pentru decizii mai bune.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CurrencyStrength />
        <RiskOfRuin />
      </div>

      {/* Heatmap corelații — lățime completă */}
      <div className="flex items-center gap-2 pt-2">
        <Grid3x3 className="w-4 h-4 text-violet-400" />
        <h2 className="text-base font-bold text-zinc-200">Corelații valutare</h2>
      </div>
      <CorrelationHeatmap />
    </div>
  );
}
