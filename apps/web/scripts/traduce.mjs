#!/usr/bin/env node
// ── Traducere automată a dicționarelor ───────────────────────────────────────
//
// DE CE EXISTĂ. RO și EN sunt scrise de om, 2.900 de chei fiecare. Pentru DE,
// FR, ES și IT asta ar însemna 11.600 de propoziții traduse manual — adică
// niciodată. Scriptul ăsta le face din EN, o dată, și apoi doar diferențele.
//
//   node scripts/traduce.mjs --limbi=de,fr,es,it
//   node scripts/traduce.mjs --limbi=de --tot        (retraduce tot, nu doar ce lipsește)
//   node scripts/traduce.mjs --limbi=de --uscat      (arată ce ar face)
//
// CHEIE. Una dintre:
//   ANTHROPIC_API_KEY  — preferată: înțelege contextul financiar și păstrează
//                        termenii care NU se traduc
//   DEEPL_API_KEY      — alternativă; nivelul gratuit acoperă 500.000 de
//                        caractere pe lună, adică fix cele patru limbi
//
// CE PĂZEȘTE SCRIPTUL, fiindcă traducerea automată le strică pe toate:
//
//   1. SUBSTITUENȚII. `{n} tranzacții` tradus greșit devine `{anzahl}` și
//      next-intl aruncă la randare. Sunt scoși înainte de traducere, puși
//      înapoi după, și VERIFICAȚI: dacă lipsește unul, cheia se aruncă.
//   2. TERMENII DE BRAND ȘI DE METODĂ. „Order Block", „Fair Value Gap", „pip",
//      „drawdown", „TradeGx" rămân cum sunt — un trader german spune „Drawdown",
//      nu „Rückgang".
//   3. STRUCTURA. Ieșirea are EXACT aceleași chei ca engleza, în aceeași ordine.
//
// ONESTITATE. Rezultatul e traducere automată, nu traducere. Fișierul primește
// `"_masina": true` la rădăcină, iar limba NU se aprinde singură în interfață:
// se adaugă în `LIMBI_ACTIVE` din `src/i18n/locales.ts` după ce o citește un om.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const AICI = dirname(fileURLToPath(import.meta.url));
const MESAJE = resolve(AICI, "../messages");

const arg = (n, d = null) => {
  const g = process.argv.find((a) => a.startsWith(`--${n}=`));
  return g ? g.slice(n.length + 3) : d;
};
const are = (n) => process.argv.includes(`--${n}`);

const LIMBI = (arg("limbi", "de,fr,es,it") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const TOT = are("tot");
const USCAT = are("uscat");
const LOT = Number(arg("lot", "40"));

const NUME_LIMBI = {
  de: "German", fr: "French", es: "Spanish", it: "Italian",
  pt: "Portuguese", nl: "Dutch", pl: "Polish",
};

// Termeni care rămân neatinși. Traderii îi folosesc în engleză în orice limbă.
const NETRADUS = [
  "TradeGx", "SMC", "ICT", "FVG", "Order Block", "Fair Value Gap", "Break of Structure",
  "BOS", "CHoCH", "Change of Character", "Liquidity Sweep", "Breaker", "Mitigation",
  "killzone", "pip", "pips", "lot", "drawdown", "equity", "win rate", "risk/reward",
  "R:R", "expectancy", "backtest", "backtesting", "setup", "stop loss", "take profit",
  "MetaTrader", "MT4", "MT5", "MetaAPI", "prop firm", "P&L", "Telegram", "Stripe",
];

// ── Utilitare pe arborele de chei ────────────────────────────────────────────

function aplatizeaza(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const cale = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) aplatizeaza(v, cale, out);
    else out[cale] = v;
  }
  return out;
}

function adanceste(plat) {
  const out = {};
  for (const [cale, v] of Object.entries(plat)) {
    const parti = cale.split(".");
    let nod = out;
    for (let i = 0; i < parti.length - 1; i++) {
      nod[parti[i]] ??= {};
      nod = nod[parti[i]];
    }
    nod[parti[parti.length - 1]] = v;
  }
  return out;
}

/** Scoate `{ceva}` și `<tag>` și le înlocuiește cu jetoane pe care nicio limbă nu le traduce. */
function protejeaza(text) {
  const bucati = [];
  const protejat = String(text).replace(/\{[^}]+\}|<\/?[a-zA-Z][^>]*>/g, (m) => {
    bucati.push(m);
    return `⁣${bucati.length - 1}⁣`;
  });
  return { protejat, bucati };
}

function repune(text, bucati) {
  return text.replace(/⁣(\d+)⁣/g, (_, i) => bucati[Number(i)] ?? "");
}

// ── Traducătoarele ───────────────────────────────────────────────────────────

async function prinAnthropic(texte, limba) {
  const cheie = process.env.ANTHROPIC_API_KEY;
  const corp = {
    model: "claude-opus-4-8",
    max_tokens: 8000,
    system:
      `You are translating the UI of a professional trading journal from English into ${NUME_LIMBI[limba]}.\n` +
      `Rules:\n` +
      `- Return ONLY a JSON array of translated strings, same length and order as the input.\n` +
      `- Keep every ⁣N⁣ token EXACTLY as it appears. They are placeholders.\n` +
      `- Do NOT translate these terms, keep them verbatim: ${NETRADUS.join(", ")}.\n` +
      `- Traders in every language use English trading jargon. Prefer the term a native trader would actually say.\n` +
      `- Keep the register: short, precise, no marketing fluff. Match the source length where possible — this is UI text with limited space.`,
    messages: [{ role: "user", content: JSON.stringify(texte) }],
  };

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": cheie,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(corp),
  });
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  const text = j.content?.map((c) => c.text ?? "").join("") ?? "";
  const start = text.indexOf("[");
  const stop = text.lastIndexOf("]");
  if (start === -1 || stop === -1) throw new Error("Anthropic n-a întors un vector JSON");
  return JSON.parse(text.slice(start, stop + 1));
}

