"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ParallaxScene, ParallaxLayer } from "@/components/landing/parallax";

// ── Hero cinematic ───────────────────────────────────────────────────────────
// Principiul de compoziție: textul trăiește în spațiu negativ CURAT, iar drama
// vizuală stă jos, ca un orizont. Imaginea nu mai concurează cu titlul — e
// gradată puternic (desaturată + întunecată) și mascată să dispară complet în
// treimea de sus. Patru straturi reținute în locul a opt zgomotoase.

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Nebuloasă rece (canvas, 1 rAF) ───────────────────────────────────────────
// Doar ceață + stele, în paleta de accent. Fără portocaliu/embers: culoarea
// caldă ieșea din paleta de brand și făcea imaginea „murdară".
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
      { x: 0.30, y: 0.35, hue: "109,117,246", dx: 0.05, dy: 0.02, px: 0, py: 0 },
      { x: 0.70, y: 0.55, hue: "139,92,246",  dx: -0.04, dy: 0.02, px: 0, py: 0 },
    ];

    function init() {
      const p = canvas!.parentElement;
      w = p ? p.clientWidth : window.innerWidth;
      h = p ? p.clientHeight : 700;
      canvas!.width = Math.floor(w * dpr); canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = w + "px"; canvas!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.min(90, Math.round((w * h) / 18000)) }, () => ({
        x: Math.random() * w, y: Math.random() * h * 0.7, r: Math.random() * 1.1 + 0.2,
        a: Math.random(), tw: Math.random() * 0.012 + 0.003,
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
        g.addColorStop(0, `rgba(${f.hue},0.045)`); g.addColorStop(1, `rgba(${f.hue},0)`);
        ctx!.fillStyle = g; ctx!.fillRect(0, 0, w, h);
      }
      for (const s of stars) {
        if (!rm) { s.a += s.tw; if (s.a > 1 || s.a < 0) s.tw *= -1; }
        ctx!.globalAlpha = 0.15 + Math.abs(s.a) * 0.4;
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

// ── Orizont: zid de candele stilizat, jos, ca linie de teren ─────────────────
// Fallback când imaginea lipsește — dar și el trăieşte DOAR jos.
function CandleHorizon() {
  const N = 34;
  const candles = React.useMemo(() => {
    let base = 0.45;
    return Array.from({ length: N }, () => {
      base += (Math.random() - 0.42) * 0.09;
      base = Math.max(0.14, Math.min(0.88, base));
      return { base, up: Math.random() > 0.42, h: 18 + Math.random() * 40 };
    });
  }, []);
  return (
    <div className="absolute inset-x-0 bottom-0 h-[42%]"
      style={{ maskImage: "linear-gradient(to top, #000 20%, transparent 95%)", WebkitMaskImage: "linear-gradient(to top, #000 20%, transparent 95%)" }}>
      {candles.map((c, i) => {
        // Verde/roșu aici e semantic (bull/bear), nu decor — singura excepție.
        const col = c.up ? "52,211,153" : "251,92,114";
        return (
          <div key={i} className="absolute bottom-0" style={{ left: `${(i / N) * 100}%`, width: `${(100 / N) * 0.55}%` }}>
            <div className="rounded-[1px]" style={{
              height: c.h + c.base * 60,
              background: `linear-gradient(180deg, rgba(${col},0.30), rgba(${col},0.06))`,
              boxShadow: `0 0 14px rgba(${col},0.14)`,
            }} />
          </div>
        );
      })}
    </div>
  );
}

// ── Compunerea ───────────────────────────────────────────────────────────────
export function HeroCinematic() {
  const [imgOk, setImgOk] = React.useState(true);

  return (
    <ParallaxScene className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* L1 — nebuloasă rece, foarte discretă */}
      <div className="absolute inset-0" style={{ opacity: 0.5 }}><NebulaCanvas /></div>

      {/* L2 — imaginea ca ORIZONT: gradată tare, mascată să dispară sus.
             Titlul stă peste canvas curat, deci contrastul e garantat. */}
      {imgOk ? (
        <ParallaxLayer depth={10} className="absolute inset-0">
          <motion.img
            src="/hero-battle.jpg"
            alt=""
            aria-hidden
            onError={() => setImgOk(false)}
            className="absolute inset-x-0 bottom-0 h-[72%] w-full object-cover select-none"
            style={{
              objectPosition: "center 28%",
              filter: "grayscale(0.62) brightness(0.34) contrast(1.18)",
              maskImage: "linear-gradient(to top, #000 0%, rgba(0,0,0,0.72) 26%, rgba(0,0,0,0.22) 52%, transparent 76%)",
              WebkitMaskImage: "linear-gradient(to top, #000 0%, rgba(0,0,0,0.72) 26%, rgba(0,0,0,0.22) 52%, transparent 76%)",
            }}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 0.85, scale: [1.04, 1.08, 1.04] }}
            transition={{ opacity: { duration: 1.4, ease: "easeOut" }, scale: { duration: 30, repeat: Infinity, ease: "easeInOut" } }}
          />
        </ParallaxLayer>
      ) : (
        <ParallaxLayer depth={14} className="absolute inset-0"><CandleHorizon /></ParallaxLayer>
      )}

      {/* L3 — o singură sursă de lumină: fascicul de accent de sub orizont.
             Momentul „semnătură": pare că scena e luminată din spate. */}
      <div className="absolute inset-x-0 bottom-[26%] h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(109,117,246,0.5) 35%, rgba(167,139,250,0.55) 50%, rgba(109,117,246,0.5) 65%, transparent)" }} />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[20%] w-[70%] h-40 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(109,117,246,0.16), transparent 70%)" }} />

      {/* L4 — vignetă: închide marginile ca o lentilă, ține ochiul în centru */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 42%, transparent 30%, rgba(7,8,12,0.55) 82%)" }} />
      {/* Fade jos, ca secțiunea următoare să se lege fără cusătură */}
      <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to top, #07080c 10%, transparent)" }} />
    </ParallaxScene>
  );
}
