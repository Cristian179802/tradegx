"use client";

import * as React from "react";
import {
  BadgeCheck,
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations, useLocale } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";

// ── Abonament & Facturare ───────────────────────────────────────────────────
// Pagina care explică omului EXACT ce cumpără: planul curent, comparația
// Standard vs PRO, prețuri clare, checkout și portal Stripe.

interface PlansResponse {
  stripeConfigured: boolean;
  subscription: {
    plan: "FREE" | "PRO";
    status: "ACTIVE" | "PAST_DUE" | "CANCELLED" | "TRIALING";
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    trialEnd: string | null;
    stripeCustomerId: string | null;
  } | null;
  prices: {
    monthly: { amount: number };
    annual: { amount: number; perMonth: number };
  };
}

// Matricea de funcții — identică cu gate-urile din server (lib/plan.ts).
// label + valorile string sunt CHEI în messages → billing.*
const FEATURES: { label: string; free: string | boolean; pro: string | boolean }[] = [
  { label: "f1", free: true, pro: true },
  { label: "f2", free: true, pro: true },
  { label: "f3", free: true, pro: true },
  { label: "f4", free: "vOneAccount", pro: "vUnlimitedF" },
  { label: "f5", free: "v3PerMonth", pro: "vUnlimited" },
  { label: "f6", free: false, pro: true },
  { label: "f7", free: false, pro: true },
  { label: "f8", free: false, pro: true },
  { label: "f9", free: false, pro: true },
  { label: "f10", free: false, pro: true },
  { label: "f11", free: false, pro: true },
  { label: "f12", free: false, pro: true },
  { label: "f13", free: false, pro: true },
];

