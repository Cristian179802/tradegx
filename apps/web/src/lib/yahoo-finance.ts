// ─── Yahoo Finance Historical Data Fetcher ────────────────────────────────────
// Supports crumb-based session auth + graceful fallback (no crumb needed in
// server-to-server context; crumb is a browser-only anti-scraping measure).

export interface Candle {
  time: number; // Unix ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ─── Symbol & interval maps ───────────────────────────────────────────────────

const SYMBOL_MAP: Record<string, string> = {
  EURUSD: "EURUSD=X", GBPUSD: "GBPUSD=X", USDJPY: "USDJPY=X",
  USDCHF: "USDCHF=X", AUDUSD: "AUDUSD=X", NZDUSD: "NZDUSD=X",
  USDCAD: "USDCAD=X", EURGBP: "EURGBP=X", EURJPY: "EURJPY=X",
  GBPJPY: "GBPJPY=X", EURCAD: "EURCAD=X", AUDCAD: "AUDCAD=X",
  AUDNZD: "AUDNZD=X", EURCHF: "EURCHF=X", GBPCHF: "GBPCHF=X",
  EURAUD: "EURAUD=X", GBPAUD: "GBPAUD=X", CADJPY: "CADJPY=X",
  CHFJPY: "CHFJPY=X", NZDJPY: "NZDJPY=X", GBPNZD: "GBPNZD=X",
  XAUUSD: "GC=F", XAGUSD: "SI=F", XPTUSD: "PL=F",
  US30: "YM=F", NAS100: "NQ=F", SP500: "ES=F", US2000: "RTY=F",
  BTCUSD: "BTC-USD", ETHUSD: "ETH-USD",
  BNBUSD: "BNB-USD", SOLUSD: "SOL-USD", XRPUSD: "XRP-USD",
  CRUDE: "CL=F", BRENT: "BZ=F", NATGAS: "NG=F",
};

const INTERVAL_MAP: Record<string, { yahoo: string; maxDays: number }> = {
  M5:  { yahoo: "5m",  maxDays: 55  },
  M15: { yahoo: "15m", maxDays: 55  },
  M30: { yahoo: "30m", maxDays: 55  },
  H1:  { yahoo: "1h",  maxDays: 700 },
  H4:  { yahoo: "1h",  maxDays: 700 },
  D1:  { yahoo: "1d",  maxDays: 3600 },
  W1:  { yahoo: "1wk", maxDays: 3600 },
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ─── Session / crumb cache ────────────────────────────────────────────────────

interface YahooCred { crumb: string; cookie: string; expiresAt: number; }
let _cred: YahooCred | null = null;
let _credFetchedAt = 0;
const CRED_RETRY_INTERVAL = 5 * 60 * 1000; // retry crumb every 5 min if previously failed

/**
 * Attempt to get a crumb + session cookie.
 * Falls back to empty strings — the v8/finance/chart endpoint works without
 * them from a server-to-server context (crumb is a browser anti-scraping measure).
 */
async function getCredentials(): Promise<{ crumb: string; cookie: string }> {
  // Return cached valid credentials
  if (_cred && _cred.expiresAt > Date.now()) return _cred;

  // Don't hammer the consent endpoint; if it keeps failing, use empty creds
  if (!_cred && Date.now() - _credFetchedAt < CRED_RETRY_INTERVAL) {
    return { crumb: "", cookie: "" };
  }

  _credFetchedAt = Date.now();

  try {
    // 1. Hit the finance home page to get a session cookie
    //    Note: In GDPR regions, Yahoo redirects to consent.yahoo.com so no
    //    cookies are set. We handle that gracefully below.
    const homeRes = await fetch("https://finance.yahoo.com/", {
      headers: {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    // Collect all set-cookie headers
    const rawCookies: string[] = [];
    homeRes.headers.forEach((val, key) => {
      if (key.toLowerCase() === "set-cookie") rawCookies.push(val);
    });

    const cookieStr = rawCookies
      .map((c) => c.split(";")[0].trim())
      .filter((c) => c.includes("="))
      .join("; ");

    if (!cookieStr) {
      // GDPR consent redirect — no cookies. Chart API still works without them.
      _cred = { crumb: "", cookie: "", expiresAt: Date.now() + 25 * 60 * 1000 };
      return { crumb: "", cookie: "" };
    }

    // 2. Exchange for a crumb
    const crumbRes = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
      headers: {
        "User-Agent": UA,
        "Accept": "text/plain, */*",
        "Cookie": cookieStr,
        "Referer": "https://finance.yahoo.com/",
      },
    });

    if (!crumbRes.ok) {
      // Crumb auth failed (common in server environments). Proceed without crumb.
      _cred = { crumb: "", cookie: cookieStr, expiresAt: Date.now() + 25 * 60 * 1000 };
      return { crumb: "", cookie: cookieStr };
    }

    const crumb = (await crumbRes.text()).trim();
    // Validate crumb looks like a real crumb, not an error JSON
    const isValidCrumb = crumb.length >= 3 && !crumb.startsWith("{");

    if (!isValidCrumb) {
      _cred = { crumb: "", cookie: cookieStr, expiresAt: Date.now() + 25 * 60 * 1000 };
      return { crumb: "", cookie: cookieStr };
    }

    _cred = { crumb, cookie: cookieStr, expiresAt: Date.now() + 25 * 60 * 1000 };
    return { crumb, cookie: cookieStr };
  } catch {
    // Network error during credential fetch — proceed without creds
    return { crumb: "", cookie: "" };
  }
}

// ─── Single chunk fetch ───────────────────────────────────────────────────────

async function fetchChunkOnce(
  yahooSymbol: string,
  interval: string,
  period1: number,
  period2: number,
  timeoutMs = 30_000
): Promise<Candle[]> {
  const { crumb, cookie } = await getCredentials();

  const bases = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];
  const base = bases[Math.floor(Math.random() * bases.length)];

  // Only append crumb param if we have one
  const crumbParam = crumb ? `&crumb=${encodeURIComponent(crumb)}` : "";
  const url =
    `${base}/v8/finance/chart/${encodeURIComponent(yahooSymbol)}` +
    `?interval=${interval}&period1=${period1}&period2=${period2}` +
    `&includePrePost=false${crumbParam}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    "User-Agent": UA,
    "Accept": "application/json, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://finance.yahoo.com/",
  };
  if (cookie) headers["Cookie"] = cookie;

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      // 401/403 → crumb expired, force refresh on next call
      if (res.status === 401 || res.status === 403) _cred = null;
      // 422 → malformed request (possibly stale crumb); clear and retry without
      if (res.status === 422) _cred = null;
      throw new Error(`Yahoo HTTP ${res.status} for ${yahooSymbol}`);
    }

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) {
      const err = json?.chart?.error;
      throw new Error(err?.description ?? `No chart data for ${yahooSymbol}`);
    }

    const timestamps: number[] = result.timestamp ?? [];
    const q = result.indicators?.quote?.[0] ?? {};
    const { open = [], high = [], low = [], close = [], volume = [] } = q;

    return timestamps
      .map((t: number, i: number) => ({
        time:   t * 1000,
        open:   open[i],
        high:   high[i],
        low:    low[i],
        close:  close[i],
        volume: (volume[i] as number) ?? 0,
      }))
      .filter(
        (c) =>
          c.open != null && c.close != null &&
          !isNaN(c.close) && !isNaN(c.open) &&
          c.high >= c.low && c.close > 0
      );
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchChunk(
  yahooSymbol: string,
  interval: string,
  periodStart: number,
  periodEnd: number
): Promise<Candle[]> {
  const maxAttempts = 3;
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fetchChunkOnce(yahooSymbol, interval, periodStart, periodEnd, 30_000);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // If crumb/auth issue, clear cache so next attempt refreshes it
      if (
        lastError.message.includes("401") ||
        lastError.message.includes("403") ||
        lastError.message.includes("422")
      ) {
        _cred = null;
      }
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
      }
    }
  }
  throw lastError ?? new Error("Yahoo Finance request failed after 3 attempts");
}

// ─── H4 Resampling ────────────────────────────────────────────────────────────

function resampleH4(candles: Candle[]): Candle[] {
  if (candles.length === 0) return [];

  // Group candles by UTC 4-hour bucket
  const bucketMap = new Map<string, Candle[]>();
  for (const c of candles) {
    const d = new Date(c.time);
    const bucketHour = Math.floor(d.getUTCHours() / 4) * 4;
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${bucketHour}`;
    if (!bucketMap.has(key)) bucketMap.set(key, []);
    bucketMap.get(key)!.push(c);
  }

  const result: Candle[] = [];
  const sortedKeys = [...bucketMap.keys()].sort();

  for (let ki = 0; ki < sortedKeys.length; ki++) {
    const bucket = bucketMap.get(sortedKeys[ki])!;
    // Skip partial first bucket
    if (ki === 0 && bucket.length < 4) continue;
    result.push({
      time:   bucket[0].time,
      open:   bucket[0].open,
      high:   Math.max(...bucket.map((x) => x.high)),
      low:    Math.min(...bucket.map((x) => x.low)),
      close:  bucket[bucket.length - 1].close,
      volume: bucket.reduce((s, x) => s + x.volume, 0),
    });
  }
  return result;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchHistoricalCandles(
  symbol: string,
  timeframe: string,
  startDate: Date,
  endDate: Date
): Promise<Candle[]> {
  const yahooSymbol = SYMBOL_MAP[symbol.toUpperCase()] ?? `${symbol.toUpperCase()}=X`;
  const tf = INTERVAL_MAP[timeframe] ?? { yahoo: "1d", maxDays: 3600 };

  const startMs = startDate.getTime();
  const endMs   = endDate.getTime();
  const maxMs   = tf.maxDays * 86_400 * 1000;

  // Split into chunks if range exceeds Yahoo's per-request limit
  const chunks: { start: number; end: number }[] = [];
  let cur = startMs;
  while (cur < endMs) {
    const chunkEnd = Math.min(cur + maxMs, endMs);
    chunks.push({ start: Math.floor(cur / 1000), end: Math.floor(chunkEnd / 1000) });
    cur = chunkEnd;
  }

  const allCandles: Candle[] = [];
  const seen = new Set<number>();

  for (const chunk of chunks) {
    const candles = await fetchChunk(yahooSymbol, tf.yahoo, chunk.start, chunk.end);
    for (const c of candles) {
      if (!seen.has(c.time)) {
        seen.add(c.time);
        allCandles.push(c);
      }
    }
  }

  allCandles.sort((a, b) => a.time - b.time);

  if (timeframe === "H4") return resampleH4(allCandles);
  return allCandles;
}

// ─── Preț curent (pentru alertele de preț) ────────────────────────────────────
// Folosește meta.regularMarketPrice din endpoint-ul v8 chart — un singur
// request per simbol, fără crumb (endpoint public).
export async function fetchLatestPrice(symbol: string): Promise<number | null> {
  const yahooSymbol = SYMBOL_MAP[symbol.toUpperCase()] ?? symbol.toUpperCase();
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`,
      { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return typeof price === "number" && Number.isFinite(price) ? price : null;
  } catch {
    return null;
  }
}
