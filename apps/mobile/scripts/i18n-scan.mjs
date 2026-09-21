#!/usr/bin/env node
// ── Poarta de traduceri ──────────────────────────────────────────────────────
//
// Găsește textele românești din interfață care n-au pereche în `src/lib/en.ts`.
//
// DE CE E NEVOIE DE EA. Un text netradus NU se vede niciodată la testare: în
// română arată perfect, fiindcă română e. Se vede abia la un utilizator englez,
// care nu ne scrie — dezinstalează. Fără poarta asta, fiecare ecran nou ar
// adăuga tăcut încă zece texte care rămân pentru totdeauna în română.
//
// Cheia e chiar textul românesc (vezi `lib/i18n.tsx`), deci verificarea e
// simplă: fiecare text găsit în cod trebuie să existe ca cheie în dicționar.

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

// `dir/**/*.tsx` NU prinde fișierele direct în `dir/` — vezi font-scan.mjs.
const fisiere = execSync(
  'git ls-files "app/*.tsx" "app/**/*.tsx" "src/*.tsx" "src/**/*.tsx" "src/*.ts" "src/**/*.ts"',
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean);

const dict = readFileSync("src/lib/en.ts", "utf8");

/** Fișiere care nu conțin text pentru utilizator. */
const SARITE = new Set(["src/lib/en.ts", "src/lib/i18n.tsx"]);

/**
 * Texte care rămân în română intenționat. Mesajele aruncate cu `throw` sunt
 * pentru cine scrie codul, nu pentru cine îl folosește: nu ajung niciodată pe
 * ecran, iar traducerea lor ar face urmărirea unei erori mai grea, nu mai
 * ușoară.
 */
const PERMISE = new Set(["useAuth în afara lui <ProvizorAuth>"]);

// Ce NU e text pentru om: fonturi, fusuri, iconițe, rute, culori, chei tehnice.
const tehnic = /^(Inter_|SpaceGrotesk_|[A-Za-z]+\/[A-Za-z_]+$|#|rgba?\(|https?:|\/api\/|[a-z-]+-(outline|sharp)$|[a-z]+(-[a-z]+)*$)/;
const diacritice = /[ăâîșțĂÂÎȘȚ]/;

const lipsa = [];

for (const cale of fisiere) {
  if (SARITE.has(cale)) continue;

  const brut = readFileSync(cale, "utf8");
  // Fără comentarii: proza explicativă din cod nu se traduce.
  const cod = brut.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");

  for (const m of cod.match(/"[^"\n]{3,}"/g) || []) {
    const text = m.slice(1, -1).trim();
    if (tehnic.test(text)) continue;
    if (PERMISE.has(text)) continue;
    if (!(diacritice.test(text) || /^[A-ZĂÂÎȘȚ][^"]* [a-zăâîșț]/.test(text))) continue;
    if (dict.includes(JSON.stringify(text))) continue;

    const linie = cod.slice(0, cod.indexOf(m)).split("\n").length;
    lipsa.push({ cale, linie, text });
  }
}

if (lipsa.length > 0) {
  console.error("\n✗ Texte fără traducere în `src/lib/en.ts`:\n");
  for (const p of lipsa) {
    const scurt = p.text.length > 70 ? p.text.slice(0, 67) + "…" : p.text;
    console.error(`  ${p.cale}:${p.linie}\n      ${scurt}`);
  }
  console.error(
    `\n${lipsa.length} ${lipsa.length === 1 ? "text" : "texte"}. ` +
      "Adaugă-le în `src/lib/en.ts`, cu textul românesc drept cheie.\n" +
      "Dacă un text chiar trebuie să rămână în română — un `throw` pentru " +
      "programator — pune-l în `PERMISE`, în scriptul ăsta.\n",
  );
  process.exit(1);
}

const cate = (dict.match(/^  "/gm) || []).length;
console.log(`✓ i18n: toate textele au traducere (${cate} în dicționar).`);
