"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { useRouter } from "next/navigation";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

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
  pnlMoney: string | number | null;
  pnlPercent: string | number | null;
  status: "OPEN" | "CLOSED" | "CANCELLED";
  setupType: string | null;
  timeframe: string | null;
  account: { name: string; currency: string };
}

interface TradesTableProps {
  trades: Trade[];
  loading?: boolean;
}

const statusColors: Record<string, string> = {
  OPEN: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  CLOSED: "bg-zinc-700/50 text-zinc-400 border-zinc-600/30",
  CANCELLED: "bg-zinc-800/50 text-zinc-500 border-zinc-700/30",
};

// chei în messages → tradesPage.* (traduse la randare)
const statusLabels: Record<string, string> = {
  OPEN: "stOpen",
  CLOSED: "stClosed",
  CANCELLED: "stCancelled",
};

export function TradesTable({ trades, loading }: TradesTableProps) {
  const t = useTranslations("tradesPage");
  const router = useRouter();

  const columns: Column<Trade>[] = [
    {
      key: "symbol",
      header: t("hSymbol"),
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-lg border",
            row.direction === "BUY"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
              : "bg-rose-500/10 text-rose-400 border-rose-500/25"
          )}>
            {row.direction}
          </span>
          <span className="font-bold text-zinc-100">{row.symbol}</span>
          {row.timeframe && (
            <span className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">{row.timeframe}</span>
          )}
        </div>
      ),
    },
    {
      key: "entryTime",
      header: t("hDate"),
      sortable: true,
      cell: (row) => (
        <span className="text-zinc-400 text-xs">
          {formatDate(new Date(row.entryTime))}
        </span>
      ),
    },
    {
      key: "entryPrice",
      header: t("hEntry"),
      cell: (row) => (
        <span className="num text-zinc-300">{Number(row.entryPrice).toFixed(5)}</span>
      ),
    },
    {
      key: "exitPrice",
      header: t("hExit"),
      cell: (row) =>
        row.exitPrice ? (
          <span className="num text-zinc-300">{Number(row.exitPrice).toFixed(5)}</span>
        ) : (
          <span className="text-zinc-600">—</span>
        ),
    },
    {
      key: "lotSize",
      header: t("hVolume"),
      cell: (row) => (
        <span className="num text-zinc-400">{Number(row.lotSize).toFixed(2)}</span>
      ),
    },
    {
      key: "pnlMoney",
      header: t("hPnl"),
      sortable: true,
      cell: (row) => {
        if (row.pnlMoney == null)
          return <span className="text-zinc-600">—</span>;
        const pnl = Number(row.pnlMoney);
        return (
          <div className="flex items-center gap-1">
            {pnl >= 0 ? (
              <TrendingUp className="h-3 w-3 text-emerald-400" />
            ) : (
              <TrendingDown className="h-3 w-3 text-rose-400" />
            )}
            <span
              className={cn(
                "num font-medium",
                pnl >= 0 ? "text-emerald-400 neon-emerald" : "text-rose-400 neon-rose"
              )}
            >
              {pnl >= 0 ? "+" : ""}
              {formatCurrency(pnl, row.account.currency)}
            </span>
            {row.pnlPercent != null && (
              <span
                className={cn(
                  "text-xs num",
                  pnl >= 0 ? "text-emerald-500/70" : "text-rose-500/70"
                )}
              >
                ({Number(row.pnlPercent) >= 0 ? "+" : ""}
                {Number(row.pnlPercent).toFixed(2)}%)
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "setupType",
      header: t("hSetup"),
      cell: (row) =>
        row.setupType ? (
          <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
            {row.setupType.replace(/_/g, " ")}
          </Badge>
        ) : (
          <span className="text-zinc-600">—</span>
        ),
    },
    {
      key: "status",
      header: t("hStatus"),
      cell: (row) => (
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded border",
            statusColors[row.status]
          )}
        >
          {t(statusLabels[row.status])}
        </span>
      ),
    },
    {
      key: "account",
      header: t("hAccount"),
      cell: (row) => (
        <span className="text-xs text-zinc-500">{row.account.name}</span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={trades}
      keyFn={(r) => r.id}
      onRowClick={(row) => router.push(`/trades/${row.id}`)}
      loading={loading}
      emptyMessage={t("emptyTable")}
    />
  );
}
