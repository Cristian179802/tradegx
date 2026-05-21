"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Globe, Search, ChevronDown, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface WatchlistItem {
  id: string;
  symbol: string;
  instrumentType: string;
  groupName: string | null;
}

const POPULAR: { symbol: string; instrumentType: string; group: string }[] = [
  // ── Forex Majors ──
  { symbol: "EURUSD", instrumentType: "FOREX", group: "Forex Majors" },
  { symbol: "GBPUSD", instrumentType: "FOREX", group: "Forex Majors" },
  { symbol: "USDJPY", instrumentType: "FOREX", group: "Forex Majors" },
  { symbol: "USDCHF", instrumentType: "FOREX", group: "Forex Majors" },
  { symbol: "AUDUSD", instrumentType: "FOREX", group: "Forex Majors" },
  { symbol: "NZDUSD", instrumentType: "FOREX", group: "Forex Majors" },
  { symbol: "USDCAD", instrumentType: "FOREX", group: "Forex Majors" },
  // ── Forex EUR Crosses ──
  { symbol: "EURGBP", instrumentType: "FOREX", group: "EUR Crosses" },
  { symbol: "EURJPY", instrumentType: "FOREX", group: "EUR Crosses" },
  { symbol: "EURCAD", instrumentType: "FOREX", group: "EUR Crosses" },
  { symbol: "EURAUD", instrumentType: "FOREX", group: "EUR Crosses" },
  { symbol: "EURNZD", instrumentType: "FOREX", group: "EUR Crosses" },
  { symbol: "EURCHF", instrumentType: "FOREX", group: "EUR Crosses" },
  // ── Forex GBP Crosses ──
  { symbol: "GBPJPY", instrumentType: "FOREX", group: "GBP Crosses" },
  { symbol: "GBPCAD", instrumentType: "FOREX", group: "GBP Crosses" },
  { symbol: "GBPAUD", instrumentType: "FOREX", group: "GBP Crosses" },
  { symbol: "GBPNZD", instrumentType: "FOREX", group: "GBP Crosses" },
  { symbol: "GBPCHF", instrumentType: "FOREX", group: "GBP Crosses" },
  // ── Forex AUD/NZD/CAD Crosses ──
  { symbol: "AUDJPY", instrumentType: "FOREX", group: "AUD/NZD/CAD Crosses" },
  { symbol: "AUDCAD", instrumentType: "FOREX", group: "AUD/NZD/CAD Crosses" },
  { symbol: "AUDNZD", instrumentType: "FOREX", group: "AUD/NZD/CAD Crosses" },
  { symbol: "AUDCHF", instrumentType: "FOREX", group: "AUD/NZD/CAD Crosses" },
  { symbol: "NZDJPY", instrumentType: "FOREX", group: "AUD/NZD/CAD Crosses" },
  { symbol: "NZDCAD", instrumentType: "FOREX", group: "AUD/NZD/CAD Crosses" },
  { symbol: "NZDCHF", instrumentType: "FOREX", group: "AUD/NZD/CAD Crosses" },
  { symbol: "CADJPY", instrumentType: "FOREX", group: "AUD/NZD/CAD Crosses" },
  { symbol: "CADCHF", instrumentType: "FOREX", group: "AUD/NZD/CAD Crosses" },
  { symbol: "CHFJPY", instrumentType: "FOREX", group: "AUD/NZD/CAD Crosses" },
  // ── Metale ──
  { symbol: "XAUUSD", instrumentType: "METALS", group: "Metale" },
  { symbol: "XAGUSD", instrumentType: "METALS", group: "Metale" },
  { symbol: "XPTUSD", instrumentType: "METALS", group: "Metale" },
  // ── Energie ──
  { symbol: "USOIL", instrumentType: "COMMODITIES", group: "Energie" },
  { symbol: "UKOIL", instrumentType: "COMMODITIES", group: "Energie" },
  // ── Indici ──
  { symbol: "US30",   instrumentType: "INDICES", group: "Indici" },
  { symbol: "US500",  instrumentType: "INDICES", group: "Indici" },
  { symbol: "NAS100", instrumentType: "INDICES", group: "Indici" },
  { symbol: "GER40",  instrumentType: "INDICES", group: "Indici" },
  { symbol: "UK100",  instrumentType: "INDICES", group: "Indici" },
  { symbol: "FRA40",  instrumentType: "INDICES", group: "Indici" },
  { symbol: "JPN225", instrumentType: "INDICES", group: "Indici" },
  { symbol: "AUS200", instrumentType: "INDICES", group: "Indici" },
  { symbol: "HKG50",  instrumentType: "INDICES", group: "Indici" },
  { symbol: "ESP35",  instrumentType: "INDICES", group: "Indici" },
  // ── Acțiuni ──
  { symbol: "AAPL",  instrumentType: "STOCKS", group: "Acțiuni" },
  { symbol: "MSFT",  instrumentType: "STOCKS", group: "Acțiuni" },
  { symbol: "GOOGL", instrumentType: "STOCKS", group: "Acțiuni" },
  { symbol: "AMZN",  instrumentType: "STOCKS", group: "Acțiuni" },
  { symbol: "TSLA",  instrumentType: "STOCKS", group: "Acțiuni" },
  { symbol: "NVDA",  instrumentType: "STOCKS", group: "Acțiuni" },
  { symbol: "META",  instrumentType: "STOCKS", group: "Acțiuni" },
  { symbol: "NFLX",  instrumentType: "STOCKS", group: "Acțiuni" },
  { symbol: "AMD",   instrumentType: "STOCKS", group: "Acțiuni" },
  { symbol: "ORCL",  instrumentType: "STOCKS", group: "Acțiuni" },
  { symbol: "CRM",   instrumentType: "STOCKS", group: "Acțiuni" },
  { symbol: "BABA",  instrumentType: "STOCKS", group: "Acțiuni" },
  // ── Crypto Top 50 ──
  { symbol: "BTCUSD",   instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "ETHUSD",   instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "BNBUSD",   instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "SOLUSD",   instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "XRPUSD",   instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "ADAUSD",   instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "AVAXUSD",  instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "DOTUSD",   instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "LINKUSD",  instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "MATICUSD", instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "UNIUSD",   instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "LTCUSD",   instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "BCHUSD",   instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "ATOMUSD",  instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "NEARUSD",  instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "DOGEUSD",  instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "SHIBUSD",  instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "FTMUSD",   instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "ALGOUSD",  instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "VETUSD",   instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "SANDUSD",  instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "MANAUSD",  instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "APEUSD",   instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "OPUSD",    instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "ARBUSD",   instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "INJUSD",   instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "SUIUSD",   instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "TIAUSD",   instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "SEIUSD",   instrumentType: "CRYPTO", group: "Crypto" },
  { symbol: "APTUSDT",  instrumentType: "CRYPTO", group: "Crypto" },
];

