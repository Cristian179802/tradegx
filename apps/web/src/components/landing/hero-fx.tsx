"use client";

import * as React from "react";
import { motion } from "framer-motion";

// ── Efecte hero cu temă trading ──────────────────────────────────────────────
// Grafic live pe canvas (o singură buclă rAF = performant), bandă de cotații și
// pilule de prețuri care plutesc. Respectă prefers-reduced-motion.

// ── Grafic live streaming (canvas) ───────────────────────────────────────────
export function LiveChartCanvas({ className }: { className?: string }) {
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    const COUNT = 90;
    const vals: number[] = [];
    let price = 0.5;
    const nextVal = () => {
      price += (Math.random() - 0.5) * 0.08;
      price = Math.max(0.12, Math.min(0.88, price));
      return price;
    };
    for (let i = 0; i < COUNT + 2; i++) vals.push(nextVal());

    let offset = 0;
    const speed = 0.55; // px/frame

    function resize() {
      const parent = canvas!.parentElement;
      w = parent ? parent.clientWidth : window.innerWidth;
      h = parent ? parent.clientHeight : 480;
      canvas!.width = w * dpr; canvas!.height = h * dpr;
      canvas!.style.width = w + "px"; canvas!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      const step = w / COUNT;
      ctx!.clearRect(0, 0, w, h);

      const yOf = (v: number) => h * 0.25 + (1 - v) * h * 0.5;
      const pts: [number, number][] = vals.map((v, i) => [i * step - offset, yOf(v)]);

      // aria (gradient)
      const grad = ctx!.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "rgba(52,211,153,0.16)");
      grad.addColorStop(1, "rgba(52,211,153,0)");
      ctx!.beginPath();
      ctx!.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        const [x, y] = pts[i]; const [px, py] = pts[i - 1];
        ctx!.bezierCurveTo(px + step / 2, py, x - step / 2, y, x, y);
      }
      ctx!.lineTo(pts[pts.length - 1][0], h);
      ctx!.lineTo(pts[0][0], h);
      ctx!.closePath();
      ctx!.fillStyle = grad;
      ctx!.fill();

      // linia cu glow
      ctx!.beginPath();
      ctx!.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        const [x, y] = pts[i]; const [px, py] = pts[i - 1];
        ctx!.bezierCurveTo(px + step / 2, py, x - step / 2, y, x, y);
      }
      ctx!.strokeStyle = "#34d399";
      ctx!.lineWidth = 2;
      ctx!.shadowColor = "rgba(52,211,153,0.7)";
      ctx!.shadowBlur = 14;
      ctx!.stroke();
      ctx!.shadowBlur = 0;

      // punct la vârful (ultimul punct vizibil)
      const last = pts[COUNT];
      if (last) {
        ctx!.beginPath(); ctx!.arc(last[0], last[1], 3.5, 0, Math.PI * 2);
        ctx!.fillStyle = "#6ee7b7"; ctx!.fill();
        ctx!.beginPath(); ctx!.arc(last[0], last[1], 8, 0, Math.PI * 2);
        ctx!.fillStyle = "rgba(52,211,153,0.18)"; ctx!.fill();
      }

      if (!reduce) {
        offset += speed;
        if (offset >= step) { offset -= step; vals.shift(); vals.push(nextVal()); }
      }
      raf = requestAnimationFrame(draw);
    }
    let raf = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} className={className} />;
}

// ── Bandă de cotații (ticker tape) ───────────────────────────────────────────
const TICKERS = [
  { s: "EUR/USD", p: "1.0842", c: "+0.12%", up: true },
  { s: "GBP/USD", p: "1.2710", c: "-0.08%", up: false },
  { s: "XAU/USD", p: "2,340.5", c: "+0.45%", up: true },
  { s: "BTC/USD", p: "64,210", c: "+1.24%", up: true },
  { s: "USD/JPY", p: "156.82", c: "-0.20%", up: false },
  { s: "US30", p: "39,120", c: "+0.31%", up: true },
  { s: "NAS100", p: "18,450", c: "+0.62%", up: true },
  { s: "GBP/JPY", p: "199.34", c: "+0.15%", up: true },
  { s: "USD/CAD", p: "1.3688", c: "-0.11%", up: false },
  { s: "ETH/USD", p: "3,410", c: "+0.87%", up: true },
];

export function TickerTape() {
  const row = [...TICKERS, ...TICKERS];
  return (
    <div className="relative overflow-hidden border-y border-zinc-800/50 bg-zinc-950/40 backdrop-blur-sm">
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#08080b] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#08080b] to-transparent z-10 pointer-events-none" />
      <motion.div className="flex gap-6 py-2 w-max" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 32, repeat: Infinity, ease: "linear" }}>
        {row.map((t, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0 text-xs">
            <span className="font-bold text-zinc-300">{t.s}</span>
            <span className="font-mono text-zinc-400">{t.p}</span>
            <span className={`font-mono font-bold ${t.up ? "text-emerald-400" : "text-rose-400"}`}>{t.up ? "▲" : "▼"} {t.c}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ── Pilule de prețuri care plutesc ───────────────────────────────────────────
export function FloatingTickers() {
  const pills = [
    { s: "XAU/USD", p: "2,340", up: true, cls: "top-[24%] left-[6%]", d: 0 },
    { s: "BTC", p: "64,210", up: true, cls: "top-[38%] right-[7%]", d: 1.2 },
    { s: "EUR/USD", p: "1.0842", up: true, cls: "bottom-[30%] left-[10%]", d: 0.6 },
    { s: "US30", p: "39,120", up: false, cls: "bottom-[36%] right-[11%]", d: 1.8 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none hidden lg:block">
      {pills.map((p) => (
        <motion.div
          key={p.s}
          className={`absolute ${p.cls}`}
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 5 + p.d, repeat: Infinity, ease: "easeInOut", delay: p.d }}
        >
          <div className="flex items-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-900/70 backdrop-blur-md px-3 py-2 shadow-xl shadow-black/40">
            <span className={`w-1.5 h-1.5 rounded-full ${p.up ? "bg-emerald-400" : "bg-rose-400"} animate-pulse`} />
            <span className="text-[11px] font-bold text-zinc-300">{p.s}</span>
            <span className="text-[11px] font-mono text-zinc-400">{p.p}</span>
            <span className={`text-[11px] ${p.up ? "text-emerald-400" : "text-rose-400"}`}>{p.up ? "▲" : "▼"}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
