// ── Sesiunea unei tranzacții ─────────────────────────────────────────────────
//
// De ce există fișierul ăsta: baza de date are DOUĂ câmpuri care înseamnă
// aproape același lucru — `killzone` și `sessionType` — iar codul le trata ca pe
// niște străini.
//
// Formularul de tranzacție scrie DOAR `killzone`. Matricea Setup × Sesiune —
// funcția care deosebește produsul — citește DOAR `sessionType`, iar
// `cross-tab.ts` sare peste orice tranzacție fără el. Deci o tranzacție
// etichetată de mână apărea în jurnal, apărea în listă, și lipsea exact din
// analiza pentru care ai etichetat-o.
//
// Mai rău: dintre cele zece căi prin care intră tranzacții în sistem (formular,
// import CSV, sincronizare MetaAPI, două burse, două webhook-uri, TradeLocker),
// NICIUNA nu completa `sessionType`. Cele care îl au în producție sunt de la o
// versiune mai veche a codului și din seed-ul demo.
//
// Fixul e o singură funcție, chemată de toate căile.

export type SesiuneTranzactie = "ASIAN" | "LONDON" | "NEW_YORK" | "OVERLAP";
export type Killzone = "ASIAN" | "LONDON" | "NEW_YORK" | "LONDON_CLOSE";

/**
 * Ferestrele orare, în UTC.
 *
 * Aceleași ca în `seed-demo-account.ts`, deliberat: datele derivate trebuie să
 * cadă în aceleași coloane ca datele demonstrative, altfel matricea din video
 * și matricea unui client real arată diferit.
 */
const FERESTRE: ReadonlyArray<{ sesiune: SesiuneTranzactie; de: number; pana: number }> = [
  { sesiune: "ASIAN", de: 0, pana: 6 },
  { sesiune: "LONDON", de: 7, pana: 12 },
  { sesiune: "NEW_YORK", de: 13, pana: 20 },
];

/**
 * Killzone → sesiune.
 *
 * `LONDON_CLOSE` (16:00–17:00) cade în sesiunea New York, nu în cea londoneză:
 * e ultima oră a Londrei, dar piața pe care o tranzacționezi atunci e deja
 * americană.
 */
const DIN_KILLZONE: Record<Killzone, SesiuneTranzactie> = {
  ASIAN: "ASIAN",
  LONDON: "LONDON",
  NEW_YORK: "NEW_YORK",
  LONDON_CLOSE: "NEW_YORK",
};

/**
 * În ce sesiune a fost deschisă tranzacția, după ora UTC de intrare.
 *
 * Ferestrele sunt INCLUSIVE la ambele capete, exact ca în seed (`randInt(h0, h1)`
 * include și h1). Deci ora 6 e asiatică, ora 12 e londoneză — nu există pauze
 * între sesiuni, cum credeam la prima scriere. Testul a prins-o.
 *
 * Singurele ore neacoperite sunt 21–23, iar alea merg la ASIAN: Sydney e deja
 * deschis, Tokyo urmează.
 *
 * NU derivăm niciodată `OVERLAP`. Suprapunerea Londra/New York e o sesiune
 * reală, dar formularul nu o oferă ca opțiune de killzone — deci ar apărea o
 * coloană pe care utilizatorul n-o poate alege niciodată, iar tranzacțiile
 * sincronizate automat ar ajunge în altă coloană decât cele etichetate manual
 * la aceeași oră. `OVERLAP` rămâne valid dacă cineva îl trimite explicit.
 */
export function sesiuneaDupaOra(entryTime: Date | string): SesiuneTranzactie | null {
  const d = entryTime instanceof Date ? entryTime : new Date(entryTime);
  if (Number.isNaN(d.getTime())) return null;

  const ora = d.getUTCHours();
  for (const f of FERESTRE) {
    if (ora >= f.de && ora <= f.pana) return f.sesiune;
  }
  return "ASIAN";
}

/**
 * Sesiunea unei tranzacții, din tot ce știm despre ea.
 *
 * Ordinea contează și e deliberată:
 *
 *  1. Ce s-a trimis explicit. Un client care știe ce vrea nu se contrazice.
 *  2. Killzone-ul ales de om. E o decizie, nu o deducție.
 *  3. Ora de intrare. Obiectivă, disponibilă mereu, și singura care acoperă
 *     tranzacțiile sincronizate automat — care până acum nu apăreau deloc în
 *     matrice, oricât de multe ar fi fost.
 */
export function sesiuneaTranzactiei(t: {
  sessionType?: SesiuneTranzactie | string | null;
  killzone?: Killzone | string | null;
  entryTime?: Date | string | null;
}): SesiuneTranzactie | null {
  if (t.sessionType && esteSesiune(t.sessionType)) return t.sessionType;
  if (t.killzone && esteKillzone(t.killzone)) return DIN_KILLZONE[t.killzone];
  if (t.entryTime) return sesiuneaDupaOra(t.entryTime);
  return null;
}

function esteSesiune(v: string): v is SesiuneTranzactie {
  return v === "ASIAN" || v === "LONDON" || v === "NEW_YORK" || v === "OVERLAP";
}

function esteKillzone(v: string): v is Killzone {
  return v === "ASIAN" || v === "LONDON" || v === "NEW_YORK" || v === "LONDON_CLOSE";
}
