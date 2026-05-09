"use client";

import * as React from "react";
import { CreditCard, Zap, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface BillingTabProps {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isTrialing: boolean;
  trialEnd: string | null;
}

export function BillingTab({
  plan,
  status,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  isTrialing,
  trialEnd,
}: BillingTabProps) {
  const { toast } = useToast();
  const [loadingMonthly, setLoadingMonthly] = React.useState(false);
  const [loadingAnnual, setLoadingAnnual] = React.useState(false);
  const [loadingPortal, setLoadingPortal] = React.useState(false);

  const isPro = plan === "PRO";

  async function startCheckout(period: "monthly" | "annual") {
    const priceId =
      period === "monthly"
        ? process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID;

    if (!priceId) {
      toast({
        title: "Stripe neconfiguarat",
        description: "Adaugă NEXT_PUBLIC_STRIPE_PRO_*_PRICE_ID în .env",
        variant: "destructive",
      });
      return;
    }

    if (period === "monthly") setLoadingMonthly(true);
    else setLoadingAnnual(true);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Eroare Stripe", description: data.error, variant: "destructive" });
      }
    } finally {
      setLoadingMonthly(false);
      setLoadingAnnual(false);
    }
  }

  async function openPortal() {
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) window.location.href = data.url;
      else toast({ title: "Eroare", description: data.error, variant: "destructive" });
    } finally {
      setLoadingPortal(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-300">Abonamentul curent</h2>
          </div>
          <Badge
            className={cn(
              "text-xs border",
              isPro
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                : "bg-zinc-800 text-zinc-400 border-zinc-700"
            )}
          >
            {isPro ? "PRO" : "FREE"}
          </Badge>
        </div>

        <div className="space-y-2 text-sm text-zinc-400">
          {isTrialing && trialEnd && (
            <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2">
              <Zap className="h-4 w-4 text-indigo-400 shrink-0" />
              <p className="text-indigo-300 text-xs">
                Perioadă de probă PRO activă până pe{" "}
                <strong>{new Date(trialEnd).toLocaleDateString("ro-RO")}</strong>
              </p>
            </div>
          )}
          {isPro && currentPeriodEnd && (
            <p>
              {cancelAtPeriodEnd ? (
                <span className="text-amber-400">
                  Se anulează pe {new Date(currentPeriodEnd).toLocaleDateString("ro-RO")}
                </span>
              ) : (
                <span>
                  Reînnoire pe{" "}
                  <strong className="text-zinc-300">
                    {new Date(currentPeriodEnd).toLocaleDateString("ro-RO")}
                  </strong>
                </span>
              )}
            </p>
          )}
          {isPro && (
            <Button
              variant="outline"
              size="sm"
              className="border-zinc-700 text-zinc-400 hover:text-zinc-100 mt-2"
              onClick={openPortal}
              disabled={loadingPortal}
            >
              {loadingPortal ? (
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-3.5 w-3.5 mr-2" />
              )}
              Gestionează abonamentul
            </Button>
          )}
        </div>
      </div>

      {/* Upgrade options (only for FREE users) */}
      {!isPro && (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Monthly */}
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-5">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Lunar</p>
            <p className="text-3xl font-bold text-zinc-100 mb-1">
              $19 <span className="text-sm font-normal text-zinc-500">/lună</span>
            </p>
            <ul className="space-y-1.5 mb-4 mt-3">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              size="sm"
              onClick={() => startCheckout("monthly")}
              disabled={loadingMonthly}
            >
              {loadingMonthly && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Alege lunar
            </Button>
          </div>

          {/* Annual */}
          <div className="rounded-xl border border-indigo-500/40 bg-indigo-500/5 p-5 relative">
            <span className="absolute -top-2.5 left-4 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              37% REDUCERE
            </span>
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Anual</p>
            <p className="text-3xl font-bold text-zinc-100 mb-1">
              $12 <span className="text-sm font-normal text-zinc-500">/lună</span>
            </p>
            <p className="text-xs text-zinc-500 mb-3">$144/an, economisești $84</p>
            <ul className="space-y-1.5 mb-4">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              size="sm"
              onClick={() => startCheckout("annual")}
              disabled={loadingAnnual}
            >
              {loadingAnnual && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Alege anual
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

const PRO_FEATURES = [
  "Analiză avansată cu AI",
  "Conturi nelimitate",
  "Import broker automat (MetaAPI)",
  "Export date CSV/PDF",
  "Acces comunitate",
  "Suport prioritar",
];
