"use client";

import * as React from "react";

// ── Pulsul zilei ─────────────────────────────────────────────────────────────
//
// Fundalul aplicației se înclină imperceptibil spre verde sau roșu, după
// rezultatul zilei. Sub 5% opacitate: nu se observă conștient, dar ecranul pare
// că știe cum a mers ziua înainte să te uiți la cifre.
//
// Ce NU face: nu înlocuiește nicio cifră, nu e singurul semnal pentru nimic și
// nu se vede pe o captură. Un om care nu distinge verdele de roșu nu pierde
// absolut nimic — informația e în cifre, asta e doar atmosferă.
//
// Pragul: sub 0,05% din cont ziua se consideră plată. Altfel, un profit de doi
// dolari ar colora tot ecranul în verde, ceea ce ar fi o minciună de ton.

const PRAG = 0.0005;

export function Puls({ pnlAzi, sold }: { pnlAzi: number | null; sold: number | null }) {
  React.useEffect(() => {
    const body = document.body;

    if (pnlAzi == null || !sold || sold <= 0) {
      body.removeAttribute("data-puls");
      return;
    }

    const raport = pnlAzi / sold;
    if (Math.abs(raport) < PRAG) body.removeAttribute("data-puls");
    else body.setAttribute("data-puls", raport > 0 ? "sus" : "jos");

    return () => body.removeAttribute("data-puls");
  }, [pnlAzi, sold]);

  return null;
}
