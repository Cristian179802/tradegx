import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { URL_API } from "./api";

// ── Conectare cu Google ──────────────────────────────────────────────────────
//
// DOUĂ DRUMURI, în ordinea asta:
//
// 1. NATIV — selectorul de conturi al telefonului, fără browser. Ăsta e cel
//    bun: nu te scoate din aplicație nicio clipă. Cere un client OAuth Android
//    în Google Cloud Console, legat de amprenta cheii cu care semnăm.
//
// 2. FEREASTRĂ — rezerva, folosită DOAR dacă Google refuză nativul fiindcă
//    amprenta sau pachetul nu sunt înregistrate (eroarea lor, DEVELOPER_ERROR).
//    Fără rezerva asta, o aplicație livrată înaintea configurării din Console
//    ar avea un buton care nu face nimic.
//
// Rezerva NU se folosește când omul a anulat sau când n-are internet: alea nu
// sunt probleme de configurare, iar a-l plimba prin browser după ce tocmai a
// închis fereastra nativă ar fi enervant.
//
// DE CE NU VINE TOKENUL DIRECT PRIN LINK. Drumul înapoi e `tradegx://`, iar pe
// Android orice aplicație poate înregistra aceeași schemă. Deci prin link trece
// doar un cod care singur nu valorează nimic: ținem aici un secret pe care nu-l
// trimitem NICIODATĂ prin link, punem în cerere doar amprenta lui, iar serverul
// leagă codul de amprentă. Cine prinde linkul n-are secretul, deci n-are ce
// face cu codul. Vezi și `lib/mobile-auth.ts` pe server.

export type Rezultat =
  | { fel: "gata"; accessToken: string; refreshToken: string; user: { id: string; email: string; name: string | null } }
  | { fel: "anulat" }
  | { fel: "eroare"; mesaj: string };

const INTOARCERE = "tradegx://auth";

