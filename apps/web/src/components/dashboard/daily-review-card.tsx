"use client";

import * as React from "react";
import { Moon, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
  hasTrades: boolean;
  trades: number;
  wins: number;
  losses: number;
  netPnl: number;
  winRate: number;
  summary: string;
}

export function DailyReviewCard() {
  const [review, setReview] = React.useState<Review | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/daily-review", { cache: "no-store" });
      if (res.ok) setReview(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-indigo-500/15 bg-zinc-900/80 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
          <Moon className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <h3 className="text-sm font-bold text-zinc-200">Rezumatul zilei</h3>
        <span className="text-[9px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">AI</span>
        {!review && (
          <button
            onClick={load}
            disabled={loading}
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/8 hover:bg-indigo-500/15 border border-indigo-500/20 rounded-lg px-2.5 py-1 transition-all"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {loading ? "Se analizează..." : "Generează"}
          </button>
        )}
      </div>

      {!review ? (
        <p className="text-xs text-zinc-500">
          Primește un rezumat AI al zilei tale de trading — cum a mers și ce poți îmbunătăți. Îl primești automat și pe Telegram, seara.
        </p>
      ) : (
        <div>
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{review.summary}</p>
          {review.hasTrades && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-zinc-800/50 text-xs">
              <span className="text-zinc-500">{review.trades} trades</span>
              <span className="text-emerald-400">{review.wins}W</span>
              <span className="text-rose-400">{review.losses}L</span>
              <span className="text-zinc-500">WR {review.winRate}%</span>
              <span className={cn("font-bold num ml-auto", review.netPnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {review.netPnl >= 0 ? "+" : ""}{review.netPnl}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
