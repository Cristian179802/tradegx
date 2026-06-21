"use client";

import * as React from "react";
import {
  CreditCard, Zap, CheckCircle2, ExternalLink, Loader2, AlertCircle,
} from "lucide-react";
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
  const [stripeReady, setStripeReady] = React.useState<boolean | null>(null);

  const isPro = plan === "PRO";

  React.useEffect(() => {
    fetch("/api/stripe/plans")
      .then((r) => r.json())
      .then((d) => setStripeReady(d.stripeConfigured ?? false))
      .catch(() => setStripeReady(false));
  }, []);

  async function startCheckout(period: "monthly" | "annual") {
    if (period === "monthly") setLoadingMonthly(true);
    else setLoadingAnnual(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else if (data.code === "STRIPE_NOT_CONFIGURED") {
        toast({ title: "Plăți în curând", description: "Sistemul de plăți este în configurare.", variant: "destructive" });
      } else {
        toast({ title: "Eroare", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Eroare de rețea", description: "Încearcă din nou.", variant: "destructive" });
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
    <div className="space-y-6 max-w-2xl">
      {/* Current plan */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-200">Abonamentul curent</h2>
          </div>
          <Badge className={cn("text-xs border", isPro ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" : "bg-zinc-800 text-zinc-400 border-zinc-700")}>
            {isPro ? "PRO" : "FREE"}
          </Badge>
        </div>

        <div className="space-y-3 text-sm">
          {isTrialing && trialEnd && (
            <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2">
              <Zap className="h-4 w-4 text-indigo-400 shrink-0" />
              <p className="text-indigo-300 text-xs">
                Perioadă de probă PRO activă până pe <strong>{new Date(trialEnd).toLocaleDateString("ro-RO")}</strong>
              </p>
            </div>
          )}
          {isPro && currentPeriodEnd && (
            <p className="text-zinc-400 text-sm">
              {cancelAtPeriodEnd
                ? <span className="text-amber-400">Se anulează pe {new Date(currentPeriodEnd).toLocaleDateString("ro-RO")}</span>
                : <>Reînnoire pe <strong className="text-zinc-300">{new Date(currentPeriodEnd).toLocaleDateString("ro-RO")}</strong></>
              }
            </p>
          )}
          {isPro && (
            <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400 hover:text-zinc-100" onClick={openPortal} disabled={loadingPortal}>
              {loadingPortal ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5 mr-2" />}
              Gestionează abonamentul
            </Button>
          )}
        </div>
      </div>

      {/* Upgrade options */}
      {!isPro && (
        <>
          {stripeReady === false && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">Plățile sunt în curs de configurare. Revino în curând.</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Monthly */}
            <div className="rounded-2xl border border-zinc-700/80 bg-zinc-900/80 p-5">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Lunar</p>
              <p className="text-3xl font-black text-zinc-100 mb-4">$19 <span className="text-sm font-normal text-zinc-500">/lună</span></p>
              <ul className="space-y-1.5 mb-5">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-zinc-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20" size="sm" onClick={() => startCheckout("monthly")} disabled={loadingMonthly || stripeReady === false}>
                {loadingMonthly && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Alege lunar
              </Button>
            </div>

            {/* Annual */}
            <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-indigo-500/8 to-violet-500/5 p-5 relative">
              <span className="absolute -top-2.5 left-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-lg shadow-indigo-500/20">37% REDUCERE</span>
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Anual</p>
              <p className="text-3xl font-black text-zinc-100 mb-1">$12 <span className="text-sm font-normal text-zinc-500">/lună</span></p>
              <p className="text-xs text-zinc-500 mb-4">$144/an · economisești $84</p>
              <ul className="space-y-1.5 mb-5">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-zinc-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25" size="sm" onClick={() => startCheckout("annual")} disabled={loadingAnnual || stripeReady === false}>
                {loadingAnnual && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Alege anual
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const PRO_FEATURES = [
  "Tranzacții nelimitate",
  "Conturi nelimitate",
  "AI Trading Coach",
  "Alerte reguli prop firm",
  "Backtesting strategie",
  "Export PDF rapoarte",
  "Suport prioritar",
];
