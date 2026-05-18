"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  Plus, Play, Trash2, TrendingUp, TrendingDown, BarChart2,
  FlaskConical, Clock, ChevronRight, Sparkles, Activity,
} from "lucide-react";

const STRATEGY_TYPE_LABELS: Record<string, string> = {
  EMA_CROSSOVER:    "EMA Crossover",
  SESSION_BREAKOUT: "Session Breakout",
  RSI_REVERSAL:     "RSI Reversal",
  TREND_FOLLOWING:  "Trend Following",
  CUSTOM:           "Personalizată",
};

const STRATEGY_TYPE_COLORS: Record<string, string> = {
  EMA_CROSSOVER:    "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  SESSION_BREAKOUT: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  RSI_REVERSAL:     "bg-violet-500/20 text-violet-300 border-violet-500/30",
  TREND_FOLLOWING:  "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  CUSTOM:           "bg-pink-500/20 text-pink-300 border-pink-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  RUNNING:   "bg-amber-500/20 text-amber-400 border-amber-500/30",
  FAILED:    "bg-rose-500/20 text-rose-400 border-rose-500/30",
  PENDING:   "bg-zinc-700 text-zinc-400 border-zinc-600",
};

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: "Finalizat",
  RUNNING:   "Rulează",
  FAILED:    "Eroare",
  PENDING:   "În așteptare",
};

interface Strategy {
  id: string; name: string; type: string; color: string | null; description: string | null;
  _count: { backtests: number };
  backtests: { id: string; status: string; netPnl: string | null; winRate: string | null; totalTrades: number | null; createdAt: string }[];
}

interface BacktestRow {
  id: string; symbol: string; timeframe: string; startDate: string; endDate: string;
  status: string; totalTrades: number | null; winRate: string | null; netPnl: string | null;
  profitFactor: string | null; maxDrawdownPct: string | null; sharpeRatio: string | null;
  initialBalance: string | null; createdAt: string;
  strategy: { name: string; type: string; color: string | null };
}

