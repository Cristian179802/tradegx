"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ParallaxScene, ParallaxLayer } from "@/components/landing/parallax";

// ── Hero cinematic (institutional) ───────────────────────────────────────────
// Ziduri de candele roșu/verde, embers în centru, etichete SMC, nebula.
// Slot pentru imagine reală: pune un render în /public/hero-battle.jpg și apare
// automat ca centru al scenei (behind text). Totul pe canvas/transform (GPU).

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Nebula + stele + ceață (canvas, 1 rAF, ușor) ─────────────────────────────
function NebulaCanvas() {
  const ref = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const rm = reduced();
    let w = 0, h = 0, raf = 0;
    type Star = { x: number; y: number; r: number; a: number; tw: number };
    let stars: Star[] = [];
    const fog = [
      { x: 0.28, y: 0.4, hue: "99,102,241", dx: 0.06, dy: 0.03, px: 0, py: 0 },
      { x: 0.72, y: 0.5, hue: "139,92,246", dx: -0.05, dy: 0.03, px: 0, py: 0 },
    ];

    function init() {
      const p = canvas!.parentElement;
      w = p ? p.clientWidth : window.innerWidth;
      h = p ? p.clientHeight : 700;
      canvas!.width = Math.floor(w * dpr); canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = w + "px"; canvas!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.min(120, Math.round((w * h) / 14000)) }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.2 + 0.2,
        a: Math.random(), tw: Math.random() * 0.015 + 0.003,
      }));
      for (const f of fog) { f.px = f.x * w; f.py = f.y * h; }
    }
    init();
    window.addEventListener("resize", init);

    function frame() {
      ctx!.clearRect(0, 0, w, h);
      for (const f of fog) {
        if (!rm) { f.px += f.dx; f.py += f.dy; const rr = Math.max(w, h) * 0.55; if (f.px < -rr) f.px = w + rr; if (f.px > w + rr) f.px = -rr; }
        const rr = Math.max(w, h) * 0.55;
        const g = ctx!.createRadialGradient(f.px, f.py, 0, f.px, f.py, rr);
        g.addColorStop(0, `rgba(${f.hue},0.05)`); g.addColorStop(1, `rgba(${f.hue},0)`);
        ctx!.fillStyle = g; ctx!.fillRect(0, 0, w, h);
      }
      for (const s of stars) {
        if (!rm) { s.a += s.tw; if (s.a > 1 || s.a < 0) s.tw *= -1; }
        ctx!.globalAlpha = 0.2 + Math.abs(s.a) * 0.5;
        ctx!.beginPath(); ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = "#c7d2fe"; ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      if (!rm) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", init); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

// ── Zid de candele (o parte) — dens, cu glow, perspectivă ────────────────────
function CandleWall({ side }: { side: "left" | "right" }) {
  const bull = side === "right";
  const col = bull ? "52,211,153" : "244,63,94";
  const N = 16;
  const candles = React.useMemo(() => {
    let base = 0.5;
    return Array.from({ length: N }, (_, i) => {
      base += (bull ? 1 : -1) * (0.02 + Math.random() * 0.05);
      base = Math.max(0.12, Math.min(0.9, base));
      const bodyUp = Math.random() > (bull ? 0.32 : 0.68);
      const depth = i / N; // spre centru = mai aproape
      const near = side === "right" ? depth : 1 - depth;
      return { base, bodyUp, near, h: 26 + Math.random() * 46 };
    });
  }, [bull, side]);

  return (
    <div className={`absolute top-[12%] bottom-[22%] ${side === "left" ? "left-0" : "right-0"} w-[42%] md:w-[36%]`}
      style={{ perspective: "700px", maskImage: `linear-gradient(to ${side === "left" ? "right" : "left"}, #000 40%, transparent)`, WebkitMaskImage: `linear-gradient(to ${side === "left" ? "right" : "left"}, #000 40%, transparent)` }}>
      <div className="absolute inset-0" style={{ transform: side === "left" ? "rotateY(18deg)" : "rotateY(-18deg)", transformOrigin: side === "left" ? "left center" : "right center" }}>
        {candles.map((c, i) => {
          const x = side === "right" ? (100 - (i + 1) * (100 / N)) : (i * (100 / N));
          const yTop = (1 - c.base) * 60; // %
          const glow = 0.15 + c.near * 0.45;
          const wcol = c.bodyUp ? col : (bull ? "16,120,90" : "150,40,55");
          return (
            <div key={i} className="absolute" style={{ left: `${x}%`, top: `${yTop}%`, width: `${100 / N * 0.58}%` }}>
              <div className="mx-auto w-px" style={{ height: 10 + c.near * 10, background: `rgba(${col},${0.4 + c.near * 0.4})` }} />
              <div className="rounded-[2px]" style={{
                height: c.h + c.near * 22,
                background: `linear-gradient(180deg, rgba(${wcol},${glow + 0.25}), rgba(${wcol},${glow}))`,
                boxShadow: `0 0 ${8 + c.near * 16}px rgba(${col},${glow})`,
                filter: c.near < 0.35 ? "blur(1.2px)" : "none",
              }} />
            </div>
          );
        })}
      </div>
      {/* lumină laterală */}
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at ${side === "left" ? "0% 50%" : "100% 50%"}, rgba(${col},0.14), transparent 60%)` }} />
    </div>
  );
}

// ── Embers în centru (canvas ușor) ───────────────────────────────────────────
function Embers() {
  const ref = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    if (reduced()) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0, h = 0, raf = 0;
    type P = { x: number; y: number; vy: number; vx: number; r: number; life: number; max: number; hot: boolean };
    let ps: P[] = [];
    function init() {
      const p = canvas!.parentElement; w = p ? p.clientWidth : 400; h = p ? p.clientHeight : 400;
      canvas!.width = Math.floor(w * dpr); canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = w + "px"; canvas!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    init(); window.addEventListener("resize", init);
    function spawn(): P {
      return { x: w / 2 + (Math.random() - 0.5) * w * 0.28, y: h * 0.62 + Math.random() * 40, vy: -(0.3 + Math.random() * 1.1), vx: (Math.random() - 0.5) * 0.6, r: 0.6 + Math.random() * 1.8, life: 0, max: 60 + Math.random() * 80, hot: Math.random() > 0.5 };
    }
    for (let i = 0; i < 26; i++) { const p = spawn(); p.life = Math.random() * p.max; ps.push(p); }
    function frame() {
      ctx!.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.x += p.vx; p.y += p.vy; p.vy *= 0.995; p.life++;
        if (p.life > p.max) Object.assign(p, spawn());
        const t = 1 - p.life / p.max;
        ctx!.globalAlpha = t * 0.8;
        ctx!.beginPath(); ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = p.hot ? "#fbbf24" : "#f97316";
        ctx!.shadowColor = p.hot ? "rgba(251,191,36,0.8)" : "rgba(249,115,22,0.8)";
        ctx!.shadowBlur = 6; ctx!.fill();
      }
      ctx!.globalAlpha = 1; ctx!.shadowBlur = 0;
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", init); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

// ── Etichete SMC (ca în referință) ───────────────────────────────────────────
function SmcLabel({ text, cls, color, box }: { text: string; cls: string; color: "red" | "green" | "zinc"; box?: boolean }) {
  const c = color === "red" ? "244,63,94" : color === "green" ? "52,211,153" : "161,161,170";
  return (
    <motion.div className={`absolute ${cls}`} animate={{ opacity: [0.45, 0.8, 0.45] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
      <div className="text-[9px] md:text-[10px] font-black tracking-widest uppercase" style={{ color: `rgb(${c})`, textShadow: `0 0 12px rgba(${c},0.5)` }}>{text}</div>
      {box && <div className="mt-1 rounded-sm border border-dashed" style={{ width: 70, height: 26, borderColor: `rgba(${c},0.5)`, background: `rgba(${c},0.06)` }} />}
    </motion.div>
  );
}

// ── Slot imagine reală (opțional) ────────────────────────────────────────────
function BattleImage() {
  const [ok, setOk] = React.useState(true);
  if (!ok) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/hero-battle.jpg"
      alt=""
      aria-hidden
      onError={() => setOk(false)}
      className="absolute left-1/2 top-[54%] -translate-x-1/2 -translate-y-1/2 w-[min(1100px,96%)] max-w-none object-contain select-none"
      style={{ opacity: 0.9, maskImage: "radial-gradient(ellipse at 50% 45%, #000 55%, transparent 78%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 45%, #000 55%, transparent 78%)" }}
    />
  );
}

// ── Compunerea ───────────────────────────────────────────────────────────────
export function HeroCinematic() {
  return (
    <ParallaxScene className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* L1 nebula */}
      <div className="absolute inset-0" style={{ opacity: 0.85 }}><NebulaCanvas /></div>

      {/* L2 ziduri de candele */}
      <ParallaxLayer depth={18} className="absolute inset-0">
        <CandleWall side="left" />
        <CandleWall side="right" />
      </ParallaxLayer>

      {/* L3 imagine reală (dacă există) + embers */}
      <ParallaxLayer depth={10} className="absolute inset-0">
        <BattleImage />
        <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-[60%] h-[55%]"><Embers /></div>
      </ParallaxLayer>

      {/* L4 etichete SMC */}
      <ParallaxLayer depth={26} className="absolute inset-0 hidden sm:block">
        <SmcLabel text="Bearish Order Block" cls="top-[16%] left-[3%]" color="red" box />
        <SmcLabel text="FVG" cls="top-[40%] left-[4%]" color="red" />
        <SmcLabel text="Bullish Order Block" cls="top-[26%] right-[3%]" color="green" box />
        <SmcLabel text="FVG" cls="top-[46%] right-[5%]" color="green" />
        <SmcLabel text="Liquidity" cls="top-[40%] left-1/2 -translate-x-1/2" color="zinc" />
        <SmcLabel text="BOS" cls="top-[66%] left-1/2 -translate-x-1/2" color="zinc" />
      </ParallaxLayer>

      {/* miez de energie */}
      <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(251,191,36,0.28), rgba(249,115,22,0.12), transparent 70%)" }} />

      {/* vignette ca textul să iasă */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 34%, transparent 26%, rgba(8,8,11,0.5) 72%), linear-gradient(to bottom, rgba(8,8,11,0.4), transparent 20%, transparent 70%, rgba(8,8,11,0.85))" }} />
    </ParallaxScene>
  );
}
