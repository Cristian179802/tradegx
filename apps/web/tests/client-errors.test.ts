import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { esteZgomotDeBrowser, TIPARE_ZGOMOT } from "@/lib/client-error-filter";

// ── Erorile din browser ──────────────────────────────────────────────────────
//
// Filtrul are două feluri de a greși, și amândouă strică monitorizarea:
//
//   prea larg  → defectele reale sunt aruncate în tăcere și nu afli niciodată
//   prea strâmt → panoul se umple de zgomot și defectele reale se pierd în el
//
// Testele de aici apără ambele margini.

describe("filtrul de zgomot aruncă ce nu e al nostru", () => {
  it("aruncă zgomotul benign de browser", () => {
    expect(esteZgomotDeBrowser("ResizeObserver loop completed with undelivered notifications")).toBe(true);
    expect(esteZgomotDeBrowser("ResizeObserver loop limit exceeded")).toBe(true);
  });

  it("aruncă erorile fără niciun detaliu", () => {
    // Un script de pe alt domeniu ne dă exact atât: „Script error." Nimic de reparat.
    expect(esteZgomotDeBrowser("Script error.")).toBe(true);
    expect(esteZgomotDeBrowser("Script error")).toBe(true);
  });

  it("aruncă erorile din extensiile utilizatorului", () => {
    expect(
      esteZgomotDeBrowser("TypeError: x is null\n  at chrome-extension://abcd/content.js:1:1")
    ).toBe(true);
    expect(esteZgomotDeBrowser("at moz-extension://xyz/inject.js")).toBe(true);
  });

  it("aruncă navigarea întreruptă", () => {
    // Utilizatorul a inchis tabul in mijlocul unei cereri. Nu e defect de cod.
    expect(esteZgomotDeBrowser("TypeError: Failed to fetch")).toBe(true);
    expect(esteZgomotDeBrowser("Load failed")).toBe(true);
  });
});

describe("filtrul NU aruncă defecte reale", () => {
  it.each([
    "TypeError: Cannot read properties of undefined (reading 'symbol')",
    "ReferenceError: pretCurent is not defined",
    "Invalid `prisma.trade.findMany()` invocation",
    "Minified React error #310",
    "Cannot convert undefined to object",
  ])("păstrează: %s", (mesaj) => {
    expect(esteZgomotDeBrowser(mesaj)).toBe(false);
  });

  it("nu aruncă un text gol sau lipsă", () => {
    expect(esteZgomotDeBrowser("")).toBe(false);
  });

  it("fiecare tipar are un motiv scris", () => {
    // O listă de filtre fără explicații devine, în timp, o listă pe care nimeni
    // n-o mai poate revizui: nu mai știi de ce e acolo, deci n-o scoți niciodată.
    for (const { tipar, motiv } of TIPARE_ZGOMOT) {
      expect(motiv.length, `tiparul ${tipar} n-are motiv`).toBeGreaterThan(30);
    }
  });
});

describe("raportarea din browser nu poate face rău", () => {
  const SURSA = fs.readFileSync("src/lib/report-client-error.ts", "utf8");
  const RUTA = fs.readFileSync("src/app/api/client-errors/route.ts", "utf8");

  it("clientul dedublează înainte să trimită", () => {
    // O componentă care aruncă la randare poate arunca de mii de ori pe secundă.
    // Fără dedublare, un singur defect ar trimite mii de cereri din browserul
    // unui om — mai rău pentru el decât defectul în sine.
    expect(SURSA).toContain("MAX_PER_PAGINA");
    expect(SURSA).toMatch(/trimise\.has|trimise\.add/);
  });

  it("clientul nu aruncă niciodată din raportare", () => {
    // Raportarea unei erori n-are voie sa produca alta.
    expect(SURSA).toMatch(/try\s*\{[\s\S]*catch\s*\{/);
  });

  it("ruta e limitată pe IP", () => {
    // E o poartă publică spre bază: trebuie să meargă și pentru vizitatori
    // nelogați, deci limita pe IP e singura barieră.
    expect(RUTA).toContain("rateLimit");
    expect(RUTA).toMatch(/x-forwarded-for|x-real-ip/);
  });

  it("ruta nu răspunde cu nimic util", () => {
    // Un endpoint care confirmă ce a înregistrat e o invitație.
    expect(RUTA).toContain("status: 204");
    expect(RUTA).not.toMatch(/NextResponse\.json\(\s*\{\s*(ok|success|id)/);
  });
});
