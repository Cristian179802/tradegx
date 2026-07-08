"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TradesTable } from "@/components/trades/trades-table";
import { ImportDialog } from "@/components/trades/import-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Upload, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Account {
  id: string;
  name: string;
}

interface TradesClientProps {
  accounts: Account[];
}

export function TradesClient({ accounts }: TradesClientProps) {
  const t = useTranslations("tradesPage");
  const router = useRouter();
  const [trades, setTrades] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [importOpen, setImportOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);

  // Filters
  const [accountId, setAccountId] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [symbol, setSymbol] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");

  const fetchTrades = React.useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (accountId !== "all") params.set("accountId", accountId);
    if (status !== "all") params.set("status", status);
    if (symbol) params.set("symbol", symbol);

    const res = await fetch(`/api/trades?${params}`);
    if (res.ok) {
      const data = await res.json();
      setTrades(data.trades);
      setTotalPages(data.pagination.pages);
      setTotal(data.pagination.total);
    }
    setLoading(false);
  }, [page, accountId, status, symbol]);

  React.useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSymbol(searchInput);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight neon-violet">{t("title")}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {total > 0 ? (
              <span>{t("count", { count: total })}</span>
            ) : t("none")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
            className="border-indigo-500/30 text-indigo-300 hover:text-white hover:border-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all"
          >
            <Upload className="h-4 w-4 mr-2" />
            {t("importCsv")}
          </Button>
          <Button asChild className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all">
            <Link href="/trades/new">
              <Plus className="h-4 w-4 mr-2" />
              {t("newTrade")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder={t("searchPlaceholder")}
              className="bg-zinc-900/80 border-zinc-800/80 text-zinc-100 pl-9 w-40 focus:border-indigo-500/50"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
            />
          </div>
        </form>

        <Select
          value={accountId}
          onValueChange={(v) => { setAccountId(v); setPage(1); }}
        >
          <SelectTrigger className="bg-zinc-900/80 border-zinc-800/80 text-zinc-300 w-44">
            <SelectValue placeholder={t("allAccounts")} />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all" className="text-zinc-100">{t("allAccounts")}</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id} className="text-zinc-100">
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(v) => { setStatus(v); setPage(1); }}
        >
          <SelectTrigger className="bg-zinc-900/80 border-zinc-800/80 text-zinc-300 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all" className="text-zinc-100">{t("fAll")}</SelectItem>
            <SelectItem value="CLOSED" className="text-zinc-100">{t("fClosed")}</SelectItem>
            <SelectItem value="OPEN" className="text-zinc-100">{t("fOpen")}</SelectItem>
            <SelectItem value="CANCELLED" className="text-zinc-100">{t("fCancelled")}</SelectItem>
          </SelectContent>
        </Select>

        {symbol && (
          <button
            onClick={() => { setSymbol(""); setSearchInput(""); setPage(1); }}
            className="text-xs px-3 py-1.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors"
          >
            {symbol} ✕
          </button>
        )}
      </div>

      <TradesTable trades={trades} loading={loading} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-500">
          <span>Pagina {page} din {totalPages}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-zinc-700 text-zinc-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="border-zinc-700 text-zinc-400"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => { fetchTrades(); setImportOpen(false); }}
        accounts={accounts}
        defaultAccountId={accountId !== "all" ? accountId : undefined}
      />
    </div>
  );
}
