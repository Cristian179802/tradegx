"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
  PieChart, Pie,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, TrendingUp, TrendingDown, Target, Activity,
  BarChart2, Zap, Award, AlertTriangle, ChevronLeft, ChevronRight,
  Trash2, ArrowUpRight, ArrowDownRight, Clock,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────── */

interface Trade {
  id: string;
  direction: string;
  entryTime: string;
  exitTime: string;
  entryPrice: string;
  exitPrice: string;
  stopLoss: string | null;
  takeProfit: string | null;
  lotSize: string;
  pnl: string;
  commission: string;
  riskRewardRatio: string | null;
  exitReason: string | null;
}

interface BacktestData {
  id: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  status: string;
  errorMessage: string | null;
  totalBars: number | null;

  totalTrades: number | null;
  winRate: string | null;
  profitFactor: string | null;
  maxDrawdown: string | null;
  maxDrawdownPct: string | null;
  sharpeRatio: string | null;
  sortinoRatio: string | null;
  netPnl: string | null;
  expectancy: string | null;
  avgRR: string | null;
  initialBalance: string | null;
  finalBalance: string | null;
  riskPerTrade: string | null;
  commission: string;
  spread: string;

  equityCurve: { date: string; balance: number; pnl: number }[] | null;
  monthlyPnl: { month: string; pnl: number }[] | null;

  strategy: {
    id: string;
    name: string;
    type: string;
    color: string | null;
    rules: unknown;
  };

  trades: Trade[];
}

/* ─── Constants ─────────────────────────────────────────────── */

const STRATEGY_TYPE_LABELS: Record<string, string> = {
  EMA_CROSSOVER:    "EMA Crossover",
  SESSION_BREAKOUT: "Session Breakout",
  RSI_REVERSAL:     "RSI Reversal",
  TREND_FOLLOWING:  "Trend Following",
};

const EXIT_REASON_LABELS: Record<string, string> = {
  TP:        "Take Profit",
  SL:        "Stop Loss",
  TRAILING:  "Trailing Stop",
  SIGNAL:    "Semnal opus",
  EOD:       "End of Data",
};

const TRADES_PER_PAGE = 20;

/* ─── Helpers ───────────────────────────────────────────────── */

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "2-digit" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
}
function fmtPrice(s: string, symbol: string) {
  const n = parseFloat(s);
  const isJpy = symbol.includes("JPY");
  return isJpy ? n.toFixed(3) : n.toFixed(5);
}
function n(s: string | null | undefined, decimals = 2) {
  if (!s) return null;
  const v = parseFloat(s);
  return isNaN(v) ? null : v;
}

/* ─── KPI Card ──────────────────────────────────────────────── */

function KpiCard({
  label,
  value,
  sub,
  accent,
  icon: Icon,
  glow,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "green" | "red" | "indigo" | "amber" | "zinc";
  icon: React.ComponentType<{ className?: string }>;
  glow?: boolean;
}) {
  const colorMap = {
    green:  "text-emerald-400",
    red:    "text-rose-400",
    indigo: "text-indigo-400",
    amber:  "text-amber-400",
    zinc:   "text-zinc-300",
  };
  const glowMap = {
    green:  "shadow-emerald-500/10",
    red:    "shadow-rose-500/10",
    indigo: "shadow-indigo-500/10",
    amber:  "shadow-amber-500/10",
    zinc:   "",
  };
  const col = accent ?? "zinc";
  return (
    <div className={cn(
      "rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-4 transition-all duration-200",
      glow && `shadow-lg ${glowMap[col]}`
    )}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-wide">{label}</p>
        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center",
          col === "green" ? "bg-emerald-500/15"
          : col === "red" ? "bg-rose-500/15"
          : col === "indigo" ? "bg-indigo-500/15"
          : col === "amber" ? "bg-amber-500/15"
          : "bg-zinc-800"
        )}>
          <Icon className={cn("h-3 w-3", colorMap[col])} />
        </div>
      </div>
      <p className={cn("text-2xl font-black num tracking-tight", colorMap[col])}>{value}</p>
      {sub && <p className="text-[11px] text-zinc-600 mt-0.5 num">{sub}</p>}
    </div>
  );
}

/* ─── Custom Tooltip ────────────────────────────────────────── */

function EquityTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: { pnl: number } }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const balance = payload[0]?.value;
  const pnl = payload[0]?.payload?.pnl;
  return (
    <div className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="text-zinc-100 font-semibold num">${balance?.toFixed(2)}</p>
      {pnl !== undefined && (
        <p className={cn("num", pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
          {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}$
        </p>
      )}
    </div>
  );
}

function MonthlyTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value ?? 0;
  return (
    <div className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className={cn("font-semibold num", v >= 0 ? "text-emerald-400" : "text-rose-400")}>
        {v >= 0 ? "+" : ""}{v.toFixed(2)}$
      </p>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────── */

export function ResultsClient({ backtest }: { backtest: BacktestData }) {
  const router = useRouter();
  const { toast } = useToast();
  const [page, setPage] = React.useState(0);
  const [deleting, setDeleting] = React.useState(false);

  /* ── derived numbers ── */
  const netPnl      = n(backtest.netPnl);
  const winRate     = n(backtest.winRate);
  const pf          = n(backtest.profitFactor);
  const maxDdPct    = n(backtest.maxDrawdownPct);
  const sharpe      = n(backtest.sharpeRatio);
  const sortino     = n(backtest.sortinoRatio);
  const expectancy  = n(backtest.expectancy);
  const avgRR       = n(backtest.avgRR);
  const initBal     = n(backtest.initialBalance) ?? 10000;
  const finalBal    = n(backtest.finalBalance);
  const pnlPct      = netPnl !== null ? (netPnl / initBal) * 100 : null;
  const totalTrades = backtest.totalTrades ?? 0;
  const winners     = backtest.trades.filter((t) => parseFloat(t.pnl) > 0).length;
  const losers      = backtest.trades.filter((t) => parseFloat(t.pnl) < 0).length;

  /* ── pnl distribution buckets ── */
  const pnlDistribution = React.useMemo(() => {
    if (!backtest.trades.length) return [];
    const pnls = backtest.trades.map((t) => parseFloat(t.pnl));
    const min  = Math.floor(Math.min(...pnls));
    const max  = Math.ceil(Math.max(...pnls));
    const range = max - min || 1;
    const buckets = 12;
    const step = range / buckets;
    const bins: { range: string; count: number; positive: boolean }[] = [];
    for (let i = 0; i < buckets; i++) {
      const lo = min + i * step;
      const hi = min + (i + 1) * step;
      const count = pnls.filter((p) => p >= lo && (i === buckets - 1 ? p <= hi : p < hi)).length;
      bins.push({
        range: `${lo >= 0 ? "+" : ""}${lo.toFixed(0)}`,
        count,
        positive: (lo + hi) / 2 >= 0,
      });
    }
    return bins;
  }, [backtest.trades]);

  /* ── paginated trades ── */
  const totalPages = Math.ceil(backtest.trades.length / TRADES_PER_PAGE);
  const pageTrades = backtest.trades.slice(page * TRADES_PER_PAGE, (page + 1) * TRADES_PER_PAGE);

  /* ── delete ── */
  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/backtesting/${backtest.id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Backtest șters" });
      router.push("/backtesting");
      router.refresh();
    } else {
      toast({ title: "Eroare la ștergere", variant: "destructive" });
      setDeleting(false);
    }
  }

  /* ── status: FAILED ── */
  if (backtest.status === "FAILED") {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
          <AlertTriangle className="h-7 w-7 text-rose-400" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">Backtestul a eșuat</h2>
        <p className="text-sm text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          {backtest.errorMessage ?? "Eroare necunoscută"}
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Button asChild variant="outline" className="border-zinc-700 text-zinc-400">
            <Link href="/backtesting"><ArrowLeft className="h-4 w-4 mr-1.5" />Înapoi</Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20">
            <Link href={`/backtesting/new?strategyId=${backtest.strategy.id}`}>Încearcă din nou</Link>
          </Button>
        </div>
      </div>
    );
  }

  /* ── status: RUNNING / PENDING ── */
  if (backtest.status !== "COMPLETED") {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto animate-pulse">
          <Activity className="h-7 w-7 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">Backtestul rulează...</h2>
        <p className="text-sm text-zinc-500">Vei fi redirecționat automat.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-300 -ml-2">
            <Link href="/backtesting"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div
            className="w-3.5 h-3.5 rounded-full shrink-0"
            style={{ background: backtest.strategy.color ?? "#6366f1" }}
          />
          <div>
            <h1 className="text-xl font-bold text-zinc-100">{backtest.strategy.name}</h1>
            <p className="text-xs text-zinc-500">
              {STRATEGY_TYPE_LABELS[backtest.strategy.type] ?? backtest.strategy.type}
              {" · "}{backtest.symbol} {backtest.timeframe}
              {" · "}{fmtDate(backtest.startDate)} → {fmtDate(backtest.endDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-zinc-700 text-zinc-400 hover:text-zinc-200"
          >
            <Link href={`/backtesting/new?strategyId=${backtest.strategy.id}`}>
              Rulează din nou
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="P&L Net"
          value={netPnl !== null ? `${netPnl >= 0 ? "+" : ""}${netPnl.toFixed(2)}$` : "—"}
          sub={pnlPct !== null ? `${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%` : undefined}
          accent={netPnl !== null && netPnl >= 0 ? "green" : "red"}
          icon={netPnl !== null && netPnl >= 0 ? TrendingUp : TrendingDown}
          glow
        />
        <KpiCard
          label="Win Rate"
          value={winRate !== null ? `${winRate.toFixed(1)}%` : "—"}
          sub={`${winners}W / ${losers}L`}
          accent={winRate !== null && winRate >= 50 ? "green" : "amber"}
          icon={Target}
        />
        <KpiCard
          label="Profit Factor"
          value={pf !== null ? pf.toFixed(2) : "—"}
          sub={pf !== null ? (pf >= 1.5 ? "Excelent" : pf >= 1 ? "Bun" : "Slab") : undefined}
          accent={pf !== null && pf >= 1 ? "green" : "red"}
          icon={Award}
        />
        <KpiCard
          label="Max Drawdown"
          value={maxDdPct !== null ? `-${maxDdPct.toFixed(2)}%` : "—"}
          sub={backtest.maxDrawdown ? `-${parseFloat(backtest.maxDrawdown).toFixed(2)}$` : undefined}
          accent="red"
          icon={AlertTriangle}
        />
        <KpiCard
          label="Sharpe Ratio"
          value={sharpe !== null ? sharpe.toFixed(2) : "—"}
          sub={sharpe !== null ? (sharpe >= 1.5 ? "Excelent" : sharpe >= 1 ? "Bun" : "Slab") : undefined}
          accent={sharpe !== null && sharpe >= 1 ? "green" : "amber"}
          icon={BarChart2}
        />
        <KpiCard
          label="Sortino Ratio"
          value={sortino !== null ? sortino.toFixed(2) : "—"}
          accent={sortino !== null && sortino >= 1 ? "green" : "amber"}
          icon={Activity}
        />
        <KpiCard
          label="Expectanță"
          value={expectancy !== null ? `${expectancy >= 0 ? "+" : ""}${expectancy.toFixed(2)}$` : "—"}
          sub="per trade"
          accent={expectancy !== null && expectancy >= 0 ? "green" : "red"}
          icon={Zap}
        />
        <KpiCard
          label="Avg R:R"
          value={avgRR !== null ? `1 : ${avgRR.toFixed(2)}` : "—"}
          sub={`${totalTrades} total trades`}
          accent="indigo"
          icon={BarChart2}
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Equity Curve — spans 2 cols */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-300">Curbă de capital</h3>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span className="num">${initBal.toFixed(0)} → ${(finalBal ?? initBal).toFixed(0)}</span>
            </div>
          </div>
          {backtest.equityCurve && backtest.equityCurve.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={backtest.equityCurve} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={netPnl !== null && netPnl >= 0 ? "#10b981" : "#f43f5e"} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={netPnl !== null && netPnl >= 0 ? "#10b981" : "#f43f5e"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => v?.slice(5)} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} width={52} />
                <Tooltip content={<EquityTooltip />} />
                <ReferenceLine y={initBal} stroke="#52525b" strokeDasharray="4 4" />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke={netPnl !== null && netPnl >= 0 ? "#10b981" : "#f43f5e"}
                  strokeWidth={2}
                  fill="url(#eqGrad)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-zinc-600 text-sm">
              Date insuficiente
            </div>
          )}
        </div>

        {/* Win/Loss Donut */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Distribuție trade-uri</h3>
          {totalTrades > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Câștiguri", value: winners },
                      { name: "Pierderi",  value: losers },
                      { name: "Break-even", value: totalTrades - winners - losers },
                    ].filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#18181b"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f43f5e" />
                    <Cell fill="#71717a" />
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#27272a", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }}
                    itemStyle={{ color: "#d4d4d8" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 text-xs mt-2">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  {winners} câștig ({winRate !== null ? winRate.toFixed(1) : "—"}%)
                </span>
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  {losers} pierdere
                </span>
              </div>
            </>
          ) : (
            <div className="h-[160px] flex items-center justify-center text-zinc-600 text-sm">
              Niciun trade
            </div>
          )}
        </div>
      </div>

      {/* Monthly P&L + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly P&L */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">P&L lunar</h3>
          {backtest.monthlyPnl && backtest.monthlyPnl.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={backtest.monthlyPnl} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(0)}`} width={48} />
                <Tooltip content={<MonthlyTooltip />} />
                <ReferenceLine y={0} stroke="#52525b" />
                <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                  {backtest.monthlyPnl.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? "#10b981" : "#f43f5e"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-zinc-600 text-sm">
              Date insuficiente
            </div>
          )}
        </div>

        {/* P&L Distribution */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Distribuție P&L</h3>
          {pnlDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pnlDistribution} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="range" tick={{ fill: "#71717a", fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} width={32} />
                <Tooltip
                  contentStyle={{ background: "#27272a", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: "#d4d4d8" }}
                  formatter={(v: number) => [v, "trades"]}
                />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {pnlDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.positive ? "#10b981" : "#f43f5e"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-zinc-600 text-sm">
              Niciun trade
            </div>
          )}
        </div>
      </div>

      {/* ── Config Summary ── */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-4">
        <h3 className="text-sm font-semibold text-zinc-400 mb-3">Parametri simulare</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Symbol",           value: backtest.symbol },
            { label: "Timeframe",        value: backtest.timeframe },
            { label: "Perioadă",         value: `${fmtDate(backtest.startDate)} – ${fmtDate(backtest.endDate)}` },
            { label: "Balanță inițială", value: `$${initBal.toFixed(0)}` },
            { label: "Risk / trade",     value: backtest.riskPerTrade ? `${backtest.riskPerTrade}%` : "—" },
            { label: "Comision",         value: `$${backtest.commission}/lot` },
            { label: "Spread",           value: backtest.spread },
            { label: "Lumânări analizate", value: backtest.totalBars?.toLocaleString() ?? "—" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-wide">{item.label}</p>
              <p className="text-sm text-zinc-300 font-semibold num mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trades Table ── */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-300">
            Trade-uri ({backtest.trades.length})
          </h3>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1 rounded hover:bg-zinc-800 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="num">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="p-1 rounded hover:bg-zinc-800 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {pageTrades.length === 0 ? (
          <div className="py-12 text-center text-zinc-600 text-sm">Niciun trade</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["#", "Dir", "Entry", "Exit", "Entry $", "Exit $", "SL", "TP", "Lots", "R:R", "Motiv", "P&L"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left font-medium text-zinc-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageTrades.map((t, i) => {
                  const pnl = parseFloat(t.pnl);
                  const comm = parseFloat(t.commission);
                  const netTrade = pnl - comm;
                  const tradeNum = page * TRADES_PER_PAGE + i + 1;
                  return (
                    <tr key={t.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="px-3 py-2.5 text-zinc-600 num">{tradeNum}</td>
                      <td className="px-3 py-2.5">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold",
                          t.direction === "BUY"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-rose-500/15 text-rose-400"
                        )}>
                          {t.direction === "BUY"
                            ? <ArrowUpRight className="h-3 w-3" />
                            : <ArrowDownRight className="h-3 w-3" />}
                          {t.direction}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-zinc-400">
                        <div>{fmtDate(t.entryTime)}</div>
                        <div className="text-zinc-600">{fmtTime(t.entryTime)}</div>
                      </td>
                      <td className="px-3 py-2.5 text-zinc-400">
                        <div>{fmtDate(t.exitTime)}</div>
                        <div className="text-zinc-600">{fmtTime(t.exitTime)}</div>
                      </td>
                      <td className="px-3 py-2.5 text-zinc-300 num font-mono">{fmtPrice(t.entryPrice, backtest.symbol)}</td>
                      <td className="px-3 py-2.5 text-zinc-300 num font-mono">{fmtPrice(t.exitPrice, backtest.symbol)}</td>
                      <td className="px-3 py-2.5 text-zinc-500 num font-mono">
                        {t.stopLoss ? fmtPrice(t.stopLoss, backtest.symbol) : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-500 num font-mono">
                        {t.takeProfit ? fmtPrice(t.takeProfit, backtest.symbol) : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-400 num">{parseFloat(t.lotSize).toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-zinc-400 num">
                        {t.riskRewardRatio ? `1:${parseFloat(t.riskRewardRatio).toFixed(2)}` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-500">
                        {t.exitReason ? (EXIT_REASON_LABELS[t.exitReason] ?? t.exitReason) : "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className={cn("font-bold num", netTrade >= 0 ? "text-emerald-400" : "text-rose-400")}>
                          {netTrade >= 0 ? "+" : ""}{netTrade.toFixed(2)}$
                        </div>
                        {comm > 0 && (
                          <div className="text-[10px] text-zinc-600 num">-{comm.toFixed(2)}$ com.</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