/** base64url dintr-un șir de octeți, fără padding. */
function base64url(octeti: Uint8Array): string {
  let brut = "";
  for (const o of octeti) brut += String.fromCharCode(o);
  return globalThis
    .btoa(brut)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const ID_CLIENT_WEB =
  (Constants.expoConfig?.extra?.googleWebClientId as string | undefined) ?? "";

/** Intrarea folosită de ecrane. Nativ întâi, fereastră doar ca rezervă. */
export async function conecteazaCuGoogle(): Promise<Rezultat> {
  const nativ = await cuSelectorNativ();
  if (nativ.fel !== "neconfigurat") return nativ;
  return cuFereastra();
}

/**
 * Selectorul de conturi al telefonului. `neconfigurat` înseamnă că Google n-a
 * recunoscut aplicația — lipsește clientul Android din Console, sau amprenta
 * nu se potrivește. Doar atunci merită încercată fereastra.
 */
async function cuSelectorNativ(): Promise<Rezultat | { fel: "neconfigurat" }> {
  if (!ID_CLIENT_WEB) return { fel: "neconfigurat" };

  try {
    const { GoogleSignin } = await import("@react-native-google-signin/google-signin");

    GoogleSignin.configure({ webClientId: ID_CLIENT_WEB, offlineAccess: false });
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // ÎNTOTDEAUNA întrebăm cu ce cont. Fără asta, Google ține minte ultima
    // alegere și te bagă direct în ea — ceea ce pe un ECRAN DE LOGIN e greșit:
    // acolo ajungi tocmai când vrei să alegi, iar cine are un cont personal și
    // unul de firmă n-ar avea nicio cale să treacă de la unul la altul.
    //
    // `signOut` șterge doar sesiunea Google DIN APLICAȚIA NOASTRĂ. Contul rămâne
    // pe telefon, în Google, neatins — nu deconectăm pe nimeni de nicăieri.
    await GoogleSignin.signOut().catch(() => {});

    const raspuns = await GoogleSignin.signIn();
    const idToken =
      (raspuns as { data?: { idToken?: string | null } }).data?.idToken ??
      (raspuns as { idToken?: string | null }).idToken ??
      null;

    if (!idToken) {
      // Selectorul s-a închis fără să aleagă nimeni.
      return { fel: "anulat" };
    }

    const r = await fetch(`${URL_API}/api/auth/mobile/google/native`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    const d = await r.json().catch(() => null);

    // Serverul n-are cheile Google puse; fereastra n-ar merge nici ea, dar
    // mesajul de acolo e la fel de limpede.
    if (r.status === 503) return { fel: "neconfigurat" };
    if (!r.ok) return { fel: "eroare", mesaj: d?.error ?? "Nu am putut termina conectarea." };

    return { fel: "gata", accessToken: d.accessToken, refreshToken: d.refreshToken, user: d.user };
  } catch (e) {
    const cod = (e as { code?: string })?.code;
    const { statusCodes } = await import("@react-native-google-signin/google-signin");

    if (cod === statusCodes.SIGN_IN_CANCELLED) return { fel: "anulat" };
    if (cod === statusCodes.IN_PROGRESS) return { fel: "anulat" };
    if (cod === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) return { fel: "neconfigurat" };

    // DEVELOPER_ERROR = Google nu recunoaște aplicația: lipsește clientul
    // Android din Console, sau amprenta de semnare nu se potrivește. Biblioteca
    // nu-l mai ține în `statusCodes` de la versiunea 13, dar Android tot cu el
    // răspunde — ca text, sau ca 10, codul lui din Play Services.
    if (cod === "DEVELOPER_ERROR" || String(cod) === "10") return { fel: "neconfigurat" };
    // Orice altceva (rețea, Google căzut) — nu e de configurare, deci n-are rost
    // să-l plimbăm prin browser după același lucru.
    return { fel: "eroare", mesaj: "Conectarea cu Google n-a mers. Încearcă din nou." };
  }
}

async function cuFereastra(): Promise<Rezultat> {
  // Secretul rămâne în memoria aplicației, atât. Nu-l salvăm nicăieri: dacă
  // fluxul nu se termină în două minute, oricum nu mai e bun de nimic.
  const secret = base64url(await Crypto.getRandomBytesAsync(32));
  const amprenta = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    secret,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );
  // digestStringAsync dă base64 clasic; serverul compară cu base64url.
  const challenge = amprenta.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  let rezultat: WebBrowser.WebBrowserAuthSessionResult;
  try {
    rezultat = await WebBrowser.openAuthSessionAsync(
      `${URL_API}/mobile-google?challenge=${encodeURIComponent(challenge)}`,
      INTOARCERE,
    );
  } catch {
    return { fel: "eroare", mesaj: "Nu am putut deschide fereastra Google." };
  }

  // Omul a închis fereastra, sau a apăsat înapoi.
  if (rezultat.type !== "success") return { fel: "anulat" };

  const intors = Linking.parse(rezultat.url);
  const param = (nume: string): string | null => {
    const v = intors.queryParams?.[nume];
    return typeof v === "string" ? v : null;
  };

  const eroare = param("eroare");
  if (eroare === "neautentificat") {
    return { fel: "eroare", mesaj: "Google n-a confirmat conectarea. Încearcă din nou." };
  }
  if (eroare) return { fel: "eroare", mesaj: "Conectarea cu Google n-a mers. Încearcă din nou." };

  const cod = param("cod");
  if (!cod) return { fel: "eroare", mesaj: "Răspuns neașteptat de la server." };

  try {
    const r = await fetch(`${URL_API}/api/auth/mobile/google/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cod, secret }),
    });
    const d = await r.json().catch(() => null);
    if (!r.ok) {
      return { fel: "eroare", mesaj: d?.error ?? "Nu am putut termina conectarea." };
    }
    return { fel: "gata", accessToken: d.accessToken, refreshToken: d.refreshToken, user: d.user };
  } catch {
    return { fel: "eroare", mesaj: "Nu m-am putut conecta. Verifică internetul." };
  }
}
