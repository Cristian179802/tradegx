"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Crosshair, TrendingUp, Scissors, Loader2, Ruler, Target } from "lucide-react";
import type { RAnalysis } from "@/lib/r-analysis";
import { cn } from "@/lib/utils";

interface Point { mae: number; mfe: number; win: boolean; symbol: string }
interface Insights { count: number; winnersMedianMAE: number | null; losersMedianMAE: number | null; winnersAvgMFE: number | null }

const fmt = (n: number | null, d = 2) => (n == null || !Number.isFinite(n) ? "—" : n.toFixed(d));

export function ExcursionClient({ rData }: { rData: RAnalysis }) {
  const t = useTranslations("excursion");
  const [exc, setExc] = React.useState<{ points: Point[]; insights?: Insights; insufficient: boolean } | null>(null);
  const [excLoading, setExcLoading] = React.useState(true);
  const [excError, setExcError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/analytics/excursion", { cache: "no-store" });
        if (!res.ok) { if (!cancelled) { setExcError(true); setExcLoading(false); } return; }
        const data = await res.json();
        if (!cancelled) { setExc(data); setExcLoading(false); }
      } catch { if (!cancelled) { setExcError(true); setExcLoading(false); } }
    })();
    return () => { cancelled = true; };
  }, []);

  const maxBucket = Math.max(1, ...rData.buckets.map((b) => b.count));

  // scatter geometry
  const pts = exc?.points ?? [];
  const maxMAE = Math.max(1, ...pts.map((p) => p.mae));
  const maxMFE = Math.max(1, ...pts.map((p) => p.mfe));
  const axMax = Math.ceil(Math.max(maxMAE, maxMFE, 2));
  const S = 300; // px
  const sx = (v: number) => (v / axMax) * S;
  const sy = (v: number) => S - (v / axMax) * S;

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {/* Antet */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Ruler className="w-5 h-5 text-emerald-400" />
          <h1 className="text-2xl font-black tracking-tight neon-indigo">{t("title")}</h1>
        </div>
        <p className="text-sm text-zinc-500 mt-0.5">{t("subtitle")}</p>
      </div>

      {rData.empty ? (
        <div className="text-center py-20">
          <p className="text-sm text-zinc-500">{t("emptyR")}</p>
        </div>
      ) : (
        <>
          {/* ── Distribuția R-multiple ── */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 mb-4">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-black text-zinc-200">{t("rDistribution")}</h2>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <Stat label={t("expectancy")} value={`${rData.expectancyR! >= 0 ? "+" : ""}${fmt(rData.expectancyR)}R`} good={rData.expectancyR! > 0} />
                <Stat label={t("avgWin")} value={`+${fmt(rData.avgWinR)}R`} good />
                <Stat label={t("avgLoss")} value={`${fmt(rData.avgLossR)}R`} good={false} />
                <Stat label={t("best")} value={`+${fmt(rData.bestR)}R`} good />
              </div>
            </div>
            {/* histogramă */}
            <div className="flex items-end justify-between gap-2 h-40">
              {rData.buckets.map((b) => (
                <div key={b.label} className="flex-1 flex flex-col items-center justify-end h-full">
                  <span className="text-[10px] font-black num text-zinc-400 mb-1">{b.count}</span>
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: `${(b.count / maxBucket) * 100}%` }} transition={{ duration: 0.6, ease: "easeOut" }}
                    className={cn("w-full rounded-t-md min-h-[2px]", b.kind === "win" ? "bg-gradient-to-t from-emerald-600/60 to-emerald-400/80" : "bg-gradient-to-t from-rose-600/60 to-rose-400/80")}
                  />
                  <span className="text-[10px] font-bold text-zinc-500 mt-1.5">{b.label}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-zinc-600 text-center mt-3">{t("rNote", { withR: rData.withR, total: rData.total })}</p>
          </div>

          {/* ── MAE / MFE ── */}
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-4">
            {/* Scatter */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-black text-zinc-200">{t("scatterTitle")}</h2>
              </div>
              <p className="text-[11px] text-zinc-500 mb-3">{t("scatterHint")}</p>

              {excLoading && (
                <div className="h-[320px] flex items-center justify-center">
                  <div className="flex items-center gap-2 text-xs text-zinc-500"><Loader2 className="w-4 h-4 animate-spin text-emerald-400" />{t("computing")}</div>
                </div>
              )}
              {!excLoading && (excError || exc?.insufficient) && (
                <div className="h-[320px] flex items-center justify-center text-center px-6">
                  <p className="text-xs text-zinc-500">{exc?.insufficient ? t("insufficient") : t("excError")}</p>
                </div>
              )}
              {!excLoading && !excError && exc && !exc.insufficient && (
                <div className="relative mx-auto" style={{ width: S, maxWidth: "100%" }}>
                  <svg viewBox={`-8 -8 ${S + 40} ${S + 40}`} className="w-full">
                    {/* grilă + axe */}
                    {[0.25, 0.5, 0.75, 1].map((f) => (
                      <g key={f}>
                        <line x1={0} y1={S - f * S} x2={S} y2={S - f * S} stroke="#27272a" strokeWidth="0.5" />
                        <line x1={f * S} y1={0} x2={f * S} y2={S} stroke="#27272a" strokeWidth="0.5" />
                      </g>
                    ))}
                    {/* linia 1R stop (MAE=1) */}
                    <line x1={sx(1)} y1={0} x2={sx(1)} y2={S} stroke="rgba(251,113,133,0.4)" strokeWidth="1" strokeDasharray="4 3" />
                    <text x={sx(1) + 3} y={12} fontSize="9" fill="rgba(251,113,133,0.7)" fontFamily="monospace">1R stop</text>
                    {/* puncte */}
                    {pts.map((p, i) => (
                      <circle key={i} cx={sx(Math.min(p.mae, axMax))} cy={sy(Math.min(p.mfe, axMax))} r={3}
                        fill={p.win ? "rgba(52,211,153,0.7)" : "rgba(251,113,133,0.6)"} stroke={p.win ? "#34d399" : "#f43f5e"} strokeWidth="0.5" />
                    ))}
                    {/* axe labels */}
                    <text x={S / 2} y={S + 24} fontSize="10" fill="#71717a" textAnchor="middle" fontFamily="monospace">MAE (R) →</text>
                    <text x={-4} y={S / 2} fontSize="10" fill="#71717a" textAnchor="middle" fontFamily="monospace" transform={`rotate(-90 -4 ${S / 2})`}>MFE (R) →</text>
                  </svg>
                  <div className="flex items-center justify-center gap-4 mt-1 text-[10px]">
                    <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400" />{t("winners")}</span>
                    <span className="flex items-center gap-1.5 text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-400" />{t("losers")}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Insight-uri */}
            <div className="space-y-3">
              {excLoading && (
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-xs text-zinc-500"><Loader2 className="w-4 h-4 animate-spin text-emerald-400" />{t("computing")}</div>
                </div>
              )}
              {!excLoading && exc?.insights && exc.insights.count > 0 && (
                <>
                  <InsightCard
                    Icon={Scissors} rgb="129,140,248"
                    title={t("stopInsightTitle")}
                    body={t("stopInsight", { mae: fmt(exc.insights.winnersMedianMAE, 2) })}
                    hint={exc.insights.winnersMedianMAE != null && exc.insights.winnersMedianMAE < 0.6 ? t("stopTip") : t("stopOk")}
                  />
                  <InsightCard
                    Icon={TrendingUp} rgb="52,211,153"
                    title={t("mfeInsightTitle")}
                    body={t("mfeInsight", { mfe: fmt(exc.insights.winnersAvgMFE, 2) })}
                    hint={t("mfeTip")}
                  />
                  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">{t("medianMAE")}</p>
                    <div className="flex items-center gap-6">
                      <div><p className="text-[10px] text-zinc-600">{t("winners")}</p><p className="text-lg font-black num text-emerald-400">{fmt(exc.insights.winnersMedianMAE, 2)}R</p></div>
                      <div><p className="text-[10px] text-zinc-600">{t("losers")}</p><p className="text-lg font-black num text-rose-400">{fmt(exc.insights.losersMedianMAE, 2)}R</p></div>
                      <div className="ml-auto text-right"><p className="text-[10px] text-zinc-600">{t("sample")}</p><p className="text-lg font-black num text-zinc-300">{exc.insights.count}</p></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <p className="text-[10px] text-zinc-600 text-center mt-5">{t("note")}</p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="text-right">
      <p className="text-[9px] text-zinc-600 uppercase tracking-wide">{label}</p>
      <p className={cn("text-sm font-black num", good ? "text-emerald-400" : "text-rose-400")}>{value}</p>
    </div>
  );
}

function InsightCard({ Icon, rgb, title, body, hint }: { Icon: React.ComponentType<{ className?: string }>; rgb: string; title: string; body: string; hint: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: `rgba(${rgb},0.28)`, background: `rgba(${rgb},0.05)` }}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `rgba(${rgb},0.14)`, color: `rgb(${rgb})` }}><Icon className="w-3.5 h-3.5" /></div>
        <p className="text-xs font-black text-zinc-100">{title}</p>
      </div>
      <p className="text-[12px] leading-relaxed text-zinc-300">{body}</p>
      <p className="text-[11px] leading-relaxed mt-1.5 font-medium" style={{ color: `rgb(${rgb})` }}>{hint}</p>
    </div>
  );
}
