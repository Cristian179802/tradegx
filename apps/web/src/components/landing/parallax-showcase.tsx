"use client";

import * as React from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { TrendingUp, Target, Activity, Shield, Flame, Trophy } from "lucide-react";

// ── Parallax showcase (landing) ──────────────────────────────────────────────
// Secțiune „cinematică": conținutul e fixat (sticky) cât derulezi prin ea, iar
// straturile se mișcă pe adâncimi diferite. Cifrele DEMO „numără" legate de scroll,
// iar curba de equity se desenează progresiv. Texte primite traduse (server).

function fmt(v: number, decimals: number) {
  return v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// Număr legat de progresul scroll-ului (numără pe măsură ce derulezi).
function ScrollNumber({
  progress, to, from = 0, start, end, decimals = 0, prefix = "", suffix = "",
}: {
  progress: MotionValue<number>; to: number; from?: number; start: number; end: number;
  decimals?: number; prefix?: string; suffix?: string;
}) {
  const mv = useTransform(progress, [start, end], [from, to], { clamp: true });
  const [txt, setTxt] = React.useState(fmt(from, decimals));
  React.useEffect(() => {
    setTxt(fmt(mv.get(), decimals));
    const unsub = mv.on("change", (v) => setTxt(fmt(v, decimals)));
    return unsub;
  }, [mv, decimals]);
  return <span>{prefix}{txt}{suffix}</span>;
}

interface Props { badge: string; title: string; sub: string; demoNote: string }

export function ParallaxShowcase({ badge, title, sub, demoNote }: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Straturi de fundal (parallax lent, sensuri opuse)
  const blobA = useTransform(scrollYProgress, [0, 1], [-80, 80]);
  const blobB = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const gridY = useTransform(scrollYProgress, [0, 1], [0, -120]);

  // Titlu: intră, apoi urcă și se estompează
  const titleOpacity = useTransform(scrollYProgress, [0, 0.12, 0.5, 0.62], [0, 1, 1, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.6], [50, -70]);

  // Card central equity: scală + rotație subtilă
  const cardScale = useTransform(scrollYProgress, [0.1, 0.55], [0.9, 1.04]);
  const cardRotate = useTransform(scrollYProgress, [0, 1], [7, -5]);
  const cardOpacity = useTransform(scrollYProgress, [0.05, 0.2, 0.9, 1], [0, 1, 1, 0.7]);

  // Curba de equity se desenează
  const pathLength = useTransform(scrollYProgress, [0.18, 0.72], [0, 1], { clamp: true });

  // KPI-uri care plutesc pe adâncimi diferite
  const k1y = useTransform(scrollYProgress, [0, 1], [90, -90]);
  const k2y = useTransform(scrollYProgress, [0, 1], [140, -60]);
  const k3y = useTransform(scrollYProgress, [0, 1], [60, -140]);
  const k4y = useTransform(scrollYProgress, [0, 1], [120, -80]);
  const chipY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const kpiOpacity = useTransform(scrollYProgress, [0.12, 0.3], [0, 1], { clamp: true });

  return (
    <section ref={ref} className="relative h-[240vh]">
      {/* Stage fixat */}
      <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">
        {/* ── Fundal ── */}
        <motion.div style={{ y: gridY }} className="absolute inset-0 hero-grid-bg opacity-[0.18] pointer-events-none" />
        <motion.div style={{ y: blobA }} className="absolute top-1/4 left-1/4 w-[520px] h-[520px] bg-indigo-500/12 rounded-full blur-[130px] pointer-events-none" />
        <motion.div style={{ y: blobB }} className="absolute bottom-1/4 right-1/4 w-[440px] h-[440px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* ── Titlu ── */}
        <motion.div style={{ opacity: titleOpacity, y: titleY }} className="absolute top-[14%] left-0 right-0 text-center px-6 z-20">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/8 text-indigo-300 text-xs font-bold uppercase tracking-widest">
            <Activity className="w-3 h-3" />
            {badge}
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] max-w-3xl mx-auto">
            {title}
          </h2>
          <p className="text-zinc-400 mt-4 max-w-xl mx-auto text-lg">{sub}</p>
        </motion.div>

        {/* ── Card central: equity ── */}
        <motion.div
          style={{ scale: cardScale, rotate: cardRotate, opacity: cardOpacity, perspective: 1000 }}
          className="relative z-10 w-[min(560px,88vw)] rounded-3xl border border-zinc-800/80 bg-zinc-900/70 backdrop-blur-xl shadow-2xl shadow-black/60 p-6"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-zinc-300">Equity Curve</span>
            </div>
            <span className="text-sm font-black text-emerald-400 num">
              +<ScrollNumber progress={scrollYProgress} to={12.84} start={0.2} end={0.75} decimals={2} suffix="%" />
            </span>
          </div>
          <svg viewBox="0 0 520 180" className="w-full">
            <defs>
              <linearGradient id="px-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* grilă subtilă */}
            {[45, 90, 135].map((y) => (
              <line key={y} x1="0" y1={y} x2="520" y2={y} stroke="#27272a" strokeWidth="1" />
            ))}
            <motion.path
              style={{ pathLength }}
              d="M0 160 C60 150 90 120 130 118 C180 116 210 80 260 70 C310 60 340 92 380 66 C420 40 450 30 520 14"
              fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round"
            />
            <path
              d="M0 160 C60 150 90 120 130 118 C180 116 210 80 260 70 C310 60 340 92 380 66 C420 40 450 30 520 14 L520 180 L0 180 Z"
              fill="url(#px-grad)" opacity="0.9"
            />
          </svg>
          <p className="text-[10px] text-zinc-600 text-center mt-3 uppercase tracking-widest">{demoNote}</p>
        </motion.div>

        {/* ── KPI-uri care plutesc ── */}
        <motion.div style={{ y: k1y, opacity: kpiOpacity }}
          className="absolute z-20 left-[6%] md:left-[12%] top-[30%] hidden sm:block">
          <KpiCard icon={Target} accent="#818cf8" rgb="129,140,248" label="Win Rate">
            <ScrollNumber progress={scrollYProgress} to={56.8} start={0.15} end={0.6} decimals={1} suffix="%" />
          </KpiCard>
        </motion.div>

        <motion.div style={{ y: k2y, opacity: kpiOpacity }}
          className="absolute z-20 right-[6%] md:right-[12%] top-[26%] hidden sm:block">
          <KpiCard icon={TrendingUp} accent="#34d399" rgb="52,211,153" label="Profit Factor">
            <ScrollNumber progress={scrollYProgress} to={1.68} start={0.15} end={0.6} decimals={2} />
          </KpiCard>
        </motion.div>

        <motion.div style={{ y: k3y, opacity: kpiOpacity }}
          className="absolute z-20 left-[8%] md:left-[14%] bottom-[24%] hidden sm:block">
          <KpiCard icon={Activity} accent="#a78bfa" rgb="167,139,250" label="Net P&L · 30d">
            <ScrollNumber progress={scrollYProgress} to={1940} start={0.2} end={0.7} prefix="+$" />
          </KpiCard>
        </motion.div>

        <motion.div style={{ y: k4y, opacity: kpiOpacity }}
          className="absolute z-20 right-[8%] md:right-[14%] bottom-[28%] hidden sm:block">
          <KpiCard icon={Shield} accent="#fb7185" rgb="251,113,133" label="Max Drawdown">
            <ScrollNumber progress={scrollYProgress} to={8.2} start={0.2} end={0.7} decimals={1} suffix="%" />
          </KpiCard>
        </motion.div>

        {/* chips mici accent */}
        <motion.div style={{ y: chipY, opacity: kpiOpacity }}
          className="absolute z-20 left-1/2 -translate-x-1/2 bottom-[12%] flex gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-bold">
            <Flame className="w-3 h-3" /> <ScrollNumber progress={scrollYProgress} to={7} start={0.25} end={0.7} /> day streak
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-bold">
            <Trophy className="w-3 h-3" /> +$<ScrollNumber progress={scrollYProgress} to={680} start={0.25} end={0.7} /> best day
          </span>
        </motion.div>
      </div>
    </section>
  );
}

function KpiCard({
  icon: Icon, accent, rgb, label, children,
}: {
  icon: React.ComponentType<{ className?: string }>; accent: string; rgb: string; label: string; children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border bg-zinc-900/80 backdrop-blur-xl px-4 py-3 shadow-xl shadow-black/40 min-w-[150px]"
      style={{ borderColor: `rgba(${rgb},0.3)`, boxShadow: `0 0 30px rgba(${rgb},0.08)` }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `rgba(${rgb},0.14)`, color: accent }}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-black num" style={{ color: accent }}>{children}</p>
    </div>
  );
}
