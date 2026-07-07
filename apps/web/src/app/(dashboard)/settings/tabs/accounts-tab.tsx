"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { AccountDialog } from "@/components/accounts/account-dialog";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Plus, Pencil, ExternalLink, Link2, CheckCircle2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

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

// ─── MetaAPI Connect Section ──────────────────────────────────────────────────

function MetaApiConnect() {
  const t = useTranslations("settings.accounts");
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [login, setLogin] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [server, setServer] = React.useState("");
  const [platform, setPlatform] = React.useState<"mt4" | "mt5">("mt4");
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [connected, setConnected] = React.useState<{ tradingAccountId: string; metaApiAccountId: string; imported: number } | null>(null);
  const [syncing, setSyncing] = React.useState(false);

  async function handleConnect() {
    if (!login || !password || !server) {
      toast({ title: t("missingFieldsTitle"), description: t("missingFieldsDesc"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/metaapi/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password, server, platform, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("connectErrFallback"));
      setConnected({ tradingAccountId: data.tradingAccountId, metaApiAccountId: data.metaApiAccountId, imported: data.imported ?? 0 });
      toast({ title: t("connectedTitle"), description: data.message ?? t("tradesImported", { n: data.imported ?? 0 }) });
    } catch (err: any) {
      toast({ title: t("metaApiErrTitle"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    if (!connected) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/integrations/metaapi/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login,
          password,
          server,
          platform,
          tradingAccountId: connected.tradingAccountId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("syncErrFallback"));
      toast({ title: t("syncDoneTitle"), description: data.message ?? t("tradesImported", { n: data.imported ?? 0 }) });
    } catch (err: any) {
      toast({ title: t("syncErrTitle"), description: err.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
            <Link2 className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-zinc-200">{t("connectHeader")}</p>
            <p className="text-xs text-zinc-500">{t("connectSub")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {connected && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          {open ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-zinc-800/60 pt-4 space-y-3">
          {!connected ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide block mb-1">{t("loginLabel")}</label>
                  <input
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder="12345678"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide block mb-1">{t("passwordLabel")}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide block mb-1">{t("serverLabel")}</label>
                <input
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  placeholder="ICMarketsSC-Live"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide block mb-1">{t("platformLabel")}</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as "mt4" | "mt5")}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/60 transition-colors"
                  >
                    <option value="mt4">MetaTrader 4</option>
                    <option value="mt5">MetaTrader 5</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide block mb-1">{t("nameLabel")}</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Live IC Markets"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
                  />
                </div>
              </div>
              <Button
                onClick={handleConnect}
                disabled={loading}
                size="sm"
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20"
              >
                {loading ? (
                  <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> {t("connecting")}</>
                ) : (
                  <><Link2 className="h-3.5 w-3.5 mr-1.5" /> {t("connect")}</>
                )}
              </Button>
              <p className="text-[10px] text-zinc-600 text-center">
                {t("privacyNote")}
              </p>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-300">{t("connectedOk")}</p>
                  <p className="text-[10px] text-zinc-500">{t("connectedStats", { n: connected.imported, id: connected.metaApiAccountId.slice(0, 8) })}</p>
                </div>
              </div>
              <Button
                onClick={handleSync}
                disabled={syncing}
                size="sm"
                variant="outline"
                className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                {syncing ? (
                  <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> {t("syncing")}</>
                ) : (
                  <><RefreshCw className="h-3.5 w-3.5 mr-1.5" /> {t("syncTrades")}</>
                )}
              </Button>
              <button
                onClick={() => setConnected(null)}
                className="w-full text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {t("connectAnother")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function AccountsTab() {
  const t = useTranslations("settings.accounts");
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
          <h3 className="text-sm font-medium text-zinc-200">{t("title")}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {t.rich("manageFrom", {
              link: (c) => <Link href="/accounts" className="text-indigo-400 hover:text-indigo-300">{c}</Link>,
            })}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => { setEditingAccount(null); setDialogOpen(true); }}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          {t("add")}
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-8 rounded-lg border border-dashed border-zinc-800">
          <p className="text-sm text-zinc-500 mb-3">{t("noAccounts")}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialogOpen(true)}
            className="border-zinc-700 text-zinc-400"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {t("addFirst")}
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
                    <span className="text-zinc-600">{t("tradesCount", { n: account._count.trades })}</span>
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

      {/* MetaAPI Connect */}
      <MetaApiConnect />
    </div>
  );
}
