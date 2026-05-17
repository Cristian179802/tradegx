import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    prices: {
      monthly: { amount: 19, period: "monthly" },
      annual: { amount: 144, perMonth: 12, period: "annual" },
    },
  });
}
