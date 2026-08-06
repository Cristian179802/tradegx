import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

// `export const config = { api: { bodyParser: false } }` era o convenție de
// Pages Router — în App Router nu face NIMIC. Nu era o problemă doar pentru că
// `req.text()` întoarce oricum corpul brut, de care are nevoie verificarea
// semnăturii. Am scos-o ca să nu pară că apără ceva.
//
// Runtime explicit: SDK-ul Stripe are nevoie de Node (crypto), nu de Edge.
export const runtime = "nodejs";

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
        // A DOUA SCHIMBARE DE API: `invoice.subscription` nu mai există la
        // rădăcină — s-a mutat în `invoice.parent.subscription_details.subscription`.
        // Codul vechi îl citea de la rădăcină, primea undefined și ieșea prin
        // `break` — deci o plată eșuată NU marca niciodată contul PAST_DUE, în
        // silențiu total. Tipul fusese lărgit manual cu `& { subscription?… }`,
        // semn că eroarea de TS a fost acoperită în loc să fie rezolvată.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;
        const subId: string | undefined =
          (typeof invoice?.parent?.subscription_details?.subscription === "string"
            ? invoice.parent.subscription_details.subscription
            : invoice?.parent?.subscription_details?.subscription?.id) ??
          (typeof invoice?.subscription === "string" ? invoice.subscription : undefined);

        if (!subId) {
          console.warn("[stripe] invoice.payment_failed fără id de abonament — ignorat");
          break;
        }
        const dbSub = await prisma.subscription.findFirst({ where: { stripeSubId: subId } });
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

/**
 * Perioada curentă a abonamentului.
 *
 * ATENȚIE — SCHIMBARE DE API CARE RUPEA PLĂȚILE:
 * În versiunile noi (aici `2026-04-22.dahlia`, stripe v22), `current_period_start`
 * și `current_period_end` NU mai există pe obiectul Subscription — au fost mutate
 * pe fiecare SUBSCRIPTION ITEM. Codul vechi citea `sub.current_period_end`, primea
 * `undefined`, iar `new Date(undefined * 1000)` producea Invalid Date. Prisma
 * refuza data invalidă, handler-ul arunca, webhook-ul întorcea 500, Stripe reîncerca
 * și eșua din nou — deci abonamentul NU se activa niciodată. Clientul plătea și
 * rămânea pe FREE.
 *
 * Cast-urile `as any` din handler sunt motivul pentru care TypeScript nu a prins-o.
 *
 * Citim de pe item, cu fallback pe rădăcină pentru conturi rămase pe API vechi.
 * Dacă tot lipsesc, întoarcem null (coloanele sunt nullable) — mai bine fără dată
 * decât cu una invalidă care blochează activarea.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function periodOf(sub: any): { start: Date | null; end: Date | null } {
  const item = sub?.items?.data?.[0];
  const rawStart = item?.current_period_start ?? sub?.current_period_start;
  const rawEnd = item?.current_period_end ?? sub?.current_period_end;
  const toDate = (v: unknown): Date | null => {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return null;
    const d = new Date(n * 1000);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  return { start: toDate(rawStart), end: toDate(rawEnd) };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertSubscription(userId: string, sub: any) {
  const priceId = sub.items.data[0]?.price.id;
  const proMonthlyId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
  const proAnnualId = process.env.STRIPE_PRO_ANNUAL_PRICE_ID;

  const isPro = priceId === proMonthlyId || priceId === proAnnualId;
  const { start, end } = periodOf(sub);

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
      currentPeriodStart: start,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    },
    update: {
      stripeSubId: sub.id,
      plan: isPro ? "PRO" : "FREE",
      status: (statusMap[sub.status] ?? "ACTIVE") as never,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    },
  });

  // Dacă preț-ul nu se potrivește cu niciunul configurat, userul rămâne pe FREE
  // deși a plătit. Semnalăm zgomotos: e o greșeală de configurare, nu de client.
  if (!isPro) {
    console.warn(
      `[stripe] priceId "${priceId}" nu corespunde nici cu STRIPE_PRO_MONTHLY_PRICE_ID ` +
      `nici cu STRIPE_PRO_ANNUAL_PRICE_ID — user ${userId} rămâne pe FREE.`
    );
  }
}
