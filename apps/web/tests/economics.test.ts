import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { AI_QUOTA, type Tier } from "@/lib/plan";
import { PRICE_MONTHLY, PREMIUM_PRICE_MONTHLY } from "@/lib/pricing";

// ── Fiecare treaptă trebuie să rămână profitabilă ────────────────────────────
//
// DE CE EXISTĂ FIȘIERUL ĂSTA. S-a întâmplat deja o dată: am dimensionat cotele
// AI pe un abonament de $19, când prețul real e €10. Plafoanele rezultate costau
// $11,97 din ~$10,80 încasare — 111%, adică pierdere exact pe abonatul care le
// atinge. Greșeala a ajuns în producție și a fost prinsă la o verificare
// întâmplătoare, nu de vreo plasă de siguranță.
//
// De aici încolo, orice schimbare de cotă sau de preț care sparge profitabilitatea
// pică build-ul.

// Costul unei acțiuni, în dolari. Tokenii sunt ESTIMAȚI; modelele și `max_tokens`
// sunt MĂSURATE din cod. Prețurile per milion de tokeni vin din tariful Anthropic.
const PRET_MODEL = {
  "claude-sonnet-4-6": { in: 3, out: 15 },
  "claude-opus-4-8": { in: 5, out: 25 },
} as const;

const cost = (model: keyof typeof PRET_MODEL, tin: number, tout: number) =>
  (tin / 1e6) * PRET_MODEL[model].in + (tout / 1e6) * PRET_MODEL[model].out;

const COST_ACTIUNE = {
  chat: cost("claude-sonnet-4-6", 3000, 800),
  chartAnalyze: cost("claude-opus-4-8", 2000, 2000),
  tradeAnalyze: cost("claude-sonnet-4-6", 1500, 900),
};

/** Rezumatul zilnic și raportul săptămânal: cost fix, indiferent de consum. */
const COST_FIX_LUNAR =
  cost("claude-sonnet-4-6", 800, 350) * 30 + cost("claude-sonnet-4-6", 1500, 450) * 4;

// Anthropic facturează în USD, clientul plătește în EUR. Dacă euro slăbește sub
// asta, marja scade cu el — de-aia cursul e scris aici, nu ascuns într-un calcul.
const EUR_USD = 1.08;

const PRET_TREAPTA: Record<Tier, number> = {
  FREE: 0,
  PRO: PRICE_MONTHLY,
  PREMIUM: PREMIUM_PRICE_MONTHLY,
};

const costMaximLunar = (treapta: Tier) => {
  const q = AI_QUOTA[treapta];
  return (
    q.chat * COST_ACTIUNE.chat +
    q.chartAnalyze * COST_ACTIUNE.chartAnalyze +
    q.tradeAnalyze * COST_ACTIUNE.tradeAnalyze +
    COST_FIX_LUNAR
  );
};

describe("economia treptelor", () => {
  // Pragul e 60%, nu 100%: sub 100% ai fi „pe zero" după ce plătești Stripe,
  // găzduirea și tot restul. Marja trebuie să existe și după AI.
  it.each(["PRO", "PREMIUM"] as const)(
    "%s rămâne profitabilă chiar dacă abonatul consumă TOT",
    (treapta) => {
      const costUsd = costMaximLunar(treapta);
      const venitUsd = PRET_TREAPTA[treapta] * EUR_USD;
      const procent = (costUsd / venitUsd) * 100;

      expect(
        procent,
        `€${PRET_TREAPTA[treapta]} → cost AI maxim $${costUsd.toFixed(2)} = ${procent.toFixed(0)}% din încasare`
      ).toBeLessThan(60);
    }
  );

  it("FREE nu are AI deloc", () => {
    // Cotele mici păreau un cost de achiziție ieftin, 57 de cenți de om. Dar
    // înscrierile gratuite sunt NELIMITATE: o mie de conturi = $570 din venit
    // zero, și nimic nu oprește a doua mie. Un cost fără plafon nu e cost de
    // achiziție, e o scurgere.
    expect(AI_QUOTA.FREE).toEqual({ chat: 0, chartAnalyze: 0, tradeAnalyze: 0 });
  });

  it.each(["chat", "chartAnalyze", "tradeAnalyze"] as const)(
    "cota de %s crește de la o treaptă la alta",
    (functie) => {
      // Dacă o treaptă mai scumpă n-ar da mai mult, upgrade-ul n-ar avea sens —
      // iar clientul care plătește în plus ar avea dreptate să fie supărat.
      expect(AI_QUOTA.FREE[functie]).toBeLessThanOrEqual(AI_QUOTA.PRO[functie]);
      expect(AI_QUOTA.PRO[functie]).toBeLessThanOrEqual(AI_QUOTA.PREMIUM[functie]);
    }
  );

  it("PREMIUM costă mai mult decât PRO", () => {
    expect(PREMIUM_PRICE_MONTHLY).toBeGreaterThan(PRICE_MONTHLY);
  });

  // Calculul de mai sus presupune anumite modele. Dacă cineva schimbă modelul
  // folosit de o funcție — de exemplu chat-ul de pe Sonnet pe Opus — costul se
  // dublează, iar testele de profitabilitate ar continua să treacă degeaba,
  // fiindcă ele nu citesc codul. Testul ăsta leagă cele două: schimbi modelul,
  // ești obligat să treci și pe aici și să reevaluezi economia.
  it.each([
    ["src/app/api/ai-assistant/chat/route.ts", "claude-sonnet-4-6"],
    ["src/app/api/trades/[id]/analyze/route.ts", "claude-sonnet-4-6"],
    ["src/lib/daily-review.ts", "claude-sonnet-4-6"],
    ["src/lib/weekly-report.ts", "claude-sonnet-4-6"],
  ])("%s folosește încă modelul pe care e calculat costul", (fisier, model) => {
    const src = fs.readFileSync(fisier, "utf8");
    expect(
      src,
      `dacă modelul s-a schimbat, recalculează COST_ACTIUNE din tests/economics.test.ts`
    ).toContain(`model: "${model}"`);
  });
});
