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
//
// PLASA DE SIGURANȚĂ. Un efect de intrare are o cale de eșec inacceptabilă:
// conținut care rămâne invizibil. Se poate întâmpla într-un container cu
// `overflow` neașteptat, într-un tab ascuns care se afișează altfel decât prin
// `display`, sau dacă observatorul pur și simplu nu se declanșează. De aceea,
// la fiecare secundă verificăm: orice element care E PE ECRAN dar n-a fost
// dezvăluit, se dezvăluie. O animație ratată e un fleac; o pagină goală, nu.

const PLASA_MS = 1000;

export function Reveal({ radacina }: { radacina?: React.RefObject<HTMLElement | null> }) {
  React.useEffect(() => {
    const tinta: Document | HTMLElement = radacina?.current ?? document;

    const aratTot = () => {
      tinta.querySelectorAll(".tg-reveal").forEach((el) => el.classList.add("vazut"));
    };

    if (!("IntersectionObserver" in window)) {
      aratTot();
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

    // Plasa de siguranță — vezi nota de sus.
    const plasa = window.setInterval(() => {
      const ramase = tinta.querySelectorAll(".tg-reveal:not(.vazut)");
      if (ramase.length === 0) return;
      for (const el of ramase) {
        const r = el.getBoundingClientRect();
        const peEcran =
          r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
        if (peEcran) {
          el.classList.add("vazut");
          obs.unobserve(el);
        }
      }
    }, PLASA_MS);

    return () => {
      obs.disconnect();
      mo.disconnect();
      window.clearInterval(plasa);
    };
  }, [radacina]);

  return null;
}
