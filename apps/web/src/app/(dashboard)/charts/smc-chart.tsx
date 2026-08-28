"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { createChart, CrosshairMode, type IChartApi, type IPriceLine, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import { priceDigits, priceFormatFor } from "@/lib/price-format";
import {
  loadDrawings, saveDrawings, hitTest, newId,
  type Drawing, type DrawingTool, type Point,
} from "@/lib/chart-drawings";
import { detectSMC, type SmcResult, type SmcCandle } from "@tradegx/core";
import { Loader2 } from "lucide-react";
import { useLivePrice } from "@/lib/use-live-price";
import { cn } from "@/lib/utils";
import { normalizeSymbol } from "@/lib/symbols";
import { sma, ema, bollinger, vwap, rsi, macd, atr, heikinAshi, type Bar } from "@/lib/indicators";

export interface SmcToggles { ob: boolean; fvg: boolean; liq: boolean; struct: boolean }

interface ChartTrade {
  id: string;
  direction: "BUY" | "SELL";
  status: string;
  entryPrice: number | null;
  entryTime: number;
  exitPrice: number | null;
  exitTime: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  pnl: number | null;
}

const COL = {
  bullFill: "rgba(52,211,153,0.13)", bullLine: "rgba(52,211,153,0.55)",
  bearFill: "rgba(251,113,133,0.13)", bearLine: "rgba(251,113,133,0.55)",
  fvgBull: "rgba(129,140,248,0.14)", fvgBullLine: "rgba(129,140,248,0.45)",
  fvgBear: "rgba(167,139,250,0.14)", fvgBearLine: "rgba(167,139,250,0.45)",
  liq: "rgba(251,191,36,0.85)",
  bos: "rgba(148,163,184,0.9)", choch: "rgba(251,191,36,0.95)",
};

/** Indicatorii pe care îi poate desena graficul. Ordinea e cea din meniu. */
export const CHART_INDICATORS = [
  { id: "ema9",   group: "trend", name: "EMA 9" },
  { id: "ema21",  group: "trend", name: "EMA 21" },
  { id: "ema50",  group: "trend", name: "EMA 50" },
  { id: "ema200", group: "trend", name: "EMA 200" },
  { id: "sma50",  group: "trend", name: "SMA 50" },
  { id: "sma200", group: "trend", name: "SMA 200" },
  { id: "bb",     group: "trend", name: "Bollinger" },
  { id: "vwap",   group: "trend", name: "VWAP" },
  { id: "volume", group: "osc",   name: "Volume" },
  { id: "rsi",    group: "osc",   name: "RSI 14" },
  { id: "macd",   group: "osc",   name: "MACD" },
  { id: "atr",    group: "osc",   name: "ATR 14" },
] as const;

/** Doar ce chiar desenăm. „line"/„area" ar cere alt tip de serie — nu le
 * declarăm până nu există, ca meniul să nu ofere opțiuni moarte. */
export type ChartType = "candles" | "heikin";

/** Culoarea desenelor manuale. Una singură, deliberat: un selector de culori ar
 *  fi al patrulea meniu pe o bară deja plină, pentru un câștig estetic. */
const DRAW_COLOR = "#38bdf8";

