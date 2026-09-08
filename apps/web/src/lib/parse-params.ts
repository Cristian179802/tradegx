// ── Numere din parametrii de URL ─────────────────────────────────────────────
//
// DE CE EXISTĂ. `Math.max(1, Number(searchParams.get("page")))` pare inofensiv,
// dar `Number("abc")` e NaN, iar `Math.max(1, NaN)` e tot NaN — nu 1. NaN ajunge
// în `skip:` la Prisma, care aruncă, iar clientul primește 500 în loc de 400.
//
// Verificat pe producție: `/api/community/posts?page=abc` returna 500. Același
// tipar exista în cinci fișiere, deci nu era o scăpare, era un obicei.
//
// Regula: un parametru care nu e număr valid NU e o eroare de server, e o cerere
// pe care o ignorăm în favoarea unei valori implicite rezonabile.

/**
 * Un întreg dintr-un parametru de URL, garantat finit și în interval.
 *
 * Orice intrare invalidă — lipsă, text, NaN, Infinity, zecimale — cade pe
 * `fallback`. Nu aruncă niciodată și nu întoarce niciodată NaN.
 */
export function intParam(
  raw: string | null | undefined,
  fallback: number,
  opts: { min?: number; max?: number } = {}
): number {
  const { min, max } = opts;
  const n = Number(raw);

  // `Number.isFinite` respinge dintr-o dată NaN, Infinity și -Infinity.
  // `Number("")` e 0, nu NaN, deci șirul gol se tratează separat.
  const valid = raw !== null && raw !== undefined && raw !== "" && Number.isFinite(n);
  let v = valid ? Math.trunc(n) : fallback;

  if (min !== undefined && v < min) v = min;
  if (max !== undefined && v > max) v = max;
  return v;
}

/**
 * O dată dintr-un parametru de URL, sau `null` dacă nu e validă.
 *
 * `new Date("abc")` nu aruncă — întoarce un obiect Date cu timpul NaN, care arată
 * ca o dată până în clipa în care ajunge la Prisma. Atunci aruncă, iar clientul
 * primește 500 în loc de 400.
 *
 * Confirmat pe producție: `/api/trades?dateFrom=abc` returna 500 și a declanșat
 * o alertă pe Telegram — exact cum trebuia, dar pentru un bug care n-avea de ce
 * să existe.
 */
export function dateParam(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}
