import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  period: z.enum(["monthly", "annual"]).optional(),
  priceId: z.string().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  // Graceful — Stripe may not be configured
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Plățile nu sunt configurate momentan. Revino în curând.", code: "STRIPE_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }

  const { period, successUrl, cancelUrl } = result.data;
  let { priceId } = result.data;

  // Resolve priceId from period server-side — no NEXT_PUBLIC_ vars needed
  if (period && !priceId) {
    priceId =
      period === "monthly"
        ? process.env.STRIPE_PRO_MONTHLY_PRICE_ID
        : process.env.STRIPE_PRO_ANNUAL_PRICE_ID;
  }

  if (!priceId) {
    return NextResponse.json(
      { error: "Prețul nu este configurat pe server.", code: "NO_PRICE_ID" },
      { status: 503 }
    );
  }

  try {
    const { getStripe } = await import("@/lib/stripe");
    const stripe = getStripe();
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXTAUTH_URL ??
      "https://tradegx.com";

    // Get or create Stripe customer
    const existing = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { stripeCustomerId: true },
    });

    let customerId = existing?.stripeCustomerId ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name ?? undefined,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;

      await prisma.subscription.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          stripeCustomerId: customerId,
          plan: "FREE",
          status: "ACTIVE",
        },
        update: { stripeCustomerId: customerId },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      // /billing, nu /settings?tab=billing: pagina de settings nu citește
      // parametrul `tab`, deci clientul care plătea ateriza pe tabul implicit
      // (profil), fără nicio confirmare. /billing arată planul și data următoarei
      // facturări — adică exact ce vrea să vadă cineva care a dat banii.
      success_url: successUrl ?? `${baseUrl}/billing?success=true`,
      cancel_url: cancelUrl ?? `${baseUrl}/pricing`,
      // Fără trial la plată — trial-ul de 14 zile e gestionat de noi, în baza de
      // date, nu de Stripe. „Fără trial" se exprimă prin ABSENȚA câmpului:
      // trial_period_days: 0 e respins de Stripe cu „The minimum number of trial
      // period days is 1", iar cererea eșua înainte de a se crea sesiunea de
      // plată. Nimeni nu putea să se aboneze.
      subscription_data: {
        metadata: { userId: session.user.id },
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: any) {
    console.error("[Stripe Checkout]", err);
    return NextResponse.json({ error: err.message ?? "Eroare Stripe" }, { status: 500 });
  }
}
