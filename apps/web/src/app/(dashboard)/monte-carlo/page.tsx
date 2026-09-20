"use client";

import * as React from "react";
import { Dices, Play, ShieldAlert, Trophy, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PaywallCard } from "@/components/billing/paywall-card";
import { RollingNumber } from "@/components/ui/rolling-number";
import { monteCarlo } from "@tradegx/core";

// ── Simulator Monte Carlo ───────────────────────────────────────────────────
// Reeșantionează (cu înlocuire) randamentele REALE ale traderului și rulează
// mii de „vieți alternative" ale contului: P(target), P(ruină), distribuție.

// Simularea a plecat de aici în `@tradegx/core`. Motivul nu e curățenia:
// aplicația de Android are același ecran, iar cifra „12% șanse să-mi ard
// contul" trebuie să fie ACEEAȘI pe telefon și pe desktop. Două copii ale
// aceleiași bucle s-ar fi depărtat la prima corectură, fără ca nimeni să vadă.
//
// Numele câmpurilor rămân cele de aici: le folosește tot restul paginii, iar
// o redenumire în doisprezece locuri ar fi fost risc fără câștig.

interface SimResult {
  pTarget: number;
  pRuin: number;
  pNeither: number;
  finals: number[];
  percentiles: { p5: number; p25: number; p50: number; p75: number; p95: number };
  samplePaths: number[][];
  avgMaxDD: number;
  con: { p5: number[]; p25: number[]; p50: number[]; p75: number[]; p95: number[] };
}

function simulate(
  returns: number[],
  nTrades: number,
  nSims: number,
  targetPct: number,
  maxDDPct: number,
): SimResult | null {
  const r = monteCarlo({
    randamente: returns,
    tranzactii: nTrades,
    simulari: nSims,
    tintaPct: targetPct,
    drawdownPct: maxDDPct,
  });
  if (!r) return null;
  return {
    pTarget: r.pTinta,
    pRuin: r.pRuina,
    pNeither: r.pNiciuna,
    finals: r.finale,
    percentiles: r.percentile,
    samplePaths: r.trasee,
    avgMaxDD: r.ddMediu,
    con: r.con,
  };
}

// ── Histogramă SVG ──────────────────────────────────────────────────────────
function Histogram({ finals, targetPct, axisLabel }: { finals: number[]; targetPct: number; axisLabel: string }) {
  const BUCKETS = 28;
  const min = Math.min(...finals);
  const max = Math.max(...finals);
  const span = Math.max(max - min, 0.001);
  const counts = new Array(BUCKETS).fill(0);
  for (const f of finals) {
    const b = Math.min(BUCKETS - 1, Math.floor(((f - min) / span) * BUCKETS));
    counts[b]++;
  }
  const peak = Math.max(...counts);
  const W = 560;
  const H = 160;
  const bw = W / BUCKETS;

  return (
    <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full h-auto">
      {counts.map((c, i) => {
        const bucketMid = min + ((i + 0.5) / BUCKETS) * span;
        const isProfit = bucketMid >= 100;
        const isTarget = bucketMid >= 100 + targetPct;
        const h = (c / peak) * (H - 8);
        return (
          <rect
            key={i}
            x={i * bw + 1.5}
            y={H - h}
            width={bw - 3}
            height={h}
            rx={2}
            fill={isTarget ? "#10b981" : isProfit ? "#818cf8" : "#f43f5e"}
            opacity={0.85}
          />
        );
      })}
      <text x={0} y={H + 16} fontSize={10} fill="#71717a">
        {min.toFixed(0)}%
      </text>
      <text x={W / 2} y={H + 16} fontSize={10} fill="#71717a" textAnchor="middle">
        {axisLabel}
      </text>
      <text x={W} y={H + 16} fontSize={10} fill="#71717a" textAnchor="end">
        {max.toFixed(0)}%
      </text>
    </svg>
  );
}

