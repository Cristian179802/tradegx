import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, {
      apiVersion: "2026-04-22.dahlia",
      typescript: true,
    });
  }
  return _stripe;
}

// Convenience re-export for direct use in routes
export { getStripe as stripe };

export const PLANS = {
  FREE: { name: "Free", price: 0, priceId: null },
  PRO_MONTHLY: {
    name: "Pro Lunar",
    price: 19,
    priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
  },
  PRO_ANNUAL: {
    name: "Pro Anual",
    price: 144,
    priceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? "",
  },
} as const;
