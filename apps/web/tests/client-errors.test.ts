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

describe("barierele de eroare sunt la locul lor", () => {
  const ERROR = fs.readFileSync("src/app/error.tsx", "utf8");
  const GLOBAL = fs.readFileSync("src/app/global-error.tsx", "utf8");
  const DASH = fs.readFileSync("src/app/(dashboard)/error.tsx", "utf8");

  it("error.tsx NU randează html/body", () => {
    // Traieste inauntrul layout-ului radacina, care are deja html si body.
    // Propriul wrapper producea <body><html><body> — HTML invalid.
    expect(ERROR).not.toMatch(/<html|<body/);
    expect(DASH).not.toMatch(/<html|<body/);
  });

  it("global-error.tsx randează html/body", () => {
    // El INLOCUIESTE layout-ul radacina, deci trebuie sa le aiba pe amandoua.
    expect(GLOBAL).toMatch(/<html/);
    expect(GLOBAL).toMatch(/<body/);
  });

  it("global-error.tsx nu depinde de nimic care s-ar putea să nu se fi încărcat", () => {
    // Daca am ajuns acolo, presupunerea sanatoasa e ca nimic n-a mers cum trebuie.
    // Fara clase de Tailwind, fara iconite din biblioteci, fara providere.
    expect(GLOBAL).not.toMatch(/className=/);
    expect(GLOBAL).not.toMatch(/from "lucide-react"/);
    expect(GLOBAL).not.toMatch(/next-intl/);
  });

  it("toate cele trei bariere raportează", () => {
    for (const [nume, sursa] of [["error", ERROR], ["global-error", GLOBAL], ["dashboard/error", DASH]] as const) {
      expect(sursa, `${nume} nu raporteaza`).toContain("reportClientError");
    }
  });
});

describe("poarta chiar e deschisa", () => {
  const MW = fs.readFileSync("src/middleware.ts", "utf8");

  it("middleware o lasă să treacă fără autentificare", () => {
    // Defectul asta e invizibil local: in dezvoltare esti mereu logat, deci ruta
    // pare sa mearga. Pe productie, middleware-ul o redirecta la /login cu 307 si
    // NICIO eroare de vizitator nelogat nu ajungea nicaieri -- adica exact
    // erorile de pe landing si din inregistrare, cele care costa clienti.
    expect(MW).toContain('"/api/client-errors"');
  });
});
