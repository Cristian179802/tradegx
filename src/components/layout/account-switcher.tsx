"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown, Check, Plus, Settings2, TrendingUp, TrendingDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";
import { AccountDialog } from "@/components/accounts/account-dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TradingAccount {
  id: string;
  name: string;
  type: "DEMO" | "CHALLENGE" | "LIVE";
  broker: string | null;
  balance: string | number;
  currency: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, {
  dot: string;
  badge: string;
  label: string;
  glow: string;
  pulse: boolean;
}> = {
  DEMO: {
    dot: "bg-zinc-400",
    badge: "text-zinc-300 bg-zinc-800/80 border-zinc-700",
    label: "DEMO",
    glow: "shadow-zinc-500/10",
    pulse: false,
  },
  CHALLENGE: {
    dot: "bg-amber-400",
    badge: "text-amber-300 bg-amber-500/15 border-amber-500/30",
    label: "CHALLENGE",
    glow: "shadow-amber-500/10",
    pulse: false,
  },
  LIVE: {
    dot: "bg-emerald-400",
    badge: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
    label: "LIVE",
    glow: "shadow-emerald-500/20",
    pulse: true,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBalance(balance: string | number, currency: string): string {
  const num = typeof balance === "string" ? parseFloat(balance) : balance;
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

// ─── Trigger pill ─────────────────────────────────────────────────────────────

function AccountPill({ account }: { account: TradingAccount }) {
  const cfg = TYPE_CONFIG[account.type];
  const balance = typeof account.balance === "string"
    ? parseFloat(account.balance)
    : account.balance;

  // Determine if user is up/down relative to round number (cosmetic)
  const isPositive = balance >= 10000;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 h-9 px-3.5 rounded-xl",
        "bg-zinc-900/90 border border-zinc-800",
        "hover:border-zinc-700 hover:bg-zinc-800/80",
        "transition-all duration-200 cursor-pointer",
        "shadow-sm",
        cfg.glow,
      )}
    >
      {/* Type indicator */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className={cn(
            "w-2 h-2 rounded-full",
            cfg.dot,
            cfg.pulse && "animate-pulse",
          )}
        />
        <span
          className={cn(
            "text-[10px] font-bold tracking-wide leading-none",
            account.type === "DEMO"
              ? "text-zinc-400"
              : account.type === "CHALLENGE"
              ? "text-amber-400"
              : "text-emerald-400",
          )}
        >
          {cfg.label}
        </span>
      </div>

      {/* Separator */}
      <span className="w-px h-4 bg-zinc-700/80 shrink-0" />

      {/* Name + balance stacked */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[11px] font-semibold text-zinc-200 leading-none truncate max-w-[110px]">
          {account.name}
        </span>
        <span className="text-[11px] font-mono text-zinc-400 leading-none">
          {formatBalance(account.balance, account.currency)}
        </span>
      </div>

      {/* Trend icon */}
      {isPositive ? (
        <TrendingUp className="w-3.5 h-3.5 text-emerald-500/70 shrink-0" />
      ) : (
        <TrendingDown className="w-3.5 h-3.5 text-rose-500/70 shrink-0" />
      )}

      <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0 -ml-1" />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AccountSwitcher() {
  const { activeAccountId, setActiveAccountId } = useAuthStore();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<TradingAccount | null>(null);

  const loadAccounts = useCallback(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data: TradingAccount[]) => {
        if (Array.isArray(data)) {
          setAccounts(data);
          if (data.length > 0 && !activeAccountId) {
            setActiveAccountId(data[0].id);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const active = accounts.find((a) => a.id === activeAccountId) ?? accounts[0];

  if (loading) {
    return <div className="h-9 w-52 rounded-xl bg-zinc-800/60 animate-pulse" />;
  }

  if (!active) {
    return (
      <>
        <button
          onClick={() => { setEditAccount(null); setDialogOpen(true); }}
          className="flex items-center gap-2 h-9 px-4 rounded-xl border border-dashed border-zinc-700 hover:border-zinc-500 text-zinc-500 hover:text-zinc-300 text-xs transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Adaugă cont
        </button>

        <AccountDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSuccess={() => { loadAccounts(); setDialogOpen(false); }}
          account={null}
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="outline-none focus:outline-none">
            <AccountPill account={active} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="center"
          sideOffset={6}
          className="w-72 bg-zinc-900/95 border-zinc-800 text-zinc-300 backdrop-blur-sm p-1.5"
        >
          <DropdownMenuLabel className="text-zinc-500 text-[10px] font-semibold uppercase tracking-widest px-2 pt-1 pb-2">
            Conturile tale
          </DropdownMenuLabel>

          {accounts.map((account) => {
            const cfg = TYPE_CONFIG[account.type];
            return (
              <DropdownMenuItem
                key={account.id}
                onClick={() => setActiveAccountId(account.id)}
                className={cn(
                  "flex items-center gap-3 cursor-pointer rounded-lg px-2 py-2.5",
                  "hover:bg-zinc-800 focus:bg-zinc-800 focus:text-zinc-100",
                  account.id === activeAccountId && "bg-zinc-800/60",
                )}
              >
                {/* Dot */}
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    cfg.dot,
                    cfg.pulse && account.id === activeAccountId && "animate-pulse",
                  )}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-zinc-100 truncate">
                      {account.name}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn("text-[9px] px-1 py-0 h-3.5 shrink-0 leading-none", cfg.badge)}
                    >
                      {cfg.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-zinc-400 font-mono">
                      {formatBalance(account.balance, account.currency)}
                    </span>
                    {account.broker && (
                      <span className="text-xs text-zinc-600 truncate">· {account.broker}</span>
                    )}
                  </div>
                </div>

                {/* Checkmark */}
                {account.id === activeAccountId && (
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                )}
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator className="bg-zinc-800 my-1.5" />

          {/* Add new account */}
          <DropdownMenuItem
            onClick={() => { setEditAccount(null); setDialogOpen(true); }}
            className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-2 hover:bg-zinc-800 focus:bg-zinc-800 text-zinc-400 hover:text-zinc-200 focus:text-zinc-200"
          >
            <div className="w-6 h-6 rounded-md bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200">Adaugă cont nou</p>
              <p className="text-[10px] text-zinc-500">MT4/MT5, cTrader sau manual</p>
            </div>
          </DropdownMenuItem>

          {/* Manage accounts */}
          <DropdownMenuItem
            onClick={() => {
              const acc = accounts.find((a) => a.id === activeAccountId) ?? accounts[0];
              if (acc) { setEditAccount(acc); setDialogOpen(true); }
            }}
            className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-2 hover:bg-zinc-800 focus:bg-zinc-800 text-zinc-400 hover:text-zinc-200 focus:text-zinc-200"
          >
            <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
              <Settings2 className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-300">Gestionează conturi</p>
              <p className="text-[10px] text-zinc-500">Editează sau configurează contul activ</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* AccountDialog — shared for add + edit */}
      <AccountDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditAccount(null); }}
        onSuccess={() => { loadAccounts(); setDialogOpen(false); setEditAccount(null); }}
        account={editAccount as any}
      />
    </>
  );
}
