"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SYMBOLS = [
  // ── Forex ────────────────────────────────────────────────────
  { label: "EUR/USD",  value: "FX:EURUSD",          cat: "Forex" },
  { label: "GBP/USD",  value: "FX:GBPUSD",          cat: "Forex" },
  { label: "USD/JPY",  value: "FX:USDJPY",          cat: "Forex" },
  { label: "AUD/USD",  value: "FX:AUDUSD",          cat: "Forex" },
  { label: "USD/CHF",  value: "FX:USDCHF",          cat: "Forex" },
  { label: "USD/CAD",  value: "FX:USDCAD",          cat: "Forex" },
  { label: "NZD/USD",  value: "FX:NZDUSD",          cat: "Forex" },
  { label: "EUR/GBP",  value: "FX:EURGBP",          cat: "Forex" },
  { label: "EUR/JPY",  value: "FX:EURJPY",          cat: "Forex" },
  { label: "EUR/CHF",  value: "FX:EURCHF",          cat: "Forex" },
  { label: "GBP/JPY",  value: "FX:GBPJPY",          cat: "Forex" },
  { label: "GBP/CHF",  value: "FX:GBPCHF",          cat: "Forex" },
  { label: "AUD/JPY",  value: "FX:AUDJPY",          cat: "Forex" },
  { label: "CAD/JPY",  value: "FX:CADJPY",          cat: "Forex" },
  { label: "CHF/JPY",  value: "FX:CHFJPY",          cat: "Forex" },
  { label: "EUR/AUD",  value: "FX:EURAUD",          cat: "Forex" },
  { label: "EUR/CAD",  value: "FX:EURCAD",          cat: "Forex" },
  { label: "EUR/NZD",  value: "FX:EURNZD",          cat: "Forex" },
  { label: "GBP/AUD",  value: "FX:GBPAUD",          cat: "Forex" },
  { label: "GBP/NZD",  value: "FX:GBPNZD",          cat: "Forex" },
  { label: "GBP/CAD",  value: "FX:GBPCAD",          cat: "Forex" },
  { label: "AUD/NZD",  value: "FX:AUDNZD",          cat: "Forex" },
  { label: "AUD/CAD",  value: "FX:AUDCAD",          cat: "Forex" },
  { label: "NZD/JPY",  value: "FX:NZDJPY",          cat: "Forex" },
  { label: "USD/MXN",  value: "FX:USDMXN",          cat: "Forex" },
  { label: "USD/ZAR",  value: "FX:USDZAR",          cat: "Forex" },
  { label: "USD/TRY",  value: "FX:USDTRY",          cat: "Forex" },
  { label: "USD/SGD",  value: "FX:USDSGD",          cat: "Forex" },
  { label: "USD/NOK",  value: "FX:USDNOK",          cat: "Forex" },
  { label: "USD/SEK",  value: "FX:USDSEK",          cat: "Forex" },
  // ── Metale ───────────────────────────────────────────────────
  { label: "XAU/USD",  value: "OANDA:XAUUSD",       cat: "Metale" },
  { label: "XAG/USD",  value: "OANDA:XAGUSD",       cat: "Metale" },
  { label: "XPT/USD",  value: "OANDA:XPTUSD",       cat: "Metale" },
  { label: "XPD/USD",  value: "OANDA:XPDUSD",       cat: "Metale" },
  { label: "XCU/USD",  value: "OANDA:XCUUSD",       cat: "Metale" },
  // ── Indici ───────────────────────────────────────────────────
  { label: "US30",         value: "FOREXCOM:US30",      cat: "Indici" },
  { label: "NAS100",       value: "FOREXCOM:NSXUSD",    cat: "Indici" },
  { label: "SPX500",       value: "FOREXCOM:SPXUSD",    cat: "Indici" },
  { label: "US2000",       value: "FOREXCOM:US2000",    cat: "Indici" },
  { label: "GER40 (DAX)",  value: "FOREXCOM:GER40",     cat: "Indici" },
  { label: "UK100 (FTSE)", value: "FOREXCOM:UK100",     cat: "Indici" },
  { label: "FRA40 (CAC)",  value: "FOREXCOM:FRA40",     cat: "Indici" },
  { label: "JPN225",       value: "FOREXCOM:JPN225",    cat: "Indici" },
  { label: "AUS200",       value: "FOREXCOM:AUS200",    cat: "Indici" },
  { label: "HK50",         value: "FOREXCOM:HK50",      cat: "Indici" },
  { label: "EUSTX50",      value: "FOREXCOM:EUSTX50",   cat: "Indici" },
  { label: "CHN50",        value: "FOREXCOM:CN50USD",   cat: "Indici" },
  { label: "ITA40",        value: "FOREXCOM:IT40",      cat: "Indici" },
  { label: "ESP35",        value: "FOREXCOM:ES35",      cat: "Indici" },
  { label: "SWE30",        value: "FOREXCOM:SE30",      cat: "Indici" },
  { label: "NED25",        value: "FOREXCOM:NL25",      cat: "Indici" },
  { label: "SUI20",        value: "FOREXCOM:CH20",      cat: "Indici" },
  { label: "SGP30",        value: "FOREXCOM:SG30",      cat: "Indici" },
  { label: "VIX",          value: "CBOE:VIX",           cat: "Indici" },
  // ── Crypto ───────────────────────────────────────────────────
  { label: "BTC/USD",  value: "BITSTAMP:BTCUSD",     cat: "Crypto" },
  { label: "ETH/USD",  value: "BITSTAMP:ETHUSD",     cat: "Crypto" },
  { label: "BNB/USD",  value: "BINANCE:BNBUSDT",     cat: "Crypto" },
  { label: "SOL/USD",  value: "BINANCE:SOLUSDT",     cat: "Crypto" },
  { label: "XRP/USD",  value: "BITSTAMP:XRPUSD",     cat: "Crypto" },
  { label: "ADA/USD",  value: "BINANCE:ADAUSDT",     cat: "Crypto" },
  { label: "DOGE/USD", value: "BINANCE:DOGEUSDT",    cat: "Crypto" },
  { label: "AVAX/USD", value: "BINANCE:AVAXUSDT",    cat: "Crypto" },
  { label: "DOT/USD",  value: "BINANCE:DOTUSDT",     cat: "Crypto" },
  { label: "LINK/USD", value: "BINANCE:LINKUSDT",    cat: "Crypto" },
  { label: "MATIC",    value: "BINANCE:MATICUSDT",   cat: "Crypto" },
  { label: "LTC/USD",  value: "BITSTAMP:LTCUSD",     cat: "Crypto" },
  // ── Energie ──────────────────────────────────────────────────
  { label: "Petrol (WTI)",    value: "NYMEX:CL1!",        cat: "Energie" },
  { label: "Petrol (Brent)",  value: "ICEUS:BRN1!",       cat: "Energie" },
  { label: "Gaz Natural",     value: "NYMEX:NG1!",        cat: "Energie" },
];

