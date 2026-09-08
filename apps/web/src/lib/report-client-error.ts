"use client";

// ── Raportarea erorilor din browser ──────────────────────────────────────────
//
// Trimite spre `/api/client-errors`. Regula de aur: raportarea unei erori NU are
// voie să producă alta. Tot ce e aici e învelit, nimic nu așteaptă, nimic nu
// aruncă.
//
// DEDUBLARE LOCALĂ, înainte de rețea. O componentă care aruncă la randare poate
// arunca de mii de ori pe secundă. Fără filtrul ăsta, un singur defect ar trimite
// mii de cereri din browserul unui om — mai rău pentru el decât defectul în sine.

/** Amprente deja trimise în viața paginii curente. */
const trimise = new Set<string>();

/** Plafon dur per încărcare de pagină, oricâte erori DIFERITE ar apărea. */
const MAX_PER_PAGINA = 5;
let cateTrimise = 0;

function amprentaLocala(mesaj: string, stiva: string): string {
  // Primul cadru al stivei separă două erori cu același text din locuri diferite.
  const primulCadru = stiva.split("\n")[1]?.trim() ?? "";
  return `${mesaj}|${primulCadru}`.slice(0, 300);
}

/**
 * Raportează o eroare de browser. Nu așteaptă răspuns și nu aruncă niciodată.
 */
export function reportClientError(err: unknown, context?: { route?: string }): void {
  try {
    if (cateTrimise >= MAX_PER_PAGINA) return;

    const mesaj = err instanceof Error ? err.message : String(err);
    const stiva = err instanceof Error && err.stack ? err.stack : "";
    if (!mesaj || mesaj.length < 3) return;

    const amprenta = amprentaLocala(mesaj, stiva);
    if (trimise.has(amprenta)) return;
    trimise.add(amprenta);
    cateTrimise++;

    const date = JSON.stringify({
      message: mesaj,
      stack: stiva,
      route: context?.route ?? window.location.pathname,
    });

    // `sendBeacon` supraviețuiește navigării: dacă eroarea a apărut fix când omul
    // pleacă de pe pagină, un `fetch` obișnuit ar fi anulat și n-am afla nimic.
    // Cade pe fetch acolo unde nu există.
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/client-errors", new Blob([date], { type: "application/json" }));
    } else {
      void fetch("/api/client-errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: date,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Regula de aur.
  }
}

/**
 * Ascultă erorile pe care nu le prinde nicio barieră React.
 *
 * Barierele (`error.tsx`) prind ce se strică la randare. Astea două prind restul:
 * o excepție dintr-un handler de click, o promisiune respinsă fără `catch`.
 * Împreună acoperă tot ce se poate strica în browser.
 *
 * Întoarce funcția de dezabonare.
 */
export function ascultaEroriGlobale(): () => void {
  const onError = (e: ErrorEvent) => reportClientError(e.error ?? e.message);
  const onRejection = (e: PromiseRejectionEvent) => reportClientError(e.reason);

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
