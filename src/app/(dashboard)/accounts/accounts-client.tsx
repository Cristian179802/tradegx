"use client";

import * as React from "react";
import { AccountDialog } from "@/components/accounts/account-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  _count: { trades: number };
  tradePnl?: string | number; // pre-computed from actual trade sums
}

const TYPE_COLORS: Record<string, string> = {
  DEMO: "bg-zinc-700/50 text-zinc-400 border-zinc-600",
  CHALLENGE: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  LIVE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const TYPE_LABELS: Record<string, string> = {
  DEMO: "Demo",
  CHALLENGE: "Challenge",
  LIVE: "Live",
};

export function AccountsClient({ initialAccounts }: { initialAccounts: Account[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [accounts, setAccounts] = React.useState(initialAccounts);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<Account | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  async function refresh() {
    const res = await fetch("/api/accounts");
    if (res.ok) setAccounts(await res.json());
    router.refresh();
  }

  async function handleDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    const res = await fetch(`/api/accounts/${deletingId}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Cont șters" });
      setAccounts((prev) => prev.filter((a) => a.id !== deletingId));
      router.refresh();
    } else {
      toast({ title: "Eroare", description: "Nu s-a putut șterge contul", variant: "destructive" });
    }
    setIsDeleting(false);
    setDeletingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Conturi de trading</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Gestionează conturile tale DEMO, Challenge și Live
          </p>
        </div>
        <Button
          onClick={() => { setEditingAccount(null); setDialogOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adaugă cont
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-16 rounded-lg border border-dashed border-zinc-800">
          <BarChart3 className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-zinc-400 font-medium mb-1">Niciun cont adăugat</h3>
          <p className="text-zinc-600 text-sm mb-4">Adaugă primul tău cont de trading</p>
          <Button
            onClick={() => { setEditingAccount(null); setDialogOpen(true); }}
            variant="outline"
            className="border-zinc-700 text-zinc-400"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adaugă cont
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const balance = Number(account.balance);
            const initial = Number(account.initialBalance);
            // Use pre-computed trade P&L if available (more accurate for imported trades),
            // fall back to balance delta
            const pnl = account.tradePnl !== undefined
              ? Number(account.tradePnl)
              : balance - initial;
            const pnlPct = initial > 0 ? (pnl / initial) * 100 : 0;
            const isProfit = pnl >= 0;

            return (
              <div
                key={account.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-100">{account.name}</h3>
                    {account.broker && (
                      <p className="text-xs text-zinc-500 mt-0.5">{account.broker}</p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded border",
                      TYPE_COLORS[account.type]
                    )}
                  >
                    {TYPE_LABELS[account.type]}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">Balanță</p>
                    <p className="text-lg font-bold text-zinc-100 num">
                      {formatCurrency(balance, account.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">P&L total</p>
                    <div className="flex items-center gap-1">
                      {isProfit ? (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
                      )}
                      <p
                        className={cn(
                          "text-base font-semibold num",
                          isProfit ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        {isProfit ? "+" : ""}
                        {formatCurrency(pnl, account.currency)}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "text-xs num",
                        isProfit ? "text-emerald-500/70" : "text-rose-500/70"
                      )}
                    >
                      {isProfit ? "+" : ""}
                      {pnlPct.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-600 pt-2 border-t border-zinc-800">
                  <div className="flex gap-3">
                    <span>{account._count.trades} trade-uri</span>
                    {account.leverage && <span>1:{account.leverage}</span>}
                    {account.maxDrawdownPct && (
                      <span>Max DD: {Number(account.maxDrawdownPct)}%</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingAccount(account); setDialogOpen(true); }}
                      className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(account.id)}
                      className="p-1.5 rounded hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Șterge cont</DialogTitle>
          </DialogHeader>
          <p className="text-zinc-400 text-sm">
            Ești sigur că vrei să ștergi acest cont? Toate trade-urile asociate vor fi șterse
            permanent.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingId(null)}
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
