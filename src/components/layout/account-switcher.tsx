"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Check, CreditCard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

interface TradingAccount {
  id: string;
  name: string;
  type: "DEMO" | "CHALLENGE" | "LIVE";
  broker: string | null;
  balance: string | number;
  currency: string;
}

const TYPE_STYLES: Record<string, string> = {
  DEMO: "text-zinc-400 bg-zinc-800 border-zinc-700",
  CHALLENGE: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  LIVE: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

const TYPE_DOT: Record<string, string> = {
  DEMO: "bg-zinc-500",
  CHALLENGE: "bg-amber-400",
  LIVE: "bg-emerald-400",
};

function formatBalance(balance: string | number, currency: string): string {
  const num = typeof balance === "string" ? parseFloat(balance) : balance;
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function AccountSwitcher() {
  const { activeAccountId, setActiveAccountId } = useAuthStore();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const active = accounts.find((a) => a.id === activeAccountId) ?? accounts[0];

  if (loading) {
    return (
      <div className="h-8 w-44 rounded-md bg-zinc-800 animate-pulse" />
    );
  }

  if (!active) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 px-3 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700"
        >
          <span className={cn("w-2 h-2 rounded-full shrink-0", TYPE_DOT[active.type])} />
          <span className="text-xs font-medium max-w-[100px] truncate">{active.name}</span>
          <span className="text-xs text-zinc-500 font-mono">
            {formatBalance(active.balance, active.currency)}
          </span>
          <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="center"
        className="w-64 bg-zinc-900 border-zinc-800 text-zinc-300"
      >
        <DropdownMenuLabel className="text-zinc-500 text-xs font-normal">
          Conturi de trading
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />

        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.id}
            onClick={() => setActiveAccountId(account.id)}
            className="flex items-center gap-3 cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 focus:text-zinc-100 py-2.5"
          >
            <span className={cn("w-2 h-2 rounded-full shrink-0", TYPE_DOT[account.type])} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-zinc-200 truncate">
                  {account.name}
                </span>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] px-1.5 py-0 h-4 shrink-0", TYPE_STYLES[account.type])}
                >
                  {account.type}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-zinc-500 font-mono">
                  {formatBalance(account.balance, account.currency)}
                </span>
                {account.broker && (
                  <span className="text-xs text-zinc-600">· {account.broker}</span>
                )}
              </div>
            </div>
            {account.id === activeAccountId && (
              <Check className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem
          asChild
          className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 focus:text-zinc-100"
        >
          <a href="/settings?tab=accounts" className="flex items-center gap-2 text-zinc-400 text-xs">
            <CreditCard className="w-3.5 h-3.5" />
            Gestionează conturi
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
