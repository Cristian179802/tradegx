// ── Câte zecimale are prețul unui instrument ─────────────────────────────────
//
// Graficul afișa TOATE prețurile cu două zecimale, fiindcă asta e implicitul
// lightweight-charts când nu îi dai `priceFormat`. Pe EURUSD asta înseamnă
// „1.17" în loc de „1.16495" — adică pipsii, unitatea în care se măsoară de fapt
// tranzacția, dispăreau complet de pe ecran.
//
// Regula nu poate fi doar după mărime: USDJPY la 159 are nevoie de 3 zecimale,
// iar un indice la aceeași valoare are nevoie de 1-2. Simbolul e cel care
// dezambiguizează, deci pornim de la el și cădem pe mărime doar pentru ce nu
// recunoaștem — cripto, în principal, unde plaja e de la 100.000 la 0,00000001.

/** Codurile ISO pe care le poate avea o pereche valutară. */
const CURRENCIES = new Set([
  "USD", "EUR", "GBP", "JPY", "CHF", "AUD", "NZD", "CAD",
  "SEK", "NOK", "DKK", "PLN", "HUF", "CZK", "TRY", "ZAR",
  "MXN", "SGD", "HKD", "CNH", "RON",
]);

/** Metalele se scriu ca o pereche valutară (XAUUSD) dar se cotează ca marfă. */
const METALS = new Set(["XAU", "XAG", "XPT", "XPD"]);

/**
 * Zecimalele cu care se afișează prețul.
 *
 * `price` contează doar pentru instrumentele nerecunoscute după simbol: acolo
 * mărimea e singurul indiciu. O monedă la 0,0000042 și una la 95.000 nu pot avea
 * aceeași formatare.
 */
export function priceDigits(symbol: string, price?: number | null): number {
  const s = (symbol ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const base = s.slice(0, 3);
  const quote = s.slice(3, 6);

  if (s.length === 6 && CURRENCIES.has(base) && CURRENCIES.has(quote)) {
    // Yenul e cotat în sutimi, nu în zecimi de miime: convenția pieței e 3
    // zecimale pentru perechile cu JPY și 5 pentru restul.
    return quote === "JPY" ? 3 : 5;
  }

  // Aurul și argintul: 2 zecimale, ca la orice marfă cotată în dolari.
  if (METALS.has(base)) return 2;

  const p = Math.abs(Number(price ?? 0));
  if (!Number.isFinite(p) || p === 0) return 2;

  // Restul, după mărime. Pragurile sunt alese ca fiecare instrument să arate
  // aproximativ 5-7 cifre semnificative — cât citește ochiul fără să numere.
  if (p >= 1000) return 2;
  if (p >= 1) return 2;
  if (p >= 0.01) return 4;
  if (p >= 0.0001) return 6;
  return 8;
}

/**
 * `priceFormat` pentru lightweight-charts.
 *
 * `minMove` trebuie să fie coerent cu `precision`, altfel biblioteca rotunjește
 * la pasul ei implicit de 0,01 și zecimalele cerute rămân zerouri.
 */
export function priceFormatFor(symbol: string, price?: number | null) {
  const precision = priceDigits(symbol, price);
  return {
    type: "price" as const,
    precision,
    minMove: Number((10 ** -precision).toFixed(precision)),
  };
}
