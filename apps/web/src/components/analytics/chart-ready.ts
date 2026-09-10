"use client";

import * as React from "react";

// ── Semnalul „graficul e desenat" ────────────────────────────────────────────
//
// Un script de captură care apasă imediat ce datele au sosit filmează spinnere
// și grafice pe jumătate trasate. `data-chart-ready` e contractul: apare pe
// container abia când nu mai e nimic de desenat.
//
// DE CE NU „după fetch": între răspunsul serverului și pixelii de pe ecran
// stau randarea React, calculul scalelor din Recharts și animația de intrare a
// curbei. Toate durează, iar la o mașină încărcată durează mai mult — exact
// când te aștepți mai puțin.
//
// DE CE NU `onAnimationEnd` de la Recharts: nu se declanșează dacă animația e
// oprită, iar la `prefers-reduced-motion` nici nu există. Un semnal care lipsește
// tăcut în anumite medii e mai rău decât niciunul.
//
// CE FACEM: urmărim geometria efectivă. Când atributul `d` al curbei rămâne
// NESCHIMBAT trei cadre la rând, desenul s-a oprit — indiferent dacă a fost
// animat, instant, sau întrerupt de setările de accesibilitate. E o observație
// despre ce s-a pictat, nu o presupunere despre cum s-a ajuns acolo.

/** Câte cadre consecutive fără schimbare înseamnă „gata". */
const CADRE_STABILE = 3;

/** Sub atâtea caractere, `d` e un ciot, nu o curbă. */
const LUNGIME_MINIMA = 20;

/**
 * Pune `data-chart-ready="true"` pe elementul din `ref` când desenul s-a oprit.
 *
 * @param activ  fals cât timp încă nu există date de desenat (stare goală,
 *               încărcare) — altfel am declara „gata" un grafic inexistent.
 */
export function useChartReady(ref: React.RefObject<HTMLElement | null>, activ = true) {
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Re-rularea efectului (schimbare de date) retrage semnalul: altfel un
    // script care așteaptă a doua randare l-ar găsi deja setat din prima.
    el.removeAttribute("data-chart-ready");
    if (!activ) return;

    let raf = 0;
    let anterior = "";
    let stabile = 0;

    const cadru = () => {
      const curba = el.querySelector("svg path[d]");
      const d = curba?.getAttribute("d") ?? "";

      if (d.length >= LUNGIME_MINIMA && d === anterior) stabile++;
      else stabile = 0;
      anterior = d;

      if (stabile >= CADRE_STABILE) {
        el.setAttribute("data-chart-ready", "true");
        return;
      }
      raf = requestAnimationFrame(cadru);
    };

    raf = requestAnimationFrame(cadru);
    return () => cancelAnimationFrame(raf);
  }, [ref, activ]);
}
