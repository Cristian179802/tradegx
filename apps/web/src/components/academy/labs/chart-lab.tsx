"use client";

import * as React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { detectSMC, type SmcCandle, type SmcResult } from "@tradegx/core";
import { atr, bollinger, ema, macd, rsi, sma, type Bar } from "@/lib/indicators";
import { priceDigits } from "@/lib/price-format";
import { cn } from "@/lib/utils";
import type { I18nText, Lang } from "@/lib/academy/types";
import { LabShell } from "../lab-shell";

// ── Laboratorul de grafic: date REALE ────────────────────────────────────────
//
// Diferența dintre a citi despre RSI și a-l vedea pe aurul de săptămâna asta e
// toată diferența. Lumânările vin din `/api/charts/candles` — aceeași rută pe
// care o folosește pagina de grafice, deci același preț pe care îl vede
// utilizatorul în restul aplicației.
//
// DE CE SVG PROPRIU și nu lightweight-charts, care e deja în proiect:
//   - zonele (order block, FVG) și etichetele de structură trebuie desenate
//     exact; în lightweight-charts ar cere un strat de canvas pe deasupra
//   - lecția vrea o fereastră FIXĂ, aleasă de noi, nu explorare liberă
//   - nu plătim ~50 kB de bibliotecă pe o pagină de citit
//
// Indicatorii sunt calculați cu biblioteca de producție (`lib/indicators`), nu
// cu o versiune didactică: ce vede elevul aici e ce va vedea în aplicație.

type Overlay = "ema20" | "ema50" | "ema200" | "sma200" | "bb" | "rsi" | "macd" | "atr" | "smc" | "volume";

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  v: number;
}

const OVERLAY_META: Record<Overlay, { label: string; color: string; pane: "price" | "sub" }> = {
  ema20: { label: "EMA 20", color: "#fbbf24", pane: "price" },
  ema50: { label: "EMA 50", color: "#38bdf8", pane: "price" },
  ema200: { label: "EMA 200", color: "#a78bfa", pane: "price" },
  sma200: { label: "SMA 200", color: "#a78bfa", pane: "price" },
  bb: { label: "Bollinger", color: "#6d75f6", pane: "price" },
  smc: { label: "SMC", color: "#34d399", pane: "price" },
  rsi: { label: "RSI 14", color: "#fbbf24", pane: "sub" },
  macd: { label: "MACD", color: "#38bdf8", pane: "sub" },
  atr: { label: "ATR 14", color: "#a78bfa", pane: "sub" },
  volume: { label: "Volume", color: "#8b93a5", pane: "sub" },
};

const T = {
  title: { ro: "Pe grafic real", en: "On a real chart" },
  loading: { ro: "Se încarcă lumânările…", en: "Loading candles…" },
  failed: {
    ro: "Nu am putut încărca datele de piață acum. Lecția merge înainte fără grafic — încearcă din nou mai târziu.",
    en: "Couldn't load market data right now. The lesson continues without the chart — try again later.",
  },
  focus: { ro: "Caută asta", en: "Look for this" },
  candles: { ro: "lumânări", en: "candles" },
  live: { ro: "date reale", en: "real data" },
  toggles: { ro: "Aprinde și stinge — compară", en: "Toggle on and off — compare" },
  ob: { ro: "Order block", en: "Order block" },
  fvg: { ro: "FVG", en: "FVG" },
  liq: { ro: "Lichiditate", en: "Liquidity" },
};

const TF_LABEL: Record<string, string> = { "15": "M15", "60": "H1", "240": "H4", D: "D1" };

