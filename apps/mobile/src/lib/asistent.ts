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

async function trimite(mesaje: MesajChat[], mod: string, token: string | null) {
  return fetch(`${URL_API}/api/ai-assistant/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages: mesaje, mode: mod }),
  });
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
  let r = await trimite(mesaje, mod, await tokenCurent());

  if (r.status === 401) {
    const nou = await reimprospateaza();
    if (nou) r = await trimite(mesaje, mod, nou);
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
