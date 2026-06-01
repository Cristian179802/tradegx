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

// ── Simboluri: [afișat, baza, cotă] ──────────────────────────────────────────
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

const CRYPTO_SYMS = new Set(["BTC/USD", "ETH/USD"]);

// ── Formatare preț ───────────────────────────────────────────────────────────
function formatPrice(sym: string, n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (sym === "BTC/USD") return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (sym === "ETH/USD") return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (sym.includes("JPY")) return n.toFixed(2);
  if (sym.startsWith("XAU") || sym.startsWith("XAG")) return n.toFixed(2);
  return n.toFixed(4);
}

// ── Derivă prețul din ratele open.er-api (baza USD) ─────────────────────────
// open.er-api.com/v6/latest/USD → rates[code] = câte unități dintr-o monedă
// valorează 1 USD (ex: rates["EUR"] = 0.923 → 1 USD = 0.923 EUR).
function deriveFromER(base: string, quote: string, rates: Record<string, number>): number {
  if (base === "USD") {
    // USD/JPY, USD/CHF, USD/CAD → direct rate[quote]
    return rates[quote] ?? 0;
  }
  if (quote === "USD") {
    // EUR/USD, GBP/USD, XAU/USD, XAG/USD → inversul ratei bazei
    const r = rates[base];
    return r && r > 0 ? 1 / r : 0;
  }
  return 0;
}

// ── Componentă tick ──────────────────────────────────────────────────────────
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

// ── Ticker principal ─────────────────────────────────────────────────────────
export function MarketTicker() {
  const [ticks, setTicks] = React.useState<Tick[]>(
    PAIRS.map((p) => ({ symbol: p.sym, price: "—", change: "+0.00%", up: true }))
  );
  const [live, setLive] = React.useState(false);

  // Prețuri de sesiune pentru calculul % zilnic pe forex/metale
  const sessionOpen = React.useRef<Record<string, number>>({});

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // ── Fetch paralel: open.er-api (forex + metale) + Binance (crypto) ──
        const [erSettled, bnSettled] = await Promise.allSettled([
          // Sursă 1: open.er-api.com — gratuit, CORS, forex + XAU + XAG
          fetch("https://open.er-api.com/v6/latest/USD", {
            cache: "no-store",
            signal: AbortSignal.timeout(8_000),
          }).then((r) => (r.ok ? r.json() : null)),

          // Sursă 2: Binance — real-time, CORS, BTC/ETH cu % 24h real
          fetch(
            'https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT"]',
            { cache: "no-store", signal: AbortSignal.timeout(6_000) }
          ).then((r) => (r.ok ? r.json() : null)),
        ]);

        const erData = erSettled.status === "fulfilled" ? erSettled.value : null;
        const bnData = bnSettled.status === "fulfilled" ? bnSettled.value : null;

        // Ratele ExchangeRate (număr, nu string)
        const erRates: Record<string, number> = {};
        if (erData?.result === "success" && erData.rates) {
          for (const [k, v] of Object.entries(erData.rates as Record<string, unknown>)) {
            const n = Number(v);
            if (Number.isFinite(n) && n > 0) erRates[k] = n;
          }
        }

        // Prețuri Binance
        const bnPrices: Record<string, { price: number; pct: number }> = {};
        if (Array.isArray(bnData)) {
          for (const t of bnData as Array<{ symbol: string; lastPrice: string; priceChangePercent: string }>) {
            const ourSym = t.symbol === "BTCUSDT" ? "BTC/USD" : t.symbol === "ETHUSDT" ? "ETH/USD" : null;
            if (!ourSym) continue;
            const price = Number(t.lastPrice);
            const pct   = Number(t.priceChangePercent);
            if (price > 0) bnPrices[ourSym] = { price, pct };
          }
        }

        // Construim tick-urile
        const anyData = Object.keys(erRates).length > 0 || Object.keys(bnPrices).length > 0;
        if (!anyData) return;

        const next: Tick[] = PAIRS.map(({ sym, base, quote }) => {
          let price = 0;
          let pct   = 0;

          if (CRYPTO_SYMS.has(sym) && bnPrices[sym]) {
            // Crypto: folosim Binance (real-time + % 24h autentic)
            price = bnPrices[sym].price;
            pct   = bnPrices[sym].pct;
          } else if (Object.keys(erRates).length > 0) {
            // Forex + metale: open.er-api (actualizare zilnică, date corecte)
            price = deriveFromER(base, quote, erRates);
            // % față de prețul de sesiune (primul preț văzut azi)
            const open = sessionOpen.current[sym];
            if (!open && price > 0) sessionOpen.current[sym] = price;
            pct = open && open > 0 ? ((price - open) / open) * 100 : 0;
          }

          if (!price || !Number.isFinite(price)) {
            return { symbol: sym, price: "—", change: "+0.00%", up: true };
          }

          const up = pct >= 0;
          return {
            symbol: sym,
            price:  formatPrice(sym, price),
            change: `${up ? "+" : ""}${pct.toFixed(2)}%`,
            up,
          };
        });

        if (!cancelled) {
          setTicks(next);
          setLive(true);
        }
      } catch {
        /* menține ultimele valori la eroare de rețea */
      }
    }

    load();
    const id = setInterval(load, 15_000);
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
        title={
          live
            ? "Prețuri live — Forex/Metale: ExchangeRate API · Crypto: Binance"
            : "Se încarcă date live..."
        }
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
