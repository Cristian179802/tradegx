import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp, BarChart3, Brain, Shield, Zap, Globe,
  ArrowRight, CheckCircle2, Star, BookOpen, Calculator,
  Activity, Target, Trophy, ChevronRight, Wifi,
  LineChart, Bell, Users, Lock, Sparkles, Layers,
  TrendingDown, BarChart2, GraduationCap, FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "TradeGx — Jurnal de Trading Profesional",
  description: "Jurnalul de trading profesional pentru traderii SMC și ICT. AI Coach, analiză instituțională și sincronizare broker în timp real.",
};

const FEATURES = [
  {
    icon: BarChart3,
    title: "Analiză Instituțională",
    description: "Win rate, profit factor, expectancy, Sharpe ratio și 40+ metrici. Vizualizează curba equity în timp real.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20 hover:border-indigo-500/40",
    glow: "group-hover:shadow-[0_0_30px_rgba(99,102,241,0.12)]",
    topLine: "via-indigo-500/50",
  },
  {
    icon: Brain,
    title: "AI Trading Coach",
    description: "Monitorizare psihologică în timp real. Detectează revenge trading, FOMO și supratranzacționarea instant.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20 hover:border-violet-500/40",
    glow: "group-hover:shadow-[0_0_30px_rgba(139,92,246,0.12)]",
    topLine: "via-violet-500/50",
  },
  {
    icon: BookOpen,
    title: "Jurnal SMC / ICT",
    description: "Etichetează fiecare setup cu tip (OB, FVG, BOS, CHoCH), killzone, sesiune și timeframe. Găsește edge-ul real.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    glow: "group-hover:shadow-[0_0_30px_rgba(52,211,153,0.12)]",
    topLine: "via-emerald-500/50",
  },
  {
    icon: Wifi,
    title: "Conectare directă broker",
    description: "Introdu login-ul, parola de investitor și serverul MT4/MT5. Import automat al ultimelor 90 de zile.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20 hover:border-amber-500/40",
    glow: "group-hover:shadow-[0_0_30px_rgba(245,158,11,0.12)]",
    topLine: "via-amber-500/50",
  },
  {
    icon: Shield,
    title: "Reguli Prop Firm",
    description: "Configurează limite FTMO, GoatFunded, E8. Alerte automate înainte să atingi limita de pierdere zilnică.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20 hover:border-rose-500/40",
    glow: "group-hover:shadow-[0_0_30px_rgba(244,63,94,0.12)]",
    topLine: "via-rose-500/50",
  },
  {
    icon: Calculator,
    title: "Calculator Lot Universal",
    description: "Calculează dimensiunea poziției pentru Forex, Metale, Indici, Crypto, CFD. Risc precis la fiecare intrare.",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20 hover:border-sky-500/40",
    glow: "group-hover:shadow-[0_0_30px_rgba(14,165,233,0.12)]",
    topLine: "via-sky-500/50",
  },
  {
    icon: GraduationCap,
    title: "Academie de Trading",
    description: "Curs complet RO/EN cu diagrame interactive: de la prima lumânare la SMC, risk management și sisteme profesionale.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20 hover:border-indigo-500/40",
    glow: "group-hover:shadow-[0_0_30px_rgba(99,102,241,0.12)]",
    topLine: "via-indigo-500/50",
  },
  {
    icon: FlaskConical,
    title: "Backtesting cu Date Reale",
    description: "Testează 5 strategii gata făcute sau construiește-ți propria strategie din 15+ indicatori, pe date istorice reale.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20 hover:border-rose-500/40",
    glow: "group-hover:shadow-[0_0_30px_rgba(244,63,94,0.12)]",
    topLine: "via-rose-500/50",
  },
  {
    icon: Target,
    title: "Semnale AI (HPS)",
    description: "Maximum 3 semnale de înaltă probabilitate pe zi, generate de AI pe structura pieței. Cu difuzare pe Telegram.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    glow: "group-hover:shadow-[0_0_30px_rgba(52,211,153,0.12)]",
    topLine: "via-emerald-500/50",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Conectează brokerul",
    description: "Leagă contul MT4/MT5 direct — login + parolă investitor + server. Import automat, fără fișiere CSV.",
    icon: Wifi,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
    numColor: "text-indigo-500/20",
  },
  {
    step: "02",
    title: "Jurnalizează fiecare trade",
    description: "Etichetează setup-urile SMC/ICT, adaugă emoțiile și screenshot-urile. AI Coach analizează instant.",
    icon: BookOpen,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    numColor: "text-violet-500/20",
  },
  {
    step: "03",
    title: "Descoperă-ți edge-ul",
    description: "Analytics-ul arată exact ce setup-uri, sesiuni și timeframe-uri îți aduc profit consistent. Date — nu ghiceli.",
    icon: Target,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    numColor: "text-emerald-500/20",
  },
];

