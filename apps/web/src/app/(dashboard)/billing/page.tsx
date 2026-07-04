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

// Matricea de funcții — identică cu gate-urile din server (lib/plan.ts)
const FEATURES: { label: string; free: string | boolean; pro: string | boolean }[] = [
  { label: "Jurnal de tranzacții + import CSV", free: true, pro: true },
  { label: "Academie completă (41 lecții + quiz-uri + certificat)", free: true, pro: true },
  { label: "Analytics, calculator lot, checklist, calendar, știri", free: true, pro: true },
  { label: "Conturi de trading", free: "1 cont", pro: "Nelimitate" },
  { label: "Backtesting pe date reale", free: "3 / lună", pro: "Nelimitat" },
  { label: "Sincronizare automată broker (EA MT4/MT5 + MetaAPI)", free: false, pro: true },
  { label: "Semnale AI (HPS) — max 3/zi + difuzare Telegram", free: false, pro: true },
  { label: "AI Assistant / Coach personal", free: false, pro: true },
  { label: "Edge Finder — unde câștigi și unde pierzi, statistic", free: false, pro: true },
  { label: "Simulator Monte Carlo (probabilitate challenge prop firm)", free: false, pro: true },
  { label: "Raport AI săptămânal (in-app + Telegram)", free: false, pro: true },
  { label: "Alerte de preț pe watchlist", free: false, pro: true },
  { label: "Webhook TradingView → alerte instant", free: false, pro: true },
];

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
}

function FeatureCell({ v }: { v: string | boolean }) {
  if (v === true) return <Check className="w-4 h-4 text-emerald-400 mx-auto" />;
  if (v === false) return <X className="w-4 h-4 text-zinc-700 mx-auto" />;
  return <span className="text-xs font-bold text-zinc-300">{v}</span>;
}

export default function BillingPage() {
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
      toast({ title: "Eroare", description: json.error ?? "Încearcă din nou.", variant: "destructive" });
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
      toast({ title: "Eroare", description: json.error ?? "Încearcă din nou.", variant: "destructive" });
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
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Abonament & Facturare</h1>
        </div>
        <p className="text-sm text-zinc-500">
          Planul tău, ce include fiecare pachet și gestionarea plăților — totul într-un singur loc.
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
                  {isPaidPro ? "TradeGx PRO" : isTrial ? "PRO Trial" : "Plan Standard (gratuit)"}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {isPaidPro && sub?.cancelAtPeriodEnd
                    ? `Se încheie pe ${fmtDate(sub.currentPeriodEnd)} — poți reactiva oricând din portal`
                    : isPaidPro
                      ? `Activ · se reînnoiește pe ${fmtDate(sub?.currentPeriodEnd ?? null)}`
                      : isTrial
                        ? `Acces PRO complet · mai ai ${trialDaysLeft} ${trialDaysLeft === 1 ? "zi" : "zile"} (până pe ${fmtDate(sub?.trialEnd ?? null)})`
                        : "Jurnal, academie și analytics de bază — gratuit pentru totdeauna"}
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
                Facturi & metodă de plată
              </button>
            ) : (
              <button
                onClick={goCheckout}
                disabled={working !== null || !data?.stripeConfigured}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-60"
              >
                {working === "checkout" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {isTrial ? "Păstrează PRO după trial" : "Activează PRO"}
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
                Lunar — {monthly}$/lună
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
                Anual — {annualPerMonth}$/lună
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
                <p className="text-xs font-black text-zinc-400">Standard</p>
                <p className="text-[10px] text-zinc-600 font-bold mt-0.5">Gratuit</p>
              </div>
              <div className="py-4 border-b border-indigo-500/30 text-center bg-indigo-500/[0.06] relative">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/70 to-transparent" />
                <p className="text-xs font-black text-indigo-300">PRO</p>
                <p className="text-[10px] text-indigo-400/80 font-bold mt-0.5">
                  {period === "annual" ? `${annualPerMonth}$/lună` : `${monthly}$/lună`}
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
                    {f.label}
                  </div>
                  <div className={cn("py-3 flex items-center justify-center", i % 2 === 0 && "bg-zinc-950/30")}>
                    <FeatureCell v={f.free} />
                  </div>
                  <div className={cn("py-3 flex items-center justify-center bg-indigo-500/[0.06]")}>
                    <FeatureCell v={f.pro} />
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
                    Alege PRO
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
              <p className="text-xs font-bold text-zinc-200 mb-1">Plăți securizate prin Stripe</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Nu stocăm niciodată datele cardului. Plata, facturile și metoda de plată se
                gestionează în portalul securizat Stripe.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800/70 bg-zinc-900/80 p-4">
              <X className="w-4 h-4 text-zinc-500 mb-2" />
              <p className="text-xs font-bold text-zinc-200 mb-1">Anulezi oricând</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Fără contracte, fără perioade minime. La anulare păstrezi PRO până la finalul
                perioadei plătite.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800/70 bg-zinc-900/80 p-4">
              <Lock className="w-4 h-4 text-indigo-400 mb-2" />
              <p className="text-xs font-bold text-zinc-200 mb-1">Datele tale rămân intacte</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                La trecerea pe Standard nu se șterge nimic: jurnalul, statisticile și progresul
                din Academie te așteaptă exact cum le-ai lăsat.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
