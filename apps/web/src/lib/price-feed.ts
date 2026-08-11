// ── Rutarea surselor de preț spot ────────────────────────────────────────────
//
// Un singur punct de intrare pentru „care e prețul acum", care alege sursa cea
// mai proaspătă pentru fiecare instrument. Înainte, totul trecea prin Yahoo,
// inclusiv cripto — unde Yahoo e măsurabil în urmă.
//
// Măsurat pe 11 august 2026, în același moment:
//   BTC la Yahoo      63207.87
//   BTC la Binance    63276.00     ← diferență de 69 $
//
// Prospețimea surselor, verificată prin `regularMarketTime`:
//   cripto pe Binance     live (fără cheie, fără limită practică)
//   valute Yahoo `=X`     sub un minut
//   aur/argint `GC=F`     ÎNTÂRZIERE 10 MIN — Yahoo întârzie futures
//   indici `NQ=F`         ÎNTÂRZIERE 10 MIN (idem)
//
// Aurul spot ca pereche valutară (`XAUUSD=X`) NU există la Yahoo — verificat,
// întoarce null. Deci metalele și indicii rămân întârziați cât timp sursa e
// Yahoo; se rezolvă doar cu un furnizor plătit.

import { fetchLatestPrice as fetchYahooPrice } from "@/lib/yahoo-finance";

/**
 * Cripto → perechea Binance echivalentă.
 *
 * Cotăm în USDT, nu USD: USDT e practic la paritate (diferență de ordinul
 * 0,02%), iar perechile USDT au de departe cea mai mare lichiditate, deci
 * prețul e cel mai reprezentativ.
 */
const BINANCE_PAIRS: Record<string, string> = {
  BTCUSD: "BTCUSDT", ETHUSD: "ETHUSDT", BNBUSD: "BNBUSDT",
  SOLUSD: "SOLUSDT", XRPUSD: "XRPUSDT", ADAUSD: "ADAUSDT",
  DOGEUSD: "DOGEUSDT", AVAXUSD: "AVAXUSDT", LINKUSD: "LINKUSDT",
  DOTUSD: "DOTUSDT", LTCUSD: "LTCUSDT", TRXUSD: "TRXUSDT",
  ATOMUSD: "ATOMUSDT", NEARUSD: "NEARUSDT", APTUSD: "APTUSDT",
  ARBUSD: "ARBUSDT", OPUSD: "OPUSDT", INJUSD: "INJUSDT",
  SUIUSD: "SUIUSDT", TONUSD: "TONUSDT",
  // Perechile pe USDT scrise direct, dacă cineva le salvează așa
  BTCUSDT: "BTCUSDT", ETHUSDT: "ETHUSDT", SOLUSDT: "SOLUSDT",
};

/** „BTC/USD" → „BTCUSD", ca să se potrivească cu cheile de mai sus. */
function normalize(symbol: string): string {
  return symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

async function fetchBinancePrice(pair: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${encodeURIComponent(pair)}`,
      { signal: AbortSignal.timeout(6_000), cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const price = Number(data?.price);
    return Number.isFinite(price) && price > 0 ? price : null;
  } catch {
    return null;
  }
}

/**
 * Prețul spot curent, din cea mai proaspătă sursă disponibilă.
 *
 * Pentru cripto încearcă Binance și cade pe Yahoo dacă nu răspunde — o alertă
 * ratată e mai gravă decât una calculată pe un preț cu un minut vechime.
 *
 * Întoarce null dacă nicio sursă nu răspunde. Apelantul trebuie să trateze
 * null ca „nu știu prețul", NU ca zero.
 */
export async function fetchSpotPrice(symbol: string): Promise<number | null> {
  const pair = BINANCE_PAIRS[normalize(symbol)];
  if (pair) {
    const live = await fetchBinancePrice(pair);
    if (live !== null) return live;
  }
  return fetchYahooPrice(symbol);
}

/**
 * Cât de proaspăt e prețul pentru un instrument, ca să putem fi sinceri în
 * interfață în loc să promitem „live" peste tot.
 */
export function priceFreshness(symbol: string): "live" | "near" | "delayed" {
  const key = normalize(symbol);
  if (BINANCE_PAIRS[key]) return "live";
  // Futures pe metale și indici — Yahoo le întârzie 10 minute.
  if (/^(XAU|XAG|XPT)USD$|^(US30|NAS100|SP500|US2000)$|^(CRUDE|BRENT|NATGAS)$/.test(key)) {
    return "delayed";
  }
  return "near";
}
