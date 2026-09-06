import { prisma } from "@/lib/prisma";

// ── Planul EFECTIV al utilizatorului ────────────────────────────────────────
// Sursa unică de adevăr pentru gating:
//   PREMIUM = abonament Stripe activ pe prețul Premium
//   PRO     = abonament Stripe activ pe prețul Pro  SAU  trial (14 zile)
//   FREE    = orice altceva (inclusiv trial expirat — downgrade lazy, fără cron)

export type Tier = "FREE" | "PRO" | "PREMIUM";

export interface EffectivePlan {
  plan: Tier;
  isTrial: boolean;
  trialDaysLeft: number | null;
}

export const FREE_LIMITS = {
  /** backteste pe luna calendaristică curentă */
  backtestsPerMonth: 3,
  /** conturi de trading */
  tradingAccounts: 1,
} as const;

// ── Cât AI intră în fiecare treaptă, pe lună ─────────────────────────────────
//
// Cifrele nu sunt alese din burtă. Costul REAL al fiecărei acțiuni, la modelele
// din cod: o întrebare la coach 2,1 cenți, o analiză pe grafic 6 cenți, o analiză
// pe tranzacție 1,8 cenți, plus 27 de cenți pe lună rezumatele automate.
//
// Fiecare treaptă e dimensionată ca, ȘI DACĂ abonatul consumă TOT, să rămână
// profitabilă. Ținta e ca AI-ul să nu treacă de jumătate din încasare:
//
//   FREE     cel mult $0,57 — nu e pierdere, e cost de achiziție. Îl lași să
//            guste, apoi vede singur plafonul. Cel mai ieftin marketing care există.
//   PRO      cel mult $4,71 din €10 (≈$10,80)  = 44%
//   PREMIUM  cel mult $14,43 din €25 (≈$27,00) = 53%
//
// ATENȚIE la conversie: Anthropic facturează în USD, clientul plătește în EUR.
// Marja de mai sus presupune EUR/USD ≈ 1,08. Dacă euro slăbește, marja scade cu el.
//
// Fără plafon deloc, un singur abonat putea consuma peste $1200 într-o lună —
// limitele pe oră opresc un abuz, dar nu opresc niciodată costul.
//
// Zero înseamnă că funcția e ÎNCHISĂ pe treapta aia, nu că are cotă nulă:
// utilizatorul primește invitația de upgrade, nu un „ai consumat tot" despre
// ceva ce n-a avut niciodată.
export const AI_QUOTA = {
  FREE: { chat: 10, chartAnalyze: 0, tradeAnalyze: 5 },
  PRO: { chat: 120, chartAnalyze: 20, tradeAnalyze: 40 },
  PREMIUM: { chat: 400, chartAnalyze: 60, tradeAnalyze: 120 },
} as const satisfies Record<Tier, Record<string, number>>;

export type FunctieAI = keyof (typeof AI_QUOTA)["PRO"];

export async function getEffectivePlan(userId: string): Promise<EffectivePlan> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true, trialEnd: true },
  });

  if (!sub) return { plan: "FREE", isTrial: false, trialDaysLeft: null };

  // Abonament plătit activ (PAST_DUE primește o grație până rezolvă plata).
  // PREMIUM se întoarce ca atare: tot ce cere PRO îl acceptă oricum, fiindcă
  // `hasPro()` de mai jos tratează ambele la fel.
  if (
    (sub.plan === "PRO" || sub.plan === "PREMIUM") &&
    (sub.status === "ACTIVE" || sub.status === "PAST_DUE")
  ) {
    return { plan: sub.plan, isTrial: false, trialDaysLeft: null };
  }

  // Trial în curs → PRO, niciodată PREMIUM. Perioada de probă arată produsul,
  // nu treapta de sus.
  if (sub.status === "TRIALING" && sub.trialEnd) {
    const msLeft = sub.trialEnd.getTime() - Date.now();
    if (msLeft > 0) {
      return {
        plan: "PRO",
        isTrial: true,
        trialDaysLeft: Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000))),
      };
    }
    // Trial expirat → downgrade lazy (o singură dată). AWAITED intenționat:
    // pe Vercel serverless, un fire-and-forget („void") se pierde — lambda-ul
    // îngheață imediat după răspuns și update-ul nu se mai execută.
    await prisma.subscription
      .update({ where: { userId }, data: { status: "CANCELLED" } })
      .catch(() => {});
  }

  return { plan: "FREE", isTrial: false, trialDaysLeft: null };
}

/**
 * true dacă utilizatorul are acces PRO acum (plătit, trial valid, sau PREMIUM).
 *
 * PREMIUM trebuie să treacă pe AICI, nu doar pe verificări separate: zeci de rute
 * întreabă `hasPro()`, iar dacă treapta de sus n-ar fi inclusă, cel care plătește
 * cel mai mult ar pierde exact funcțiile pentru care plătește.
 */
export async function hasPro(userId: string): Promise<boolean> {
  const { plan } = await getEffectivePlan(userId);
  return plan === "PRO" || plan === "PREMIUM";
}

/** Cota lunară a unei funcții AI pentru o treaptă. 0 = funcția e închisă acolo. */
export function cotaAI(plan: Tier, functie: FunctieAI): number {
  return AI_QUOTA[plan][functie];
}

/** Răspunsul standard pentru funcții PRO accesate de pe FREE (HTTP 402). */
export const PRO_REQUIRED = {
  error: "Funcție disponibilă doar în planul PRO",
  code: "PRO_REQUIRED",
  upgradeUrl: "/pricing",
} as const;

/** Idem, când cota gratuită s-a epuizat — mesaj de upgrade, nu de eroare. */
export const FREE_QUOTA_EPUIZATA = {
  error: "Ai folosit tot AI-ul inclus în planul gratuit. Treci la PRO pentru mai mult.",
  code: "FREE_QUOTA",
  upgradeUrl: "/pricing",
} as const;
