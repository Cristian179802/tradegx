"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  ArrowRight,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// label/free/pro = chei → pricing.* (traduse la randare; valorile bool raman)
const FEATURES = [
  { label: "pf1", free: true, pro: true },
  { label: "pf2", free: true, pro: true },
  { label: "pf3", free: true, pro: true },
  { label: "pf4", free: true, pro: true },
  { label: "pf5", free: true, pro: true },
  { label: "pf6", free: true, pro: true },
  { label: "pf7", free: "1", pro: "valUnlimitedF" },
  { label: "pf8", free: "val3PerMonth", pro: "valUnlimited" },
  { label: "pf9", free: false, pro: true },
  { label: "pf10", free: false, pro: true },
  { label: "pf11", free: false, pro: true },
  { label: "pf12", free: false, pro: true },
  { label: "pf13", free: false, pro: true },
  { label: "pf14", free: false, pro: true },
  { label: "pf15", free: false, pro: true },
  { label: "pf16", free: false, pro: true },
  { label: "pf17", free: false, pro: true },
  { label: "pf18", free: false, pro: true },
];

const FAQ = [
  { q: "fq1Q", a: "fq1A" },
  { q: "fq2Q", a: "fq2A" },
  { q: "fq3Q", a: "fq3A" },
  { q: "fq4Q", a: "fq4A" },
  { q: "fq5Q", a: "fq5A" },
  { q: "fq6Q", a: "fq6A" },
];

export default function PricingPage() {
  const t = useTranslations("pricing");
  const [annual, setAnnual] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  async function handleGetPro() {
    if (!session) {
      router.push("/register");
      return;
    }
    setLoadingCheckout(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: annual ? "annual" : "monthly" }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        // Stripe not configured yet — redirect to register/dashboard
        router.push(session ? "/settings?tab=billing" : "/register");
      }
    } catch {
      router.push("/register");
    } finally {
      setLoadingCheckout(false);
    }
  }

  const monthlyPrice = 19;
  const annualMonthly = 12;
  const displayPrice = annual ? annualMonthly : monthlyPrice;
  const savings = Math.round(((monthlyPrice - annualMonthly) / monthlyPrice) * 100);

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Navbar */}
      <nav className="border-b border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold tracking-tight">
              Trade<span className="text-emerald-400">GX</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                {t("navLogin")}
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
              >
                {t("navTrial")}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            {t("title")}
          </h1>
          <p className="text-zinc-400 text-lg mb-8">
            {t("subtitle")}
          </p>

          <div className="flex items-center justify-center gap-3">
            <span className={cn("text-sm", !annual ? "text-white font-medium" : "text-zinc-500")}>
              {t("monthly")}
            </span>
            <Switch
              checked={annual}
              onCheckedChange={setAnnual}
              className="data-[state=checked]:bg-indigo-600"
            />
            <span className={cn("text-sm", annual ? "text-white font-medium" : "text-zinc-500")}>
              {t("annual")}
            </span>
            {annual && (
              <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                {t("savings", { n: savings })}
              </Badge>
            )}
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20 max-w-2xl mx-auto">
          {/* Free */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-zinc-100 mb-1">{t("freeName")}</h3>
              <p className="text-zinc-500 text-sm">{t("freeDesc")}</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-black text-white">$0</span>
              <span className="text-zinc-500 text-sm ml-2">{t("forever")}</span>
            </div>
            <Link href="/register">
              <Button
                variant="outline"
                className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white mb-6"
              >
                {t("startFree")}
              </Button>
            </Link>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {t("frf1")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />{t("frf2")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {t("frf3")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {t("frf4")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {t("frf5")}
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-zinc-700 shrink-0" />
                {t("frf6")}
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-zinc-700 shrink-0" />
                {t("frf7")}
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-zinc-700 shrink-0" />
                {t("frf8")}
              </li>
            </ul>
          </div>

          {/* PRO */}
          <div className="relative bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-purple-500/5 border border-indigo-500/30 rounded-2xl p-8">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 px-4 py-1 shadow-lg shadow-indigo-500/30">
                {t("mostPopular")}
              </Badge>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-zinc-100 mb-1">{t("proName")}</h3>
              <p className="text-zinc-400 text-sm">
                {t("proDesc")}
              </p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-black text-white num">${displayPrice}</span>
              <span className="text-zinc-500 text-sm ml-2">{t("perMonth")}</span>
              {annual && (
                <p className="text-xs text-zinc-500 mt-1">
                  {t("billedAnnual", { x: annualMonthly * 12 })}
                </p>
              )}
            </div>
            <Button
              onClick={handleGetPro}
              disabled={loadingCheckout}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-lg shadow-indigo-500/25 mb-6"
            >
              {loadingCheckout
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>{session ? t("upgradeBtn") : t("trialBtn")}<ArrowRight className="ml-2 w-4 h-4" /></>
              }
            </Button>
            <ul className="space-y-3 text-sm text-zinc-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {t("prf1")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {t("prf2")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {t("prf3")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {t("prf4")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {t("prf5")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {t("prf6")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {t("prf7")}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {t("prf8")}
              </li>
            </ul>
          </div>
        </div>

        {/* Feature comparison */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-center mb-8">
            {t("compTitle")}
          </h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 text-sm font-semibold text-zinc-400 border-b border-zinc-800 px-6 py-3">
              <span>{t("colFeature")}</span>
              <span className="text-center">{t("colFree")}</span>
              <span className="text-center text-indigo-400">{t("colPro")}</span>
            </div>
            {FEATURES.map((f, i) => (
              <div
                key={f.label}
                className={cn(
                  "grid grid-cols-3 items-center px-6 py-3.5 text-sm",
                  i % 2 === 0 ? "bg-zinc-900/30" : ""
                )}
              >
                <span className="text-zinc-300">{t(f.label)}</span>
                <span className="text-center">
                  {typeof f.free === "boolean" ? (
                    f.free ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-zinc-700 mx-auto" />
                    )
                  ) : (
                    <span className="text-zinc-400">{t.has(f.free) ? t(f.free) : f.free}</span>
                  )}
                </span>
                <span className="text-center">
                  {typeof f.pro === "boolean" ? (
                    f.pro ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-zinc-700 mx-auto" />
                    )
                  ) : (
                    <span className="text-indigo-300 font-medium">{t.has(f.pro) ? t(f.pro) : f.pro}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">{t("faqTitle")}</h2>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
              >
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-zinc-100 mb-2">{t(item.q)}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{t(item.a)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
