import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp, BarChart3, Brain, Shield, Zap, Globe,
  ArrowRight, CheckCircle2, Star, BookOpen, Calculator,
  Activity, Target, Trophy, ChevronRight, Wifi,
  LineChart, Bell, Users, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "TradeGX — Jurnal de Trading Profesional",
  description: "Jurnalul de trading profesional pentru traderii SMC și ICT. AI Coach, analiză instituțională și sincronizare broker în timp real.",
};

const FEATURES = [
  {
    icon: BarChart3,
    title: "Analiză Instituțională",
    description: "Win rate, profit factor, expectancy, Sharpe ratio și 40+ metrici. Vizualizează curba equity în timp real și identifică pattern-urile ascunse.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20 hover:border-indigo-500/40",
    glow: "group-hover:shadow-indigo-500/10",
  },
  {
    icon: Brain,
    title: "AI Trading Coach",
    description: "Monitorizare psihologică în timp real. Detectează revenge trading, FOMO și supratranzacționarea înainte să distrugă contul tău.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20 hover:border-violet-500/40",
    glow: "group-hover:shadow-violet-500/10",
  },
  {
    icon: BookOpen,
    title: "Jurnal SMC / ICT",
    description: "Etichetează fiecare setup cu tip (OB, FVG, BOS, CHoCH), killzone, sesiune și timeframe. Descoperă ce setup-uri îți aduc profit real.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    glow: "group-hover:shadow-emerald-500/10",
  },
  {
    icon: Wifi,
    title: "Conectare directă broker",
    description: "Introdu login-ul, parola de investitor și serverul — ca pe MyFXBook. Import automat al ultimelor 90 de zile, fără fișiere CSV.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20 hover:border-amber-500/40",
    glow: "group-hover:shadow-amber-500/10",
  },
  {
    icon: Shield,
    title: "Reguli Prop Firm",
    description: "Configurează limite FTMO, GoatFunded, E8. Alerte automate înainte să atingi limita de pierdere zilnică sau drawdown maxim.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20 hover:border-rose-500/40",
    glow: "group-hover:shadow-rose-500/10",
  },
  {
    icon: Calculator,
    title: "Calculator Lot Universal",
    description: "Calculează dimensiunea poziției pentru Forex, Metale, Indici, Crypto, CFD. Preseturi rapide pentru conturile prop.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20 hover:border-cyan-500/40",
    glow: "group-hover:shadow-cyan-500/10",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Conectează brokerul",
    description: "Leagă contul MT4/MT5 direct (login + parolă investitor + server) — exact ca pe MyFXBook. Sau importă CSV în câteva secunde.",
    icon: Wifi,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  {
    step: "02",
    title: "Jurnalizează fiecare trade",
    description: "Etichetează setup-urile SMC/ICT, adaugă emoțiile și screenshot-urile. AI Coach analizează comportamentul instant.",
    icon: BookOpen,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  {
    step: "03",
    title: "Descoperă-ți edge-ul",
    description: "Analytics-ul arată exact ce setup-uri, sesiuni și timeframe-uri îți aduc profit consistent. Date — nu ghiceli.",
    icon: Target,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
];

const TESTIMONIALS = [
  {
    name: "Marcus R.",
    handle: "@marcus_fx",
    avatar: "MR",
    role: "FTMO Trader",
    text: "În sfârșit un jurnal care vorbește SMC. Etichetarea OB și FVG îmi economisește 20 de minute per sesiune.",
    stars: 5,
    gradient: "from-indigo-600 to-violet-700",
  },
  {
    name: "Elena V.",
    handle: "@elena_trades",
    avatar: "EV",
    role: "Prop Firm Trader",
    text: "AI Coach a detectat pattern-ul meu de revenge trading după 3 pierderi consecutive. Mi-a salvat contul FTMO de 100k.",
    stars: 5,
    gradient: "from-violet-600 to-purple-700",
  },
  {
    name: "Andrei M.",
    handle: "@andreifx",
    avatar: "AM",
    role: "Full-time Trader",
    text: "Cel mai bun dashboard pe care l-am folosit. Profit factor per sesiune mi-a schimbat complet cum îmi structurez ziua.",
    stars: 5,
    gradient: "from-emerald-600 to-teal-700",
  },
];

const STATS = [
  { value: "40+", label: "Metrici de performanță", icon: BarChart3 },
  { value: "99.9%", label: "Uptime garantat", icon: Activity },
  { value: "< 2s", label: "Timp sincronizare", icon: Zap },
  { value: "SSL", label: "Criptare end-to-end", icon: Lock },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-x-hidden">

      {/* ── Fixed Navbar ───────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-zinc-800/40 bg-[#09090b]/75 backdrop-blur-2xl">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 relative flex items-center justify-center shrink-0 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-indigo-500/30 transition-colors overflow-hidden">
              <Image src="/logo.jpg" alt="TradeGX" width={28} height={28} className="object-contain" style={{ mixBlendMode: "screen" }} />
            </div>
            <span className="font-black text-white tracking-tight">
              Trade<span className="gradient-text-indigo">GX</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-zinc-500">
            <Link href="#features" className="hover:text-zinc-200 transition-colors">Funcționalități</Link>
            <Link href="#how-it-works" className="hover:text-zinc-200 transition-colors">Cum funcționează</Link>
            <Link href="/pricing" className="hover:text-zinc-200 transition-colors">Prețuri</Link>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800/80 text-[13px]">
                Autentificare
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 text-[13px] font-semibold">
                Încearcă gratuit
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-32 px-6 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 hero-grid-bg opacity-40 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-500/8 rounded-full blur-3xl" />
          <div className="absolute top-32 left-1/3 w-[300px] h-[200px] bg-violet-500/6 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/8 text-indigo-300 text-sm">
            <span className="live-dot" style={{ width: 6, height: 6 }} />
            14 zile PRO gratuit — fără card de credit
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-[72px] font-black tracking-tight leading-[1.03] mb-7">
            Jurnal de trading
            <br />
            <span className="relative">
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">
                la nivel instituțional
              </span>
            </span>
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Construit pentru traderii SMC și ICT. Conectare directă la broker, AI Coach,
            analiză avansată și alertă prop firm — tot ce ai nevoie într-un singur loc.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-8 h-12 shadow-2xl shadow-indigo-500/30 text-base gap-2">
                Începe gratuit — 14 zile PRO
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-zinc-700/80 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800/80 hover:text-white h-12 px-8 text-base backdrop-blur-sm">
                Vezi prețurile
              </Button>
            </Link>
          </div>

          {/* Social proof pills */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-zinc-500">
            {[
              "Fără card de credit",
              "Conectare directă MT4/MT5",
              "AI Coach inclus",
              "Anulare oricând",
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/80" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="relative max-w-3xl mx-auto mt-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 text-center backdrop-blur-sm">
                  <Icon className="w-4 h-4 text-zinc-600 mx-auto mb-2" />
                  <p className="text-2xl font-black text-zinc-100 num">{s.value}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-zinc-800/80 border-zinc-700 text-zinc-400 text-xs">
              Funcționalități
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">
              Tot ce are nevoie un trader serios
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
              Construit de la zero pentru traderii SMC, ICT și concepte instituționale moderne.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={`group relative bg-zinc-900/50 border rounded-2xl p-6 transition-all duration-300 hover:bg-zinc-900/80 hover:shadow-xl ${f.border} ${f.glow} overflow-hidden`}
                >
                  {/* Corner glow */}
                  <div className={`absolute -top-8 -right-8 w-24 h-24 ${f.bg} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  <div className={`relative w-11 h-11 rounded-xl ${f.bg} border ${f.border} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-bold text-zinc-100 mb-2 text-[15px]">{f.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-zinc-800/80 border-zinc-700 text-zinc-400 text-xs">
              Cum funcționează
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">
              Gata în câteva minute
            </h2>
            <p className="text-zinc-400 text-lg">
              Trei pași pentru a tranzacționa cu claritate bazată pe date.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="relative">
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:flex absolute top-10 left-[calc(100%+12px)] right-0 w-6 items-center justify-center">
                      <div className="w-6 h-px bg-gradient-to-r from-zinc-700 to-transparent" />
                      <ChevronRight className="w-3 h-3 text-zinc-700 absolute right-0" />
                    </div>
                  )}
                  <div className={`rounded-2xl border ${s.bg} p-6 h-full`}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl font-black text-zinc-800 num font-mono leading-none">{s.step}</span>
                      <div className={`w-9 h-9 rounded-xl ${s.bg} border flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${s.color}`} />
                      </div>
                    </div>
                    <h3 className="font-bold text-zinc-100 mb-2 text-[15px]">{s.title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">{s.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────────── */}
      <section className="py-28 px-6 border-y border-zinc-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-zinc-800/80 border-zinc-700 text-zinc-400 text-xs">
              Testimoniale
            </Badge>
            <h2 className="text-3xl font-black mb-3 tracking-tight">
              De încredere pentru traderi din toată lumea
            </h2>
            <p className="text-zinc-500">Sunt deja mii de traderi care folosesc TradeGX zilnic.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.name}
                className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 hover:border-zinc-700 transition-all duration-200 group">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed mb-5">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-zinc-200 text-sm font-semibold">{t.name}</p>
                    <p className="text-zinc-600 text-xs">{t.role} · {t.handle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-violet-500/8 to-purple-500/10" />
            <div className="absolute inset-0 hero-grid-bg opacity-30" />
            {/* Border gradient */}
            <div className="absolute inset-0 rounded-3xl border border-indigo-500/20" />
            {/* Glow blobs */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl" />

            <div className="relative p-12">
              <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
                <Zap className="w-3 h-3" />
                Fără card de credit necesar
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">
                Gata să tranzacționezi cu un edge?
              </h2>
              <p className="text-zinc-400 mb-8 leading-relaxed">
                Alătură-te miilor de traderi care folosesc TradeGX pentru a jurnaliza mai inteligent
                și a se îmbunătăți mai rapid.
              </p>
              <Link href="/register">
                <Button size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-10 h-12 shadow-2xl shadow-indigo-500/30 text-base gap-2">
                  Începe perioada de probă gratuită
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <p className="text-zinc-600 text-sm mt-4">14 zile PRO · Anulare oricând · Fără surprize</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800/50 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-6 h-6 relative flex items-center justify-center shrink-0 rounded overflow-hidden">
                <Image src="/logo.jpg" alt="TradeGX" width={24} height={24} className="object-contain" style={{ mixBlendMode: "screen" }} />
              </div>
              <span className="font-black text-zinc-400 text-sm group-hover:text-zinc-200 transition-colors">
                Trade<span className="gradient-text-indigo">GX</span>
              </span>
            </Link>

            <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-600">
              {[
                { href: "/pricing", label: "Prețuri" },
                { href: "/login",   label: "Autentificare" },
                { href: "/register", label: "Înregistrare" },
                { href: "#features", label: "Funcționalități" },
              ].map((link) => (
                <Link key={link.href} href={link.href}
                  className="hover:text-zinc-400 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>

            <p className="text-zinc-700 text-xs">
              &copy; {new Date().getFullYear()} TradeGX. Toate drepturile rezervate.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
