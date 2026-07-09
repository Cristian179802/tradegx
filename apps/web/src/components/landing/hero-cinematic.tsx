"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ParallaxScene, ParallaxLayer } from "@/components/landing/parallax";

// ── Hero cinematic: Bull vs Bear + candele 3D + holograme SMC + sferă AI ─────
// Toate straturile în spatele textului. Doar transform/opacity/canvas (GPU).

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Nebula + stele + ceață volumetrică (canvas, 1 rAF) ───────────────────────
function NebulaCanvas() {
  const ref = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rm = reduced();
    let w = 0, h = 0, t = 0, raf = 0;
    type Star = { x: number; y: number; r: number; a: number; tw: number };
    let stars: Star[] = [];
    type Fog = { x: number; y: number; r: number; hue: string; dx: number; dy: number };
    let fog: Fog[] = [];

    function init() {
      const p = canvas!.parentElement;
      w = p ? p.clientWidth : window.innerWidth;
      h = p ? p.clientHeight : 700;
      canvas!.width = w * dpr; canvas!.height = h * dpr;
      canvas!.style.width = w + "px"; canvas!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.round((w * h) / 9000) }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.3 + 0.2,
        a: Math.random(), tw: Math.random() * 0.02 + 0.004,
      }));
      fog = [
        { x: w * 0.25, y: h * 0.35, r: Math.max(w, h) * 0.5, hue: "99,102,241", dx: 0.08, dy: 0.05 },
        { x: w * 0.75, y: h * 0.55, r: Math.max(w, h) * 0.55, hue: "139,92,246", dx: -0.06, dy: 0.04 },
        { x: w * 0.55, y: h * 0.2, r: Math.max(w, h) * 0.4, hue: "56,189,248", dx: 0.05, dy: -0.03 },
      ];
    }
    init();
    window.addEventListener("resize", init);

    function frame() {
      t += 1;
      ctx!.clearRect(0, 0, w, h);
      // ceață volumetrică
      for (const f of fog) {
        if (!rm) { f.x += f.dx; f.y += f.dy; if (f.x < -f.r) f.x = w + f.r; if (f.x > w + f.r) f.x = -f.r; if (f.y < -f.r) f.y = h + f.r; if (f.y > h + f.r) f.y = -f.r; }
        const g = ctx!.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
        g.addColorStop(0, `rgba(${f.hue},0.06)`);
        g.addColorStop(1, `rgba(${f.hue},0)`);
        ctx!.fillStyle = g; ctx!.fillRect(0, 0, w, h);
      }
      // stele
      for (const s of stars) {
        if (!rm) { s.a += s.tw; if (s.a > 1 || s.a < 0) s.tw *= -1; }
        ctx!.globalAlpha = 0.25 + Math.abs(s.a) * 0.6;
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

// ── Candele 3D care „ies din câmpul de luptă" ────────────────────────────────
function Candles3D() {
  const candles = React.useMemo(() => Array.from({ length: 16 }, (_, i) => {
    const up = Math.random() > 0.5;
    const depth = Math.random(); // 0 = departe, 1 = aproape
    return {
      up, depth,
      left: 4 + i * 6 + (Math.random() * 3),
      h: 40 + depth * 150,
      w: 8 + depth * 20,
      blur: (1 - depth) * 3,
      op: 0.15 + depth * 0.4,
      delay: Math.random() * 3,
    };
  }), []);
  return (
    <div className="absolute inset-x-0 bottom-0 h-[62%]" style={{ perspective: "900px" }}>
      {candles.map((c, i) => {
        const col = c.up ? "52,211,153" : "244,63,94";
        return (
          <motion.div
            key={i}
            className="absolute bottom-0 rounded-sm"
            style={{
              left: `${c.left}%`, width: c.w, height: c.h,
              background: `linear-gradient(180deg, rgba(${col},${c.op}) 0%, rgba(${col},${c.op * 0.4}) 100%)`,
              boxShadow: `0 0 ${18 * c.depth}px rgba(${col},${0.5 * c.depth})`,
              filter: `blur(${c.blur}px)`,
              transformOrigin: "bottom",
            }}
            animate={{ scaleY: [1, 1.06, 1], y: [0, -4 * c.depth, 0] }}
            transition={{ duration: 4 + i % 3, repeat: Infinity, ease: "easeInOut", delay: c.delay }}
          >
            {/* fitil */}
            <span className="absolute left-1/2 -translate-x-1/2 -top-3 w-px" style={{ height: 12, background: `rgba(${col},${c.op})` }} />
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Bull & Bear (siluete stilizate + aură + ochi strălucind) ─────────────────
function BullHead() {
  return (
    <svg viewBox="0 0 240 200" className="w-full h-full">
      <g fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
        <path d="M84 78 C52 62 40 28 66 20 C62 44 74 64 96 72" />
        <path d="M156 78 C188 62 200 28 174 20 C178 44 166 64 144 72" />
        <ellipse cx="120" cy="112" rx="56" ry="48" fill="rgba(52,211,153,0.06)" />
        <ellipse cx="120" cy="152" rx="30" ry="22" />
      </g>
      <circle cx="98" cy="104" r="5" fill="#6ee7b7" />
      <circle cx="142" cy="104" r="5" fill="#6ee7b7" />
      <circle cx="98" cy="104" r="10" fill="rgba(52,211,153,0.35)" />
      <circle cx="142" cy="104" r="10" fill="rgba(52,211,153,0.35)" />
    </svg>
  );
}
function BearHead() {
  return (
    <svg viewBox="0 0 240 200" className="w-full h-full">
      <g fill="rgba(244,63,94,0.05)" stroke="#f43f5e" strokeWidth="3" opacity="0.9">
        <circle cx="72" cy="58" r="26" />
        <circle cx="168" cy="58" r="26" />
        <ellipse cx="120" cy="116" rx="62" ry="56" />
        <ellipse cx="120" cy="150" rx="26" ry="20" fill="rgba(244,63,94,0.08)" />
      </g>
      <circle cx="98" cy="108" r="5" fill="#fb7185" />
      <circle cx="142" cy="108" r="5" fill="#fb7185" />
      <circle cx="98" cy="108" r="10" fill="rgba(244,63,94,0.35)" />
      <circle cx="142" cy="108" r="10" fill="rgba(244,63,94,0.35)" />
    </svg>
  );
}

function BullBear() {
  return (
    <>
      {/* Bull — stânga, verde */}
      <motion.div
        className="absolute top-[26%] left-[2%] w-[300px] h-[250px] md:w-[380px] md:h-[320px]"
        style={{ opacity: 0.24 }}
        initial={{ x: -30 }} animate={{ x: [-30, 6, -30] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 blur-3xl" style={{ background: "radial-gradient(circle at 50% 45%, rgba(52,211,153,0.5), transparent 60%)" }} />
        <BullHead />
      </motion.div>
      {/* Bear — dreapta, roșu */}
      <motion.div
        className="absolute top-[28%] right-[2%] w-[300px] h-[250px] md:w-[380px] md:h-[320px]"
        style={{ opacity: 0.24 }}
        initial={{ x: 30 }} animate={{ x: [30, -6, 30] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 blur-3xl" style={{ background: "radial-gradient(circle at 50% 45%, rgba(244,63,94,0.45), transparent 60%)" }} />
        <BearHead />
      </motion.div>

      {/* Coliziune de energie în centru */}
      <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full border"
            style={{ width: 120, height: 120, marginLeft: -60, marginTop: -60, borderColor: "rgba(167,139,250,0.4)" }}
            animate={{ scale: [0.4, 2.4], opacity: [0.5, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeOut", delay: i * 1.05 }}
          />
        ))}
        <motion.div
          className="absolute left-1/2 top-1/2 w-24 h-24 -ml-12 -mt-12 rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle, rgba(167,139,250,0.6), rgba(99,102,241,0.2), transparent 70%)" }}
          animate={{ scale: [0.9, 1.25, 0.9], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </>
  );
}

// ── Sferă AI (Jarvis) — mov, respirând ───────────────────────────────────────
function AISphere() {
  return (
    <div className="absolute top-[16%] right-[16%] hidden lg:block">
      <motion.div
        className="relative w-24 h-24"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 rounded-full blur-2xl" style={{ background: "radial-gradient(circle, rgba(167,139,250,0.7), transparent 70%)" }} />
        <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, rgba(196,181,253,0.9), rgba(124,58,237,0.35) 55%, rgba(76,29,149,0.15) 100%)", boxShadow: "0 0 40px rgba(139,92,246,0.5), inset 0 0 30px rgba(196,181,253,0.4)" }} />
        {[0, 1].map((i) => (
          <motion.div key={i} className="absolute inset-0 rounded-full border border-violet-300/30"
            style={{ transform: `rotateX(70deg) rotateZ(${i * 60}deg)` }}
            animate={{ rotateZ: [i * 60, i * 60 + 360] }}
            transition={{ duration: 8 + i * 4, repeat: Infinity, ease: "linear" }} />
        ))}
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black tracking-widest text-violet-100/80">AI</span>
      </motion.div>
    </div>
  );
}

// ── Holograme SMC care plutesc ───────────────────────────────────────────────
const SMC = [
  { label: "Order Block", cls: "top-[30%] left-[16%]", d: 0 },
  { label: "FVG", cls: "top-[58%] left-[10%]", d: 1 },
  { label: "Liquidity", cls: "top-[22%] right-[24%]", d: 0.5 },
  { label: "BOS", cls: "top-[64%] right-[16%]", d: 1.5 },
  { label: "CHoCH", cls: "top-[46%] left-[24%]", d: 2 },
  { label: "Sweep", cls: "top-[36%] right-[10%]", d: 0.8 },
  { label: "Premium", cls: "top-[70%] left-[40%]", d: 1.2 },
  { label: "Discount", cls: "top-[18%] left-[40%]", d: 1.8 },
];
function SMCHolograms() {
  return (
    <div className="absolute inset-0 hidden md:block">
      {SMC.map((s) => (
        <motion.div
          key={s.label}
          className={`absolute ${s.cls}`}
          animate={{ y: [0, -12, 0], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 6 + s.d, repeat: Infinity, ease: "easeInOut", delay: s.d }}
        >
          <span className="text-[10px] font-bold tracking-wide text-indigo-200/70 bg-indigo-500/10 border border-indigo-400/20 rounded-md px-2 py-1 backdrop-blur-sm"
            style={{ boxShadow: "0 0 20px rgba(99,102,241,0.15)" }}>
            {s.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// ── Compunerea completă ──────────────────────────────────────────────────────
export function HeroCinematic() {
  return (
    <ParallaxScene className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* L1: nebula + stele + ceață */}
      <div className="absolute inset-0" style={{ opacity: 0.9 }}><NebulaCanvas /></div>
      {/* L2: holograme SMC (adânc) */}
      <ParallaxLayer depth={14} className="absolute inset-0"><SMCHolograms /></ParallaxLayer>
      {/* L3: candele 3D */}
      <ParallaxLayer depth={26} className="absolute inset-0"><Candles3D /></ParallaxLayer>
      {/* L4: bull & bear + coliziune */}
      <ParallaxLayer depth={20} className="absolute inset-0"><BullBear /></ParallaxLayer>
      {/* L5: sferă AI */}
      <ParallaxLayer depth={40} className="absolute inset-0"><AISphere /></ParallaxLayer>
      {/* vignette ca textul să iasă în evidență */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 42%, transparent 30%, rgba(8,8,11,0.55) 75%)" }} />
    </ParallaxScene>
  );
}
