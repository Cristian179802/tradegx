"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Clock, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RawTrade { time: string; pnl: number; }
type Metric = "pnl" | "winrate" | "count";

interface Cell { pnl: number; count: number; wins: number; }

export function PerformanceHeatmap() {
  const t = useTranslations("performanceHeatmap");
  const locale = useLocale();
  const DAYS = t.raw("days") as string[];
  const DAYS_SHORT = t.raw("daysShort") as string[];
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
    new Intl.NumberFormat(locale === "ro" ? "ro-RO" : "en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  // Plusul se punea hardcodat înaintea sumei, deci o fereastră cu pierdere
  // ieșea „+-0 USD" — un plus lipit de un minus. Semnul îl decide valoarea.
  const signedMoney = (n: number) => `${n > 0 ? "+" : ""}${money(n)}`;
  const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

  // Totalul fiecărei zile, pentru coloana din dreapta grilei.
  const dayTotals = React.useMemo(
    () =>
      grid.map((row) =>
        row.reduce(
          (acc, c) => ({ pnl: acc.pnl + c.pnl, count: acc.count + c.count }),
          { pnl: 0, count: 0 }
        )
      ),
    [grid]
  );

  // Capătul scalei de culoare, mereu în P&L — legenda descrie culoarea, iar
  // culoarea e normalizată pe `maxAbs` doar când metrica selectată e P&L.
  const legendMax = React.useMemo(() => {
    let m = 0;
    for (const row of grid) for (const c of row) if (c.count > 0) m = Math.max(m, Math.abs(c.pnl));
    return m;
  }, [grid]);

  const hovered = hover ? grid[hover.d][hover.h] : null;

  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/80 p-5 premium-card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          {/* Ambra era o culoare decorativă în plus; accentul de brand e regula. */}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-line)" }}>
            <Clock className="w-4 h-4" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-200">{t("title")}</h2>
            <p className="text-[11px]" style={{ color: "var(--ink-4)" }}>{t("subtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-zinc-800 rounded-lg p-0.5">
            {([["pnl", "P&L"], ["winrate", "Win %"], ["count", t("metricVolume")]] as [Metric, string][]).map(([m, label]) => (
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
      </div>

      {loading ? (
        <div className="h-48 bg-zinc-800/40 rounded-xl animate-pulse" />
      ) : trades.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-10">
          {t("empty")}
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
                {" · "}{hovered.count} {hovered.count === 1 ? t("trade") : t("trades")}
                {" · "}{Math.round((hovered.wins / hovered.count) * 100)}% {t("win")}
              </span>
            ) : (
              <span className="text-[11px] text-zinc-600">{t("hoverHint")}</span>
            )}
          </div>

          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Header ore */}
              <div className="flex pl-10 pr-14">
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
                    const isBest = best.best.d === d && best.best.h === h && c.count > 0 && c.pnl > 0;
                    return (
                      <div
                        key={h}
                        // `title` face celula inspectabilă și fără JavaScript de-al
                        // nostru: tooltip nativ pe desktop, text citit de cititoarele
                        // de ecran. Grila e 168 de div-uri fără nicio semantică; asta
                        // e cel mai ieftin mod de a le da una.
                        title={c.count > 0 ? `${DAYS[d]} ${hh(h)} · ${signedMoney(c.pnl)} · ${c.count}` : undefined}
                        className="flex-1 aspect-square m-[1px] rounded-[2px] cursor-pointer transition-transform hover:scale-125 hover:z-10 relative"
                        style={{
                          minWidth: 11,
                          background: cellColor(c),
                          boxShadow: isBest ? "0 0 0 1.5px rgba(52,211,153,0.9)" : undefined,
                        }}
                        onMouseEnter={() => setHover({ d, h })}
                        onMouseLeave={() => setHover(null)}
                        // Pe telefon nu există `mouseenter`: fără asta, detaliile
                        // unei celule erau de neajuns pe jumătate din trafic.
                        // Atingerea comută, ca a doua atingere să poată închide.
                        onClick={() =>
                          setHover((prev) => (prev && prev.d === d && prev.h === h ? null : { d, h }))
                        }
                      />
                    );
                  })}
                  {/* Totalul zilei. Grila arată tiparul, coloana asta arată
                      verdictul — altfel trebuie să însumezi 24 de pătrățele din ochi. */}
                  <div className="w-14 pl-1.5 shrink-0 text-right text-[10px] font-semibold num">
                    {dayTotals[d].count > 0 ? (
                      <span className={dayTotals[d].pnl >= 0 ? "text-emerald-400/90" : "text-rose-400/90"}>
                        {signedMoney(dayTotals[d].pnl)}
                      </span>
                    ) : (
                      <span className="text-zinc-700">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legendă. Fără ea, intensitatea culorii nu înseamnă nimic: nu se
              poate ști dacă verdele închis e o sută sau zece mii. */}
          <div className="flex items-center justify-end gap-2 mt-3 pr-1">
            <span className="text-[9px] text-zinc-600 num">{signedMoney(-legendMax)}</span>
            <div
              className="h-2 w-28 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, rgba(244,63,94,0.93), rgba(244,63,94,0.12), rgba(63,63,70,0.35), rgba(16,185,129,0.12), rgba(16,185,129,0.93))",
              }}
            />
            <span className="text-[9px] text-zinc-600 num">{signedMoney(legendMax)}</span>
          </div>
          {/* Insight-uri — comune ambelor moduri: cea mai bună fereastră și cea
              de evitat sunt aceleași indiferent de reprezentare. */}
          {best.best.d >= 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {/* Numai daca EXISTĂ o fereastră pe profit. Pe un cont în pierdere,
                  cea mai bună oră e tot o oră pe minus — a o eticheta „cea mai
                  bună fereastră" și a-i lipi un plus în față e o minciună
                  liniștitoare, exact genul pe care un jurnal de tranzacționare
                  n-are voie să-l spună. */}
              {best.best.pnl > 0 && (
              <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 px-3 py-2.5 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">{t("bestWindow")}</p>
                  <p className="text-xs text-zinc-200 font-semibold">
                    {DAYS[best.best.d]} {hh(best.best.h)} · <span className="text-emerald-400">{signedMoney(best.best.pnl)}</span>
                  </p>
                </div>
              </div>
              )}
              {best.worst.d >= 0 && best.worst.pnl < 0 && (
                <div className="rounded-xl bg-rose-500/8 border border-rose-500/20 px-3 py-2.5 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400/80">{t("avoid")}</p>
                    <p className="text-xs text-zinc-200 font-semibold">
                      {DAYS[best.worst.d]} {hh(best.worst.h)} · <span className="text-rose-400">{signedMoney(best.worst.pnl)}</span>
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
