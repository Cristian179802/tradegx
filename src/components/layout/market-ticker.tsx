"use client";

import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Tipuri ───────────────────────────────────────────────────────────────────
interface Tick {
  symbol: string;
  price: string;
  change: string;
  up: boolean;
}

// ── Simboluri dorite ─────────────────────────────────────────────────────────
// Fiecare intrare: [simbol afișat, monedă bază, monedă cotă]
// "baza USD" → rates[cotă]; "cotă USD" → 1 / rates[bază]
const PAIRS: Array<{ sym: string; base: string; quote: string }> = [
  { sym: "EUR/USD", base: "EUR", quote: "USD" },
  { sym: "GBP/USD", base: "GBP", quote: "USD" },
  { sym: "USD/JPY", base: "USD", quote: "JPY" },
  { sym: "USD/CHF", base: "USD", quote: "CHF" },
  { sym: "AUD/USD", base: "AUD", quote: "USD" },
  { sym: "USD/CAD", base: "USD", quote: "CAD" },
  { sym: "XAU/USD", base: "XAU", quote: "USD" },
  { sym: "XAG/USD", base: "XAG", quote: "USD" },
  { sym: "BTC/USD", base: "BTC", quote: "USD" },
  { sym: "ETH/USD", base: "ETH", quote: "USD" },
];

// ── Formatare preț ───────────────────────────────────────────────────────────
function formatPrice(sym: string, n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (sym === "BTC/USD") return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (sym === "ETH/USD") return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (sym.includes("JPY")) return n.toFixed(2);
  if (sym.startsWith("XAU") || sym.startsWith("XAG")) return n.toFixed(2);
  return n.toFixed(4);
}

// ── Derivă prețul dintr-un map de rate (baza USD) ────────────────────────────
// Coinbase v2/exchange-rates?currency=USD returnează câte unități dintr-o
// monedă valorează 1 USD (ex: rates["EUR"] = 0.923 → 1 USD = 0.923 EUR).
function derivePrice(base: string, quote: string, rates: Record<string, string>): number {
  if (base === "USD") {
    // USD/JPY, USD/CHF, USD/CAD → câte unități quote per 1 USD
    const r = Number(rates[quote]);
    return r > 0 ? r : 0;
  }
  if (quote === "USD") {
    // EUR/USD, GBP/USD, XAU/USD, BTC/USD → 1 / (unități base per USD)
    const r = Number(rates[base]);
    return r > 0 ? 1 / r : 0;
  }
  return 0;
}

// ── Componentă ticker item ────────────────────────────────────────────────────
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

// ── Componenta principală ─────────────────────────────────────────────────────
export function MarketTicker() {
  // Inițializare cu placeholder "—" (nu cu valori vechi hardcodate)
  const [ticks, setTicks] = React.useState<Tick[]>(
    PAIRS.map((p) => ({ symbol: p.sym, price: "—", change: "+0.00%", up: true }))
  );
  const [live, setLive]   = React.useState(false);

  // Prețuri de sesiune: prima valoare citită → baza pentru % schimbare
  const sessionOpen = React.useRef<Record<string, number>>({});

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // ── Sursă primară: Coinbase Exchange Rates (gratuit, CORS deschis) ──
        // Un singur apel acoperă forex + metale + crypto.
        // Nu necesită autentificare, funcționează din orice browser.
        const res = await fetch(
          "https://api.coinbase.com/v2/exchange-rates?currency=USD",
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const json = await res.json();
        const rates: Record<string, string> = json?.data?.rates ?? {};
        if (Object.keys(rates).length === 0) return;

        const next: Tick[] = PAIRS.map(({ sym, base, quote }) => {
          const price = derivePrice(base, quote, rates);
          if (!price) return { symbol: sym, price: "—", change: "+0.00%", up: true };

          // Calcul % față de prețul din sesiune (prima citire)
          const open = sessionOpen.current[sym];
          if (!open) sessionOpen.current[sym] = price;
          const pct = open && open > 0 ? ((price - open) / open) * 100 : 0;
          const up  = pct >= 0;

          return {
            symbol: sym,
            price: formatPrice(sym, price),
            change: `${up ? "+" : ""}${pct.toFixed(2)}%`,
            up,
          };
        });

        if (!cancelled) {
          setTicks(next);
          setLive(true);
        }
      } catch {
        /* menține ultimele valori la orice eroare de rețea */
      }
    }

    load();
    const id = setInterval(load, 15_000); // reîncarcă la 15s
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
      {/* Label stânga */}
      <div
        className="shrink-0 flex items-center gap-1.5 px-3 border-r border-indigo-500/20 h-full"
        style={{ background: "rgba(99,102,241,0.08)" }}
        title={live ? "Prețuri live (Coinbase)" : "Se încarcă date live..."}
      >
        <span className="live-dot-indigo" />
        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest whitespace-nowrap">
          Live
        </span>
      </div>

      {/* Bandă derulantă */}
      <div className="flex-1 overflow-hidden">
        <div className="flex animate-ticker whitespace-nowrap gap-0">
          {[...ticks, ...ticks].map((t, i) => (
            <TickerItem key={i} {...t} />
          ))}
        </div>
      </div>

      {/* Degrade dreapta */}
      <div className="shrink-0 w-12 h-full bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none" />
    </div>
  );
}
