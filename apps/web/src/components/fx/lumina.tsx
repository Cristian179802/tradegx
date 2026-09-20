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
//
// PE TELEFON nu există cursor de urmărit. Prima variantă se oprea aici, ceea ce
// însemna că pe telefon — unde mulți își verifică jurnalul — nu se vedea nimic
// din tot sistemul. Acolo lumina se aprinde la ATINGERE, în punctul atins, și
// se stinge singură. Aceleași variabile, același CSS, alt declanșator.

const CARDURI = ".tg-lumina, .tg-panel, .tg-surface, .premium-card, .card-3d, .cyber-card";

/** Cât ține lumina după o atingere, ms. */
const DUPA_ATINGERE = 650;

function scrie(card: HTMLElement, x: number, y: number) {
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

function stinge(el: HTMLElement | null) {
  if (!el) return;
  el.style.setProperty("--lit", "0");
  el.style.setProperty("--tx", "0");
  el.style.setProperty("--ty", "0");
}

function cardDeSub(x: number, y: number): HTMLElement | null {
  const sub = document.elementFromPoint(x, y);
  return sub instanceof Element ? (sub.closest(CARDURI) as HTMLElement | null) : null;
}

export function Lumina() {
  React.useEffect(() => {
    const tactil = window.matchMedia("(hover: none)").matches;

    // ── Telefon / tabletă: lumina se aprinde unde atingi ────────────────────
    if (tactil) {
      let ceas = 0;
      let ultim: HTMLElement | null = null;

      const laAtingere = (e: PointerEvent) => {
        const card = cardDeSub(e.clientX, e.clientY);
        if (!card) return;
        if (ultim && ultim !== card) stinge(ultim);
        ultim = card;
        scrie(card, e.clientX, e.clientY);
        window.clearTimeout(ceas);
        ceas = window.setTimeout(() => stinge(card), DUPA_ATINGERE);
      };

      document.addEventListener("pointerdown", laAtingere, { passive: true });
      return () => {
        document.removeEventListener("pointerdown", laAtingere);
        window.clearTimeout(ceas);
        stinge(ultim);
      };
    }

    // ── Mouse: lumina urmărește ─────────────────────────────────────────────
    let cadru = 0;
    let ultim: HTMLElement | null = null;
    let x = 0;
    let y = 0;

    function deseneaza() {
      cadru = 0;
      const card = cardDeSub(x, y);
      if (card !== ultim) {
        stinge(ultim);
        ultim = card;
      }
      if (card) scrie(card, x, y);
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
