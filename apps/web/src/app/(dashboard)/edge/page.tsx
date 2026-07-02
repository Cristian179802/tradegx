"use client";

import * as React from "react";
import {
  Crosshair,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Info,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EdgeReport, EdgeStat } from "@/lib/edge-finder";

const PERIOADE = [
  { days: 30, label: "30 zile" },
  { days: 90, label: "90 zile" },
  { days: 365, label: "1 an" },
  { days: 3650, label: "Tot istoricul" },
];

function fmt(n: number) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("ro-RO", { maximumFractionDigits: 2 })} $`;
}

function EdgeCard({ stat, kind }: { stat: EdgeStat; kind: "edge" | "leak" }) {
  const isEdge = kind === "edge";
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-colors",
        isEdge
          ? "border-emerald-500/25 bg-emerald-500/[0.05] hover:border-emerald-500/40"
          : "border-rose-500/25 bg-rose-500/[0.05] hover:border-rose-500/40"
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          {stat.dimensionLabel}
        </span>
        <span
          className={cn(
            "text-xs font-black",
            isEdge ? "text-emerald-400" : "text-rose-400"
          )}
        >
          {fmt(stat.netPnl)}
        </span>
      </div>
      <p className="text-sm font-bold text-zinc-100 mb-2 truncate">{stat.value}</p>
      <div className="flex items-center gap-3 text-[11px] text-zinc-500">
        <span>
          <span className="text-zinc-300 font-semibold">{stat.n}</span> tranzacții
        </span>
        <span>
          WR <span className="text-zinc-300 font-semibold">{stat.winRate}%</span>
        </span>
        {stat.profitFactor != null && (
          <span>
            PF <span className="text-zinc-300 font-semibold">{stat.profitFactor}</span>
          </span>
        )}
        <span>
          medie{" "}
          <span className={cn("font-semibold", isEdge ? "text-emerald-400" : "text-rose-400")}>
            {fmt(stat.avgPnl)}
          </span>
        </span>
      </div>
      <div className="mt-2.5 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", isEdge ? "bg-emerald-500/70" : "bg-rose-500/70")}
          style={{ width: `${Math.min(stat.winRate, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function EdgeFinderPage() {
  const [days, setDays] = React.useState(365);
  const [report, setReport] = React.useState<EdgeReport | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [openDim, setOpenDim] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/edge?days=${days}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setReport(data))
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="space-y-6 pb-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <Crosshair className="w-4 h-4 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Edge Finder</h1>
          </div>
          <p className="text-sm text-zinc-500 max-w-xl">
            Motorul statistic care îți arată exact unde câștigi și unde pierzi bani —
            pe simbol, setup, killzone, zi, oră și durată.
          </p>
        </div>

        <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/80 p-0.5">
          {PERIOADE.map((p) => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-md transition-colors",
                days === p.days
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-zinc-600">Se calculează edge-urile...</div>
      ) : !report || report.totalTrades < 10 ? (
        <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/80 p-10 text-center">
          <Sparkles className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-zinc-400 mb-1">
            Ai nevoie de minim 10 tranzacții închise în perioada selectată
          </p>
          <p className="text-xs text-zinc-600 max-w-md mx-auto">
            Edge Finder devine cu atât mai precis cu cât jurnalul tău e mai bogat.
            Sincronizează contul de broker sau adaugă tranzacții — apoi revino aici.
          </p>
        </div>
      ) : (
        <>
          {/* Sumar */}
          <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/80 px-5 py-3.5 flex items-center gap-2 text-xs text-zinc-500">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>
              Analiză pe <span className="text-zinc-300 font-bold">{report.totalTrades}</span>{" "}
              tranzacții închise. Sunt afișate doar tiparele cu minim 5 apariții —
              restul nu au semnificație statistică.
            </span>
          </div>

          {/* Edges & Leaks */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-black text-zinc-100 uppercase tracking-wide">
                  Edge-urile tale
                </h2>
                <span className="text-[10px] text-zinc-600">— continuă să le exploatezi</span>
              </div>
              <div className="space-y-3">
                {report.edges.length === 0 ? (
                  <p className="text-xs text-zinc-600 py-6 text-center">
                    Niciun tipar profitabil cu eșantion suficient încă.
                  </p>
                ) : (
                  report.edges.map((s) => (
                    <EdgeCard key={`${s.dimension}-${s.value}`} stat={s} kind="edge" />
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <h2 className="text-sm font-black text-zinc-100 uppercase tracking-wide">
                  Leak-urile tale
                </h2>
                <span className="text-[10px] text-zinc-600">— aici pierzi bani sistematic</span>
              </div>
              <div className="space-y-3">
                {report.leaks.length === 0 ? (
                  <p className="text-xs text-zinc-600 py-6 text-center">
                    Niciun tipar negativ semnificativ. Excelent!
                  </p>
                ) : (
                  report.leaks.map((s) => (
                    <EdgeCard key={`${s.dimension}-${s.value}`} stat={s} kind="leak" />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Toate dimensiunile */}
          <div>
            <h2 className="text-sm font-black text-zinc-100 uppercase tracking-wide mb-3">
              Analiză completă pe dimensiuni
            </h2>
            <div className="space-y-2">
              {Object.entries(report.byDimension).map(([dim, stats]) => {
                const isOpen = openDim === dim;
                const label = stats[0]?.dimensionLabel ?? dim;
                return (
                  <div
                    key={dim}
                    className="rounded-xl border border-zinc-800/70 bg-zinc-900/80 overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenDim(isOpen ? null : dim)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-800/30 transition-colors"
                    >
                      <span className="text-xs font-bold text-zinc-200">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-600">{stats.length} valori</span>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 text-zinc-600 transition-transform",
                            isOpen && "rotate-180"
                          )}
                        />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="border-t border-zinc-800/50 overflow-x-auto">
                        <table className="w-full text-xs min-w-[560px]">
                          <thead>
                            <tr className="text-[10px] uppercase tracking-wider text-zinc-600">
                              <th className="text-left px-4 py-2 font-bold">Valoare</th>
                              <th className="text-right px-3 py-2 font-bold">Tranzacții</th>
                              <th className="text-right px-3 py-2 font-bold">Win rate</th>
                              <th className="text-right px-3 py-2 font-bold">PF</th>
                              <th className="text-right px-4 py-2 font-bold">Net P&L</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/40">
                            {stats.map((s) => (
                              <tr key={s.value} className="hover:bg-zinc-800/20">
                                <td className="px-4 py-2 font-semibold text-zinc-300">{s.value}</td>
                                <td className="px-3 py-2 text-right text-zinc-400">{s.n}</td>
                                <td className="px-3 py-2 text-right text-zinc-400">{s.winRate}%</td>
                                <td className="px-3 py-2 text-right text-zinc-400">
                                  {s.profitFactor ?? "∞"}
                                </td>
                                <td
                                  className={cn(
                                    "px-4 py-2 text-right font-bold",
                                    s.netPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                                  )}
                                >
                                  {fmt(s.netPnl)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