const TESTIMONIALS = [
  {
    name: "Marcus R.",
    handle: "@marcus_fx",
    avatar: "MR",
    role: "FTMO Trader",
    text: "În sfârșit un jurnal care vorbește SMC. Etichetarea OB și FVG îmi economisește 20 de minute per sesiune. Game changer.",
    stars: 5,
    gradient: "from-indigo-600 to-violet-700",
    pnl: "+$4,820",
    up: true,
  },
  {
    name: "Elena V.",
    handle: "@elena_trades",
    avatar: "EV",
    role: "Prop Firm Trader",
    text: "AI Coach a detectat pattern-ul meu de revenge trading după 3 pierderi consecutive. Mi-a salvat contul FTMO de 100k.",
    stars: 5,
    gradient: "from-violet-600 to-purple-700",
    pnl: "+$11,240",
    up: true,
  },
  {
    name: "Andrei M.",
    handle: "@andreifx",
    avatar: "AM",
    role: "Full-time Trader",
    text: "Profit factor per sesiune mi-a schimbat complet cum îmi structurez ziua. Cel mai bun dashboard pe care l-am folosit.",
    stars: 5,
    gradient: "from-emerald-600 to-teal-700",
    pnl: "+$7,590",
    up: true,
  },
];

const STATS = [
  { value: "40+", label: "Metrici profesionale", icon: BarChart3, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { value: "99.9%", label: "Uptime garantat", icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { value: "< 2s", label: "Sincronizare live", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { value: "E2E", label: "Criptare completă", icon: Lock, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
];

// Mock floating stat cards for hero visualization
const HERO_STATS = [
  { label: "Win Rate", value: "68.4%", trend: "+4.2%", up: true, color: "emerald" },
  { label: "Profit Factor", value: "2.14", trend: "+0.32", up: true, color: "indigo" },
  { label: "Net P&L", value: "+$12,840", trend: "30 zile", up: true, color: "emerald" },
  { label: "Max DD", value: "4.8%", trend: "SAFE", up: true, color: "violet" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-zinc-800/40 bg-[#09090b]/80 backdrop-blur-2xl">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/25 to-transparent" />
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 relative flex items-center justify-center shrink-0 rounded-xl bg-zinc-900 border border-zinc-800 group-hover:border-indigo-500/40 transition-all duration-300 overflow-hidden">
              <Image src="/logo.jpg" alt="TradeGx" width={32} height={32} className="object-contain" style={{ mixBlendMode: "screen" }} />
            </div>
            <div>
              <span className="font-black text-white tracking-tight text-[15px]">
                Trade<span className="gradient-text-indigo">Gx</span>
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-sm text-zinc-500">
            {[
              { href: "#features", label: "Funcționalități" },
              { href: "#how-it-works", label: "Cum funcționează" },
              { href: "/pricing", label: "Prețuri" },
            ].map((l) => (
              <Link key={l.href} href={l.href}
                className="hover:text-zinc-200 transition-colors duration-200 font-medium">
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800/80 text-[13px] font-medium">
                Autentificare
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 text-[13px] font-bold gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Încearcă gratuit
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-28 px-6 overflow-hidden">
        {/* Multi-layer background */}
        <div className="absolute inset-0 hero-grid-bg opacity-30 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none">
          {/* Central glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/6 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[300px] bg-violet-500/5 rounded-full blur-[100px]" />
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[200px] bg-indigo-600/4 rounded-full blur-[80px]" />
        </div>
        {/* Top neon border */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2.5 mb-8 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/8 backdrop-blur-sm">
            <span className="live-dot-indigo" />
            <span className="text-indigo-300 text-sm font-semibold">14 zile PRO gratuit — fără card de credit</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-[72px] font-black tracking-tight leading-[1.03] mb-6">
            Jurnal de trading
            <br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                la nivel instituțional
              </span>
              {/* Underline glow */}
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />
            </span>
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Construit pentru traderii <strong className="text-zinc-200">SMC și ICT</strong>. Conectare directă la broker, AI Coach,
            analiză avansată și alertă prop firm — tot ce ai nevoie.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link href="/register">
              <Button size="lg"
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-8 h-12 shadow-2xl shadow-indigo-500/30 text-base gap-2 transition-all duration-300 hover:scale-[1.02]">
                Începe gratuit — 14 zile PRO
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline"
                className="border-zinc-700/80 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800/80 hover:text-white h-12 px-8 text-base backdrop-blur-sm transition-all duration-300">
                Compară planurile
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-500">
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

        {/* ── Floating stats preview ─────────────────────────────────────── */}
        <div className="relative max-w-4xl mx-auto mt-20">
          {/* Mock dashboard preview bar */}
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-1 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-800/60">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-zinc-800/80 border border-zinc-700/40 rounded-lg px-4 py-0.5 flex items-center gap-1.5">
                  <span className="live-dot" style={{ width: 5, height: 5 }} />
                  <span className="text-[10px] text-zinc-500 font-mono">app.tradegx.io/dashboard</span>
                </div>
              </div>
            </div>

            {/* Mock dashboard content */}
            <div className="p-4 space-y-3">
              {/* KPI cards row */}
              <div className="grid grid-cols-4 gap-2">
                {HERO_STATS.map((stat) => (
                  <div key={stat.label}
                    className={`rounded-xl border p-3 ${
                      stat.color === "emerald"
                        ? "bg-emerald-500/8 border-emerald-500/20"
                        : stat.color === "indigo"
                        ? "bg-indigo-500/8 border-indigo-500/20"
                        : "bg-violet-500/8 border-violet-500/20"
                    }`}>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-wider mb-1">{stat.label}</p>
                    <p className={`text-base font-black num ${
                      stat.color === "emerald" ? "text-emerald-400"
                      : stat.color === "indigo" ? "text-indigo-300"
                      : "text-violet-300"
                    }`}>
                      {stat.value}
                    </p>
                    <p className={`text-[9px] font-bold mt-0.5 ${
                      stat.up ? "text-emerald-500" : "text-rose-400"
                    }`}>
                      {stat.up ? "↑" : "↓"} {stat.trend}
                    </p>
                  </div>
                ))}
              </div>

              {/* Mock equity chart */}
              <div className="bg-zinc-900/60 border border-zinc-800/40 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-zinc-400">Curbă Equity — 30 zile</span>
                  <span className="text-[10px] font-black text-emerald-400 num">+12.84%</span>
                </div>
                <svg viewBox="0 0 400 60" className="w-full h-12">
                  <defs>
                    <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                    </linearGradient>
                    <filter id="heroGlow">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  <path
                    d="M 0 50 C 30 48 50 44 80 40 C 110 36 130 42 160 35 C 190 28 210 22 240 18 C 270 14 290 20 320 12 C 340 7 360 5 400 2"
                    fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" filter="url(#heroGlow)"
                  />
                  <path
                    d="M 0 50 C 30 48 50 44 80 40 C 110 36 130 42 160 35 C 190 28 210 22 240 18 C 270 14 290 20 320 12 C 340 7 360 5 400 2 L 400 60 L 0 60 Z"
                    fill="url(#heroGrad)"
                  />
                  <circle cx="400" cy="2" r="3" fill="#34d399" />
                  <circle cx="400" cy="2" r="5" fill="#34d399" fillOpacity="0.2" />
                </svg>
              </div>
            </div>
          </div>

          {/* Reflection / glow below card */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-indigo-500/10 blur-2xl rounded-full pointer-events-none" />
        </div>

        {/* Stats Bar */}
        <div className="relative max-w-3xl mx-auto mt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label}
                  className={`border rounded-2xl p-4 text-center backdrop-blur-sm bg-zinc-900/60 ${s.bg} transition-all duration-300 hover:scale-[1.03] card-hover-lift`}>
                  <div className={`w-8 h-8 rounded-xl ${s.bg} border flex items-center justify-center mx-auto mb-2.5`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <p className={`text-2xl font-black num ${s.color}`}>{s.value}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Neon divider ───────────────────────────────────────────────────── */}
      <div className="neon-line-indigo max-w-6xl mx-auto" />

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-zinc-700/60 bg-zinc-800/50 text-zinc-400 text-xs font-bold uppercase tracking-widest">
              <Layers className="w-3 h-3" />
              Funcționalități
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">
              Tot ce are nevoie un trader serios
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
              Construit de la zero pentru traderii SMC, ICT și concepte instituționale moderne.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={`group relative bg-zinc-900/50 border rounded-2xl p-6 transition-all duration-300 hover:bg-zinc-900/80 hover:shadow-xl overflow-hidden ${f.border} ${f.glow} card-hover-lift`}
                >
                  {/* Top neon line on hover */}
                  <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent ${f.topLine} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  {/* Corner glow blob */}
                  <div className={`absolute -top-8 -right-8 w-24 h-24 ${f.bg} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  <div className={`relative w-11 h-11 rounded-xl ${f.bg} border ${f.border} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-bold text-zinc-100 mb-2.5 text-[15px]">{f.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 px-6 bg-zinc-900/30">
        <div className="absolute inset-0 hero-grid-bg opacity-20 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-zinc-700/60 bg-zinc-800/50 text-zinc-400 text-xs font-bold uppercase tracking-widest">
              <ChevronRight className="w-3 h-3" />
              Cum funcționează
            </div>
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
                  {/* Connector arrow */}
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[calc(100%+8px)] w-8 z-10">
                      <div className="flex items-center gap-1">
                        <div className="flex-1 h-px bg-gradient-to-r from-zinc-700 to-zinc-800" />
                        <ChevronRight className="w-3 h-3 text-zinc-700" />
                      </div>
                    </div>
                  )}
                  <div className={`rounded-2xl border ${s.bg} p-6 h-full card-hover-lift transition-all duration-300 hover:shadow-xl`}>
                    <div className="flex items-start gap-3 mb-5">
                      <span className={`text-5xl font-black num font-mono leading-none ${s.numColor}`}>{s.step}</span>
                      <div className={`w-10 h-10 rounded-xl border ${s.bg} flex items-center justify-center shrink-0 mt-1`}>
                        <Icon className={`w-4.5 h-4.5 ${s.color}`} />
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
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-zinc-700/60 bg-zinc-800/50 text-zinc-400 text-xs font-bold uppercase tracking-widest">
              <Trophy className="w-3 h-3" />
              Testimoniale
            </div>
            <h2 className="text-3xl font-black mb-3 tracking-tight">
              De încredere pentru traderi din toată lumea
            </h2>
            <p className="text-zinc-500">Mii de traderi folosesc TradeGx zilnic pentru a-și îmbunătăți performanța.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.name}
                className="group bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 hover:border-zinc-700/60 transition-all duration-300 card-hover-lift overflow-hidden relative">
                {/* Corner glow */}
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-indigo-500/8 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <span className={`text-sm font-black num ${t.up ? "text-emerald-400" : "text-rose-400"}`}>
                    {t.pnl}
                  </span>
                </div>

                <p className="text-zinc-300 text-sm leading-relaxed mb-5">
                  &ldquo;{t.text}&rdquo;
                </p>

                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-zinc-200 text-sm font-bold">{t.name}</p>
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
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-violet-500/8 to-purple-500/10" />
            <div className="absolute inset-0 hero-grid-bg-dense opacity-50" />
            {/* Border */}
            <div className="absolute inset-0 rounded-3xl border border-indigo-500/25" />
            {/* Animated top line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />
            {/* Glow blobs */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-32 bg-indigo-500/15 rounded-full blur-3xl" />
            <div className="absolute -bottom-8 left-1/3 w-32 h-24 bg-violet-500/10 rounded-full blur-2xl" />

            <div className="relative p-12">
              <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
                <Zap className="w-3 h-3" />
                Fără card de credit necesar
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">
                Gata să tranzacționezi<br />cu un
                <span className="gradient-text-indigo"> edge real?</span>
              </h2>
              <p className="text-zinc-400 mb-8 leading-relaxed">
                Alătură-te miilor de traderi care folosesc <strong className="text-zinc-200">TradeGx</strong> pentru
                a jurnaliza mai inteligent și a se îmbunătăți mai rapid.
              </p>
              <Link href="/register">
                <Button size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-10 h-12 shadow-2xl shadow-indigo-500/30 text-base gap-2 transition-all duration-300 hover:scale-[1.02]">
                  <Sparkles className="w-4 h-4" />
                  Începe perioada de probă gratuită
                </Button>
              </Link>
              <p className="text-zinc-600 text-sm mt-5">14 zile PRO complet · Anulare oricând · Fără surprize</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800/50 py-10 px-6">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent" />
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 relative flex items-center justify-center shrink-0 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-indigo-500/30 transition-colors overflow-hidden">
                <Image src="/logo.jpg" alt="TradeGx" width={28} height={28} className="object-contain" style={{ mixBlendMode: "screen" }} />
              </div>
              <span className="font-black text-zinc-400 text-sm group-hover:text-zinc-200 transition-colors">
                Trade<span className="gradient-text-indigo">Gx</span>
              </span>
              <span className="text-[9px] font-bold text-zinc-700 tracking-widest uppercase hidden sm:block">
                Pro Trading Journal
              </span>
            </Link>

            <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-600">
              {[
                { href: "/pricing",  label: "Prețuri" },
                { href: "/login",    label: "Autentificare" },
                { href: "/register", label: "Înregistrare" },
                { href: "#features", label: "Funcționalități" },
              ].map((link) => (
                <Link key={link.href} href={link.href}
                  className="hover:text-zinc-400 transition-colors font-medium">
                  {link.label}
                </Link>
              ))}
            </div>

            <p className="text-zinc-700 text-xs">
              &copy; {new Date().getFullYear()} TradeGx · Toate drepturile rezervate.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
