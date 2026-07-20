"use client";

import * as React from "react";
import { createChart, CrosshairMode, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import { detectSMC, type SmcResult, type SmcCandle } from "@tradegx/core";
import { Loader2 } from "lucide-react";

export interface SmcToggles { ob: boolean; fvg: boolean; liq: boolean; struct: boolean }

const COL = {
  bullFill: "rgba(52,211,153,0.13)", bullLine: "rgba(52,211,153,0.55)",
  bearFill: "rgba(251,113,133,0.13)", bearLine: "rgba(251,113,133,0.55)",
  fvgBull: "rgba(129,140,248,0.14)", fvgBullLine: "rgba(129,140,248,0.45)",
  fvgBear: "rgba(167,139,250,0.14)", fvgBearLine: "rgba(167,139,250,0.45)",
  liq: "rgba(251,191,36,0.85)",
  bos: "rgba(148,163,184,0.9)", choch: "rgba(251,191,36,0.95)",
};

export function SmcChart({
  symbol, timeframe, toggles, onResult, errorLabel, loadingLabel,
}: {
  symbol: string;
  timeframe: string;
  toggles: SmcToggles;
  onResult?: (r: SmcResult | null) => void;
  errorLabel: string;
  loadingLabel: string;
}) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const seriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);
  const smcRef = React.useRef<SmcResult | null>(null);
  const togglesRef = React.useRef(toggles);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  togglesRef.current = toggles;

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
      if (y == null) return;
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
  }, []);

  // ── Init chart o singură dată ──
  React.useEffect(() => {
    if (!wrapRef.current) return;
    const chart = createChart(wrapRef.current, {
      layout: { background: { color: "#09090b" }, textColor: "#a1a1aa", fontFamily: "ui-sans-serif, system-ui" },
      grid: { vertLines: { color: "rgba(39,39,42,0.5)" }, horzLines: { color: "rgba(39,39,42,0.5)" } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "rgba(39,39,42,1)" },
      timeScale: { borderColor: "rgba(39,39,42,1)", timeVisible: true, secondsVisible: false },
      autoSize: true,
    });
    const series = chart.addCandlestickSeries({
      upColor: "#34d399", downColor: "#f43f5e", borderVisible: false,
      wickUpColor: "#34d399", wickDownColor: "#f43f5e",
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
        seriesRef.current?.setData(candles as never);
        chartRef.current?.timeScale().fitContent();
        const smc = detectSMC(candles, 6);
        smcRef.current = smc;
        onResult?.(smc);
        requestAnimationFrame(() => { draw(); setLoading(false); });
      } catch {
        if (!cancelled) { setError(true); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [symbol, timeframe, draw, onResult]);

  // Redesenează când se schimbă toggle-urile
  React.useEffect(() => { draw(); }, [toggles, draw]);

  return (
    <div className="relative h-full w-full">
      <div ref={wrapRef} className="absolute inset-0" />
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
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
