import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { intParam } from "@/lib/parse-params";

// ── Numere din parametrii de URL ─────────────────────────────────────────────
//
// Defect confirmat pe producție: `/api/community/posts?page=abc` returna 500.
// `Number("abc")` e NaN, `Math.max(1, NaN)` e tot NaN — nu 1 — iar NaN ajungea în
// `skip:` la Prisma, care arunca. Același tipar exista în cinci fișiere: nu era o
// scăpare, era un obicei.

describe("intParam", () => {
  it("acceptă un număr valid", () => {
    expect(intParam("5", 1)).toBe(5);
  });

  it("cade pe implicit când parametrul nu e număr", () => {
    // Cazul care a produs 500-ul.
    expect(intParam("abc", 1)).toBe(1);
    expect(intParam("???", 20)).toBe(20);
  });

  it("cade pe implicit când parametrul lipsește", () => {
    expect(intParam(null, 7)).toBe(7);
    expect(intParam(undefined, 7)).toBe(7);
  });

  it("tratează șirul gol ca lipsă, nu ca zero", () => {
    // `Number("")` e 0, nu NaN — o capcană separată: `?page=` ar fi dat pagina 0.
    expect(intParam("", 1)).toBe(1);
  });

  it("respinge Infinity", () => {
    expect(intParam("Infinity", 1)).toBe(1);
    expect(intParam("-Infinity", 1)).toBe(1);
  });

  it("respectă minimul și maximul", () => {
    expect(intParam("0", 1, { min: 1 })).toBe(1);
    expect(intParam("9999", 20, { max: 100 })).toBe(100);
    expect(intParam("-5", 1, { min: 1 })).toBe(1);
  });

  it("taie zecimalele", () => {
    expect(intParam("3.9", 1)).toBe(3);
  });

  it("NU întoarce niciodată NaN", () => {
    // Invariantul care contează: orice ajunge de aici într-un `skip:` sau `take:`
    // trebuie să fie un întreg finit, altfel Prisma aruncă.
    for (const intrare of ["abc", "", null, undefined, "NaN", "Infinity", "1e999", "0x1F", " "]) {
      const v = intParam(intrare as string | null, 10);
      expect(Number.isFinite(v), `intrare: ${JSON.stringify(intrare)}`).toBe(true);
    }
  });
});

describe("niciun parametru de URL nu mai ajunge nevalidat în Prisma", () => {
  it("rutele API nu mai convertesc direct parametri la număr", () => {
    // Garda de arhitectură: tiparul se întorcea de fiecare dată când cineva
    // scria o rută nouă cu paginare. Acum pică build-ul.
    const rute: string[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const f = path.join(dir, e.name);
        if (e.isDirectory()) walk(f);
        else if (e.name === "route.ts") rute.push(f);
      }
    };
    walk("src/app/api");

    const vinovate: string[] = [];
    for (const f of rute) {
      const src = fs.readFileSync(f, "utf8");
      // `Number(...)` sau `parseInt(...)` direct pe un searchParams.get().
      const tipar = /(?:Number|parseInt)\(\s*[\w.]*searchParams\.get\(/;
      if (!tipar.test(src)) continue;
      // Excepție: e în regulă dacă rezultatul e verificat cu Number.isFinite.
      if (/Number\.isFinite/.test(src)) continue;
      vinovate.push(f.replace(/\\/g, "/"));
    }

    expect(vinovate, "folosește intParam din @/lib/parse-params").toEqual([]);
  });
});
