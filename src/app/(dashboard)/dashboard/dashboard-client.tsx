"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { LiveChart } from "@/components/dashboard/live-chart";
import { MarketSessions } from "@/components/dashboard/market-sessions";

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
    id: string;
    symbol: string;
    direction: string;
    lotSize: number;
    pnlMoney: number | null;
    pnlPips: number | null;
    entryTime: string;
  }>;
  pairPerformance: Array<{ symbol: string; pnl: number; trades: number }>;
  equityCurve: Array<{ date: string; balance: number }>;
  sparklines: {
    pnl: number[];
    winRate: number[];
    profitFactor: number[];
    drawdown: number[];
    trades: number[];
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number, currency: string) {
  const abs = Math.abs(value);
  const sign = value >= 0 ? "+" : "-";
  if (abs >= 1000) {
    return `${sign}${(abs / 1000).toFixed(1)}k ${currency}`;
  }
  return `${sign}${abs.toFixed(2)} ${currency}`;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ro-RO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function todayRo() {
  return new Date().toLocaleDateString("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function greetingRo(name: string) {
  const h = new Date().getHours();
  const salut = h < 12 ? "Bună dimineața" : h < 18 ? "Bună ziua" : "Bună seara";
  return `${salut}, ${name}! 👋`;
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({
  data,
  color = "#10b981",
  width = 80,
  height = 28,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - ((v - min) / range) * (height - 2) - 1,
  ]);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Equity Curve ─────────────────────────────────────────────────────────────

function EquityChart({ data }: { data: { date: string; balance: number }[] }) {
  const W = 560;
  const H = 160;
  const PAD = { top: 16, right: 16, bottom: 28, left: 56 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">
        Date insuficiente pentru grafic
      </div>
    );
  }

  const values = data.map((d) => d.balance);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const toX = (i: number) => PAD.left + (i / (data.length - 1)) * chartW;
  const toY = (v: number) => PAD.top + chartH - ((v - min) / range) * chartH;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(d.balance).toFixed(1)}`)
    .join(" ");

  const areaPath =
    linePath +
    ` L ${toX(data.length - 1).toFixed(1)} ${(PAD.top + chartH).toFixed(1)} L ${PAD.left.toFixed(1)} ${(PAD.top + chartH).toFixed(1)} Z`;

  // X-axis labels — show up to 5 evenly spaced
  const xLabels: { i: number; label: string }[] = [];
  const step = Math.max(1, Math.floor((data.length - 1) / 4));
  for (let i = 0; i < data.length; i += step) {
    const d = new Date(data[i].date);
    xLabels.push({
      i,
      label: d.toLocaleDateString("ro-RO", { day: "2-digit", month: "short" }),
    });
  }

  // Y-axis labels — 4 ticks
  const yTicks = Array.from({ length: 4 }, (_, k) => min + (range / 3) * k);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <defs>
        <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map((tick, k) => (
        <line
          key={k}
          x1={PAD.left}
          y1={toY(tick)}
          x2={W - PAD.right}
          y2={toY(tick)}
          stroke="#27272a"
          strokeWidth="1"
        />
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#eqGrad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Y-axis labels */}
      {yTicks.map((tick, k) => (
        <text
          key={k}
          x={PAD.left - 6}
          y={toY(tick) + 4}
          textAnchor="end"
          fill="#71717a"
          fontSize="9"
          fontFamily="monospace"
        >
          {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick.toFixed(0)}
        </text>
      ))}

      {/* X-axis labels */}
      {xLabels.map(({ i, label }) => (
        <text
          key={i}
          x={toX(i)}
          y={H - 4}
          textAnchor="middle"
          fill="#52525b"
          fontSize="9"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart({ wins, losses }: { wins: number; losses: number }) {
  const total = wins + losses;
  if (total === 0) {
    return (
      <div className="flex items-center justify-center w-24 h-24 rounded-full border-4 border-zinc-800">
        <span className="text-zinc-600 text-xs">—</span>
      </div>
    );
  }

  const R = 38;
  const CX = 48;
  const CY = 48;
  const circumference = 2 * Math.PI * R;
  const winFrac = wins / total;
  const winDash = winFrac * circumference;

  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      {/* Background ring */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#27272a" strokeWidth="10" />
      {/* Loss arc (base) */}
      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke="#f43f5e"
        strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={0}
        strokeLinecap="butt"
        transform={`rotate(-90 ${CX} ${CY})`}
      />
      {/* Win arc */}
      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke="#34d399"
        strokeWidth="10"
        strokeDasharray={`${winDash} ${circumference - winDash}`}
        strokeDashoffset={0}
        strokeLinecap="butt"
        transform={`rotate(-90 ${CX} ${CY})`}
      />
      {/* Center text */}
      <text x={CX} y={CY - 4} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">
        {total}
      </text>
      <text x={CX} y={CY + 10} textAnchor="middle" fill="#71717a" fontSize="8">
        trades
      </text>
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardClient({ data }: { data: DashboardData }) {
  const {
    userName,
    totalTrades,
    netPnl,
    winRate,
    profitFactor,
    maxDrawdown,
    wins,
    losses,
    bestTrade,
    worstTrade,
    avgWin,
    avgLoss,
    currency,
    recentTrades,
    pairPerformance,
    equityCurve,
    sparklines,
  } = data;

  const maxPairPnl = Math.max(...pairPerformance.map((p) => Math.abs(p.pnl)), 1);

  const kpiCards = [
    {
      label: "Profit Net",
      value: fmt(netPnl, currency),
      positive: netPnl >= 0,
      sparkData: sparklines.pnl,
      sparkColor: netPnl >= 0 ? "#34d399" : "#f43f5e",
      sub: totalTrades > 0 ? `din ${totalTrades} trades` : "nicio tranzacție",
    },
    {
      label: "Win Rate",
      value: winRate !== null ? `${winRate.toFixed(1)}%` : "—",
      positive: winRate !== null ? winRate >= 50 : undefined,
      sparkData: sparklines.winRate,
      sparkColor: "#818cf8",
      sub: totalTrades > 0 ? `${wins}W / ${losses}L` : "nicio tranzacție",
    },
    {
      label: "Profit Factor",
      value: profitFactor !== null ? profitFactor.toFixed(2) : "—",
      positive: profitFactor !== null ? profitFactor >= 1 : undefined,
      sparkData: sparklines.profitFactor,
      sparkColor: "#f59e0b",
      sub: profitFactor !== null ? (profitFactor >= 1.5 ? "excelent" : profitFactor >= 1 ? "pozitiv" : "negativ") : "—",
    },
    {
      label: "Max Drawdown",
      value: maxDrawdown !== null ? `${maxDrawdown.toFixed(1)}%` : "—",
      positive: maxDrawdown !== null ? maxDrawdown < 10 : undefined,
      sparkData: sparklines.drawdown,
      sparkColor: "#f43f5e",
      sub: maxDrawdown !== null ? (maxDrawdown < 5 ? "excelent" : maxDrawdown < 15 ? "acceptabil" : "ridicat") : "—",
    },
    {
      label: "Tranzacții",
      value: totalTrades === 0 ? "—" : String(totalTrades),
      positive: totalTrades > 0 ? true : undefined,
      sparkData: sparklines.trades,
      sparkColor: "#6366f1",
      sub: `${wins} câștigate`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{greetingRo(userName)}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Privire de ansamblu asupra performanței tale de trading.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
          <CalendarDays className="w-4 h-4 text-zinc-600" />
          <span className="capitalize">{todayRo()}</span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs text-zinc-500 font-medium">{card.label}</p>
              <Sparkline data={card.sparkData} color={card.sparkColor} width={56} height={24} />
            </div>
            <p
              className={`text-xl font-bold num ${
                card.positive === true
                  ? "text-emerald-400"
                  : card.positive === false
                  ? "text-rose-400"
                  : "text-zinc-100"
              }`}
            >
              {card.value}
            </p>
            <p className="text-[11px] text-zinc-600 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Live Chart — 3 cols */}
        <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-xl p-5" style={{ minHeight: 360 }}>
          <LiveChart />
        </div>

        {/* Performance Breakdown — 1 col */}
        <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-4">Performanță</h2>
          <div className="flex justify-center mb-4">
            <DonutChart wins={wins} losses={losses} />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Câștiguri</span>
              <span className="text-emerald-400 font-medium">{wins}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Pierderi</span>
              <span className="text-rose-400 font-medium">{losses}</span>
            </div>
            <div className="h-px bg-zinc-800 my-1" />
            <div className="flex justify-between">
              <span className="text-zinc-500">Cel mai bun</span>
              <span className="text-emerald-400 font-medium num">+{bestTrade.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Cel mai rău</span>
              <span className="text-rose-400 font-medium num">{worstTrade.toFixed(2)}</span>
            </div>
            <div className="h-px bg-zinc-800 my-1" />
            <div className="flex justify-between">
              <span className="text-zinc-500">Avg câștig</span>
              <span className="text-zinc-300 num">{avgWin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Avg pierdere</span>
              <span className="text-zinc-300 num">{avgLoss.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Market Sessions */}
        <MarketSessions />

        {/* Pair Performance */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-200">Performanță pe Pereche</h2>
            <Link href="/analytics" className="text-[10px] text-indigo-400 hover:text-indigo-300">
              Detalii →
            </Link>
          </div>
          {pairPerformance.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">
              Nicio tranzacție înregistrată
            </div>
          ) : (
            <div className="space-y-3">
              {pairPerformance.map((pair) => {
                const barWidth = (Math.abs(pair.pnl) / maxPairPnl) * 100;
                const positive = pair.pnl >= 0;
                return (
                  <div key={pair.symbol}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-zinc-300">{pair.symbol}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-600">{pair.trades} trades</span>
                        <span
                          className={`text-xs font-semibold num ${
                            positive ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {positive ? "+" : ""}
                          {pair.pnl.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          positive ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Trades */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-200">Tranzacții Recente</h2>
            <Link href="/trades" className="text-[10px] text-indigo-400 hover:text-indigo-300">
              Vezi toate →
            </Link>
          </div>
          {recentTrades.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">
              Nicio tranzacție înregistrată
            </div>
          ) : (
            <div className="space-y-1">
              {recentTrades.slice(0, 6).map((trade) => {
                const positive = (trade.pnlMoney ?? 0) >= 0;
                return (
                  <Link
                    key={trade.id}
                    href={`/trades/${trade.id}`}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-zinc-800/60 transition-colors group"
                  >
                    {/* Direction badge */}
                    <span
                      className={`text-[10px] font-bold w-8 text-center py-0.5 rounded ${
                        trade.direction === "BUY"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {trade.direction === "BUY" ? "BUY" : "SELL"}
                    </span>

                    {/* Symbol */}
                    <span className="text-xs font-semibold text-zinc-300 w-16 truncate">
                      {trade.symbol}
                    </span>

                    {/* Lots */}
                    <span className="text-[11px] text-zinc-600 w-10 num">{trade.lotSize.toFixed(2)}</span>

                    {/* Pips */}
                    <span
                      className={`text-[11px] num flex-1 ${
                        (trade.pnlPips ?? 0) >= 0 ? "text-zinc-500" : "text-zinc-600"
                      }`}
                    >
                      {trade.pnlPips !== null
                        ? `${trade.pnlPips >= 0 ? "+" : ""}${trade.pnlPips.toFixed(1)}p`
                        : "—"}
                    </span>

                    {/* PnL */}
                    <span
                      className={`text-xs font-semibold num ml-auto ${
                        positive ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
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
