import type { Instrumentation } from "next";

// ── Cârligul global de erori ─────────────────────────────────────────────────
//
// `lib/api-error.ts` prinde erorile la care ne-am gândit. Fișierul ăsta le prinde
// pe celelalte — și alea contează cel mai mult, fiindcă nimeni nu le-a anticipat.
// Next apelează `onRequestError` pentru orice excepție netratată de pe server:
// randare de pagină, rută API, acțiune de server.
//
// Importul e DINAMIC, înăuntru: fișierul se încarcă în ambele runtime-uri, iar
// `error-monitor` trage după el Prisma și `node:crypto`, care nu există pe Edge.
// Un import static ar strica middleware-ul — adică tot site-ul.

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context
) => {
  // Pe Edge nu avem Prisma. Erorile de acolo rămân în logurile Vercel; nu merită
  // stricat runtime-ul ca să le prindem.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { captureError } = await import("@/lib/error-monitor");
    await captureError(
      // Eticheta spune DE UNDE vine, ca lista să se poată citi fără să deschizi
      // fiecare rând: „server:/api/trades" e altceva decât „server:/dashboard".
      `server:${context.routePath || request.path}`,
      err,
      { route: request.path }
    );
  } catch {
    // Dacă nici monitorul nu poate porni, cererea a eșuat deja — nu o mai
    // înrăutățim cu o a doua excepție.
  }
};
