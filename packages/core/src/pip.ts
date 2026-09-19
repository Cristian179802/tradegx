// ── Valoarea unui pip ────────────────────────────────────────────────────────
//
// DE CE EXISTĂ FIȘIERUL ĂSTA. Valoarea unui pip depinde de moneda în care e
// COTAT instrumentul, iar contul e ținut în altă monedă. Pentru EURUSD pe un
// cont în dolari cele două coincid și un pip face 10 $ la lot — de aici vine
// iluzia că „un pip = 10 $" mereu. Pentru USDJPY, un pip la lot face 1.000 JPY,
// adică ~6,7 $, nu 1.000 $.
//
// Codul vechi înmulțea pur și simplu `pip × contractSize` și trata rezultatul ca
// dolari. Pe perechile cu JPY asta dădea o valoare de ~145 de ori prea mare,
// deci o mărime de poziție de ~145 de ori prea MICĂ. Pe un calculator de lot,
// greșeala asta e cea mai scumpă posibilă: omul crede că riscă 1% și riscă
// altceva.
//
// A treia variantă a aceleiași logici trăia într-un tabel scris de mână în
// calculatorul din interfață (USDJPY 6.9, USDCHF 10.9, USDCAD 7.7). Cifrele
// alea au fost corecte la un curs de acum câteva luni și se depărtează în
// fiecare zi. Aici se CALCULEAZĂ din preț.
//
// REGULA CASEI: dacă nu putem ști valoarea (ne lipsește un curs), întoarcem
// `null` și cerem omului s-o introducă. Nu inventăm. O mărime de poziție
// greșită e mai rea decât un câmp gol.

export type FelInstrument = "FOREX" | "METAL" | "INDICE" | "CRIPTO" | "MARFA";

/** Cursuri de schimb, cheia e perechea: `{ USDJPY: 149.2, GBPUSD: 1.27 }`. */
export type Cursuri = Record<string, number>;

const METALE = ["XAU", "XAG", "XPT", "XPD"];
const INDICI = ["US30", "NAS100", "SP500", "US500", "US2000", "GER40", "UK100", "JP225", "AUS200", "FRA40", "EU50", "HK50"];
const CRIPTO = ["BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "DOGE", "LTC", "AVAX", "DOT"];
const MARFURI = ["CRUDE", "WTI", "BRENT", "NATGAS", "XBR", "XTI"];

function curat(symbol: string): string {
  return symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function clasificaSimbol(symbol: string): FelInstrument {
  const s = curat(symbol);
  if (METALE.some((m) => s.startsWith(m))) return "METAL";
  if (INDICI.some((i) => s.includes(i))) return "INDICE";
  if (CRIPTO.some((c) => s.startsWith(c))) return "CRIPTO";
  if (MARFURI.some((m) => s.includes(m))) return "MARFA";
  return "FOREX";
}

/** Cât valorează o mișcare de un pip, în unități de preț. */
export function pipSize(symbol: string): number {
  const s = curat(symbol);
  switch (clasificaSimbol(s)) {
    case "INDICE":
      return 1;
    case "METAL":
    case "CRIPTO":
    case "MARFA":
      return 0.01;
    default:
      return s.includes("JPY") ? 0.01 : 0.0001;
  }
}

/**
 * Mărimea standard a unui lot. E o valoare IMPLICITĂ: brokerii diferă, mai ales
 * la metale și cripto. Se poate suprascrie oriunde e folosită.
 */
export function contractSizeImplicit(symbol: string): number {
  const s = curat(symbol);
  if (s.startsWith("XAU")) return 100;      // 100 uncii
  if (s.startsWith("XAG")) return 5000;     // 5.000 uncii
  if (s.startsWith("XPT") || s.startsWith("XPD")) return 100;
  switch (clasificaSimbol(s)) {
    case "INDICE":
    case "CRIPTO":
      return 1;
    case "MARFA":
      return 1000;
    default:
      return 100_000;
  }
}

/** Moneda de bază și cea de cotare, pentru o pereche valutară de 6 litere. */
export function monedePereche(symbol: string): { baza: string; cotata: string } | null {
  const s = curat(symbol);
  if (clasificaSimbol(s) !== "FOREX") return null;
  if (s.length < 6) return null;
  return { baza: s.slice(0, 3), cotata: s.slice(3, 6) };
}

/**
 * Cursul de la o monedă la alta, din cursurile disponibile. Acceptă și perechea
 * inversă. `null` dacă nu se poate afla — caz în care NU ghicim.
 */
export function curs(din: string, in_: string, cursuri: Cursuri = {}): number | null {
  const a = din.toUpperCase();
  const b = in_.toUpperCase();
  if (a === b) return 1;

  const direct = cursuri[`${a}${b}`];
  if (typeof direct === "number" && direct > 0) return direct;

  const invers = cursuri[`${b}${a}`];
  if (typeof invers === "number" && invers > 0) return 1 / invers;

  return null;
}

export interface ParamPipValue {
  symbol: string;
  /** Prețul curent al simbolului. Necesar când moneda contului e cea de BAZĂ. */
  price?: number;
  /** Moneda contului. Implicit USD. */
  accountCurrency?: string;
  /** Mărimea contractului, dacă brokerul diferă de implicit. */
  contractSize?: number;
  /** Cursuri pentru conversii indirecte, ex. EURGBP pe un cont în USD. */
  rates?: Cursuri;
}

/**
 * Valoarea unui pip pentru UN LOT, exprimată în moneda contului.
 * `null` înseamnă „nu știm" — nu „zero".
 */
export function pipValue(p: ParamPipValue): number | null {
  const { symbol, price, accountCurrency = "USD", rates = {} } = p;
  const s = curat(symbol);
  const acc = accountCurrency.toUpperCase();
  const contract = p.contractSize ?? contractSizeImplicit(s);
  const pip = pipSize(s);
  const valoareInCotata = pip * contract;
  if (!(valoareInCotata > 0)) return null;

  const perechi = monedePereche(s);

  // Instrumente care nu-s perechi valutare: cotate, prin convenție, în dolari.
  if (!perechi) {
    const k = curs("USD", acc, rates);
    return k == null ? null : round(valoareInCotata * k);
  }

  const { baza, cotata } = perechi;

  // Cazul simplu: contul e în moneda de cotare. Un pip valorează exact atât.
  if (cotata === acc) return round(valoareInCotata);

  // Contul e în moneda de bază (ex. USDJPY pe cont în USD): împărțim la preț.
  if (baza === acc) {
    if (!(typeof price === "number" && price > 0)) return null;
    return round(valoareInCotata / price);
  }

  // Nicio monedă a perechii nu e cea a contului (ex. EURGBP pe cont în USD):
  // avem nevoie de cursul monedei de cotare față de cea a contului.
  const k = curs(cotata, acc, rates);
  return k == null ? null : round(valoareInCotata * k);
}

function round(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

/**
 * Ce pereche mai trebuie cotată ca să putem calcula valoarea pipului.
 * `null` = nu mai e nevoie de nimic (sau nu se poate deduce).
 *
 * Ex.: EURGBP pe un cont în USD ⇒ „GBPUSD".
 */
export function perecheDeConversie(symbol: string, accountCurrency = "USD"): string | null {
  const s = curat(symbol);
  const acc = accountCurrency.toUpperCase();
  const perechi = monedePereche(s);

  if (!perechi) return acc === "USD" ? null : `USD${acc}`;

  const { baza, cotata } = perechi;
  if (cotata === acc) return null;   // avem deja tot
  if (baza === acc) return null;     // e de ajuns prețul simbolului
  return `${cotata}${acc}`;
}
