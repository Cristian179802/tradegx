"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

/**
 * Cere o împrospătare a conturilor conectate când deschizi aplicația sau revii în
 * tab, apoi reîncarcă datele paginii.
 *
 * Cron-ul rulează la cinci minute, deci în cel mai rău caz vezi date de acum
 * aproape cinci minute — exact în momentul în care te uiți, adică atunci când
 * prospețimea contează cel mai mult. Asta acoperă fereastra.
 *
 * Trei limite, fiecare pentru un motiv concret:
 *
 *  · Serverul refuză un cont împrospătat în ultimul minut. Limita ADEVĂRATĂ e
 *    acolo, nu aici — clientul se poate reîncărca, se poate falsifica, poate rula
 *    în zece taburi. Ce e aici doar evită cereri inutile.
 *  · Un singur declanșator per încărcare de pagină, plus la revenirea în tab după
 *    cel puțin un minut. Fără asta, comutatul rapid între taburi ar trimite cereri
 *    în serie.
 *  · Nu afișează nimic. Un „se sincronizează…" care apare la fiecare revenire în
 *    tab e zgomot; dacă a intrat ceva nou, se vede în cifre, care e tot ce
 *    interesează.
 */
export function AutoRefresh() {
  const router = useRouter();
  const { data: session } = useSession();
  // Contul demo e read-only, iar middleware-ul refuză CENTRAL orice mutație pe
  // API. Cererea pleca oricum și primea 403 — o eroare roșie în consolă la
  // fiecare încărcare a dashboard-ului, pe exact contul pe care intră oricine
  // vrea să vadă produsul. Regula centrală e corectă; clientul trebuia să n-o
  // provoace.
  const isDemo = session?.user?.role === "DEMO";
  const lastRun = React.useRef(0);
  const running = React.useRef(false);

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      if (running.current) return;
      if (isDemo) return;
      // Aceeași regulă ca la pulsul din șină, pe care o uitasem aici: cu tabul
      // în fundal nu cerem nimic. Baza suspendă computul după cinci minute fără
      // interogări, iar un tab deschis undeva în spate n-are de ce s-o țină trează.
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastRun.current < 60_000) return;
      running.current = true;
      lastRun.current = Date.now();
      try {
        const res = await fetch("/api/accounts/refresh", { method: "POST" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        // Reîncărcăm doar dacă a intrat ceva nou. Un router.refresh() la fiecare
        // revenire în tab ar reface degeaba toate componentele de server.
        if (data.imported > 0) router.refresh();
      } catch {
        // Offline sau bursă indisponibilă: pagina rămâne cu ce are.
      } finally {
        running.current = false;
      }
    }

    void run();

    function onVisible() {
      if (document.visibilityState === "visible") void run();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, isDemo]);

  return null;
}
