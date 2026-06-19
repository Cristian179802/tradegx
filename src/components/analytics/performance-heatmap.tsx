"use client";

import * as React from "react";
import { Clock, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RawTrade { time: string; pnl: number; }
type Metric = "pnl" | "winrate" | "count";

const DAYS = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"];
const DAYS_SHORT = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"];

interface Cell { pnl: number; count: number; wins: number; }

export function PerformanceHeatmap() {
  const [trades, setTrades] = React.useState<RawTrade[]>([]);
  const [currency, setCurrency] = React.useState("USD");
  const [loading, setLoading] = React.useState(true);
  const [metric, setMetric] = React.useState<Metric>("pnl");
  const [hover, setHover] = React.useState<{ d: number; h: number } | null>(null);

  React.useEffect(() => {
    fetch("/api/analytics/time-performance", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setTrades(data.trades ?? []);
        setCurrency(data.currency ?? "USD");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Construiește grila 7×24 din ora LOCALĂ a utilizatorului
  const grid = React.useMemo(() => {
    const g: Cell[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => ({ pnl: 0, count: 0, wins: 0 }))
    );
    for (const t of trades) {
      const d = new Date(t.time);
      const day = (d.getDay() + 6) % 7; // 0=Luni … 6=Duminică
      const hour = d.getHours();
      const cell = g[day][hour];
      cell.pnl += t.pnl;
      cell.count += 1;
      if (t.pnl > 0) cell.wins += 1;
    }
    return g;
  }, [trades]);

  // Valoarea unei celule în funcție de metrica selectată
  const cellValue = (c: Cell): number | null => {
    if (c.count === 0) return null;
    if (metric === "pnl") return c.pnl;
    if (metric === "winrate") return (c.wins / c.count) * 100;
    return c.count;
  };

  // Magnitudine maximă pentru normalizarea intensității culorii
  const maxAbs = React.useMemo(() => {
    let m = 0;
    for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) {
      const v = cellValue(grid[d][h]);
      if (v !== null) m = Math.max(m, Math.abs(metric === "winrate" ? v - 50 : v));
    }
    return m || 1;
  }, [grid, metric]);

  function cellColor(c: Cell): string {
    const v = cellValue(c);
    if (v === null) return "rgba(63,63,70,0.18)";
    if (metric === "count") {
      const a = Math.min(1, v / maxAbs) * 0.85 + 0.1;
      return `rgba(99,102,241,${a})`;
    }
    const ref = metric === "winrate" ? v - 50 : v; // win rate centrat pe 50%
    const a = Math.min(1, Math.abs(ref) / maxAbs) * 0.85 + 0.08;
    return ref >= 0 ? `rgba(16,185,129,${a})` : `rgba(244,63,94,${a})`;
  }

  // Cea mai bună și cea mai slabă fereastră (după PnL)
  const best = React.useMemo(() => {
    let bestCell = { d: -1, h: -1, pnl: -Infinity };
    let worstCell = { d: -1, h: -1, pnl: Infinity };
    for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) {
      const c = grid[d][h];
      if (c.count === 0) continue;
      if (c.pnl > bestCell.pnl) bestCell = { d, h, pnl: c.pnl };
      if (c.pnl < worstCell.pnl) worstCell = { d, h, pnl: c.pnl };
    }
    return { best: bestCell, worst: worstCell };
  }, [grid]);

  const money = (n: number) =>
    new Intl.NumberFormat("ro-RO", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

  const hovered = hover ? grid[hover.d][hover.h] : null;

  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/80 p-5 premium-card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/12 border border-amber-500/20 flex items-center justify-center">
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-200">Performanța pe oră și zi</h2>
            <p className="text-[11px] text-zinc-600">Când tranzacționezi cel mai bine (ora ta locală)</p>
          </div>
        </div>
        {/* Selector metrică */}
        <div className="flex items-center gap-0.5 bg-zinc-800 rounded-lg p-0.5">
          {([["pnl", "P&L"], ["winrate", "Win %"], ["count", "Volum"]] as [Metric, string][]).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={cn(
                "text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all",
                metric === m ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-48 bg-zinc-800/40 rounded-xl animate-pulse" />
      ) : trades.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-10">
          Nicio tranzacție înregistrată încă. Heatmap-ul se populează pe măsură ce tranzacționezi.
        </p>
      ) : (
        <>
          {/* Tooltip activ */}
          <div className="h-6 mb-1 text-center">
            {hovered && hovered.count > 0 ? (
              <span className="text-xs text-zinc-300">
                <span className="font-semibold">{DAYS[hover!.d]} {hh(hover!.h)}</span>
                {" · "}
                <span className={hovered.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}>
                  {hovered.pnl >= 0 ? "+" : ""}{money(hovered.pnl)}
                </span>
                {" · "}{hovered.count} {hovered.count === 1 ? "trade" : "trades"}
                {" · "}{Math.round((hovered.wins / hovered.count) * 100)}% win
              </span>
            ) : (
              <span className="text-[11px] text-zinc-600">Treci cu mouse-ul peste o celulă pentru detalii</span>
            )}
          </div>

          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Header ore */}
              <div className="flex pl-10">
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="flex-1 text-center" style={{ minWidth: 13 }}>
                    {h % 3 === 0 && <span className="text-[8px] text-zinc-600">{h}</span>}
                  </div>
                ))}
              </div>
              {/* Rânduri zile */}
              {DAYS_SHORT.map((dayLabel, d) => (
                <div key={d} className="flex items-center">
                  <div className="w-10 text-[10px] font-semibold text-zinc-500 shrink-0">{dayLabel}</div>
                  {Array.from({ length: 24 }, (_, h) => {
                    const c = grid[d][h];
                    const isBest = best.best.d === d && best.best.h === h && c.count > 0;
                    return (
                      <div
                        key={h}
                        className="flex-1 aspect-square m-[1px] rounded-[2px] cursor-pointer transition-transform hover:scale-125 hover:z-10 relative"
                        style={{
                          minWidth: 11,
                          background: cellColor(c),
                          boxShadow: isBest ? "0 0 0 1.5px rgba(52,211,153,0.9)" : undefined,
                        }}
                        onMouseEnter={() => setHover({ d, h })}
                        onMouseLeave={() => setHover(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Insight-uri */}
          {best.best.d >= 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 px-3 py-2.5 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">Cea mai bună fereastră</p>
                  <p className="text-xs text-zinc-200 font-semibold">
                    {DAYS[best.best.d]} {hh(best.best.h)} · <span className="text-emerald-400">+{money(best.best.pnl)}</span>
                  </p>
                </div>
              </div>
              {best.worst.d >= 0 && best.worst.pnl < 0 && (
                <div className="rounded-xl bg-rose-500/8 border border-rose-500/20 px-3 py-2.5 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400/80">De evitat</p>
                    <p className="text-xs text-zinc-200 font-semibold">
                      {DAYS[best.worst.d]} {hh(best.worst.h)} · <span className="text-rose-400">{money(best.worst.pnl)}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
