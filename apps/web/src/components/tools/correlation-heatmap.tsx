"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface CorrData {
  symbols: string[];
  matrix: (number | null)[][] | null;
  days?: number;
  error?: string;
}

// Culoare în funcție de corelație: +1 verde, 0 neutru, -1 roșu
function corrColor(v: number | null): string {
  if (v === null) return "rgba(63,63,70,0.3)";
  if (v >= 0) {
    const a = Math.min(1, v) * 0.85;
    return `rgba(16,185,129,${a + 0.05})`;
  }
  const a = Math.min(1, Math.abs(v)) * 0.85;
  return `rgba(244,63,94,${a + 0.05})`;
}

function short(sym: string): string {
  // EURUSD → EUR/USD, XAUUSD → XAU/USD
  return sym.length === 6 ? `${sym.slice(0, 3)}/${sym.slice(3)}` : sym;
}

export function CorrelationHeatmap() {
  const [data, setData] = React.useState<CorrData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/market/correlations", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/80 p-5 premium-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-bold text-zinc-200">Matrice de corelație</p>
          <p className="text-[11px] text-zinc-600">
            Pe randamentele zilnice {data?.days ? `· ${data.days} zile` : ""} — evită expunerea dublă
          </p>
        </div>
        <button onClick={load} disabled={loading} className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {loading && !data ? (
        <div className="h-64 bg-zinc-800/40 rounded-xl animate-pulse" />
      ) : !data?.matrix ? (
        <p className="text-sm text-zinc-500 text-center py-8">Date de corelație indisponibile momentan.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="border-collapse mx-auto">
            <thead>
              <tr>
                <th className="w-16"></th>
                {data.symbols.map((s) => (
                  <th key={s} className="px-1 py-1 text-[9px] font-bold text-zinc-500 rotate-0 whitespace-nowrap">
                    {short(s)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.symbols.map((rowSym, i) => (
                <tr key={rowSym}>
                  <td className="pr-2 text-[10px] font-bold text-zinc-400 text-right whitespace-nowrap">{short(rowSym)}</td>
                  {data.symbols.map((_, j) => {
                    const v = data.matrix![i][j];
                    return (
                      <td key={j} className="p-0.5">
                        <div
                          className="w-11 h-9 rounded flex items-center justify-center text-[10px] font-bold num"
                          style={{ background: corrColor(v), color: v !== null && Math.abs(v) > 0.5 ? "#fff" : "#a1a1aa" }}
                          title={`${short(rowSym)} vs ${short(data.symbols[j])}: ${v ?? "—"}`}
                        >
                          {v === null ? "—" : v.toFixed(2)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legendă */}
      <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: "rgba(16,185,129,0.7)" }} /> Corelație pozitivă (se mișcă la fel)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: "rgba(244,63,94,0.7)" }} /> Negativă (opus)</span>
      </div>
    </div>
  );
}
