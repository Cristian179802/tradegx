import { ApiError } from "@tradegx/api-client";
import { URL_API } from "./api";
import { tokenCurent, reimprospateaza } from "./auth";

// ── Chat cu asistentul ───────────────────────────────────────────────────────
//
// De ce NU trece prin clientul de API: ruta întoarce `text/plain` în flux, nu
// JSON. Clientul comun parsează mereu JSON, deci metoda ar fi aruncat la prima
// folosire — o eroare care ar fi arătat ca „AI-ul nu merge".
//
// NU SE CITEȘTE ÎN FLUX, se așteaptă răspunsul întreg. `fetch`-ul din React
// Native merge peste XHR și nu expune `response.body`, deci fluxul n-ar avea ce
// citi bucată cu bucată. Interfața arată trei puncte cât timp așteaptă; e mai
// cinstit decât un text care apare pe litere dar tot la sfârșit.
//
// Reîmprospătarea tokenului e repetată aici fiindcă nu trece prin `request`.
// O SINGURĂ dată, ca în client: un 401 care persistă înseamnă sesiune moartă.

export interface MesajChat {
  role: "user" | "assistant";
  content: string;
}

/**
 * Întoarce răspunsul asistentului ca text.
 *
 * Aruncă `ApiError` cu statusul real, ca ecranul să poată deosebi:
 *   402 — funcția nu e în planul tău
 *   429 — ai consumat cota (pe oră sau pe lună)
 *   restul — chiar e o defecțiune
 */
export async function intreabaAsistentul(
  mesaje: MesajChat[],
  mod = "general",
): Promise<string> {
  return textDeLa("/api/ai-assistant/chat", { messages: mesaje, mode: mod });
}

/**
 * Tutorele din Academie. Aceeași cale ca asistentul — răspunde tot cu text în
 * flux, nu cu JSON — dar cu alt context: serverul citește singur textul lecției
 * din `moduleId` + `lessonId`, deci nu-l trimitem noi.
 */
export async function intreabaTutorele(p: {
  moduleId: string;
  lessonId: string;
  question: string;
}): Promise<string> {
  return textDeLa("/api/academy/tutor", { ...p, lang: "ro" });
}

/** Cere o rută care întoarce TEXT, cu o singură reîncercare după 401. */
async function textDeLa(cale: string, corp: unknown): Promise<string> {
  const cere = async (token: string | null) =>
    fetch(`${URL_API}${cale}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(corp),
    });

  let r = await cere(await tokenCurent());

  if (r.status === 401) {
    const nou = await reimprospateaza();
    if (nou) r = await cere(nou);
  }

  if (!r.ok) {
    const brut = await r.text().catch(() => "");
    let mesaj = brut || r.statusText;
    // Erorile vin ca JSON chiar dacă răspunsul reușit e text simplu.
    try {
      const j = JSON.parse(brut) as { error?: string; message?: string };
      mesaj = j.error ?? j.message ?? mesaj;
    } catch { /* a fost text simplu */ }
    throw new ApiError(r.status, mesaj);
  }

  return (await r.text()).trim();
}
