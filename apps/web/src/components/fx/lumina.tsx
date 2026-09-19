"use client";

import * as React from "react";

// ── Lumina care urmărește cursorul ───────────────────────────────────────────
//
// Un SINGUR ascultător pe document, pentru toată aplicația. Alternativa —
// câte un handler per card — ar însemna zeci de ascultători pe o pagină de
// dashboard, fiecare pornind propriul rAF.
//
// La fiecare mișcare aflăm ce card e sub cursor și îi scriem în variabile CSS
// poziția (`--lx`, `--ly`, în procente) și înclinarea (`--tx`, `--ty`, în
// intervalul −1..1). Restul e treaba CSS-ului: gradient, filament pe margine,
// rotație. Vezi blocul „MATERIALE ȘI LUMINĂ" din `globals.css`.
//
// De ce variabile CSS și nu stil inline din React: scrierea unei variabile nu
// declanșează nici randare React, nici recalcul de layout — doar compunere.
// Se poate face la fiecare cadru fără să coste nimic.

const CARDURI = ".tg-panel, .tg-surface, .premium-card, .card-3d, .cyber-card";

export function Lumina() {
  React.useEffect(() => {
    // Pe ecrane tactile nu există cursor de urmărit, iar `pointermove` ar
    // însemna muncă degeaba la fiecare atingere.
    if (window.matchMedia("(hover: none)").matches) return;

    let cadru = 0;
    let ultim: HTMLElement | null = null;
    let x = 0;
    let y = 0;

    function stinge(el: HTMLElement | null) {
      if (!el) return;
      el.style.setProperty("--lit", "0");
      el.style.setProperty("--tx", "0");
      el.style.setProperty("--ty", "0");
    }

    function deseneaza() {
      cadru = 0;
      const sub = document.elementFromPoint(x, y);
      const card = sub instanceof Element ? (sub.closest(CARDURI) as HTMLElement | null) : null;

      if (card !== ultim) {
        stinge(ultim);
        ultim = card;
      }
      if (!card) return;

      const r = card.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;

      const px = (x - r.left) / r.width;   // 0..1
      const py = (y - r.top) / r.height;   // 0..1

      card.style.setProperty("--lx", `${(px * 100).toFixed(1)}%`);
      card.style.setProperty("--ly", `${(py * 100).toFixed(1)}%`);
      // −1..1, cu centrul cardului la zero.
      card.style.setProperty("--tx", (px * 2 - 1).toFixed(3));
      card.style.setProperty("--ty", (py * 2 - 1).toFixed(3));
      card.style.setProperty("--lit", "1");
    }

    function laMiscare(e: PointerEvent) {
      x = e.clientX;
      y = e.clientY;
      if (!cadru) cadru = requestAnimationFrame(deseneaza);
    }

    function laIesire() {
      stinge(ultim);
      ultim = null;
    }

    document.addEventListener("pointermove", laMiscare, { passive: true });
    document.addEventListener("pointerleave", laIesire);
    // Derularea mută cardurile pe sub cursor fără niciun `pointermove`.
    window.addEventListener("scroll", laIesire, { passive: true });

    return () => {
      document.removeEventListener("pointermove", laMiscare);
      document.removeEventListener("pointerleave", laIesire);
      window.removeEventListener("scroll", laIesire);
      if (cadru) cancelAnimationFrame(cadru);
      stinge(ultim);
    };
  }, []);

  return null;
}
