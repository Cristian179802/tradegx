"use client";

import * as React from "react";
import { AccountDialog } from "@/components/accounts/account-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Plus, Pencil, Trash2, TrendingUp, TrendingDown, BarChart3,
  RefreshCw, Wifi, WifiOff, ArrowUpRight, ArrowDownRight,
  Activity, Shield, Zap,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface Account {
  id: string;
  name: string;
  type: string;
  broker: string | null;
  accountNumber: string | null;
  currency: string;
  balance: string | number;
  initialBalance: string | number;
  leverage: number;
  maxDailyLossPct: string | number | null;
  maxDrawdownPct: string | number | null;
  metaApiId?: string | null;
  lastSyncedAt?: string | null;
  _count: { trades: number };
  tradePnl?: string | number;
}

const TYPE_CFG: Record<string, { label: string; color: string; border: string; bg: string; dot: string }> = {
  DEMO:      { label: "Demo",      color: "text-zinc-400",   border: "border-zinc-600/60",     bg: "bg-zinc-700/30",        dot: "bg-zinc-500" },
  CHALLENGE: { label: "Challenge", color: "text-amber-400",  border: "border-amber-500/30",    bg: "bg-amber-500/10",       dot: "bg-amber-400" },
  LIVE:      { label: "Live",      color: "text-emerald-400",border: "border-emerald-500/30",  bg: "bg-emerald-500/10",     dot: "bg-emerald-400" },
};

const CARD_BORDER: Record<string, string> = {
  DEMO:      "border-zinc-800 hover:border-zinc-700",
  CHALLENGE: "border-amber-500/20 hover:border-amber-500/50",
  LIVE:      "border-emerald-500/20 hover:border-emerald-500/50",
};

const CARD_GLOW: Record<string, string> = {
  DEMO:      "hover:shadow-zinc-700/20 hover:shadow-lg",
  CHALLENGE: "hover:shadow-amber-500/20 hover:shadow-xl",
  LIVE:      "hover:shadow-emerald-500/20 hover:shadow-xl",
};