async function prinDeepL(texte, limba) {
  const cheie = process.env.DEEPL_API_KEY;
  const gazda = cheie.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
  const r = await fetch(`https://${gazda}/v2/translate`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `DeepL-Auth-Key ${cheie}` },
    body: JSON.stringify({
      text: texte,
      source_lang: "EN",
      target_lang: limba.toUpperCase(),
      preserve_formatting: true,
    }),
  });
  if (!r.ok) throw new Error(`DeepL ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  return j.translations.map((t) => t.text);
}

function alegeTraducatorul() {
  if (process.env.ANTHROPIC_API_KEY) return { nume: "Anthropic", fn: prinAnthropic };
  if (process.env.DEEPL_API_KEY) return { nume: "DeepL", fn: prinDeepL };
  return null;
}

// ── Programul ────────────────────────────────────────────────────────────────

async function main() {
  const en = JSON.parse(readFileSync(resolve(MESAJE, "en.json"), "utf8"));
  const sursa = aplatizeaza(en);
  const chei = Object.keys(sursa);

  console.log(`  sursă: en.json — ${chei.length} chei`);

  const traducator = alegeTraducatorul();
  if (!traducator && !USCAT) {
    console.error(
      "\n  Lipsește cheia. Pune una dintre:\n" +
      "    ANTHROPIC_API_KEY=...   (recomandat — înțelege jargonul)\n" +
      "    DEEPL_API_KEY=...       (nivel gratuit: 500.000 caractere/lună)\n",
    );
    process.exit(1);
  }
  if (traducator) console.log(`  traducător: ${traducator.nume}`);

  for (const limba of LIMBI) {
    if (!NUME_LIMBI[limba]) {
      console.error(`  ${limba}: limbă necunoscută, o sar`);
      continue;
    }

    const cale = resolve(MESAJE, `${limba}.json`);
    const existent = existsSync(cale) ? aplatizeaza(JSON.parse(readFileSync(cale, "utf8"))) : {};

    const deFacut = TOT ? chei : chei.filter((k) => existent[k] == null);
    const caractere = deFacut.reduce((s, k) => s + String(sursa[k]).length, 0);

    console.log(`\n  ${limba}: ${deFacut.length} chei de tradus (${caractere.toLocaleString("ro-RO")} caractere)`);
    if (USCAT || deFacut.length === 0) continue;

    const rezultat = { ...existent };
    let aruncate = 0;

    for (let i = 0; i < deFacut.length; i += LOT) {
      const lot = deFacut.slice(i, i + LOT);
      const pregatite = lot.map((k) => protejeaza(sursa[k]));

      let traduse;
      try {
        traduse = await traducator.fn(pregatite.map((p) => p.protejat), limba);
      } catch (e) {
        console.error(`    lot ${i / LOT + 1}: ${e.message}`);
        continue;
      }

      if (!Array.isArray(traduse) || traduse.length !== lot.length) {
        console.error(`    lot ${i / LOT + 1}: am primit ${traduse?.length} pentru ${lot.length} chei — îl sar`);
        continue;
      }

      lot.forEach((k, j) => {
        const { bucati } = pregatite[j];
        const text = repune(String(traduse[j]), bucati);

        // Verificarea care contează: dacă un substituent s-a pierdut pe drum,
        // cheia NU se scrie. next-intl ar arunca la randare, iar defectul ar
        // apărea abia pe pagina pe care nimeni n-o deschide des.
        const lipsa = bucati.filter((b) => !text.includes(b));
        if (lipsa.length > 0) {
          aruncate++;
          return;
        }
        rezultat[k] = text;
      });

      process.stdout.write(`    ${Math.min(i + LOT, deFacut.length)}/${deFacut.length}\r`);
    }

    // Ordinea cheilor o dă engleza, nu ordinea în care au venit traducerile.
    const ordonat = {};
    for (const k of chei) if (rezultat[k] != null) ordonat[k] = rezultat[k];

    const iesire = adanceste(ordonat);
    iesire._masina = true;   // traducere automată, necitită de om
    writeFileSync(cale, JSON.stringify(iesire, null, 2) + "\n", "utf8");

    const acoperire = ((Object.keys(ordonat).length / chei.length) * 100).toFixed(1);
    console.log(`\n    ✓ ${limba}.json — ${Object.keys(ordonat).length}/${chei.length} chei (${acoperire}%)` +
      (aruncate ? `, ${aruncate} aruncate pentru substituenți pierduți` : ""));
  }

  console.log(
    "\n  Fișierele sunt scrise, dar limbile NU sunt aprinse în interfață.\n" +
    "  Adaugă-le în `LIMBI_ACTIVE` din src/i18n/locales.ts după ce le citește un om.\n",
  );
}

main().catch((e) => {
  console.error("\n  EROARE:", e.message);
  process.exit(1);
});
