#!/usr/bin/env node
// ── Poarta de fonturi ────────────────────────────────────────────────────────
//
// Pe Android, un stil de text FĂRĂ `fontFamily` moștenește fontul de SISTEM al
// telefonului. Pe telefoanele unde omul și-a schimbat fontul global (Samsung,
// Xiaomi, OnePlus lasă), ecranul apare scris cu altceva decât tot restul
// aplicației — iar noi, care testăm pe telefoane cu fontul din fabrică, nu
// vedem niciodată nimic.
//
// S-a întâmplat exact asta: ecranul de login avea cinci stiluri fără familie,
// printre care titlul și subtitlul. Pe telefonul cu font caligrafic, prima
// impresie despre produs era un ecran scris de mână.
//
// Scriptul caută fiecare obiect de stil care are `fontSize` sau `fontWeight`
// dar n-are `fontFamily`, și pică. Emoji-urile sunt scutite: ele TREBUIE să
// rămână pe fontul de sistem, fiindcă fonturile noastre n-au glife pentru ele.

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

const probleme = [];

for (const cale of fisiere) {
  const sursa = readFileSync(cale, "utf8");
  const linii = sursa.split("\n");

  // Obiecte de stil de forma `nume: { ... }`, fără acolade imbricate.
  const re = /(\w+):\s*\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(sursa))) {
    const [intreg, nume, corp] = m;
    if (SCUTITE.has(nume)) continue;
    if (!/fontSize|fontWeight/.test(corp)) continue;
    if (/fontFamily/.test(corp)) continue;

    const linie = sursa.slice(0, m.index).split("\n").length;
    probleme.push({ cale, nume, linie, text: linii[linie - 1]?.trim() ?? "" });
    void intreg;
  }
}

if (probleme.length > 0) {
  console.error("\n✗ Stiluri de text fără `fontFamily` — vor folosi fontul telefonului:\n");
  for (const p of probleme) {
    console.error(`  ${p.cale}:${p.linie}  →  ${p.nume}`);
  }
  console.error(
    `\n${probleme.length} ${probleme.length === 1 ? "stil" : "stiluri"}. ` +
      "Pune `fontFamily` (vezi `FONT` din src/lib/fonturi.ts).\n" +
      "Dacă un stil chiar trebuie să rămână pe fontul de sistem — cum sunt " +
      "emoji-urile — adaugă-i numele în `SCUTITE`, în scriptul ăsta.\n",
  );
  process.exit(1);
}

console.log(`✓ fonturi: toate stilurile de text au familie (${fisiere.length} fișiere).`);
