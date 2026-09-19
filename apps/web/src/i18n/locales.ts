// ── Limbile aplicației — SINGURA sursă de adevăr ─────────────────────────────
//
// Lista era scrisă de mână în trei locuri: configul next-intl, comutatorul de
// limbă și middleware-ul. A adăuga o limbă însemna să le găsești pe toate.
//
// O limbă apare în listă DOAR când are dicționar complet. Un import lipsă
// aruncă la runtime, iar un dicționar pe jumătate e mai rău decât engleza: omul
// vede jumătate de propoziție în limba lui și jumătate în alta, și nu înțelege
// dacă aplicația e stricată sau el n-a citit bine.

export const LIMBI = {
  ro: { eticheta: "RO", nume: "Română" },
  en: { eticheta: "EN", nume: "English" },
  de: { eticheta: "DE", nume: "Deutsch" },
  fr: { eticheta: "FR", nume: "Français" },
  es: { eticheta: "ES", nume: "Español" },
  it: { eticheta: "IT", nume: "Italiano" },
} as const;

export type Limba = keyof typeof LIMBI;

/**
 * Limbile pentru care EXISTĂ fișier de traduceri.
 *
 * Se calculează la compilare: `require.context` nu e disponibil în Next, dar
 * un import static al listei e suficient — scriptul de traducere adaugă aici
 * limba nouă în același commit în care adaugă fișierul.
 */
export const LIMBI_ACTIVE: Limba[] = ["ro", "en"];

export const LIMBA_IMPLICITA: Limba = "ro";

export function esteLimba(v: string | undefined | null): v is Limba {
  return !!v && (LIMBI_ACTIVE as string[]).includes(v);
}