export function BacktestingClient({
  strategies,
  recentBacktests,
}: {
  strategies: Strategy[];
  recentBacktests: BacktestRow[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  async function deleteStrategy(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/backtesting/strategies/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Strategie ștearsă" });
      router.refresh();
    } else {
      toast({ title: "Eroare la ștergere", variant: "destructive" });
    }
    setDeletingId(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Backtesting</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Testează strategii pe date istorice reale — Yahoo Finance live data
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 gap-2">
          <Link href="/backtesting/new">
            <Plus className="h-4 w-4" />
            Strategie nouă
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Strategy List — Left Column */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Strategii salvate ({strategies.length})
          </h2>

          {strategies.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
              <FlaskConical className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500 mb-3">Nicio strategie creată</p>
              <Button asChild size="sm" variant="outline" className="border-zinc-700 text-zinc-400">
                <Link href="/backtesting/new"><Plus className="h-3.5 w-3.5 mr-1" />Crează prima strategie</Link>
              </Button>
            </div>
          ) : (
            strategies.map((s) => {
              const lastBt = s.backtests[0];
              const pnl = lastBt?.netPnl ? parseFloat(lastBt.netPnl) : null;
              return (
                <div key={s.id} className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-4 hover:border-zinc-700 transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: s.color ?? "#6366f1" }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-100 truncate">{s.name}</p>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded border",
                          STRATEGY_TYPE_COLORS[s.type] ?? "bg-zinc-800 text-zinc-400 border-zinc-700"
                        )}>
                          {STRATEGY_TYPE_LABELS[s.type] ?? s.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => deleteStrategy(s.id)}
                        disabled={deletingId === s.id}
                        className="p-1.5 rounded hover:bg-rose-500/10 text-zinc-600 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {lastBt ? (
                    <div className="flex items-center justify-between text-xs mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500">
                          {lastBt.totalTrades ?? "—"} trades
                        </span>
                        {lastBt.winRate && (
                          <span className="text-zinc-400">WR: {parseFloat(lastBt.winRate).toFixed(1)}%</span>
                        )}
                      </div>
                      {pnl !== null && (
                        <span className={cn("font-semibold num", pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                          {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}$
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-600 mb-3">Niciun backtest rulat</p>
                  )}

                  <Button asChild size="sm" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white gap-1.5 h-8 text-xs shadow-md shadow-indigo-500/20">
                    <Link href={`/backtesting/new?strategyId=${s.id}`}>
                      <Play className="h-3 w-3" />
                      Rulează Backtest
                    </Link>
                  </Button>
                </div>
              );
            })
          )}
        </div>

        {/* Recent Backtests — Right Column */}
        <div className="lg:col-span-3 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Backteste recente ({recentBacktests.length})
          </h2>

          {recentBacktests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
              <Activity className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">
                Niciun backtest rulat. Crează o strategie și testează-o!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentBacktests.map((b) => {
                const pnl   = b.netPnl ? parseFloat(b.netPnl) : null;
                const wr    = b.winRate ? parseFloat(b.winRate) : null;
                const pf    = b.profitFactor ? parseFloat(b.profitFactor) : null;
                const dd    = b.maxDrawdownPct ? parseFloat(b.maxDrawdownPct) : null;
                const initBal = b.initialBalance ? parseFloat(b.initialBalance) : null;
                const pnlPct  = pnl !== null && initBal ? (pnl / initBal) * 100 : null;

                return (
                  <Link key={b.id} href={`/backtesting/results/${b.id}`}
                    className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-3.5 hover:border-indigo-500/40 hover:bg-zinc-800/50 transition-colors group"
                  >
                    {/* Strategy color dot + name */}
                    <div className="flex items-center gap-2 w-36 shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: b.strategy.color ?? "#6366f1" }} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-300 truncate">{b.strategy.name}</p>
                        <p className="text-[10px] text-zinc-600">{b.symbol} · {b.timeframe}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <span className={cn("text-[10px] px-2 py-0.5 rounded border shrink-0", STATUS_COLORS[b.status])}>
                      {STATUS_LABELS[b.status]}
                    </span>

                    {b.status === "COMPLETED" ? (
                      <>
                        {/* Trades */}
                        <div className="text-center w-12 shrink-0">
                          <p className="text-xs font-semibold text-zinc-200 num">{b.totalTrades ?? "—"}</p>
                          <p className="text-[9px] text-zinc-600">trades</p>
                        </div>
                        {/* Win Rate */}
                        <div className="text-center w-14 shrink-0">
                          <p className="text-xs font-semibold text-zinc-200 num">{wr ? `${wr.toFixed(1)}%` : "—"}</p>
                          <p className="text-[9px] text-zinc-600">win rate</p>
                        </div>
                        {/* PF */}
                        <div className="text-center w-10 shrink-0">
                          <p className={cn("text-xs font-semibold num", pf && pf >= 1 ? "text-emerald-400" : "text-rose-400")}>
                            {pf ? pf.toFixed(2) : "—"}
                          </p>
                          <p className="text-[9px] text-zinc-600">PF</p>
                        </div>
                        {/* DD */}
                        <div className="text-center w-12 shrink-0">
                          <p className="text-xs font-semibold text-rose-400 num">
                            {dd ? `-${dd.toFixed(1)}%` : "—"}
                          </p>
                          <p className="text-[9px] text-zinc-600">drawdown</p>
                        </div>
                        {/* P&L */}
                        <div className="ml-auto text-right shrink-0">
                          {pnl !== null ? (
                            <>
                              <p className={cn("text-sm font-bold num", pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                {pnl >= 0 ? "+" : ""}{pnl.toFixed(0)}$
                              </p>
                              {pnlPct !== null && (
                                <p className={cn("text-[10px] num", pnl >= 0 ? "text-emerald-500/70" : "text-rose-500/70")}>
                                  {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%
                                </p>
                              )}
                            </>
                          ) : <span className="text-zinc-600 text-sm">—</span>}
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-end">
                        {b.status === "FAILED" && (
                          <span className="text-xs text-rose-400">Rulare eșuată</span>
                        )}
                      </div>
                    )}

                    <ChevronRight className="h-3.5 w-3.5 text-zinc-700 group-hover:text-zinc-500 shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Stats summary if backtests exist */}
      {recentBacktests.filter((b) => b.status === "COMPLETED").length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-zinc-800">
          {[
            {
              label: "Backteste totale",
              value: recentBacktests.length,
              icon: BarChart2,
              color: "text-indigo-400",
            },
            {
              label: "Win rate mediu",
              value: (() => {
                const wrs = recentBacktests.filter((b) => b.winRate).map((b) => parseFloat(b.winRate!));
                return wrs.length ? `${(wrs.reduce((a, b) => a + b, 0) / wrs.length).toFixed(1)}%` : "—";
              })(),
              icon: TrendingUp,
              color: "text-emerald-400",
            },
            {
              label: "Profit Factor mediu",
              value: (() => {
                const pfs = recentBacktests.filter((b) => b.profitFactor).map((b) => parseFloat(b.profitFactor!));
                return pfs.length ? (pfs.reduce((a, b) => a + b, 0) / pfs.length).toFixed(2) : "—";
              })(),
              icon: Sparkles,
              color: "text-amber-400",
            },
            {
              label: "P&L total generat",
              value: (() => {
                const pnls = recentBacktests.filter((b) => b.netPnl).map((b) => parseFloat(b.netPnl!));
                const total = pnls.reduce((a, b) => a + b, 0);
                return `${total >= 0 ? "+" : ""}${total.toFixed(0)}$`;
              })(),
              icon: TrendingUp,
              color: "text-zinc-300",
            },
          ].map((stat) => {
            const Icon = typeof stat.icon === "function" && stat.icon.toString().includes("=>")
              ? (stat.icon as unknown as React.ComponentType<{ className?: string }>)
              : (stat.icon as React.ComponentType<{ className?: string }>);
            return (
              <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn("h-3.5 w-3.5", stat.color)} />
                  <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide">{stat.label}</span>
                </div>
                <p className={cn("text-lg font-bold num", stat.color)}>{stat.value}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
