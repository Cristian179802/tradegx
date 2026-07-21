"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Landmark, TrendingUp, TrendingDown, Activity, Shield, Gauge, Target, Scale, Layers, Trophy } from "lucide-react";
import type { InstitutionalData } from "@/lib/institutional";
import { cn } from "@/lib/utils";

function money(n: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale === "ro" ? "ro-RO" : "en-US", {
    style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);
}
const fmt = (n: number | null, d = 2) => (n == null || !Number.isFinite(n) ? "—" : n.toFixed(d));

// prag calitativ → culoare (rgb) + etichetă key
function grade(value: number | null, good: number, ok: number, higherBetter = true): { rgb: string } {
  if (value == null) return { rgb: "113,113,122" };
  const passGood = higherBetter ? value >= good : value <= good;
  const passOk = higherBetter ? value >= ok : value <= ok;
  if (passGood) return { rgb: "52,211,153" };
  if (passOk) return { rgb: "251,191,36" };
  return { rgb: "251,113,133" };
}

export function InstitutionalClient({ data }: { data: InstitutionalData }) {
  const t = useTranslations("institutional");
  const locale = useLocale();
  const { portfolio: p, accounts, currency } = data;

  if (data.empty) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <Landmark className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
        <h1 className="text-xl font-black text-zinc-200">{t("title")}</h1>
        <p className="text-sm text-zinc-500 mt-2">{t("empty")}</p>
      </div>
    );
  }

  const posReturn = p.returnPct >= 0;

  // definiția cardurilor de metrici (cu praguri de calitate)
  const cards = [
    { key: "sharpe", Icon: Activity, value: p.sharpe, fmtD: 2, g: grade(p.sharpe, 2, 1) },
    { key: "sortino", Icon: Gauge, value: p.sortino, fmtD: 2, g: grade(p.sortino, 2.5, 1) },
    { key: "calmar", Icon: Scale, value: p.calmar, fmtD: 2, g: grade(p.calmar, 3, 1) },
    { key: "maxdd", Icon: Shield, value: p.maxDrawdownPct, fmtD: 1, suffix: "%", g: grade(p.maxDrawdownPct, 10, 20, false) },
    { key: "pf", Icon: Target, value: p.edge.profitFactor, fmtD: 2, g: grade(p.edge.profitFactor, 1.5, 1) },
    { key: "expR", Icon: TrendingUp, value: p.edge.expectancyR, fmtD: 2, suffix: "R", g: grade(p.edge.expectancyR, 0.2, 0) },
    { key: "winrate", Icon: Trophy, value: p.edge.winRatePct, fmtD: 1, suffix: "%", g: grade(p.edge.winRatePct, 55, 45) },
    { key: "payoff", Icon: Layers, value: p.edge.payoff, fmtD: 2, g: grade(p.edge.payoff, 2, 1) },
  ];

  // sparkline echitate
  const eq = p.equityCurve.map((x) => x.v);
  const eqMin = Math.min(...eq, p.initialBalance);
  const eqMax = Math.max(...eq, p.initialBalance);
  const eqSpan = eqMax - eqMin || 1;
  const W = 100, H = 34;
  const path = eq.length > 1
    ? eq.map((v, i) => `${(i / (eq.length - 1)) * W},${H - ((v - eqMin) / eqSpan) * H}`).join(" L ")
    : "";

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {/* Antet */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-indigo-400" />
          <h1 className="text-2xl font-black tracking-tight neon-indigo">{t("title")}</h1>
        </div>
        <p className="text-sm text-zinc-500 mt-0.5">{t("subtitle")}</p>
      </div>

      {/* Hero portofoliu */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative rounded-3xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/[0.08] via-zinc-900/60 to-zinc-900/40 p-6 mb-4 overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent" />
        <div className="grid md:grid-cols-[1.2fr_1fr] gap-6 items-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-indigo-400/70 mb-2">{t("portfolio")}</p>
            <div className="flex items-end gap-3 flex-wrap">
              <span className={cn("text-4xl font-black num", posReturn ? "text-emerald-400" : "text-rose-400")}>
                {posReturn ? "+" : ""}{fmt(p.returnPct, 2)}%
              </span>
              <span className={cn("text-lg font-bold num mb-0.5", posReturn ? "text-emerald-400/80" : "text-rose-400/80")}>
                {p.netPnl >= 0 ? "+" : ""}{money(p.netPnl, currency, locale)}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
              <span>{money(p.initialBalance, currency, locale)} → <span className="text-zinc-300 font-bold">{money(p.finalBalance, currency, locale)}</span></span>
              {p.cagrPct != null && <span>· CAGR <span className="text-indigo-300 font-bold num">{fmt(p.cagrPct, 1)}%</span></span>}
              <span>· {p.tradingDays} {t("tradingDays")}</span>
            </div>
          </div>
          {/* sparkline echitate */}
          <div className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-16">
              <defs><linearGradient id="eqg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={posReturn ? "#34d399" : "#f43f5e"} stopOpacity="0.3" /><stop offset="100%" stopColor={posReturn ? "#34d399" : "#f43f5e"} stopOpacity="0" /></linearGradient></defs>
              {path && <>
                <polyline points={path} fill="none" stroke={posReturn ? "#34d399" : "#f43f5e"} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <polygon points={`0,${H} L ${path} L ${W},${H}`} fill="url(#eqg)" opacity="0.6" />
              </>}
            </svg>
            <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-600 text-right mt-1">{t("equityCurve")}</p>
          </div>
        </div>
      </motion.div>

      {/* Grila de metrici instituționale */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {cards.map((c, i) => (
          <motion.div
            key={c.key}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.04 }}
            className="rounded-2xl border bg-zinc-900/50 p-4"
            style={{ borderColor: `rgba(${c.g.rgb},0.3)` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `rgba(${c.g.rgb},0.14)`, color: `rgb(${c.g.rgb})` }}>
                <c.Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">{t(`m_${c.key}`)}</span>
            </div>
            <p className="text-2xl font-black num" style={{ color: `rgb(${c.g.rgb})` }}>
              {fmt(c.value, c.fmtD)}{c.value != null && c.suffix ? c.suffix : ""}
            </p>
            <p className="text-[10px] text-zinc-600 mt-0.5 leading-tight">{t(`h_${c.key}`)}</p>
          </motion.div>
        ))}
      </div>

      {/* Per cont */}
      {accounts.length > 0 && (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800/70">
            <p className="text-sm font-black text-zinc-200">{t("perAccount")}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-800/60">
                  <th className="px-5 py-2.5 font-bold text-xs">{t("col_account")}</th>
                  <th className="px-3 py-2.5 font-bold text-xs text-right">{t("col_return")}</th>
                  <th className="px-3 py-2.5 font-bold text-xs text-right">{t("col_net")}</th>
                  <th className="px-3 py-2.5 font-bold text-xs text-right">{t("col_wr")}</th>
                  <th className="px-3 py-2.5 font-bold text-xs text-right">PF</th>
                  <th className="px-3 py-2.5 font-bold text-xs text-right">Sharpe</th>
                  <th className="px-3 py-2.5 font-bold text-xs text-right">{t("col_dd")}</th>
                  <th className="px-5 py-2.5 font-bold text-xs text-right">{t("col_trades")}</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id} className="border-b border-zinc-800/40 hover:bg-zinc-800/30">
                    <td className="px-5 py-2.5 font-bold text-zinc-200">{a.name}</td>
                    <td className={cn("px-3 py-2.5 text-right font-bold num", a.returnPct >= 0 ? "text-emerald-400" : "text-rose-400")}>{a.returnPct >= 0 ? "+" : ""}{fmt(a.returnPct, 1)}%</td>
                    <td className={cn("px-3 py-2.5 text-right num", a.netPnl >= 0 ? "text-emerald-400/80" : "text-rose-400/80")}>{a.netPnl >= 0 ? "+" : ""}{money(a.netPnl, a.currency, locale)}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-300 num">{fmt(a.winRatePct, 1)}%</td>
                    <td className="px-3 py-2.5 text-right text-zinc-300 num">{a.profitFactor != null ? fmt(a.profitFactor, 2) : "∞"}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-300 num">{fmt(a.sharpe, 2)}</td>
                    <td className="px-3 py-2.5 text-right text-violet-300 num">{fmt(a.maxDrawdownPct, 1)}%</td>
                    <td className="px-5 py-2.5 text-right text-zinc-400 num">{a.totalTrades}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[10px] text-zinc-600 text-center mt-5">{t("note")}</p>
    </div>
  );
}
