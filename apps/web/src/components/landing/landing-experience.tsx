"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  motion, useScroll, useTransform, useInView,
} from "framer-motion";
import {
  BarChart3, Brain, BookOpen, Wifi, Shield, Calculator, GraduationCap,
  FlaskConical, Target, ArrowRight, CheckCircle2, Sparkles, ChevronRight,
  Lock, Users, Zap, Activity, TrendingUp, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { LiveChartCanvas, TickerTape, FloatingTickers } from "@/components/landing/hero-fx";

// ── Landing experience ───────────────────────────────────────────────────────
// Prezentare premium, parallax de sus până jos. Doar transform/opacity (GPU) +
// reveal la scroll (IntersectionObserver, o singură dată) = fără lag.

// ── Helpers ──────────────────────────────────────────────────────────────────

const EASE = [0.22, 0.68, 0, 1] as const;

function Reveal({
  children, delay = 0, y = 28, className,
}: {
  children: React.ReactNode; delay?: number; y?: number; className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.65, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function CountOnView({
  value, decimals = 0, prefix = "", suffix = "", className,
}: {
  value: number; decimals?: number; prefix?: string; suffix?: string; className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <span ref={ref} className={className}>
      {inView ? <CountUp value={value} decimals={decimals} prefix={prefix} suffix={suffix} duration={1400} />
              : <>{prefix}0{suffix}</>}
    </span>
  );
}

const STEP_META = [{ Icon: Wifi, rgb: "129,140,248" }, { Icon: BookOpen, rgb: "167,139,250" }, { Icon: Target, rgb: "52,211,153" }];
const COMMIT_META = [{ Icon: Lock, rgb: "52,211,153" }, { Icon: Shield, rgb: "129,140,248" }, { Icon: Users, rgb: "167,139,250" }];
const STAT_META = [{ v: 40, suffix: "+", rgb: "129,140,248", Icon: BarChart3 }, { v: 99.9, suffix: "%", decimals: 1, rgb: "52,211,153", Icon: Activity }, { v: 2, prefix: "< ", suffix: "s", rgb: "251,191,36", Icon: Zap }, { v: 0, custom: "E2E", rgb: "251,113,133", Icon: Lock }];

const INTEGRATIONS = [
  { name: "MetaTrader 4 / 5", live: true }, { name: "MetaAPI Cloud", live: true },
  { name: "TradingView", live: true }, { name: "Import CSV / HTML", live: true },
  { name: "Telegram", live: true }, { name: "cTrader · TradeLocker", live: false },
];

export function LandingExperience() {
  const t = useTranslations("landing");
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div className="relative min-h-screen bg-[#08080b] text-white overflow-x-hidden">
      {/* Bară progres scroll sus */}
      <motion.div style={{ scaleX }} className="fixed top-0 left-0 right-0 h-0.5 z-[60] origin-left bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400" />

      <Navbar t={t} />
      <Hero t={t} />
      <StatsStrip t={t} />
      <Features t={t} />
      <NumbersAct t={t} />
      <HowItWorks t={t} />
      <Trust t={t} />
      <IntegrationsMarquee t={t} />
      <Pricing t={t} />
      <Faq t={t} />
      <FinalCta t={t} />
      <Footer t={t} />
    </div>
  );
}

type TT = ReturnType<typeof useTranslations>;

// ── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ t }: { t: TT }) {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-zinc-800/40 bg-[#08080b]/70 backdrop-blur-2xl">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 relative flex items-center justify-center shrink-0 rounded-xl bg-zinc-900 border border-zinc-800 group-hover:border-indigo-500/40 transition-all overflow-hidden">
            <Image src="/logo.jpg" alt="TradeGx" width={32} height={32} className="object-contain" style={{ mixBlendMode: "screen" }} />
          </div>
          <span className="font-black text-white tracking-tight text-[15px]">Trade<span className="gradient-text-indigo">Gx</span></span>
        </Link>
        <div className="hidden md:flex items-center gap-7 text-sm text-zinc-500">
          <a href="#features" className="hover:text-zinc-200 transition-colors font-medium">{t("navFeatures")}</a>
          <a href="#how-it-works" className="hover:text-zinc-200 transition-colors font-medium">{t("navHow")}</a>
          <Link href="/pricing" className="hover:text-zinc-200 transition-colors font-medium">{t("navPricing")}</Link>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <Link href="/login" className="hidden sm:block"><Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800/80 text-[13px] font-medium">{t("login")}</Button></Link>
          <Link href="/register"><Button size="sm" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 text-[13px] font-bold gap-1.5"><Sparkles className="w-3.5 h-3.5" />{t("tryFree")}</Button></Link>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ t }: { t: TT }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const textY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const mockY = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const mockScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);

  const words = t("heroTitle1").split(" ");

  return (
    <section ref={ref} className="relative min-h-[100vh] pt-32 pb-20 px-6 overflow-hidden">
      {/* Aurora — blob-uri statice care plutesc lent (transform only) */}
      <div className="absolute inset-0 hero-grid-bg opacity-[0.22] pointer-events-none" />
      <motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] left-[15%] w-[620px] h-[620px] bg-indigo-600/14 rounded-full blur-[120px] pointer-events-none" />
      <motion.div animate={{ x: [0, -50, 0], y: [0, 40, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] right-[10%] w-[520px] h-[520px] bg-violet-600/12 rounded-full blur-[120px] pointer-events-none" />

      {/* Grafic live pe canvas (streaming) */}
      <div className="absolute inset-x-0 top-0 h-[78vh] pointer-events-none"
        style={{ opacity: 0.5, WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 18%, #000 64%, transparent)", maskImage: "linear-gradient(to bottom, transparent, #000 18%, #000 64%, transparent)" }}>
        <LiveChartCanvas className="w-full h-full block" />
      </div>
      {/* Grilă în perspectivă jos */}
      <div className="tg-grid-floor" style={{ height: "40%", opacity: 0.6 }} />
      {/* Cotații care plutesc */}
      <FloatingTickers />
      {/* Bandă de cotații sus */}
      <div className="absolute top-14 inset-x-0 z-20"><TickerTape /></div>

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent pointer-events-none" />

      <motion.div style={{ y: textY, opacity: textOpacity }} className="relative z-10 max-w-4xl mx-auto text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2.5 mb-8 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/8 backdrop-blur-sm">
            <span className="live-dot-indigo" />
            <span className="text-indigo-300 text-sm font-semibold">{t("heroBadge")}</span>
          </div>
        </Reveal>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.02] mb-6">
          <span className="inline-block">
            {words.map((w, i) => (
              <motion.span key={i} className="inline-block mr-[0.25em]"
                initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, delay: 0.1 + i * 0.08, ease: EASE }}>
                {w}
              </motion.span>
            ))}
          </span>
          <br />
          <motion.span className="relative inline-block bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35, ease: EASE }}>
            {t("heroTitle2")}
          </motion.span>
        </h1>

        <Reveal delay={0.5}>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
            {t.rich("heroSubtitle", { b: (c) => <strong className="text-zinc-200">{c}</strong> })}
          </p>
        </Reveal>

        <Reveal delay={0.65}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-8 h-12 shadow-2xl shadow-indigo-500/30 text-base gap-2 transition-transform hover:scale-[1.03]">
                {t("ctaStart")}<ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-zinc-700/80 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800/80 hover:text-white h-12 px-8 text-base backdrop-blur-sm">
                {t("ctaCompare")}
              </Button>
            </Link>
          </div>
        </Reveal>
      </motion.div>

      {/* Mock dashboard cu parallax pe scroll */}
      <motion.div style={{ y: mockY, scale: mockScale }} className="relative z-10 max-w-3xl mx-auto mt-16">
        <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.6, ease: EASE }}
          className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-800/60">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" /><div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
            <div className="flex-1 flex justify-center"><span className="text-[10px] text-zinc-600 font-mono">www.tradegx.com/dashboard</span></div>
          </div>
          <div className="p-4 grid grid-cols-4 gap-2">
            {[{ l: "Win Rate", v: "56.8%", c: "text-emerald-400" }, { l: "Profit Factor", v: "1.68", c: "text-indigo-300" }, { l: "Net P&L", v: "+$1,940", c: "text-emerald-400" }, { l: "Max DD", v: "8.2%", c: "text-violet-300" }].map((s) => (
              <div key={s.l} className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-3">
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-wider mb-1">{s.l}</p>
                <p className={`text-base font-black num ${s.c}`}>{s.v}</p>
              </div>
            ))}
          </div>
        </motion.div>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-indigo-500/12 blur-2xl rounded-full pointer-events-none" />
      </motion.div>
    </section>
  );
}

