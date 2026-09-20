import { Platform } from "react-native";
import {
  surface, line, ink, accent, pnl, state,
  spacing, radius, fontSize, tracking, duration,
} from "@tradegx/ui-tokens";

// ── Tema nativă ──────────────────────────────────────────────────────────────
//
// Culorile, spațiile și scara tipografică vin din `@tradegx/ui-tokens`, adică
// EXACT aceleași cifre ca `globals.css`. Aici se adaugă doar ce n-are sens pe
// web: umbre native, înălțimi de atingere, comportamentul fonturilor.
//
// Nu se inventează culori în ecrane. Dacă un ecran are nevoie de o nuanță care
// nu e aici, întrebarea corectă e dacă are nevoie cu adevărat — nu unde s-o
// scrie.

export const T = {
  surface, line, ink, accent, pnl, state,
  spacing, radius, fontSize, tracking, duration,
} as const;

/**
 * Ținta minimă de atingere. 44pt e pragul din ghidul Apple, 48dp din Material.
 * Luăm maximul: un buton pe care nu-l nimerești din prima e un defect, nu o
 * chestiune de densitate.
 */
export const ATINGERE_MIN = 48;

/**
 * Umbre. Android nu are `shadow*`, are `elevation`; iOS nu are `elevation`.
 * Un obiect per nivel, ca să nu se scrie condiționale de platformă în ecrane.
 */
export const umbra = (nivel: 1 | 2 | 3) => {
  const cfg = {
    1: { h: 2, blur: 8, opac: 0.25, elev: 2 },
    2: { h: 8, blur: 20, opac: 0.35, elev: 6 },
    3: { h: 16, blur: 36, opac: 0.45, elev: 12 },
  }[nivel];

  return Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: cfg.h },
      shadowRadius: cfg.blur,
      shadowOpacity: cfg.opac,
    },
    android: { elevation: cfg.elev },
    default: {},
  })!;
};

/**
 * Familia de fonturi pentru cifre. Pe web e Space Grotesk; pe telefon folosim
 * fontul de sistem cu cifre TABULARE, ca o coloană de sume să rămână aliniată.
 * Fără asta, „1" e mai îngust decât „8" și tot tabelul tremură la fiecare
 * reîmprospătare.
 */
export const cifre = Platform.select({
  ios: { fontVariant: ["tabular-nums" as const] },
  android: { fontVariant: ["tabular-nums" as const] },
  default: {},
})!;

/** Culoarea semantică a unei sume. Verde/roșu NUMAI aici. */
export function tonPnl(valoare: number | null | undefined): string {
  if (valoare == null || valoare === 0) return ink.i2;
  return valoare > 0 ? pnl.gain : pnl.loss;
}
