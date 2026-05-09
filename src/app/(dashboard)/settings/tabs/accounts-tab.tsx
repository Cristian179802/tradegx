"use client";

import * as React from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { AccountDialog } from "@/components/accounts/account-dialog";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Plus, Pencil, ExternalLink } from "lucide-react";

interface Account {
  id: string;
  name: string;
  type: string;
  broker: string | null;
  currency: string;
  balance: string | number;
  initialBalance: string | number;
  leverage: number;
  maxDailyLossPct: string | number | null;
  maxDrawdownPct: string | number | null;
  _count: { trades: number };
}

const TYPE_COLORS: Record<string, string> = {
  DEMO: "bg-zinc-700/50 text-zinc-400 border-zinc-600",
  CHALLENGE: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  LIVE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};
const TYPE_LABELS: Record<string, string> = { DEMO: "Demo", CHALLENGE: "Challenge", LIVE: "Live" };

export function AccountsTab() {
  const { toast } = useToast();
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<Account | null>(null);

  React.useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then(setAccounts)
      .finally(() => setLoading(false));
  }, []);

  async function refresh() {
    const res = await fetch("/api/accounts");
    if (res.ok) setAccounts(await res.json());
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-zinc-800 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-zinc-200">Conturi de trading</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Sau gestionează din{" "}
            <Link href="/accounts" className="text-indigo-400 hover:text-indigo-300">
              pagina Conturi
            </Link>
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => { setEditingAccount(null); setDialogOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Adaugă
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-8 rounded-lg border border-dashed border-zinc-800">
          <p className="text-sm text-zinc-500 mb-3">Niciun cont adăugat</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialogOpen(true)}
            className="border-zinc-700 text-zinc-400"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Adaugă primul cont
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => {
            const balance = Number(account.balance);
            const pnl = balance - Number(account.initialBalance);
            return (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-200">{account.name}</span>
                    <span className={cn("text-xs px-1.5 py-0.5 rounded border", TYPE_COLORS[account.type])}>
                      {TYPE_LABELS[account.type]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs">
                    <span className="text-zinc-400 num">{formatCurrency(balance, account.currency)}</span>
                    <span className={cn("num", pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {pnl >= 0 ? "+" : ""}{formatCurrency(pnl, account.currency)}
                    </span>
                    <span className="text-zinc-600">{account._count.trades} trades</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditingAccount(account); setDialogOpen(true); }}
                    className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <Link href="/accounts" className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AccountDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSuccess={refresh} account={editingAccount} />
    </div>
  );
}