// ── Stats strip ──────────────────────────────────────────────────────────────
function StatsStrip({ t }: { t: TT }) {
  const labels = ["stat1", "stat2", "stat3", "stat4"];
  return (
    <section className="relative px-6 -mt-4 pb-8">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
        {STAT_META.map((s, i) => (
          <Reveal key={i} delay={i * 0.08}>
            <div className="rounded-2xl border p-4 text-center bg-zinc-900/60 backdrop-blur-sm" style={{ borderColor: `rgba(${s.rgb},0.25)` }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `rgba(${s.rgb},0.12)`, color: `rgb(${s.rgb})` }}>
                <s.Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black num" style={{ color: `rgb(${s.rgb})` }}>
                {s.custom ? s.custom : <CountOnView value={s.v} decimals={s.decimals ?? 0} prefix={s.prefix ?? ""} suffix={s.suffix ?? ""} />}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">{t(labels[i])}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ── Tilt 3D (înclinare după mouse + reflexie holografică) ────────────────────
function Tilt3D({
  children, className, style,
}: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const raf = React.useRef<number>(0);
  const [tilt, setTilt] = React.useState({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });

  function onMove(e: React.MouseEvent) {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() =>
      setTilt({ rx: (0.5 - py) * 9, ry: (px - 0.5) * 11, gx: px * 100, gy: py * 100, active: true })
    );
  }
  function onLeave() {
    cancelAnimationFrame(raf.current);
    setTilt((s) => ({ ...s, rx: 0, ry: 0, active: false }));
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{
        ...style,
        transform: `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(0)`,
        transition: tilt.active ? "transform 0.08s linear" : "transform 0.5s cubic-bezier(.22,.68,0,1.2)",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      {children}
      {/* glare care urmărește cursorul */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
        style={{ opacity: tilt.active ? 1 : 0, background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.14), transparent 45%)` }} />
    </div>
  );
}

// ── Bento tile (futuristic, 3D tilt + neon + holo sweep) ─────────────────────
function BentoTile({
  span, rgb, label, Icon, delay = 0, children,
}: {
  span: string; rgb: string; label: string; Icon: React.ComponentType<{ className?: string }>; delay?: number; children: React.ReactNode;
}) {
  return (
    <motion.div
      className={`${span} h-full`}
      initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: EASE }}
    >
      <Tilt3D
        className="tg-holo group relative h-full rounded-2xl border bg-zinc-900/50 backdrop-blur-md p-4 overflow-hidden"
        style={{ borderColor: `rgba(${rgb},0.35)`, boxShadow: `0 0 0 1px rgba(${rgb},0.05), 0 8px 30px -12px rgba(${rgb},0.25)` }}
      >
        <div className="absolute top-0 left-0 right-0 h-px opacity-80" style={{ background: `linear-gradient(90deg,transparent,rgb(${rgb}),transparent)` }} />
        <div className="absolute -inset-12 opacity-40 pointer-events-none" style={{ background: `radial-gradient(ellipse at 80% 0%, rgba(${rgb},0.14), transparent 60%)` }} />
        <div className="relative flex items-center gap-2 mb-3" style={{ transform: "translateZ(30px)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border" style={{ background: `rgba(${rgb},0.16)`, borderColor: `rgba(${rgb},0.3)`, color: `rgb(${rgb})` }}><Icon className="w-4 h-4" /></div>
          <span className="text-[13px] font-bold text-zinc-100 leading-tight">{label}</span>
        </div>
        <div className="relative" style={{ transform: "translateZ(20px)" }}>{children}</div>
      </Tilt3D>
    </motion.div>
  );
}

// Fundal decorativ: lumânări care plutesc (temă trading)
function CandlesBg() {
  const candles = React.useMemo(
    () => Array.from({ length: 40 }, (_, i) => ({
      up: Math.random() > 0.45,
      h: 20 + Math.random() * 70,
      wick: 12 + Math.random() * 22,
      y: Math.random() * 40,
      x: i * 26,
    })), []);
  return (
    <div className="absolute inset-x-0 bottom-0 h-64 overflow-hidden pointer-events-none opacity-[0.13]">
      <motion.div className="absolute bottom-10 left-0 flex items-end gap-3 w-max"
        animate={{ x: ["0%", "-50%"] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}>
        {[...candles, ...candles].map((c, i) => {
          const col = c.up ? "#34d399" : "#f43f5e";
          return (
            <svg key={i} width="14" height="160" viewBox="0 0 14 160" style={{ transform: `translateY(${c.y}px)` }}>
              <line x1="7" y1={80 - c.wick} x2="7" y2={80 + c.h + c.wick} stroke={col} strokeWidth="1.5" />
              <rect x="2" y={80} width="10" height={c.h} rx="1.5" fill={col} />
            </svg>
          );
        })}
      </motion.div>
    </div>
  );
}

// ── Features — bento grid cu mini-mock-uri reale ale funcțiilor ───────────────
function Features({ t }: { t: TT }) {
  return (
    <section id="features" className="relative py-24 px-6 overflow-hidden">
      {/* Fundal futurist: grilă în perspectivă + glow + lumânări */}
      <div className="tg-grid-floor" />
      <CandlesBg />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 8%, rgba(99,102,241,0.10), transparent 55%)" }} />
      <div className="relative z-10 max-w-6xl mx-auto">
        <SectionHeader t={t} icon={Layers} badge={t("featuresBadge")} title={t("featuresTitle")} sub={t("featuresSub")} />

        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 md:auto-rows-[168px] md:grid-flow-dense">
          {/* AI Signals — tile mare */}
          <BentoTile span="col-span-2 md:row-span-2" rgb="129,140,248" Icon={Brain} label={t("f2T")}>
            <span className="absolute top-4 right-4 text-[9px] font-black text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 rounded-full px-2 py-0.5">HPS</span>
            <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/50 p-3 mt-1">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-black text-zinc-100">EUR/USD</span>
                <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 rounded px-1.5 py-0.5">BUY</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2.5">
                {[["Entry", "1.0842"], ["SL", "1.0818"], ["TP", "1.0910"]].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-zinc-900/70 border border-zinc-800/60 px-2 py-1.5">
                    <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-wide">{k}</p>
                    <p className="text-[11px] font-bold text-zinc-200 num">{v}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400" style={{ width: "82%" }} />
                </div>
                <span className="text-[10px] font-black text-emerald-400 num">82%</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 mt-3 leading-relaxed">{t("f2D")}</p>
          </BentoTile>

          {/* Analytics */}
          <BentoTile span="col-span-2" rgb="167,139,250" Icon={BarChart3} label={t("f1T")} delay={0.05}>
            <svg viewBox="0 0 300 54" className="w-full h-12">
              <defs><linearGradient id="bt-an" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" stopOpacity="0.35" /><stop offset="100%" stopColor="#a78bfa" stopOpacity="0" /></linearGradient></defs>
              <path d="M0 46 C40 42 60 30 90 32 C130 35 150 14 190 12 C230 10 250 24 300 4" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
              <path d="M0 46 C40 42 60 30 90 32 C130 35 150 14 190 12 C230 10 250 24 300 4 L300 54 L0 54 Z" fill="url(#bt-an)" />
            </svg>
            <div className="flex gap-2 mt-2">
              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800/70 rounded px-2 py-0.5">Win Rate <span className="text-emerald-400 num">56.8%</span></span>
              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800/70 rounded px-2 py-0.5">PF <span className="text-indigo-300 num">1.68</span></span>
            </div>
          </BentoTile>

          {/* Journal */}
          <BentoTile span="col-span-1" rgb="52,211,153" Icon={BookOpen} label={t("f3T")} delay={0.1}>
            <div className="rounded-lg bg-zinc-950/50 border border-zinc-800/60 p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-200">GBP/USD</span>
                <span className="text-[11px] font-black text-emerald-400 num">+$120</span>
              </div>
              <div className="flex gap-1 mt-2">
                {["#FVG", t("btTagDiscipline")].map((tag) => <span key={tag} className="text-[8px] text-zinc-500 bg-zinc-800/70 rounded px-1.5 py-0.5">{tag}</span>)}
              </div>
            </div>
          </BentoTile>

          {/* Broker sync */}
          <BentoTile span="col-span-1" rgb="251,191,36" Icon={Wifi} label={t("f4T")} delay={0.15}>
            <div className="rounded-lg bg-zinc-950/50 border border-zinc-800/60 p-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide">Live sync</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">MT5 #105033542</p>
              <p className="text-sm font-black text-zinc-100 num mt-0.5">$10,370</p>
            </div>
          </BentoTile>

          {/* Risk Manager */}
          <BentoTile span="col-span-2" rgb="251,113,133" Icon={Shield} label={t("f5T")} delay={0.1}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] text-zinc-600 uppercase font-bold tracking-wide mb-1">{t("btRiskPerTrade")}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden"><div className="h-full bg-rose-400 rounded-full" style={{ width: "33%" }} /></div>
                  <span className="text-[11px] font-black text-rose-300 num">1%</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-2">Max risk <span className="text-rose-400 font-bold num">−$103</span></p>
              </div>
              <div className="rounded-lg bg-zinc-950/50 border border-zinc-800/60 p-2.5 text-center">
                <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-wide">{t("btVolume")}</p>
                <p className="text-2xl font-black text-indigo-300 num">0.52</p>
              </div>
            </div>
          </BentoTile>

          {/* Lot Calculator */}
          <BentoTile span="col-span-1" rgb="56,189,248" Icon={Calculator} label={t("f6T")} delay={0.15}>
            <div className="text-center py-1">
              <p className="text-3xl font-black text-sky-300 num leading-none">0.52</p>
              <p className="text-[9px] text-zinc-600 mt-1">EURUSD · 20 pips</p>
            </div>
          </BentoTile>

          {/* Backtesting */}
          <BentoTile span="col-span-1" rgb="244,63,94" Icon={FlaskConical} label={t("f8T")} delay={0.2}>
            <svg viewBox="0 0 120 40" className="w-full h-9">
              {[18, 28, 22, 34, 26, 32].map((h, i) => <rect key={i} x={i * 20 + 2} y={38 - h} width={14} height={h} rx={2} fill="#fb7185" opacity={0.4 + (h / 34) * 0.5} />)}
            </svg>
            <p className="text-[10px] text-zinc-500 mt-1">+$536 · <span className="text-zinc-300 num">PF 1.11</span></p>
          </BentoTile>

          {/* Academy */}
          <BentoTile span="col-span-2" rgb="129,140,248" Icon={GraduationCap} label={t("f7T")} delay={0.15}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-zinc-400">{t("btAcademyMeta")}</p>
              <span className="text-[11px] font-black text-indigo-300 num">68%</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-2"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: "68%" }} /></div>
            <div className="flex gap-1.5">
              {["SMC", "ICT", "Risk", "Psy"].map((m) => <span key={m} className="text-[8px] font-bold text-zinc-500 bg-zinc-800/70 rounded px-1.5 py-0.5">{m}</span>)}
            </div>
          </BentoTile>

          {/* Goals */}
          <BentoTile span="col-span-2" rgb="52,211,153" Icon={Target} label={t("f9T")} delay={0.2}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-zinc-400">{t("btMonthlyTarget")}</p>
              <span className="text-[11px] font-black text-emerald-400 num">$1,940 / $2,850</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300" style={{ width: "68%" }} /></div>
            <p className="text-[10px] text-zinc-600 mt-2">{t("btGoalNote")}</p>
          </BentoTile>
        </div>
      </div>
    </section>
  );
}

// ── Numbers act (cinematic parallax) ─────────────────────────────────────────
function NumbersAct({ t }: { t: TT }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const chartY = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const k1 = useTransform(scrollYProgress, [0, 1], [70, -70]);
  const k2 = useTransform(scrollYProgress, [0, 1], [110, -50]);
  const k3 = useTransform(scrollYProgress, [0, 1], [40, -110]);
  const k4 = useTransform(scrollYProgress, [0, 1], [90, -60]);

  return (
    <section ref={ref} className="relative py-28 px-6 overflow-hidden">
      <div className="absolute inset-0 hero-grid-bg opacity-[0.14] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">
        <SectionHeader t={t} icon={Activity} badge={t("pxBadge")} title={t("pxTitle")} sub={t("pxSub")} />

        <div className="relative mt-14 grid md:grid-cols-[1fr_1.4fr_1fr] gap-5 items-center">
          {/* KPI stânga */}
          <div className="hidden md:flex flex-col gap-5">
            <motion.div style={{ y: k1 }}><Kpi rgb="129,140,248" Icon={Target} label="Win Rate"><CountOnView value={56.8} decimals={1} suffix="%" /></Kpi></motion.div>
            <motion.div style={{ y: k3 }}><Kpi rgb="167,139,250" Icon={Activity} label="Net P&L · 30d"><CountOnView value={1940} prefix="+$" /></Kpi></motion.div>
          </div>

          {/* Card central */}
          <motion.div style={{ y: chartY }}>
            <Reveal>
              <div className="relative rounded-3xl border border-zinc-800/80 bg-zinc-900/70 backdrop-blur-xl shadow-2xl shadow-black/60 p-6">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span className="text-xs font-bold text-zinc-300">Equity Curve</span></div>
                  <span className="text-sm font-black text-emerald-400 num">+<CountOnView value={12.84} decimals={2} suffix="%" /></span>
                </div>
                <svg viewBox="0 0 520 180" className="w-full">
                  <defs><linearGradient id="na-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" stopOpacity="0.28" /><stop offset="100%" stopColor="#34d399" stopOpacity="0" /></linearGradient></defs>
                  {[45, 90, 135].map((y) => <line key={y} x1="0" y1={y} x2="520" y2={y} stroke="#27272a" strokeWidth="1" />)}
                  <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, ease: "easeInOut" }}
                    d="M0 160 C60 150 90 120 130 118 C180 116 210 80 260 70 C310 60 340 92 380 66 C420 40 450 30 520 14" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
                  <motion.path initial={{ opacity: 0 }} whileInView={{ opacity: 0.9 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.8 }}
                    d="M0 160 C60 150 90 120 130 118 C180 116 210 80 260 70 C310 60 340 92 380 66 C420 40 450 30 520 14 L520 180 L0 180 Z" fill="url(#na-grad)" />
                </svg>
                <p className="text-[10px] text-zinc-600 text-center mt-3 uppercase tracking-widest">{t("pxDemoNote")}</p>
              </div>
            </Reveal>
          </motion.div>

          {/* KPI dreapta */}
          <div className="hidden md:flex flex-col gap-5">
            <motion.div style={{ y: k2 }}><Kpi rgb="52,211,153" Icon={TrendingUp} label="Profit Factor"><CountOnView value={1.68} decimals={2} /></Kpi></motion.div>
            <motion.div style={{ y: k4 }}><Kpi rgb="251,113,133" Icon={Shield} label="Max Drawdown"><CountOnView value={8.2} decimals={1} suffix="%" /></Kpi></motion.div>
          </div>
        </div>

        {/* KPI pe mobil (grid, fără parallax) */}
        <div className="grid grid-cols-2 gap-3 mt-6 md:hidden">
          <Kpi rgb="129,140,248" Icon={Target} label="Win Rate"><CountOnView value={56.8} decimals={1} suffix="%" /></Kpi>
          <Kpi rgb="52,211,153" Icon={TrendingUp} label="Profit Factor"><CountOnView value={1.68} decimals={2} /></Kpi>
          <Kpi rgb="167,139,250" Icon={Activity} label="Net P&L · 30d"><CountOnView value={1940} prefix="+$" /></Kpi>
          <Kpi rgb="251,113,133" Icon={Shield} label="Max Drawdown"><CountOnView value={8.2} decimals={1} suffix="%" /></Kpi>
        </div>
      </div>
    </section>
  );
}

function Kpi({ rgb, Icon, label, children }: { rgb: string; Icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-zinc-900/80 backdrop-blur-xl px-4 py-3 shadow-xl shadow-black/40" style={{ borderColor: `rgba(${rgb},0.3)` }}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `rgba(${rgb},0.14)`, color: `rgb(${rgb})` }}><Icon className="w-3.5 h-3.5" /></div>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-black num" style={{ color: `rgb(${rgb})` }}>{children}</p>
    </div>
  );
}

// ── How it works ─────────────────────────────────────────────────────────────
function HowItWorks({ t }: { t: TT }) {
  return (
    <section id="how-it-works" className="relative py-24 px-6 bg-zinc-900/20">
      <div className="max-w-5xl mx-auto">
        <SectionHeader t={t} icon={ChevronRight} badge={t("howBadge")} title={t("howTitle")} sub={t("howSub")} />
        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {STEP_META.map((m, i) => (
            <Reveal key={i} delay={i * 0.15}>
              <div className="relative rounded-2xl border p-6 h-full bg-zinc-900/50" style={{ borderColor: `rgba(${m.rgb},0.2)` }}>
                <div className="flex items-start gap-3 mb-5">
                  <span className="text-5xl font-black font-mono leading-none" style={{ color: `rgba(${m.rgb},0.2)` }}>{String(i + 1).padStart(2, "0")}</span>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mt-1" style={{ background: `rgba(${m.rgb},0.12)`, color: `rgb(${m.rgb})` }}><m.Icon className="w-5 h-5" /></div>
                </div>
                <h3 className="font-bold text-zinc-100 mb-2 text-[15px]">{t(`s${i + 1}T`)}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{t(`s${i + 1}D`)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Trust ────────────────────────────────────────────────────────────────────
function Trust({ t }: { t: TT }) {
  return (
    <section className="relative py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <SectionHeader t={t} icon={Shield} badge={t("transpBadge")} title={t("transpTitle")} sub={t("transpSub")} />
        <div className="mt-14 grid md:grid-cols-3 gap-4">
          {COMMIT_META.map((m, i) => (
            <Reveal key={i} delay={i * 0.12}>
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 h-full">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `rgba(${m.rgb},0.12)`, color: `rgb(${m.rgb})` }}><m.Icon className="w-5 h-5" /></div>
                <h3 className="text-zinc-100 text-sm font-black mb-2">{t(`c${i + 1}T`)}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{t(`c${i + 1}Text`)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Integrations marquee ─────────────────────────────────────────────────────
function IntegrationsMarquee({ t }: { t: TT }) {
  const row = [...INTEGRATIONS, ...INTEGRATIONS];
  return (
    <section className="relative py-20 border-y border-zinc-900 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 mb-8">
        <SectionHeader t={t} icon={Wifi} badge={t("intBadge")} title={t("intTitle")} sub={t("intSub")} />
      </div>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#08080b] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#08080b] to-transparent z-10 pointer-events-none" />
        <motion.div className="flex gap-4 w-max" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }}>
          {row.map((it, i) => (
            <div key={i} className={`flex items-center gap-2.5 rounded-2xl border px-5 py-3.5 shrink-0 ${it.live ? "border-zinc-800/80 bg-zinc-900/60" : "border-dashed border-zinc-800 bg-zinc-950/40"}`}>
              <span className={`w-2 h-2 rounded-full ${it.live ? "bg-emerald-400" : "bg-zinc-600"}`} />
              <span className={`text-sm font-bold ${it.live ? "text-zinc-200" : "text-zinc-500"}`}>{it.name}</span>
              <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${it.live ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "text-zinc-500 border-zinc-700 bg-zinc-800/60"}`}>
                {it.live ? t("statusLive") : t("statusSoon")}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Pricing ──────────────────────────────────────────────────────────────────
function Pricing({ t }: { t: TT }) {
  return (
    <section id="preturi" className="relative py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <SectionHeader t={t} icon={Zap} badge={t("priceBadge")} title={t("priceTitle")} sub={t("priceSub")} />
        <div className="mt-12 grid md:grid-cols-2 gap-4">
          <Reveal>
            <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-7 h-full">
              <p className="text-sm font-black text-zinc-300 mb-1">{t("standardName")}</p>
              <p className="text-4xl font-black mb-1">0$</p>
              <p className="text-xs text-zinc-600 mb-5">{t("freeForever")}</p>
              <ul className="space-y-2.5 mb-7">
                {["std1", "std2", "std3", "std4", "std5"].map((k) => (
                  <li key={k} className="flex items-start gap-2 text-sm text-zinc-400"><CheckCircle2 className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />{t(k)}</li>
                ))}
              </ul>
              <Link href="/register" className="block text-center rounded-xl border border-zinc-700 py-3 text-sm font-bold text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors">{t("startFree")}</Link>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="relative rounded-3xl border border-indigo-500/40 bg-gradient-to-b from-indigo-500/[0.08] to-zinc-900/50 p-7 h-full overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent" />
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-black text-indigo-300">{t("proName")}</p>
                <span className="text-[9px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/15 border border-indigo-500/40 rounded-full px-2 py-0.5">{t("recommended")}</span>
              </div>
              <p className="text-4xl font-black mb-1">12$<span className="text-base font-bold text-zinc-500">{t("perMonth")}</span></p>
              <p className="text-xs text-zinc-600 mb-5">{t("proPriceNote")}</p>
              <ul className="space-y-2.5 mb-7">
                {["pro1", "pro2", "pro3", "pro4", "pro5", "pro6"].map((k, idx) => (
                  <li key={k} className="flex items-start gap-2 text-sm text-zinc-300"><CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${idx === 0 ? "text-zinc-600" : "text-emerald-400"}`} />{t(k)}</li>
                ))}
              </ul>
              <Link href="/register" className="block text-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all">{t("proCta")}</Link>
            </div>
          </Reveal>
        </div>
        <p className="text-center mt-6"><Link href="/pricing" className="text-sm text-zinc-500 hover:text-zinc-300 underline underline-offset-4 transition-colors">{t("compareFull")}</Link></p>
      </div>
    </section>
  );
}

// ── FAQ ──────────────────────────────────────────────────────────────────────
function Faq({ t }: { t: TT }) {
  return (
    <section id="faq" className="relative py-24 px-6 border-t border-zinc-900">
      <div className="max-w-3xl mx-auto">
        <SectionHeader t={t} icon={Sparkles} badge={t("faqBadge")} title={t("faqTitle")} />
        <div className="mt-10 space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Reveal key={i} delay={i * 0.05}>
              <details className="group rounded-2xl border border-zinc-800/80 bg-zinc-900/50 open:border-indigo-500/30 transition-colors">
                <summary className="flex items-center justify-between cursor-pointer list-none px-5 py-4 text-sm font-bold text-zinc-200 [&::-webkit-details-marker]:hidden">
                  {t(`faq${i}Q`)}<ChevronRight className="w-4 h-4 text-zinc-600 group-open:rotate-90 transition-transform shrink-0 ml-3" />
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-400">{t(`faq${i}A`)}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ────────────────────────────────────────────────────────────────
function FinalCta({ t }: { t: TT }) {
  return (
    <section className="relative py-28 px-6">
      <div className="max-w-2xl mx-auto">
        <Reveal>
          <div className="relative rounded-3xl overflow-hidden text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/12 via-violet-500/10 to-purple-500/12" />
            <div className="absolute inset-0 hero-grid-bg-dense opacity-50" />
            <div className="absolute inset-0 rounded-3xl border border-indigo-500/25" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-32 bg-indigo-500/15 rounded-full blur-3xl" />
            <div className="relative p-12">
              <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold"><Zap className="w-3 h-3" />{t("ctaBadge")}</div>
              <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">{t("ctaTitle1")}<span className="gradient-text-indigo">{t("ctaTitle2")}</span></h2>
              <p className="text-zinc-400 mb-8 leading-relaxed">{t.rich("ctaSub", { b: (c) => <strong className="text-zinc-200">{c}</strong> })}</p>
              <Link href="/register"><Button size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-10 h-12 shadow-2xl shadow-indigo-500/30 text-base gap-2 transition-transform hover:scale-[1.03]"><Sparkles className="w-4 h-4" />{t("ctaBtn")}</Button></Link>
              <p className="text-zinc-600 text-sm mt-5">{t("ctaNote")}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────
function Footer({ t }: { t: TT }) {
  return (
    <footer className="relative border-t border-zinc-800/50 py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 relative flex items-center justify-center shrink-0 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden"><Image src="/logo.jpg" alt="TradeGx" width={28} height={28} className="object-contain" style={{ mixBlendMode: "screen" }} /></div>
            <span className="font-black text-zinc-400 text-sm group-hover:text-zinc-200 transition-colors">Trade<span className="gradient-text-indigo">Gx</span></span>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-600">
            {[["/pricing", "navPricing"], ["/login", "login"], ["/register", "fRegister"], ["/about", "fAbout"], ["/roadmap", "fRoadmap"], ["/terms", "fTerms"], ["/privacy", "fPrivacy"], ["/contact", "fContact"]].map(([href, key]) => (
              <Link key={href} href={href} className="hover:text-zinc-400 transition-colors font-medium">{t(key)}</Link>
            ))}
          </div>
          <p className="text-zinc-700 text-xs">&copy; {new Date().getFullYear()} TradeGx · {t("copyright")}</p>
        </div>
        <p className="mt-8 pt-6 border-t border-zinc-800/40 text-[11px] leading-relaxed text-zinc-700 max-w-4xl">
          <strong className="text-zinc-600">{t("riskLabel")}</strong> {t("riskText")}
        </p>
      </div>
    </footer>
  );
}

// ── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ t, icon: Icon, badge, title, sub }: { t: TT; icon: React.ComponentType<{ className?: string }>; badge: string; title: string; sub?: string }) {
  return (
    <Reveal className="text-center">
      <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-zinc-700/60 bg-zinc-800/50 text-zinc-400 text-xs font-bold uppercase tracking-widest">
        <Icon className="w-3 h-3" />{badge}
      </div>
      <h2 className="text-3xl md:text-4xl font-black tracking-tight">{title}</h2>
      {sub && <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed mt-4">{sub}</p>}
    </Reveal>
  );
}
