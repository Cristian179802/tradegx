"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Trophy, AlertTriangle, Target, BarChart3 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface Summary {
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  profitFactor: number | null;
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
  avgRR: number;
  maxDrawdown: number;
}

interface AnalyticsData {
  empty: boolean;
  currency?: string;
  summary?: Summary;
  equityCurve?: { date: string | null; balance: number; pnl: number }[];
  monthlyPnl?: { month: string; pnl: number }[];
  winRateByDay?: { day: string; winRate: number; total: number }[];
  winRateByInstrument?: { instrument: string; winRate: number; total: number; pnl: number }[];
  setupPerformance?: { setup: string; winRate: number; total: number; pnl: number; avgPnl: number }[];
  pnlDistribution?: { range: string; count: number; positive: boolean }[];
}

const SETUP_LABELS: Record<string, string> = {
  ORDER_BLOCK: "OB",
  FAIR_VALUE_GAP: "FVG",
  LIQUIDITY_SWEEP: "Sweep",
  BOS: "BOS",
  CHOCH: "CHoCH",
  BREAKER: "Breaker",
  MITIGATION: "Mitig.",
  REJECTION: "Reject.",
  TREND_FOLLOW: "Trend",
  SCALP: "Scalp",
  OTHER: "Altul",
};

function StatCard({
  label,
  value,
  sub,
  positive,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const accentColor = positive === true ? "emerald" : positive === false ? "rose" : "indigo";
  const bgMap: Record<string, string> = {
    emerald: "kpi-profit border-emerald-500/20 hover:border-emerald-500/35",
    rose:    "kpi-loss border-rose-500/20 hover:border-rose-500/35",
    indigo:  "kpi-accent border-indigo-500/20 hover:border-indigo-500/35",
  };
  const iconMap: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/15",
    rose:    "text-rose-400 bg-rose-500/15",
    indigo:  "text-indigo-400 bg-indigo-500/15",
  };
  return (
    <div className={cn("rounded-xl border bg-zinc-900/80 p-3 transition-all duration-200 group card-3d", bgMap[accentColor])}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{label}</p>
        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", iconMap[accentColor])}>
          <Icon className="h-3 w-3" />
        </div>
      </div>
      <p
        className={cn(
          "text-lg font-black num tracking-tight animate-number-glow",
          positive === true ? "text-emerald-400 neon-emerald" : positive === false ? "text-rose-400 neon-rose" : "text-zinc-100"
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  );
}

const darkTooltipStyle = {
  contentStyle: {
    background: "rgba(9,9,11,0.95)",
    border: "1px solid rgba(63,63,70,0.6)",
    borderRadius: "12px",
    color: "#e4e4e7",
    fontSize: "12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    backdropFilter: "blur(12px)",
  },
  cursor: { stroke: "#3f3f46", strokeWidth: 1, strokeDasharray: "4 2" },
};

export function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const t = useTranslations("analytics");
  if (data.empty) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <BarChart3 className="h-12 w-12 text-zinc-700 mb-4" />
        <p className="text-zinc-400 font-medium">{t("emptyTitle")}</p>
        <p className="text-zinc-600 text-sm mt-1">
          {t("emptySub")}
        </p>
      </div>
    );
  }

  const { summary, equityCurve, monthlyPnl, winRateByDay, winRateByInstrument, setupPerformance, pnlDistribution, currency = "USD" } = data;
  if (!summary) return null;

  const fmt = (v: number) => formatCurrency(v, currency);

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label={t("kWinRate")}
          value={`${summary.winRate}%`}
          sub={t("subTrades", { n: summary.totalTrades })}
          positive={summary.winRate >= 50}
          icon={Target}
        />
        <StatCard
          label={t("kNetPnl")}
          value={fmt(summary.totalPnl)}
          positive={summary.totalPnl >= 0}
          icon={summary.totalPnl >= 0 ? TrendingUp : TrendingDown}
        />
        <StatCard
          label={t("kProfitFactor")}
          value={summary.profitFactor !== null ? String(summary.profitFactor) : "—"}
          positive={summary.profitFactor !== null ? summary.profitFactor >= 1 : undefined}
          sub={summary.profitFactor !== null ? (summary.profitFactor >= 1.5 ? t("pfExcellent") : summary.profitFactor >= 1 ? t("pfGood") : t("pfWeak")) : undefined}
          icon={BarChart3}
        />
        <StatCard
          label={t("kAvgWinLoss")}
          value={`${fmt(summary.avgWin)} / ${fmt(summary.avgLoss)}`}
          sub={t("subAvgRR", { rr: summary.avgRR })}
          icon={Trophy}
        />
        <StatCard
          label={t("kMaxDD")}
          value={`${summary.maxDrawdown.toFixed(1)}%`}
          positive={summary.maxDrawdown < 10}
          sub={t("subWorst", { v: fmt(summary.worstTrade) })}
          icon={AlertTriangle}
        />
      </div>

      {/* Equity curve */}
      <div className="rounded-xl border border-indigo-500/20 bg-zinc-900/80 p-4 cyber-card">
        <h2 className="text-sm font-bold text-zinc-200 mb-3 flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />{t("chartEquity")}</h2>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={equityCurve} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#71717a", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "#71717a", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v.toLocaleString()}`}
              width={70}
            />
            <Tooltip
              {...darkTooltipStyle}
              formatter={(val: number) => [fmt(val), t("tipBalance")]}
            />
            <ReferenceLine y={Number(equityCurve?.[0]?.balance ?? 0)} stroke="#3f3f46" strokeDasharray="4 2" />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#equityGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly P&L + Win rate by day */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-violet-500/20 bg-zinc-900/80 p-4 relative overflow-hidden">
          <h2 className="text-sm font-bold text-zinc-200 mb-3 flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />{t("chartMonthly")}</h2>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={monthlyPnl} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#71717a", fontSize: 11 }} tickLine={false} axisLine={false} width={60} tickFormatter={(v) => `${v}`} />
              <Tooltip
                {...darkTooltipStyle}
                formatter={(val: number) => [fmt(val), t("tipPnl")]}
              />
              <ReferenceLine y={0} stroke="#3f3f46" />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {monthlyPnl?.map((entry, i) => (
                  <Cell key={i} fill={entry.pnl >= 0 ? "#10b981" : "#f43f5e"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-zinc-900/80 p-4 relative overflow-hidden">
          <h2 className="text-sm font-bold text-zinc-200 mb-3 flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />{t("chartWinDay")}</h2>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={winRateByDay} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#71717a", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={40} />
              <Tooltip
                {...darkTooltipStyle}
                formatter={(val: number, _: string, props: { payload?: { total?: number } }) => [
                  t("winDayTip", { val, total: props.payload?.total ?? 0 }),
                  t("tipWinRate"),
                ]}
              />
              <ReferenceLine y={50} stroke="#3f3f46" strokeDasharray="4 2" />
              <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                {winRateByDay?.map((entry, i) => (
                  <Cell key={i} fill={entry.winRate >= 50 ? "#10b981" : "#f43f5e"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* P&L distribution + Instrument performance */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-amber-500/20 bg-zinc-900/80 p-4">
          <h2 className="text-sm font-bold text-zinc-200 mb-3 flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />{t("chartDist")}</h2>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={pnlDistribution} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="range" tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#71717a", fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
              <Tooltip
                {...darkTooltipStyle}
                formatter={(val: number) => [val, t("tipTradesLabel")]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {pnlDistribution?.map((entry, i) => (
                  <Cell key={i} fill={entry.positive ? "#10b981" : "#f43f5e"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-rose-500/20 bg-zinc-900/80 p-4">
          <h2 className="text-sm font-bold text-zinc-200 mb-3 flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />{t("chartInstrument")}</h2>
          <div className="space-y-2 mt-1">
            {winRateByInstrument?.map((item) => (
              <div key={item.instrument} className="flex items-center gap-3">
                <span className="text-xs text-zinc-400 w-20 shrink-0">{item.instrument}</span>
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      item.winRate >= 50 ? "bg-emerald-500" : "bg-rose-500"
                    )}
                    style={{ width: `${item.winRate}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-400 num w-10 text-right">{item.winRate}%</span>
                <span
                  className={cn(
                    "text-xs num w-20 text-right",
                    item.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                  )}
                >
                  {item.pnl >= 0 ? "+" : ""}{formatCurrency(item.pnl, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Setup performance table */}
      {setupPerformance && setupPerformance.length > 0 && (
        <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/80 overflow-hidden relative">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />{t("chartSetup")}</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {[t("colSetup"), t("colTrades"), t("colWinRate"), t("colPnlTotal"), t("colAvgPnl")].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {setupPerformance.map((s) => (
                <tr key={s.setup} className="border-b border-zinc-800/50 hover:bg-indigo-500/5 transition-colors">
                  <td className="px-4 py-3 text-zinc-200 text-xs font-medium">
                    {s.setup === "OTHER" ? t("setupOther") : (SETUP_LABELS[s.setup] ?? s.setup)}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 num text-xs">{s.total}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-xs num font-medium",
                        s.winRate >= 50 ? "text-emerald-400" : "text-rose-400"
                      )}
                    >
                      {s.winRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs num", s.pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {s.pnl >= 0 ? "+" : ""}{formatCurrency(s.pnl, currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs num", s.avgPnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {s.avgPnl >= 0 ? "+" : ""}{formatCurrency(s.avgPnl, currency)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
