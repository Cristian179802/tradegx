"use client";

import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Symbols are in TwelveData format (what the quote API returns its keys as).
// Seeded with a plausible snapshot so the strip renders instantly and never
// looks empty, even before the first live fetch (or if no API key is set).
interface Tick {
  symbol: string;
  price: string;
  change: string;
  up: boolean;
}

const SEED: Tick[] = [
  { symbol: "EUR/USD", price: "1.0847",  change: "+0.12%", up: true },
  { symbol: "GBP/USD", price: "1.2714",  change: "-0.08%", up: false },
  { symbol: "USD/JPY", price: "157.34",  change: "+0.22%", up: true },
  { symbol: "USD/CHF", price: "0.9042",  change: "+0.05%", up: true },
  { symbol: "AUD/USD", price: "0.6642",  change: "-0.11%", up: false },
  { symbol: "USD/CAD", price: "1.3681",  change: "+0.09%", up: true },
  { symbol: "XAU/USD", price: "2321.40", change: "+0.34%", up: true },
  { symbol: "XAG/USD", price: "30.42",   change: "+0.41%", up: true },
  { symbol: "BTC/USD", price: "67820",   change: "+1.82%", up: true },
  { symbol: "ETH/USD", price: "3416",    change: "+2.14%", up: true },
];

const SYMBOLS = SEED.map((s) => s.symbol);

// Decimals per symbol class for tidy formatting.
function formatPrice(symbol: string, raw: string): string {
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  if (symbol.startsWith("BTC") || symbol.startsWith("ETH")) {
    return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  if (symbol.includes("JPY")) return n.toFixed(2);
  if (symbol.startsWith("XAU") || symbol.startsWith("XAG")) return n.toFixed(2);
  return n.toFixed(4);
}

function TickerItem({ symbol, price, change, up }: Tick) {
  return (
    <span className="flex items-center gap-1.5 shrink-0 select-none">
      <span className="text-zinc-500 text-[11px] font-bold tracking-wide">{symbol}</span>
      <span className="text-zinc-200 text-[11px] font-mono font-semibold">{price}</span>
      <span
        className={cn(
          "text-[10px] font-bold flex items-center gap-0.5",
          up ? "text-emerald-400" : "text-rose-400"
        )}
      >
        {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
        {change}
      </span>
      <span className="text-zinc-800 mx-2 text-[10px]">·</span>
    </span>
  );
}

export function MarketTicker() {
  const [ticks, setTicks] = React.useState<Tick[]>(SEED);
  const [live, setLive] = React.useState(false);
  const [source, setSource] = React.useState<"twelvedata" | "yahoo" | "open-er" | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          `/api/integrations/twelvedata/quote?symbols=${encodeURIComponent(SYMBOLS.join(","))}`,
          { cache: "no-store" }
        );
        if (!res.ok) return; // păstrează ultimele valori la orice eroare
        const data = await res.json();
        const quotes: Record<string, { price?: string; percent_change?: string }> =
          data.quotes ?? {};

        const next: Tick[] = SYMBOLS.map((sym) => {
          const q = quotes[sym];
          const seed = SEED.find((s) => s.symbol === sym)!;
          if (!q || q.price == null) return seed;
          const pct = Number(q.percent_change ?? 0);
          const up = pct >= 0;
          return {
            symbol: sym,
            price: formatPrice(sym, q.price),
            change: `${up ? "+" : ""}${pct.toFixed(2)}%`,
            up,
          };
        });

        if (!cancelled) {
          setTicks(next);
          if (Object.keys(quotes).length > 0) {
            setLive(true);
            setSource(
            data.source === "yahoo" ? "yahoo" :
            data.source === "open-er" ? "open-er" :
            "twelvedata"
          );
          }
        }
      } catch {
        /* keep last values */
      }
    }

    load();
    const id = setInterval(load, 15_000); // refresh la fiecare 15s (= cache TTL)
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div
      className="h-8 border-b border-indigo-500/10 overflow-hidden flex items-center"
      style={{
        background:
          "linear-gradient(90deg, rgba(99,102,241,0.06) 0%, rgba(9,9,11,0.95) 30%, rgba(9,9,11,0.95) 70%, rgba(139,92,246,0.04) 100%)",
      }}
    >
      {/* Left label */}
      <div
        className="shrink-0 flex items-center gap-1.5 px-3 border-r border-indigo-500/20 h-full"
        style={{ background: "rgba(99,102,241,0.08)" }}
        title={
          !live ? "Prețuri orientative — se încarcă date live..." :
          source === "yahoo"    ? "Prețuri live (Yahoo Finance)" :
          source === "open-er"  ? "Prețuri live (ExchangeRate API + Coinbase)" :
          "Prețuri live (TwelveData)"
        }
      >
        <span className="live-dot-indigo" />
        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest whitespace-nowrap">
          Live
        </span>
      </div>
      {/* Scrolling ticker */}
      <div className="flex-1 overflow-hidden">
        <div className="flex animate-ticker whitespace-nowrap gap-0">
          {[...ticks, ...ticks].map((t, i) => (
            <TickerItem key={i} {...t} />
          ))}
        </div>
      </div>
      {/* Right fade */}
      <div className="shrink-0 w-12 h-full bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none" />
    </div>
  );
}
