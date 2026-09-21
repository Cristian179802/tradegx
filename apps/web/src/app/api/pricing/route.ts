import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { AI_QUOTA } from "@/lib/plan";
import {
  CURRENCY,
  CURRENCY_SYMBOL,
  PRICE_MONTHLY,
  PRICE_ANNUAL,
  PRICE_ANNUAL_PER_MONTH,
  PREMIUM_PRICE_MONTHLY,
  PREMIUM_PRICE_ANNUAL,
  PREMIUM_PRICE_ANNUAL_PER_MONTH,
  ANNUAL_SAVINGS_PCT,
} from "@/lib/pricing";

// ── Planurile, ca date ───────────────────────────────────────────────────────
//
// Pagina de prețuri e o componentă de client cu textele în dicționarul de
// traduceri. Aplicația nu poate ajunge la ele, iar a le COPIA în aplicație ar
// fi fost cea mai scumpă greșeală posibilă: un tabel de preț care promite
// altceva decât livrează codul. S-a întâmplat deja de două ori cu sumele
// scrise de mână în cinci locuri — de aceea există `lib/pricing.ts`.
//
// Așa, prețurile vin din aceeași constantă ca Stripe, iar rândurile din tabel
// din același dicționar ca pagina web. O corectură ajunge în ambele locuri.
//
// COTELE AI SE CITESC DIN COD (`AI_QUOTA`), nu se scriu aici. Sunt singura
// diferență reală dintre PRO și Premium, deci sunt și singurul rând pe care
// n-avem voie să-l lăsăm în urmă.
//
// Ruta NU cere autentificare, deliberat: cineva care tocmai a instalat
// aplicația și n-are încă un cont trebuie să poată citi ce cumpără. De aceea
// intră și în `publicPrefixes` din middleware.

export const dynamic = "force-dynamic";

/** Rândurile tabelului. Aceeași listă ca pagina web, în aceeași ordine. */
const FUNCTII: { cheie: string; free: boolean | string; pro: boolean | string; premium: boolean | string }[] = [
  { cheie: "pf1", free: true, pro: true, premium: true },
  { cheie: "pf2", free: true, pro: true, premium: true },
  { cheie: "pf3", free: true, pro: true, premium: true },
  { cheie: "pf4", free: true, pro: true, premium: true },
  { cheie: "pf5", free: true, pro: true, premium: true },
  { cheie: "pf6", free: true, pro: true, premium: true },
  { cheie: "pf7", free: "1", pro: "valUnlimitedF", premium: "valUnlimitedF" },
  { cheie: "pf8", free: "val3PerMonth", pro: "valUnlimited", premium: "valUnlimited" },
  { cheie: "pf9", free: false, pro: true, premium: true },
  { cheie: "pf10", free: false, pro: true, premium: true },
  { cheie: "pf11", free: false, pro: true, premium: true },
  { cheie: "pf12", free: false, pro: true, premium: true },
  { cheie: "pf13", free: false, pro: true, premium: true },
  { cheie: "pf14", free: false, pro: true, premium: true },
  { cheie: "pf15", free: false, pro: true, premium: true },
  { cheie: "pf16", free: false, pro: true, premium: true },
  { cheie: "pf17", free: false, pro: true, premium: true },
  { cheie: "pf18", free: false, pro: true, premium: true },
  { cheie: "pf19", free: false, pro: true, premium: true },
  { cheie: "pf20", free: false, pro: true, premium: true },
  { cheie: "pf21", free: false, pro: true, premium: true },
  { cheie: "pf22", free: true, pro: true, premium: true },
  { cheie: "pf23", free: false, pro: true, premium: true },
  { cheie: "pf24", free: true, pro: true, premium: true },
];

const COTE = [
  { cheie: "pfChat", camp: "chat" },
  { cheie: "pfChart", camp: "chartAnalyze" },
  { cheie: "pfTrade", camp: "tradeAnalyze" },
] as const;

const INTREBARI = ["fq1", "fq2", "fq3", "fq4", "fq5", "fq6"];

export async function GET(req: Request) {
  const limba = new URL(req.url).searchParams.get("lang") === "en" ? "en" : "ro";
  const t = await getTranslations({ locale: limba, namespace: "pricing" });

  const perLuna = t("valPerMonth");

  return NextResponse.json({
    moneda: CURRENCY,
    simbol: CURRENCY_SYMBOL,
    economiePct: ANNUAL_SAVINGS_PCT,

    titlu: t("title"),
    subtitlu: t("subtitle"),
    etichetaLunar: t("monthly"),
    etichetaAnual: t("annual"),
    etichetaEconomie: t("saveBadge"),

    planuri: [
      {
        id: "free",
        nume: t("freeName"),
        descriere: t("freeDesc"),
        lunar: 0,
        anual: 0,
        anualPeLuna: 0,
        nota: t("forever"),
        buton: t("startFree"),
        puncte: ["frf1", "frf2", "frf3", "frf4", "frf5", "frf6", "frf7", "frf8"].map((k) => t(k)),
      },
      {
        id: "pro",
        nume: t("proName"),
        descriere: t("proDesc"),
        lunar: PRICE_MONTHLY,
        anual: PRICE_ANNUAL,
        anualPeLuna: PRICE_ANNUAL_PER_MONTH,
        nota: t("billedAnnual"),
        buton: t("upgradeBtn"),
        popular: true,
        puncte: ["prf1", "prf2", "prf3", "prf4", "prf5", "prf6", "prf7", "prf8"].map((k) => t(k)),
      },
      {
        id: "premium",
        nume: t("premiumName"),
        descriere: t("premiumDesc"),
        lunar: PREMIUM_PRICE_MONTHLY,
        anual: PREMIUM_PRICE_ANNUAL,
        anualPeLuna: PREMIUM_PRICE_ANNUAL_PER_MONTH,
        nota: t("billedAnnual"),
        buton: t("premiumBtn"),
        eticheta: t("premiumTag"),
        puncte: ["pmf1", "pmf2", "pmf3", "pmf4", "pmf5"].map((k) => t(k)),
      },
    ],

    comparatie: {
      titlu: t("compTitle"),
      capete: [t("colFeature"), t("colFree"), t("colPro"), t("colPremium")],
      randuri: [
        ...FUNCTII.map((f) => ({
          nume: t(f.cheie),
          free: valoare(f.free, t),
          pro: valoare(f.pro, t),
          premium: valoare(f.premium, t),
        })),
        // Cotele AI, citite din cod.
        ...COTE.map((c) => ({
          nume: t(c.cheie),
          free: AI_QUOTA.FREE[c.camp] === 0 ? false : `${AI_QUOTA.FREE[c.camp]}${perLuna}`,
          pro: `${AI_QUOTA.PRO[c.camp]}${perLuna}`,
          premium: `${AI_QUOTA.PREMIUM[c.camp]}${perLuna}`,
        })),
      ],
    },

    intrebari: {
      titlu: t("faqTitle"),
      lista: INTREBARI.map((q) => ({ intrebare: t(`${q}Q`), raspuns: t(`${q}A`) })),
    },
  });
}

/** `true`/`false` rămân booleeni (bifă / linie); un string e o cheie de tradus. */
function valoare(v: boolean | string, t: (k: string) => string): boolean | string {
  if (typeof v === "boolean") return v;
  // „1" e o cifră, nu o cheie de dicționar.
  return /^\d+$/.test(v) ? v : t(v);
}
