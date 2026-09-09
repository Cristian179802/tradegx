import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { ACADEMY, DIAGRAMS, TOTAL_LESSONS } from "@/lib/academy";
import { QUIZZES } from "@/lib/academy/quiz";
import { GLOSSARY, glossaryRefs, searchGlossary } from "@/lib/academy/glossary";
import { PATTERN_DRILLS, SL_DRILLS } from "@/lib/academy/drills";
import { EMPTY_PROGRESS, mergeProgress, normalize, sameProgress } from "@/lib/academy/progress-merge";

// ── Academia ─────────────────────────────────────────────────────────────────
//
// Conținutul e cod: 150k de caractere în două limbi, cu referințe între ele
// (diagrame, termeni de glosar, quiz-uri per modul). O referință ruptă nu dă
// eroare de compilare — dă o secțiune goală sau un termen fără definiție, pe
// care le vede primul elev, nu noi. Testele de aici sunt poarta.

const LANGS = ["ro", "en"] as const;

function allSectionTexts(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  for (const { module: m } of ACADEMY) {
    for (const l of m.lessons) {
      l.sections.forEach((s, i) => {
        const where = `${m.id}/${l.id}#${i}`;
        for (const lang of LANGS) {
          out.push({ where: `${where} ${lang}`, text: s.body[lang] });
          if (s.tip) out.push({ where: `${where} tip ${lang}`, text: s.tip[lang] });
          if (s.warning) out.push({ where: `${where} warning ${lang}`, text: s.warning[lang] });
          if (s.example) out.push({ where: `${where} example ${lang}`, text: s.example[lang] });
          for (const t of s.takeaways ?? []) out.push({ where: `${where} takeaway ${lang}`, text: t[lang] });
        }
      });
    }
  }
  return out;
}

