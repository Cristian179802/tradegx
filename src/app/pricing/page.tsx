"use client";

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

const FEATURES = [
  { label: "Tranzacții pe lună", free: "50", pro: "Nelimitat" },
  { label: "Conturi de trading", free: "1", pro: "Nelimitat" },
  { label: "Dashboard analiză", free: true, pro: true },
  { label: "Etichetare SMC/ICT setup", free: true, pro: true },
  { label: "Screenshot-uri per trade", free: "3", pro: "Nelimitat" },
  { label: "Jurnal de tranzacții", free: true, pro: true },
  { label: "Import CSV (MT4/MT5/cTrader)", free: true, pro: true },
  { label: "Calendar economic", free: true, pro: true },
  { label: "Calculator lot universal", free: true, pro: true },
  { label: "AI Trading Coach", free: false, pro: true },
  { label: "Analiză AI per tranzacție", free: false, pro: true },
  { label: "Sincronizare broker MT5", free: false, pro: true },
  { label: "Alerte reguli prop firm", free: false, pro: true },
  { label: "Acces comunitate", free: true, pro: true },
  { label: "Echipe și coaching", free: false, pro: true },
  { label: "Backtesting strategie", free: false, pro: true },
  { label: "Export PDF rapoarte prop firm", free: false, pro: true },
  { label: "Suport prioritar", free: false, pro: true },
  { label: "Acces API", free: false, pro: true },
];

const FAQ = [
  {
    q: "Ce se întâmplă după cele 14 zile de probă?",
    a: "După perioada de probă, vei fi mutat automat pe planul GRATUIT dacă nu faci upgrade. Nicio taxă fără acordul tău.",
  },
  {
    q: "Pot anula oricând?",
    a: "Da. Poți anula abonamentul PRO oricând. Păstrezi accesul PRO până la sfârșitul perioadei de facturare.",
  },
  {
    q: "Susțineți regulile prop firm?",
    a: "Da. Poți configura pierderea zilnică maximă, drawdown maxim și ore fără tranzacții per cont. TradeGX te alertează înainte să spargi o regulă.",
  },
  {
    q: "Ce brokeri sunt suportați pentru sincronizarea MT5?",
    a: "Orice broker MT5 suportat de MetaAPI — inclusiv FTMO, MyForexFunds, GoatFunded, IC Markets, Pepperstone și sute de alții.",
  },
  {
    q: "Există un plan gratuit permanent?",
    a: "Da. Planul GRATUIT permite până la 50 de tranzacții/lună cu un cont și analiză completă. Fără limită de timp.",
  },
];

export default function PricingPage() {
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
                Autentificare
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
              >
                Perioadă de probă gratuită
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Prețuri simple și transparente
          </h1>
          <p className="text-zinc-400 text-lg mb-8">
            Începe gratuit. Fă upgrade când ești pregătit. Anulare oricând.
          </p>

          <div className="flex items-center justify-center gap-3">
            <span className={cn("text-sm", !annual ? "text-white font-medium" : "text-zinc-500")}>
              Lunar
            </span>
            <Switch
              checked={annual}
              onCheckedChange={setAnnual}
              className="data-[state=checked]:bg-indigo-600"
            />
            <span className={cn("text-sm", annual ? "text-white font-medium" : "text-zinc-500")}>
              Anual
            </span>
            {annual && (
              <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                Economisești {savings}%
              </Badge>
            )}
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20 max-w-2xl mx-auto">
          {/* Free */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-zinc-100 mb-1">Gratuit</h3>
              <p className="text-zinc-500 text-sm">Pentru traderii la început de drum</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-black text-white">$0</span>
              <span className="text-zinc-500 text-sm ml-2">permanent</span>
            </div>
            <Link href="/register">
              <Button
                variant="outline"
                className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white mb-6"
              >
                Începe gratuit
              </Button>
            </Link>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                50 tranzacții/lună
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />1 cont de trading
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                Analiză completă
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                Etichetare SMC/ICT
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                Calculator lot
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-zinc-700 shrink-0" />
                AI Trading Coach
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-zinc-700 shrink-0" />
                Sincronizare MT5
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-zinc-700 shrink-0" />
                Alerte prop firm
              </li>
            </ul>
          </div>

          {/* PRO */}
          <div className="relative bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-purple-500/5 border border-indigo-500/30 rounded-2xl p-8">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 px-4 py-1 shadow-lg shadow-indigo-500/30">
                Cel mai popular
              </Badge>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-zinc-100 mb-1">PRO</h3>
              <p className="text-zinc-400 text-sm">
                Pentru traderii serioși și prop firm
              </p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-black text-white num">${displayPrice}</span>
              <span className="text-zinc-500 text-sm ml-2">/ lună</span>
              {annual && (
                <p className="text-xs text-zinc-500 mt-1">
                  Facturat anual (${annualMonthly * 12}/an)
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
                : <>{session ? "Fă upgrade la PRO" : "Probă gratuită 14 zile"}<ArrowRight className="ml-2 w-4 h-4" /></>
              }
            </Button>
            <ul className="space-y-3 text-sm text-zinc-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                Tranzacții nelimitate
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                Conturi nelimitate
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                AI Trading Coach
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                Sincronizare broker MT5
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                Alerte reguli prop firm
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                Backtesting strategie
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                Export PDF rapoarte
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                Suport prioritar
              </li>
            </ul>
          </div>
        </div>

        {/* Feature comparison */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-center mb-8">
            Comparație completă funcționalități
          </h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 text-sm font-semibold text-zinc-400 border-b border-zinc-800 px-6 py-3">
              <span>Funcționalitate</span>
              <span className="text-center">Gratuit</span>
              <span className="text-center text-indigo-400">PRO</span>
            </div>
            {FEATURES.map((f, i) => (
              <div
                key={f.label}
                className={cn(
                  "grid grid-cols-3 items-center px-6 py-3.5 text-sm",
                  i % 2 === 0 ? "bg-zinc-900/30" : ""
                )}
              >
                <span className="text-zinc-300">{f.label}</span>
                <span className="text-center">
                  {typeof f.free === "boolean" ? (
                    f.free ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-zinc-700 mx-auto" />
                    )
                  ) : (
                    <span className="text-zinc-400">{f.free}</span>
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
                    <span className="text-indigo-300 font-medium">{f.pro}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Întrebări frecvente</h2>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
              >
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-zinc-100 mb-2">{item.q}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{item.a}</p>
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