function fmtDate(iso: string | null, locale: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "ro-RO", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function FeatureCell({ v, tr }: { v: string | boolean; tr: (k: string) => string }) {
  if (v === true) return <Check className="w-4 h-4 text-emerald-400 mx-auto" />;
  if (v === false) return <X className="w-4 h-4 text-zinc-700 mx-auto" />;
  return <span className="text-xs font-bold text-zinc-300">{tr(v)}</span>;
}

export default function BillingPage() {
  const t = useTranslations("billing");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { toast } = useToast();
  const [data, setData] = React.useState<PlansResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [period, setPeriod] = React.useState<"monthly" | "annual">("annual");
  const [working, setWorking] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/stripe/plans", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  async function goCheckout() {
    setWorking("checkout");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      toast({ title: tc("error"), description: json.error ?? tc("retry"), variant: "destructive" });
    } finally {
      setWorking(null);
    }
  }

  async function goPortal() {
    setWorking("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      toast({ title: tc("error"), description: json.error ?? tc("retry"), variant: "destructive" });
    } finally {
      setWorking(null);
    }
  }

  const sub = data?.subscription;
  const isPaidPro = sub?.plan === "PRO" && (sub.status === "ACTIVE" || sub.status === "PAST_DUE");
  const isTrial = !isPaidPro && sub?.status === "TRIALING" && !!sub.trialEnd && new Date(sub.trialEnd) > new Date();
  const trialDaysLeft = isTrial && sub?.trialEnd
    ? Math.max(1, Math.ceil((new Date(sub.trialEnd).getTime() - Date.now()) / 86_400_000))
    : 0;

  const monthly = data?.prices.monthly.amount ?? 19;
  const annual = data?.prices.annual.amount ?? 144;
  const annualPerMonth = data?.prices.annual.perMonth ?? 12;
  const savingsPct = Math.round((1 - annualPerMonth / monthly) * 100);

  return (
    <div className="space-y-6 pb-10 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">{t("title")}</h1>
        </div>
        <p className="text-sm text-zinc-500">
          {t("subtitle")}
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl bg-zinc-800/60" />
          <Skeleton className="h-96 w-full rounded-2xl bg-zinc-800/60" />
        </div>
      ) : (
        <>
          {/* ── Planul curent ── */}
          <div
            className={cn(
              "rounded-2xl border p-5 flex flex-wrap items-center justify-between gap-4",
              isPaidPro
                ? "border-emerald-500/30 bg-emerald-500/[0.05]"
                : isTrial
                  ? "border-indigo-500/30 bg-indigo-500/[0.05]"
                  : "border-zinc-800/70 bg-zinc-900/80"
            )}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={cn(
                  "w-11 h-11 rounded-xl border flex items-center justify-center shrink-0",
                  isPaidPro
                    ? "bg-emerald-500/15 border-emerald-500/30"
                    : isTrial
                      ? "bg-indigo-500/15 border-indigo-500/30"
                      : "bg-zinc-800/80 border-zinc-700"
                )}
              >
                {isPaidPro ? (
                  <BadgeCheck className="w-5 h-5 text-emerald-400" />
                ) : isTrial ? (
                  <Zap className="w-5 h-5 text-indigo-400" />
                ) : (
                  <Sparkles className="w-5 h-5 text-zinc-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-black text-zinc-100">
                  {isPaidPro ? t("planPro") : isTrial ? t("planTrial") : t("planFree")}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {isPaidPro && sub?.cancelAtPeriodEnd
                    ? t("statusEnding", { date: fmtDate(sub.currentPeriodEnd, locale) })
                    : isPaidPro
                      ? t("statusActive", { date: fmtDate(sub?.currentPeriodEnd ?? null, locale) })
                      : isTrial
                        ? t("statusTrial", { days: trialDaysLeft, date: fmtDate(sub?.trialEnd ?? null, locale) })
                        : t("statusFree")}
                </p>
              </div>
            </div>

            {isPaidPro ? (
              <button
                onClick={goPortal}
                disabled={working !== null}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-zinc-200 hover:border-zinc-600 transition-colors disabled:opacity-60"
              >
                {working === "portal" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                {t("portalBtn")}
              </button>
            ) : (
              <button
                onClick={goCheckout}
                disabled={working !== null || !data?.stripeConfigured}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-60"
              >
                {working === "checkout" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {isTrial ? t("keepPro") : t("activatePro")}
              </button>
            )}
          </div>

          {/* ── Alegerea perioadei ── */}
          {!isPaidPro && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPeriod("monthly")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold border transition-colors",
                  period === "monthly"
                    ? "border-indigo-500/60 bg-indigo-500/15 text-indigo-300"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:text-zinc-300"
                )}
              >
                {t("monthlyBtn", { price: monthly })}
              </button>
              <button
                onClick={() => setPeriod("annual")}
                className={cn(
                  "relative px-4 py-2 rounded-xl text-xs font-bold border transition-colors",
                  period === "annual"
                    ? "border-indigo-500/60 bg-indigo-500/15 text-indigo-300"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:text-zinc-300"
                )}
              >
                {t("annualBtn", { price: annualPerMonth })}
                <span className="absolute -top-2 -right-2 text-[9px] font-black bg-emerald-500 text-zinc-950 rounded-full px-1.5 py-0.5">
                  -{savingsPct}%
                </span>
              </button>
            </div>
          )}

          {/* ── Comparația planurilor ── */}
          <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/80 overflow-hidden">
            <div className="grid grid-cols-[1fr_5rem_5rem] sm:grid-cols-[1fr_7rem_7rem]">
              {/* Header */}
              <div className="px-4 sm:px-5 py-4 border-b border-zinc-800" />
              <div className="py-4 border-b border-zinc-800 text-center">
                <p className="text-xs font-black text-zinc-400">{t("colStandard")}</p>
                <p className="text-[10px] text-zinc-600 font-bold mt-0.5">{t("colFree")}</p>
              </div>
              <div className="py-4 border-b border-indigo-500/30 text-center bg-indigo-500/[0.06] relative">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/70 to-transparent" />
                <p className="text-xs font-black text-indigo-300">PRO</p>
                <p className="text-[10px] text-indigo-400/80 font-bold mt-0.5">
                  {t("perMonth", { price: period === "annual" ? annualPerMonth : monthly })}
                </p>
              </div>

              {/* Rânduri */}
              {FEATURES.map((f, i) => (
                <React.Fragment key={f.label}>
                  <div
                    className={cn(
                      "px-4 sm:px-5 py-3 text-xs text-zinc-400 font-medium",
                      i % 2 === 0 && "bg-zinc-950/30"
                    )}
                  >
                    {t(f.label)}
                  </div>
                  <div className={cn("py-3 flex items-center justify-center", i % 2 === 0 && "bg-zinc-950/30")}>
                    <FeatureCell v={f.free} tr={t} />
                  </div>
                  <div className={cn("py-3 flex items-center justify-center bg-indigo-500/[0.06]")}>
                    <FeatureCell v={f.pro} tr={t} />
                  </div>
                </React.Fragment>
              ))}

              {/* Footer CTA */}
              <div className="px-4 sm:px-5 py-4 border-t border-zinc-800" />
              <div className="py-4 border-t border-zinc-800" />
              <div className="py-4 border-t border-indigo-500/30 bg-indigo-500/[0.06] flex justify-center">
                {!isPaidPro && (
                  <button
                    onClick={goCheckout}
                    disabled={working !== null || !data?.stripeConfigured}
                    className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-[11px] font-bold text-white hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-60"
                  >
                    {t("choosePro")}
                  </button>
                )}
                {isPaidPro && <BadgeCheck className="w-5 h-5 text-emerald-400" />}
              </div>
            </div>
          </div>

          {/* ── Întrebări frecvente ── */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-800/70 bg-zinc-900/80 p-4">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mb-2" />
              <p className="text-xs font-bold text-zinc-200 mb-1">{t("faq1Title")}</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                {t("faq1Body")}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800/70 bg-zinc-900/80 p-4">
              <X className="w-4 h-4 text-zinc-500 mb-2" />
              <p className="text-xs font-bold text-zinc-200 mb-1">{t("faq2Title")}</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                {t("faq2Body")}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800/70 bg-zinc-900/80 p-4">
              <Lock className="w-4 h-4 text-indigo-400 mb-2" />
              <p className="text-xs font-bold text-zinc-200 mb-1">{t("faq3Title")}</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                {t("faq3Body")}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
