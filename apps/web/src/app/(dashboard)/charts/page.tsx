"use client";

import { useTranslations, useLocale } from "next-intl";
import * as React from "react";
import { TradingViewChart } from "./tradingview-chart";
import { Search, Star, LineChart, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// label = cheie → charts.* (tradusă la randare)
const SYMBOL_GROUPS = [
  {
    label: "catForex", icon: "💱",
    symbols: [
      { s: "EURUSD", label: "EUR/USD" }, { s: "GBPUSD", label: "GBP/USD" },
      { s: "USDJPY", label: "USD/JPY" }, { s: "USDCHF", label: "USD/CHF" },
      { s: "AUDUSD", label: "AUD/USD" }, { s: "USDCAD", label: "USD/CAD" },
      { s: "NZDUSD", label: "NZD/USD" }, { s: "EURGBP", label: "EUR/GBP" },
      { s: "EURJPY", label: "EUR/JPY" }, { s: "GBPJPY", label: "GBP/JPY" },
    ],
  },
  {
    label: "catCrypto", icon: "₿",
    symbols: [
      { s: "BTCUSD", label: "BTC/USD" }, { s: "ETHUSD", label: "ETH/USD" },
      { s: "SOLUSD", label: "SOL/USD" }, { s: "BNBUSD", label: "BNB/USD" },
      { s: "XRPUSD", label: "XRP/USD" }, { s: "ADAUSD", label: "ADA/USD" },
      { s: "AVAXUSD", label: "AVAX/USD" }, { s: "DOTUSD", label: "DOT/USD" },
      { s: "DOGEUSD", label: "DOGE/USD" }, { s: "LINKUSD", label: "LINK/USD" },
    ],
  },
  {
    label: "catMetals", icon: "🥇",
    symbols: [
      { s: "XAUUSD", label: "XAU/USD" }, { s: "XAGUSD", label: "XAG/USD" },
      { s: "USOIL", label: "WTI Oil" }, { s: "UKOIL", label: "Brent Oil" },
    ],
  },
  {
    label: "catIndices", icon: "📊",
    symbols: [
      { s: "NAS100", label: "NAS100" }, { s: "US30", label: "DOW30" },
      { s: "US500", label: "S&P500" }, { s: "GER40", label: "DAX40" },
      { s: "UK100", label: "FTSE100" }, { s: "JPN225", label: "Nikkei" },
    ],
  },
  {
    label: "catStocks", icon: "🏢",
    symbols: [
      { s: "AAPL", label: "Apple" }, { s: "TSLA", label: "Tesla" },
      { s: "NVDA", label: "NVIDIA" }, { s: "MSFT", label: "Microsoft" },
      { s: "META", label: "Meta" }, { s: "GOOGL", label: "Google" },
      { s: "AMZN", label: "Amazon" }, { s: "AMD", label: "AMD" },
    ],
  },
];

const TIMEFRAMES = [
  { v: "1", l: "1m" }, { v: "5", l: "5m" }, { v: "15", l: "15m" }, { v: "30", l: "30m" },
  { v: "60", l: "1h" }, { v: "240", l: "4h" }, { v: "D", l: "1D" }, { v: "W", l: "1W" },
];

// Indicatoare rapide (TradingView basic studies), grupate. Restul (sute) rămân
// accesibile din butonul „Indicators" al graficului — dar astea sunt la un click.
const INDICATOR_GROUPS = [
  {
    cat: "trend",
    items: [
      { id: "MAExp@tv-basicstudies", name: "EMA" },
      { id: "MASimple@tv-basicstudies", name: "SMA" },
      { id: "IchimokuCloud@tv-basicstudies", name: "Ichimoku" },
      { id: "PSAR@tv-basicstudies", name: "Parabolic SAR" },
      { id: "PivotPointsStandard@tv-basicstudies", name: "Pivot Points" },
      { id: "VWAP@tv-basicstudies", name: "VWAP" },
    ],
  },
  {
    cat: "momentum",
    items: [
      { id: "RSI@tv-basicstudies", name: "RSI" },
      { id: "MACD@tv-basicstudies", name: "MACD" },
      { id: "Stochastic@tv-basicstudies", name: "Stochastic" },
      { id: "AwesomeOscillator@tv-basicstudies", name: "Awesome Osc." },
      { id: "CCI@tv-basicstudies", name: "CCI" },
      { id: "ADX@tv-basicstudies", name: "ADX / DMI" },
    ],
  },
  {
    cat: "volatility",
    items: [
      { id: "BB@tv-basicstudies", name: "Bollinger Bands" },
      { id: "ATR@tv-basicstudies", name: "ATR" },
      { id: "KLTNR@tv-basicstudies", name: "Keltner" },
    ],
  },
  {
    cat: "volume",
    items: [
      { id: "Volume@tv-basicstudies", name: "Volume" },
      { id: "OBV@tv-basicstudies", name: "OBV" },
      { id: "MF@tv-basicstudies", name: "Money Flow" },
    ],
  },
];

export default function ChartsPage() {
  const t = useTranslations("charts");
  const locale = useLocale();
  const [symbol, setSymbol] = React.useState("EURUSD");
  const [timeframe, setTimeframe] = React.useState("60");
  const [activeGroup, setActiveGroup] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [favorites, setFavorites] = React.useState<string[]>(["EURUSD", "XAUUSD", "BTCUSD", "NAS100"]);
  const [studies, setStudies] = React.useState<string[]>([]);
  const [indOpen, setIndOpen] = React.useState(false);
  const indRef = React.useRef<HTMLDivElement>(null);

  // închide panoul de indicatoare la click în afară
  React.useEffect(() => {
    if (!indOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (indRef.current && !indRef.current.contains(e.target as Node)) setIndOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [indOpen]);

  function toggleFav(s: string) {
    setFavorites((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }
  function toggleStudy(id: string) {
    setStudies((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  const allSymbols = SYMBOL_GROUPS.flatMap((g) => g.symbols.map((s) => ({ ...s, group: g.label })));
  const searchResults = search.length > 0
    ? allSymbols.filter((s) => s.s.toLowerCase().includes(search.toLowerCase()) || s.label.toLowerCase().includes(search.toLowerCase()))
    : [];

  const stripSymbols = search.length > 0
    ? searchResults
    : activeGroup === -1
      ? allSymbols.filter((s) => favorites.includes(s.s))
      : SYMBOL_GROUPS[activeGroup]!.symbols.map((s) => ({ ...s, group: SYMBOL_GROUPS[activeGroup]!.label }));

  return (
    <div className="flex flex-col h-full" style={{ height: "calc(100vh - 96px)" }}>
      {/* ── Bară de sus: căutare + categorii + timeframe + indicatoare ── */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 mb-2">
        {/* Titlu + simbol curent */}
        <div className="flex items-center gap-2 mr-1">
          <LineChart className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-black text-zinc-100">{symbol}</span>
        </div>

        {/* Căutare */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-40 bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:w-52 transition-all"
          />
        </div>

        {/* Categorii */}
        <div className="flex items-center gap-1">
          {favorites.length > 0 && (
            <button
              onClick={() => { setActiveGroup(-1); setSearch(""); }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeGroup === -1 && search.length === 0 ? "bg-amber-500/15 border border-amber-500/30 text-amber-300" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 border border-transparent"
              )}
            >
              <Star className="h-3 w-3" />
            </button>
          )}
          {SYMBOL_GROUPS.map((g, i) => (
            <button
              key={g.label}
              onClick={() => { setActiveGroup(i); setSearch(""); }}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border",
                activeGroup === i && search.length === 0 ? "bg-zinc-800 border-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 border-transparent"
              )}
            >
              <span className="mr-1">{g.icon}</span>{t(g.label)}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Timeframe */}
        <div className="flex items-center gap-0.5 bg-zinc-900/70 border border-zinc-800 rounded-lg p-0.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.v}
              onClick={() => setTimeframe(tf.v)}
              className={cn(
                "text-[11px] px-2 py-1 rounded-md font-bold transition-all",
                timeframe === tf.v ? "bg-indigo-500/25 text-indigo-200" : "text-zinc-500 hover:text-zinc-200"
              )}
            >
              {tf.l}
            </button>
          ))}
        </div>

        {/* Indicatoare */}
        <div className="relative" ref={indRef}>
          <button
            onClick={() => setIndOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
              studies.length > 0
                ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-200"
                : "bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-700"
            )}
          >
            <LineChart className="w-3.5 h-3.5" />
            {t("indicators")}
            {studies.length > 0 && (
              <span className="ml-0.5 text-[10px] bg-indigo-500/30 rounded px-1.5 py-0.5">{studies.length}</span>
            )}
            <ChevronDown className={cn("w-3 h-3 transition-transform", indOpen && "rotate-180")} />
          </button>

          {indOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-72 bg-zinc-900/98 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 backdrop-blur-xl p-3 z-50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-black text-zinc-200">{t("indicators")}</p>
                {studies.length > 0 && (
                  <button onClick={() => setStudies([])} className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-rose-300 transition-colors">
                    <X className="w-3 h-3" />{t("clearAll")}
                  </button>
                )}
              </div>
              <p className="text-[10px] text-zinc-600 mb-3">{t("indicatorsHint")}</p>
              <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1">
                {INDICATOR_GROUPS.map((grp) => (
                  <div key={grp.cat}>
                    <p className="text-[9px] font-black uppercase tracking-wider text-zinc-600 mb-1.5">{t(grp.cat)}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {grp.items.map((ind) => {
                        const on = studies.includes(ind.id);
                        return (
                          <button
                            key={ind.id}
                            onClick={() => toggleStudy(ind.id)}
                            className={cn(
                              "text-[11px] px-2 py-1.5 rounded-lg font-medium text-left transition-all border",
                              on ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-200" : "bg-zinc-800/40 border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                            )}
                          >
                            {on ? "✓ " : ""}{ind.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Fâșie orizontală de simboluri (categoria activă / favorite / căutare) ── */}
      <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-thin">
        {stripSymbols.map((item) => (
          <button
            key={item.s}
            onClick={() => setSymbol(item.s)}
            className={cn(
              "group shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all whitespace-nowrap",
              symbol === item.s
                ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-200"
                : "bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
            )}
          >
            {item.label}
            <Star
              onClick={(e) => { e.stopPropagation(); toggleFav(item.s); }}
              className={cn(
                "h-3 w-3 transition-all",
                favorites.includes(item.s) ? "text-amber-400 fill-amber-400" : "text-zinc-700 opacity-0 group-hover:opacity-100 hover:text-amber-400"
              )}
            />
          </button>
        ))}
        {stripSymbols.length === 0 && (
          <span className="text-xs text-zinc-600 px-2">—</span>
        )}
      </div>

      {/* ── Chart pe tot ecranul ── */}
      <div
        className="flex-1 rounded-2xl overflow-hidden border border-zinc-800/80 min-h-0 shadow-xl shadow-black/20"
        style={{ boxShadow: "0 0 40px rgba(99,102,241,0.05)" }}
      >
        <TradingViewChart symbol={symbol} interval={timeframe} studies={studies} locale={locale === "en" ? "en" : "ro"} />
      </div>
    </div>
  );
}
