"use client";

import * as React from "react";
import { motion } from "framer-motion";

// ── Scena VFX pentru paginile de autentificare ───────────────────────────────
// „Terminal de acces": particule-date conectate (canvas rAF), aurore, grilă în
// perspectivă, HUD. Doar transform/opacity + un singur canvas ieftin = zero lag.

// Câmp de particule conectate (constelație de date)
function ParticleNet() {
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let running = true;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;

    const N = 64;
    const pts = Array.from({ length: N }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00022,
      vy: (Math.random() - 0.5) * 0.00022,
      r: 0.8 + Math.random() * 1.4,
    }));

    function resize() {
      if (!canvas) return;
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const LINK = 130;

    function frame() {
      if (!running) return;
      ctx!.clearRect(0, 0, W, H);

      for (const p of pts) {
        if (!reduced) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > 1) p.vx *= -1;
          if (p.y < 0 || p.y > 1) p.vy *= -1;
        }
      }

      // linii între particule apropiate
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = (pts[i].x - pts[j].x) * W;
          const dy = (pts[i].y - pts[j].y) * H;
          const d = Math.hypot(dx, dy);
          if (d < LINK) {
            const a = (1 - d / LINK) * 0.14;
            ctx!.strokeStyle = `rgba(129,140,248,${a})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(pts[i].x * W, pts[i].y * H);
            ctx!.lineTo(pts[j].x * W, pts[j].y * H);
            ctx!.stroke();
          }
        }
      }
      // puncte
      for (const p of pts) {
        ctx!.fillStyle = "rgba(165,180,252,0.55)";
        ctx!.beginPath();
        ctx!.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      if (!reduced) raf = requestAnimationFrame(frame);
    }
    frame();

    const onVis = () => {
      running = document.visibilityState === "visible";
      if (running && !reduced) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full" aria-hidden />;
}

// Fundalul complet al paginilor de auth
export function AuthBackdrop() {
  return (
    <div className="fixed inset-0 pointer-events-none" aria-hidden>
      {/* grilă în perspectivă jos */}
      <div className="tg-grid-floor" />
      {/* constelația de date */}
      <ParticleNet />
      {/* aurore */}
      <motion.div animate={{ x: [0, 30, 0], y: [0, -24, 0] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[8%] left-[18%] w-[480px] h-[480px] bg-indigo-600/12 rounded-full blur-[120px]" />
      <motion.div animate={{ x: [0, -36, 0], y: [0, 28, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[6%] right-[14%] w-[420px] h-[420px] bg-violet-600/10 rounded-full blur-[120px]" />
      {/* linie sus */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
      {/* rame de colț pe viewport */}
      <div className="absolute inset-4 hidden md:block">
        {[
          { top: 0, left: 0, bt: true, bl: true }, { top: 0, right: 0, bt: true, br: true },
          { bottom: 0, left: 0, bb: true, bl: true }, { bottom: 0, right: 0, bb: true, br: true },
        ].map((c, i) => (
          <span key={i} style={{
            position: "absolute", width: 22, height: 22, opacity: 0.3,
            top: c.top, left: c.left, right: c.right, bottom: c.bottom,
            borderTop: c.bt ? "1.5px solid rgba(129,140,248,0.9)" : undefined,
            borderBottom: c.bb ? "1.5px solid rgba(129,140,248,0.9)" : undefined,
            borderLeft: c.bl ? "1.5px solid rgba(129,140,248,0.9)" : undefined,
            borderRight: c.br ? "1.5px solid rgba(129,140,248,0.9)" : undefined,
          }} />
        ))}
      </div>
    </div>
  );
}

// Readout HUD (decor tehnic, sub logo)
export function AuthHudStrip() {
  return (
    <div className="flex justify-center pointer-events-none select-none" aria-hidden>
      <div className="flex items-center gap-4 font-mono text-[9px] tracking-[0.25em] text-zinc-600 uppercase">
        <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />SECURE CHANNEL</span>
        <span className="opacity-40">|</span>
        <span>TLS 1.3</span>
        <span className="opacity-40">|</span>
        <span className="text-indigo-400/70">AUTH NODE · EU</span>
      </div>
    </div>
  );
}

// Cadru holografic în jurul cardului de login/register: colțuri + fascicul +
// rază de scanare care trece periodic peste card.
export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 0.68, 0, 1] }}
      className="relative"
    >
      {/* glow în spatele cardului */}
      <div className="absolute -inset-6 bg-indigo-600/10 blur-3xl rounded-[2rem] pointer-events-none" aria-hidden />

      <div className="relative rounded-2xl">
        {/* colțuri HUD */}
        <div className="absolute -inset-2 pointer-events-none" aria-hidden>
          {[
            { top: 0, left: 0, bt: true, bl: true }, { top: 0, right: 0, bt: true, br: true },
            { bottom: 0, left: 0, bb: true, bl: true }, { bottom: 0, right: 0, bb: true, br: true },
          ].map((c, i) => (
            <span key={i} style={{
              position: "absolute", width: 16, height: 16, opacity: 0.7,
              top: c.top, left: c.left, right: c.right, bottom: c.bottom,
              borderTop: c.bt ? "1.5px solid rgba(129,140,248,0.9)" : undefined,
              borderBottom: c.bb ? "1.5px solid rgba(129,140,248,0.9)" : undefined,
              borderLeft: c.bl ? "1.5px solid rgba(129,140,248,0.9)" : undefined,
              borderRight: c.br ? "1.5px solid rgba(129,140,248,0.9)" : undefined,
            }} />
          ))}
        </div>

        {/* fascicul sus */}
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent pointer-events-none z-10" aria-hidden />

        {/* raza de scanare (trece la ~7s) */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-10" aria-hidden>
          <motion.div
            initial={{ y: "-120%" }}
            animate={{ y: ["-120%", "1300%"] }}
            transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 5, ease: "linear" }}
            className="absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-indigo-400/[0.07] to-transparent"
          />
        </div>

        {children}
      </div>
    </motion.div>
  );
}