// ── Trasee equity mostră ────────────────────────────────────────────────────
// ── Conul de incertitudine ──────────────────────────────────────────────────
//
// Înainte, aici erau șase trasee colorate. Șase trasee din cinci mii nu spun
// nimic despre probabilitate: ochiul le citește ca pe șase VIITORI POSIBILI și
// le dă tuturor aceeași greutate. Dacă din întâmplare cinci ies bine, pleci cu
// o impresie falsă.
//
// Conul arată DISTRIBUȚIA: între ce valori stau 90% din scenarii, între ce
// valori stau jumătate, și pe unde trece mediana. Aceeași simulare, citită
// onest. Forma lui spune și altceva, care nu se vede în procente: incertitudinea
// crește cu fiecare tranzacție — de asta e un con, nu un tub.
function Con({
  con, targetPct, maxDDPct, etichete,
}: {
  con: { p5: number[]; p25: number[]; p50: number[]; p75: number[]; p95: number[] };
  targetPct: number;
  maxDDPct: number;
  etichete: { median: string; banda50: string; banda90: string; target: string; ruin: string };
}) {
  const W = 560;
  const H = 190;
  const n = con.p50.length;
  if (n < 2) return null;

  const praguri = [100 + targetPct, 100 - maxDDPct];
  const min = Math.min(...con.p5, ...praguri) - 2;
  const max = Math.max(...con.p95, ...praguri) + 2;
  const span = max - min || 1;

  const x = (i: number) => (i / (n - 1)) * W;
  const y = (v: number) => H - ((v - min) / span) * H;

  // O bandă = marginea de sus la dreapta, marginea de jos înapoi la stânga.
  const banda = (sus: number[], jos: number[]) =>
    sus.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ") +
    " " +
    jos.map((v, i) => `L ${x(n - 1 - i).toFixed(1)} ${y(jos[n - 1 - i]!).toFixed(1)}`).join(" ") +
    " Z";

  const linie = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
           aria-label={`${etichete.banda90} · ${etichete.median}`}>
        {/* 90% din scenarii */}
        <path d={banda(con.p95, con.p5)} fill="rgba(129,140,248,0.10)" />
        {/* jumătatea din mijloc */}
        <path d={banda(con.p75, con.p25)} fill="rgba(129,140,248,0.20)" />

        {/* Pragurile: ținta sus, pierderea maximă jos. Punctate, ca să nu fie
            confundate cu un traseu. */}
        <line x1={0} x2={W} y1={y(100 + targetPct)} y2={y(100 + targetPct)}
              stroke="var(--gain)" strokeWidth={1} strokeDasharray="5 4" opacity={0.8} />
        <line x1={0} x2={W} y1={y(100 - maxDDPct)} y2={y(100 - maxDDPct)}
              stroke="var(--loss)" strokeWidth={1} strokeDasharray="5 4" opacity={0.8} />
        <line x1={0} x2={W} y1={y(100)} y2={y(100)} stroke="var(--line-2)" strokeWidth={1} />

        {/* Mediana se trasează: e drumul „normal", nu unul dintre multe. */}
        <path d={linie(con.p50)} fill="none" stroke="var(--accent)" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round" className="tg-trasare" />

        <text x={4} y={y(100 + targetPct) - 4} fontSize={10} fill="var(--gain)" fontWeight={600}>
          {etichete.target} +{targetPct}%
        </text>
        <text x={4} y={y(100 - maxDDPct) + 12} fontSize={10} fill="var(--loss)" fontWeight={600}>
          {etichete.ruin} −{maxDDPct}%
        </text>
      </svg>

      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10px] text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-2 rounded-sm" style={{ background: "rgba(129,140,248,0.20)" }} />
          {etichete.banda50}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-2 rounded-sm" style={{ background: "rgba(129,140,248,0.10)" }} />
          {etichete.banda90}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-[2px] rounded-sm" style={{ background: "var(--accent)" }} />
          {etichete.median}
        </span>
      </figcaption>
    </figure>
  );
}

function NumInput({
  label, value, onChange, suffix, min, max,
}: {
  label: string; value: number; onChange: (v: number) => void; suffix?: string; min: number; max: number;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
        {label}
      </span>
      <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-950/60 focus-within:border-indigo-500/50">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
          className="w-full bg-transparent px-3 py-2 text-sm font-bold text-zinc-100 outline-none"
        />
        {suffix && <span className="pr-3 text-xs text-zinc-600">{suffix}</span>}
      </div>
    </label>
  );
}

