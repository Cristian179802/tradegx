import Link from "next/link";
import { ArrowRight } from "lucide-react";

// ── EmptyState ilustrat ─────────────────────────────────────────────────────
// Înlocuiește paginile goale text-only cu o ilustrație SVG pe tema site-ului
// + titlu + descriere + acțiune ghidată. Prima impresie contează.

function ChartIllustration() {
  return (
    <svg viewBox="0 0 200 120" className="w-44 h-auto mx-auto" aria-hidden>
      {/* Ramă chart */}
      <rect x="8" y="8" width="184" height="104" rx="12" fill="#18181b" stroke="#27272a" />
      {/* Grid subtil */}
      {[34, 60, 86].map((y) => (
        <line key={y} x1="16" x2="184" y1={y} y2={y} stroke="#27272a" strokeDasharray="2 5" strokeWidth="0.8" />
      ))}
      {/* Lumânări fantomă */}
      {[
        { x: 34, y: 55, h: 22, w: false },
        { x: 58, y: 45, h: 28, w: true },
        { x: 82, y: 38, h: 24, w: true },
        { x: 106, y: 50, h: 20, w: false },
        { x: 130, y: 36, h: 26, w: true },
        { x: 154, y: 28, h: 24, w: true },
      ].map((c, i) => (
        <g key={i} opacity={0.55 + i * 0.07}>
          <line x1={c.x} x2={c.x} y1={c.y - 8} y2={c.y + c.h + 8} stroke={c.w ? "#10b981" : "#f43f5e"} strokeWidth="1.4" />
          <rect x={c.x - 5} y={c.y} width="10" height={c.h} rx="1.5" fill={c.w ? "#10b981" : "#f43f5e"} />
        </g>
      ))}
      {/* Linie de trend indigo */}
      <polyline
        points="24,88 58,74 82,64 106,70 130,52 154,44 180,30"
        fill="none"
        stroke="#818cf8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="3 4"
        opacity="0.9"
      />
      {/* Sparkle */}
      <circle cx="180" cy="30" r="3.5" fill="#818cf8">
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  hint,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/80 px-8 py-12 text-center">
      <ChartIllustration />
      <h3 className="mt-6 text-sm font-black text-zinc-200">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-zinc-500 max-w-md mx-auto">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-500/20 transition-colors"
        >
          {actionLabel} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
      {hint && <p className="mt-4 text-[10px] text-zinc-600">{hint}</p>}
    </div>
  );
}