describe("structura cursului e întreagă", () => {
  it("id-urile de module sunt unice", () => {
    const ids = ACADEMY.map((b) => b.module.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("id-urile de lecții sunt unice în modulul lor", () => {
    for (const { module: m } of ACADEMY) {
      const ids = m.lessons.map((l) => l.id);
      expect(new Set(ids).size, `${m.id} are lecții duplicate`).toBe(ids.length);
    }
  });

  it("fiecare lecție are titlu, durată și cel puțin o secțiune, în ambele limbi", () => {
    for (const { module: m } of ACADEMY) {
      for (const l of m.lessons) {
        expect(l.minutes, `${m.id}/${l.id}`).toBeGreaterThan(0);
        expect(l.sections.length, `${m.id}/${l.id}`).toBeGreaterThan(0);
        for (const lang of LANGS) {
          expect(l.title[lang].trim().length, `${m.id}/${l.id} titlu ${lang}`).toBeGreaterThan(3);
        }
      }
    }
  });

  it("niciun text nu e gol într-o limbă și plin în cealaltă", () => {
    // Cea mai ușoară greșeală la conținut bilingv: scrii româna, uiți engleza.
    for (const { where, text } of allSectionTexts()) {
      expect(text.trim().length, `gol: ${where}`).toBeGreaterThan(10);
    }
  });

  it("TOTAL_LESSONS numără chiar lecțiile", () => {
    const n = ACADEMY.reduce((a, b) => a + b.module.lessons.length, 0);
    expect(TOTAL_LESSONS).toBe(n);
  });
});

describe("referințele nu sunt rupte", () => {
  it("fiecare diagramă referită există în registru", () => {
    for (const { module: m } of ACADEMY) {
      for (const l of m.lessons) {
        for (const s of l.sections) {
          if (s.diagram) expect(DIAGRAMS[s.diagram], `${m.id}/${l.id} → ${s.diagram}`).toBeDefined();
        }
      }
    }
  });

  it("fiecare diagramă are lumânări valide (h ≥ l, în 0..100)", () => {
    for (const [key, d] of Object.entries(DIAGRAMS)) {
      expect(d.candles.length, key).toBeGreaterThan(0);
      for (const c of d.candles) {
        expect(c.h, `${key}: h < l`).toBeGreaterThanOrEqual(c.l);
        for (const v of [c.o, c.h, c.l, c.c]) {
          expect(v, `${key}: în afara 0..100`).toBeGreaterThanOrEqual(0);
          expect(v, `${key}: în afara 0..100`).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it("fiecare [[termen]] din text există în glosar", () => {
    for (const { where, text } of allSectionTexts()) {
      for (const slug of glossaryRefs(text)) {
        expect(GLOSSARY[slug], `${where} → [[${slug}]]`).toBeDefined();
      }
    }
  });

  it("fiecare modul are quiz, cu 4 variante și un răspuns corect valid", () => {
    for (const { module: m } of ACADEMY) {
      const q = QUIZZES[m.id];
      expect(q, `${m.id} n-are quiz`).toBeDefined();
      expect(q!.length, `${m.id}`).toBeGreaterThanOrEqual(5);
      q!.forEach((it, i) => {
        expect(it.options.length, `${m.id} #${i}`).toBe(4);
        expect(it.correct, `${m.id} #${i}`).toBeGreaterThanOrEqual(0);
        expect(it.correct, `${m.id} #${i}`).toBeLessThan(4);
        for (const lang of LANGS) {
          expect(it.q[lang].trim().length, `${m.id} #${i} ${lang}`).toBeGreaterThan(5);
          expect(it.explain[lang].trim().length, `${m.id} #${i} explicație ${lang}`).toBeGreaterThan(5);
        }
      });
    }
  });

  it("modulul referit de un termen de glosar există", () => {
    const ids = new Set(ACADEMY.map((b) => b.module.id));
    for (const [slug, e] of Object.entries(GLOSSARY)) {
      if (e.module) expect(ids.has(e.module), `glosar ${slug} → modul ${e.module}`).toBe(true);
    }
  });
});

describe("glosarul", () => {
  it("fiecare termen are definiție în ambele limbi, scurtă și fără gol", () => {
    for (const [slug, e] of Object.entries(GLOSSARY)) {
      for (const lang of LANGS) {
        expect(e.term[lang].trim().length, `${slug} termen ${lang}`).toBeGreaterThan(1);
        const d = e.def[lang].trim();
        expect(d.length, `${slug} def ${lang}`).toBeGreaterThan(30);
        // O definiție de glosar care are nevoie de 500 de caractere e o lecție.
        expect(d.length, `${slug} def ${lang} prea lungă`).toBeLessThan(520);
      }
    }
  });

  it("caută fără diacritice și prin sinonime", () => {
    expect(searchGlossary("rezistenta", "ro").map(([s]) => s)).toContain("rezistenta");
    expect(searchGlossary("rezistență", "ro").map(([s]) => s)).toContain("rezistenta");
    expect(searchGlossary("stop hunt", "en").map(([s]) => s)).toContain("liquidity-sweep");
    expect(searchGlossary("xyzxyz", "ro")).toHaveLength(0);
  });

  it("căutarea goală întoarce tot, sortat", () => {
    const all = searchGlossary("", "en");
    expect(all.length).toBe(Object.keys(GLOSSARY).length);
    const names = all.map(([, e]) => e.term.en);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe("îmbinarea progresului", () => {
  const A = normalize({
    lessons: ["m1/l1", "m1/l2"],
    quizzes: { m1: 60 },
    drills: { pat: { attempts: 10, correct: 7, bestStreak: 4 } },
    missed: { "m1#2": 1 },
  });
  const B = normalize({
    lessons: ["m1/l2", "m2/l1"],
    quizzes: { m1: 85, m2: 40 },
    drills: { pat: { attempts: 5, correct: 5, bestStreak: 5 } },
    missed: { "m1#2": 2, "m2#0": 1 },
  });

  it("păstrează tot ce e mai bun pentru elev", () => {
    const m = mergeProgress(A, B);
    expect(m.lessons).toEqual(["m1/l1", "m1/l2", "m2/l1"]);
    expect(m.quizzes).toEqual({ m1: 85, m2: 40 });
    // La exerciții câștigă înregistrarea cu mai multă muncă (A: 10 încercări),
    // dar seria maximă e record personal, deci vine din B (5).
    expect(m.drills.pat).toEqual({ attempts: 10, correct: 7, bestStreak: 5 });
    expect(m.missed).toEqual({ "m1#2": 2, "m2#0": 1 });
  });

  it("NU adună încercările la exerciții", () => {
    // Adunarea ar părea evidentă, dar rupe idempotența: clientul trimite starea
    // ÎNTREAGĂ, iar o retrimitere (timeout, două taburi) ar dubla cifrele.
    const singur = normalize({ drills: { d: { attempts: 4, correct: 3, bestStreak: 2 } } });
    for (let i = 0; i < 5; i++) {
      expect(mergeProgress(singur, singur).drills.d).toEqual({ attempts: 4, correct: 3, bestStreak: 2 });
    }
  });

  it("la exerciții nu inventează o acuratețe pe care n-a avut-o nimeni", () => {
    // Dacă am lua maximul pe fiecare câmp separat, 10/2 îmbinat cu 5/5 ar da
    // 10/5 — 50% acuratețe, pe care n-a atins-o niciunul dintre dispozitive.
    const slab = normalize({ drills: { d: { attempts: 10, correct: 2, bestStreak: 1 } } });
    const scurt = normalize({ drills: { d: { attempts: 5, correct: 5, bestStreak: 5 } } });
    const m = mergeProgress(slab, scurt);
    expect(m.drills.d).toEqual({ attempts: 10, correct: 2, bestStreak: 5 });
    expect(m.drills.d!.correct).toBeLessThanOrEqual(m.drills.d!.attempts);
  });

  it("e comutativă — ordinea dispozitivelor nu contează", () => {
    expect(sameProgress(mergeProgress(A, B), mergeProgress(B, A))).toBe(true);
  });

  it("e idempotentă — a doua sincronizare nu schimbă nimic", () => {
    // Cea mai importantă proprietate a protocolului: clientul retrimite mereu
    // starea întreagă, deci a doua, a treia, a zecea trimitere trebuie să fie
    // fără efect. Altfel cifrele cresc singure, fără ca elevul să facă nimic.
    const once = mergeProgress(A, B);
    let acc = once;
    for (let i = 0; i < 5; i++) acc = mergeProgress(acc, B);
    expect(sameProgress(acc, once)).toBe(true);
  });

  it("normalizarea nu aruncă niciodată și nu lasă să treacă gunoi", () => {
    expect(normalize(null)).toEqual(EMPTY_PROGRESS);
    expect(normalize("x")).toEqual(EMPTY_PROGRESS);
    const n = normalize({
      lessons: ["ok/1", 42, "fara-slash", "ok/1"],
      quizzes: { a: 150, b: -3, c: "x", d: 77.6 },
      drills: { z: { attempts: 3, correct: 9, bestStreak: 99 } },
      missed: { k: 0, j: 2.9 },
    });
    expect(n.lessons).toEqual(["ok/1"]);
    expect(n.quizzes).toEqual({ a: 100, b: 0, d: 78 });
    // corect și serie nu pot depăși încercările
    expect(n.drills.z).toEqual({ attempts: 3, correct: 3, bestStreak: 3 });
    expect(n.missed).toEqual({ j: 2 });
  });
});

describe("ghilimelele românești nu rup șirurile", () => {
  // Am scris „...” cu ghilimea dreaptă la închidere de două ori într-o singură
  // sesiune, și de fiecare dată a rupt compilarea în mijlocul unei propoziții —
  // cu 20 de erori de sintaxă care nu arătau nicidecum spre cauza reală.
  //
  // tsc prinde cazul care rupe sintaxa. NU-l prinde pe cel mai insidios: un „
  // închis cu ” corect, dar deschis cu " drept — text valid, tipografie greșită,
  // invizibil până citește un client. Poarta de aici acoperă ambele.
  const SURSE = fs
    .readdirSync("src/lib/academy", { recursive: true, encoding: "utf8" })
    .filter((f) => typeof f === "string" && /\.ts$/.test(f))
    .map((f) => `src/lib/academy/${f}`);

  it("găsește fișierele de conținut", () => {
    // O poartă care scanează zero fișiere trece mereu — cel mai rău fel de test.
    expect(SURSE.length).toBeGreaterThan(10);
  });

  it.each(["src/lib/academy/glossary.ts", "src/lib/academy/drills.ts"])(
    "%s nu are „ închis cu ghilimea dreaptă",
    (f) => {
      const s = fs.readFileSync(f, "utf8");
      const rele = [...s.matchAll(/„[^"„”]*"/g)].map((m) => m[0].slice(0, 50));
      expect(rele, `închideri greșite în ${f}`).toEqual([]);
    }
  );

  it("niciun „ închis cu ghilimea dreaptă escapată", () => {
    // Cazul care a scăpat de toate celelalte porți: `„scump\"` COMPILEAZĂ —
    // ghilimeaua e escapată, deci sintaxa e validă — dar se afișează cu semnul
    // greșit. 43 de astfel de cazuri stăteau în conținut și nu le vedea nimic.
    for (const f of SURSE) {
      const s = fs.readFileSync(f, "utf8");
      const rele = [...s.matchAll(/„[^"„”\\]*\\"/g)].map((m) => m[0].slice(0, 40));
      expect(rele, `închideri escapate în ${f}`).toEqual([]);
    }
  });

  it("nicio ghilimea deschisă cu \" și închisă cu ”", () => {
    for (const f of SURSE) {
      const s = fs.readFileSync(f, "utf8");
      // Un ” care nu are un „ înaintea lui pe același rând e o deschidere greșită.
      for (const [i, linie] of s.split("\n").entries()) {
        const închideri = (linie.match(/”/g) || []).length;
        const deschideri = (linie.match(/„/g) || []).length;
        expect(închideri, `${f}:${i + 1} — ${închideri} × ” dar ${deschideri} × „`).toBeLessThanOrEqual(
          deschideri
        );
      }
    }
  });
});

describe("datele exercițiilor", () => {
  it("fiecare pattern are 4 variante, un răspuns valid și context înainte", () => {
    for (const d of PATTERN_DRILLS) {
      expect(d.options.length, d.id).toBe(4);
      expect(d.correct, d.id).toBeGreaterThanOrEqual(0);
      expect(d.correct, d.id).toBeLessThan(4);
      // Contextul e jumătatea lecției: un pattern fără lumânări înainte nu se
      // poate judeca, iar exercițiul ar preda tocmai greșeala pe care o combate.
      expect(d.from, `${d.id} n-are context înainte de pattern`).toBeGreaterThanOrEqual(3);
      expect(d.candles.length, `${d.id}: from depășește lumânările`).toBeGreaterThan(d.from);
      for (const lang of LANGS) {
        expect(d.explain[lang].trim().length, `${d.id} explicație ${lang}`).toBeGreaterThan(60);
      }
    }
  });

  it("id-urile exercițiilor sunt unice", () => {
    const p = PATTERN_DRILLS.map((d) => d.id);
    expect(new Set(p).size).toBe(p.length);
    const s = SL_DRILLS.map((d) => d.id);
    expect(new Set(s).size).toBe(s.length);
  });

  it("lumânările exercițiilor sunt valide (h ≥ l, în 0..100)", () => {
    const toate = [...PATTERN_DRILLS.map((d) => d.candles), ...SL_DRILLS.map((d) => d.diagram.candles)];
    for (const [i, set] of toate.entries()) {
      for (const c of set) {
        expect(c.h, `set ${i}: h < l`).toBeGreaterThanOrEqual(c.l);
        for (const v of [c.o, c.h, c.l, c.c]) {
          expect(v, `set ${i}: în afara 0..100`).toBeGreaterThanOrEqual(0);
          expect(v, `set ${i}: în afara 0..100`).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it("nivelurile de SL sunt distincte și în cadru", () => {
    for (const d of SL_DRILLS) {
      expect(d.options.length, d.id).toBe(4);
      expect(d.correct, d.id).toBeLessThan(4);
      const ys = d.options.map((o) => o.y);
      // Două variante la același nivel ar face exercițiul imposibil de citit:
      // elevul ar vedea o singură linie și două răspunsuri pentru ea.
      expect(new Set(ys).size, `${d.id}: niveluri suprapuse`).toBe(4);
      for (const y of ys) {
        expect(y, `${d.id}: nivel în afara graficului`).toBeGreaterThan(0);
        expect(y, `${d.id}: nivel în afara graficului`).toBeLessThan(100);
      }
      for (const lang of LANGS) {
        expect(d.question[lang].trim().length, `${d.id} întrebare ${lang}`).toBeGreaterThan(20);
        expect(d.explain[lang].trim().length, `${d.id} explicație ${lang}`).toBeGreaterThan(100);
      }
    }
  });
});