export function AccountsClient({ initialAccounts }: { initialAccounts: Account[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [accounts, setAccounts] = React.useState(initialAccounts);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<Account | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [syncingId, setSyncingId] = React.useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/accounts");
    if (res.ok) setAccounts(await res.json());
    router.refresh();
  }

  // Auto-refresh every 15s to pick up new accounts synced by EA
  React.useEffect(() => {
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, []);

  async function handleDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    const res = await fetch(`/api/accounts/${deletingId}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Cont șters" });
      setAccounts(prev => prev.filter(a => a.id !== deletingId));
      router.refresh();
    } else {
      toast({ title: "Eroare", description: "Nu s-a putut șterge contul", variant: "destructive" });
    }
    setIsDeleting(false);
    setDeletingId(null);
  }

  async function handleSync(account: Account) {
    if (!account.metaApiId) return;
    setSyncingId(account.id);
    try {
      const res = await fetch("/api/integrations/metaapi/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradingAccountId: account.id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: `✅ Sincronizat!`, description: `${data.imported ?? 0} tranzacții noi importate.` });
        refresh();
      } else {
        toast({ title: "Eroare sincronizare", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Eroare de rețea", variant: "destructive" });
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight neon-indigo">Conturi de trading</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {accounts.length > 0
              ? `${accounts.length} cont${accounts.length !== 1 ? "uri" : ""} conectat${accounts.length !== 1 ? "e" : ""}`
              : "Gestionează conturile tale DEMO, Challenge și Live"}
          </p>
        </div>
        <Button
          onClick={() => { setEditingAccount(null); setDialogOpen(true); }}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adaugă cont
        </Button>
      </div>

      {/* Empty state */}
      {accounts.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-7 w-7 text-zinc-600" />
          </div>
          <h3 className="text-zinc-300 font-semibold mb-1">Niciun cont adăugat</h3>
          <p className="text-zinc-600 text-sm mb-6 max-w-xs mx-auto">
            Conectează direct contul MT4/MT5 sau importă un fișier CSV pentru a începe.
          </p>
          <Button
            onClick={() => { setEditingAccount(null); setDialogOpen(true); }}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adaugă primul cont
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const balance = Number(account.balance);
            const initial = Number(account.initialBalance);
            const pnl = account.tradePnl !== undefined ? Number(account.tradePnl) : balance - initial;
            const pnlPct = initial > 0 ? (pnl / initial) * 100 : 0;
            const isProfit = pnl >= 0;
            const cfg = TYPE_CFG[account.type] ?? TYPE_CFG.DEMO;
            const isSyncing = syncingId === account.id;
            const hasMetaApi = !!account.metaApiId;

            return (
              <div
                key={account.id}
                className={cn(
                  "relative rounded-2xl border bg-zinc-900/80 p-5 space-y-4 transition-all duration-300 overflow-hidden group card-3d",
                  CARD_BORDER[account.type],
                  CARD_GLOW[account.type]
                )}
              >
                {/* Top glow for LIVE accounts */}
                {account.type === "LIVE" && (
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/12 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                )}
                {account.type === "CHALLENGE" && (
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/12 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                )}

                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
                      <h3 className="font-bold text-zinc-100 truncate text-[15px]">{account.name}</h3>
                    </div>
                    <p className="text-[11px] text-zinc-600 pl-3.5">
                      {account.broker && `${account.broker}`}
                      {account.accountNumber && ` · #${account.accountNumber}`}
                      {account.leverage ? ` · 1:${account.leverage}` : ""}
                    </p>
                  </div>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ml-2", cfg.color, cfg.border, cfg.bg)}>
                    {cfg.label}
                  </span>
                </div>

                {/* Balance + P&L */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-800/40 rounded-xl p-3">
                    <p className="text-[10px] text-zinc-600 mb-1 uppercase tracking-wider">Balanță</p>
                    <p className="text-base font-black text-zinc-100 num truncate">
                      {formatCurrency(balance, account.currency)}
                    </p>
                  </div>
                  <div className={cn("rounded-xl p-3", isProfit ? "bg-emerald-500/6" : "bg-rose-500/6")}>
                    <p className="text-[10px] text-zinc-600 mb-1 uppercase tracking-wider">P&L Total</p>
                    <div className="flex items-center gap-1">
                      {isProfit
                        ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        : <ArrowDownRight className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                      <p className={cn("text-base font-black num truncate", isProfit ? "text-emerald-400 neon-emerald" : "text-rose-400 neon-rose")}>
                        {isProfit ? "+" : ""}{formatCurrency(pnl, account.currency)}
                      </p>
                    </div>
                    <p className={cn("text-[10px] num", isProfit ? "text-emerald-500/60" : "text-rose-500/60")}>
                      {isProfit ? "+" : ""}{pnlPct.toFixed(2)}%
                    </p>
                  </div>
                </div>

                {/* Prop firm rules if challenge */}
                {account.type === "CHALLENGE" && (account.maxDailyLossPct || account.maxDrawdownPct) && (
                  <div className="flex gap-2 text-[10px]">
                    {account.maxDailyLossPct && (
                      <div className="flex items-center gap-1 bg-amber-500/8 border border-amber-500/15 rounded-lg px-2 py-1">
                        <Shield className="w-2.5 h-2.5 text-amber-400" />
                        <span className="text-amber-400">DD zilnic: {Number(account.maxDailyLossPct)}%</span>
                      </div>
                    )}
                    {account.maxDrawdownPct && (
                      <div className="flex items-center gap-1 bg-amber-500/8 border border-amber-500/15 rounded-lg px-2 py-1">
                        <Activity className="w-2.5 h-2.5 text-amber-400" />
                        <span className="text-amber-400">Max DD: {Number(account.maxDrawdownPct)}%</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-600">{account._count.trades} trades</span>
                    {hasMetaApi && (
                      <div className="flex items-center gap-1">
                        <Wifi className="w-2.5 h-2.5 text-indigo-400" />
                        <span className="text-[10px] text-indigo-500">Live sync</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {hasMetaApi && (
                      <button
                        onClick={() => handleSync(account)}
                        disabled={isSyncing}
                        className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-zinc-600 hover:text-indigo-400 transition-colors"
                        title="Sincronizează tranzacții"
                      >
                        <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
                      </button>
                    )}
                    <button
                      onClick={() => { setEditingAccount(account); setDialogOpen(true); }}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(account.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-zinc-600 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add account card */}
          <button
            onClick={() => { setEditingAccount(null); setDialogOpen(true); }}
            className="rounded-2xl border-2 border-dashed border-zinc-800 bg-transparent hover:border-indigo-500/50 hover:bg-indigo-500/5 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 p-5 flex flex-col items-center justify-center gap-3 min-h-[200px] group"
          >
            <div className="w-12 h-12 rounded-2xl border border-zinc-800 group-hover:border-indigo-500/30 bg-zinc-900 group-hover:bg-indigo-500/10 flex items-center justify-center transition-all">
              <Plus className="w-5 h-5 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-500 group-hover:text-zinc-300 transition-colors">
                Adaugă cont
              </p>
              <p className="text-[11px] text-zinc-700 mt-0.5">MT4 / MT5 / CSV / Manual</p>
            </div>
          </button>
        </div>
      )}

      <AccountDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={refresh}
        account={editingAccount}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Șterge cont</DialogTitle>
          </DialogHeader>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Ești sigur că vrei să ștergi acest cont? Toate tranzacțiile asociate vor fi șterse
            permanent și nu pot fi recuperate.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)} className="border-zinc-700 text-zinc-300">
              Anulează
            </Button>
            <Button onClick={handleDelete} disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-500 text-white">
              {isDeleting ? "Se șterge..." : "Șterge definitiv"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
