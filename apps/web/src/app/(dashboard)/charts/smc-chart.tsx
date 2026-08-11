"use client";

import * as React from "react";
import { createChart, CrosshairMode, type IChartApi, type IPriceLine, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import { detectSMC, type SmcResult, type SmcCandle } from "@tradegx/core";
import { Loader2 } from "lucide-react";
import { useLivePrice } from "@/lib/use-live-price";
import { cn } from "@/lib/utils";

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
  // Ultima lumânare încărcată. O ținem ca să o putem rescrie la fiecare tick:
  // `series.update()` cere obiectul întreg, nu doar prețul de închidere.
  const lastBarRef = React.useRef<SmcCandle | null>(null);
  // Liniile SL/TP/entry adăugate pe serie. Le ținem ca să le putem scoate la
  // schimbarea simbolului — altfel s-ar aduna una peste alta.
  const tradeLinesRef = React.useRef<IPriceLine[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  togglesRef.current = toggles;

  const { price: livePrice, freshness, streaming } = useLivePrice(symbol);

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
  }, []);

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
        lastBarRef.current = candles[candles.length - 1] ?? null;
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
  }, [symbol, timeframe, draw, onResult]);

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
  const decimals = livePrice != null && livePrice < 20 ? 5 : 2;

  return (
    <div className="relative h-full w-full">
      <div ref={wrapRef} className="absolute inset-0" />
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

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
