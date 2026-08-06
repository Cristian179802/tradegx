// ── Prețurile planurilor — SINGURA sursă de adevăr ───────────────────────────
//
// De ce există fișierul ăsta: aceleași sume erau scrise de mână în cinci locuri
// independente (lib/stripe.ts, /api/stripe/plans, /billing, /pricing, landing).
// La fiecare schimbare de preț rămâneau în urmă unele dintre ele, iar userul
// vedea un preț pe pagina de prețuri și altul la abonare — fix în momentul în
// care trebuia să aibă încredere. S-a întâmplat de două ori la rând.
//
// Modulul e PUR, fără niciun import: poate fi folosit și pe server, și în
// componente client, fără să tragă după el SDK-ul Stripe în bundle-ul de browser.
//
// Sumele trebuie să corespundă prețurilor din Stripe. ID-urile lor stau în
// variabilele de mediu STRIPE_PRO_MONTHLY_PRICE_ID / STRIPE_PRO_ANNUAL_PRICE_ID —
// aici ținem doar cifrele afișate.

export const CURRENCY = "EUR" as const;
export const CURRENCY_SYMBOL = "€" as const;

/** Prețul lunar, plată lună de lună. */
export const PRICE_MONTHLY = 10;

/** Prețul anual, o singură plată. */
export const PRICE_ANNUAL = 100;

/** Echivalentul lunar al planului anual. Calculat, nu scris de mână. */
export const PRICE_ANNUAL_PER_MONTH = PRICE_ANNUAL / 12; // 8,333…

/** Cât economisești pe an alegând anual, în valută. */
export const ANNUAL_SAVINGS = PRICE_MONTHLY * 12 - PRICE_ANNUAL; // 20

/** Reducerea planului anual, în procente întregi. */
export const ANNUAL_SAVINGS_PCT = Math.round(
  (1 - PRICE_ANNUAL_PER_MONTH / PRICE_MONTHLY) * 100
); // 17

/** Formatare consecventă: „€10" sau „€8,33" (virgulă zecimală, ca în RO). */
export function fmtPrice(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(".", ",");
  return `${CURRENCY_SYMBOL}${text}`;
}
