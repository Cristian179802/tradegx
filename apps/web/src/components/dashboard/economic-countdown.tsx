"use client";

import * as React from "react";
import { CalendarClock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CalEvent {
  title: string;
  currency: string;
  country: string;
  utcDate: string;
  impact: string;
}

const FLAGS: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵", CAD: "🇨🇦",
  AUD: "🇦🇺", NZD: "🇳🇿", CHF: "🇨🇭", CNY: "🇨🇳",
};

export function EconomicCountdown({ className }: { className?: string }) {
  const [next, setNext] = React.useState<CalEvent | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [remaining, setRemaining] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/calendar?week=this", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const events: CalEvent[] = data.events ?? [];
        const now = Date.now();
        const upcoming = events
          .filter((e) => e.impact === "High" && e.utcDate && new Date(e.utcDate).getTime() > now)
          .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
        if (!cancelled) setNext(upcoming[0] ?? null);
      } catch { /* ignoră */ }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    const id = setInterval(load, 5 * 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  React.useEffect(() => {
    if (!next) return;
    const tick = () => {
      const diff = new Date(next.utcDate).getTime() - Date.now();
      if (diff <= 0) { setRemaining("acum"); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setRemaining(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [next]);

  if (loading) {
    return <div className={cn("h-[58px] rounded-2xl bg-zinc-800/40 animate-pulse", className)} />;
  }
  if (!next) return null;

  const soon = new Date(next.utcDate).getTime() - Date.now() < 3_600_000; // sub 1h

  return (
    <Link
      href="/calendar"
      className={cn(
        "group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all",
        soon ? "border-amber-500/40 hover:border-amber-400/60" : "border-zinc-800/70 hover:border-zinc-700",
        className
      )}
      style={{ background: soon
        ? "linear-gradient(100deg, rgba(245,158,11,0.10) 0%, rgba(24,24,28,0.6) 70%)"
        : "linear-gradient(100deg, rgba(244,63,94,0.06) 0%, rgba(24,24,28,0.6) 70%)" }}
    >
      <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center shrink-0",
        soon ? "bg-amber-500/15 border-amber-500/30" : "bg-rose-500/12 border-rose-500/25")}>
        {soon ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <CalendarClock className="w-4 h-4 text-rose-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{FLAGS[next.currency] ?? "🌐"}</span>
          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">High</span>
          <p className="text-xs font-semibold text-zinc-200 truncate">{next.title}</p>
        </div>
        <p className="text-[11px] text-zinc-500 mt-0.5">Următoarea știre de impact</p>
      </div>
      <div className="text-right shrink-0">
        <p className={cn("text-lg font-black num leading-none", soon ? "text-amber-300" : "text-zinc-200")}>{remaining}</p>
        <p className="text-[10px] text-zinc-600 mt-0.5">rămas</p>
      </div>
    </Link>
  );
}
