"use client";

import * as React from "react";
import { X, Loader2, PlayCircle } from "lucide-react";

interface Candle { time: number; open: number; high: number; low: number; close: number; }
interface ReplayData {
  symbol: string; direction: "BUY" | "SELL"; timeframe: string;
  entryPrice: number; exitPrice: number | null; stopLoss: number | null; takeProfit: number | null;
  entryTime: string; exitTime: string; candles: Candle[]; dataError: string | null;
}

export function TradeReplay({ tradeId, open, onClose }: { tradeId: string; open: boolean; onClose: () => void }) {
  const [data, setData] = React.useState<ReplayData | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    setData(null);
    fetch(`/api/trades/${tradeId}/replay`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [open, tradeId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <PlayCircle className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-zinc-200">Replay tranzacție</h3>
              {data && <p className="text-[11px] text-zinc-500">{data.symbol} · {data.direction} · {data.timeframe}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conținut */}
        <div className="p-5">
          {loading ? (
            <div className="h-80 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
              <p className="text-sm text-zinc-500">Se încarcă datele istorice...</p>
            </div>
          ) : !data || data.dataError || data.candles.length < 3 ? (
            <div className="h-80 flex flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm text-zinc-400">Nu am putut încărca graficul pentru această tranzacție.</p>
              <p className="text-xs text-zinc-600 max-w-sm">
                {data?.dataError ?? "Date istorice indisponibile pentru acest simbol/perioadă."} Replay-ul funcționează pentru simbolurile standard (forex major, metale, indici, crypto).
              </p>
            </div>
          ) : (
            <ReplayChart data={data} />
          )}
        </div>
      </div>
    </div>
  );
}

function ReplayChart({ data }: { data: ReplayData }) {
  const W = 760, H = 380, padL = 8, padR = 64, padT = 16, padB = 24;
  const { candles } = data;

  // Domeniu preț (include nivelurile)
  const levels = [data.entryPrice, data.exitPrice, data.stopLoss, data.takeProfit].filter((v): v is number => v != null);
  let lo = Math.min(...candles.map((c) => c.low), ...levels);
  let hi = Math.max(...candles.map((c) => c.high), ...levels);
  const pad = (hi - lo) * 0.08 || hi * 0.001;
  lo -= pad; hi += pad;

  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const x = (i: number) => padL + (i / Math.max(1, candles.length - 1)) * plotW;
  const y = (p: number) => padT + (1 - (p - lo) / (hi - lo)) * plotH;
  const cw = Math.max(1.5, (plotW / candles.length) * 0.6);

  // Index candle cel mai apropiat de un timestamp
  const idxAt = (iso: string) => {
    const t = new Date(iso).getTime();
    let best = 0, bestD = Infinity;
    candles.forEach((c, i) => { const d = Math.abs(c.time - t); if (d < bestD) { bestD = d; best = i; } });
    return best;
  };
  const entryIdx = idxAt(data.entryTime);
  const exitIdx = idxAt(data.exitTime);

  const fmt = (p: number) => (p >= 1000 ? p.toFixed(1) : p.toFixed(p < 10 ? 5 : 3));

  const levelLine = (price: number | null, color: string, label: string, dash = true) => {
    if (price == null) return null;
    const yy = y(price);
    return (
      <g>
        <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke={color} strokeWidth="1" strokeDasharray={dash ? "4 3" : undefined} opacity="0.9" />
        <rect x={W - padR} y={yy - 7} width={padR} height={14} fill={color} opacity="0.18" />
        <text x={W - padR + 4} y={yy + 3} fill={color} fontSize="9" fontWeight="700" fontFamily="monospace">{label} {fmt(price)}</text>
      </g>
    );
  };

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 600 }}>
        {/* Zona trade-ului (entry→exit) */}
        <rect x={x(entryIdx)} y={padT} width={Math.max(2, x(exitIdx) - x(entryIdx))} height={plotH} fill="rgba(99,102,241,0.07)" />

        {/* Lumânări */}
        {candles.map((c, i) => {
          const up = c.close >= c.open;
          const col = up ? "#34d399" : "#f87171";
          const bodyTop = y(Math.max(c.open, c.close));
          const bodyH = Math.max(1, Math.abs(y(c.open) - y(c.close)));
          return (
            <g key={i}>
              <line x1={x(i)} y1={y(c.high)} x2={x(i)} y2={y(c.low)} stroke={col} strokeWidth="1" opacity="0.8" />
              <rect x={x(i) - cw / 2} y={bodyTop} width={cw} height={bodyH} fill={col} opacity="0.95" />
            </g>
          );
        })}

        {/* Niveluri */}
        {levelLine(data.takeProfit, "#34d399", "TP")}
        {levelLine(data.stopLoss, "#f43f5e", "SL")}
        {levelLine(data.entryPrice, "#818cf8", "Entry", false)}
        {data.exitPrice != null && levelLine(data.exitPrice, "#a1a1aa", "Exit")}

        {/* Markere entry/exit */}
        <circle cx={x(entryIdx)} cy={y(data.entryPrice)} r="4" fill="#818cf8" stroke="#fff" strokeWidth="1" />
        {data.exitPrice != null && <circle cx={x(exitIdx)} cy={y(data.exitPrice)} r="4" fill="#a1a1aa" stroke="#fff" strokeWidth="1" />}
      </svg>

      {/* Legendă */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-indigo-400" /> Entry</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-rose-500" style={{ borderTop: "1px dashed" }} /> Stop Loss</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-400" /> Take Profit</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-zinc-500" /> Exit</span>
        <span className="text-zinc-600">· zona albastră = durata tranzacției</span>
      </div>
    </div>
  );
}