export default function MonteCarloPage() {
  const { data: session } = useSession();
  const isFree = session?.user?.plan === "FREE";
  const t = useTranslations("monteCarlo");
  const [returns, setReturns] = React.useState<number[] | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [nTrades, setNTrades] = React.useState(40);
  const [targetPct, setTargetPct] = React.useState(10);
  const [maxDDPct, setMaxDDPct] = React.useState(10);
  const [result, setResult] = React.useState<SimResult | null>(null);
  const [running, setRunning] = React.useState(false);

  React.useEffect(() => {
    if (isFree) { setLoading(false); return; }
    fetch("/api/analytics/montecarlo?days=3650", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setReturns(d?.returns ?? []))
      .finally(() => setLoading(false));
  }, [isFree]);

  if (isFree) {
    return (
      <div className="max-w-3xl pb-8">
        <PaywallCard
          feature={t("title")}
          description={t("paywallDesc")}
          bullets={[
            t("pw1"), t("pw2"), t("pw3"), t("pw4"),
          ]}
        />
      </div>
    );
  }

  const run = React.useCallback(() => {
    if (!returns || returns.length < 10) return;
    setRunning(true);
    // lasă UI-ul să afișeze starea înainte de calcul
    setTimeout(() => {
      setResult(simulate(returns, nTrades, 10_000, targetPct, maxDDPct));
      setRunning(false);
    }, 30);
  }, [returns, nTrades, targetPct, maxDDPct]);

  return (
    <div className="space-y-6 pb-8 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
            <Dices className="w-4 h-4 text-violet-400" />
          </div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">{t("title")}</h1>
        </div>
        <p className="text-sm text-zinc-500 max-w-2xl">
          {t("subtitle")}
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-36 w-full rounded-2xl bg-zinc-800/60" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl bg-zinc-800/60" />
            ))}
          </div>
        </div>
      ) : !returns || returns.length < 10 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDesc")}
          actionLabel={t("emptyAction")}
          actionHref="/accounts"
          hint={t("emptyHint")}
        />
      ) : (
        <>
          {/* Parametri */}
          <div className="tg-panel tg-reveal rounded-2xl border border-zinc-800/70 bg-zinc-900/80 p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <NumInput label={t("inTrades")} value={nTrades} onChange={setNTrades} min={10} max={500} />
              <NumInput label={t("inTarget")} value={targetPct} onChange={setTargetPct} suffix="%" min={1} max={100} />
              <NumInput label={t("inDd")} value={maxDDPct} onChange={setMaxDDPct} suffix="%" min={1} max={100} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-zinc-600">
                {t("base", { count: returns.length })}
              </p>
              <button
                onClick={run}
                disabled={running}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-500/15 border border-violet-500/40 px-4 py-2 text-sm font-bold text-violet-300 hover:bg-violet-500/25 transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {running ? t("running") : t("run")}
              </button>
            </div>
          </div>

          {result && (
            <>
              {/* Rezultate cheie */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05] p-5 text-center">
                  <Trophy className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                  <p className="text-3xl font-black text-emerald-400 num">
                    <RollingNumber value={`${result.pTarget.toFixed(1)}%`} />
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1 font-semibold">
                    {t("pTarget", { target: targetPct })}
                  </p>
                </div>
                <div className="rounded-2xl border border-rose-500/25 bg-rose-500/[0.05] p-5 text-center">
                  <ShieldAlert className="w-5 h-5 text-rose-400 mx-auto mb-2" />
                  <p className="text-3xl font-black text-rose-400 num">
                    <RollingNumber value={`${result.pRuin.toFixed(1)}%`} delay={70} />
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1 font-semibold">
                    {t("pRuin", { dd: maxDDPct })}
                  </p>
                </div>
                <div className="tg-panel tg-reveal rounded-2xl border border-zinc-800/70 bg-zinc-900/80 p-5 text-center">
                  <Percent className="w-5 h-5 text-zinc-500 mx-auto mb-2" />
                  <p className="text-3xl font-black text-zinc-300 num">
                    <RollingNumber value={`${result.pNeither.toFixed(1)}%`} delay={140} />
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1 font-semibold">
                    {t("pNeither", { trades: nTrades })}
                  </p>
                </div>
              </div>

              {/* Percentile */}
              <div className="tg-panel tg-reveal rounded-2xl border border-zinc-800/70 bg-zinc-900/80 p-5">
                <h3 className="text-xs font-black text-zinc-300 uppercase tracking-wide mb-3">
                  {t("equityTitle", { trades: nTrades })}
                </h3>
                <div className="grid grid-cols-5 gap-2 text-center mb-4">
                  {(
                    [
                      [t("pLuckless"), result.percentiles.p5],
                      ["P25", result.percentiles.p25],
                      [t("pMedian"), result.percentiles.p50],
                      ["P75", result.percentiles.p75],
                      [t("pLucky"), result.percentiles.p95],
                    ] as [string, number][]
                  ).map(([lbl, v]) => (
                    <div key={lbl}>
                      <p
                        className={cn(
                          "text-sm font-black",
                          v >= 100 ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        {v.toFixed(1)}%
                      </p>
                      <p className="text-[9px] text-zinc-600 font-bold uppercase">{lbl}</p>
                    </div>
                  ))}
                </div>
                <Histogram finals={result.finals} targetPct={targetPct} axisLabel={t("equityAxis")} />
                <p className="text-[10px] text-zinc-600 mt-2">
                  {t("ddNote", { dd: result.avgMaxDD.toFixed(1) })}
                </p>
              </div>

              {/* Trasee mostră */}
              <div className="tg-panel tg-reveal rounded-2xl border border-zinc-800/70 bg-zinc-900/80 p-5">
                <h3 className="text-xs font-black text-zinc-300 uppercase tracking-wide mb-3">
                  {t("pathsTitle")}
                </h3>
                <Con
                    con={result.con}
                    targetPct={targetPct}
                    maxDDPct={maxDDPct}
                    etichete={{
                      median: t("conMedian"),
                      banda50: t("conBanda50"),
                      banda90: t("conBanda90"),
                      target: t("conTarget"),
                      ruin: t("conRuin"),
                    }}
                  />
              </div>

              <p className="text-[10px] text-zinc-600 leading-relaxed">
                {t("disclaimer")}
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
