import * as WebBrowser from "expo-web-browser";
import { api, ApiError, URL_API } from "./api";

// ── Plata ────────────────────────────────────────────────────────────────────
//
// UN SINGUR LOC prin care trec banii. Nu pentru eleganță: metoda de plată se va
// schimba, iar când se schimbă vreau să ating un fișier, nu douăsprezece
// ecrane.
//
// AZI: Stripe Checkout, deschis în browserul APLICAȚIEI (Custom Tab pe Android),
// nu în Chrome. Diferența e mare pentru cine folosește: pagina de plată apare
// PESTE aplicație, cu un X în colț, iar la închidere ești înapoi exact unde
// erai. Nu ieși din aplicație și nu te întorci prin butonul de „recente".
//
// ⚠️ CE TREBUIE ȘTIUT ÎNAINTE DE PUBLICAREA ÎN GOOGLE PLAY.
//
// Google cere ca abonamentele digitale consumate în aplicație să treacă prin
// Google Play Billing. Un buton care duce la Stripe — chiar și într-un Custom
// Tab — e „anti-steering", cel mai frecvent motiv pentru care o aplicație e
// scoasă din magazin. Regula s-a slăbit după procesul Epic (SUA) și DMA (UE),
// dar la review tot acolo se uită primul.
//
// Trecerea la Play Billing înseamnă: cont Play Console, produsele definite
// acolo, `react-native-iap` (sau `expo-in-app-purchases`) în aplicație, și
// validarea bonului pe server înainte de a activa PRO. Google ia 15–30%.
//
// Când se face mutarea, se schimbă DOAR `cumpara()` de mai jos. Restul
// aplicației cheamă funcția asta și nu știe nimic despre cine încasează.

export type Treapta = "pro" | "premium";
export type Perioada = "monthly" | "annual";

export type RezultatPlata =
  | { fel: "inchis" }        // omul a închis fereastra; poate a plătit, poate nu
  | { fel: "neconfigurat" }  // Stripe nu e pornit pe server
  | { fel: "eroare"; mesaj: string };

/**
 * Deschide plata pentru treapta și perioada cerute.
 *
 * NU întoarce „a plătit / n-a plătit", și nu poate: browserul se închide la fel
 * în ambele cazuri. Adevărul îl știe doar serverul, după ce Stripe îi trimite
 * evenimentul. De aceea ecranul reîmprospătează starea abonamentului la
 * întoarcere, în loc să presupună ceva.
 */
export async function cumpara(treapta: Treapta, perioada: Perioada): Promise<RezultatPlata> {
  try {
    const r = (await api.abonament.checkout({
      tier: treapta,
      period: perioada,
      // Paginile de întoarcere sunt ale site-ului: Stripe cere adrese https, nu
      // acceptă scheme proprii de aplicație. Omul le vede o clipă în fereastra
      // care se închide.
      successUrl: `${URL_API}/billing?plata=ok`,
      cancelUrl: `${URL_API}/billing?plata=anulat`,
    })) as { url?: string };

    if (!r.url) return { fel: "eroare", mesaj: "Serverul n-a întors o adresă de plată." };

    await WebBrowser.openBrowserAsync(r.url, {
      // Culorile ferestrei, ca să nu sară un alb orbitor peste o aplicație
      // întunecată. Sunt sugestii: unele telefoane le ignoră.
      toolbarColor: "#0b0d13",
      controlsColor: "#6d75f6",
      enableBarCollapsing: false,
      showTitle: true,
    });

    return { fel: "inchis" };
  } catch (e) {
    if (e instanceof ApiError && e.status === 503) return { fel: "neconfigurat" };
    return {
      fel: "eroare",
      mesaj: e instanceof ApiError ? e.message : "Nu am putut deschide plata.",
    };
  }
}

/**
 * Portalul Stripe: schimbare de card, anulare, facturi.
 *
 * E separat de `cumpara` fiindcă e altceva: acolo se ADMINISTREAZĂ un abonament
 * existent, nu se cumpără unul. Google tratează diferit cele două, iar dacă
 * mâine cumpărarea trece prin Play Billing, portalul rămâne cum e.
 */
export async function deschidePortalul(): Promise<RezultatPlata> {
  try {
    const r = (await api.abonament.portal()) as { url?: string };
    if (!r.url) return { fel: "eroare", mesaj: "Serverul n-a întors o adresă." };

    await WebBrowser.openBrowserAsync(r.url, {
      toolbarColor: "#0b0d13",
      controlsColor: "#6d75f6",
      showTitle: true,
    });
    return { fel: "inchis" };
  } catch (e) {
    if (e instanceof ApiError && e.status === 503) return { fel: "neconfigurat" };
    return {
      fel: "eroare",
      mesaj: e instanceof ApiError ? e.message : "Nu am putut deschide administrarea.",
    };
  }
}
