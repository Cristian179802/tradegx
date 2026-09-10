import type { Beat } from "./engine";

// ── Ritmul ───────────────────────────────────────────────────────────────────
//
// DOAR date. Nicio logică aici, niciodată. Ăsta e singurul fișier atins în faza
// 6, unde ritmul se ajustează de zece-cincisprezece ori — iar dacă logica ar sta
// tot aici, a cincea ajustare ar strica motorul fără să-și dea nimeni seama.
//
// Cum se citesc duratele: `duration` e cât ține acțiunea, `hold` e cât se stă
// nemișcat DUPĂ ea. Holdul e locul unde respiră filmul; acolo se lasă animația
// de recalculare să se termine și privirea să prindă cifra.
//
// Timpul petrecut în `goto` și `waitFor` NU intră în socoteală: e marcat „mort”
// în keyframes.json și tăiat la montaj. De aceea bugetul de 45s se citește pe
// suma de `duration + hold`, nu pe cât durează rularea.

export const TIMELINE: Beat[] = [
  // ── HOOK · 0–3s ────────────────────────────────────────────────────────────
  // „Pierzi. Dar știi exact de ce?” — textul vine la montaj (faza 5).
  //
  // Specul cere curba de equity în cădere, „o secțiune existentă filtrată pe
  // perioada de drawdown". Analytics NU are filtru de perioadă — nu există în
  // produs, iar inventarea unuia ar fi altă funcție, nu un video. Curba
  // demonstrativă are însă o cădere reală în mijloc (faza 2 din seed, cu 5%
  // rată de câștig), deci arătăm curba întreagă și lăsăm zoom-ul din faza 5 să
  // se așeze pe porțiunea care cade. Keyframe-ul de scroll de mai jos e reperul.
  {
    id: "hook-deschide",
    scena: "hook",
    action: "goto",
    url: "/analytics",
    waitFor: "[data-chart-ready]",
    duration: 0,
    hold: 0,
  },
  {
    id: "hook-curba",
    scena: "hook",
    action: "scroll",
    target: "equity-chart",
    duration: 750,
    hold: 0,
  },
  {
    id: "hook-privire",
    scena: "hook",
    action: "hold",
    duration: 2250,
    hold: 0,
    nota: "Cadru pe cădere. Zoom-ul pe segmentul de drawdown se pune în faza 5.",
  },

  // ── SYNC · 3–9s ────────────────────────────────────────────────────────────
  // NU se poate filma ca în spec. Vezi raportul: contul demo e `MANUAL`, fără
  // MetaAPI, iar butonul de sincronizare nu face nimic pe el. Rezerv durata,
  // cu pagina deja pe jurnal — acolo ar apărea tranzacția — ca montajul să
  // poată insera secvența fără să mute nimic în jur.
  {
    id: "sync-jurnal",
    scena: "sync",
    action: "goto",
    url: "/journal",
    waitFor: "journal-row",
    duration: 0,
    hold: 0,
  },
  {
    id: "sync-rezervat",
    scena: "sync",
    action: "rezervat",
    duration: 6000,
    hold: 0,
    nota: "TODO_SYNC — MetaAPI neconfigurat pe contul demo. Vezi raportul fazei 4.",
  },

  // ── JURNAL · 9–17s ─────────────────────────────────────────────────────────
  // Căutarea filtrează lista pe setup, apoi se deschide tranzacția. Setup-ul,
  // R:R-ul și rezultatul sunt pe rând, reale, din seed — nu se scrie nimic.
  {
    id: "jurnal-cauta",
    scena: "jurnal",
    action: "type",
    target: "journal-search",
    // „fair”, nu „fair value”: filtrul compara cu `fair_value_gap`, cu
    // underscore, deci un sir cu spatiu nu potriveste nimic si randul de
    // dupa n-ar mai exista. Prins la `--dry`, inainte sa se filmeze.
    text: "fair",
    duration: 520,
    hold: 850,
  },
  {
    id: "jurnal-deschide",
    scena: "jurnal",
    action: "click",
    target: "journal-row",
    duration: 620,
    hold: 2600,
    zoom: { scale: 1.55, easing: "cubic-bezier(0.4,0,0.2,1)" },
  },
  {
    id: "jurnal-citeste",
    scena: "jurnal",
    action: "hold",
    duration: 3030,
    hold: 0,
  },

  // ── MONEY SHOT · 17–28s ────────────────────────────────────────────────────
  // Ordinea e tot. Camera ajunge pe zona de statistici ÎNAINTE de primul
  // filtru; dacă zoom-ul pornește după, se ratează exact cadrul pentru care
  // există tot videoul.
  {
    id: "money-analytics",
    scena: "money",
    action: "goto",
    url: "/analytics",
    waitFor: "[data-chart-ready]",
    duration: 0,
    hold: 0,
  },
  {
    id: "money-camera",
    scena: "money",
    action: "scroll",
    target: "setup-session-matrix",
    duration: 800,
    hold: 700,
    nota: "Camera ajunge prima. Abia după se atinge vreun filtru.",
  },
  {
    id: "money-fvg",
    scena: "money",
    action: "click",
    target: "setup-filter-fair_value_gap",
    duration: 520,
    hold: 1250,
    zoom: { scale: 1.45, easing: "cubic-bezier(0.4,0,0.2,1)" },
  },
  {
    id: "money-london",
    scena: "money",
    action: "click",
    target: "cell-fair_value_gap-london",
    duration: 460,
    hold: 2650,
    zoom: { scale: 1.8, easing: "cubic-bezier(0.4,0,0.2,1)" },
  },
  {
    id: "money-asia",
    scena: "money",
    action: "click",
    target: "cell-fair_value_gap-asian",
    duration: 460,
    // Holdul cel mai lung din tot filmul. Aici stă contrastul: același setup,
    // altă sesiune, 61% față de 23%. Dacă privirea nu apucă să compare, restul
    // celor 45 de secunde n-au servit la nimic.
    hold: 4160,
    zoom: { scale: 1.8, easing: "cubic-bezier(0.4,0,0.2,1)" },
  },

  // ── CONTEXT · 28–36s ───────────────────────────────────────────────────────
  {
    id: "context-equity",
    scena: "context",
    action: "scroll",
    target: "equity-chart",
    duration: 700,
    hold: 1600,
  },
  {
    id: "context-asteptare",
    scena: "context",
    action: "scroll",
    target: "stat-card-expectancy",
    duration: 600,
    hold: 1500,
  },
  {
    id: "context-calculator",
    scena: "context",
    action: "goto",
    url: "/calculator",
    waitFor: "calc-sl-pips",
    duration: 0,
    hold: 0,
  },
  {
    id: "context-risc",
    scena: "context",
    action: "type",
    target: "calc-sl-pips",
    text: "35",
    duration: 480,
    hold: 300,
  },
  {
    id: "context-lot",
    scena: "context",
    action: "hold",
    duration: 2630,
    hold: 0,
    nota: "Lotul recomandat se recalculează la tastare.",
  },

  // ── SCALE · 36–41s ─────────────────────────────────────────────────────────
  {
    id: "scale-rezervat",
    scena: "scale",
    action: "rezervat",
    duration: 5000,
    hold: 0,
    nota: "TODO_MOBILE — aplicația mobilă e Expo, nu se filmează în pipeline-ul ăsta. Se completează în post.",
  },

  // ── CTA · 41–45s ───────────────────────────────────────────────────────────
  {
    id: "cta-rezervat",
    scena: "cta",
    action: "rezervat",
    duration: 4000,
    hold: 0,
    nota: "Beat static: domeniu + logo, se compune în faza 5. Logo-ul nu apare înainte de secunda 41.",
  },
];

/** Bugetul din specificație, ca `--dry` să poată spune cât se abate fiecare scenă. */
export const BUGET: Record<string, number> = {
  hook: 3000,
  sync: 6000,
  jurnal: 8000,
  money: 11000,
  context: 8000,
  scale: 5000,
  cta: 4000,
};
