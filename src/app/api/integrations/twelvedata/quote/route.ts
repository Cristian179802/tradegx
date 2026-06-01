import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBatchQuotes, getQuote, toTDSymbol, TDQuote } from "@/lib/twelvedata";

// ── Cache cote (distribuit pe instanță Vercel) ───────────────────────────────
const QUOTE_CACHE = new Map<string, { at: number; data: Record<string, TDQuote>; source?: string }>();
const CACHE_TTL_MS = 15_000; // 15 secunde

// Prețuri de referință pentru % zilnic (resetate la fiecare 24h sau la recycle)
const SESSION_OPEN = new Map<string, { price: number; at: number }>();
const SESSION_TTL  = 24 * 60 * 60 * 1000; // 24 ore

function sessionPct(sym: string, price: number): number {
  const entry = SESSION_OPEN.get(sym);
  if (!entry || Date.now() - entry.at > SESSION_TTL) {
    SESSION_OPEN.set(sym, { price, at: Date.now() });
    return 0;
  }
  return entry.price > 0 ? ((price - entry.price) / entry.price) * 100 : 0;
}

function makeQuote(sym: string, price: number, pct: number): TDQuote {
  return {
    symbol: sym, name: sym,
    price: String(price),
    change: "0",
    percent_change: pct.toFixed(4),
    open: String(price), high: String(price),
    low: String(price), close: String(price),
    previous_close: String(price),
    is_market_open: true,
    fifty_two_week: { low: "0", high: "0" },
  };
}

// ── Mapări simboluri ─────────────────────────────────────────────────────────
const YAHOO_CHART: Record<string, string> = {
  "EUR/USD": "EURUSD=X",
  "GBP/USD": "GBPUSD=X",
  "USD/JPY": "USDJPY=X",
  "USD/CHF": "USDCHF=X",
  "AUD/USD": "AUDUSD=X",
  "USD/CAD": "USDCAD=X",
  "XAU/USD": "GC=F",
  "XAG/USD": "SI=F",
  "BTC/USD": "BTC-USD",
  "ETH/USD": "ETH-USD",
};

// ── Sursă 1: Yahoo Finance v8 chart (apeluri individuale paralele) ─────────
// Mult mai stabil decât v7 batch — nu este blocat de Vercel la fel de des.
async function fetchOneYahoo(ourSym: string, yahooSym: string): Promise<TDQuote | null> {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/` +
    `${encodeURIComponent(yahooSym)}?interval=1m&range=1d&includePrePost=false`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json, */*",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;

    const price    = Number(meta.regularMarketPrice);
    const prevClose = Number(meta.chartPreviousClose ?? meta.previousClose ?? price);
    const pct = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;

    return {
      symbol: ourSym, name: ourSym,
      price: String(price),
      change: String(price - prevClose),
      percent_change: pct.toFixed(4),
      open: String(meta.regularMarketOpen ?? price),
      high: String(meta.regularMarketDayHigh ?? price),
      low: String(meta.regularMarketDayLow ?? price),
      close: String(price),
      previous_close: String(prevClose),
      is_market_open: true,
      fifty_two_week: { low: "0", high: "0" },
    };
  } catch {
    return null;
  }
}

async function fetchYahooQuotes(symbols: string[]): Promise<Record<string, TDQuote>> {
  const pairs = await Promise.all(
    symbols.map(async (sym) => {
      const ySym = YAHOO_CHART[sym];
      if (!ySym) return [sym, null] as const;
      return [sym, await fetchOneYahoo(sym, ySym)] as const;
    })
  );
  const out: Record<string, TDQuote> = {};
  for (const [sym, q] of pairs) if (q) out[sym] = q;
  return out;
}

// ── Sursă 2: open.er-api.com + Coinbase (complet gratuit, fără cheie) ────────
// Fallback dacă Yahoo Finance este blocat de pe IP Vercel.
async function fetchFreeQuotes(symbols: string[]): Promise<Record<string, TDQuote>> {
  const out: Record<string, TDQuote> = {};

  // Forex + Metale: open.er-api.com (gratuit, fără autentificare)
  const fxSyms = symbols.filter((s) => !["BTC/USD", "ETH/USD"].includes(s));
  if (fxSyms.length > 0) {
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD", {
        headers: { "User-Agent": "tradegx/1.0" },
        signal: AbortSignal.timeout(8_000),
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result === "success") {
          const rates: Record<string, number> = data.rates ?? {};
          for (const sym of fxSyms) {
            const [base, quote] = sym.split("/");
            let price = 0;
            if (base === "USD") price = rates[quote] ?? 0;
            else if (quote === "USD") price = rates[base] ? 1 / rates[base] : 0;
            if (!price || !Number.isFinite(price)) continue;
            const pct = sessionPct(sym, price);
            out[sym] = makeQuote(sym, price, pct);
          }
        }
      }
    } catch { /* ignoră */ }
  }

  // Crypto: Coinbase public API (real-time, gratuit, fără cheie)
  const cryptoSyms = symbols.filter((s) => ["BTC/USD", "ETH/USD"].includes(s));
  await Promise.all(
    cryptoSyms.map(async (sym) => {
      const [base] = sym.split("/");
      try {
        const r = await fetch(
          `https://api.coinbase.com/v2/prices/${base}-USD/spot`,
          { signal: AbortSignal.timeout(5_000), cache: "no-store" }
        );
        if (!r.ok) return;
        const d = await r.json();
        const price = Number(d?.data?.amount);
        if (!price || !Number.isFinite(price)) return;
        const pct = sessionPct(sym, price);
        out[sym] = makeQuote(sym, price, pct);
      } catch { /* ignoră */ }
    })
  );

  return out;
}