export function ChartLab({
  lang,
  symbol,
  tf,
  overlays,
  focus,
}: {
  lang: Lang;
  symbol: string;
  tf: "15" | "60" | "240" | "D";
  overlays: Overlay[];
  focus?: I18nText;
}) {
  const [candles, setCandles] = React.useState<Candle[] | null>(null);
  const [failed, setFailed] = React.useState(false);
  // Toate straturile cerute de lecție pornesc APRINSE: elevul vede întâi ce
  // trebuia să vadă, apoi stinge ca să compare. Invers, ar rata poanta.
  const [on, setOn] = React.useState<Set<Overlay>>(() => new Set(overlays));

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/charts/candles?symbol=${encodeURIComponent(symbol)}&tf=${tf}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { candles?: Candle[] };
        if (cancelled) return;
        if (!data.candles || data.candles.length < 30) throw new Error("prea puține");
        // Păstrăm TOT ce vine (ruta dă până la 400): indicatorii lungi au nevoie
        // de istoric ca să producă prima valoare. Tăierea la 120 se face abia
        // la desenare — vezi VIZIBILE.
        setCandles(data.candles);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [symbol, tf]);

  const toggle = (o: Overlay) =>
    setOn((prev) => {
      const next = new Set(prev);
      if (next.has(o)) next.delete(o);
      else next.add(o);
      return next;
    });

  if (failed) {
    return (
      <LabShell title={T.title} lang={lang}>
        <div className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[color:var(--ink-3)]">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[color:var(--ink-4)]" />
          <p>{T.failed[lang]}</p>
        </div>
      </LabShell>
    );
  }

  if (!candles) {
    return (
      <LabShell title={T.title} lang={lang}>
        <div className="h-[300px] grid place-items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[color:var(--ink-4)]" />
          <p className="text-[11px] text-[color:var(--ink-4)]">{T.loading[lang]}</p>
        </div>
      </LabShell>
    );
  }

  return (
    <LabShell
      title={{
        ro: `${T.title.ro} — ${symbol} ${TF_LABEL[tf] ?? tf}`,
        en: `${T.title.en} — ${symbol} ${TF_LABEL[tf] ?? tf}`,
      }}
      lang={lang}
      onReset={() => setOn(new Set(overlays))}
      notice={
        focus ? (
          <>
            <span className="font-bold text-[color:var(--ink-1)]">{T.focus[lang]}:</span> {focus[lang]}
          </>
        ) : undefined
      }
    >
      {/* Comutatoare */}
      <div className="mb-4">
        <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[color:var(--ink-4)] mb-2">
          {T.toggles[lang]}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {overlays.map((o) => {
            const meta = OVERLAY_META[o];
            const active = on.has(o);
            return (
              <button
                key={o}
                onClick={() => toggle(o)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-colors",
                  active
                    ? "text-[color:var(--ink-1)]"
                    : "border-[color:var(--line-1)] bg-[color:var(--s-1)] text-[color:var(--ink-4)] hover:text-[color:var(--ink-3)]"
                )}
                style={active ? { borderColor: meta.color, background: `${meta.color}18` } : undefined}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: active ? meta.color : "var(--line-2)" }} />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <ChartCanvas candles={candles} symbol={symbol} on={on} lang={lang} />

      <p className="mt-2.5 text-center text-[10px] text-[color:var(--ink-4)] tabular-nums">
        {Math.min(candles.length, VIZIBILE)} {T.candles[lang]} · {T.live[lang]} ·{" "}
        {new Date(candles[candles.length - 1]!.time * 1000).toLocaleDateString(
          lang === "ro" ? "ro-RO" : "en-US"
        )}
      </p>
    </LabShell>
  );
}

// ── Desenul ──────────────────────────────────────────────────────────────────

const W = 640;
/**
 * Câte lumânări se DESENEAZĂ. Restul rămân în urmă, ca istoric de calcul: o
 * EMA 200 desenată pe 120 de lumânări n-ar avea nicio valoare de arătat.
 * 120 e alegerea: destule pentru context, puține ca lumânările să rămână
 * distincte pe un telefon.
 */
const VIZIBILE = 120;
const PRICE_H = 220;
const SUB_H = 70;
const PAD_R = 52; // loc pentru axa de preț