export function SmcChart({
  symbol, timeframe, toggles, onResult, errorLabel, loadingLabel,
  indicators = [], chartType = "candles",
}: {
  symbol: string;
  timeframe: string;
  toggles: SmcToggles;
  onResult?: (r: SmcResult | null) => void;
  errorLabel: string;
  loadingLabel: string;
  indicators?: string[];
  chartType?: ChartType;
}) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const seriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);
  const smcRef = React.useRef<SmcResult | null>(null);
  const togglesRef = React.useRef(toggles);
  // Ultima lumânare încărcată. O ținem ca să o putem rescrie la fiecare tick:
  // `series.update()` cere obiectul întreg, nu doar prețul de închidere.
  const lastBarRef = React.useRef<SmcCandle | null>(null);
  // Liniile SL/TP/entry adăugate pe serie. Le ținem ca să le putem scoate la
  // schimbarea simbolului — altfel s-ar aduna una peste alta.
  const tradeLinesRef = React.useRef<IPriceLine[]>([]);
  // Alerta de preț a simbolului, dacă e în watchlist. O ținem în ref, nu în
  // stare: se schimbă la fiecare pixel de tragere, iar o re-randare React pe
  // fiecare mișcare de mouse ar face graficul să sacadeze.
  const alertRef = React.useRef<{ id: string; above: number | null; below: number | null } | null>(null);
  const alertLinesRef = React.useRef<{ above: IPriceLine | null; below: IPriceLine | null }>({ above: null, below: null });
  const handleAboveRef = React.useRef<HTMLDivElement>(null);
  const handleBelowRef = React.useRef<HTMLDivElement>(null);
  // Lumânările brute, ca să putem recalcula indicatorii fără să cerem din nou
  // de la server la fiecare bifă din meniu.
  const barsRef = React.useRef<SmcCandle[]>([]);
  const indSeriesRef = React.useRef<ISeriesApi<"Line" | "Histogram">[]>([]);
  // Legenda: ce linie e care, și cât valorează acum. Fără ea, trei medii mobile
  // pe ecran sunt trei linii colorate fără nume — vezi că se intersectează, dar
  // nu poți spune CARE a trecut peste care, ceea ce e tot ce contează la ele.
  // ── Desene manuale ──
  // Ancorate în (timp, preț), nu în pixeli: un desen legat de pixeli ar aluneca
  // la prima derulare. `drawRef` ține copia pe care o citește bucla de desenare,
  // ca aceasta să nu depindă de închideri vechi.
  const tDraw = useTranslations("chartSmc");
  const [tool, setTool] = React.useState<DrawingTool>("none");
  const [drawings, setDrawings] = React.useState<Drawing[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const drawRef = React.useRef<{ items: Drawing[]; selected: string | null; pending: Point | null; hover: { x: number; y: number } | null }>(
    { items: [], selected: null, pending: null, hover: null }
  );
  const pendingRef = React.useRef<Point | null>(null);
  // Bucla de desenare rulează în afara ciclului React, deci citește din refs, nu
  // din stare — altfel ar folosi valorile de la ultima randare.
  const toolRef = React.useRef<DrawingTool>("none");
  const decimalsRef = React.useRef(2);

  const [legend, setLegend] = React.useState<
    { label: string; color: string; value: number; digits: number }[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  togglesRef.current = toggles;

  const { price: livePrice, freshness, streaming } = useLivePrice(symbol);

  // ── Mânerele de tragere ale alertelor ──
  //
  // Nu desenăm mânerele pe canvas: canvasul e `pointer-events-none`, iar dacă
  // i-am da evenimente ar înghiți panoramarea graficului. În schimb punem două
  // benzi subțiri de 12px, invizibile, exact peste linii. Doar ele prind mouse-ul;
  // restul graficului rămâne complet normal.
  //
  // Poziționarea se face direct pe nodurile DOM, nu prin stare React: se
  // recalculează la fiecare mișcare a scalei, iar un setState acolo ar produce
  // o buclă de randare.
  const syncHandles = React.useCallback(() => {
    const series = seriesRef.current;
    const a = alertRef.current;
    const pairs: [("above" | "below"), HTMLDivElement | null][] = [
      ["above", handleAboveRef.current],
      ["below", handleBelowRef.current],
    ];
    for (const [kind, el] of pairs) {
      if (!el) continue;
      const price = a ? a[kind] : null;
      const y = price != null && series ? series.priceToCoordinate(price) : null;
      if (y == null) { el.style.display = "none"; continue; }
      el.style.display = "block";
      el.style.top = `${(y as unknown as number) - 6}px`;
    }
  }, []);

  // ── Indicatorii ──
  //
  // lightweight-charts v4 nu are panouri separate. Trucul standard: oscilatorul
  // primește propria scală de preț, înghesuită în ultimii 22% din înălțime prin
  // `scaleMargins`. Volumul la fel, în ultimii 12%. Așa arată ca panouri, fără
  // un al doilea grafic de sincronizat.
  //
  // Un singur oscilator odată. Trei suprapuse în aceeași bandă de 22% ar fi
  // ilizibile, iar comutarea între ele e mai rapidă decât descâlcirea lor.
  const rebuildIndicators = React.useCallback(() => {
    const chart = chartRef.current;
    const bars = barsRef.current;
    if (!chart) return;

    for (const s of indSeriesRef.current) {
      try { chart.removeSeries(s); } catch { /* deja scoasă */ }
    }
    indSeriesRef.current = [];
    if (bars.length === 0) return;

    const css = getComputedStyle(document.documentElement);
    const tok = (n: string, f: string) => css.getPropertyValue(n).trim() || f;
    const gain = tok("--gain", "#34d399");
    const loss = tok("--loss", "#fb5c72");
    const accent = tok("--accent", "#6d75f6");

    const closes = bars.map((b) => b.close);
    const times = bars.map((b) => b.time as UTCTimestamp);
    const has = (id: string) => indicators.includes(id);

    // Punctele cu null se OMIT, nu se trimit ca zero — o EMA care începe de la
    // zero desenează o linie verticală uriașă până la primul preț real.
    const entries: { label: string; color: string; value: number; digits: number }[] = [];

    const line = (
      vals: (number | null)[], color: string, width: 1 | 2 = 1, scaleId?: string,
      /** Numele din legendă. Lipsă = linie ajutătoare (praguri RSI, benzi) care
       *  n-are ce căuta acolo: ar tripla lista fără să adauge informație. */
      label?: string,
    ) => {
      const s = chart.addLineSeries({
        color, lineWidth: width, priceLineVisible: false, lastValueVisible: false,
        crosshairMarkerVisible: false,
        ...(scaleId ? { priceScaleId: scaleId } : {}),
      });
      s.setData(vals.map((v, i) => (v == null ? null : { time: times[i], value: v }))
        .filter(Boolean) as never);
      indSeriesRef.current.push(s);
      if (label) {
        // Ultima valoare NENULĂ: pe barele de la început indicatorul încă nu are
        // destule date, iar o legendă goală pe un indicator care se vede clar pe
        // grafic ar arăta a defect.
        for (let i = vals.length - 1; i >= 0; i--) {
          if (vals[i] != null) {
            // Oscilatorii au propria scară: RSI merge 0-100, MACD și ATR sunt
            // diferențe mici. Scrise cu zecimalele prețului, un RSI pe EURUSD ar
            // apărea „66.25000" — corect, dar ilizibil.
            const digits = scaleId === "osc" ? 2 : decimals;
            entries.push({ label, color, value: vals[i] as number, digits });
            break;
          }
        }
      }
      return s;
    };

    if (has("ema9"))   line(ema(closes, 9), "#38bdf8", 1, undefined, "EMA 9");
    if (has("ema21"))  line(ema(closes, 21), accent, 1, undefined, "EMA 21");
    if (has("ema50"))  line(ema(closes, 50), "#fbbf24", 1, undefined, "EMA 50");
    if (has("ema200")) line(ema(closes, 200), "#f472b6", 2, undefined, "EMA 200");
    if (has("sma50"))  line(sma(closes, 50), "#a78bfa", 1, undefined, "SMA 50");
    if (has("sma200")) line(sma(closes, 200), "#94a3b8", 2, undefined, "SMA 200");

    if (has("bb")) {
      const b = bollinger(closes, 20, 2);
      line(b.upper, "rgba(129,140,248,0.55)");
      line(b.mid,   "rgba(129,140,248,0.35)", 1, undefined, "BB 20");
      line(b.lower, "rgba(129,140,248,0.55)");
    }
    if (has("vwap")) line(vwap(bars as Bar[]), "#facc15", 2, undefined, "VWAP");

    if (has("volume")) {
      const s = chart.addHistogramSeries({
        priceScaleId: "vol", priceFormat: { type: "volume" },
        priceLineVisible: false, lastValueVisible: false,
      });
      s.setData(bars.map((b, i) => ({
        time: times[i],
        value: (b as unknown as { v?: number }).v ?? 0,
        color: b.close >= b.open ? `${gain}55` : `${loss}55`,
      })) as never);
      chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.88, bottom: 0 } });
      indSeriesRef.current.push(s);
    }

    // Oscilatorul: primul bifat câștigă banda de jos.
    const osc = ["rsi", "macd", "atr"].find(has);
    if (osc) {
      if (osc === "rsi") {
        line(rsi(closes, 14), accent, 1, "osc", "RSI 14");
        // Pragurile 30/70 desenate ca linii plate — reperele fără de care RSI
        // nu spune nimic.
        line(closes.map(() => 70), "rgba(148,163,184,0.28)", 1, "osc");
        line(closes.map(() => 30), "rgba(148,163,184,0.28)", 1, "osc");
      } else if (osc === "macd") {
        const m = macd(closes, 12, 26, 9);
        line(m.line, accent, 1, "osc", "MACD");
        line(m.signal, "#fbbf24", 1, "osc");
        const h = chart.addHistogramSeries({
          priceScaleId: "osc", priceLineVisible: false, lastValueVisible: false,
        });
        h.setData(m.hist.map((v, i) => (v == null ? null : {
          time: times[i], value: v, color: v >= 0 ? `${gain}88` : `${loss}88`,
        })).filter(Boolean) as never);
        indSeriesRef.current.push(h);
      } else {
        line(atr(bars as Bar[], 14), "#fbbf24", 1, "osc", "ATR 14");
      }
      chart.priceScale("osc").applyOptions({ scaleMargins: { top: 0.78, bottom: 0.02 } });
    }

    setLegend(entries);
  }, [indicators]);

  React.useEffect(() => { rebuildIndicators(); }, [rebuildIndicators]);

  // Desenele se încarcă la schimbarea instrumentului sau a intervalului: o linie
  // trasată pe EURUSD H1 n-are ce căuta pe XAUUSD D1.
  React.useEffect(() => {
    const items = loadDrawings(symbol, timeframe);
    setDrawings(items);
    setSelectedId(null);
    pendingRef.current = null;
  }, [symbol, timeframe]);

  React.useEffect(() => { toolRef.current = tool; }, [tool]);

  // Salvarea e separată de încărcare, altfel primul randare ar scrie lista goală
  // peste desenele existente înainte ca ele să apuce să fie citite.
  const loadedForRef = React.useRef<string>("");
  React.useEffect(() => {
    const key = `${symbol}|${timeframe}`;
    if (loadedForRef.current !== key) { loadedForRef.current = key; return; }
    saveDrawings(symbol, timeframe, drawings);
  }, [drawings, symbol, timeframe]);


  // ── Desenarea overlay-ului SMC pe canvas, sincron cu chartul ──
  const draw = React.useCallback(() => {
    const chart = chartRef.current, series = seriesRef.current, canvas = canvasRef.current, wrap = wrapRef.current;
    const smc = smcRef.current;
    if (!chart || !series || !canvas || !wrap || !smc) return;

    const W = wrap.clientWidth, H = wrap.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
    }
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const ts = chart.timeScale();
    const xOf = (time: number): number | null => {
      const v = ts.timeToCoordinate(time as UTCTimestamp);
      return v == null ? null : (v as unknown as number);
    };
    const yOf = (price: number): number | null => {
      const v = series.priceToCoordinate(price);
      return v == null ? null : (v as unknown as number);
    };
    const rightEdge = W - 2;
    // Inversele: din pixeli înapoi în (timp, preț). Necesare ca să știm unde ai
    // dat clic, în unitățile în care se ancorează desenele.
    const xToTime = (x: number): number | null => {
      const v = ts.coordinateToTime(x);
      return v == null ? null : (v as unknown as number);
    };
    const yToPrice = (y: number): number | null => {
      const v = series.coordinateToPrice(y);
      return v == null ? null : (v as unknown as number);
    };
    const t = togglesRef.current;

    // Zone (OB + FVG): dreptunghiuri care se extind spre dreapta
    const drawZone = (z: { time: number; top: number; bottom: number; type: "bull" | "bear"; mitigated: boolean }, fill: string, line: string) => {
      let x1 = xOf(z.time);
      const yT = yOf(z.top), yB = yOf(z.bottom);
      if (yT == null || yB == null) return;
      if (x1 == null) x1 = 0;
      x1 = Math.max(0, x1);
      if (x1 >= rightEdge) return;
      const top = Math.min(yT, yB), h = Math.abs(yT - yB);
      ctx.globalAlpha = z.mitigated ? 0.45 : 1;
      ctx.fillStyle = fill;
      ctx.fillRect(x1, top, rightEdge - x1, h);
      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      ctx.setLineDash(z.mitigated ? [3, 3] : []);
      ctx.strokeRect(x1, top, rightEdge - x1, h);
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    };

    if (t.ob) for (const z of smc.orderBlocks) {
      drawZone(z, z.type === "bull" ? COL.bullFill : COL.bearFill, z.type === "bull" ? COL.bullLine : COL.bearLine);
      // etichetă OB
      let x1 = xOf(z.time); if (x1 == null) x1 = 0;
      const yT = yOf(z.top);
      if (yT != null) { ctx.fillStyle = z.type === "bull" ? COL.bullLine : COL.bearLine; ctx.font = "bold 9px ui-monospace,monospace"; ctx.fillText("OB", Math.max(2, x1) + 3, yT + 10); }
    }
    if (t.fvg) for (const z of smc.fvgs) {
      drawZone(z, z.type === "bull" ? COL.fvgBull : COL.fvgBear, z.type === "bull" ? COL.fvgBullLine : COL.fvgBearLine);
      let x1 = xOf(z.time); if (x1 == null) x1 = 0;
      const yT = yOf(z.top);
      if (yT != null) { ctx.fillStyle = z.type === "bull" ? COL.fvgBullLine : COL.fvgBearLine; ctx.font = "bold 9px ui-monospace,monospace"; ctx.fillText("FVG", Math.max(2, x1) + 3, yT + 10); }
    }

    // Lichiditate: linii orizontale aurii punctate + etichetă BSL/SSL
    if (t.liq) for (const lv of smc.liquidity) {
      const y = yOf(lv.price);
      // `continue`, nu `return`: cu return, un singur nivel ieșit din ecran
      // oprea desenarea tuturor celor următoare ȘI a structurii de dedesubt.
      if (y == null) continue;
      ctx.strokeStyle = COL.liq;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(rightEdge, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COL.liq;
      ctx.font = "bold 9px ui-monospace,monospace";
      ctx.fillText(lv.type === "buy" ? "BSL" : "SSL", 4, y - 3);
    }

    // Structură: BOS / CHoCH — tag la punctul de break
    if (t.struct) for (const s of smc.structure) {
      const x = xOf(s.time), y = yOf(s.price);
      if (x == null || y == null) continue;
      const col = s.type === "CHOCH" ? COL.choch : COL.bos;
      ctx.strokeStyle = col; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Math.max(0, x - 22), y); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = col;
      ctx.font = "bold 9px ui-monospace,monospace";
      const label = `${s.type === "CHOCH" ? "CHoCH" : "BOS"} ${s.dir === "up" ? "▲" : "▼"}`;
      const tw = ctx.measureText(label).width;
      ctx.fillText(label, Math.min(rightEdge - tw, x + 3), y - 3);
    }

    // ── Desenele manuale, deasupra straturilor automate ──
    // Se desenează ultimele: sunt ale tale, deci nu le acoperă nimic.
    const dstate = drawRef.current;
    const toXY = (pt: Point) => {
      const px = xOf(pt.t), py = yOf(pt.price);
      return px == null || py == null ? null : { x: px, y: py };
    };

    const strokeDrawing = (d: Drawing, isSel: boolean, isPreview = false) => {
      const a = toXY(d.p1);
      if (!a) return;
      ctx.save();
      ctx.strokeStyle = d.color;
      ctx.lineWidth = isSel ? 2.5 : 1.5;
      if (isPreview) ctx.setLineDash([4, 3]);

      if (d.type === "hline") {
        // Linia orizontală traversează tot ecranul: dacă ar fi doar cât ai tras-o,
        // ar înceta să mai fie un nivel și ar deveni un segment.
        ctx.beginPath(); ctx.moveTo(0, a.y); ctx.lineTo(rightEdge, a.y); ctx.stroke();
        ctx.fillStyle = d.color;
        ctx.font = "bold 9px ui-monospace,monospace";
        ctx.fillText(d.p1.price.toFixed(decimalsRef.current), 4, a.y - 4);
      } else {
        const b = d.p2 ? toXY(d.p2) : null;
        if (!b) { ctx.restore(); return; }
        if (d.type === "trend") {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        } else {
          const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
          const w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
          ctx.fillStyle = d.color + "1f";
          ctx.fillRect(x, y, w, h);
          ctx.strokeRect(x, y, w, h);
        }
        if (isSel) {
          // Capetele se marchează doar când e selectat — altfel un grafic cu zece
          // desene ar fi presărat cu douăzeci de pătrate.
          ctx.fillStyle = d.color;
          for (const pt of [a, b]) ctx.fillRect(pt.x - 3, pt.y - 3, 6, 6);
        }
      }
      ctx.restore();
    };

    for (const d of dstate.items) strokeDrawing(d, d.id === dstate.selected);

    // Previzualizarea: ce ai fi desenat dacă dădeai clic acum. Punctată, ca să se
    // distingă de un desen comis.
    if (dstate.pending && dstate.hover) {
      const t2 = xToTime(dstate.hover.x), p2 = yToPrice(dstate.hover.y);
      if (t2 != null && p2 != null) {
        strokeDrawing(
          { id: "preview", type: toolRef.current === "none" ? "trend" : toolRef.current,
            p1: dstate.pending, p2: { t: t2, price: p2 }, color: DRAW_COLOR },
          false, true
        );
      }
    }

    // Mânerele alertelor urmăresc scala împreună cu tot restul.
    syncHandles();
  }, [syncHandles]);

  // Efectele de mai jos cheamă `draw`, deci stau DUPĂ definiția lui — altfel
  // TypeScript semnalează folosire înainte de declarare, iar la execuție ar fi
  // undefined la prima randare.
  React.useEffect(() => {
    drawRef.current.items = drawings;
    drawRef.current.selected = selectedId;
    draw();
  }, [drawings, selectedId, draw]);

  // Tastatura: Delete șterge selecția, Escape anulează desenul în curs sau
  // părăsește unealta. Fără Escape, o unealtă activă din greșeală blochează
  // derularea graficului și pare că s-a stricat.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          e.preventDefault();
          setDrawings((prev) => prev.filter((d) => d.id !== selectedId));
          setSelectedId(null);
        }
      } else if (e.key === "Escape") {
        if (pendingRef.current) { pendingRef.current = null; drawRef.current.pending = null; draw(); }
        else { setTool("none"); setSelectedId(null); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, draw]);


  // ── Init chart o singură dată ──
  React.useEffect(() => {
    if (!wrapRef.current) return;

    // Culorile vin din sistemul de design, citite la runtime. Erau scrise de
    // mână aici (`#09090b`, `#f43f5e`), deci graficul rămânea în urmă la fiecare
    // ajustare a paletei — și roșul lui nu era roșul nostru de pierdere.
    const css = getComputedStyle(document.documentElement);
    const token = (name: string, fallback: string) =>
      css.getPropertyValue(name).trim() || fallback;

    const bg    = token("--s-0", "#07080c");
    const ink   = token("--ink-3", "#8b93a5");
    const line  = token("--line-1", "rgba(39,39,42,1)");
    const gain  = token("--gain", "#34d399");
    const loss  = token("--loss", "#fb5c72");

    const chart = createChart(wrapRef.current, {
      layout: { background: { color: bg }, textColor: ink, fontFamily: "ui-sans-serif, system-ui" },
      grid: { vertLines: { color: line }, horzLines: { color: line } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: line },
      timeScale: { borderColor: line, timeVisible: true, secondsVisible: false },
      autoSize: true,
    });
    const series = chart.addCandlestickSeries({
      upColor: gain, downColor: loss, borderVisible: false,
      wickUpColor: gain, wickDownColor: loss,
      // Fără asta, lightweight-charts folosește implicitul lui: două zecimale.
      // Pe EURUSD însemna „1.17" în loc de „1.16495" — adică pipsii, unitatea în
      // care se măsoară de fapt tranzacția, lipseau de pe ecran. Se rafinează mai
      // jos, când avem prețul real; aici pornim de la ce știm din simbol.
      priceFormat: priceFormatFor(symbol),
    });
    chartRef.current = chart;
    seriesRef.current = series;

    chart.timeScale().subscribeVisibleLogicalRangeChange(draw);
    const ro = new ResizeObserver(() => draw());
    ro.observe(wrapRef.current);

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; seriesRef.current = null; };
  }, [draw]);

  // ── Încarcă lumânări la schimbarea simbolului / timeframe-ului ──
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(false);
    (async () => {
      try {
        const res = await fetch(`/api/charts/candles?symbol=${symbol}&tf=${timeframe}`, { cache: "no-store" });
        if (!res.ok) { if (!cancelled) { setError(true); setLoading(false); } return; }
        const data = await res.json();
        if (cancelled) return;
        const candles: SmcCandle[] = data.candles;
        // Heikin-Ashi netezește trendul, dar prețurile rezultate sunt medii, nu
        // cotații reale. Detecția SMC rămâne pe lumânările BRUTE — un order block
        // calculat pe medii ar arăta niveluri care nu există în piață.
        const shown = chartType === "heikin"
          ? (heikinAshi(candles as Bar[]) as unknown as SmcCandle[])
          : candles;
        seriesRef.current?.setData(shown as never);
        lastBarRef.current = shown[shown.length - 1] ?? null;

        // Cripto se formatează după preț, nu după simbol: „PEPEUSDT" nu spune
        // dacă moneda costă 0,0000042 sau 95.000. Acum avem prețul, deci putem.
        const lastClose = shown[shown.length - 1]?.close;
        if (lastClose != null) {
          seriesRef.current?.applyOptions({ priceFormat: priceFormatFor(symbol, lastClose) });
        }
        barsRef.current = candles;
        rebuildIndicators();
        chartRef.current?.timeScale().fitContent();
        const smc = detectSMC(candles, 6);
        smcRef.current = smc;
        onResult?.(smc);
        setLoading(false);
        // Desenăm sincron + o repetare scurtă (după ce chartul a așezat scala).
        // setTimeout (nu rAF) ca să funcționeze și când fereastra nu e în față.
        draw();
        setTimeout(() => { if (!cancelled) draw(); }, 80);
        setTimeout(() => { if (!cancelled) draw(); }, 300);
      } catch {
        if (!cancelled) { setError(true); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [symbol, timeframe, chartType, draw, onResult, rebuildIndicators]);

  // Redesenează când se schimbă toggle-urile
  React.useEffect(() => { draw(); }, [toggles, draw]);

  // ── Tranzacțiile mele, desenate pe grafic ──
  //
  // Ăsta e motivul pentru care merită un grafic propriu: widgetul TradingView nu
  // are cum să vadă jurnalul tău. Intrările apar ca săgeți pe lumânarea exactă,
  // ieșirile ca puncte colorate după rezultat.
  //
  // Liniile SL/TP se desenează DOAR pentru pozițiile încă deschise. Pentru 227
  // de tranzacții închise ar fi 450 de linii orizontale — un grafic ilizibil.
  React.useEffect(() => {
    let cancelled = false;
    const series = seriesRef.current;
    if (!series) return;

    (async () => {
      try {
        const res = await fetch(
          `/api/charts/trades?symbol=${encodeURIComponent(symbol)}`,
          { cache: "no-store" }
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const trades: ChartTrade[] = data.trades ?? [];
        if (cancelled || !seriesRef.current) return;

        const css = getComputedStyle(document.documentElement);
        const tok = (n: string, f: string) => css.getPropertyValue(n).trim() || f;
        const gain = tok("--gain", "#34d399");
        const loss = tok("--loss", "#fb5c72");
        const accent = tok("--accent", "#6d75f6");

        // Marcaje: săgeată la intrare, cerc la ieșire.
        const markers = trades.flatMap((tr) => {
          const isBuy = tr.direction === "BUY";
          const items: {
            time: UTCTimestamp; position: "aboveBar" | "belowBar";
            color: string; shape: "arrowUp" | "arrowDown" | "circle"; text: string;
          }[] = [{
            time: tr.entryTime as UTCTimestamp,
            position: isBuy ? "belowBar" : "aboveBar",
            color: accent,
            shape: isBuy ? "arrowUp" : "arrowDown",
            text: isBuy ? "BUY" : "SELL",
          }];

          if (tr.exitTime != null) {
            const won = (tr.pnl ?? 0) >= 0;
            items.push({
              time: tr.exitTime as UTCTimestamp,
              position: isBuy ? "aboveBar" : "belowBar",
              color: won ? gain : loss,
              shape: "circle",
              // Rezultatul pe marcaj: vezi direct dacă tranzacția a mers, fără
              // să deschizi jurnalul.
              text: tr.pnl == null ? "" : `${tr.pnl >= 0 ? "+" : ""}${Math.round(tr.pnl)}`,
            });
          }
          return items;
        });

        // lightweight-charts cere marcajele ordonate crescător după timp.
        markers.sort((a, b) => (a.time as number) - (b.time as number));
        seriesRef.current.setMarkers(markers as never);

        // Curățăm liniile de la simbolul precedent înainte să punem altele.
        for (const l of tradeLinesRef.current) {
          try { seriesRef.current.removePriceLine(l); } catch { /* deja scoasă */ }
        }
        tradeLinesRef.current = [];

        for (const tr of trades) {
          if (tr.exitTime != null) continue; // doar pozițiile deschise
          const add = (price: number | null, color: string, title: string) => {
            if (price == null || !seriesRef.current) return;
            tradeLinesRef.current.push(
              seriesRef.current.createPriceLine({
                price, color, lineWidth: 1, lineStyle: 2,
                axisLabelVisible: true, title,
              })
            );
          };
          add(tr.entryPrice, accent, "ENTRY");
          add(tr.stopLoss, loss, "SL");
          add(tr.takeProfit, gain, "TP");
        }
      } catch { /* graficul rămâne funcțional și fără marcaje */ }
    })();

    return () => { cancelled = true; };
  }, [symbol, timeframe]);


  // ── Alertele de preț: linii pe grafic, trase cu mouse-ul ──
  const loadAlerts = React.useCallback(async () => {
    const series = seriesRef.current;
    if (!series) return;

    // Curățăm liniile precedente înainte de orice.
    for (const kind of ["above", "below"] as const) {
      const l = alertLinesRef.current[kind];
      if (l) { try { series.removePriceLine(l); } catch { /* deja scoasă */ } }
      alertLinesRef.current[kind] = null;
    }
    alertRef.current = null;

    try {
      const res = await fetch("/api/watchlist", { cache: "no-store" });
      if (!res.ok) return;
      const items: { id: string; symbol: string; alertAbove: string | number | null; alertBelow: string | number | null }[] = await res.json();

      // Potrivire pe simbol normalizat: în watchlist scrie „EUR/USD", graficul
      // primește „EURUSD". Fără normalizare nu s-ar găsi niciodată.
      const wanted = normalizeSymbol(symbol);
      const item = items.find((i) => normalizeSymbol(i.symbol) === wanted);
      if (!item) { syncHandles(); return; }

      const num = (v: unknown) => (v == null ? null : Number(v));
      alertRef.current = { id: item.id, above: num(item.alertAbove), below: num(item.alertBelow) };

      const css = getComputedStyle(document.documentElement);
      const tok = (n: string, f: string) => css.getPropertyValue(n).trim() || f;

      const mk = (price: number | null, color: string, title: string) => {
        if (price == null || !seriesRef.current) return null;
        return seriesRef.current.createPriceLine({
          price, color, lineWidth: 2, lineStyle: 1,
          axisLabelVisible: true, title,
        });
      };
      alertLinesRef.current.above = mk(alertRef.current.above, tok("--gain", "#34d399"), "ALERT ▲");
      alertLinesRef.current.below = mk(alertRef.current.below, tok("--loss", "#fb5c72"), "ALERT ▼");
      syncHandles();
    } catch { /* graficul funcționează și fără alerte */ }
  }, [symbol, syncHandles]);

  React.useEffect(() => { void loadAlerts(); }, [loadAlerts]);

  /**
   * Tragerea unui prag. Pointer events, nu mouse: merg identic cu degetul pe
   * telefon, unde un trader chiar vrea să miște un stop din mers.
   *
   * Salvăm o singură dată, la eliberare — nu la fiecare pixel. Altfel am trimite
   * sute de cereri pentru o singură ajustare.
   */
  const startDrag = (kind: "above" | "below") => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const move = (ev: PointerEvent) => {
      const series = seriesRef.current, wrap = wrapRef.current, a = alertRef.current;
      if (!series || !wrap || !a) return;
      const rect = wrap.getBoundingClientRect();
      const p = series.coordinateToPrice(ev.clientY - rect.top);
      if (p == null) return;
      a[kind] = p as unknown as number;
      alertLinesRef.current[kind]?.applyOptions({ price: a[kind] as number });
      syncHandles();
    };

    const up = async () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const a = alertRef.current;
      if (!a) return;
      const value = a[kind];
      if (value == null) return;
      try {
        const res = await fetch("/api/watchlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: a.id,
            [kind === "above" ? "alertAbove" : "alertBelow"]: Number(value.toFixed(5)),
          }),
        });
        // 402 = fără PRO, 4xx = respins. Reîncărcăm din server ca linia să sară
        // înapoi la valoarea reală, în loc să mintă că s-a salvat.
        if (!res.ok) await loadAlerts();
      } catch {
        await loadAlerts();
      }
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // ── Prețul viu rescrie ultima lumânare ──
  //
  // Nu adăugăm o lumânare nouă la fiecare tick — o extindem pe cea în curs, cum
  // face orice platformă: închiderea urmează prețul, iar maximul și minimul se
  // lărgesc doar dacă prețul le depășește. Așa lumânarea „crește" în timp real
  // în loc să sară.
  React.useEffect(() => {
    const series = seriesRef.current;
    const last = lastBarRef.current;
    if (!series || !last || livePrice == null) return;

    const updated: SmcCandle = {
      ...last,
      close: livePrice,
      high: Math.max(last.high, livePrice),
      low: Math.min(last.low, livePrice),
    };
    lastBarRef.current = updated;
    series.update(updated as never);
  }, [livePrice]);

  // Cifre semnificative după virgulă: 5 la valute (unde mișcarea e în puncte a
  // patra zecimală), 2 la aur, indici și cripto. Un BTC afișat cu 5 zecimale ar
  // fi ilizibil, un EUR/USD cu 2 ar părea nemișcat.
  // Aceeași regulă ca la grafic, dintr-un singur loc. Înainte era „sub 20 →
  // 5 zecimale", care dădea 5 zecimale pe USDJPY (are nevoie de 3) și 2 pe orice
  // cripto ieftină (are nevoie de 6-8).
  const decimals = priceDigits(symbol, livePrice);
  decimalsRef.current = decimals;

  // ── Interacțiunea cu desenele ──
  //
  // Canvasul primește clicuri DOAR când e ceva de făcut: o unealtă activă, sau un
  // desen existent care ar putea fi selectat. În rest rămâne transparent la
  // evenimente, ca graficul de dedesubt să se deruleze și să se scaleze normal.
  const canvasPoint = React.useCallback((e: React.PointerEvent) => {
    const chart = chartRef.current, series = seriesRef.current, wrap = wrapRef.current;
    if (!chart || !series || !wrap) return null;
    const r = wrap.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const tv = chart.timeScale().coordinateToTime(x);
    const pv = series.coordinateToPrice(y);
    if (tv == null || pv == null) return null;
    return { x, y, t: tv as unknown as number, price: pv as unknown as number };
  }, []);

  const onCanvasDown = React.useCallback((e: React.PointerEvent) => {
    const pt = canvasPoint(e);
    if (!pt) return;
    const active = toolRef.current;

    // Fără unealtă: clicul selectează sau deselectează.
    if (active === "none") {
      const hit = hitTest(drawRef.current.items, pt.x, pt.y, (q) => {
        const chart = chartRef.current, series = seriesRef.current;
        if (!chart || !series) return null;
        const cx = chart.timeScale().timeToCoordinate(q.t as never);
        const cy = series.priceToCoordinate(q.price);
        return cx == null || cy == null ? null : { x: cx as unknown as number, y: cy as unknown as number };
      });
      setSelectedId(hit ? hit.id : null);
      return;
    }

    e.preventDefault();

    // Linia orizontală are un singur punct: se comite din primul clic.
    if (active === "hline") {
      setDrawings((prev) => [...prev, {
        id: newId(), type: "hline", p1: { t: pt.t, price: pt.price }, color: DRAW_COLOR,
      }]);
      setTool("none");
      return;
    }

    // Trend și dreptunghi: primul clic pune ancora, al doilea o închide.
    if (!pendingRef.current) {
      pendingRef.current = { t: pt.t, price: pt.price };
      drawRef.current.pending = pendingRef.current;
      return;
    }
    const p1 = pendingRef.current;
    pendingRef.current = null;
    drawRef.current.pending = null;
    // Un „desen" de doi pixeli e aproape sigur un clic dublu accidental, nu o
    // intenție. L-am lăsa pe grafic fără să-l poți vedea sau selecta.
    if (Math.abs(pt.t - p1.t) < 1 && Math.abs(pt.price - p1.price) < 1e-9) { draw(); return; }
    setDrawings((prev) => [...prev, {
      id: newId(), type: active === "rect" ? "rect" : "trend",
      p1, p2: { t: pt.t, price: pt.price }, color: DRAW_COLOR,
    }]);
    setTool("none");
  }, [canvasPoint, draw]);

  const onCanvasMove = React.useCallback((e: React.PointerEvent) => {
    if (!pendingRef.current) return;
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    drawRef.current.hover = { x: e.clientX - r.left, y: e.clientY - r.top };
    draw();
  }, [draw]);

  const drawingActive = tool !== "none" || drawings.length > 0;

  return (
    <div className="relative h-full w-full">
      <div ref={wrapRef} className="absolute inset-0" />
      {/* Canvasul lasă evenimentele să treacă spre grafic CÂND nu e nimic de făcut.
          Altfel graficul n-ar mai putea fi derulat sau scalat — cea mai enervantă
          formă de „instrument de desen": una care confiscă tot. */}
      <canvas
        ref={canvasRef}
        onPointerDown={drawingActive ? onCanvasDown : undefined}
        onPointerMove={tool !== "none" ? onCanvasMove : undefined}
        className={cn(
          "absolute inset-0",
          drawingActive ? "" : "pointer-events-none",
          tool !== "none" ? "cursor-crosshair" : "",
        )}
        style={drawingActive && tool === "none" ? { pointerEvents: "auto" } : undefined}
      />

      {/* Bara de desen: verticală, pe stânga, sub legendă. Iconițele sunt trase cu
          SVG inline în loc de o bibliotecă nouă — trei forme geometrice nu justifică
          o dependență. */}
      <div className="absolute left-2 z-30 flex flex-col gap-1" style={{ top: legend.length > 0 ? 8 + legend.length * 18 + 8 : 8 }}>
        {([
          ["none",  "toolCursor", "M4 2 L4 14 L7 11 L9 15 L11 14 L9 10 L13 10 Z"],
          ["trend", "toolTrend",  "M2 14 L14 2"],
          ["hline", "toolHLine",  "M2 8 L14 8"],
          ["rect",  "toolRect",   "M3 4 H13 V12 H3 Z"],
        ] as const).map(([id, labelKey, d]) => (
          <button
            key={id}
            type="button"
            title={tDraw(labelKey)}
            onClick={() => {
              setTool(id as DrawingTool);
              pendingRef.current = null;
              drawRef.current.pending = null;
              if (id !== "none") setSelectedId(null);
            }}
            className={cn(
              "w-7 h-7 grid place-items-center rounded-lg border backdrop-blur-sm transition-colors",
              tool === id
                ? "border-[color:var(--accent)] bg-[color:var(--accent)]/15 text-[color:var(--accent)]"
                : "border-[color:var(--line-1)] bg-[color:var(--s-1)]/80 text-[color:var(--ink-3)] hover:text-[color:var(--ink-1)]"
            )}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill={id === "none" ? "currentColor" : "none"}
                 stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d={d} />
            </svg>
          </button>
        ))}

        {/* Ștergerea apare doar când ai ce șterge. Un buton de coș permanent, pe un
            grafic gol, e o promisiune de distrugere fără obiect. */}
        {(selectedId || drawings.length > 0) && (
          <button
            type="button"
            title={selectedId ? tDraw("delSelected") : tDraw("delAll")}
            onClick={() => {
              if (selectedId) {
                setDrawings((prev) => prev.filter((d) => d.id !== selectedId));
                setSelectedId(null);
              } else {
                setDrawings([]);
              }
            }}
            className="w-7 h-7 grid place-items-center rounded-lg border border-rose-500/30 bg-[color:var(--s-1)]/80 text-rose-400 hover:bg-rose-500/10 backdrop-blur-sm transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor"
                 strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 4 H13 M6.5 4 V2.5 H9.5 V4 M4.5 4 L5 13.5 H11 L11.5 4" />
            </svg>
          </button>
        )}
      </div>

      {/* Mânerele alertelor: benzi de 12px exact peste linii. Invizibile, dar
          apucabile — cu mouse-ul sau cu degetul. `touchAction: none` doar aici,
          ca gestul de tragere să nu fie confundat cu derularea paginii; restul
          graficului își păstrează gesturile intacte. */}
      <div
        ref={handleAboveRef}
        onPointerDown={startDrag("above")}
        style={{ display: "none", touchAction: "none" }}
        className="absolute left-0 right-0 h-3 z-20 cursor-ns-resize"
      />
      <div
        ref={handleBelowRef}
        onPointerDown={startDrag("below")}
        style={{ display: "none", touchAction: "none" }}
        className="absolute left-0 right-0 h-3 z-20 cursor-ns-resize"
      />

      {/* Legenda indicatorilor: stânga-sus, ca să nu intre în prețul viu din
          dreapta. `pointer-events-none` fiindcă graficul de dedesubt trebuie să
          rămână tragabil — o legendă care fură clicurile e mai enervantă decât
          una lipsă.

          Mediile mobile folosesc zecimalele prețului — scrise cu două, pe EURUSD
          ar arăta identic ore în șir. Oscilatorii folosesc două, că au altă
          scară. */}
      {legend.length > 0 && (
        <div className="absolute top-2 left-2 z-20 flex flex-col gap-0.5 pointer-events-none">
          {legend.map((l) => (
            <div
              key={l.label}
              className="flex items-center gap-1.5 rounded bg-[color:var(--s-1)]/75 px-1.5 py-0.5 backdrop-blur-sm w-fit"
            >
              <span className="w-2 h-[2px] rounded-full shrink-0" style={{ background: l.color }} />
              <span className="text-[10px] font-semibold text-[color:var(--ink-3)]">{l.label}</span>
              <span className="text-[10px] font-bold tabular-nums text-[color:var(--ink-2)]">
                {l.value.toFixed(l.digits)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Prețul viu. Fără text tradus: doar cifra, un punct colorat pentru
          starea fluxului și, la instrumentele întârziate, minutele de decalaj —
          „min" se citește la fel în ambele limbi. */}
      {livePrice != null && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-2 rounded-lg border border-[color:var(--line-1)] bg-[color:var(--s-1)]/90 px-2.5 py-1 backdrop-blur-sm pointer-events-none">
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              freshness === "delayed" ? "bg-zinc-500"
                : streaming ? "bg-emerald-400 animate-pulse"
                : "bg-amber-400"
            )}
          />
          <span className="text-[13px] font-bold tabular-nums text-[color:var(--ink-1)]">
            {livePrice.toFixed(decimals)}
          </span>
          {freshness === "delayed" && (
            <span className="text-[9px] font-semibold text-zinc-500">10 min</span>
          )}
        </div>
      )}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/40 backdrop-blur-[1px] z-10">
          <div className="flex items-center gap-2 text-xs text-zinc-400"><Loader2 className="w-4 h-4 animate-spin text-indigo-400" />{loadingLabel}</div>
        </div>
      )}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p className="text-xs text-zinc-500">{errorLabel}</p>
        </div>
      )}
    </div>
  );
}
