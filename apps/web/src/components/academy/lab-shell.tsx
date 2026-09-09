"use client";

import * as React from "react";
import { FlaskConical, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { I18nText, Lang } from "@/lib/academy/types";

// ── Cadrul comun al laboratoarelor ──────────────────────────────────────────
//
// Un laborator nu e o jucărie pusă în pagină. Are trei părți, mereu aceleași:
//
//   1. ce manevrezi        (controalele)
//   2. ce se schimbă       (rezultatul, mare și citibil)
//   3. CE AR TREBUI SĂ OBSERVI  (concluzia — altfel elevul trage de cursoare
//                                și pleacă fără să fi învățat nimic)
//
// Partea 3 e cea pe care majoritatea materialelor educative o omit.

const UI = {
  lab: { ro: "Laborator", en: "Lab" },
  reset: { ro: "Resetează", en: "Reset" },
  notice: { ro: "Ce ar trebui să observi", en: "What you should notice" },
};

export function LabShell({
  title,
  intro,
  notice,
  onReset,
  lang,
  children,
}: {
  title: I18nText;
  intro?: I18nText;
  notice?: React.ReactNode;
  onReset?: () => void;
  lang: Lang;
  children: React.ReactNode;
}) {
  return (
    <section className="my-6 rounded-2xl border border-[color:var(--line-2)] bg-[color:var(--s-2)] overflow-hidden shadow-[var(--el-2),inset_0_1px_0_var(--line-top)]">
      {/* Antet */}
      <header className="flex items-start justify-between gap-3 px-4 md:px-5 py-3.5 border-b border-[color:var(--line-1)] bg-[color:var(--s-3)]">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className="w-7 h-7 shrink-0 rounded-lg grid place-items-center"
            style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-line)" }}
          >
            <FlaskConical className="w-3.5 h-3.5 text-[color:var(--accent)]" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[color:var(--accent)] mb-0.5">
              {UI.lab[lang]}
            </p>
            <h3 className="text-[13.5px] font-bold text-[color:var(--ink-1)] leading-tight">{title[lang]}</h3>
          </div>
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--ink-4)] hover:text-[color:var(--ink-2)] transition-colors px-2 py-1 rounded-md hover:bg-[color:var(--s-4)]"
          >
            <RotateCcw className="w-3 h-3" /> {UI.reset[lang]}
          </button>
        )}
      </header>

      {intro && (
        <p className="px-4 md:px-5 pt-4 text-[13px] leading-relaxed text-[color:var(--ink-3)]">{intro[lang]}</p>
      )}

      <div className="p-4 md:p-5">{children}</div>

      {notice && (
        <footer className="px-4 md:px-5 py-3.5 border-t border-[color:var(--line-1)] bg-[color:var(--s-1)]">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[color:var(--ink-4)] mb-1.5">
            {UI.notice[lang]}
          </p>
          <div className="text-[12.5px] leading-relaxed text-[color:var(--ink-2)]">{notice}</div>
        </footer>
      )}
    </section>
  );
}

// ── Cursor ───────────────────────────────────────────────────────────────────
// Valoarea stă LÂNGĂ etichetă, nu sub cursor: la degete mari pe telefon,
// valoarea de sub cursor e acoperită exact când o miști.

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  hint,
  tone = "accent",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  hint?: string;
  tone?: "accent" | "gain" | "loss";
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const color = tone === "gain" ? "var(--gain)" : tone === "loss" ? "var(--loss)" : "var(--accent)";

  return (
    <label className="block select-none">
      <span className="flex items-baseline justify-between gap-3 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[color:var(--ink-4)]">{label}</span>
        <span className="font-mono text-[13px] font-bold tabular-nums" style={{ color }}>
          {format ? format(value) : value}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="tg-range w-full"
        style={{ ["--tg-range-pct" as string]: `${pct}%`, ["--tg-range-color" as string]: color }}
      />
      {hint && <span className="block mt-1.5 text-[10.5px] text-[color:var(--ink-4)] leading-snug">{hint}</span>}
    </label>
  );
}

/** Cifră mare, cu etichetă. Unitatea de rezultat a laboratoarelor. */
export function Readout({
  label,
  value,
  unit,
  tone = "ink",
  sub,
  big,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "ink" | "gain" | "loss" | "accent";
  sub?: string;
  big?: boolean;
}) {
  const color =
    tone === "gain" ? "var(--gain)" : tone === "loss" ? "var(--loss)" : tone === "accent" ? "var(--accent)" : "var(--ink-1)";
  return (
    <div className="min-w-0">
      {/* NU `truncate`: „Contul după 10 pierderi la rând" depășea cu 8px pe
          telefon și se citea „Contul după 10 pierderi la r…", adică o cifră
          rămasă fără nume. Un rând în plus costă mai puțin. */}
      <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] leading-tight text-[color:var(--ink-4)] mb-1">
        {label}
      </p>
      <p
        className={cn("font-display font-black leading-none tabular-nums", big ? "text-[30px] md:text-[36px]" : "text-[20px]")}
        style={{ color }}
      >
        {value}
        {unit && <span className={cn("font-bold text-[color:var(--ink-4)]", big ? "text-[15px] ml-1" : "text-[11px] ml-0.5")}>{unit}</span>}
      </p>
      {sub && <p className="mt-1 text-[10.5px] text-[color:var(--ink-4)] leading-snug">{sub}</p>}
    </div>
  );
}

/**
 * Umple un șablon: `fill("Riscul e {r}", { r: "1%" })`.
 *
 * De ce există: concluzia unui laborator trebuie să conțină CIFRELE pe care le-a
 * produs elevul, altfel e o propoziție generică pe care o citește o dată și o
 * ignoră. Dar textul trebuie să rămână în dicționare `I18nText`, ca tot restul
 * Academiei — proza scrisă direct în JSX ar ocoli poarta de traduceri și ar
 * lăsa engleza să rămână în urmă fără să afle nimeni.
 *
 * O cheie care lipsește din `vars` rămâne vizibilă ca `{cheie}` în text: mai
 * bine o urmă evidentă în interfață decât o propoziție ciuntită pe tăcute.
 */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** Bară de proporție, pentru „cât din cont” / „cât din scenarii”. */
export function Bar({ pct, tone = "accent" }: { pct: number; tone?: "accent" | "gain" | "loss" }) {
  const color = tone === "gain" ? "var(--gain)" : tone === "loss" ? "var(--loss)" : "var(--accent)";
  return (
    <div className="h-1.5 rounded-full overflow-hidden bg-[color:var(--s-4)]">
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }}
      />
    </div>
  );
}
