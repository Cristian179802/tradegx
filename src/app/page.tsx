import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  BarChart3,
  Brain,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  CheckCircle2,
  Star,
  BookOpen,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "TradeGX — Jurnal de Trading Profesional",
};

const FEATURES = [
  {
    icon: BarChart3,
    title: "Analiză Instituțională",
    description:
      "Win rate, profit factor, expectancy, Sharpe ratio și 40+ metrici calculate automat din tranzacțiile tale.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
  },
  {
    icon: Brain,
    title: "AI Trading Coach",
    description:
      "Monitorizare comportamentală în timp real. Detectează supratranzacționarea, tranzacțiile din răzbunare și FOMO înainte să îți afecteze contul.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: BookOpen,
    title: "Jurnal SMC / ICT",
    description:
      "Etichetează fiecare setup cu tip (OB, FVG, BOS, CHoCH), killzone, sesiune și timeframe. Descoperă ce funcționează cu adevărat.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Globe,
    title: "Sincronizare Broker",
    description:
      "Import automat din MetaTrader 5 via MetaAPI. Import CSV din MT4, MT5, cTrader. Fără introducere manuală.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Shield,
    title: "Reguli Prop Firm",
    description:
      "Configurează pierderea zilnică maximă și drawdown-ul. Primești alerte înainte să spargi regulile FTMO sau GoatFunded.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
  {
    icon: Calculator,
    title: "Calculator Lot Universal",
    description:
      "Calculează dimensiunea poziției pentru Forex, Metale, Indici, Crypto, CFD-uri. Preseturi pentru conturile tale Goat Funded și Funded Next.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Conectează brokerul",
    description:
      "Leagă contul MT5 via MetaAPI pentru sincronizare automată, sau importă tranzacțiile manual via CSV.",
  },
  {
    step: "02",
    title: "Jurnalizează fiecare trade",
    description:
      "Etichetează setup-urile SMC/ICT, adaugă emoțiile și screenshot-urile. AI Coach analizează comportamentul în timp real.",
  },
  {
    step: "03",
    title: "Identifică-ți edge-ul",
    description:
      "Analytics-ul îți arată exact ce setup-uri, sesiuni și timeframe-uri îți aduc profit consistent.",
  },
];

const TESTIMONIALS = [
  {
    name: "Marcus R.",
    handle: "@marcus_fx",
    avatar: "MR",
    text: "În sfârșit un jurnal care vorbește SMC. Etichetarea OB și FVG îmi economisește 20 de minute per sesiune.",
    stars: 5,
  },
  {
    name: "Elena V.",
    handle: "@elena_trades",
    avatar: "EV",
    text: "AI Coach a detectat pattern-ul meu de tranzacții din răzbunare după 3 pierderi consecutive. Mi-a salvat contul FTMO.",
    stars: 5,
  },
  {
    name: "Andrei M.",
    handle: "@andreifx",
    avatar: "AM",
    text: "Cel mai bun dashboard de analiză pe care l-am folosit. Profit factor per sesiune mi-a schimbat cum îmi structurez ziua.",
    stars: 5,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 relative flex items-center justify-center shrink-0">
              <Image src="/logo.jpg" alt="TradeGX" width={28} height={28} className="object-contain" style={{ mixBlendMode: "screen" }} />
            </div>
            <span className="font-bold text-white tracking-tight">
              Trade<span className="text-emerald-400">GX</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            <Link href="#features" className="hover:text-white transition-colors">
              Funcționalități
            </Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">
              Cum funcționează
            </Link>
            <Link href="/pricing" className="hover:text-white transition-colors">
              Prețuri
            </Link>
          </div>
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
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25"
              >
                Încearcă gratuit
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-28 px-6 overflow-hidden">
        {/* Grid bg */}
        <div className="absolute inset-0 hero-grid-bg opacity-50 pointer-events-none" />
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-indigo-500/6 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/15 cursor-default">
            <Zap className="w-3 h-3 mr-1.5" />
            14 zile PRO gratuit — fără card de credit
          </Badge>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            Tranzacționează ca o{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              instituție
            </span>
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Jurnalul de trading profesional construit pentru traderii SMC și ICT. Urmărește fiecare
            setup, jurnalizează psihologia și lasă AI-ul să identifice pattern-urile care îți costă
            bani.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold px-8 h-12 shadow-xl shadow-indigo-500/30 text-base"
              >
                Începe gratuit — 14 zile PRO
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-white h-12 px-8 text-base"
              >
                Vezi prețurile
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-10 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Fără card de credit
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Sincronizare MT5 inclusă
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              AI Coach inclus în probă
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Anulare oricând
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tot ce are nevoie un trader serios
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              Construit de la zero pentru traderii retail moderni care folosesc SMC, ICT și concepte
              instituționale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 hover:bg-zinc-900 transition-all"
                >
                  <div
                    className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center mb-4`}
                  >
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-zinc-100 mb-2">{f.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 border-y border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Gata de utilizat în câteva minute
            </h2>
            <p className="text-zinc-400 text-lg">
              Trei pași pentru a începe să tranzacționezi cu claritate bazată pe date.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[calc(100%+1rem)] w-8 h-px bg-zinc-700" />
                )}
                <div className="text-5xl font-black text-zinc-800 mb-4 font-mono num">
                  {s.step}
                </div>
                <h3 className="font-bold text-zinc-100 mb-2 text-lg">{s.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              De încredere pentru traderi din toată lumea
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-zinc-200 text-sm font-medium">{t.name}</p>
                    <p className="text-zinc-500 text-xs">{t.handle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Gata să tranzacționezi cu un edge?
            </h2>
            <p className="text-zinc-400 mb-8">
              Alătură-te miilor de traderi care folosesc TradeGX pentru a jurnaliza mai inteligent
              și a se îmbunătăți mai rapid.
            </p>
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold px-10 h-12 shadow-xl shadow-indigo-500/30"
              >
                Începe perioada de probă gratuită
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <p className="text-zinc-500 text-sm mt-4">14 zile PRO gratuit · Anulare oricând</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 relative flex items-center justify-center shrink-0">
              <Image src="/logo.jpg" alt="TradeGX" width={24} height={24} className="object-contain" style={{ mixBlendMode: "screen" }} />
            </div>
            <span className="font-bold text-zinc-400 text-sm">
              Trade<span className="text-emerald-400">GX</span>
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/pricing" className="hover:text-zinc-300 transition-colors">
              Prețuri
            </Link>
            <Link href="/login" className="hover:text-zinc-300 transition-colors">
              Autentificare
            </Link>
            <Link href="/register" className="hover:text-zinc-300 transition-colors">
              Înregistrare
            </Link>
          </div>
          <p className="text-zinc-600 text-xs">
            &copy; {new Date().getFullYear()} TradeGX. Toate drepturile rezervate.
          </p>
        </div>
      </footer>
    </div>
  );
}
