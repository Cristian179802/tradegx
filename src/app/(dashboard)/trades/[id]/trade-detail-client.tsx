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
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Clock,
  Tag,
  Trash2,
  Pencil,
  XCircle,
  BookOpen,
  Camera,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

export function TradeDetailClient({ trade }: { trade: Trade }) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [journalKey, setJournalKey] = React.useState(0);
  const [closeOpen, setCloseOpen] = React.useState(false);
  const [closeData, setCloseData] = React.useState({ exitPrice: "", exitTime: new Date().toISOString().slice(0, 16), pnlMoney: "", commission: "0", swap: "0" });
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
  const rr =
    trade.riskMoney && pnl
      ? Math.abs(pnl / Number(trade.riskMoney)).toFixed(2)
      : null;

  async function handleCloseTrade() {
    setIsClosing(true);
    const payload = {
      exitPrice: parseFloat(closeData.exitPrice),
      exitTime: new Date(closeData.exitTime).toISOString(),
      pnlMoney: parseFloat(closeData.pnlMoney),
      commission: parseFloat(closeData.commission) || 0,
      swap: parseFloat(closeData.swap) || 0,
      status: "CLOSED",
    };
    const res = await fetch(`/api/trades/${trade.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-zinc-400 hover:text-zinc-100"
          >
            <Link href="/trades">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Înapoi
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm font-bold px-2 py-0.5 rounded",
                trade.direction === "BUY"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/20 text-rose-400"
              )}
            >
              {trade.direction === "BUY" ? "▲ BUY" : "▼ SELL"}
            </span>
            <h1 className="text-2xl font-bold text-zinc-100">{trade.symbol}</h1>
            {trade.timeframe && (
              <span className="text-sm text-zinc-500">{trade.timeframe}</span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {trade.status === "OPEN" && (
            <Button
              size="sm"
              onClick={() => setCloseOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              Închide trade
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-zinc-700 text-zinc-400 hover:text-zinc-100"
          >
            <Link href={`/trades/${trade.id}/edit`}>
              <Pencil className="h-4 w-4 mr-1.5" />
              Editează
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="border-zinc-700 text-zinc-400 hover:text-rose-400 hover:border-rose-500/50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main stats */}
        <div className="lg:col-span-2 space-y-4">
          {/* P&L card */}
          {pnl !== null && (
            <div
              className={cn(
                "rounded-lg border p-5",
                isProfit
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-rose-500/30 bg-rose-500/5"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                {isProfit ? (
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-rose-400" />
                )}
                <span className="text-sm text-zinc-400">P&L</span>
              </div>
              <div className="flex items-end gap-3">
                <span
                  className={cn(
                    "text-3xl font-bold num",
                    isProfit ? "text-emerald-400" : "text-rose-400"
                  )}
                >
                  {isProfit ? "+" : ""}
                  {formatCurrency(pnl, trade.account.currency)}
                </span>
                {pnlPct !== null && (
                  <span
                    className={cn(
                      "text-lg font-medium num",
                      isProfit ? "text-emerald-500/70" : "text-rose-500/70"
                    )}
                  >
                    ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%)
                  </span>
                )}
              </div>
              {rr && (
                <p className="text-xs text-zinc-500 mt-1">
                  R:R = 1:{rr}
                </p>
              )}
            </div>
          )}

          {/* Trade details grid */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-sm font-medium text-zinc-400 mb-4">Detalii trade</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                { label: "Cont", value: trade.account.name },
                { label: "Instrument", value: trade.instrumentType },
                {
                  label: "Status",
                  value:
                    trade.status === "CLOSED"
                      ? "Închis"
                      : trade.status === "OPEN"
                      ? "Deschis"
                      : "Anulat",
                },
                {
                  label: "Preț intrare",
                  value: Number(trade.entryPrice).toFixed(5),
                  mono: true,
                },
                {
                  label: "Preț ieșire",
                  value: trade.exitPrice
                    ? Number(trade.exitPrice).toFixed(5)
                    : "—",
                  mono: true,
                },
                {
                  label: "Volum",
                  value: `${Number(trade.lotSize).toFixed(2)} lot`,
                  mono: true,
                },
                {
                  label: "Stop Loss",
                  value: trade.stopLoss ? Number(trade.stopLoss).toFixed(5) : "—",
                  mono: true,
                },
                {
                  label: "Take Profit",
                  value: trade.takeProfit
                    ? Number(trade.takeProfit).toFixed(5)
                    : "—",
                  mono: true,
                },
                {
                  label: "Durată",
                  value: formatDuration(trade.durationMinutes),
                },
                {
                  label: "Comision",
                  value: trade.commission
                    ? formatCurrency(Number(trade.commission), trade.account.currency)
                    : "—",
                  mono: true,
                },
                {
                  label: "Swap",
                  value: trade.swap
                    ? formatCurrency(Number(trade.swap), trade.account.currency)
                    : "—",
                  mono: true,
                },
                {
                  label: "Risc",
                  value: trade.riskMoney
                    ? `${formatCurrency(Number(trade.riskMoney), trade.account.currency)} (${Number(trade.riskPercent ?? 0).toFixed(2)}%)`
                    : "—",
                  mono: true,
                },
              ].map(({ label, value, mono }) => (
                <div key={label}>
                  <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
                  <p className={cn("text-sm text-zinc-200", mono && "num")}>{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-zinc-500 mb-0.5">Data intrare</p>
                <p className="text-sm text-zinc-200">
                  {formatDate(new Date(trade.entryTime))}
                </p>
              </div>
              {trade.exitTime && (
                <div>
                  <p className="text-xs text-zinc-500 mb-0.5">Data ieșire</p>
                  <p className="text-sm text-zinc-200">
                    {formatDate(new Date(trade.exitTime))}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Setup & tags */}
          {(trade.setupType || trade.killzone || trade.tags.length > 0) && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="text-sm font-medium text-zinc-400 mb-3">Setup</h2>
              <div className="flex flex-wrap gap-2">
                {trade.setupType && (
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                    {SETUP_LABELS[trade.setupType] ?? trade.setupType}
                  </Badge>
                )}
                {trade.killzone && (
                  <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                    <Clock className="h-3 w-3 mr-1" />
                    {trade.killzone.replace(/_/g, " ")}
                  </Badge>
                )}
                {trade.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-zinc-700 text-zinc-500"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Journal + Screenshots sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
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

            <Button
              size="sm"
              className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {analyzing ? "Se analizează..." : "Analizează cu AI"}
            </Button>

            {aiResult && (
              <div className="mt-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="text-xs font-semibold text-indigo-300">AI Coach</span>
                  </div>
                  {aiResult.score !== null && (
                    <span className="text-xs font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full">
                      {aiResult.score}/10
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{aiResult.analysis}</p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Camera className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-zinc-300">Screenshot-uri</h2>
            </div>
            <ScreenshotGallery
              tradeId={trade.id}
              initial={trade.screenshots}
            />
          </div>
        </div>
      </div>

      {/* Close trade dialog */}
      <Dialog open={closeOpen} onOpenChange={(v) => !v && setCloseOpen(false)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Închide trade — {trade.symbol}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Preț ieșire *</label>
                <input
                  type="number"
                  step="0.00001"
                  placeholder={String(Number(trade.entryPrice).toFixed(5))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 num"
                  value={closeData.exitPrice}
                  onChange={(e) => setCloseData((d) => ({ ...d, exitPrice: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">P&L *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 num"
                  value={closeData.pnlMoney}
                  onChange={(e) => setCloseData((d) => ({ ...d, pnlMoney: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Data / ora ieșire</label>
              <input
                type="datetime-local"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                value={closeData.exitTime}
                onChange={(e) => setCloseData((d) => ({ ...d, exitTime: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Comision</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 num"
                  value={closeData.commission}
                  onChange={(e) => setCloseData((d) => ({ ...d, commission: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Swap</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 num"
                  value={closeData.swap}
                  onChange={(e) => setCloseData((d) => ({ ...d, swap: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseOpen(false)} className="border-zinc-700 text-zinc-300">
              Anulează
            </Button>
            <Button
              onClick={handleCloseTrade}
              disabled={isClosing || !closeData.exitPrice || !closeData.pnlMoney}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isClosing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmă închiderea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={(v) => !v && setDeleteOpen(false)}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Șterge trade</DialogTitle>
          </DialogHeader>
          <p className="text-zinc-400 text-sm">
            Ești sigur că vrei să ștergi trade-ul {trade.symbol} {trade.direction}? Această acțiune
            este ireversibilă.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="border-zinc-700 text-zinc-300"
            >
              Anulează
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? "Se șterge..." : "Șterge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
