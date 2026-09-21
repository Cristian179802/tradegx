// ── Formatare ────────────────────────────────────────────────────────────────
//
// Un singur loc unde se decide cum arată o sumă, un procent sau o dată.
// Ecranele nu formatează singure: altfel apar trei variante de „+380.31 USD”
// pe trei ecrane, iar ochiul le citește ca trei produse.
//
// Locale FIX „ro-RO”. Aplicația e în română; a lua locale-ul telefonului ar
// însemna că separatorul de mii se schimbă după setările fiecăruia, iar o
// captură de ecran trimisă la suport n-ar mai semăna cu ce vede altcineva.

const LOCALE = "ro-RO";

/** „+380,31 USD” — semnul e mereu explicit pe P&L. */
export function bani(valoare: number, moneda = "USD", cuSemn = true): string {
  const semn = cuSemn ? (valoare > 0 ? "+" : valoare < 0 ? "−" : "") : "";
  const n = Math.abs(valoare).toLocaleString(LOCALE, {
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
  return valoare.toLocaleString(LOCALE, {
    minimumFractionDigits: zecimale,
    maximumFractionDigits: zecimale,
  });
}

/** „19 sept., 14:32” — scurt, fiindcă stă lângă alte cifre. */
export function dataScurta(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(LOCALE, {
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
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "acum";
  if (min < 60) return `acum ${min} min`;
  const ore = Math.round(min / 60);
  if (ore < 24) return `acum ${ore} h`;
  const zile = Math.round(ore / 24);
  if (zile === 1) return "ieri";
  if (zile < 30) return `acum ${zile} zile`;
  return dataScurta(d);
}
