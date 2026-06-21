import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.subscription) break;

        const sub = await getStripe().subscriptions.retrieve(session.subscription as string);
        const userId = sub.metadata.userId ?? session.metadata?.userId;
        if (!userId) break;

        await upsertSubscription(userId, sub);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = event.data.object as any;
        const userId = sub.metadata.userId;
        if (!userId) {
          // Try to find userId from customer
          const customer = await getStripe().customers.retrieve(sub.customer as string);
          if ("deleted" in customer) break;
          const dbSub = await prisma.subscription.findFirst({
            where: { stripeCustomerId: sub.customer as string },
            select: { userId: true },
          });
          if (dbSub) await upsertSubscription(dbSub.userId, sub);
        } else {
          await upsertSubscription(userId, sub);
        }
        break;
      }

      case "customer.subscription.deleted": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = event.data.object as any;
        const dbSub = await prisma.subscription.findFirst({
          where: { stripeSubId: sub.id },
          select: { userId: true },
        });
        if (dbSub) {
          await prisma.subscription.update({
            where: { userId: dbSub.userId },
            data: { plan: "FREE", status: "CANCELLED", stripeSubId: null },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
        if (!invoice.subscription) break;
        const dbSub = await prisma.subscription.findFirst({
          where: { stripeSubId: invoice.subscription },
        });
        if (dbSub) {
          await prisma.subscription.update({
            where: { userId: dbSub.userId },
            data: { status: "PAST_DUE" },
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertSubscription(userId: string, sub: any) {
  const priceId = sub.items.data[0]?.price.id;
  const proMonthlyId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
  const proAnnualId = process.env.STRIPE_PRO_ANNUAL_PRICE_ID;

  const isPro = priceId === proMonthlyId || priceId === proAnnualId;

  const statusMap: Record<string, string> = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELLED",
    trialing: "TRIALING",
    unpaid: "PAST_DUE",
    paused: "CANCELLED",
    incomplete: "PAST_DUE",
    incomplete_expired: "CANCELLED",
  };

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: sub.customer as string,
      stripeSubId: sub.id,
      plan: isPro ? "PRO" : "FREE",
      status: (statusMap[sub.status] ?? "ACTIVE") as never,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
    update: {
      stripeSubId: sub.id,
      plan: isPro ? "PRO" : "FREE",
      status: (statusMap[sub.status] ?? "ACTIVE") as never,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });
}
