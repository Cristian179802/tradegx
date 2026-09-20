import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";

// ── Tipografia de brand ──────────────────────────────────────────────────────
//
// DE CE EXISTĂ. Fără fonturi proprii, aplicația moștenește fontul de SISTEM al
// telefonului. Pe Android multe interfețe (Samsung, Xiaomi, OnePlus) lasă omul
// să-și schimbe fontul global — iar aplicația se schimbă odată cu el. Pe un
// telefon cu font caligrafic, tot ecranul devine caligrafic: titluri, cifre,
// solduri. S-a văzut exact asta pe primul build.
//
// Aceleași două fonturi ca web-ul: Inter pentru text, Space Grotesk pentru
// cifre și titluri. Un utilizator care trece de pe site pe telefon trebuie să
// recunoască același produs.
//
// DE CE NU TOATE GREUTĂȚILE. Fiecare fișier încărcat intră în pachet și în
// memorie. Cinci greutăți de Inter și două de Grotesk acoperă tot ce folosim;
// restul ar fi octeți pentru nimic.

export const FONT = {
  corp: "Inter_400Regular",
  corpMediu: "Inter_500Medium",
  corpSemi: "Inter_600SemiBold",
  corpBold: "Inter_700Bold",
  corpExtra: "Inter_800ExtraBold",
  /** Cifre și titluri — identic cu `--font-display` de pe web. */
  cifre: "SpaceGrotesk_500Medium",
  cifreBold: "SpaceGrotesk_700Bold",
} as const;

/**
 * Traduce o greutate CSS în familia potrivită.
 *
 * Pe Android, `fontWeight` NU funcționează cu fonturi încărcate: fiecare
 * greutate e un fișier separat, iar sistemul nu le leagă singur. Dacă lași doar
 * `fontWeight: "800"`, Android afișează Regular și ignoră cererea — text care
 * arată subțire exact unde trebuia să fie apăsat.
 */
export function familie(greutate?: string | number): string {
  const g = String(greutate ?? "400");
  if (g === "800" || g === "900") return FONT.corpExtra;
  if (g === "700" || g === "bold") return FONT.corpBold;
  if (g === "600") return FONT.corpSemi;
  if (g === "500") return FONT.corpMediu;
  return FONT.corp;
}

/** Familia pentru cifre, după greutate. */
export function familieCifre(greutate?: string | number): string {
  const g = String(greutate ?? "400");
  return g === "700" || g === "800" || g === "900" || g === "bold"
    ? FONT.cifreBold
    : FONT.cifre;
}

/** `true` când fonturile sunt gata. Până atunci nu desenăm text. */
export function useFonturi(): boolean {
  const [gata] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });
  return gata;
}
