import * as React from "react";
import { GlossaryTerm } from "./glossary-term";
import type { Lang } from "@/lib/academy/types";

// ── Randare mini-markdown pentru corpul lecțiilor ───────────────────────────
//
// Deliberat mic. Un markdown complet ar aduce o dependință și o mie de cazuri
// de care conținutul nu are nevoie. Suportă exact ce folosesc lecțiile:
//
//   paragrafe        separate prin linie goală
//   **bold**         accent
//   `cod`            monospațiat (formule scurte, valori)
//   [[slug]]         termen din glosar, cu popover — sau [[slug|text afișat]]
//   - element        listă cu puncte
//   1. element       listă numerotată (pași)
//
// Inline-urile se aplică peste tot: în paragrafe, în liste, în exemple.

type Token =
  | { t: "text"; v: string }
  | { t: "bold"; v: string }
  | { t: "code"; v: string }
  | { t: "term"; slug: string; label: string };

const INLINE = /(\*\*(.+?)\*\*|`([^`]+)`|\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\])/g;

function tokenize(text: string): Token[] {
  const out: Token[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ t: "text", v: text.slice(last, idx) });
    if (m[2] != null) out.push({ t: "bold", v: m[2] });
    else if (m[3] != null) out.push({ t: "code", v: m[3] });
    else if (m[4] != null) out.push({ t: "term", slug: m[4], label: m[5] ?? m[4].replace(/-/g, " ") });
    last = idx + m[0].length;
  }
  if (last < text.length) out.push({ t: "text", v: text.slice(last) });
  return out;
}

export function renderInline(text: string, lang: Lang): React.ReactNode[] {
  return tokenize(text).map((tok, i) => {
    switch (tok.t) {
      case "bold":
        return (
          <strong key={i} className="font-semibold text-[color:var(--ink-1)]">
            {tok.v}
          </strong>
        );
      case "code":
        return (
          <code
            key={i}
            className="font-mono text-[0.92em] px-1.5 py-0.5 rounded-md bg-[color:var(--s-4)] text-[color:var(--ink-1)] border border-[color:var(--line-1)]"
          >
            {tok.v}
          </code>
        );
      case "term":
        return (
          <GlossaryTerm key={i} slug={tok.slug} lang={lang}>
            {tok.label}
          </GlossaryTerm>
        );
      default:
        return <React.Fragment key={i}>{tok.v}</React.Fragment>;
    }
  });
}

const BULLET = /^- /;
const NUMBERED = /^\d+\. /;

export function LessonBody({ text, lang }: { text: string; lang: Lang }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  return (
    <div className="space-y-4">
      {blocks.map((block, bi) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);

        if (lines.every((l) => BULLET.test(l))) {
          return (
            <ul key={bi} className="space-y-2.5">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-3 text-[15px] leading-[1.7] text-[color:var(--ink-2)]">
                  <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent)] opacity-80" />
                  <span>{renderInline(l.replace(BULLET, ""), lang)}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (lines.every((l) => NUMBERED.test(l))) {
          return (
            <ol key={bi} className="space-y-3">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-3 text-[15px] leading-[1.7] text-[color:var(--ink-2)]">
                  <span className="mt-[3px] w-6 h-6 shrink-0 rounded-md grid place-items-center text-[11px] font-black font-mono bg-[color:var(--accent-soft)] text-[color:var(--accent)] border border-[color:var(--accent-line)]">
                    {li + 1}
                  </span>
                  <span>{renderInline(l.replace(NUMBERED, ""), lang)}</span>
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={bi} className="text-[15px] leading-[1.75] text-[color:var(--ink-2)]">
            {renderInline(block, lang)}
          </p>
        );
      })}
    </div>
  );
}
