"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Brain, X, TrendingUp, TrendingDown, MoveHorizontal, Target, Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeyLevel { price: string; type: "support" | "resistance" | "liquidity" }
interface Analysis {
  bias: "BULLISH" | "BEARISH" | "RANGE";
  confidence: number;
  summary: string;
  structure: string;
  keyLevels: KeyLevel[];
  plan: string;
  personalNote: string;
}
interface Result { symbol: string; timeframe: string; price: string; analysis: Analysis; hasPersonal: boolean }

const BIAS_CFG = {
  BULLISH: { color: "52,211,153", Icon: TrendingUp },
  BEARISH: { color: "251,113,133", Icon: TrendingDown },
  RANGE:   { color: "251,191,36",  Icon: MoveHorizontal },
} as const;

const LEVEL_CFG: Record<string, string> = {
  support: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
  resistance: "text-rose-300 border-rose-500/40 bg-rose-500/10",
  liquidity: "text-amber-300 border-amber-500/40 bg-amber-500/10",
};

export function AnalyzePanel({
  open, onClose, symbol, timeframe, locale,
}: {
  open: boolean; onClose: () => void; symbol: string; timeframe: string; locale: string;
}) {
  const t = useTranslations("chartAI");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<Result | null>(null);
  const [error, setError] = React.useState<{ code: string; msg: string } | null>(null);
  const requestedFor = React.useRef<string>("");

  const key = `${symbol}:${timeframe}`;

  const run = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    requestedFor.current = key;
    try {
      const res = await fetch("/api/charts/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, timeframe, locale }),
      });
      const data = await res.json().catch(() => ({}));
      if (requestedFor.current !== key) return; // s-a schimbat simbolul între timp
      if (res.status === 402) { setError({ code: "PRO", msg: "" }); return; }
      if (res.status === 429) { setError({ code: "RATE", msg: data.error ?? "" }); return; }
      if (!res.ok || !data.ok) { setError({ code: "ERR", msg: data.error ?? "" }); return; }
      setResult(data as Result);
    } catch {
      setError({ code: "ERR", msg: "" });
    } finally {
      setLoading(false);
    }
  }, [key, symbol, timeframe, locale]);

  // Analizează automat la deschidere / la schimbarea simbolului cât e deschis
  React.useEffect(() => {
    if (!open) return;
    if (result && result.symbol === symbol.replace(/[^A-Z0-9]/gi, "").toUpperCase() && requestedFor.current === key && !loading) return;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, key]);

  const a = result?.analysis;
  const biasCfg = a ? BIAS_CFG[a.bias] ?? BIAS_CFG.RANGE : BIAS_CFG.RANGE;

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
          className="fixed right-3 top-16 bottom-3 w-[340px] z-50 flex flex-col rounded-2xl border border-indigo-500/25 bg-zinc-950/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden"
        >
          {/* fascicul + antet */}
          <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent" />
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-zinc-800/70">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-indigo-300" />
              </div>
              <div>
                <p className="text-xs font-black text-zinc-100">{t("title")}</p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-indigo-400/70">
                  {symbol} · {result?.timeframe ?? ""} {result?.price ? `· ${result.price}` : ""}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Loading: scanare */}
            {loading && (
              <div className="relative py-14 text-center overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-900/40">
                <motion.div
                  aria-hidden
                  initial={{ y: "-100%" }}
                  animate={{ y: ["-100%", "1000%"] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-indigo-400/15 to-transparent"
                />
                <Brain className="w-6 h-6 text-indigo-400 mx-auto mb-3 animate-pulse" />
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-indigo-300/80">{t("scanning")}</p>
                <p className="text-[11px] text-zinc-600 mt-1">{t("scanningSub")}</p>
              </div>
            )}

            {/* Erori */}
            {!loading && error?.code === "PRO" && (
              <div className="text-center py-10 px-4">
                <Lock className="w-6 h-6 text-indigo-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-zinc-200 mb-1">{t("proTitle")}</p>
                <p className="text-xs text-zinc-500 mb-4">{t("proDesc")}</p>
                <Link href="/pricing" className="inline-block text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg px-4 py-2">
                  {t("proCta")}
                </Link>
              </div>
            )}
            {!loading && error && error.code !== "PRO" && (
              <div className="text-center py-10 px-4">
                <p className="text-xs text-zinc-400">{error.msg || t("error")}</p>
                <button onClick={run} className="mt-3 text-xs font-bold text-indigo-300 hover:text-indigo-200">{t("retry")}</button>
              </div>
            )}

            {/* Rezultat */}
            {!loading && !error && a && (
              <>
                {/* Bias + încredere */}
                <div className="rounded-xl border p-3.5" style={{ borderColor: `rgba(${biasCfg.color},0.35)`, background: `rgba(${biasCfg.color},0.06)` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <biasCfg.Icon className="w-4 h-4" style={{ color: `rgb(${biasCfg.color})` }} />
                      <span className="text-sm font-black" style={{ color: `rgb(${biasCfg.color})` }}>{t(`bias${a.bias}`)}</span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-500">{t("confidence")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, a.confidence))}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: `rgb(${biasCfg.color})` }}
                      />
                    </div>
                    <span className="text-xs font-black num" style={{ color: `rgb(${biasCfg.color})` }}>{a.confidence}%</span>
                  </div>
                </div>

                {/* Sumar */}
                <Section label={t("read")}>{a.summary}</Section>

                {/* Structură */}
                {a.structure && <Section label={t("structure")}>{a.structure}</Section>}

                {/* Niveluri cheie */}
                {a.keyLevels?.length > 0 && (
                  <div>
                    <SectionLabel>{t("keyLevels")}</SectionLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {a.keyLevels.map((lv, i) => (
                        <span key={i} className={cn("font-mono text-[11px] font-bold px-2 py-1 rounded-lg border", LEVEL_CFG[lv.type] ?? LEVEL_CFG.support)}>
                          {lv.price} · {t(`lvl_${lv.type}`)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plan */}
                {a.plan && (
                  <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/[0.06] p-3.5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Target className="w-3.5 h-3.5 text-indigo-300" />
                      <SectionLabel className="mb-0">{t("plan")}</SectionLabel>
                    </div>
                    <p className="text-[12px] leading-relaxed text-zinc-300">{a.plan}</p>
                  </div>
                )}

                {/* Nota personală */}
                {a.personalNote && (
                  <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.06] p-3.5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-violet-300" />
                      <SectionLabel className="mb-0">{result?.hasPersonal ? t("personal") : t("coachNote")}</SectionLabel>
                    </div>
                    <p className="text-[12px] leading-relaxed text-zinc-300">{a.personalNote}</p>
                  </div>
                )}

                <p className="text-[9px] text-zinc-700 text-center pt-1">{t("disclaimer")}</p>
              </>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-zinc-500 mb-1.5", className)}>{children}</p>;
}
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <p className="text-[12px] leading-relaxed text-zinc-300">{children}</p>
    </div>
  );
}
