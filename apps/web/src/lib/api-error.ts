import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// ── Erorile pe care le vede clientul ─────────────────────────────────────────
//
// DE CE EXISTĂ FIȘIERUL ĂSTA. Tiparul `catch (err) { return { error: err.message } }`
// trimitea textul brut al excepției direct în fereastra unui client plătitor:
// un mesaj Prisma cu numele coloanelor, un URL de API extern, sau — verificat în
// producție — „ANTHROPIC_API_KEY lipsește din .env.local. Adaugă cheia și
// repornește serverul." Când creditul Anthropic se termina, clientul citea în
// chat un mesaj care îi spunea LUI să-și încarce contul de Anthropic.
//
// Regula, de acum: clientul vede o propoziție pe care o poate acționa; detaliul
// tehnic merge DOAR în log.
//
// DE CE DICȚIONAR TIPIZAT ȘI NU `messages/*.json`. Erorile de API sunt server-side
// și nu trec prin `useTranslations`, deci poarta de i18n nu le vedea — de-aia au
// și rămas toate în română. Aici, cele două limbi stau în același obiect: nu pot
// diverge, iar TypeScript respinge la build o cheie inexistentă. Un `t("cheie")`
// pe JSON ar fi eșuat abia la runtime, în fața clientului.

type Mesaj = { ro: string; en: string };

export const API_ERRORS = {
  // Generice
  generic: {
    ro: "Ceva n-a mers. Încearcă din nou.",
    en: "Something went wrong. Please try again.",
  },

  // AI
  aiUnavailable: {
    ro: "Asistentul AI nu este disponibil momentan. Revino puțin mai târziu.",
    en: "The AI assistant is unavailable right now. Please try again shortly.",
  },
  aiFailed: {
    ro: "Analiza AI a eșuat. Încearcă din nou.",
    en: "The AI analysis failed. Please try again.",
  },

  // Date de piață / calendar
  calendarFailed: {
    ro: "Nu am putut încărca evenimentele economice. Încearcă din nou.",
    en: "Couldn't load the economic events. Please try again.",
  },

  // Import și conectare conturi
  importFailed: {
    ro: "Importul a eșuat. Verifică fișierul și încearcă din nou.",
    en: "The import failed. Check the file and try again.",
  },
  brokerConnectFailed: {
    ro: "Conectarea contului a eșuat. Verifică datele și încearcă din nou.",
    en: "Couldn't connect the account. Check your details and try again.",
  },

  // Plăți
  checkoutFailed: {
    ro: "Nu am putut porni plata. Încearcă din nou sau scrie-ne.",
    en: "Couldn't start the checkout. Please try again or contact us.",
  },
} satisfies Record<string, Mesaj>;

export type ApiErrorKey = keyof typeof API_ERRORS;

/**
 * Limba clientului, din același cookie pe care îl citește restul aplicației.
 *
 * Fără cookie (cron, webhook, apel din afară) rămâne română — la fel ca
 * `i18n/request.ts`, ca cele două să nu poată răspunde diferit.
 */
async function locale(): Promise<"ro" | "en"> {
  try {
    const c = await cookies();
    return c.get("locale")?.value === "en" ? "en" : "ro";
  } catch {
    // `cookies()` aruncă în contexte fără cerere (unele căi de cron).
    return "ro";
  }
}

/** Textul erorii, în limba clientului. Pentru răspunsuri care nu sunt JSON. */
export async function apiErrorText(key: ApiErrorKey): Promise<string> {
  return API_ERRORS[key][await locale()];
}

/**
 * Răspuns de eroare gata de returnat.
 *
 * `log` primește eticheta și excepția reală — singurul loc unde ajunge detaliul
 * tehnic. `code` merge la client fiindcă un client are voie să ramifice pe un
 * cod stabil, dar nu pe un text care se schimbă cu limba.
 */
export async function apiError(
  key: ApiErrorKey,
  opts?: {
    status?: number;
    log?: [string, unknown];
    extra?: Record<string, unknown>;
  }
) {
  if (opts?.log) console.error(`[${opts.log[0]}]`, opts.log[1]);
  return NextResponse.json(
    { error: await apiErrorText(key), code: key, ...(opts?.extra ?? {}) },
    { status: opts?.status ?? 500 }
  );
}
