"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { positionSize, riskReward } from "@tradegx/core";
import { Crosshair, X, RefreshCw, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Instrumentul de risc vizual ──────────────────────────────────────────────
// Riglă verticală de preț cu mânere draggabile (Entry / SL / TP), zone
// colorate risc/profit și calcul live (lot, $, R:R) cu motorul @tradegx/core.

const CCY = new Set(["EUR", "GBP", "USD", "AUD", "NZD", "CAD", "CHF", "JPY"]);
function isForex(symbol: string): boolean {
  return symbol.length === 6 && CCY.has(symbol.slice(0, 3)) && CCY.has(symbol.slice(3));
}
function decimalsFor(symbol: string, price: number): number {
  if (isForex(symbol)) return /JPY/.test(symbol) ? 3 : 5;
  if (price >= 500) return 1;
  if (price >= 10) return 2;
  return 4;
}

type Handle = "entry" | "sl" | "tp";

export function RiskPanel({
  open, onClose, symbol,
}: {
  open: boolean; onClose: () => void; symbol: string;
}) {
  const t = useTranslations("chartRisk");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState(false);
  const [price, setPrice] = React.useState<number | null>(null);
  const [balance, setBalance] = React.useState(10000);
  const [currency, setCurrency] = React.useState("USD");
  const [direction, setDirection] = React.useState<"BUY" | "SELL">("BUY");
  const [riskPct, setRiskPct] = React.useState(1);
  const [entry, setEntry] = React.useState(0);
  const [sl, setSl] = React.useState(0);
  const [tp, setTp] = React.useState(0);
  const [range, setRange] = React.useState<{ min: number; max: number }>({ min: 0, max: 1 });
  const trackRef = React.useRef<HTMLDivElement>(null);
  const dragging = React.useRef<Handle | null>(null);

  const dec = price ? decimalsFor(symbol, price) : 5;
  const fmt = (v: number) => v.toFixed(dec);

  // Setează valorile implicite în jurul prețului live
  const applyDefaults = React.useCallback((p: number, dir: "BUY" | "SELL") => {
    const slDist = p * 0.004; // ~0.4% distanță implicită de stop
    const e = p;
    const s = dir === "BUY" ? p - slDist : p + slDist;
    const tpv = dir === "BUY" ? p + slDist * 2 : p - slDist * 2; // 2R implicit
    setEntry(e); setSl(s); setTp(tpv);
    const pad = slDist * 3.5;
    setRange({ min: p - pad, max: p + pad });
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true); setErr(false);
    try {
      const res = await fetch(`/api/charts/quote?symbol=${symbol}`, { cache: "no-store" });
      if (!res.ok) { setErr(true); return; }
      const data = await res.json();
      setPrice(data.price);
      setBalance(data.balance);
      setCurrency(data.currency);
      applyDefaults(data.price, direction);
    } catch { setErr(true); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  React.useEffect(() => { if (open) load(); }, [open, load]);

  // flip direcție → re-așază SL/TP simetric
  function flip(dir: "BUY" | "SELL") {
    setDirection(dir);
    if (price) applyDefaults(price, dir);
  }

  // ── Drag pe rigla verticală ──
  const priceAtY = React.useCallback((clientY: number) => {
    const el = trackRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientY - r.top) / r.height));
    return range.max - frac * (range.max - range.min); // sus = max
  }, [range]);

  const yFor = (v: number) => {
    const frac = (range.max - v) / (range.max - range.min);
    return Math.min(100, Math.max(0, frac * 100));
  };

  React.useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!dragging.current) return;
      const p = priceAtY(e.clientY);
      if (p == null) return;
      if (dragging.current === "entry") setEntry(p);
      else if (dragging.current === "sl") setSl(p);
      else setTp(p);
    }
    function onUp() { dragging.current = null; document.body.style.userSelect = ""; }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [priceAtY]);

  function startDrag(h: Handle) {
    return (e: React.PointerEvent) => { e.preventDefault(); dragging.current = h; document.body.style.userSelect = "none"; };
  }

  // ── Calcule (motorul din @tradegx/core) ──
  const forex = isForex(symbol);
  const riskMoney = balance * (riskPct / 100);
  const rr = entry && sl && tp ? riskReward(entry, sl, tp) : null;
  const lots = forex && entry && sl ? positionSize({ balance, riskPct, entryPrice: entry, stopLoss: sl, symbol }) : null;
  const units = !forex && entry && sl && Math.abs(entry - sl) > 0 ? riskMoney / Math.abs(entry - sl) : null;
  const rewardMoney = rr != null ? riskMoney * rr : null;
  const slWrong = direction === "BUY" ? sl >= entry : sl <= entry;
  const tpWrong = direction === "BUY" ? tp <= entry : tp >= entry;

  const zoneTop = (a: number, b: number) => Math.min(yFor(a), yFor(b));
  const zoneH = (a: number, b: number) => Math.abs(yFor(a) - yFor(b));

  const HANDLES: { h: Handle; v: number; color: string; label: string }[] = [
    { h: "tp", v: tp, color: "52,211,153", label: "TP" },
    { h: "entry", v: entry, color: "129,140,248", label: "E" },
    { h: "sl", v: sl, color: "251,113,133", label: "SL" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
          className="fixed right-3 top-16 bottom-3 w-[340px] z-50 flex flex-col rounded-2xl border border-emerald-500/25 bg-zinc-950/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden"
        >
          <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-zinc-800/70">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <Crosshair className="w-3.5 h-3.5 text-emerald-300" />
              </div>
              <div>
                <p className="text-xs font-black text-zinc-100">{t("title")}</p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-emerald-400/70">
                  {symbol}{price ? ` · ${fmt(price)}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={load} disabled={loading} className="text-zinc-600 hover:text-zinc-300 transition-colors p-1">
                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              </button>
              <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {err && (
              <div className="text-center py-10">
                <p className="text-xs text-zinc-400">{t("noPrice")}</p>
                <button onClick={load} className="mt-3 text-xs font-bold text-emerald-300">{t("retry")}</button>
              </div>
            )}

            {!err && price != null && (
              <div className="space-y-4">
                {/* Direcție + risc % */}
                <div className="flex gap-2">
                  <div className="flex flex-1 rounded-lg overflow-hidden border border-zinc-800">
                    <button onClick={() => flip("BUY")} className={cn("flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-black transition-all", direction === "BUY" ? "bg-emerald-500/20 text-emerald-300" : "text-zinc-500 hover:text-zinc-300")}>
                      <TrendingUp className="w-3.5 h-3.5" />BUY
                    </button>
                    <button onClick={() => flip("SELL")} className={cn("flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-black transition-all", direction === "SELL" ? "bg-rose-500/20 text-rose-300" : "text-zinc-500 hover:text-zinc-300")}>
                      <TrendingDown className="w-3.5 h-3.5" />SELL
                    </button>
                  </div>
                </div>

                <div>
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-zinc-500 mb-1.5">{t("riskPct")}</p>
                  <div className="flex gap-1">
                    {[0.25, 0.5, 1, 2].map((r) => (
                      <button key={r} onClick={() => setRiskPct(r)} className={cn("flex-1 py-1.5 rounded-lg text-xs font-black border transition-all", riskPct === r ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200" : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200")}>
                        {r}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rigla verticală + inputuri */}
                <div className="flex gap-3">
                  <div ref={trackRef} className="relative w-16 rounded-xl bg-zinc-900/60 border border-zinc-800" style={{ height: 240, touchAction: "none" }}>
                    {/* zona de profit */}
                    <div className="absolute left-1 right-1 rounded-sm pointer-events-none" style={{ top: `${zoneTop(entry, tp)}%`, height: `${zoneH(entry, tp)}%`, background: "linear-gradient(180deg, rgba(52,211,153,0.25), rgba(52,211,153,0.08))" }} />
                    {/* zona de risc */}
                    <div className="absolute left-1 right-1 rounded-sm pointer-events-none" style={{ top: `${zoneTop(entry, sl)}%`, height: `${zoneH(entry, sl)}%`, background: "linear-gradient(180deg, rgba(251,113,133,0.10), rgba(251,113,133,0.28))" }} />
                    {/* linia prețului live */}
                    <div className="absolute left-0 right-0 border-t border-dashed border-zinc-600 pointer-events-none" style={{ top: `${yFor(price)}%` }} />
                    {/* mânere */}
                    {HANDLES.map(({ h, v, color, label }) => (
                      <div key={h} onPointerDown={startDrag(h)}
                        className="absolute left-0 right-0 cursor-ns-resize group"
                        style={{ top: `calc(${yFor(v)}% - 9px)`, height: 18 }}>
                        <div className="absolute inset-x-0 top-1/2 h-[2px]" style={{ background: `rgba(${color},0.9)` }} />
                        <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-transform group-hover:scale-125"
                          style={{ background: "#0b0b10", borderColor: `rgb(${color})` }} />
                        <span className="absolute left-1 top-1/2 -translate-y-1/2 font-mono text-[8px] font-black" style={{ color: `rgb(${color})` }}>{label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-1 gap-2">
                    <PriceInput label="TP" color="text-emerald-300" value={tp} dec={dec} onChange={setTp} warn={tpWrong} />
                    <PriceInput label="Entry" color="text-indigo-300" value={entry} dec={dec} onChange={setEntry} />
                    <PriceInput label="SL" color="text-rose-300" value={sl} dec={dec} onChange={setSl} warn={slWrong} />
                  </div>
                </div>

                {(slWrong || tpWrong) && (
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-lg px-2.5 py-1.5">
                    <AlertTriangle className="w-3 h-3 shrink-0" />{t("sideWarn", { dir: direction })}
                  </div>
                )}

                {/* Rezultate */}
                <div className="grid grid-cols-2 gap-2">
                  <Stat label={t("risk")} value={`-${riskMoney.toFixed(2)} ${currency}`} cls="text-rose-300" />
                  <Stat label={t("reward")} value={rewardMoney != null ? `+${rewardMoney.toFixed(2)} ${currency}` : "—"} cls="text-emerald-300" />
                  <Stat label="R:R" value={rr != null ? `1 : ${rr}` : "—"} cls={rr != null && rr >= 2 ? "text-emerald-300" : rr != null && rr >= 1 ? "text-amber-300" : "text-rose-300"} big />
                  <Stat label={forex ? t("lots") : t("units")} value={forex ? (lots != null ? lots.toFixed(2) : "—") : units != null ? units.toFixed(2) : "—"} cls="text-indigo-300" big />
                </div>

                <p className="text-[9px] text-zinc-700 text-center">{t("note", { balance: balance.toFixed(0), currency })}</p>
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function PriceInput({ label, color, value, dec, onChange, warn }: {
  label: string; color: string; value: number; dec: number; onChange: (v: number) => void; warn?: boolean;
}) {
  return (
    <div className={cn("rounded-lg border bg-zinc-900/60 px-2.5 py-1.5", warn ? "border-amber-500/50" : "border-zinc-800")}>
      <p className={cn("font-mono text-[8px] font-black uppercase tracking-widest", color)}>{label}</p>
      <input
        type="number"
        step={1 / 10 ** dec}
        value={Number.isFinite(value) ? +value.toFixed(dec) : ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-transparent text-sm font-bold text-zinc-100 num focus:outline-none"
      />
    </div>
  );
}

function Stat({ label, value, cls, big }: { label: string; value: string; cls: string; big?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5">
      <p className="font-mono text-[8px] font-bold uppercase tracking-widest text-zinc-600 mb-0.5">{label}</p>
      <p className={cn("font-black num", cls, big ? "text-lg" : "text-sm")}>{value}</p>
    </div>
  );
}
