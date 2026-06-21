// TwelveData REST client — server-side only

const BASE = "https://api.twelvedata.com";

export interface TDQuote {
  symbol: string;
  name: string;
  price: string;
  change: string;
  percent_change: string;
  open: string;
  high: string;
  low: string;
  close: string;
  previous_close: string;
  is_market_open: boolean;
  fifty_two_week: { low: string; high: string };
}

export interface TDCandle {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

// Validate an API key by making a lightweight quote request
export async function validateKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/quote?symbol=EUR/USD&apikey=${apiKey}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status !== "error" && !!data.price;
  } catch {
    return false;
  }
}

// Get a real-time quote for one symbol
export async function getQuote(apiKey: string, symbol: string): Promise<TDQuote | null> {
  try {
    const res = await fetch(
      `${BASE}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}&format=JSON`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === "error") return null;
    return data as TDQuote;
  } catch {
    return null;
  }
}

// Get multiple quotes at once (batch)
export async function getBatchQuotes(
  apiKey: string,
  symbols: string[]
): Promise<Record<string, TDQuote>> {
  if (!symbols.length) return {};
  try {
    const res = await fetch(
      `${BASE}/quote?symbol=${symbols.map(encodeURIComponent).join(",")}&apikey=${apiKey}&format=JSON`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return {};
    const data = await res.json();
    if (data.status === "error") return {};
    // Single symbol returns object, multiple returns array
    if (Array.isArray(data)) {
      return Object.fromEntries(data.map((q: TDQuote) => [q.symbol, q]));
    }
    if (data.symbol) {
      return { [data.symbol]: data };
    }
    return data as Record<string, TDQuote>;
  } catch {
    return {};
  }
}

// Interval map: TradeGX → TwelveData
const INTERVAL_MAP: Record<string, string> = {
  M1: "1min", M5: "5min", M15: "15min", M30: "30min",
  H1: "1h", H4: "4h", D1: "1day", W1: "1week", MN1: "1month",
};

export function toTDInterval(interval: string): string {
  return INTERVAL_MAP[interval] ?? interval;
}

// Get OHLCV candles
export async function getTimeSeries(
  apiKey: string,
  symbol: string,
  interval: string,
  outputsize: number = 200
): Promise<TDCandle[]> {
  const tdInterval = toTDInterval(interval);
  try {
    const res = await fetch(
      `${BASE}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${tdInterval}&outputsize=${outputsize}&apikey=${apiKey}&format=JSON`,
      { signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status === "error") return [];
    return (data.values ?? []) as TDCandle[];
  } catch {
    return [];
  }
}

// Symbol mapping for common forex/metals symbols → TwelveData format
export function toTDSymbol(symbol: string): string {
  // Already in correct format (EUR/USD) → use as-is
  if (symbol.includes("/")) return symbol;
  // MT4/MT5 format EURUSD → EUR/USD
  if (symbol.length === 6 && /^[A-Z]{6}$/.test(symbol)) {
    return `${symbol.slice(0, 3)}/${symbol.slice(3)}`;
  }
  // Metals
  if (symbol.startsWith("XAU")) return "XAU/USD";
  if (symbol.startsWith("XAG")) return "XAG/USD";
  // Crypto
  if (symbol.endsWith("USD") && symbol.length > 6) {
    return `${symbol.slice(0, -3)}/USD`;
  }
  return symbol;
}
