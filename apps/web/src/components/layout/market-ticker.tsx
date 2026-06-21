"use client";

import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tick {
  symbol: string;
  price: string;
  change: string;
  up: boolean;
}

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

function formatPrice(sym: string, n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (sym === "BTC/USD") return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (sym === "ETH/USD") return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (sym.includes("JPY")) return n.toFixed(2);
  if (sym.startsWith("XAU") || sym.startsWith("XAG")) return n.toFixed(2);
  return n.toFixed(4);
}

// open.er-api.com returnează câte unități dintr-o monedă = 1 USD
// EUR: 0.923 → EUR/USD = 1/0.923 = 1.0833
// JPY: 157  → USD/JPY = 157
function deriveFromER(base: string, quote: string, rates: Record<string, number>): number {
  if (base === "USD") return rates[quote] ?? 0;
  if (quote === "USD") {
    const r = rates[base];
    return r && r > 0 ? 1 / r : 0;
  }
  return 0;
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
  const [ticks, setTicks] = React.useState<Tick[]>(
    PAIRS.map((p) => ({ symbol: p.sym, price: "—", change: "+0.00%", up: true }))
  );
  const [live, setLive] = React.useState(false);
  const sessionOpen = React.useRef<Record<string, number>>({});

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // ── 4 surse paralele din browser (fără IP Vercel, fără blocare) ──────
        const [erRes, bnRes, xauRes, xagRes] = await Promise.allSettled([
          // 1. Forex: open.er-api.com — gratuit, CORS, fără cheie
          fetch("https://open.er-api.com/v6/latest/USD", {
            cache: "no-store",
            signal: AbortSignal.timeout(8_000),
          }).then((r) => (r.ok ? r.json() : null)),

          // 2. Crypto: Binance — real-time, CORS, fără cheie
          fetch(
            'https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT"]',
            { cache: "no-store", signal: AbortSignal.timeout(6_000) }
          ).then((r) => (r.ok ? r.json() : null)),

          // 3. Aur (XAU): Bybit futures publice — real-time, CORS
          fetch(
            "https://api.bybit.com/v5/market/tickers?category=linear&symbol=XAUUSDT",
            { cache: "no-store", signal: AbortSignal.timeout(6_000) }
          ).then((r) => (r.ok ? r.json() : null)),

          // 4. Argint (XAG): Bybit futures publice — real-time, CORS
          fetch(
            "https://api.bybit.com/v5/market/tickers?category=linear&symbol=XAGUSD",
            { cache: "no-store", signal: AbortSignal.timeout(6_000) }
          ).then((r) => (r.ok ? r.json() : null)),
        ]);

        // ── Parsare rezultate ─────────────────────────────────────────────────

        // Forex rates (EUR, GBP, JPY, CHF, AUD, CAD per 1 USD)
        const erData = erRes.status === "fulfilled" ? erRes.value : null;
        const erRates: Record<string, number> = {};
        if (erData?.result === "success" && erData.rates) {
          for (const [k, v] of Object.entries(erData.rates as Record<string, unknown>)) {
            const n = Number(v);
            if (Number.isFinite(n) && n > 0) erRates[k] = n;
          }
        }

        // Crypto (BTC/ETH cu % 24h real)
        const bnData = bnRes.status === "fulfilled" ? bnRes.value : null;
        const bnPrices: Record<string, { price: number; pct: number }> = {};
        if (Array.isArray(bnData)) {
          for (const t of bnData as Array<{ symbol: string; lastPrice: string; priceChangePercent: string }>) {
            const ourSym =
              t.symbol === "BTCUSDT" ? "BTC/USD" :
              t.symbol === "ETHUSDT" ? "ETH/USD" : null;
            if (!ourSym) continue;
            const price = Number(t.lastPrice);
            const pct   = Number(t.priceChangePercent);
            if (price > 0) bnPrices[ourSym] = { price, pct };
          }
        }

        // XAU din Bybit (lastPrice + price24hPcnt)
        const xauData = xauRes.status === "fulfilled" ? xauRes.value : null;
        const xauTicker = xauData?.result?.list?.[0];
        const xauPrice  = xauTicker ? Number(xauTicker.lastPrice)    : 0;
        const xauPct    = xauTicker ? Number(xauTicker.price24hPcnt) * 100 : 0;

        // XAG din Bybit — încearcă XAGUSD, dacă nu există încearcă XAGUSDT
        const xagData = xagRes.status === "fulfilled" ? xagRes.value : null;
        const xagTicker = xagData?.result?.list?.[0];
        const xagPrice  = xagTicker ? Number(xagTicker.lastPrice)    : 0;
        const xagPct    = xagTicker ? Number(xagTicker.price24hPcnt) * 100 : 0;

        // Metalele din Bybit → injectează în erRates pentru procesare uniformă
        // (cu prețuri inverse: rates["XAU"] = 1/price, astfel deriveFromER întoarce price)
        if (xauPrice > 0) erRates["__XAU_PRICE__"] = xauPrice;
        if (xagPrice > 0) erRates["__XAG_PRICE__"] = xagPrice;

        const anyData =
          Object.keys(erRates).length > 0 ||
          Object.keys(bnPrices).length > 0;
        if (!anyData) return;

        // ── Construiește tick-urile ───────────────────────────────────────────
        const next: Tick[] = PAIRS.map(({ sym, base, quote }) => {
          let price = 0;
          let pct   = 0;

          if (sym === "BTC/USD" || sym === "ETH/USD") {
            // Crypto → Binance (real-time, % 24h autentic)
            const bn = bnPrices[sym];
            if (bn) { price = bn.price; pct = bn.pct; }

          } else if (sym === "XAU/USD") {
            // Aur → Bybit (real-time, % 24h autentic)
            if (xauPrice > 0) { price = xauPrice; pct = xauPct; }
            else {
              // Fallback: open.er-api dacă trimite XAU
              price = deriveFromER(base, quote, erRates);
              const open = sessionOpen.current[sym];
              if (!open && price > 0) sessionOpen.current[sym] = price;
              pct = open && open > 0 ? ((price - open) / open) * 100 : 0;
            }

          } else if (sym === "XAG/USD") {
            // Argint → Bybit (real-time, % 24h autentic)
            if (xagPrice > 0) { price = xagPrice; pct = xagPct; }
            else {
              price = deriveFromER(base, quote, erRates);
              const open = sessionOpen.current[sym];
              if (!open && price > 0) sessionOpen.current[sym] = price;
              pct = open && open > 0 ? ((price - open) / open) * 100 : 0;
            }

          } else {
            // Forex → open.er-api (actualizare zilnică, date corecte)
            price = deriveFromER(base, quote, erRates);
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
      <div
        className="shrink-0 flex items-center gap-1.5 px-3 border-r border-indigo-500/20 h-full"
        style={{ background: "rgba(99,102,241,0.08)" }}
        title={
          live
            ? "Forex: ExchangeRate API · Metale: Bybit · Crypto: Binance"
            : "Se încarcă date live..."
        }
      >
        <span className="live-dot-indigo" />
        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest whitespace-nowrap">
          Live
        </span>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex animate-ticker whitespace-nowrap gap-0">
          {[...ticks, ...ticks].map((t, i) => (
            <TickerItem key={i} {...t} />
          ))}
        </div>
      </div>

      <div className="shrink-0 w-12 h-full bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none" />
    </div>
  );
}
