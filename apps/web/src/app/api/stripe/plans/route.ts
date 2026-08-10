import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  PRICE_MONTHLY, PRICE_ANNUAL, PRICE_ANNUAL_PER_MONTH, CURRENCY,
} from "@/lib/pricing";

// Returns plan info + current subscription — no secret keys exposed to client
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const select = {
    plan: true,
    status: true,
    currentPeriodEnd: true,
    cancelAtPeriodEnd: true,
    trialEnd: true,
    stripeCustomerId: true,
  } as const;

  let subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select,
  });

  // Plasă de siguranță pentru cel mai urât scenariu: clientul a plătit, banii au
  // intrat, dar webhook-ul a fost respins (semnătură greșită, rută picată) și el a
  // rămas pe FREE. Aici întrebăm Stripe care e adevărul și reparăm rândul, deci
  // activarea nu mai atârnă de livrarea unui singur mesaj.
  //
  // Verificăm doar când baza noastră arată ca și cum ceva ar putea lipsi — altfel
  // fiecare deschidere a paginii ar costa un apel la Stripe degeaba.
  const mightBeStale =
    !!subscription?.stripeCustomerId &&
    (subscription.plan !== "PRO" ||
      (subscription.status !== "ACTIVE" && subscription.status !== "TRIALING") ||
      (!!subscription.currentPeriodEnd && subscription.currentPeriodEnd < new Date()));

  if (mightBeStale) {
    const { reconcileSubscription } = await import("@/lib/stripe-sync");
    const repaired = await reconcileSubscription(session.user.id);
    if (repaired) {
      subscription = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
        select,
      });
    }
  }

  const stripeConfigured = !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID &&
    process.env.STRIPE_PRO_ANNUAL_PRICE_ID
  );

  return NextResponse.json({
    stripeConfigured,
    subscription: subscription ?? null,
    // Sumele vin din lib/pricing — sursa unică. Erau scrise de mână aici, deci
    // rămâneau în urmă la fiecare schimbare de preț.
    prices: {
      monthly: { amount: PRICE_MONTHLY, period: "monthly", currency: CURRENCY },
      annual: {
        amount: PRICE_ANNUAL,
        perMonth: PRICE_ANNUAL_PER_MONTH,
        period: "annual",
        currency: CURRENCY,
      },
    },
  });
}
