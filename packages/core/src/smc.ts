// ── SMC / instrument utils — logică pură partajată ────────────────────────────

export type InstrumentTypeStr =
  | "FOREX" | "CRYPTO" | "METALS" | "INDICES" | "COMMODITIES" | "STOCKS" | "CFD";

const CRYPTO_KEYWORDS = ["BTC", "ETH", "XRP", "LTC", "ADA", "SOL", "BNB", "DOGE", "DOT", "LINK", "AVAX", "MATIC", "UNI", "SHIB"];
const METALS_KEYWORDS = ["XAU", "XAG", "GOLD", "SILVER", "XPT", "XPD", "PLATINUM", "PALLADIUM"];
const ENERGY_KEYWORDS = ["OIL", "WTI", "BRENT", "USOIL", "UKOIL", "NATGAS", "NG", "GAS", "CL"];
const INDEX_KEYWORDS  = ["US30", "US500", "NAS", "SPX", "DAX", "GER", "UK100", "FTSE", "JPN", "AUS", "HK50", "DOW", "NDX", "VIX", "CAC", "EUSTX", "IBEX"];
const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "NZD", "CAD", "CHF", "HKD", "SGD", "SEK", "NOK", "DKK", "ZAR", "MXN", "TRY", "RON", "CZK", "HUF", "PLN"];

/** Detectează tipul instrumentului din simbol — folosit la import/sync MT4/MT5. */
export function detectInstrumentType(symbol: string): InstrumentTypeStr {
  const s = symbol.toUpperCase().replace("/", "").replace(".", "");
  if (CRYPTO_KEYWORDS.some((k) => s.includes(k))) return "CRYPTO";
  if (METALS_KEYWORDS.some((k) => s.includes(k))) return "METALS";
  if (ENERGY_KEYWORDS.some((k) => s.includes(k))) return "COMMODITIES";
  if (INDEX_KEYWORDS.some((k) => s.includes(k)))  return "INDICES";
  const clean = s.replace(/[^A-Z]/g, "");
  if (clean.length === 6 && CURRENCIES.some((c) => clean.startsWith(c)) && CURRENCIES.some((c) => clean.endsWith(c))) {
    return "FOREX";
  }
  return "CFD";
}

/** Etichete prietenoase pentru tipuri de setup SMC/ICT. */
export const SETUP_LABELS: Record<string, string> = {
  ORDER_BLOCK: "Order Block", FAIR_VALUE_GAP: "Fair Value Gap", LIQUIDITY_SWEEP: "Liquidity Sweep",
  BOS: "Break of Structure", CHOCH: "Change of Character", BREAKER: "Breaker Block",
  MITIGATION: "Mitigation", REJECTION: "Rejection", TREND_FOLLOW: "Trend Follow",
  SCALP: "Scalp", OTHER: "Altul",
};
