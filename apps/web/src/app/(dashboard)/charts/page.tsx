"use client";

import * as React from "react";
import { TradingViewChart } from "./tradingview-chart";
import { Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const SYMBOL_GROUPS = [
  {
    label: "Forex", icon: "💱", color: "indigo",
    symbols: [
      { s: "EURUSD", label: "EUR/USD" }, { s: "GBPUSD", label: "GBP/USD" },
      { s: "USDJPY", label: "USD/JPY" }, { s: "USDCHF", label: "USD/CHF" },
      { s: "AUDUSD", label: "AUD/USD" }, { s: "USDCAD", label: "USD/CAD" },
      { s: "NZDUSD", label: "NZD/USD" }, { s: "EURGBP", label: "EUR/GBP" },
      { s: "EURJPY", label: "EUR/JPY" }, { s: "GBPJPY", label: "GBP/JPY" },
    ],
  },
  {
    label: "Crypto", icon: "₿", color: "amber",
    symbols: [
      { s: "BTCUSD", label: "BTC/USD" }, { s: "ETHUSD", label: "ETH/USD" },
      { s: "SOLUSD", label: "SOL/USD" }, { s: "BNBUSD", label: "BNB/USD" },
      { s: "XRPUSD", label: "XRP/USD" }, { s: "ADAUSD", label: "ADA/USD" },
      { s: "AVAXUSD", label: "AVAX/USD" }, { s: "DOTUSD", label: "DOT/USD" },
    ],
  },
  {
    label: "Metale", icon: "🥇", color: "yellow",
    symbols: [
      { s: "XAUUSD", label: "XAU/USD" }, { s: "XAGUSD", label: "XAG/USD" },
    ],
  },
  {
    label: "Indici", icon: "📊", color: "violet",
    symbols: [
      { s: "NAS100", label: "NAS100" }, { s: "US30", label: "DOW30" },
      { s: "US500", label: "S&P500" }, { s: "GER40", label: "DAX40" },
      { s: "UK100", label: "FTSE100" }, { s: "JPN225", label: "Nikkei" },
    ],
  },
  {
    label: "Acțiuni", icon: "🏢", color: "emerald",
    symbols: [
      { s: "AAPL", label: "Apple" }, { s: "TSLA", label: "Tesla" },
      { s: "NVDA", label: "NVIDIA" }, { s: "MSFT", label: "Microsoft" },
      { s: "META", label: "Meta" }, { s: "GOOGL", label: "Google" },
    ],
  },
];

const TIMEFRAMES = [
  { v: "1", l: "1m" }, { v: "5", l: "5m" }, { v: "15", l: "15m" }, { v: "30", l: "30m" },
  { v: "60", l: "1h" }, { v: "240", l: "4h" }, { v: "D", l: "1D" }, { v: "W", l: "1W" },
];

export default function ChartsPage() {
  const [symbol, setSymbol] = React.useState("EURUSD");
  const [timeframe, setTimeframe] = React.useState("60");
  const [activeGroup, setActiveGroup] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [favorites, setFavorites] = React.useState<string[]>(["EURUSD", "XAUUSD", "BTCUSD", "NAS100"]);

  function toggleFav(s: string) {
    setFavorites((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  // All symbols flat for search
  const allSymbols = SYMBOL_GROUPS.flatMap((g) => g.symbols.map((s) => ({ ...s, group: g.label, color: g.color })));
  const searchResults = search.length > 0
    ? allSymbols.filter((s) => s.s.toLowerCase().includes(search.toLowerCase()) || s.label.toLowerCase().includes(search.toLowerCase()))
    : [];

  const visibleSymbols = search.length > 0
    ? searchResults
    : SYMBOL_GROUPS[activeGroup]!.symbols.map((s) => ({ ...s, group: SYMBOL_GROUPS[activeGroup]!.label, color: SYMBOL_GROUPS[activeGroup]!.color }));

  return (
    <div className="flex flex-col h-full" style={{ height: "calc(100vh - 112px)" }}>
      {/* Header */}
      <div className="shrink-0 mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight neon-indigo">Grafice Live</h1>
          <p className="text-sm text-zinc-500 mt-0.5">TradingView avansat · {symbol}</p>
        </div>
      </div>

      <div className="flex gap-3 flex-1 min-h-0">
        {/* Symbol Sidebar */}
        <div className="w-52 shrink-0 flex flex-col gap-2 min-h-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută simbol..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
            />
          </div>

          {/* Category tabs */}
          {search.length === 0 && (
            <div className="flex flex-col gap-1">
              {/* Favorites */}
              {favorites.length > 0 && (
                <button
                  onClick={() => { setActiveGroup(-1); setSearch(""); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left",
                    activeGroup === -1 ? "bg-amber-500/15 border border-amber-500/30 text-amber-300" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                  )}
                >
                  <Star className="h-3 w-3" /> Favorite ({favorites.length})
                </button>
              )}
              {SYMBOL_GROUPS.map((g, i) => (
                <button
                  key={g.label}
                  onClick={() => setActiveGroup(i)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-left",
                    activeGroup === i ? `bg-zinc-800 border border-zinc-700 text-zinc-100` : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                  )}
                >
                  <span>{g.icon}</span> {g.label}
                </button>
              ))}
            </div>
          )}

          {/* Symbol list */}
          <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
            {(activeGroup === -1 && search.length === 0
              ? allSymbols.filter((s) => favorites.includes(s.s))
              : visibleSymbols
            ).map((item) => (
              <div
                key={item.s}
                className={cn(
                  "flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all group",
                  symbol === item.s
                    ? "bg-indigo-500/15 border border-indigo-500/30"
                    : "hover:bg-zinc-800/60"
                )}
                onClick={() => setSymbol(item.s)}
              >
                <div className="min-w-0">
                  <p className={cn("text-xs font-bold truncate", symbol === item.s ? "text-indigo-200" : "text-zinc-200")}>{item.label}</p>
                  <p className="text-[10px] text-zinc-600">{item.s}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFav(item.s); }}
                  className={cn("opacity-0 group-hover:opacity-100 transition-opacity p-0.5", favorites.includes(item.s) && "opacity-100")}
                >
                  <Star className={cn("h-3 w-3", favorites.includes(item.s) ? "text-amber-400 fill-amber-400" : "text-zinc-600")} />
                </button>
              </div>
            ))}
          </div>

          {/* Timeframe selector */}
          <div className="shrink-0">
            <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-wide mb-1.5 px-1">Timeframe</p>
            <div className="grid grid-cols-4 gap-1">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.v}
                  onClick={() => setTimeframe(tf.v)}
                  className={cn(
                    "text-[10px] py-1 rounded font-bold transition-all",
                    timeframe === tf.v
                      ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-300"
                      : "text-zinc-600 hover:text-zinc-300 bg-zinc-800/50"
                  )}
                >
                  {tf.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-zinc-800/80 min-h-0 shadow-xl shadow-black/20" style={{ boxShadow: "0 0 40px rgba(99,102,241,0.05)" }}>
          <TradingViewChart symbol={symbol} interval={timeframe} />
        </div>
      </div>
    </div>
  );
}
