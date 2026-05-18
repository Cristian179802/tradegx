"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JournalEntryForm } from "@/components/journal/journal-entry-form";
import { ScreenshotGallery } from "@/components/trades/screenshot-gallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, TrendingUp, TrendingDown, Clock, Tag,
  Trash2, Pencil, XCircle, BookOpen, Camera, Sparkles,
  Loader2, Target, Shield, DollarSign, Activity,
  ChevronRight, AlertTriangle,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface Trade {
  id: string;
  symbol: string;
  direction: "BUY" | "SELL";
  instrumentType: string;
  entryPrice: string | number;
  exitPrice: string | number | null;
  entryTime: string | Date;
  exitTime: string | Date | null;
  lotSize: string | number;
  stopLoss: string | number | null;
  takeProfit: string | number | null;
  pnlMoney: string | number | null;
  pnlPercent: string | number | null;
  commission: string | number | null;
  swap: string | number | null;
  riskMoney: string | number | null;
  riskPercent: string | number | null;
  durationMinutes: number | null;
  setupType: string | null;
  killzone: string | null;
  timeframe: string | null;
  status: "OPEN" | "CLOSED" | "CANCELLED";
  tags: string[];
  brokerSource: string | null;
  account: { id: string; name: string; currency: string; balance: string | number };
  journalEntry: {
    id: string;
    preEmotionalState?: string | null;
    preNotes?: string | null;
    preConfidence?: number | null;
    postEmotionalState?: string | null;
    postNotes?: string | null;
    postMistakeTypes?: string[];
    postLessons?: string | null;
    aiAnalysis?: string | null;
    aiScore?: string | number | null;
  } | null;
  screenshots: { id: string; url: string; type: string }[];
}

const SETUP_LABELS: Record<string, string> = {
  ORDER_BLOCK: "Order Block",
  FAIR_VALUE_GAP: "Fair Value Gap",
  LIQUIDITY_SWEEP: "Liquidity Sweep",
  BOS: "BOS",
  CHOCH: "CHoCH",
  BREAKER: "Breaker Block",
  MITIGATION: "Mitigation",
  REJECTION: "Rejection",
  TREND_FOLLOW: "Trend Follow",
  SCALP: "Scalp",
  OTHER: "Altul",
};

function formatDuration(minutes: number | null): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function StatRow({ label, value, mono, accent }: {
  label: string; value: React.ReactNode; mono?: boolean; accent?: "emerald" | "rose";
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/50 last:border-0">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={cn(
        "text-sm font-medium",
        mono && "num",
        accent === "emerald" ? "text-emerald-400" : accent === "rose" ? "text-rose-400" : "text-zinc-200"
      )}>
        {value}
      </span>
    </div>
  );
}

