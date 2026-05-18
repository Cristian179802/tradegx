"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowRight, CalendarDays, TrendingUp, TrendingDown,
  Activity, Target, BarChart2, Zap, ChevronRight, Award,
  ArrowUpRight, ArrowDownRight, Clock, Flame,
} from "lucide-react";
import { LiveChart } from "@/components/dashboard/live-chart";
import { MarketSessions } from "@/components/dashboard/market-sessions";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  userName: string;
  totalTrades: number;
  netPnl: number;
  winRate: number | null;
  profitFactor: number | null;
  maxDrawdown: number | null;
  wins: number;
  losses: number;
  bestTrade: number;
  worstTrade: number;
  avgWin: number;
  avgLoss: number;
  currency: string;
  recentTrades: Array<{
    id: string; symbol: string; direction: string;
    lotSize: number; pnlMoney: number | null; pnlPips: number | null; entryTime: string;
  }>;
  pairPerformance: Array<{ symbol: string; pnl: number; trades: number }>;
  equityCurve: Array<{ date: string; balance: number }>;
  sparklines: {
    pnl: number[]; winRate: number[]; profitFactor: number[]; drawdown: number[]; trades: number[];
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function fmt(value: number, currency: string) {
  const abs = Math.abs(value);
  const sign = value >= 0 ? "+" : "-";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2)}M ${currency}`;
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)}k ${currency}`;
  return `${sign}${abs.toFixed(2)} ${currency}`;
}

