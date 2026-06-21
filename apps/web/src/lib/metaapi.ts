// MetaAPI REST client — server-side only

const BASE = "https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai";

export interface MetaApiAccount {
  id: string;
  name: string;
  login: string;
  server: string;
  platform: "mt4" | "mt5";
  state: string;
  connectionStatus: "CONNECTED" | "DISCONNECTED" | "DISCONNECTING";
  balance: number;
  equity: number;
  currency: string;
  type: string;
}

export interface MetaApiDeal {
  id: string;
  type: string; // "DEAL_TYPE_BUY" | "DEAL_TYPE_SELL" | "DEAL_TYPE_BALANCE" | ...
  entry: string; // "DEAL_ENTRY_IN" | "DEAL_ENTRY_OUT" | "DEAL_ENTRY_INOUT"
  symbol: string;
  lots: number;
  price: number;
  time: string;
  brokerTime: string;
  profit: number;
  commission: number;
  swap: number;
  positionId: string;
  stopLoss?: number;
  takeProfit?: number;
  comment?: string;
}

export async function validateToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/users/current`, {
      headers: { "auth-token": token },
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function listAccounts(token: string): Promise<MetaApiAccount[]> {
  const res = await fetch(`${BASE}/users/current/accounts?limit=50&offset=0`, {
    headers: { "auth-token": token },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`MetaAPI ${res.status}: ${text}`);
  }
  const data = await res.json();
  // API may return array directly or { data: [] }
  return Array.isArray(data) ? data : (data.data ?? []);
}

export async function getDeals(
  token: string,
  accountId: string,
  from: Date,
  to: Date
): Promise<MetaApiDeal[]> {
  const fromStr = from.toISOString();
  const toStr = to.toISOString();
  const url = `${BASE}/users/current/accounts/${accountId}/history-deals/time/${fromStr}/${toStr}?limit=1000`;

  const res = await fetch(url, {
    headers: { "auth-token": token },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`MetaAPI deals ${res.status}: ${text}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : (data.deals ?? data.data ?? []);
}

// ─── Instrument type detection ────────────────────────────────────────────────

export type InstrumentTypeStr =
  | "FOREX" | "CRYPTO" | "METALS" | "INDICES" | "COMMODITIES" | "STOCKS" | "CFD";

const CRYPTO_KEYWORDS = ["BTC", "ETH", "XRP", "LTC", "ADA", "SOL", "BNB", "DOGE", "DOT", "LINK", "AVAX", "MATIC", "UNI", "SHIB"];
const METALS_KEYWORDS = ["XAU", "XAG", "GOLD", "SILVER", "XPT", "XPD", "PLATINUM", "PALLADIUM"];
const ENERGY_KEYWORDS = ["OIL", "WTI", "BRENT", "USOIL", "UKOIL", "NATGAS", "NG", "GAS", "CL"];
const INDEX_KEYWORDS  = ["US30", "US500", "NAS", "SPX", "DAX", "GER", "UK100", "FTSE", "JPN", "AUS", "HK50", "DOW", "NDX", "VIX", "CAC", "EUSTX", "IBEX"];

export function detectInstrumentType(symbol: string): InstrumentTypeStr {
  const s = symbol.toUpperCase().replace("/", "").replace(".", "");

  if (CRYPTO_KEYWORDS.some((k) => s.includes(k))) return "CRYPTO";
  if (METALS_KEYWORDS.some((k) => s.includes(k))) return "METALS";
  if (ENERGY_KEYWORDS.some((k) => s.includes(k))) return "COMMODITIES";
  if (INDEX_KEYWORDS.some((k) => s.includes(k)))  return "INDICES";

  // Forex: 6-char symbol of known currency codes
  const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "NZD", "CAD", "CHF", "HKD", "SGD", "SEK", "NOK", "DKK", "ZAR", "MXN", "TRY", "RON", "CZK", "HUF", "PLN"];
  const clean = s.replace(/[^A-Z]/g, "");
  if (clean.length === 6 && CURRENCIES.some((c) => clean.startsWith(c)) && CURRENCIES.some((c) => clean.endsWith(c))) {
    return "FOREX";
  }

  return "CFD";
}

// ─── Deal-pair → Trade mapper ─────────────────────────────────────────────────

export interface PairedTrade {
  positionId: string;
  symbol: string;
  direction: "BUY" | "SELL";
  entryPrice: number;
  entryTime: Date;
  exitPrice: number;
  exitTime: Date;
  lotSize: number;
  pnlMoney: number;
  commission: number;
  swap: number;
  stopLoss?: number;
  takeProfit?: number;
  instrumentType: InstrumentTypeStr;
}

export function pairDeals(deals: MetaApiDeal[]): PairedTrade[] {
  // Filter only trade deals (exclude balance, credit, etc.)
  const tradeDealTypes = ["DEAL_TYPE_BUY", "DEAL_TYPE_SELL"];
  const tradeDeals = deals.filter((d) => tradeDealTypes.includes(d.type) && d.symbol);

  // Group by positionId
  const byPosition = new Map<string, { in?: MetaApiDeal; out?: MetaApiDeal }>();
  for (const deal of tradeDeals) {
    const pos = byPosition.get(deal.positionId) ?? {};
    if (deal.entry === "DEAL_ENTRY_IN") pos.in = deal;
    else if (deal.entry === "DEAL_ENTRY_OUT") pos.out = deal;
    else if (deal.entry === "DEAL_ENTRY_INOUT") {
      // Single deal covers both in and out (rare, seen in some brokers)
      pos.in = deal;
      pos.out = deal;
    }
    byPosition.set(deal.positionId, pos);
  }

  const result: PairedTrade[] = [];

  for (const [positionId, pair] of byPosition) {
    if (!pair.in || !pair.out) continue; // Skip unclosed positions

    const inDeal = pair.in;
    const outDeal = pair.out;

    result.push({
      positionId,
      symbol: inDeal.symbol,
      direction: inDeal.type === "DEAL_TYPE_BUY" ? "BUY" : "SELL",
      entryPrice: inDeal.price,
      entryTime: new Date(inDeal.time),
      exitPrice: outDeal.price,
      exitTime: new Date(outDeal.time),
      lotSize: inDeal.lots,
      pnlMoney: outDeal.profit,
      commission: (inDeal.commission ?? 0) + (outDeal.commission ?? 0),
      swap: outDeal.swap ?? 0,
      stopLoss: inDeal.stopLoss,
      takeProfit: inDeal.takeProfit,
      instrumentType: detectInstrumentType(inDeal.symbol),
    });
  }

  return result;
}