const INTERVALS = [
  { label: "1m",  value: "1"   },
  { label: "5m",  value: "5"   },
  { label: "15m", value: "15"  },
  { label: "1h",  value: "60"  },
  { label: "4h",  value: "240" },
  { label: "1D",  value: "D"   },
];

const CATS = ["Forex", "Metale", "Indici", "Crypto", "Energie"];

export function LiveChart() {
  const t = useTranslations("liveChart");
  const [symbol, setSymbol]     = useState("FX:EURUSD");
  const [interval, setInterval] = useState("60");
  const [open, setOpen]         = useState(false);
  const [cat, setCat]           = useState("Forex");
  const [search, setSearch]     = useState("");
  const containerRef            = useRef<HTMLDivElement>(null);
  const dropRef                 = useRef<HTMLDivElement>(null);
  const searchRef               = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-focus search when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
    else setSearch("");
  }, [open]);

  // Inject / re-inject TradingView widget
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";

    const script = document.createElement("script");
    script.type  = "text/javascript";
    script.src   = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: "Europe/Bucharest",
      theme: "dark",
      style: "1",
      locale: "en",
      allow_symbol_change: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      hide_volume: false,
      backgroundColor: "rgba(24,24,27,1)",
      gridColor: "rgba(39,39,42,0.5)",
    });

    el.appendChild(script);
    return () => { el.innerHTML = ""; };
  }, [symbol, interval]);

  const currentLabel   = SYMBOLS.find((s) => s.value === symbol)?.label ?? symbol;
  const searchResults  = search.trim()
    ? SYMBOLS.filter((s) =>
        s.label.toLowerCase().includes(search.toLowerCase()) ||
        s.cat.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between mb-2 gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">{t("title")}</h2>
          <p className="text-xs text-zinc-600 mt-0.5">{t("realtimeData")}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Interval tabs */}
          <div className="flex items-center gap-0.5 bg-zinc-800 rounded-lg p-0.5">
            {INTERVALS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setInterval(value)}
                className={cn(
                  "text-[10px] font-semibold px-2 py-1 rounded-md transition-all",
                  interval === value
                    ? "bg-indigo-600 text-white shadow"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Symbol dropdown */}
          <div ref={dropRef} className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-200 transition-colors"
            >
              {currentLabel}
              <ChevronDown className={cn("h-3 w-3 text-zinc-500 transition-transform", open && "rotate-180")} />
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-1 z-50 w-60 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">

                {/* Search bar */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800">
                  <Search className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                  <input
                    ref={searchRef}
                    className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none"
                    placeholder={t("searchSymbol")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="text-zinc-600 hover:text-zinc-400">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Search results — flat list across all categories */}
                {searchResults ? (
                  <div className="py-1 max-h-72 overflow-y-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => { setSymbol(s.value); setOpen(false); }}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-2 text-xs transition-colors",
                            symbol === s.value
                              ? "text-indigo-300 bg-indigo-500/10 font-semibold"
                              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                          )}
                        >
                          <span>{s.label}</span>
                          <span className="text-[10px] text-zinc-600">{s.cat}</span>
                        </button>
                      ))
                    ) : (
                      <p className="text-center text-[11px] text-zinc-600 py-6">Niciun rezultat pentru „{search}"</p>
                    )}
                  </div>
                ) : (
                  /* Category tabs + filtered list */
                  <>
                    <div className="flex border-b border-zinc-800 overflow-x-auto">
                      {CATS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setCat(c)}
                          className={cn(
                            "shrink-0 text-[10px] font-semibold px-2.5 py-2 transition-colors",
                            cat === c ? "text-indigo-400 bg-indigo-500/10" : "text-zinc-600 hover:text-zinc-400"
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    <div className="py-1 max-h-64 overflow-y-auto">
                      {SYMBOLS.filter((s) => s.cat === cat).map((s) => (
                        <button
                          key={s.value}
                          onClick={() => { setSymbol(s.value); setOpen(false); }}
                          className={cn(
                            "w-full text-left px-4 py-2 text-xs transition-colors",
                            symbol === s.value
                              ? "text-indigo-300 bg-indigo-500/10 font-semibold"
                              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TradingView container — flex-1 umple tot spațiul rămas ── */}
      <div
        ref={containerRef}
        className="tradingview-widget-container flex-1 min-h-0 rounded-xl overflow-hidden"
      />
    </div>
  );
}
