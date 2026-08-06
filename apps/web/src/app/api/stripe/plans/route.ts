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

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: {
      plan: true,
      status: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      trialEnd: true,
      stripeCustomerId: true,
    },
  });

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
