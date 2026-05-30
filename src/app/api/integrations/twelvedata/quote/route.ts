import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBatchQuotes, getQuote, toTDSymbol, TDQuote } from "@/lib/twelvedata";

// Tiny in-memory cache shared across requests/users. Market quotes are not
// user-specific, so caching by symbol set lets the live ticker poll often
// (every page, every few seconds) without burning the TwelveData rate limit.
const QUOTE_CACHE = new Map<string, { at: number; data: Record<string, TDQuote> }>();
const CACHE_TTL_MS = 15_000;

// ── Yahoo Finance fallback (gratuit, fără API key) ────────────────────────────
// Mapare simboluri ticker → Yahoo Finance
const YAHOO_SYM: Record<string, string> = {
  "EUR/USD": "EURUSD=X", "GBP/USD": "GBPUSD=X", "USD/JPY": "USDJPY=X",
  "USD/CHF": "USDCHF=X", "AUD/USD": "AUDUSD=X", "USD/CAD": "USDCAD=X",
  "XAU/USD": "GC=F",     "XAG/USD": "SI=F",
  "BTC/USD": "BTC-USD",  "ETH/USD": "ETH-USD",
};
// Inversă: simbol Yahoo → simbol al nostru
const YAHOO_REV: Record<string, string> = Object.fromEntries(
  Object.entries(YAHOO_SYM).map(([k, v]) => [v, k])
);

async function fetchYahooQuotes(symbols: string[]): Promise<Record<string, TDQuote>> {
  const yahooSyms = symbols.map((s) => YAHOO_SYM[s] ?? s.replace("/", "")).join(",");
  const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(yahooSyms)}&fields=regularMarketPrice,regularMarketChangePercent`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; tradegx/1.0)" },
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });
  if (!res.ok) return {};

  const json = await res.json();
  const results: Array<{
    symbol: string;
    regularMarketPrice?: number;
    regularMarketChangePercent?: number;
  }> = json?.quoteResponse?.result ?? [];

  const out: Record<string, TDQuote> = {};
  for (const q of results) {
    if (q.regularMarketPrice == null) continue;
    const ourSym = YAHOO_REV[q.symbol] ?? q.symbol;
    const pct = q.regularMarketChangePercent ?? 0;
    out[ourSym] = {
      symbol: ourSym,
      name: ourSym,
      price: String(q.regularMarketPrice),
      change: "0",
      percent_change: pct.toFixed(4),
      open: String(q.regularMarketPrice),
      high: String(q.regularMarketPrice),
      low: String(q.regularMarketPrice),
      close: String(q.regularMarketPrice),
      previous_close: String(q.regularMarketPrice),
      is_market_open: true,
      fifty_two_week: { low: "0", high: "0" },
    };
  }
  return out;
}

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

  // 1. Try user's own TwelveData key first (higher rate limits)
  // 2. Fall back to platform key (server-side env var)
  let apiKey: string | null = null;

  const userIntegration = await prisma.userIntegration.findUnique({
    where: { userId_service: { userId: session.user.id, service: "twelvedata" } },
  });

  if (userIntegration?.isActive && userIntegration.apiKey) {
    apiKey = userIntegration.apiKey;
  } else if (process.env.TWELVEDATA_API_KEY) {
    apiKey = process.env.TWELVEDATA_API_KEY;
  }

  // ── Fără TwelveData key: fallback Yahoo Finance (gratuit, fără cheie) ────────
  if (!apiKey) {
    const cacheKey = `yahoo:${symbols.slice().sort().join(",")}`;
    const cached = QUOTE_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return NextResponse.json({ quotes: cached.data, source: "yahoo", cached: true });
    }
    try {
      const yahooResult = await fetchYahooQuotes(symbols);
      if (Object.keys(yahooResult).length > 0) {
        QUOTE_CACHE.set(cacheKey, { at: Date.now(), data: yahooResult });
        return NextResponse.json({ quotes: yahooResult, source: "yahoo" });
      }
    } catch { /* ignoră eroarea, încearcă să returneze ceva util */ }
    return NextResponse.json(
      { error: "Date de piață indisponibile.", code: "NO_KEY" },
      { status: 503 }
    );
  }

  const tdSymbols = symbols.map(toTDSymbol);

  // Serve from cache when fresh (dedupes the live ticker's frequent polls).
  const cacheKey = tdSymbols.slice().sort().join(",");
  const cached = QUOTE_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({ quotes: cached.data, cached: true });
  }

  const result = tdSymbols.length === 1
    ? await getQuote(apiKey, tdSymbols[0]).then((q) => (q ? { [symbols[0]]: q } : {}))
    : await getBatchQuotes(apiKey, tdSymbols);

  // Only cache non-empty responses so a transient upstream failure doesn't
  // freeze the ticker on empty data for the whole TTL window.
  if (Object.keys(result).length > 0) {
    QUOTE_CACHE.set(cacheKey, { at: Date.now(), data: result });
  }

  return NextResponse.json({ quotes: result });
}
