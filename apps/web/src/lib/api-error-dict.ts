// ── Erorile serverului, în limba clientului ──────────────────────────────────
//
// PROBLEMA. Rutele API răspund cu `{ error: "Cont negăsit" }`, iar clientul
// afișează textul ca atare în toast. Mesajele astea nu trec prin
// `useTranslations`, deci poarta de i18n nu le-a văzut niciodată — un utilizator
// pe engleză primea română pe exact drumurile care contează: înregistrare,
// resetare parolă, conectare broker, import, plată.
//
// DE CE SE TRADUCE LA AFIȘARE, NU LA PRODUCERE. Mesajele sunt produse în ~310
// locuri din 101 rute, dar afișate în ~30. Traducerea la afișare atinge de zece
// ori mai puține locuri și, mai important, nu umblă deloc în logica de plăți sau
// autentificare — unde o greșeală mecanică ar costa mult mai mult decât câștigă.
//
// CUM NU POATE SĂ SE DEZLIPEASCĂ. Un dicționar copiat de mână s-ar învechi la
// primul mesaj nou. `scripts/i18n-scan.mjs` extrage acum literalele de eroare din
// rute și pică build-ul dacă vreunul lipsește de aici. Deci nu se poate adăuga
// un mesaj de eroare fără traducerea lui.

// Dicționarul stă în `@tradegx/core/api-errors`, ca să-l folosească și aplicația
// de telefon din aceeași sursă. Aici rămân doar funcțiile de traducere.
import { API_ERROR_EN } from "@tradegx/core/api-errors";

export { API_ERROR_EN };

/**
 * Traduce un mesaj de eroare venit de la server.
 *
 * Necunoscut → întors neatins. Un mesaj în română e mai bun decât unul lipsă,
 * iar poarta de build acoperă cazul în care ar fi trebuit tradus.
 */
export function translateApiError(text: unknown, locale: string): string | undefined {
  if (typeof text !== "string" || text.length === 0) return undefined;
  if (locale !== "en") return text;
  return API_ERROR_EN[text] ?? text;
}

/**
 * Varianta pentru client: își află singură limba, din același cookie pe care îl
 * citește `i18n/request.ts`.
 *
 * Fără hook intenționat. Toate afișările sunt în handlere de eveniment (click,
 * submit), deci rulează doar în browser — iar o funcție pură se poate aplica în
 * treizeci de locuri fără să atingă corpul fiecărei componente, ceea ce la o
 * editare mecanică pe un site cu clienți plătitori contează mai mult decât
 * eleganța unui hook.
 */
export function tApiError(text: unknown): string | undefined {
  const locale =
    typeof document !== "undefined" && /(?:^|;\s*)locale=en\b/.test(document.cookie)
      ? "en"
      : "ro";
  return translateApiError(text, locale);
}
