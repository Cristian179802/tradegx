import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

// ── Schimbarea planului nu are voie să atingă datele utilizatorului ──────────
//
// Un upgrade sau un downgrade schimbă UN SINGUR rând: cel din `Subscription`.
// Tranzacțiile, jurnalul, conturile de trading rămân neatinse — cine coboară pe
// FREE cu trei conturi le păstrează pe toate trei, doar nu mai poate adăuga al
// patrulea.
//
// Testele de aici sunt STATICE, pe cod, fiindcă asta e o regulă de arhitectură,
// nu un comportament de rulare. Dacă cineva adaugă mâine o ștergere pe calea de
// downgrade, vreau să pice build-ul — nu să afle un client că și-a pierdut doi
// ani de istoric.

const FISIERE_SURSA = (() => {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) walk(f);
      else if (/\.tsx?$/.test(e.name)) out.push(f);
    }
  };
  walk("src");
  return out;
})();

describe("schimbarea planului nu distruge date", () => {
  it("sincronizarea cu Stripe scrie DOAR în tabela subscription", () => {
    const src = fs.readFileSync("src/lib/stripe-sync.ts", "utf8");
    const tabeleScrise = [
      ...src.matchAll(/prisma\.(\w+)\.(update|upsert|delete|deleteMany|create|createMany)/g),
    ].map((m) => m[1]);

    expect([...new Set(tabeleScrise)]).toEqual(["subscription"]);
  });

  it("sincronizarea cu Stripe nu șterge nimic", () => {
    const src = fs.readFileSync("src/lib/stripe-sync.ts", "utf8");
    expect(src).not.toMatch(/prisma\.\w+\.delete/);
  });

  it("nicio funcție nu combină verificarea planului cu ștergerea datelor", () => {
    const suspecte: string[] = [];

    for (const f of FISIERE_SURSA) {
      const src = fs.readFileSync(f, "utf8");
      // Împărțim pe funcții, ca o verificare de plan într-un fișier să nu dea
      // alarmă falsă din cauza unei ștergeri aflate în cu totul altă funcție.
      for (const bloc of src.split(/\n(?=export (?:async )?function |async function )/)) {
        const verificaPlanul = /hasPro\(|getEffectivePlan\(|plan === "FREE"|SubscriptionPlan/.test(bloc);
        const stergeDate =
          /prisma\.(trade|tradingAccount|backtest|journalEntry|user)\.(delete|deleteMany)/.test(bloc);
        if (verificaPlanul && stergeDate) suspecte.push(f.replace(/\\/g, "/"));
      }
    }

    expect(suspecte, `verificate ${FISIERE_SURSA.length} fișiere`).toEqual([]);
  });

  it("citirea conturilor nu filtrează după plan", () => {
    // Limita de conturi se aplică la ADĂUGARE. Dacă ar fi și pe citire, cineva
    // care coboară pe FREE și-ar vedea brusc conturile dispărând — ceea ce, din
    // partea lui, e imposibil de deosebit de pierderea datelor.
    const src = fs.readFileSync("src/app/api/accounts/route.ts", "utf8");
    const getBloc = src.match(/export async function GET[\s\S]*?(?=\nexport |$)/)?.[0] ?? "";
    const postBloc = src.match(/export async function POST[\s\S]*?(?=\nexport |$)/)?.[0] ?? "";

    expect(getBloc, "GET nu are voie să verifice planul").not.toMatch(/hasPro\(|FREE_LIMITS/);
    expect(postBloc, "POST trebuie să aplice limita").toMatch(/FREE_LIMITS\.tradingAccounts/);
  });

  it("contorul de cotă AI nu include treapta în cheie", () => {
    // Dacă treapta ar face parte din cheie, un upgrade la mijlocul lunii ar
    // reseta consumul — iar un upgrade urmat de downgrade ar da cota de două ori.
    const src = fs.readFileSync("src/lib/ai-budget.ts", "utf8");
    const cheie = src.match(/rateLimit\(`([^`]+)`/)?.[1] ?? "";

    expect(cheie, "cheia găsită: " + cheie).not.toMatch(/plan|tier|treapt/i);
    expect(cheie).toContain("userId");
  });
});

describe("treapta de sus nu pierde funcțiile treptei de jos", () => {
  it("hasPro include PREMIUM", () => {
    // Zeci de rute întreabă `hasPro()`. Dacă PREMIUM n-ar fi inclus, exact
    // clientul care plătește cel mai mult ar pierde funcțiile pentru care
    // plătește — și ar fi convins, pe bună dreptate, că e o înșelătorie.
    const src = fs.readFileSync("src/lib/plan.ts", "utf8");
    const corpul = src.match(/export async function hasPro[\s\S]*?\n\}/)?.[0] ?? "";

    expect(corpul).toContain('plan === "PREMIUM"');
  });

  it("Stripe verifică prețul PREMIUM înaintea celui PRO", () => {
    // La o configurare greșită (același ID în ambele variabile), e mai bine ca
    // omul să primească mai mult decât a plătit decât mai puțin: o reclamație de
    // „am plătit și n-am primit" costă mai mult decât diferența.
    const src = fs.readFileSync("src/lib/stripe-sync.ts", "utf8");
    const iPremium = src.indexOf("STRIPE_PREMIUM_MONTHLY_PRICE_ID");
    const iPro = src.indexOf("STRIPE_PRO_MONTHLY_PRICE_ID");

    expect(iPremium).toBeGreaterThan(-1);
    expect(iPremium).toBeLessThan(iPro);
  });
});
