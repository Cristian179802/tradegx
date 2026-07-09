#!/usr/bin/env node
// ── i18n guard ───────────────────────────────────────────────────────────────
// Scanează src/ după text HARDCODAT în română (UI vizibil), ca să nu mai rămână
// „rămășițe" de cuvinte netraduse. Semnale: diacritice + listă de cuvinte RO
// frecvente fără diacritice. Verifică text JSX între taguri + placeholder/title/aria.
// Rulează: node scripts/i18n-scan.mjs   (exit 1 dacă găsește ceva → poate bloca build-ul)

import fs from "fs";
import path from "path";

const ROOT = path.resolve(process.cwd(), "src");
// Zone excluse: Academia (conținut de curs RO intenționat) și tot ce e server-side
// (api/, lib/) — acolo textele RO sunt output pt Telegram/email către publicul RO,
// nu UI. Scanăm DOAR .tsx (JSX = interfața vizibilă).
const EXCLUDE_DIRS = ["academy", "lib/academy", "app/api", "lib"];
const EXCLUDE_FILES = [];
// Șiruri permise (intenționat bilingve / tehnice).
const ALLOW = ["Limbă / Language"];

const DIACRITICS = /[ăâîșțĂÂÎȘȚ]/;
// Cuvinte RO frecvente în UI care NU au diacritice (diacriticele le prind pe restul).
// \b … \b ca să nu prindem substringuri (ex. „sau" în „ausland").
const RO_WORDS = new RegExp(
  "\\b(" + [
    "Adauga", "adauga", "Sterge", "sterge", "Salveaza", "salveaza", "Anuleaza", "anuleaza",
    "Inapoi", "inapoi", "Trimite", "trimite", "Cauta", "cauta", "Incarca", "incarca",
    "Niciun", "niciun", "Nicio", "nicio", "Toate", "toate", "Toti", "Vezi", "vezi",
    "Deschide", "Inchide", "inchide", "Trade nou", "Cont nou", "Cont trading",
    "Editeaza", "editeaza", "si apasa", "sau manual", "Publica", "publica",
    "Alatura", "alatura", "membri", "postari", "raspuns", "raspunsuri",
    "Setari", "setari", "Obiective", "Tranzactii", "tranzactii", "tranzactie",
    "Alerte", "alerte", "Recente", "recente", "Activ", "activ", "Protectie",
    "Notificare", "notificare", "notificari", "Rezultate", "rezultate",
    "Conturi", "conturi", "Cont", "Selecteaza", "selecteaza", "Genereaza",
    "Incearca", "incearca", "Copiaza", "copiaza", "Copiat", "Nelimitat",
    "Sesiune", "sesiune", "sesiuni", "Sfatul", "Rezumat", "rezumat",
    "Raportul", "raportul", "Raport", "saptaman", "Zilnic", "zilnic",
    "pierdere", "castig", "Pagina", "pagina", "Randuri", "randuri",
  ].join("|") + ")\\b"
);

// text JSX între > < (fără a intra în alte taguri/expresii)
const JSX_TEXT = />([^<>{}]*?)</g;
// string-uri din prop-uri relevante
const PROP_STR = /(?:placeholder|title|aria-label|alt)\s*=\s*"([^"]*)"/g;

const isRomanian = (s) => {
  const t = s.trim();
  if (t.length < 3) return false;
  if (ALLOW.includes(t)) return false;
  return DIACRITICS.test(t) || RO_WORDS.test(t);
};

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.some((d) => rel === d || rel.startsWith(d + "/"))) continue;
      walk(full, acc);
    } else if (/\.tsx$/.test(entry.name) && !EXCLUDE_FILES.includes(rel)) {
      acc.push(full);
    }
  }
  return acc;
}

// text JSX multi-linie (text pe linia lui, între taguri pe linii diferite) — doar
// diacritice, ca să evităm fals-pozitive din cod (ex. `a > x < b`).
const JSX_TEXT_ML = />([^<>{}]*[ăâîșțĂÂÎȘȚ][^<>{}]*)</g;
const lineOf = (src, idx) => src.slice(0, idx).split("\n").length;

const findings = [];
for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, "utf8");
  const seen = new Set();
  const add = (line, text) => { const k = `${line}|${text}`; if (!seen.has(k)) { seen.add(k); findings.push({ file, line, text }); } };
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    // sări peste comentarii evidente
    const code = line.replace(/\/\/.*$/, "");
    let m;
    JSX_TEXT.lastIndex = 0;
    while ((m = JSX_TEXT.exec(code))) {
      if (isRomanian(m[1])) add(i + 1, m[1].trim());
    }
    PROP_STR.lastIndex = 0;
    while ((m = PROP_STR.exec(code))) {
      if (isRomanian(m[1])) add(i + 1, m[1].trim());
    }
  });
  // pasul multi-linie (pe tot fișierul). Acceptăm doar PROZĂ (fără tokenuri de cod),
  // ca să nu prindem comentarii/cod între operatori `>` `<`.
  const CODEY = /[=;()/\\`|]|\/\/|=>|\bconst\b|\breturn\b|\bnew\b|\bMap\b|\bfunction\b/;
  let mm;
  JSX_TEXT_ML.lastIndex = 0;
  while ((mm = JSX_TEXT_ML.exec(src))) {
    const txt = mm[1].trim().replace(/\s+/g, " ");
    if (txt.length >= 3 && txt.length <= 160 && !ALLOW.includes(txt) && !CODEY.test(txt)) add(lineOf(src, mm.index), txt);
  }
}

if (findings.length === 0) {
  console.log("✓ i18n: niciun text românesc hardcodat în UI (exceptând Academia).");
  process.exit(0);
}

console.error(`✗ i18n: ${findings.length} text(e) românești hardcodate rămase:\n`);
for (const f of findings) {
  const rel = path.relative(process.cwd(), f.file).replace(/\\/g, "/");
  console.error(`  ${rel}:${f.line}  →  "${f.text}"`);
}
process.exit(1);
