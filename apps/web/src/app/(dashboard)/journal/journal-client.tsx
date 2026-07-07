"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Star,
  ChevronDown,
  ChevronUp,
  X,
  StickyNote,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JournalTrade {
  id: string;
  symbol: string;
  direction: "BUY" | "SELL";
  lotSize: number;
  entryPrice: number;
  exitPrice: number | null;
  entryTime: string;
  exitTime: string | null;
  pnlMoney: number | null;
  pnlPips: number | null;
  riskRewardRatio: number | null;
  setupType: string | null;
  timeframe: string | null;
  tags: string[];
  status: string;
  journal: {
    preNotes: string | null;
    preEmotionalState: string | null;
    preConfidence: number | null;
    postNotes: string | null;
    postEmotionalState: string | null;
    postMistakeTypes: string[];
    postLessons: string | null;
    aiAnalysis: string | null;
    aiScore: number | null;
  } | null;
}

export interface JournalStats {
  totalTrades: number;
  journaled: number;
  wins: number;
  losses: number;
  netPnl: number;
  winRate: number | null;
  avgRR: number | null;
  bestDay: string | null;
  currency: string;
}

interface JournalClientProps {
  trades: JournalTrade[];
  stats: JournalStats;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// color = clasă, label = cheie → journalPage.* (tradusă la randare)
const EMOTIONAL_STATES: Record<string, { label: string; color: string }> = {
  CONFIDENT: { label: "esConfident", color: "text-emerald-400" },
  CALM: { label: "esCalm", color: "text-blue-400" },
  ANXIOUS: { label: "esAnxious", color: "text-amber-400" },
  FEARFUL: { label: "esFearful", color: "text-rose-400" },
  GREEDY: { label: "esGreedy", color: "text-orange-400" },
  NEUTRAL: { label: "esNeutral", color: "text-zinc-400" },
  FRUSTRATED: { label: "esFrustrated", color: "text-red-400" },
  EXCITED: { label: "esExcited", color: "text-purple-400" },
};

const MISTAKE_LABELS: Record<string, string> = {
  EARLY_EXIT: "mkEarlyExit",
  LATE_ENTRY: "mkLateEntry",
  REVENGE_TRADE: "mkRevenge",
  FOMO: "mkFomo",
  NO_STOP_LOSS: "mkNoSl",
  OVERSIZED: "mkOversized",
  MOVED_SL: "mkMovedSl",
  IGNORED_NEWS: "mkIgnoredNews",
  OVERTRADED: "mkOvertraded",
};

function fmtDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtTime(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
}) {
  const accentBg = positive === true ? "kpi-profit border-emerald-500/20" : positive === false ? "kpi-loss border-rose-500/20" : "border-zinc-800";
  const valueClass = positive === true ? "text-emerald-400 neon-emerald" : positive === false ? "text-rose-400 neon-rose" : "text-zinc-100";
  return (
    <div className={`bg-zinc-900/80 border rounded-2xl p-4 card-3d ${accentBg}`}>
      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-black num tracking-tight ${valueClass}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Trade Row ────────────────────────────────────────────────────────────────

function TradeRow({ trade }: { trade: JournalTrade }) {
  const t = useTranslations("journalPage");
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const positive = (trade.pnlMoney ?? 0) >= 0;
  const hasJournal = !!trade.journal;

  return (
    <div className="border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all duration-200 bg-zinc-900/80 card-3d">
      {/* Main Row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-800/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Direction */}
        <span
          className={`text-[10px] font-bold w-10 text-center py-1 rounded ${
            trade.direction === "BUY"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          }`}
        >
          {trade.direction}
        </span>

        {/* Symbol + date */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-200">{trade.symbol}</span>
            {trade.setupType && (
              <span className="text-[10px] text-zinc-500 bg-zinc-800 border border-zinc-700 rounded px-1.5">
                {trade.setupType.replace(/_/g, " ")}
              </span>
            )}
            {trade.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded px-1.5">
                {tag}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-zinc-600 mt-0.5">
            {fmtDate(trade.entryTime, locale)} • {fmtTime(trade.entryTime, locale)}
            {trade.exitTime && ` → ${fmtTime(trade.exitTime, locale)}`}
          </p>
        </div>

        {/* RR */}
        <div className="text-center hidden md:block w-14">
          <p className="text-[10px] text-zinc-600">R:R</p>
          <p className="text-xs font-semibold text-zinc-300 num">
            {trade.riskRewardRatio ? `1:${trade.riskRewardRatio.toFixed(1)}` : "—"}
          </p>
        </div>

        {/* Pips */}
        <div className="text-center hidden md:block w-14">
          <p className="text-[10px] text-zinc-600">Pips</p>
          <p className={`text-xs font-semibold num ${positive ? "text-emerald-400" : "text-rose-400"}`}>
            {trade.pnlPips !== null ? `${trade.pnlPips >= 0 ? "+" : ""}${trade.pnlPips.toFixed(1)}` : "—"}
          </p>
        </div>

        {/* PnL */}
        <div className="text-right w-20">
          <p
            className={`text-sm font-bold num ${
              positive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {trade.pnlMoney !== null
              ? `${trade.pnlMoney >= 0 ? "+" : ""}${trade.pnlMoney.toFixed(2)}`
              : "—"}
          </p>
        </div>

        {/* Journal indicator */}
        <div className="flex items-center gap-2">
          {hasJournal ? (
            <span className="w-2 h-2 rounded-full bg-indigo-400" title={t("journaledTip")} />
          ) : (
            <span className="w-2 h-2 rounded-full bg-zinc-700" title={t("noJournalTip")} />
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-600" />
          )}
        </div>
      </div>

      {/* Expanded Panel */}
      {expanded && (
        <div className="px-4 py-4 bg-zinc-950/80 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Trade details */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.08em]">{t("tradeDetails")}</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-zinc-600">{t("entry")}</p>
                <p className="text-zinc-300 num">{trade.entryPrice.toFixed(5)}</p>
              </div>
              <div>
                <p className="text-zinc-600">{t("exit")}</p>
                <p className="text-zinc-300 num">{trade.exitPrice?.toFixed(5) ?? "—"}</p>
              </div>
              <div>
                <p className="text-zinc-600">{t("lot")}</p>
                <p className="text-zinc-300 num">{trade.lotSize.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-zinc-600">{t("timeframe")}</p>
                <p className="text-zinc-300">{trade.timeframe ?? "—"}</p>
              </div>
            </div>

            {/* Pre-trade */}
            {trade.journal?.preNotes && (
              <div>
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">{t("preNotesLabel")}</p>
                <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-900 rounded-lg p-2.5 border border-zinc-800">
                  {trade.journal.preNotes}
                </p>
              </div>
            )}
          </div>

          {/* Journal data */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.08em]">{t("journalTitle")}</h4>

            {trade.journal ? (
              <>
                {/* Emotions */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-zinc-600 mb-0.5">{t("statePre")}</p>
                    <p className={EMOTIONAL_STATES[trade.journal.preEmotionalState ?? ""]?.color ?? "text-zinc-400"}>
                      {EMOTIONAL_STATES[trade.journal.preEmotionalState ?? ""] ? t(EMOTIONAL_STATES[trade.journal.preEmotionalState ?? ""].label) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-600 mb-0.5">{t("statePost")}</p>
                    <p className={EMOTIONAL_STATES[trade.journal.postEmotionalState ?? ""]?.color ?? "text-zinc-400"}>
                      {EMOTIONAL_STATES[trade.journal.postEmotionalState ?? ""] ? t(EMOTIONAL_STATES[trade.journal.postEmotionalState ?? ""].label) : "—"}
                    </p>
                  </div>
                  {trade.journal.preConfidence && (
                    <div>
                      <p className="text-zinc-600 mb-0.5">{t("confidence")}</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 w-2 rounded-sm ${
                              i < (trade.journal?.preConfidence ?? 0)
                                ? "bg-indigo-500"
                                : "bg-zinc-800"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {trade.journal.aiScore !== null && (
                    <div>
                      <p className="text-zinc-600 mb-0.5">{t("aiScore")}</p>
                      <p className={`font-bold ${trade.journal.aiScore >= 70 ? "text-emerald-400" : trade.journal.aiScore >= 40 ? "text-amber-400" : "text-rose-400"}`}>
                        {trade.journal.aiScore}/100
                      </p>
                    </div>
                  )}
                </div>

                {/* Mistakes */}
                {trade.journal.postMistakeTypes.length > 0 && (
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">{t("mistakesLabel")}</p>
                    <div className="flex flex-wrap gap-1">
                      {trade.journal.postMistakeTypes.map((m) => (
                        <span key={m} className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded px-1.5 py-0.5">
                          {MISTAKE_LABELS[m] ? t(MISTAKE_LABELS[m]) : m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Post notes */}
                {trade.journal.postNotes && (
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">{t("postNotesLabel")}</p>
                    <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-900 rounded-lg p-2.5 border border-zinc-800">
                      {trade.journal.postNotes}
                    </p>
                  </div>
                )}

                {/* Lessons */}
                {trade.journal.postLessons && (
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">{t("lessonsLabel")}</p>
                    <p className="text-xs text-emerald-400/80 leading-relaxed">
                      {trade.journal.postLessons}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <StickyNote className="w-8 h-8 text-zinc-700" />
                <p className="text-xs text-zinc-600 text-center">
                  {t("noJournal")}
                </p>
                <Link
                  href={`/trades/${trade.id}`}
                  className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/25 bg-indigo-500/8 hover:bg-indigo-500/15 rounded-xl px-4 py-2 mt-1 transition-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t("addJournal")}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function JournalClient({ trades, stats }: JournalClientProps) {
  const t = useTranslations("journalPage");
  const [search, setSearch] = useState("");
  const [dirFilter, setDirFilter] = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [journaledFilter, setJournaledFilter] = useState<"ALL" | "YES" | "NO">("ALL");
  const [resultFilter, setResultFilter] = useState<"ALL" | "WIN" | "LOSS">("ALL");
  const [sortBy, setSortBy] = useState<"date" | "pnl" | "rr">("date");

  const filtered = useMemo(() => {
    return trades
      .filter((t) => {
        if (search && !t.symbol.toLowerCase().includes(search.toLowerCase()) && !t.setupType?.toLowerCase().includes(search.toLowerCase())) return false;
        if (dirFilter !== "ALL" && t.direction !== dirFilter) return false;
        if (journaledFilter === "YES" && !t.journal) return false;
        if (journaledFilter === "NO" && t.journal) return false;
        if (resultFilter === "WIN" && (t.pnlMoney ?? 0) <= 0) return false;
        if (resultFilter === "LOSS" && (t.pnlMoney ?? 0) >= 0) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "pnl") return (b.pnlMoney ?? 0) - (a.pnlMoney ?? 0);
        if (sortBy === "rr") return (b.riskRewardRatio ?? 0) - (a.riskRewardRatio ?? 0);
        return new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime();
      });
  }, [trades, search, dirFilter, journaledFilter, resultFilter, sortBy]);

  const journaledPct = stats.totalTrades > 0 ? Math.round((stats.journaled / stats.totalTrades) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight neon-emerald">{t("pageTitle")}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {t("pageSub")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900/80 border border-zinc-800/80 rounded-xl px-3 py-2">
          <div className="w-5 h-5 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
            <BookOpen className="w-3 h-3 text-indigo-400" />
          </div>
          <span>
            <span className="text-indigo-300 font-bold">{stats.journaled}</span>
            <span className="text-zinc-600">/{stats.totalTrades} {t("journaledWord")}</span>
            <span className="text-indigo-400 font-semibold ml-1">({journaledPct}%)</span>
          </span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard
          label={t("kTrades")}
          value={String(stats.totalTrades)}
          sub={t("subJournaled", { n: stats.journaled })}
        />
        <StatCard
          label={t("kWinRate")}
          value={stats.winRate !== null ? `${stats.winRate.toFixed(1)}%` : "—"}
          positive={stats.winRate !== null ? stats.winRate >= 50 : undefined}
          sub={t("subWL", { w: stats.wins, l: stats.losses })}
        />
        <StatCard
          label={t("kNetProfit")}
          value={stats.netPnl >= 0 ? `+${stats.netPnl.toFixed(2)}` : stats.netPnl.toFixed(2)}
          positive={stats.netPnl >= 0}
          sub={stats.currency}
        />
        <StatCard
          label={t("kAvgRR")}
          value={stats.avgRR !== null ? `1:${stats.avgRR.toFixed(2)}` : "—"}
          positive={stats.avgRR !== null ? stats.avgRR >= 1.5 : undefined}
          sub={stats.avgRR !== null ? (stats.avgRR >= 2 ? t("excellent") : t("toImprove")) : "—"}
        />
        <StatCard label={t("kWins")} value={String(stats.wins)} positive={stats.wins > 0} />
        <StatCard label={t("kLosses")} value={String(stats.losses)} positive={stats.losses === 0} />
        <StatCard
          label={t("kJournaled")}
          value={`${journaledPct}%`}
          positive={journaledPct >= 80}
          sub={journaledPct >= 80 ? t("excellent") : t("addMore")}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3 text-zinc-600" />
            </button>
          )}
        </div>

        {/* Direction */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 gap-0.5">
          {(["ALL", "BUY", "SELL"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDirFilter(d)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ${
                dirFilter === d
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {d === "ALL" ? t("fAll") : d}
            </button>
          ))}
        </div>

        {/* Result */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 gap-0.5">
          {(["ALL", "WIN", "LOSS"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setResultFilter(r)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ${
                resultFilter === r
                  ? r === "WIN"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : r === "LOSS"
                    ? "bg-rose-500/20 text-rose-400"
                    : "bg-zinc-700 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {r === "ALL" ? t("fAll") : r === "WIN" ? t("fWin") : t("fLoss")}
            </button>
          ))}
        </div>

        {/* Journaled filter */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 gap-0.5">
          {(["ALL", "YES", "NO"] as const).map((j) => (
            <button
              key={j}
              onClick={() => setJournaledFilter(j)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ${
                journaledFilter === j ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {j === "ALL" ? t("fJournalAll") : j === "YES" ? t("fWithJournal") : t("fWithoutJournal")}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 ml-auto">
          <Filter className="w-3.5 h-3.5 text-zinc-600" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400 px-2 py-2 focus:outline-none"
          >
            <option value="date">{t("sortDate")}</option>
            <option value="pnl">{t("sortPnl")}</option>
            <option value="rr">{t("sortRR")}</option>
          </select>
        </div>
      </div>

      {/* Trades List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6 text-zinc-500" />
          </div>
          <div>
            <p className="text-zinc-300 font-semibold">{t("emptyTitle")}</p>
            <p className="text-zinc-500 text-sm mt-1">{t("emptySub")}</p>
          </div>
          <button
            onClick={() => { setSearch(""); setDirFilter("ALL"); setResultFilter("ALL"); setJournaledFilter("ALL"); }}
            className="text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20"
          >
            {t("resetFilters")}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-zinc-600">
            {t("countShown", { n: filtered.length })}
          </p>
          {filtered.map((trade) => (
            <TradeRow key={trade.id} trade={trade} />
          ))}
        </div>
      )}
    </div>
  );
}
