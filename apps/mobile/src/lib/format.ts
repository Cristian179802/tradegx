// ── Formatare ────────────────────────────────────────────────────────────────
//
// Un singur loc unde se decide cum arată o sumă, un procent sau o dată.
// Ecranele nu formatează singure: altfel apar trei variante de „+380.31 USD”
// pe trei ecrane, iar ochiul le citește ca trei produse.
//
// locale() URMEAZĂ LIMBA APLICAȚIEI, nu setările telefonului. Dacă am lua
// locale-ul telefonului, separatorul de mii s-ar schimba după setările
// fiecăruia, iar o captură trimisă la suport n-ar mai semăna cu ce vede
// altcineva. Legat de limba aleasă, în schimb, „19 sept." devine „19 Sep" —
// altfel aplicația ar fi în engleză, dar lunile ar rămâne românești.

import { limba, tr, umple } from "./i18n";

const locale = () => (limba() === "EN" ? "en-GB" : "ro-RO");

/** „+380,31 USD” — semnul e mereu explicit pe P&L. */
export function bani(valoare: number, moneda = "USD", cuSemn = true): string {
  const semn = cuSemn ? (valoare > 0 ? "+" : valoare < 0 ? "−" : "") : "";
  const n = Math.abs(valoare).toLocaleString(locale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  // Moneda goală e cerută explicit de ecranele unde unitatea e deja scrisă în
  // antet; fără condiția asta ar rămâne un spațiu în coada fiecărei sume.
  return moneda ? `${semn}${n} ${moneda}` : `${semn}${n}`;
}

/** Sume mari, prescurtate: „+30,8k USD”. Pentru cifrele-titlu. */
export function baniScurt(valoare: number, moneda = "USD"): string {
  const abs = Math.abs(valoare);
  const semn = valoare > 0 ? "+" : valoare < 0 ? "−" : "";
  if (abs >= 1_000_000) return `${semn}${(abs / 1_000_000).toFixed(2)}M ${moneda}`;
  if (abs >= 10_000) return `${semn}${(abs / 1000).toFixed(1)}k ${moneda}`;
  return bani(valoare, moneda);
}

export function procent(valoare: number | null, zecimale = 1): string {
  if (valoare == null) return "—";
  return `${valoare.toFixed(zecimale)}%`;
}

export function numar(valoare: number | null, zecimale = 2): string {
  if (valoare == null) return "—";
  return valoare.toLocaleString(locale(), {
    minimumFractionDigits: zecimale,
    maximumFractionDigits: zecimale,
  });
}

/** „19 sept., 14:32” — scurt, fiindcă stă lângă alte cifre. */
export function dataScurta(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(locale(), {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** „acum 3 h”, „ieri”, „acum 2 zile” — pentru liste, unde ora exactă nu ajută. */
export function candva(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  // Tiparele întregi sunt chei de dicționar, cu gaura în ele — altfel engleza
  // ar fi ieșit „ago 3 min", fiindcă acolo cuvântul stă la coadă, nu în față.
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return tr("acum");
  if (min < 60) return umple("acum {n} min", { n: min });
  const ore = Math.round(min / 60);
  if (ore < 24) return umple("acum {n} h", { n: ore });
  const zile = Math.round(ore / 24);
  if (zile === 1) return tr("ieri");
  if (zile < 30) return umple("acum {n} zile", { n: zile });
  return dataScurta(d);
}

/**
 * „sept." / „Sep” — numele scurt al lunii, după limba aplicației.
 *
 * Derivat din `Intl`, nu dintr-o listă scrisă de mână: o listă ar fi trebuit
 * ținută în două limbi și ar fi rămas în urmă la a treia. `index` e 0–11.
 */
export function lunaScurta(index: number): string {
  const d = new Date(2000, index, 1);
  return d.toLocaleDateString(locale(), { month: "short" });
}
