// ── Simboluri: normalizare și variante ───────────────────────────────────────
//
// Același instrument e salvat în baza de date în DOUĂ formate, după sursa care
// l-a creat. Numărat în producție pe 11 august 2026:
//
//   EURUSD  34 tranzacții   |   EUR/USD  33
//   GBPUSD   2              |   GBP/USD  24
//   USDJPY   2              |   USD/JPY  22
//
// Deci o interogare pe potrivire exactă întoarce jumătate din date. Exact același
// tip de defect a ținut alertele de preț nefuncționale (cheia „EURUSD" nu se
// potrivea cu simbolul „EUR/USD"), așa că aici tratăm ambele forme din start.
//
// Modul pur, fără importuri — folosibil pe server și în client.

/** „EUR/USD" → „EURUSD". Elimină tot ce nu e literă sau cifră. */
export function normalizeSymbol(symbol: string): string {
  return symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Toate formele sub care instrumentul poate fi scris în baza de date, ca să
 * putem interoga cu `IN (...)` — rămâne exact, deci folosește indexul, spre
 * deosebire de o normalizare făcută în SQL.
 *
 * Slash-ul se inserează doar la simbolurile de 6 litere (perechile valutare și
 * metalele: EURUSD → EUR/USD). „NAS100" sau „US30" nu se despart niciodată.
 */
export function symbolVariants(symbol: string): string[] {
  const flat = normalizeSymbol(symbol);
  const out = new Set<string>([flat, symbol.toUpperCase(), symbol]);

  if (/^[A-Z]{6}$/.test(flat)) {
    out.add(`${flat.slice(0, 3)}/${flat.slice(3)}`);
    out.add(`${flat.slice(0, 3)}-${flat.slice(3)}`);
  }
  return [...out];
}
