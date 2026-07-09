"use client";

import * as React from "react";
import { motion, useSpring, useTransform, type MotionValue } from "framer-motion";

// ── Sistem de parallax cu mouse (Apple-quality, springed, GPU) ───────────────

interface ParallaxCtx { mx: MotionValue<number>; my: MotionValue<number> }
const Ctx = React.createContext<ParallaxCtx | null>(null);

export function ParallaxScene({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const mx = useSpring(0, { stiffness: 55, damping: 18, mass: 0.6 });
  const my = useSpring(0, { stiffness: 55, damping: 18, mass: 0.6 });

  React.useEffect(() => {
    // Ascultăm pe window (scena e pointer-events-none) și raportăm la dreptunghiul ei.
    if (window.matchMedia("(pointer: coarse)").matches) return; // fără pe touch
    const onMove = (e: MouseEvent) => {
      const el = ref.current; if (!el) return;
      const r = el.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return; // doar cât e vizibilă scena
      mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
      my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  return (
    <div ref={ref} className={className}>
      <Ctx.Provider value={{ mx, my }}>{children}</Ctx.Provider>
    </div>
  );
}

// depth > 0 se mișcă cu mouse-ul; negativ = sens opus (prim-plan)
export function ParallaxLayer({
  depth = 20, children, className, style,
}: {
  depth?: number; children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  const ctx = React.useContext(Ctx);
  const fx = useSpring(0);
  const fy = useSpring(0);
  const mx = ctx?.mx ?? fx;
  const my = ctx?.my ?? fy;
  const x = useTransform(mx, (v) => v * depth);
  const y = useTransform(my, (v) => v * depth);
  return (
    <motion.div className={className} style={{ ...style, x, y, willChange: "transform" }}>
      {children}
    </motion.div>
  );
}

// ── Buton magnetic (atras spre cursor + sweep de lumină + 3D press) ──────────
export function MagneticButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 170, damping: 14 });
  const y = useSpring(0, { stiffness: 170, damping: 14 });

  function onMove(e: React.MouseEvent) {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.3);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.4);
  }
  function onLeave() { x.set(0); y.set(0); }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x, y }}
      whileTap={{ scale: 0.96 }}
      className={`relative inline-flex ${className ?? ""}`}
    >
      {children}
    </motion.div>
  );
}
