import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { URL_API } from "./api";

// ── Conectare cu Google ──────────────────────────────────────────────────────
//
// DE CE TRECE PRINTR-O FEREASTRĂ DE BROWSER. Sesiunea Google trăiește pe
// tradegx.com, la NextAuth. Un selector nativ de conturi ar fi cerut un client
// OAuth Android separat în Google Cloud Console, legat de amprenta cheii cu
// care semnăm aplicația. Fereastra folosește clientul pe care site-ul îl are
// deja, deci merge fără nicio configurare în plus.
//
// Fereastra e un Custom Tab PESTE aplicație, nu Chrome: rămâi în aplicație, iar
// la final se închide singură. E același mecanism ca la plată.
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

export async function conecteazaCuGoogle(): Promise<Rezultat> {
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