const CATEGORIES = ["Toate", "FOREX", "METALS", "INDICES", "STOCKS", "CRYPTO", "COMMODITIES"];

const INSTR_COLORS: Record<string, string> = {
  FOREX:       "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  METALS:      "text-amber-400 bg-amber-500/10 border-amber-500/20",
  INDICES:     "text-sky-400 bg-sky-500/10 border-sky-500/20",
  CRYPTO:      "text-violet-400 bg-violet-500/10 border-violet-500/20",
  STOCKS:      "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  CFD:         "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
  COMMODITIES: "text-orange-400 bg-orange-500/10 border-orange-500/20",
};

export function MarketClient({ initial }: { initial: WatchlistItem[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = React.useState<WatchlistItem[]>(initial);
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("Toate");
  const [adding, setAdding] = React.useState<string | null>(null);
  const [customSymbol, setCustomSymbol] = React.useState("");
  const [customType, setCustomType] = React.useState("FOREX");
  const [showCustom, setShowCustom] = React.useState(false);

  const symbolSet = new Set(items.map((i) => i.symbol));

  function openChart(symbol: string) {
    router.push(`/charts?symbol=${symbol}`);
  }

  async function addSymbol(symbol: string, instrumentType: string, groupName: string | null) {
    setAdding(symbol);
    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, instrumentType, groupName }),
    });
    if (res.ok) {
      const item = await res.json();
      setItems((prev) => [...prev, item]);
      toast({ title: `${symbol} adăugat în watchlist` });
    } else {
      const err = await res.json();
      toast({ title: "Eroare", description: err.error, variant: "destructive" });
    }
    setAdding(null);
  }

  async function removeSymbol(id: string, symbol: string) {
    const res = await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast({ title: `${symbol} eliminat` });
    }
  }

  const grouped = items.reduce<Record<string, WatchlistItem[]>>((acc, item) => {
    const key = item.groupName ?? item.instrumentType;
    (acc[key] ??= []).push(item);
    return acc;
  }, {});

  const filteredPopular = POPULAR.filter((p) => {
    const matchesSearch = p.symbol.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "Toate" || p.instrumentType === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── Watchlist ── */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-indigo-500/15 bg-zinc-900/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                <Globe className="h-3.5 w-3.5 text-indigo-400" />
              </div>
              Watchlist-ul meu
              <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded-full">{items.length}</span>
            </h2>
            <span className="text-[11px] text-zinc-600">Click pe simbol → grafic</span>
          </div>

          {items.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              Niciun simbol adăugat. Alege din lista de mai jos.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {Object.entries(grouped).map(([group, groupItems]) => (
                <div key={group}>
                  <div className="px-5 py-2 bg-zinc-900/80">
                    <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{group}</p>
                  </div>
                  {groupItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-5 py-3 hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                      onClick={() => openChart(item.symbol)}
                    >
                      <div className="flex items-center gap-3">
                        <LineChart className="h-3.5 w-3.5 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                        <span className="text-sm font-semibold text-zinc-100 group-hover:text-indigo-300 transition-colors neon-on-hover">
                          {item.symbol}
                        </span>
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border", INSTR_COLORS[item.instrumentType] ?? INSTR_COLORS.CFD)}>
                          {item.instrumentType}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); removeSymbol(item.id, item.symbol); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom add */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-4">
          <button
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 w-full"
            onClick={() => setShowCustom((v) => !v)}
          >
            <Plus className="h-4 w-4" />
            Adaugă simbol custom
            <ChevronDown className={cn("h-3.5 w-3.5 ml-auto transition-transform", showCustom && "rotate-180")} />
          </button>
          {showCustom && (
            <div className="mt-3 flex gap-2">
              <input
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                placeholder="Ex: GBPJPY"
                value={customSymbol}
                onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
              />
              <select
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-zinc-300 focus:outline-none"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
              >
                {["FOREX", "METALS", "INDICES", "CRYPTO", "STOCKS", "COMMODITIES", "CFD"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <Button
                size="sm"
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shrink-0 shadow-md shadow-indigo-500/20"
                onClick={() => {
                  if (customSymbol.trim()) {
                    addSymbol(customSymbol.trim(), customType, null);
                    setCustomSymbol("");
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Simboluri populare ── */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-zinc-800 space-y-3">
          <h2 className="text-sm font-bold text-zinc-200">Simboluri disponibile</h2>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              placeholder="Caută simbol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {/* Category tabs */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "text-[11px] px-2.5 py-1 rounded-xl border transition-all duration-150",
                  category === cat
                    ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-semibold"
                    : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable list */}
        <div className="overflow-y-auto divide-y divide-zinc-800/50" style={{ maxHeight: "520px" }}>
          {filteredPopular.length === 0 ? (
            <div className="py-10 text-center text-zinc-500 text-sm">Niciun rezultat</div>
          ) : (
            filteredPopular.map((p) => {
              const inList = symbolSet.has(p.symbol);
              return (
                <div key={p.symbol} className="flex items-center justify-between px-5 py-2.5 hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-zinc-100">{p.symbol}</span>
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border", INSTR_COLORS[p.instrumentType] ?? INSTR_COLORS.CFD)}>
                      {p.instrumentType}
                    </span>
                    <span className="text-xs text-zinc-600">{p.group}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-7 text-xs",
                      inList
                        ? "border-zinc-700 text-zinc-600 cursor-default"
                        : "border-zinc-700 text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/50"
                    )}
                    disabled={inList || adding === p.symbol}
                    onClick={() => !inList && addSymbol(p.symbol, p.instrumentType, p.group)}
                  >
                    {inList ? "Adăugat" : adding === p.symbol ? "..." : <Plus className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
