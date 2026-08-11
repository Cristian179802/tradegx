// ── Simbolurile noastre → perechile Binance ──────────────────────────────────
//
// Modul pur, fără importuri: îl folosesc și serverul (price-feed) și clientul
// (hook-ul de preț live pe grafic). Fără el, aceeași hartă ar exista în două
// locuri și s-ar desincroniza — exact felul în care au apărut celelalte defecte
// de preț din proiect.
//
// Cotăm în USDT, nu USD: diferența e de ordinul 0,02%, iar perechile USDT au de
// departe cea mai mare lichiditate, deci prețul e cel mai reprezentativ.

export const BINANCE_PAIRS: Record<string, string> = {
  BTCUSD: "BTCUSDT", ETHUSD: "ETHUSDT", BNBUSD: "BNBUSDT",
  SOLUSD: "SOLUSDT", XRPUSD: "XRPUSDT", ADAUSD: "ADAUSDT",
  DOGEUSD: "DOGEUSDT", AVAXUSD: "AVAXUSDT", LINKUSD: "LINKUSDT",
  DOTUSD: "DOTUSDT", LTCUSD: "LTCUSDT", TRXUSD: "TRXUSDT",
  ATOMUSD: "ATOMUSDT", NEARUSD: "NEARUSDT", APTUSD: "APTUSDT",
  ARBUSD: "ARBUSDT", OPUSD: "OPUSDT", INJUSD: "INJUSDT",
  SUIUSD: "SUIUSDT", TONUSD: "TONUSDT",
  // Scrise direct pe USDT, dacă cineva le salvează așa
  BTCUSDT: "BTCUSDT", ETHUSDT: "ETHUSDT", SOLUSDT: "SOLUSDT",
};

/** „BTC/USD" → „BTCUSD", ca să se potrivească cu cheile de mai sus. */
export function normalizeSymbol(symbol: string): string {
  return symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Perechea Binance pentru un simbol, sau null dacă nu e cripto cunoscută. */
export function binancePair(symbol: string): string | null {
  return BINANCE_PAIRS[normalizeSymbol(symbol)] ?? null;
}

/**
 * Cât de proaspăt e prețul, ca să nu prezentăm drept „live" o cotație pe care
 * furnizorul o întârzie. Măsurat pe 11 august 2026 prin `regularMarketTime`:
 * cripto pe Binance = live, valute Yahoo `=X` = sub un minut, iar futures pe
 * metale, indici și energie = ÎNTÂRZIERE 10 MINUTE.
 */
export function priceFreshness(symbol: string): "live" | "near" | "delayed" {
  const key = normalizeSymbol(symbol);
  if (BINANCE_PAIRS[key]) return "live";
  if (/^(XAU|XAG|XPT)USD$|^(US30|NAS100|SP500|US2000)$|^(CRUDE|BRENT|NATGAS)$/.test(key)) {
    return "delayed";
  }
  return "near";
}
