"use client";

import * as React from "react";

// ── Sparkline ────────────────────────────────────────────────────────────────
//
// O curbă mică, fără axe și fără etichete: forma contează, nu valorile.
//
// `traseaza` o face să se DESENEZE de la stânga la dreapta la prima apariție,
// în loc să apară gata trasată. E diferența dintre un grafic lipit și un
// instrument care tocmai a măsurat ceva. Lungimea drumului se măsoară după
// montare (`getTotalLength`) și se dă mai departe în CSS ca `--lung` — de
// acolo o ia animația `.tg-trasare`.

export function Sparkline({
  data,
  color = "var(--accent)",
  width = 72,
  height = 28,
  filled = false,
  traseaza = false,
  intarziere = 0,
  className,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  filled?: boolean;
  /** Desenează linia la apariție. */
  traseaza?: boolean;
  /** Întârziere înainte de trasare, ms. */
  intarziere?: number;
  className?: string;
}) {
  const linie = React.useRef<SVGPathElement>(null);

  React.useEffect(() => {
    if (!traseaza) return;
    const el = linie.current;
    if (!el) return;
    try {
      el.style.setProperty("--lung", String(Math.ceil(el.getTotalLength())));
    } catch {
      // `getTotalLength` aruncă în medii fără layout (jsdom, capturi). Fără
      // lungime, animația folosește valoarea implicită din CSS și tot arată
      // rezonabil — nu merită un `if` pe fiecare cale.
    }
  }, [traseaza, data]);

  if (data.length < 2) return <div style={{ width, height }} className={className} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const puncte = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - ((v - min) / range) * (height - 2) - 1,
  ] as const);

  const drum = puncte.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const suprafata = `${drum} L ${width} ${height} L 0 ${height} Z`;
  // Id-ul gradientului trebuie să fie unic pe pagină: două curbe cu același id
  // ar folosi amândouă prima definiție.
  const idGrad = React.useId().replace(/:/g, "");

  return (
    <svg width={width} height={height} className={className} style={{ overflow: "visible" }} aria-hidden>
      <defs>
        <linearGradient id={idGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {filled && <path d={suprafata} fill={`url(#${idGrad})`} />}
      <path
        ref={linie}
        d={drum}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={traseaza ? "tg-trasare" : undefined}
        style={traseaza ? ({ "--intarziere": `${intarziere}ms` } as React.CSSProperties) : undefined}
      />
    </svg>
  );
}