// ── Handler GET ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const symbols = searchParams.get("symbols")?.split(",").filter(Boolean) ?? [];
  if (!symbols.length) {
    return NextResponse.json({ error: "Specifică cel puțin un simbol" }, { status: 400 });
  }

  // Determină cheia API TwelveData (utilizator → platformă → lipsă)
  let apiKey: string | null = null;
  const userIntegration = await prisma.userIntegration.findUnique({
    where: { userId_service: { userId: session.user.id, service: "twelvedata" } },
  });
  if (userIntegration?.isActive && userIntegration.apiKey) {
    apiKey = userIntegration.apiKey;
  } else if (process.env.TWELVEDATA_API_KEY) {
    apiKey = process.env.TWELVEDATA_API_KEY;
  }

  // ── Fără cheie TwelveData: surse gratuite ────────────────────────────────
  if (!apiKey) {
    const cacheKey = `free:${symbols.slice().sort().join(",")}`;
    const cached = QUOTE_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return NextResponse.json({ quotes: cached.data, source: cached.source ?? "yahoo", cached: true });
    }

    // Încearcă mai întâi Yahoo Finance v8 chart (are % zilnic real)
    const yahooResult = await fetchYahooQuotes(symbols);
    let source = "yahoo";

    // Dacă Yahoo a returnat < 50% din simboluri → fallback complet gratuit
    if (Object.keys(yahooResult).length < Math.ceil(symbols.length * 0.5)) {
      const freeResult = await fetchFreeQuotes(symbols);
      for (const [sym, q] of Object.entries(freeResult)) {
        if (!yahooResult[sym]) yahooResult[sym] = q;
      }
      if (Object.keys(freeResult).length > Object.keys(yahooResult).length / 2) {
        source = "open-er";
      }
    }

    if (Object.keys(yahooResult).length > 0) {
      QUOTE_CACHE.set(cacheKey, { at: Date.now(), data: yahooResult, source });
      return NextResponse.json({ quotes: yahooResult, source });
    }

    return NextResponse.json(
      { error: "Date de piață indisponibile. Configurați o cheie TwelveData sau verificați conexiunea.", code: "NO_DATA" },
      { status: 503 }
    );
  }

  // ── TwelveData (cheie disponibilă) ────────────────────────────────────────
  const tdSymbols = symbols.map(toTDSymbol);
  const cacheKey  = tdSymbols.slice().sort().join(",");
  const cached    = QUOTE_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({ quotes: cached.data, cached: true });
  }

  const result =
    tdSymbols.length === 1
      ? await getQuote(apiKey, tdSymbols[0]).then((q) => (q ? { [symbols[0]]: q } : {}))
      : await getBatchQuotes(apiKey, tdSymbols);

  if (Object.keys(result).length > 0) {
    QUOTE_CACHE.set(cacheKey, { at: Date.now(), data: result });
  }

  return NextResponse.json({ quotes: result });
}
