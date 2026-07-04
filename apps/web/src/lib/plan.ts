import { prisma } from "@/lib/prisma";

// ── Planul EFECTIV al utilizatorului ────────────────────────────────────────
// Sursa unică de adevăr pentru gating:
//   PRO  = abonament Stripe activ  SAU  trial în curs (14 zile de la înregistrare)
//   FREE = orice altceva (inclusiv trial expirat — downgrade lazy, fără cron)

export interface EffectivePlan {
  plan: "PRO" | "FREE";
  isTrial: boolean;
  trialDaysLeft: number | null;
}

export const FREE_LIMITS = {
  /** backteste pe luna calendaristică curentă */
  backtestsPerMonth: 3,
  /** conturi de trading */
  tradingAccounts: 1,
} as const;

export async function getEffectivePlan(userId: string): Promise<EffectivePlan> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true, trialEnd: true },
  });

  if (!sub) return { plan: "FREE", isTrial: false, trialDaysLeft: null };

  // Abonament plătit activ (PAST_DUE primește o grație până rezolvă plata)
  if (sub.plan === "PRO" && (sub.status === "ACTIVE" || sub.status === "PAST_DUE")) {
    return { plan: "PRO", isTrial: false, trialDaysLeft: null };
  }

  // Trial în curs
  if (sub.status === "TRIALING" && sub.trialEnd) {
    const msLeft = sub.trialEnd.getTime() - Date.now();
    if (msLeft > 0) {
      return {
        plan: "PRO",
        isTrial: true,
        trialDaysLeft: Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000))),
      };
    }
    // Trial expirat → downgrade lazy (o singură dată), fără să blocheze request-ul
    void prisma.subscription
      .update({ where: { userId }, data: { status: "CANCELLED" } })
      .catch(() => {});
  }

  return { plan: "FREE", isTrial: false, trialDaysLeft: null };
}

/** true dacă utilizatorul are acces PRO acum (plătit sau trial valid) */
export async function hasPro(userId: string): Promise<boolean> {
  return (await getEffectivePlan(userId)).plan === "PRO";
}

/** Răspunsul standard pentru funcții PRO accesate de pe FREE (HTTP 402). */
export const PRO_REQUIRED = {
  error: "Funcție disponibilă doar în planul PRO",
  code: "PRO_REQUIRED",
  upgradeUrl: "/pricing",
} as const;