export function TradeDetailClient({ trade }: { trade: Trade }) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [journalKey, setJournalKey] = React.useState(0);
  const [closeOpen, setCloseOpen] = React.useState(false);
  const [closeData, setCloseData] = React.useState({
    exitPrice: "",
    exitTime: new Date().toISOString().slice(0, 16),
    pnlMoney: "",
    commission: "0",
    swap: "0",
  });
  const [isClosing, setIsClosing] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [aiResult, setAiResult] = React.useState<{ analysis: string; score: number | null } | null>(
    trade.journalEntry?.aiAnalysis
      ? { analysis: trade.journalEntry.aiAnalysis as string, score: trade.journalEntry.aiScore != null ? Number(trade.journalEntry.aiScore) : null }
      : null
  );

  const pnl = trade.pnlMoney != null ? Number(trade.pnlMoney) : null;
  const pnlPct = trade.pnlPercent != null ? Number(trade.pnlPercent) : null;
  const isProfit = pnl != null && pnl >= 0;
  const rr = trade.riskMoney && pnl ? Math.abs(pnl / Number(trade.riskMoney)).toFixed(2) : null;
  const isBuy = trade.direction === "BUY";

  async function handleCloseTrade() {
    setIsClosing(true);
    const res = await fetch(`/api/trades/${trade.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exitPrice: parseFloat(closeData.exitPrice),
        exitTime: new Date(closeData.exitTime).toISOString(),
        pnlMoney: parseFloat(closeData.pnlMoney),
        commission: parseFloat(closeData.commission) || 0,
        swap: parseFloat(closeData.swap) || 0,
        status: "CLOSED",
      }),
    });
    if (res.ok) {
      toast({ title: "Trade închis" });
      setCloseOpen(false);
      router.refresh();
    } else {
      toast({ title: "Eroare", variant: "destructive" });
    }
    setIsClosing(false);
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    const res = await fetch(`/api/trades/${trade.id}/analyze`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setAiResult({ analysis: data.analysis, score: data.score });
      toast({ title: "Analiză completă" });
    } else {
      const err = await res.json().catch(() => ({}));
      toast({ title: "Eroare AI", description: err.error ?? "Încearcă din nou", variant: "destructive" });
    }
    setAnalyzing(false);
  }

  async function handleDelete() {
    setIsDeleting(true);
    const res = await fetch(`/api/trades/${trade.id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Trade șters" });
      router.push("/trades");
      router.refresh();
    } else {
      toast({ title: "Eroare", description: "Nu s-a putut șterge", variant: "destructive" });
    }
    setIsDeleting(false);
  }

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/trades" className="hover:text-zinc-300 transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          Tranzacții
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-zinc-300 font-medium">{trade.symbol}</span>
      </div>

      {/* Hero Header */}
      <div className={cn(
        "relative rounded-2xl border p-6 overflow-hidden",
        isProfit
          ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/8 via-zinc-900/80 to-zinc-900/80"
          : pnl !== null
          ? "border-rose-500/20 bg-gradient-to-br from-rose-500/8 via-zinc-900/80 to-zinc-900/80"
          : trade.direction === "BUY"
          ? "border-emerald-500/15 bg-gradient-to-br from-emerald-500/5 via-zinc-900/80 to-zinc-900/80"
          : "border-rose-500/15 bg-gradient-to-br from-rose-500/5 via-zinc-900/80 to-zinc-900/80"
      )}>
        {/* Glow blob */}
        <div className={cn(
          "absolute -right-20 -top-20 w-60 h-60 rounded-full blur-3xl opacity-20",
          isProfit ? "bg-emerald-500" : pnl !== null ? "bg-rose-500" : isBuy ? "bg-emerald-500" : "bg-rose-500"
        )} />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Direction badge */}
            <div className={cn(
              "w-14 h-14 rounded-2xl border flex flex-col items-center justify-center shrink-0",
              isBuy
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-rose-500/10 border-rose-500/30"
            )}>
              {isBuy
                ? <TrendingUp className="h-6 w-6 text-emerald-400" />
                : <TrendingDown className="h-6 w-6 text-rose-400" />
              }
              <span className={cn(
                "text-[10px] font-black mt-0.5",
                isBuy ? "text-emerald-400" : "text-rose-400"
              )}>
                {trade.direction}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-black text-white tracking-tight">{trade.symbol}</h1>
                {trade.timeframe && (
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-lg">{trade.timeframe}</span>
                )}
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded border",
                  trade.status === "OPEN"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : trade.status === "CLOSED"
                    ? "bg-zinc-700/50 text-zinc-400 border-zinc-600/30"
                    : "bg-zinc-800/50 text-zinc-500 border-zinc-700/30"
                )}>
                  {trade.status === "OPEN" ? "● Deschis" : trade.status === "CLOSED" ? "Închis" : "Anulat"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span>{trade.instrumentType}</span>
                <span>·</span>
                <span>{trade.account.name}</span>
                {trade.brokerSource && (
                  <>
                    <span>·</span>
                    <span>{trade.brokerSource}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* P&L display */}
          {pnl !== null && (
            <div className="text-right">
              <p className={cn(
                "text-4xl font-black num tracking-tight",
                isProfit ? "text-emerald-400" : "text-rose-400"
              )}>
                {isProfit ? "+" : ""}{formatCurrency(pnl, trade.account.currency)}
              </p>
              <div className="flex items-center justify-end gap-2 mt-1">
                {pnlPct !== null && (
                  <span className={cn("text-sm num", isProfit ? "text-emerald-500/70" : "text-rose-500/70")}>
                    {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                  </span>
                )}
                {rr && (
                  <span className="text-xs text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded-full num">
                    R:R 1:{rr}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="relative flex gap-2 mt-5 pt-4 border-t border-zinc-800/50">
          {trade.status === "OPEN" && (
            <Button
              size="sm"
              onClick={() => setCloseOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 gap-1.5"
            >
              <XCircle className="h-3.5 w-3.5" />
              Închide trade
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500"
          >
            <Link href={`/trades/${trade.id}/edit`}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Editează
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="border-zinc-700 text-zinc-500 hover:text-rose-400 hover:border-rose-500/40 ml-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">

        {/* LEFT: Trade Details */}
        <div className="lg:col-span-2 space-y-4">

          {/* Key metrics row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Preț Intrare",
                value: Number(trade.entryPrice).toFixed(5),
                icon: <Activity className="h-3.5 w-3.5" />,
                color: "text-indigo-400",
                bg: "bg-indigo-500/8 border-indigo-500/15",
              },
              {
                label: "Preț Ieșire",
                value: trade.exitPrice ? Number(trade.exitPrice).toFixed(5) : "—",
                icon: <Target className="h-3.5 w-3.5" />,
                color: pnl !== null ? (isProfit ? "text-emerald-400" : "text-rose-400") : "text-zinc-400",
                bg: pnl !== null ? (isProfit ? "bg-emerald-500/8 border-emerald-500/15" : "bg-rose-500/8 border-rose-500/15") : "bg-zinc-800/50 border-zinc-700/50",
              },
              {
                label: "Volum",
                value: `${Number(trade.lotSize).toFixed(2)} lot`,
                icon: <DollarSign className="h-3.5 w-3.5" />,
                color: "text-amber-400",
                bg: "bg-amber-500/8 border-amber-500/15",
              },
              {
                label: "Durată",
                value: formatDuration(trade.durationMinutes),
                icon: <Clock className="h-3.5 w-3.5" />,
                color: "text-violet-400",
                bg: "bg-violet-500/8 border-violet-500/15",
              },
            ].map(({ label, value, icon, color, bg }) => (
              <div key={label} className={cn("rounded-xl border p-3.5", bg)}>
                <div className={cn("flex items-center gap-1.5 mb-1.5", color)}>
                  {icon}
                  <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</span>
                </div>
                <p className={cn("text-base font-bold num", color)}>{value}</p>
              </div>
            ))}
          </div>

          {/* Detailed stats */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-5">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Parametri Complet</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div>
                <StatRow label="Cont" value={trade.account.name} />
                <StatRow label="Instrument" value={trade.instrumentType} />
                <StatRow
                  label="Stop Loss"
                  value={trade.stopLoss ? Number(trade.stopLoss).toFixed(5) : "—"}
                  mono
                  accent="rose"
                />
                <StatRow
                  label="Take Profit"
                  value={trade.takeProfit ? Number(trade.takeProfit).toFixed(5) : "—"}
                  mono
                  accent="emerald"
                />
                <StatRow
                  label="Risc $"
                  value={trade.riskMoney ? formatCurrency(Number(trade.riskMoney), trade.account.currency) : "—"}
                  mono
                />
                <StatRow
                  label="Risc %"
                  value={trade.riskPercent ? `${Number(trade.riskPercent).toFixed(2)}%` : "—"}
                  mono
                />
              </div>
              <div>
                <StatRow
                  label="Comision"
                  value={trade.commission ? formatCurrency(Number(trade.commission), trade.account.currency) : "—"}
                  mono
                />
                <StatRow
                  label="Swap"
                  value={trade.swap ? formatCurrency(Number(trade.swap), trade.account.currency) : "—"}
                  mono
                />
                <StatRow label="Data intrare" value={formatDate(new Date(trade.entryTime))} />
                {trade.exitTime && (
                  <StatRow label="Data ieșire" value={formatDate(new Date(trade.exitTime))} />
                )}
                {trade.brokerSource && (
                  <StatRow label="Broker" value={trade.brokerSource} />
                )}
              </div>
            </div>
          </div>

          {/* Setup & Tags */}
          {(trade.setupType || trade.killzone || trade.tags.length > 0) && (
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-5">
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Setup & Etichete</h2>
              <div className="flex flex-wrap gap-2">
                {trade.setupType && (
                  <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 font-semibold">
                    <Activity className="h-3 w-3" />
                    {SETUP_LABELS[trade.setupType] ?? trade.setupType}
                  </span>
                )}
                {trade.killzone && (
                  <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium">
                    <Clock className="h-3 w-3" />
                    {trade.killzone.replace(/_/g, " ")}
                  </span>
                )}
                {trade.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-zinc-400 font-medium">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Screenshots */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Camera className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-zinc-300">Screenshot-uri</h2>
            </div>
            <ScreenshotGallery tradeId={trade.id} initial={trade.screenshots} />
          </div>
        </div>

        {/* RIGHT: Journal & AI */}
        <div className="space-y-4">

          {/* AI Analysis */}
          <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/30 via-zinc-900/80 to-zinc-900/80 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-violet-300">AI Coach</h2>
                <p className="text-[10px] text-zinc-600">Analiză inteligentă</p>
              </div>
            </div>

            <Button
              size="sm"
              className={cn(
                "w-full gap-2 font-semibold",
                "bg-gradient-to-r from-violet-600 to-indigo-600",
                "hover:from-violet-500 hover:to-indigo-500",
                "shadow-lg shadow-violet-500/20",
                "transition-all duration-300"
              )}
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Se analizează...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analizează cu AI
                </>
              )}
            </Button>

            {aiResult && (
              <div className="mt-4 space-y-3">
                {aiResult.score !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Scor AI</span>
                    <div className="flex items-center gap-2">
                      {[1,2,3,4,5,6,7,8,9,10].map(i => (
                        <div key={i} className={cn(
                          "w-1.5 h-4 rounded-full",
                          i <= (aiResult.score ?? 0)
                            ? aiResult.score! >= 7 ? "bg-emerald-500" : aiResult.score! >= 4 ? "bg-amber-500" : "bg-rose-500"
                            : "bg-zinc-800"
                        )} />
                      ))}
                      <span className={cn(
                        "text-sm font-black num ml-1",
                        (aiResult.score ?? 0) >= 7 ? "text-emerald-400" :
                        (aiResult.score ?? 0) >= 4 ? "text-amber-400" : "text-rose-400"
                      )}>
                        {aiResult.score}/10
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-3 bg-zinc-900/70 rounded-xl border border-zinc-800/50">
                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{aiResult.analysis}</p>
                </div>
              </div>
            )}
          </div>

          {/* Journal */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-zinc-300">Jurnal</h2>
            </div>
            <JournalEntryForm
              key={journalKey}
              tradeId={trade.id}
              existing={trade.journalEntry}
              onSave={() => setJournalKey((k) => k + 1)}
            />
          </div>
        </div>
      </div>

      {/* Close Trade Dialog */}
      <Dialog open={closeOpen} onOpenChange={(v) => !v && setCloseOpen(false)}>
        <DialogContent className="bg-zinc-900/95 border-zinc-800 backdrop-blur-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-100 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-emerald-400" />
              Închide — {trade.symbol}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1.5">Preț ieșire *</label>
                <input
                  type="number"
                  step="0.00001"
                  placeholder={String(Number(trade.entryPrice).toFixed(5))}
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 num transition-colors"
                  value={closeData.exitPrice}
                  onChange={(e) => setCloseData((d) => ({ ...d, exitPrice: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1.5">P&L *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 num transition-colors"
                  value={closeData.pnlMoney}
                  onChange={(e) => setCloseData((d) => ({ ...d, pnlMoney: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1.5">Data / ora ieșire</label>
              <input
                type="datetime-local"
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                value={closeData.exitTime}
                onChange={(e) => setCloseData((d) => ({ ...d, exitTime: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1.5">Comision</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 num transition-colors"
                  value={closeData.commission}
                  onChange={(e) => setCloseData((d) => ({ ...d, commission: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1.5">Swap</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 num transition-colors"
                  value={closeData.swap}
                  onChange={(e) => setCloseData((d) => ({ ...d, swap: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseOpen(false)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Anulează
            </Button>
            <Button
              onClick={handleCloseTrade}
              disabled={isClosing || !closeData.exitPrice || !closeData.pnlMoney}
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
            >
              {isClosing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmă
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={(v) => !v && setDeleteOpen(false)}>
        <DialogContent className="bg-zinc-900/95 border-zinc-800 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-zinc-100 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-400" />
              Șterge trade
            </DialogTitle>
          </DialogHeader>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Ești sigur că vrei să ștergi trade-ul <span className="text-zinc-200 font-semibold">{trade.symbol} {trade.direction}</span>?
            Această acțiune este ireversibilă.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Anulează
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-500 text-white"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Șterge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
