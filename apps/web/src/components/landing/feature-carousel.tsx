"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Brain, BookOpen, Wifi, Shield, Calculator,
  GraduationCap, FlaskConical, Target, ChevronLeft, ChevronRight,
} from "lucide-react";

// ── Carusel de funcții (landing) ─────────────────────────────────────────────
// Primește textele DEJA traduse (server) și le prezintă unul câte unul, cu
// panou „glass" 3D, accent de culoare per slide, auto-rotire + pauză la hover.

export interface FeatureSlide { title: string; desc: string }

const META = [
  { Icon: BarChart3,     accent: "#818cf8", rgb: "129,140,248" },  // analytics
  { Icon: Brain,         accent: "#a78bfa", rgb: "167,139,250" },  // AI
  { Icon: BookOpen,      accent: "#34d399", rgb: "52,211,153" },   // journal
  { Icon: Wifi,          accent: "#fbbf24", rgb: "251,191,36" },   // sync
  { Icon: Shield,        accent: "#fb7185", rgb: "251,113,133" },  // risk
  { Icon: Calculator,    accent: "#38bdf8", rgb: "56,189,248" },   // calculator
  { Icon: GraduationCap, accent: "#818cf8", rgb: "129,140,248" },  // academy
  { Icon: FlaskConical,  accent: "#fb7185", rgb: "251,113,133" },  // backtesting
  { Icon: Target,        accent: "#34d399", rgb: "52,211,153" },   // goals
];

// Mini-vizual decorativ (schimbă forma în funcție de tip) — pur estetic.
function MockVisual({ index, rgb }: { index: number; rgb: string }) {
  const kind = index % 3; // 0 = chart, 1 = bars, 2 = grid
  const stroke = `rgb(${rgb})`;
  if (kind === 0) {
    return (
      <svg viewBox="0 0 320 160" className="w-full h-full">
        <defs>
          <linearGradient id={`fc-g-${index}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 130 C40 120 60 90 90 95 C120 100 140 60 170 55 C200 50 220 70 250 40 C280 15 300 25 320 10"
          fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M0 130 C40 120 60 90 90 95 C120 100 140 60 170 55 C200 50 220 70 250 40 C280 15 300 25 320 10 L320 160 L0 160 Z"
          fill={`url(#fc-g-${index})`} />
        <circle cx="320" cy="10" r="4" fill={stroke} />
      </svg>
    );
  }
  if (kind === 1) {
    const bars = [50, 80, 65, 100, 78, 92, 60, 110, 88];
    return (
      <svg viewBox="0 0 320 160" className="w-full h-full">
        {bars.map((h, i) => (
          <rect key={i} x={i * 35 + 6} y={150 - h} width={22} height={h} rx={4}
            fill={stroke} opacity={0.35 + (h / 110) * 0.5} />
        ))}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 320 160" className="w-full h-full">
      {Array.from({ length: 4 }).map((_, r) =>
        Array.from({ length: 8 }).map((_, c) => {
          const v = Math.abs(Math.sin(r * 1.7 + c * 0.9));
          return <rect key={`${r}-${c}`} x={c * 39 + 5} y={r * 38 + 5} width={34} height={33} rx={5}
            fill={stroke} opacity={0.08 + v * 0.5} />;
        })
      )}
    </svg>
  );
}

export function FeatureCarousel({ items }: { items: FeatureSlide[] }) {
  const [i, setI] = React.useState(0);
  const [dir, setDir] = React.useState(1);
  const [paused, setPaused] = React.useState(false);
  const n = items.length;

  const go = React.useCallback((next: number) => {
    setDir(next > i || (i === n - 1 && next === 0) ? 1 : -1);
    setI((next + n) % n);
  }, [i, n]);

  React.useEffect(() => {
    if (paused) return;
    const id = setInterval(() => { setDir(1); setI((p) => (p + 1) % n); }, 4200);
    return () => clearInterval(id);
  }, [paused, n]);

  const meta = META[i % META.length];
  const Icon = meta.Icon;
  const cur = items[i] ?? { title: "", desc: "" };

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ perspective: "1200px" }}
    >
      {/* Glow în spate, în culoarea slide-ului */}
      <div
        className="absolute -inset-6 rounded-[2rem] blur-3xl opacity-40 pointer-events-none transition-colors duration-700"
        style={{ background: `radial-gradient(ellipse at 30% 30%, rgba(${meta.rgb},0.18), transparent 70%)` }}
      />

      <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/70 backdrop-blur-xl shadow-2xl shadow-black/50">
        {/* linie neon sus, colorată */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${meta.accent}, transparent)` }} />

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={i}
            custom={dir}
            initial={{ opacity: 0, x: dir * 60, rotateY: dir * 8 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: dir * -60, rotateY: dir * -8 }}
            transition={{ duration: 0.45, ease: [0.22, 0.68, 0, 1] }}
            className="grid md:grid-cols-2 gap-6 p-7 md:p-10 items-center"
          >
            {/* Stânga: text */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0"
                  style={{ background: `rgba(${meta.rgb},0.12)`, borderColor: `rgba(${meta.rgb},0.3)` }}
                >
                  <Icon className="w-7 h-7" style={{ color: meta.accent }} />
                </div>
                <span className="text-5xl font-black font-mono leading-none" style={{ color: `rgba(${meta.rgb},0.25)` }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-zinc-50 mb-3 tracking-tight">{cur.title}</h3>
              <p className="text-zinc-400 leading-relaxed text-[15px]">{cur.desc}</p>
            </div>

            {/* Dreapta: vizual mock 3D */}
            <div
              className="relative rounded-2xl border border-zinc-800/60 bg-zinc-950/50 p-5 h-[220px] overflow-hidden"
              style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(${meta.rgb},0.06)` }}
            >
              <div className="flex items-center gap-1.5 mb-4">
                <div className="w-2 h-2 rounded-full bg-zinc-700" />
                <div className="w-2 h-2 rounded-full bg-zinc-700" />
                <div className="w-2 h-2 rounded-full bg-zinc-700" />
              </div>
              <div className="h-[140px]">
                <MockVisual index={i} rgb={meta.rgb} />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Săgeți */}
        <button
          onClick={() => go(i - 1)}
          aria-label="prev"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-zinc-700/60 bg-zinc-900/80 backdrop-blur flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => go(i + 1)}
          aria-label="next"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-zinc-700/60 bg-zinc-900/80 backdrop-blur flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 mt-5">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => go(idx)}
            aria-label={`slide ${idx + 1}`}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: idx === i ? 28 : 8,
              background: idx === i ? META[idx % META.length].accent : "rgb(63,63,70)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
