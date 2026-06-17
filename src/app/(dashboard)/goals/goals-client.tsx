"use client";

import * as React from "react";
import { Target, TrendingUp, Loader2, Save, Trophy, Shield, AlertTriangle, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PropAccount {
  id: string; name: string; type: string; currency: string;
  balance: number; initial: number; pnl: number; pnlPct: number; ddPct: number;
  maxDrawdownPct: number | null; maxDailyLossPct: number | null;
}

interface GoalsData {
  targets: { monthlyProfitTarget: number | null; monthlyTradeTarget: number | null; monthlyWinRateTarget: number | null };
  progress: { pnl: number; trades: number; winRate: number };
  currency: string;
}

function money(n: number, c: string) {
  return new Intl.NumberFormat("ro-RO", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);
}

function ProgressBar({ value, target, color }: { value: number; target: number; color: string }) {
  const pct = target > 0 ? Math.max(0, Math.min(100, (value / target) * 100)) : 0;
  return (
    <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function GoalsClient({ propAccounts }: { propAccounts: PropAccount[] }) {
  const { toast } = useToast();
  const [data, setData] = React.useState<GoalsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ profit: "", trades: "", winRate: "" });

  React.useEffect(() => {
    fetch("/api/user/goals")
      .then((r) => r.json())
      .then((d: GoalsData) => {
        setData(d);
        setForm({
          profit: d.targets.monthlyProfitTarget?.toString() ?? "",
          trades: d.targets.monthlyTradeTarget?.toString() ?? "",
          winRate: d.targets.monthlyWinRateTarget?.toString() ?? "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/user/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyProfitTarget: form.profit ? Number(form.profit) : null,
          monthlyTradeTarget: form.trades ? Number(form.trades) : null,
          monthlyWinRateTarget: form.winRate ? Number(form.winRate) : null,
        }),
      });
      if (!res.ok) throw new Error();
      // Reîncarcă progresul
      const fresh = await fetch("/api/user/goals").then((r) => r.json());
      setData(fresh);
      toast({ title: "Obiective salvate", description: "Progresul lunii curente se actualizează automat." });
    } catch {
      toast({ title: "Eroare", description: "Nu s-au putut salva obiectivele.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const c = data?.currency ?? "USD";
  const monthLabel = new Date().toLocaleDateString("ro-RO", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6 pb-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Obiective</h1>
        </div>
        <p className="text-sm text-zinc-500 capitalize">Țintele tale lunare și monitorizarea conturilor · {monthLabel}</p>
      </div>

      {loading ? (
        <div className="h-40 rounded-2xl bg-zinc-800/40 animate-pulse" />
      ) : (
        <>
          {/* Progres obiective lunare */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Profit */}
            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/80 p-5 premium-card">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Profit lunar</span>
              </div>
              <p className={cn("text-2xl font-black num", (data?.progress.pnl ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {(data?.progress.pnl ?? 0) >= 0 ? "+" : ""}{money(data?.progress.pnl ?? 0, c)}
              </p>
              {data?.targets.monthlyProfitTarget ? (
                <>
                  <p className="text-xs text-zinc-500 mt-1 mb-2">din {money(data.targets.monthlyProfitTarget, c)} țintă</p>
                  <ProgressBar value={Math.max(0, data.progress.pnl)} target={data.targets.monthlyProfitTarget} color="linear-gradient(90deg,#059669,#34d399)" />
                </>
              ) : <p className="text-xs text-zinc-600 mt-1">Setează o țintă mai jos</p>}
            </div>

            {/* Trades */}
            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/80 p-5 premium-card">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Tranzacții</span>
              </div>
              <p className="text-2xl font-black num text-violet-300">{data?.progress.trades ?? 0}</p>
              {data?.targets.monthlyTradeTarget ? (
                <>
                  <p className="text-xs text-zinc-500 mt-1 mb-2">din {data.targets.monthlyTradeTarget} țintă</p>
                  <ProgressBar value={data.progress.trades} target={data.targets.monthlyTradeTarget} color="linear-gradient(90deg,#7c3aed,#a78bfa)" />
                </>
              ) : <p className="text-xs text-zinc-600 mt-1">Setează o țintă mai jos</p>}
            </div>

            {/* Win rate */}
            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/80 p-5 premium-card">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Win Rate</span>
              </div>
              <p className="text-2xl font-black num text-indigo-300">{data?.progress.winRate ?? 0}%</p>
              {data?.targets.monthlyWinRateTarget ? (
                <>
                  <p className="text-xs text-zinc-500 mt-1 mb-2">din {data.targets.monthlyWinRateTarget}% țintă</p>
                  <ProgressBar value={data.progress.winRate} target={data.targets.monthlyWinRateTarget} color="linear-gradient(90deg,#4f46e5,#818cf8)" />
                </>
              ) : <p className="text-xs text-zinc-600 mt-1">Setează o țintă mai jos</p>}
            </div>
          </div>

          {/* Setare obiective */}
          <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/80 p-5">
            <h2 className="text-sm font-bold text-zinc-200 mb-4">Setează obiectivele lunare</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Profit țintă ({c})</label>
                <input type="number" value={form.profit} onChange={(e) => setForm({ ...form, profit: e.target.value })}
                  placeholder="ex: 2000"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 num" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Nr. tranzacții țintă</label>
                <input type="number" value={form.trades} onChange={(e) => setForm({ ...form, trades: e.target.value })}
                  placeholder="ex: 40"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500 num" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Win Rate țintă (%)</label>
                <input type="number" value={form.winRate} onChange={(e) => setForm({ ...form, winRate: e.target.value })}
                  placeholder="ex: 55" min={0} max={100}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 num" />
              </div>
            </div>
            <button onClick={save} disabled={saving}
              className="mt-4 flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvează obiectivele
            </button>
          </div>

          {/* Prop Firm tracker */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-zinc-200">Monitor Prop Firm</h2>
              <span className="text-xs text-zinc-600">conturi Challenge & Live</span>
            </div>
            {propAccounts.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/80 p-8 text-center">
                <p className="text-sm text-zinc-500">Niciun cont Challenge sau Live. Adaugă unul pentru monitorizarea regulilor prop firm.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {propAccounts.map((a) => {
                  const ddLimit = a.maxDrawdownPct ?? 10;
                  const ddUsedPct = ddLimit > 0 ? Math.min(100, (a.ddPct / ddLimit) * 100) : 0;
                  const ddDanger = ddUsedPct >= 80;
                  return (
                    <div key={a.id} className="rounded-2xl border border-zinc-800/70 bg-zinc-900/80 p-5 premium-card">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-bold text-zinc-200">{a.name}</p>
                          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border",
                            a.type === "CHALLENGE" ? "text-amber-300 bg-amber-500/10 border-amber-500/25" : "text-emerald-300 bg-emerald-500/10 border-emerald-500/25")}>
                            {a.type}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-lg font-black num", a.pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                            {a.pnl >= 0 ? "+" : ""}{money(a.pnl, a.currency)}
                          </p>
                          <p className="text-[11px] text-zinc-500 num">{a.pnlPct >= 0 ? "+" : ""}{a.pnlPct}%</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-zinc-500 flex items-center gap-1">
                          {ddDanger && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                          Drawdown folosit
                        </span>
                        <span className={cn("font-bold num", ddDanger ? "text-rose-400" : "text-zinc-300")}>
                          {a.ddPct}% / {ddLimit}%
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${ddUsedPct}%`, background: ddDanger ? "linear-gradient(90deg,#e11d48,#fb7185)" : "linear-gradient(90deg,#f59e0b,#fbbf24)" }} />
                      </div>
                      <div className="flex items-center justify-between mt-3 text-[11px] text-zinc-600">
                        <span>Sold: <span className="text-zinc-400 num">{money(a.balance, a.currency)}</span></span>
                        <span>Inițial: <span className="text-zinc-400 num">{money(a.initial, a.currency)}</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
