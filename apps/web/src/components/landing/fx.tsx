"use client";

import * as React from "react";
import { motion } from "framer-motion";

// ── Primitive de mișcare reutilizabile (premium, GPU) ────────────────────────

export const EASE = [0.22, 0.68, 0, 1] as const;

const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Reveal la scroll: fade + slide + blur→clar (o singură dată)
export function Reveal({
  children, delay = 0, y = 28, blur = true, className,
}: {
  children: React.ReactNode; delay?: number; y?: number; blur?: boolean; className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: blur ? "blur(10px)" : "blur(0px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// Plutire idle continuă (cardurile „respiră"/se mișcă lent)
export function FloatIdle({
  children, amount = 8, duration = 6, delay = 0, className,
}: {
  children: React.ReactNode; amount?: number; duration?: number; delay?: number; className?: string;
}) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -amount, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    >
      {children}
    </motion.div>
  );
}

// Halou care „respiră" în spatele butoanelor CTA
export function BreathingGlow({ className }: { className?: string }) {
  return (
    <motion.div
      aria-hidden
      className={`absolute -inset-3 rounded-2xl -z-10 pointer-events-none ${className ?? ""}`}
      style={{ background: "radial-gradient(ellipse at center, rgba(99,102,241,0.45), transparent 70%)" }}
      animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.96, 1.04, 0.96] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// ── Fundal ambiental global: particule care plutesc ─────────────────────────
export function MarketBackdrop() {
  const particles = React.useMemo(
    () => Array.from({ length: 14 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 2 + Math.random() * 3,
      dur: 6 + Math.random() * 8,
      delay: Math.random() * 6,
      up: Math.random() > 0.5,
    })), []);

  const reduced = prefersReduced();

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      {/* Aură de fundal (luxury) */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 10%, rgba(99,102,241,0.06), transparent 45%), radial-gradient(ellipse at 85% 60%, rgba(139,92,246,0.05), transparent 50%)" }} />

      {/* Particule care plutesc */}
      {!reduced && particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size, background: p.up ? "rgba(52,211,153,0.5)" : "rgba(129,140,248,0.5)" }}
          animate={{ y: [0, p.up ? -28 : -18, 0], opacity: [0, 0.7, 0] }}
          transition={{ duration: p.dur, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
        />
      ))}
    </div>
  );
}
