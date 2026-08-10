// ── Sincronizarea abonamentelor cu Stripe — SINGURA sursă de adevăr ──────────
//
// De ce există fișierul ăsta: regulile de traducere „abonament Stripe → rândul
// nostru din baza de date" trăiau doar în handler-ul de webhook. Orice al doilea
// loc care are nevoie de ele ar fi însemnat o copie, iar copiile se
// desincronizează — exact felul în care au apărut celelalte defecte de plată din
// proiectul ăsta. Aici stau o singură dată, iar webhook-ul le importă.
//
// A doua responsabilitate: RECONCILIEREA. Webhook-ul e singurul mecanism care
// activează un abonament, deci e un punct unic de eșec. Dacă semnătura e greșită,
// dacă Stripe nu ne găsește, dacă ruta e picată câteva minute — clientul a plătit,
// banii au intrat, iar el rămâne pe FREE fără să înțeleagă de ce. Reconcilierea
// întreabă Stripe care e adevărul și repară rândul, deci plata nu mai depinde de
// livrarea unui singur mesaj.

import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

/** Statusurile Stripe traduse în enum-ul nostru. */
const STATUS_MAP: Record<string, string> = {
  active: "ACTIVE",
  past_due: "PAST_DUE",
  canceled: "CANCELLED",
  trialing: "TRIALING",
  unpaid: "PAST_DUE",
  paused: "CANCELLED",
  incomplete: "PAST_DUE",
  incomplete_expired: "CANCELLED",
};

/**
 * Perioada curentă a abonamentului.
 *
 * ATENȚIE — SCHIMBARE DE API CARE RUPEA PLĂȚILE:
 * În versiunile noi (`2026-04-22.dahlia`, stripe v22), `current_period_start` și
 * `current_period_end` NU mai există pe obiectul Subscription — au fost mutate pe
 * fiecare SUBSCRIPTION ITEM. Codul vechi citea `sub.current_period_end`, primea
 * `undefined`, iar `new Date(undefined * 1000)` producea Invalid Date. Prisma
 * refuza data, handler-ul arunca, webhook-ul întorcea 500, Stripe reîncerca și
 * eșua din nou — deci abonamentul NU se activa niciodată.
 *
 * Citim de pe item, cu fallback pe rădăcină pentru conturi rămase pe API vechi.
 * Dacă tot lipsesc, întoarcem null (coloanele sunt nullable) — mai bine fără dată
 * decât cu una invalidă care blochează activarea.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function periodOf(sub: any): { start: Date | null; end: Date | null } {
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

/** PRO doar dacă prețul e unul dintre cele două configurate. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function planOf(sub: any): { isPro: boolean; priceId?: string } {
  const priceId = sub?.items?.data?.[0]?.price?.id as string | undefined;
  const isPro =
    !!priceId &&
    (priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID ||
      priceId === process.env.STRIPE_PRO_ANNUAL_PRICE_ID);
  return { isPro, priceId };
}

/** Scrie în baza noastră starea unui abonament Stripe. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function upsertSubscription(userId: string, sub: any) {
  const { isPro, priceId } = planOf(sub);
  const { start, end } = periodOf(sub);

  const data = {
    stripeSubId: sub.id as string,
    plan: (isPro ? "PRO" : "FREE") as never,
    status: (STATUS_MAP[sub.status] ?? "ACTIVE") as never,
    currentPeriodStart: start,
    currentPeriodEnd: end,
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
  };

  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, stripeCustomerId: sub.customer as string, ...data },
    update: data,
  });

  // Dacă prețul nu se potrivește cu niciunul configurat, userul rămâne pe FREE
  // deși a plătit. Semnalăm zgomotos: e o greșeală de configurare, nu de client.
  if (!isPro) {
    console.warn(
      `[stripe] priceId "${priceId}" nu corespunde nici cu STRIPE_PRO_MONTHLY_PRICE_ID ` +
      `nici cu STRIPE_PRO_ANNUAL_PRICE_ID — user ${userId} rămâne pe FREE.`
    );
  }
}

/** Abonamentul care contează, dacă clientul are mai multe în istoric. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mostRelevant(subs: any[]): any | null {
  const rank = (s: string) =>
    s === "active" ? 0 : s === "trialing" ? 1 : s === "past_due" ? 2 : 3;
  return [...subs].sort((a, b) => rank(a.status) - rank(b.status))[0] ?? null;
}

/**
 * Întreabă Stripe care e starea reală a abonamentului și repară rândul nostru.
 *
 * Se apelează din ruta care alimentează pagina de abonament, deci un client care
 * a plătit și se întoarce în aplicație e reparat la prima încărcare, chiar dacă
 * webhook-ul n-a ajuns niciodată. Nu înlocuiește webhook-ul (acela reacționează
 * imediat și prinde și anulările venite din portalul Stripe) — îl dublează.
 *
 * Nu aruncă niciodată: dacă Stripe nu răspunde, pagina trebuie să se încarce
 * oricum, cu datele locale. O eroare aici nu are voie să blocheze interfața.
 *
 * @returns true dacă a schimbat ceva în baza de date.
 */
export async function reconcileSubscription(userId: string): Promise<boolean> {
  if (!process.env.STRIPE_SECRET_KEY) return false;

  try {
    const local = await prisma.subscription.findUnique({
      where: { userId },
      select: { stripeCustomerId: true, stripeSubId: true, plan: true, status: true },
    });
    // Fără client Stripe nu există plată de recuperat.
    if (!local?.stripeCustomerId) return false;

    const stripe = getStripe();
    const list = await stripe.subscriptions.list({
      customer: local.stripeCustomerId,
      status: "all",
      limit: 10,
      expand: ["data.items.data.price"],
    });

    const sub = mostRelevant(list.data);
    if (!sub) return false;

    const { isPro } = planOf(sub);
    const wanted = {
      plan: isPro ? "PRO" : "FREE",
      status: STATUS_MAP[sub.status] ?? "ACTIVE",
      subId: sub.id,
    };

    // Nimic de făcut dacă baza noastră spune deja același lucru.
    if (
      local.plan === wanted.plan &&
      local.status === wanted.status &&
      local.stripeSubId === wanted.subId
    ) {
      return false;
    }

    await upsertSubscription(userId, sub);
    console.warn(
      `[stripe] reconciliere: user ${userId} era ${local.plan}/${local.status}, ` +
      `Stripe spune ${wanted.plan}/${wanted.status} (${sub.id}). Reparat. ` +
      `Verifică livrările webhook-ului — probabil au eșuat.`
    );
    return true;
  } catch (err) {
    console.error("[stripe] reconciliere eșuată:", err);
    return false;
  }
}
