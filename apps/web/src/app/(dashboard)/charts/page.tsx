"use client";

import { useTranslations, useLocale } from "next-intl";
import * as React from "react";
import { motion } from "framer-motion";
import { TradingViewChart } from "./tradingview-chart";
import { AnalyzePanel } from "./analyze-panel";
import { RiskPanel } from "./risk-panel";
import { SmcChart, type SmcToggles } from "./smc-chart";
import { Search, Star, LineChart, X, ChevronDown, Square, Columns2, LayoutGrid, Maximize2, Minimize2, Brain, Crosshair, Boxes } from "lucide-react";
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

const DEFAULT_CELLS = [
  { symbol: "EURUSD", timeframe: "60" },
  { symbol: "GBPUSD", timeframe: "60" },
  { symbol: "XAUUSD", timeframe: "240" },
  { symbol: "BTCUSD", timeframe: "60" },
];

export default function ChartsPage() {
  const t = useTranslations("charts");
  const locale = useLocale();
  const tvLocale = locale === "en" ? "en" : "ro";

  const [layout, setLayout] = React.useState<1 | 2 | 4>(1);
  const [cells, setCells] = React.useState(DEFAULT_CELLS);
  const [activeCell, setActiveCell] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [favorites, setFavorites] = React.useState<string[]>(["EURUSD", "XAUUSD", "BTCUSD", "NAS100"]);
  const [studies, setStudies] = React.useState<string[]>([]);
  const [indOpen, setIndOpen] = React.useState(false);
  const [activeGroup, setActiveGroup] = React.useState(0);
  const [zen, setZen] = React.useState(false);
  const [aiOpen, setAiOpen] = React.useState(false);
  const [riskOpen, setRiskOpen] = React.useState(false);
  const [smcMode, setSmcMode] = React.useState(false);
  const [smcToggles, setSmcToggles] = React.useState<SmcToggles>({ ob: true, fvg: true, liq: true, struct: true });
  const indRef = React.useRef<HTMLDivElement>(null);
  const tAI = useTranslations("chartAI");
  const tRisk = useTranslations("chartRisk");
  const tSmc = useTranslations("chartSmc");

  const active = cells[activeCell] ?? cells[0]!;

  // închide panoul de indicatoare la click în afară
  React.useEffect(() => {
    if (!indOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (indRef.current && !indRef.current.contains(e.target as Node)) setIndOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [indOpen]);

  // Esc iese din Mod Zen
  React.useEffect(() => {
    if (!zen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setZen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [zen]);

  function setActiveSymbol(s: string) {
    setCells((prev) => prev.map((c, i) => (i === activeCell ? { ...c, symbol: s } : c)));
  }
  function setActiveTf(tf: string) {
    setCells((prev) => prev.map((c, i) => (i === activeCell ? { ...c, timeframe: tf } : c)));
  }
  function changeLayout(n: 1 | 2 | 4) {
    setLayout(n);
    if (activeCell >= n) setActiveCell(0);
  }
  function toggleFav(s: string) {
    setFavorites((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }
  function toggleStudy(id: string) {
    setStudies((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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

  const gridClass =
    layout === 1 ? "grid-cols-1" :
    layout === 2 ? "grid-cols-1 md:grid-cols-2" :
    "grid-cols-1 md:grid-cols-2 md:grid-rows-2";

  const LAYOUTS: { n: 1 | 2 | 4; Icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { n: 1, Icon: Square, label: t("grid1") },
    { n: 2, Icon: Columns2, label: t("grid2") },
    { n: 4, Icon: LayoutGrid, label: t("grid4") },
  ];

  return (
    <div
      className={cn(
        "flex flex-col",
        zen ? "fixed inset-0 z-[60] bg-[#08080b] p-3" : "h-full"
      )}
      style={zen ? undefined : { height: "calc(100vh - 96px)" }}
    >
      {/* ── Bară de sus ── */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 mb-2">
        <div className="flex items-center gap-2 mr-1">
          <LineChart className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-black text-zinc-100">{active.symbol}</span>
          {layout > 1 && <span className="text-[10px] text-indigo-400/70 font-bold">· {t("activeChart")}</span>}
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
              title={t("catFavorites")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border",
                activeGroup === -1 && search.length === 0 ? "bg-amber-500/15 border-amber-500/30 text-amber-300" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 border-transparent"
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

        {/* Layout multi-chart */}
        <div className="flex items-center gap-0.5 bg-zinc-900/70 border border-zinc-800 rounded-lg p-0.5">
          {LAYOUTS.map((lo) => (
            <button
              key={lo.n}
              onClick={() => changeLayout(lo.n)}
              title={lo.label}
              className={cn(
                "p-1.5 rounded-md transition-all",
                layout === lo.n ? "bg-indigo-500/25 text-indigo-200" : "text-zinc-500 hover:text-zinc-200"
              )}
            >
              <lo.Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        {/* Timeframe */}
        <div className="flex items-center gap-0.5 bg-zinc-900/70 border border-zinc-800 rounded-lg p-0.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.v}
              onClick={() => setActiveTf(tf.v)}
              className={cn(
                "text-[11px] px-2 py-1 rounded-md font-bold transition-all",
                active.timeframe === tf.v ? "bg-indigo-500/25 text-indigo-200" : "text-zinc-500 hover:text-zinc-200"
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
              studies.length > 0 ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-200" : "bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-700"
            )}
          >
            <LineChart className="w-3.5 h-3.5" />
            {t("indicators")}
            {studies.length > 0 && <span className="ml-0.5 text-[10px] bg-indigo-500/30 rounded px-1.5 py-0.5">{studies.length}</span>}
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

        {/* Structură SMC/ICT */}
        <button
          onClick={() => setSmcMode((v) => !v)}
          className={cn(
            "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all overflow-hidden",
            smcMode
              ? "bg-gradient-to-r from-indigo-600/80 to-emerald-600/70 border-emerald-400/40 text-white shadow-lg shadow-emerald-500/20"
              : "bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-700"
          )}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{tSmc("button")}</span>
        </button>

        {/* Risc vizual */}
        <button
          onClick={() => { setRiskOpen((v) => !v); setAiOpen(false); }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
            riskOpen ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-100" : "bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-700"
          )}
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{tRisk("button")}</span>
        </button>

        {/* Copilot AI */}
        <button
          onClick={() => { setAiOpen((v) => !v); setRiskOpen(false); }}
          className={cn(
            "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all overflow-hidden",
            aiOpen
              ? "bg-violet-500/20 border-violet-400/50 text-violet-100"
              : "bg-gradient-to-r from-indigo-600/80 to-violet-600/80 border-indigo-400/40 text-white hover:from-indigo-500/90 hover:to-violet-500/90 shadow-lg shadow-indigo-500/20"
          )}
        >
          <Brain className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{tAI("button")}</span>
        </button>

        {/* Mod Zen */}
        <button
          onClick={() => setZen((v) => !v)}
          title={zen ? t("exitZen") : t("zen")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
            zen ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200" : "bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-700"
          )}
        >
          {zen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{zen ? t("exitZen") : t("zen")}</span>
        </button>
      </div>

      {/* ── Fâșie orizontală de simboluri ── */}
      <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto pb-2 mb-2">
        {stripSymbols.map((item) => (
          <button
            key={item.s}
            onClick={() => setActiveSymbol(item.s)}
            className={cn(
              "group shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all whitespace-nowrap",
              active.symbol === item.s ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-200" : "bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
            )}
          >
            {item.label}
            <Star
              onClick={(e) => { e.stopPropagation(); toggleFav(item.s); }}
              className={cn("h-3 w-3 transition-all", favorites.includes(item.s) ? "text-amber-400 fill-amber-400" : "text-zinc-700 opacity-0 group-hover:opacity-100 hover:text-amber-400")}
            />
          </button>
        ))}
        {stripSymbols.length === 0 && <span className="text-xs text-zinc-600 px-2">—</span>}
      </div>

      {/* ── Legenda SMC (doar în modul Structură) ── */}
      {smcMode && (
        <div className="shrink-0 flex items-center gap-1.5 flex-wrap mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300/80 mr-1">{tSmc("legend")}</span>
          {([
            { k: "ob" as const, label: tSmc("ob"), dot: "bg-emerald-400" },
            { k: "fvg" as const, label: tSmc("fvg"), dot: "bg-indigo-400" },
            { k: "liq" as const, label: tSmc("liq"), dot: "bg-amber-400" },
            { k: "struct" as const, label: tSmc("struct"), dot: "bg-slate-300" },
          ]).map((it) => (
            <button
              key={it.k}
              onClick={() => setSmcToggles((p) => ({ ...p, [it.k]: !p[it.k] }))}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all",
                smcToggles[it.k] ? "bg-zinc-800 border-zinc-700 text-zinc-100" : "bg-zinc-900/50 border-zinc-800/60 text-zinc-600"
              )}
            >
              <span className={cn("w-2 h-2 rounded-sm", smcToggles[it.k] ? it.dot : "bg-zinc-700")} />
              {it.label}
            </button>
          ))}
          <span className="text-[10px] text-zinc-600 ml-1 hidden md:inline">{tSmc("auto")}</span>
        </div>
      )}

      {/* ── Zonă grafic ── */}
      <div className="relative flex-1 min-h-0">
        {/* Glow ambiental care „respiră" în Mod Zen */}
        {zen && (
          <motion.div
            aria-hidden
            className="absolute -inset-1 rounded-2xl pointer-events-none z-0"
            animate={{ opacity: [0.25, 0.5, 0.25], boxShadow: [
              "0 0 60px rgba(99,102,241,0.15)",
              "0 0 90px rgba(99,102,241,0.30)",
              "0 0 60px rgba(99,102,241,0.15)",
            ] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {smcMode ? (
          // Chart propriu cu overlay SMC/ICT (single, pe tot spațiul)
          <div className="relative z-10 h-full rounded-xl overflow-hidden border border-emerald-500/30 shadow-lg shadow-emerald-500/5">
            <SmcChart
              symbol={active.symbol}
              timeframe={active.timeframe}
              toggles={smcToggles}
              errorLabel={tSmc("noData")}
              loadingLabel={tSmc("loading")}
            />
          </div>
        ) : (
          <div className={cn("relative z-10 grid gap-2 h-full", gridClass)}>
            {cells.slice(0, layout).map((cell, i) => (
              <div
                key={i}
                onClick={() => setActiveCell(i)}
                className={cn(
                  "relative rounded-xl overflow-hidden border min-h-0 transition-all cursor-pointer",
                  layout > 1 && activeCell === i
                    ? "border-indigo-500/60 ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-500/10"
                    : "border-zinc-800/80"
                )}
              >
                {layout > 1 && (
                  <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 pointer-events-none">
                    <span className={cn("w-1.5 h-1.5 rounded-full", activeCell === i ? "bg-indigo-400" : "bg-zinc-600")} />
                    <span className="text-[10px] font-black text-zinc-200">{cell.symbol}</span>
                    <span className="text-[9px] text-zinc-500">{TIMEFRAMES.find((tf) => tf.v === cell.timeframe)?.l}</span>
                  </div>
                )}
                <TradingViewChart symbol={cell.symbol} interval={cell.timeframe} studies={studies} locale={tvLocale} />
              </div>
            ))}
          </div>
        )}
      </div>

      {zen && (
        <p className="shrink-0 text-center text-[10px] text-zinc-600 mt-1.5">{t("zenHint")}</p>
      )}

      {/* Panoul Copilot AI */}
      <AnalyzePanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        symbol={active.symbol}
        timeframe={active.timeframe}
        locale={tvLocale}
      />

      {/* Panoul de risc vizual */}
      <RiskPanel
        open={riskOpen}
        onClose={() => setRiskOpen(false)}
        symbol={active.symbol}
      />
    </div>
  );
}
