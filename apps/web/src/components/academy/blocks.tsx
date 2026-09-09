import * as React from "react";
import { AlertTriangle, Calculator, Lightbulb, ListChecks, Sigma } from "lucide-react";
import { renderInline } from "./lesson-body";
import type { I18nText, Lang } from "@/lib/academy/types";

// ── Blocurile unei secțiuni ──────────────────────────────────────────────────
// Fiecare bloc are o singură treabă și o singură culoare de accent. Verde și
// roșu rămân semantice — sfat bun / capcană — ca peste tot în aplicație.

const UI = {
  tip: { ro: "Sfat practic", en: "Practical tip" },
  warning: { ro: "Capcană frecventă", en: "Common trap" },
  example: { ro: "Exemplu real", en: "Real example" },
  takeaways: { ro: "De reținut", en: "Key takeaways" },
  formula: { ro: "Formulă", en: "Formula" },
};

export function TipBlock({ text, lang }: { text: string; lang: Lang }) {
  return (
    <aside className="mt-5 rounded-xl border p-4 flex gap-3 border-[color:rgba(52,211,153,0.22)] bg-[color:rgba(52,211,153,0.05)]">
      <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--gain)" }} />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "var(--gain)" }}>
          {UI.tip[lang]}
        </p>
        <p className="text-[13.5px] leading-relaxed text-[color:var(--ink-2)]">{renderInline(text, lang)}</p>
      </div>
    </aside>
  );
}

export function WarningBlock({ text, lang }: { text: string; lang: Lang }) {
  return (
    <aside className="mt-5 rounded-xl border p-4 flex gap-3 border-[color:rgba(251,92,114,0.22)] bg-[color:rgba(251,92,114,0.05)]">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--loss)" }} />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "var(--loss)" }}>
          {UI.warning[lang]}
        </p>
        <p className="text-[13.5px] leading-relaxed text-[color:var(--ink-2)]">{renderInline(text, lang)}</p>
      </div>
    </aside>
  );
}

/** Exemplu cu cifre. Fundal ușor ridicat, o bară de accent pe stânga. */
export function ExampleBlock({ text, lang }: { text: string; lang: Lang }) {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <aside className="mt-5 relative rounded-xl border border-[color:var(--line-2)] bg-[color:var(--s-3)] p-4 pl-5 overflow-hidden">
      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[color:var(--accent)]" />
      <div className="flex items-center gap-2 mb-2">
        <Calculator className="w-3.5 h-3.5 text-[color:var(--accent)]" />
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--accent)]">
          {UI.example[lang]}
        </p>
      </div>
      <div className="space-y-2.5">
        {paragraphs.map((p, i) => {
          const lines = p.split("\n").map((l) => l.trim()).filter(Boolean);
          if (lines.every((l) => l.startsWith("- "))) {
            return (
              <ul key={i} className="space-y-1.5">
                {lines.map((l, j) => (
                  <li key={j} className="flex gap-2.5 text-[13.5px] leading-relaxed text-[color:var(--ink-2)]">
                    <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[color:var(--ink-4)]" />
                    <span>{renderInline(l.slice(2), lang)}</span>
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <p key={i} className="text-[13.5px] leading-relaxed text-[color:var(--ink-2)]">
              {renderInline(p, lang)}
            </p>
          );
        })}
      </div>
    </aside>
  );
}

/** Ideile de reținut. Se citește în 10 secunde — pentru cine derulează. */
export function TakeawaysBlock({ items, lang }: { items: I18nText[]; lang: Lang }) {
  return (
    <aside className="mt-6 rounded-xl border border-[color:var(--line-1)] bg-[color:var(--s-1)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <ListChecks className="w-3.5 h-3.5 text-[color:var(--ink-3)]" />
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--ink-3)]">
          {UI.takeaways[lang]}
        </p>
      </div>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed text-[color:var(--ink-1)]">
            <span className="mt-[2px] shrink-0 w-4 h-4 rounded-md border border-[color:var(--accent-line)] bg-[color:var(--accent-soft)] grid place-items-center text-[9px] font-black text-[color:var(--accent)]">
              {i + 1}
            </span>
            <span>{renderInline(it[lang], lang)}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function TableBlock({
  head,
  rows,
  lang,
}: {
  head: I18nText[];
  rows: I18nText[][];
  lang: Lang;
}) {
  return (
    <div className="mt-5 rounded-xl border border-[color:var(--line-1)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[color:var(--s-3)]">
              {head.map((h, i) => (
                <th
                  key={i}
                  className="text-left px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--ink-4)] border-b border-[color:var(--line-2)] whitespace-nowrap"
                >
                  {h[lang]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className={ri % 2 === 1 ? "bg-[color:var(--s-2)]" : "bg-[color:var(--s-1)]"}>
                {r.map((c, ci) => (
                  <td
                    key={ci}
                    className={
                      "px-3.5 py-2.5 align-top leading-relaxed border-b border-[color:var(--line-1)] " +
                      (ci === 0 ? "font-semibold text-[color:var(--ink-1)] whitespace-nowrap" : "text-[color:var(--ink-2)]")
                    }
                  >
                    {renderInline(c[lang], lang)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FormulaBlock({ expr, legend, lang }: { expr: string; legend?: I18nText; lang: Lang }) {
  return (
    <div className="mt-5 rounded-xl border border-[color:var(--line-2)] bg-[color:var(--s-0)] p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <Sigma className="w-3.5 h-3.5 text-[color:var(--ink-4)]" />
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--ink-4)]">
          {UI.formula[lang]}
        </p>
      </div>
      <pre className="font-mono text-[14px] leading-relaxed text-[color:var(--ink-1)] whitespace-pre-wrap break-words">
        {expr}
      </pre>
      {legend && (
        <p className="mt-2.5 text-[12px] leading-relaxed text-[color:var(--ink-3)]">{renderInline(legend[lang], lang)}</p>
      )}
    </div>
  );
}
