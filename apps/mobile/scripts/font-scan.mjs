#!/usr/bin/env node
// ── Poarta de fonturi ────────────────────────────────────────────────────────
//
// Două capcane, amândouă invizibile pe un telefon cu fontul din fabrică.
//
// 1. STIL DE TEXT FĂRĂ `fontFamily`. Moștenește fontul de SISTEM. Pe
//    telefoanele unde omul și-a schimbat fontul global (Samsung, Xiaomi,
//    OnePlus lasă), ecranul apare scris cu altceva decât tot restul aplicației.
//
// 2. `fontFamily` ÎMPREUNĂ cu `fontWeight`. Asta e cea urâtă. Android caută
//    atunci o familie „Inter_700Bold" AVÂND greutatea 700 — dar fontul încărcat
//    e o familie de sine stătătoare, cu greutate normală. Nu găsește nimic și
//    cade tot pe fontul de sistem. Greutatea e deja în fișier: `Inter_700Bold`
//    E varianta îngroșată, n-are nevoie să i-o mai ceri o dată.
//
// A doua s-a văzut pentru prima oară pe telefonul lui Cristi, care are un font
// de sistem caligrafic: toate titlurile și butoanele ieșeau caligrafice, iar
// textele normale nu. Pe un telefon obișnuit, diferența ar fi fost atât de mică
// încât n-ar fi observat-o nimeni — și ar fi rămas așa pentru totdeauna.
//
// Emoji-urile sunt scutite de prima regulă: ele TREBUIE să rămână pe fontul de
// sistem, fiindcă fonturile noastre n-au glife pentru ele.

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

// ATENȚIE la tipar: `dir/**/*.tsx` NU prinde fișierele direct în `dir/` —
// `**/` cere cel puțin un nivel de folder. De aceea sunt scrise amândouă.
const fisiere = execSync(
  'git ls-files "app/*.tsx" "app/**/*.tsx" "src/*.tsx" "src/**/*.tsx"',
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean);

/** Stiluri care au voie să rămână pe fontul de sistem, și de ce. */
const SCUTITE = new Set([
  "textEmoji", // emoji — fonturile noastre n-au glife, sistemul le are
  "emoji",
]);

const faraFamilie = [];
const cuGreutate = [];

for (const cale of fisiere) {
  const sursa = readFileSync(cale, "utf8");

  // Obiecte de stil de forma `nume: { ... }`, fără acolade imbricate.
  const re = /(\w+):\s*\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(sursa))) {
    const nume = m[1];
    const corp = m[2];
    const linie = sursa.slice(0, m.index).split("\n").length;

    if (/fontFamily/.test(corp)) {
      if (/fontWeight/.test(corp)) cuGreutate.push({ cale, nume, linie });
      continue;
    }
    if (SCUTITE.has(nume)) continue;
    if (!/fontSize|fontWeight/.test(corp)) continue;

    faraFamilie.push({ cale, nume, linie });
  }
}

function raporteaza(lista, titlu, sfat) {
  if (lista.length === 0) return false;
  console.error(`\n✗ ${titlu}\n`);
  for (const p of lista) console.error(`  ${p.cale}:${p.linie}  →  ${p.nume}`);
  console.error(`\n${lista.length} ${lista.length === 1 ? "stil" : "stiluri"}. ${sfat}\n`);
  return true;
}

const a = raporteaza(
  cuGreutate,
  "Stiluri cu `fontFamily` ȘI `fontWeight` — Android nu găsește familia și cade pe fontul telefonului:",
  "Șterge `fontWeight`: greutatea e deja în fișierul fontului.",
);

const b = raporteaza(
  faraFamilie,
  "Stiluri de text fără `fontFamily` — vor folosi fontul telefonului:",
  "Pune `fontFamily` (vezi `FONT` din src/lib/fonturi.ts). Dacă un stil chiar " +
    "trebuie să rămână pe fontul de sistem — cum sunt emoji-urile — adaugă-i " +
    "numele în `SCUTITE`, în scriptul ăsta.",
);

if (a || b) process.exit(1);

console.log(
  `✓ fonturi: toate stilurile de text au familie, niciunul cu fontWeight peste ea ` +
    `(${fisiere.length} fișiere).`,
);