function fmtShort(value: number) {
  const abs = Math.abs(value);
  const sign = value >= 0 ? "+" : "-";
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)}k`;
  return `${sign}${abs.toFixed(2)}`;
}

function greetingRo(name: string) {
  const h = new Date().getHours();
  const salut = h < 12 ? "Bună dimineața" : h < 18 ? "Bună ziua" : "Bună seara";
  return `${salut}, ${name}`;
}

function todayRo() {
  return new Date().toLocaleDateString("ro-RO", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ─── Animated Sparkline ───────────────────────────────────────────────────────

function Sparkline({
  data, color = "#10b981", width = 72, height = 28, filled = false,
}: {
  data: number[]; color?: string; width?: number; height?: number; filled?: boolean;
}) {
  if (data.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - ((v - min) / range) * (height - 2) - 1,
  ]);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const areaPath = path + ` L ${width} ${height} L 0 ${height} Z`;
  const gradId = `sg-${color.replace("#", "")}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {filled && <path d={areaPath} fill={`url(#${gradId})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  sparkData?: number[];
  sparkColor?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "emerald" | "rose" | "indigo" | "amber" | "violet";
  delay?: number;
}

const ACCENT_MAP = {
  emerald: {
    card: "border-emerald-500/30 hover:border-emerald-400/60",
    leftBar: "bg-emerald-400",
    leftBarShadow: "shadow-[2px_0_12px_rgba(52,211,153,0.7)]",
    topGrad: "from-emerald-500/12 to-transparent",
    icon: "text-emerald-300", iconBg: "bg-emerald-500/20 border-emerald-400/30",
    value: "text-emerald-300",
    cornerGlow: "bg-emerald-500/20",
  },
  rose: {
    card: "border-rose-500/30 hover:border-rose-400/60",
    leftBar: "bg-rose-400",
    leftBarShadow: "shadow-[2px_0_12px_rgba(244,63,94,0.7)]",
    topGrad: "from-rose-500/12 to-transparent",
    icon: "text-rose-300", iconBg: "bg-rose-500/20 border-rose-400/30",
    value: "text-rose-300",
    cornerGlow: "bg-rose-500/20",
  },
  indigo: {
    card: "border-indigo-500/30 hover:border-indigo-400/60",
    leftBar: "bg-indigo-400",
    leftBarShadow: "shadow-[2px_0_12px_rgba(99,102,241,0.7)]",
    topGrad: "from-indigo-500/12 to-transparent",
    icon: "text-indigo-300", iconBg: "bg-indigo-500/20 border-indigo-400/30",
    value: "text-indigo-200",
    cornerGlow: "bg-indigo-500/20",
  },
  amber: {
    card: "border-amber-500/30 hover:border-amber-400/60",
    leftBar: "bg-amber-400",
    leftBarShadow: "shadow-[2px_0_12px_rgba(245,158,11,0.7)]",
    topGrad: "from-amber-500/12 to-transparent",
    icon: "text-amber-300", iconBg: "bg-amber-500/20 border-amber-400/30",
    value: "text-amber-300",
    cornerGlow: "bg-amber-500/20",
  },
  violet: {
    card: "border-violet-500/30 hover:border-violet-400/60",
    leftBar: "bg-violet-400",
    leftBarShadow: "shadow-[2px_0_12px_rgba(139,92,246,0.7)]",
    topGrad: "from-violet-500/12 to-transparent",
    icon: "text-violet-300", iconBg: "bg-violet-500/20 border-violet-400/30",
    value: "text-violet-200",
    cornerGlow: "bg-violet-500/20",
  },
};

function KPICard({ label, value, sub, trend, sparkData, sparkColor, icon: Icon, accent = "indigo", delay = 0 }: KPICardProps) {
  const a = ACCENT_MAP[accent];
  return (
    <div
      className={cn(
        "relative rounded-2xl border overflow-hidden transition-all duration-300 group cursor-default animate-fade-in-up",
        a.card
      )}
      style={{
        animationDelay: `${delay}ms`,
        background: "linear-gradient(135deg, rgba(24,24,28,0.97) 0%, rgba(15,15,18,0.99) 100%)",
      }}
    >
      {/* Colored left accent bar with glow */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl", a.leftBar, a.leftBarShadow)} />

      {/* Top color gradient wash */}
      <div className={cn("absolute top-0 left-0 right-0 h-16 bg-gradient-to-b", a.topGrad)} />

      <div className="relative pl-5 pr-4 pt-4 pb-3">
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <div className={cn("w-8 h-8 rounded-xl border flex items-center justify-center", a.iconBg)}>
            <Icon className={cn("w-4 h-4", a.icon)} />
          </div>
          {sparkData && sparkData.length > 1 && (
            <Sparkline data={sparkData} color={sparkColor ?? "#6366f1"} width={60} height={22} filled />
          )}
        </div>

        {/* Value */}
        <p className={cn(
          "text-[22px] font-black num tracking-tight leading-none mb-1 animate-number-glow",
          a.value
        )}>
          {value}
        </p>

        {/* Sub + trend */}
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[11px] text-zinc-500 truncate flex-1">{sub}</p>
          {trend && trend !== "neutral" && (
            <span className={cn(
              "flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ml-1",
              trend === "up"
                ? "text-emerald-400 bg-emerald-500/15 border border-emerald-500/25"
                : "text-rose-400 bg-rose-500/15 border border-rose-500/25"
            )}>
              {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            </span>
          )}
        </div>

        {/* Bottom label */}
        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.1em] mt-2">{label}</p>
      </div>

      {/* Corner glow on hover */}
      <div className={cn(
        "absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-0 group-hover:opacity-80 transition-opacity duration-500",
        a.cornerGlow
      )} />
    </div>
  );
}

// ─── Premium Equity Chart ─────────────────────────────────────────────────────

function EquityChart({ data, currency }: { data: { date: string; balance: number }[]; currency: string }) {
  if (data.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-44 gap-3">
        <Activity className="w-8 h-8 text-zinc-700" />
        <p className="text-sm text-zinc-600">Adaugă tranzacții pentru a vedea curba equity</p>
      </div>
    );
  }

  const W = 600; const H = 180;
  const PAD = { top: 20, right: 16, bottom: 32, left: 60 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const values = data.map(d => d.balance);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const toX = (i: number) => PAD.left + (i / (data.length - 1)) * cW;
  const toY = (v: number) => PAD.top + cH - ((v - minV) / range) * cH;
  const isProfit = values[values.length - 1] >= values[0];

  const pts = data.map((d, i) => [toX(i), toY(d.balance)] as [number, number]);
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const areaPath = linePath + ` L ${toX(data.length - 1)} ${PAD.top + cH} L ${PAD.left} ${PAD.top + cH} Z`;

  const lineColor = isProfit ? "#34d399" : "#f87171";
  const gradStart = isProfit ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)";

  const step = Math.max(1, Math.floor((data.length - 1) / 4));
  const xLabels: { i: number; label: string }[] = [];
  for (let i = 0; i < data.length; i += step) {
    xLabels.push({ i, label: new Date(data[i].date).toLocaleDateString("ro-RO", { day: "2-digit", month: "short" }) });
  }
  const yTicks = Array.from({ length: 4 }, (_, k) => minV + (range / 3) * k);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <defs>
        <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
        <filter id="eqGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {yTicks.map((tick, k) => (
        <line key={k} x1={PAD.left} y1={toY(tick)} x2={W - PAD.right} y2={toY(tick)}
          stroke="#27272a" strokeWidth="1" strokeDasharray="3,4" />
      ))}

      {/* Area */}
      <path d={areaPath} fill="url(#eqGrad)" />

      {/* Glow line (thicker, blurred) */}
      <path d={linePath} fill="none" stroke={lineColor} strokeWidth="4" strokeOpacity="0.2" filter="url(#eqGlow)" />

      {/* Main line */}
      <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Last point dot */}
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill={lineColor} />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="7" fill={lineColor} fillOpacity="0.15" />

      {/* Y labels */}
      {yTicks.map((tick, k) => (
        <text key={k} x={PAD.left - 6} y={toY(tick) + 4} textAnchor="end" fill="#52525b" fontSize="9" fontFamily="monospace">
          {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick.toFixed(0)}
        </text>
      ))}

      {/* X labels */}
      {xLabels.map(({ i, label }) => (
        <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fill="#52525b" fontSize="9">
          {label}
        </text>
      ))}
    </svg>
  );
}

// ─── Win/Loss Ring ────────────────────────────────────────────────────────────

function WinLossRing({ wins, losses, winRate }: { wins: number; losses: number; winRate: number | null }) {
  const total = wins + losses;
  const R = 42; const CX = 52; const CY = 52; const SW = 8;
  const circumference = 2 * Math.PI * R;
  const winFrac = total > 0 ? wins / total : 0;
  const winDash = winFrac * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="104" height="104" viewBox="0 0 104 104">
          {/* Track */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#27272a" strokeWidth={SW} />
          {/* Loss arc */}
          {total > 0 && (
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f87171" strokeWidth={SW}
              strokeDasharray={circumference} strokeDashoffset={0} transform={`rotate(-90 ${CX} ${CY})`} strokeLinecap="round" />
          )}
          {/* Win arc */}
          {total > 0 && (
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#34d399" strokeWidth={SW}
              strokeDasharray={`${winDash - 2} ${circumference - winDash + 2}`}
              strokeDashoffset={0} transform={`rotate(-90 ${CX} ${CY})`} strokeLinecap="round" />
          )}
          {/* Center */}
          <text x={CX} y={CY - 5} textAnchor="middle" fill="white" fontSize="15" fontWeight="800" fontFamily="'JetBrains Mono', monospace">
            {total === 0 ? "—" : winRate !== null ? `${winRate.toFixed(0)}%` : "—"}
          </text>
          <text x={CX} y={CY + 10} textAnchor="middle" fill="#71717a" fontSize="8" fontFamily="sans-serif">
            {total === 0 ? "no trades" : "win rate"}
          </text>
        </svg>
      </div>
      <div className="flex gap-3 mt-1">
        <span className="text-xs text-emerald-400 font-semibold">{wins}W</span>
        <span className="text-zinc-700">/</span>
        <span className="text-xs text-rose-400 font-semibold">{losses}L</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardClient({ data }: { data: DashboardData }) {
  const {
    userName, totalTrades, netPnl, winRate, profitFactor, maxDrawdown,
    wins, losses, bestTrade, worstTrade, avgWin, avgLoss, currency,
    recentTrades, pairPerformance, equityCurve, sparklines,
  } = data;

  const [currentTime, setCurrentTime] = useState("");
  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const maxPairPnl = Math.max(...pairPerformance.map(p => Math.abs(p.pnl)), 1);

  return (
    <div className="space-y-5 pb-4 relative">
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="orb orb-indigo absolute w-[600px] h-[600px] -top-40 -left-40 opacity-40" style={{ animationDelay: '0s' }} />
        <div className="orb orb-violet absolute w-[500px] h-[500px] top-1/2 -right-32 opacity-30" style={{ animationDelay: '2s' }} />
        <div className="orb orb-indigo absolute w-[400px] h-[400px] bottom-0 left-1/3 opacity-20" style={{ animationDelay: '4s' }} />
      </div>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="live-dot-indigo" />
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.12em]">
              Live
            </span>
          </div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
            {greetingRo(userName)} <span className="inline-block animate-[wave_2s_ease-in-out_infinite]">👋</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Performanța ta de trading, în timp real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-600 bg-zinc-900/80 border border-zinc-800/60 rounded-xl px-3 py-2">
            <CalendarDays className="w-3.5 h-3.5 text-zinc-500" />
            <span className="capitalize text-zinc-400 font-medium">{todayRo()}</span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800/60 rounded-xl px-3 py-2">
            <span className="live-dot" />
            <span className="font-mono text-xs text-zinc-300 num tracking-wider">{currentTime}</span>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard
          label="Profit Net"
          value={totalTrades > 0 ? fmt(netPnl, currency) : "—"}
          sub={totalTrades > 0 ? `din ${totalTrades} trades` : "nicio tranzacție"}
          trend={netPnl > 0 ? "up" : netPnl < 0 ? "down" : "neutral"}
          sparkData={sparklines.pnl}
          sparkColor={netPnl >= 0 ? "#34d399" : "#f87171"}
          icon={netPnl >= 0 ? TrendingUp : TrendingDown}
          accent={netPnl >= 0 ? "emerald" : "rose"}
          delay={0}
        />
        <KPICard
          label="Win Rate"
          value={winRate !== null ? `${winRate.toFixed(1)}%` : "—"}
          sub={totalTrades > 0 ? `${wins}W / ${losses}L` : "—"}
          trend={winRate !== null ? (winRate >= 50 ? "up" : "down") : "neutral"}
          sparkData={sparklines.winRate}
          sparkColor="#818cf8"
          icon={Target}
          accent="indigo"
          delay={60}
        />
        <KPICard
          label="Profit Factor"
          value={profitFactor !== null ? profitFactor.toFixed(2) : "—"}
          sub={profitFactor !== null ? (profitFactor >= 1.5 ? "excelent ✨" : profitFactor >= 1 ? "pozitiv" : "negativ") : "—"}
          trend={profitFactor !== null ? (profitFactor >= 1 ? "up" : "down") : "neutral"}
          sparkData={sparklines.profitFactor}
          sparkColor="#f59e0b"
          icon={Flame}
          accent="amber"
          delay={120}
        />
        <KPICard
          label="Max Drawdown"
          value={maxDrawdown !== null ? `${maxDrawdown.toFixed(1)}%` : "—"}
          sub={maxDrawdown !== null ? (maxDrawdown < 5 ? "excelent" : maxDrawdown < 15 ? "acceptabil" : "ridicat ⚠️") : "—"}
          trend={maxDrawdown !== null ? (maxDrawdown < 10 ? "up" : "down") : "neutral"}
          sparkData={sparklines.drawdown}
          sparkColor="#f87171"
          icon={Activity}
          accent="rose"
          delay={180}
        />
        <KPICard
          label="Tranzacții"
          value={totalTrades === 0 ? "0" : String(totalTrades)}
          sub={wins > 0 ? `${wins} câștigate` : "—"}
          sparkData={sparklines.trades}
          sparkColor="#a78bfa"
          icon={BarChart2}
          accent="violet"
          delay={240}
        />
      </div>

      {/* ── Middle Row: Chart + Breakdown ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 animate-fade-in-up delay-200">

        {/* Live TradingView Chart */}
        <div className="lg:col-span-3 bg-zinc-900/80 border border-zinc-800/70 rounded-2xl overflow-hidden premium-card" style={{ minHeight: 360 }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/60 bg-zinc-900/60">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/12 border border-indigo-500/20 flex items-center justify-center">
                <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span className="text-sm font-bold text-zinc-200">Grafic Live</span>
              <span className="live-dot" />
            </div>
            <Link href="/charts" className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors font-semibold">
              Ecran complet <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-1">
            <LiveChart />
          </div>
        </div>

        {/* Performance Breakdown */}
        <div className="lg:col-span-1 bg-zinc-900/80 border border-zinc-800/70 rounded-2xl p-5 flex flex-col premium-card">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-violet-500/12 border border-violet-500/20 flex items-center justify-center">
              <Award className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <h2 className="text-sm font-bold text-zinc-200">Performanță</h2>
          </div>

          {/* Ring */}
          <div className="flex justify-center mb-4">
            <WinLossRing wins={wins} losses={losses} winRate={winRate} />
          </div>

          {/* Stats */}
          <div className="space-y-2 flex-1">
            {[
              { label: "Cel mai bun trade", value: fmtShort(bestTrade), color: "text-emerald-400" },
              { label: "Cel mai slab", value: fmtShort(worstTrade), color: "text-rose-400" },
              { label: "Avg câștig", value: `+${avgWin.toFixed(2)}`, color: "text-emerald-400" },
              { label: "Avg pierdere", value: `-${Math.abs(avgLoss).toFixed(2)}`, color: "text-rose-400" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-zinc-800/50 last:border-0">
                <span className="text-[11px] text-zinc-500">{row.label}</span>
                <span className={cn("text-xs font-bold num", row.color)}>{row.value}</span>
              </div>
            ))}
          </div>

          <Link href="/analytics"
            className="mt-4 flex items-center justify-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/8 hover:bg-indigo-500/15 border border-indigo-500/20 rounded-xl py-2.5 transition-all">
            Analiză completă <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Equity Curve ───────────────────────────────────────────────────── */}
      <div className="bg-zinc-900/80 border border-zinc-800/70 rounded-2xl p-5 animate-fade-in-up delay-300 premium-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/12 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <h2 className="text-sm font-bold text-zinc-200">Curbă Equity</h2>
          </div>
          {equityCurve.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className={cn("text-xs font-bold num",
                equityCurve[equityCurve.length - 1]?.balance >= equityCurve[0]?.balance
                  ? "text-emerald-400" : "text-rose-400")}>
                {equityCurve.length > 0 && equityCurve[equityCurve.length - 1]
                  ? new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2 }).format(equityCurve[equityCurve.length - 1].balance) + ` ${currency}`
                  : "—"}
              </span>
            </div>
          )}
        </div>
        <EquityChart data={equityCurve} currency={currency} />
      </div>

      {/* ── Bottom Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in-up delay-400">

        {/* Market Sessions */}
        <MarketSessions />

        {/* Pair Performance */}
        <div className="bg-zinc-900/80 border border-zinc-800/70 rounded-2xl p-5 premium-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/12 border border-amber-500/20 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <h2 className="text-sm font-bold text-zinc-200">Top Perechi</h2>
            </div>
            <Link href="/analytics" className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              Toate <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {pairPerformance.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <BarChart2 className="w-7 h-7 text-zinc-700" />
              <p className="text-sm text-zinc-600">Nicio tranzacție înregistrată</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pairPerformance.slice(0, 6).map((pair) => {
                const barWidth = (Math.abs(pair.pnl) / maxPairPnl) * 100;
                const pos = pair.pnl >= 0;
                return (
                  <div key={pair.symbol}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-zinc-300">{pair.symbol}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-600">{pair.trades}t</span>
                        <span className={cn("text-xs font-bold num", pos ? "text-emerald-400" : "text-rose-400")}>
                          {pos ? "+" : ""}{pair.pnl.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-700", pos ? "bg-gradient-to-r from-emerald-600 to-emerald-400" : "bg-gradient-to-r from-rose-600 to-rose-400")}
                        style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Trades */}
        <div className="bg-zinc-900/80 border border-zinc-800/70 rounded-2xl p-5 premium-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <h2 className="text-sm font-bold text-zinc-200">Tranzacții Recente</h2>
            </div>
            <Link href="/trades" className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              Toate <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {recentTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <Activity className="w-7 h-7 text-zinc-700" />
              <p className="text-sm text-zinc-600">Nicio tranzacție înregistrată</p>
              <Link href="/trades/new" className="text-xs text-indigo-400 hover:text-indigo-300 mt-1">
                Adaugă prima tranzacție →
              </Link>
            </div>
          ) : (
            <div className="space-y-0.5">
              {recentTrades.slice(0, 7).map((trade) => {
                const pos = (trade.pnlMoney ?? 0) >= 0;
                return (
                  <Link key={trade.id} href={`/trades/${trade.id}`}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-zinc-800/60 transition-all group">
                    <span className={cn(
                      "text-[10px] font-bold w-9 text-center py-1 rounded-lg",
                      trade.direction === "BUY"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    )}>
                      {trade.direction === "BUY" ? "BUY" : "SELL"}
                    </span>
                    <span className="text-xs font-bold text-zinc-300 w-14 truncate">{trade.symbol}</span>
                    <span className="text-[10px] text-zinc-600 w-8 num">{trade.lotSize.toFixed(2)}</span>
                    <span className="flex-1 text-[10px] text-zinc-600 num text-right">
                      {trade.pnlPips !== null ? `${trade.pnlPips >= 0 ? "+" : ""}${trade.pnlPips.toFixed(0)}p` : ""}
                    </span>
                    <span className={cn("text-xs font-bold num ml-auto", pos ? "text-emerald-400" : "text-rose-400")}>
                      {trade.pnlMoney !== null
                        ? `${trade.pnlMoney >= 0 ? "+" : ""}${trade.pnlMoney.toFixed(2)}`
                        : "—"}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