function ChartCanvas({
  candles: toate,
  symbol,
  on,
  lang,
}: {
  candles: Candle[];
  symbol: string;
  on: Set<Overlay>;
  lang: Lang;
}) {
  // Indicatorii se calculează pe TOT istoricul, apoi tăiem aceeași felie din
  // fiecare serie. Dacă am calcula pe felie, EMA 200 ar fi mereu goală.
  const decalaj = Math.max(0, toate.length - VIZIBILE);
  const candles = React.useMemo(() => toate.slice(decalaj), [toate, decalaj]);
  const n = candles.length;

  const digits = priceDigits(symbol, candles[n - 1]?.close);

  const ind = React.useMemo(() => {
    const closes = toate.map((c) => c.close);
    const bars: Bar[] = toate.map((c) => ({ ...c }));
    const felie = <T,>(xs: T[]) => xs.slice(decalaj);
    const bb = bollinger(closes, 20, 2);
    const m = macd(closes);
    return {
      ema20: felie(ema(closes, 20)),
      ema50: felie(ema(closes, 50)),
      ema200: felie(ema(closes, 200)),
      sma200: felie(sma(closes, 200)),
      bb: { mid: felie(bb.mid), upper: felie(bb.upper), lower: felie(bb.lower) },
      rsi: felie(rsi(closes, 14)),
      macd: { line: felie(m.line), signal: felie(m.signal), hist: felie(m.hist) },
      atr: felie(atr(bars, 14)),
    };
  }, [toate, decalaj]);

  // SMC se detectează tot pe istoricul întreg — o zonă formată înainte de
  // fereastră e adesea exact cea în care prețul se întoarce acum.
  const smc = React.useMemo<SmcResult | null>(() => {
    if (!on.has("smc")) return null;
    return detectSMC(toate as SmcCandle[], 3);
  }, [toate, on]);

  // Scara de preț cuprinde lumânările ȘI straturile aprinse — altfel o EMA 200
  // sau o bandă Bollinger ar ieși din cadru fără nicio explicație.
  const { lo, hi } = React.useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const c of candles) {
      min = Math.min(min, c.low);
      max = Math.max(max, c.high);
    }
    const extra: (number | null)[][] = [];
    if (on.has("ema20")) extra.push(ind.ema20);
    if (on.has("ema50")) extra.push(ind.ema50);
    if (on.has("ema200")) extra.push(ind.ema200);
    if (on.has("sma200")) extra.push(ind.sma200);
    if (on.has("bb")) extra.push(ind.bb.upper, ind.bb.lower);
    for (const s of extra) {
      for (const v of s) {
        if (v == null) continue;
        min = Math.min(min, v);
        max = Math.max(max, v);
      }
    }
    if (smc) {
      for (const z of [...smc.orderBlocks, ...smc.fvgs]) {
        min = Math.min(min, z.bottom);
        max = Math.max(max, z.top);
      }
      for (const l of smc.liquidity) {
        min = Math.min(min, l.price);
        max = Math.max(max, l.price);
      }
    }
    const pad = (max - min) * 0.06 || 1;
    return { lo: min - pad, hi: max + pad };
  }, [candles, ind, on, smc]);

  const subs = (["rsi", "macd", "atr", "volume"] as const).filter((s) => on.has(s));
  const totalH = PRICE_H + subs.length * (SUB_H + 8) + 16;

  const step = (W - PAD_R) / n;
  const bodyW = Math.max(1.5, Math.min(9, step * 0.62));
  const x = (i: number) => i * step + step / 2;
  const y = (p: number) => ((hi - p) / (hi - lo)) * PRICE_H;
  const tIndex = new Map(candles.map((c, i) => [c.time, i]));

  const line = (series: (number | null)[]) => {
    const pts: string[] = [];
    series.forEach((v, i) => {
      if (v != null) pts.push(`${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    });
    return pts.join(" ");
  };

  return (
    <div className="rounded-xl border border-[color:var(--line-1)] bg-[color:var(--s-0)] p-2 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${totalH}`} className="w-full h-auto min-w-[440px]" role="img" aria-label={`${symbol} chart`}>
        {/* ── Panoul de preț ── */}
        <g>
          {/* grilă + axă */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const p = hi - f * (hi - lo);
            return (
              <g key={f}>
                <line x1={0} x2={W - PAD_R} y1={y(p)} y2={y(p)} stroke="rgba(255,255,255,0.055)" strokeWidth={0.8} strokeDasharray="2 6" />
                <text x={W - PAD_R + 5} y={y(p) + 3.2} fontSize={8.5} fill="var(--ink-4)" fontFamily="monospace">
                  {p.toFixed(digits)}
                </text>
              </g>
            );
          })}

          {/* Zone SMC — sub lumânări, ca să nu le acopere */}
          {smc?.orderBlocks.map((z, i) => {
            // O zonă formată înainte de fereastră se desenează de la marginea
            // din stânga: -1 o face să intre din afara cadrului, în loc să pară
            // că a început exact la prima lumânare vizibilă.
            const i0 = tIndex.get(z.time) ?? -1;
            const c = z.type === "bull" ? "#34d399" : "#fb5c72";
            return (
              <g key={`ob${i}`} opacity={z.mitigated ? 0.4 : 1}>
                <rect
                  x={x(i0) - bodyW}
                  y={y(z.top)}
                  width={W - PAD_R - x(i0) + bodyW}
                  height={Math.max(2, y(z.bottom) - y(z.top))}
                  fill={c}
                  opacity={0.12}
                  stroke={c}
                  strokeOpacity={0.45}
                  strokeWidth={0.8}
                />
                <text x={x(i0) + 3} y={y(z.top) - 3} fontSize={8} fill={c} fontWeight={700}>
                  {T.ob[lang]}
                </text>
              </g>
            );
          })}
          {smc?.fvgs.map((z, i) => {
            const i0 = tIndex.get(z.time) ?? -1;
            const c = z.type === "bull" ? "#818cf8" : "#a78bfa";
            return (
              <rect
                key={`fvg${i}`}
                x={x(i0) - bodyW}
                y={y(z.top)}
                width={W - PAD_R - x(i0) + bodyW}
                height={Math.max(1.5, y(z.bottom) - y(z.top))}
                fill={c}
                opacity={z.mitigated ? 0.06 : 0.14}
                stroke={c}
                strokeOpacity={0.3}
                strokeWidth={0.6}
              />
            );
          })}

          {/* Bollinger — bandă umplută, ca să se citească ca o zonă */}
          {on.has("bb") && (
            <>
              <polygon
                points={`${line(ind.bb.upper)} ${ind.bb.lower
                  .map((v, i) => (v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`))
                  .filter(Boolean)
                  .reverse()
                  .join(" ")}`}
                fill="#6d75f6"
                opacity={0.08}
              />
              <polyline points={line(ind.bb.upper)} fill="none" stroke="#6d75f6" strokeWidth={1} opacity={0.7} />
              <polyline points={line(ind.bb.lower)} fill="none" stroke="#6d75f6" strokeWidth={1} opacity={0.7} />
              <polyline points={line(ind.bb.mid)} fill="none" stroke="#6d75f6" strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
            </>
          )}

          {/* Lumânări */}
          {candles.map((c, i) => {
            const bull = c.close >= c.open;
            const col = bull ? "#34d399" : "#fb5c72";
            const top = y(Math.max(c.open, c.close));
            const bot = y(Math.min(c.open, c.close));
            return (
              <g key={i}>
                <line x1={x(i)} x2={x(i)} y1={y(c.high)} y2={y(c.low)} stroke={col} strokeWidth={0.9} opacity={0.85} />
                <rect x={x(i) - bodyW / 2} y={top} width={bodyW} height={Math.max(bot - top, 0.9)} fill={col} opacity={0.95} />
              </g>
            );
          })}

          {/* Medii mobile */}
          {(["ema20", "ema50", "ema200", "sma200"] as const).map(
            (k) =>
              on.has(k) && (
                <polyline
                  key={k}
                  points={line(ind[k])}
                  fill="none"
                  stroke={OVERLAY_META[k].color}
                  strokeWidth={1.4}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )
          )}

          {/* Lichiditate + structură (deasupra tuturor: sunt concluzia) */}
          {smc?.liquidity.map((l, i) => (
            <g key={`liq${i}`}>
              <line x1={0} x2={W - PAD_R} y1={y(l.price)} y2={y(l.price)} stroke="#fbbf24" strokeWidth={1} strokeDasharray="5 4" opacity={0.75} />
              <text x={4} y={y(l.price) - 3} fontSize={8} fill="#fbbf24" fontWeight={700}>
                {T.liq[lang]} {l.type === "buy" ? "↑" : "↓"}
              </text>
            </g>
          ))}
          {smc?.structure.map((s, i) => {
            const si = tIndex.get(s.time);
            if (si == null) return null;
            const up = s.dir === "up";
            const col = s.type === "CHOCH" ? "#fbbf24" : "#8b93a5";
            const yy = y(s.price);
            return (
              <g key={`st${i}`}>
                <circle cx={x(si)} cy={yy} r={2.5} fill={col} />
                <text
                  x={x(si)}
                  y={up ? yy - 7 : yy + 12}
                  fontSize={8.5}
                  fill={col}
                  fontWeight={800}
                  textAnchor="middle"
                >
                  {s.type}
                </text>
              </g>
            );
          })}
        </g>

        {/* ── Sub-panouri ── */}
        {subs.map((k, si) => {
          const top = PRICE_H + 16 + si * (SUB_H + 8);
          return (
            <g key={k} transform={`translate(0,${top})`}>
              <line x1={0} x2={W - PAD_R} y1={0} y2={0} stroke="rgba(255,255,255,0.055)" strokeWidth={0.8} />
              <text x={2} y={11} fontSize={8.5} fill={OVERLAY_META[k].color} fontWeight={700} letterSpacing="0.06em">
                {OVERLAY_META[k].label}
              </text>
              <SubPane kind={k} ind={ind} candles={candles} x={x} bodyW={bodyW} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Un sub-panou (RSI / MACD / ATR / volum). Fiecare are scara lui. */
function SubPane({
  kind,
  ind,
  candles,
  x,
  bodyW,
}: {
  kind: "rsi" | "macd" | "atr" | "volume";
  ind: {
    rsi: (number | null)[];
    macd: { line: (number | null)[]; signal: (number | null)[]; hist: (number | null)[] };
    atr: (number | null)[];
  };
  candles: Candle[];
  x: (i: number) => number;
  bodyW: number;
}) {
  const H = SUB_H;

  if (kind === "rsi") {
    const y = (v: number) => H - (v / 100) * H;
    return (
      <>
        {/* 70 / 30 — pragurile despre care vorbește lecția */}
        {[70, 30].map((lv) => (
          <g key={lv}>
            <line x1={0} x2={W - PAD_R} y1={y(lv)} y2={y(lv)} stroke="var(--ink-4)" strokeWidth={0.6} strokeDasharray="3 4" opacity={0.5} />
            <text x={W - PAD_R + 5} y={y(lv) + 3} fontSize={8} fill="var(--ink-4)" fontFamily="monospace">
              {lv}
            </text>
          </g>
        ))}
        <polyline
          points={ind.rsi.map((v, i) => (v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`)).filter(Boolean).join(" ")}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={1.3}
          strokeLinejoin="round"
        />
      </>
    );
  }

  if (kind === "macd") {
    const vals = [...ind.macd.line, ...ind.macd.signal, ...ind.macd.hist].filter((v): v is number => v != null);
    const m = Math.max(...vals.map(Math.abs), 1e-9);
    const y = (v: number) => H / 2 - (v / m) * (H / 2 - 4);
    return (
      <>
        <line x1={0} x2={W - PAD_R} y1={y(0)} y2={y(0)} stroke="var(--ink-4)" strokeWidth={0.6} opacity={0.4} />
        {ind.macd.hist.map((v, i) =>
          v == null ? null : (
            <rect
              key={i}
              x={x(i) - bodyW / 2}
              y={Math.min(y(v), y(0))}
              width={bodyW}
              height={Math.max(Math.abs(y(v) - y(0)), 0.6)}
              fill={v >= 0 ? "#34d399" : "#fb5c72"}
              opacity={0.55}
            />
          )
        )}
        <polyline
          points={ind.macd.line.map((v, i) => (v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`)).filter(Boolean).join(" ")}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={1.3}
        />
        <polyline
          points={ind.macd.signal.map((v, i) => (v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`)).filter(Boolean).join(" ")}
          fill="none"
          stroke="#fb923c"
          strokeWidth={1.1}
        />
      </>
    );
  }

  if (kind === "atr") {
    const vals = ind.atr.filter((v): v is number => v != null);
    const max = Math.max(...vals, 1e-9);
    const y = (v: number) => H - (v / max) * (H - 6);
    return (
      <polyline
        points={ind.atr.map((v, i) => (v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`)).filter(Boolean).join(" ")}
        fill="none"
        stroke="#a78bfa"
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
    );
  }

  // volum
  const max = Math.max(...candles.map((c) => c.v || 0), 1);
  return (
    <>
      {candles.map((c, i) => {
        const h = ((c.v || 0) / max) * (H - 6);
        return (
          <rect
            key={i}
            x={x(i) - bodyW / 2}
            y={H - h}
            width={bodyW}
            height={Math.max(h, 0.5)}
            fill={c.close >= c.open ? "#34d399" : "#fb5c72"}
            opacity={0.35}
          />
        );
      })}
    </>
  );
}
