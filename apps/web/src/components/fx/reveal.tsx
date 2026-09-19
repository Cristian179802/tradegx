"use client";

import * as React from "react";

// ── Dezvăluire la intrarea în cadru ──────────────────────────────────────────
//
// Un singur observator pentru toată pagina, la fel ca la lumină. Elementele se
// înscriu punând clasa `.tg-reveal`; observatorul le adaugă `.vazut` când intră
// în cadru și apoi le uită — o dată, nu la fiecare derulare în sus și în jos.
//
// Starea inițială (invizibil, împins 10px în jos) stă în CSS, nu aici. Dacă
// scriptul întârzie sau nu rulează deloc, cea mai proastă variantă e conținutul
// vizibil de la început — nu unul care rămâne ascuns.

export function Reveal({ radacina }: { radacina?: React.RefObject<HTMLElement | null> }) {
  React.useEffect(() => {
    const tinta = radacina?.current ?? document;

    if (!("IntersectionObserver" in window)) {
      tinta.querySelectorAll(".tg-reveal").forEach((el) => el.classList.add("vazut"));
      return;
    }

    const obs = new IntersectionObserver(
      (intrari) => {
        for (const i of intrari) {
          if (!i.isIntersecting) continue;
          i.target.classList.add("vazut");
          obs.unobserve(i.target);
        }
      },
      // `-40px` jos: începe cu puțin înainte să ajungă la margine, ca mișcarea
      // să fie deja pe la jumătate când elementul e cu adevărat în cadru.
      { rootMargin: "0px 0px -40px 0px", threshold: 0.01 },
    );

    const inscrie = () => {
      tinta.querySelectorAll(".tg-reveal:not(.vazut)").forEach((el) => obs.observe(el));
    };
    inscrie();

    // Conținutul dashboard-ului vine după o cerere de rețea: ce apare mai
    // târziu trebuie observat și el.
    const mo = new MutationObserver(inscrie);
    mo.observe(tinta === document ? document.body : (tinta as HTMLElement), {
      childList: true,
      subtree: true,
    });

    return () => {
      obs.disconnect();
      mo.disconnect();
    };
  }, [radacina]);

  return null;
}
