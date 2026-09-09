"use client";

import * as React from "react";
import Link from "next/link";
import { BookMarked, ArrowUpRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GLOSSARY } from "@/lib/academy/glossary";
import type { Lang } from "@/lib/academy/types";

// ── Termen de glosar în text ─────────────────────────────────────────────────
// Popover, nu tooltip: pe telefon nu există hover, iar exact acolo citește
// majoritatea. Un tap deschide definiția; al doilea o închide.

const UI = {
  more: { ro: "Vezi în glosar", en: "See in glossary" },
  learn: { ro: "Predat în modulul", en: "Taught in module" },
};

export function GlossaryTerm({
  slug,
  lang,
  children,
}: {
  slug: string;
  lang: Lang;
  children: React.ReactNode;
}) {
  const entry = GLOSSARY[slug];
  // Un slug necunoscut nu strică pagina: afișăm textul simplu. Testele prind
  // slug-urile greșite înainte să ajungă aici.
  if (!entry) return <>{children}</>;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline font-medium text-[color:var(--ink-1)] underline decoration-dotted decoration-[color:var(--accent)] underline-offset-[3px] hover:decoration-solid focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] rounded-sm"
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-80 max-w-[calc(100vw-2rem)] p-0 border-[color:var(--line-2)] bg-[color:var(--s-3)] shadow-[var(--el-3)]"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookMarked className="w-3.5 h-3.5 text-[color:var(--accent)]" />
            <p className="text-[13px] font-bold text-[color:var(--ink-1)]">{entry.term[lang]}</p>
          </div>
          <p className="text-[12.5px] leading-relaxed text-[color:var(--ink-2)]">{entry.def[lang]}</p>
        </div>
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-[color:var(--line-1)] bg-[color:var(--s-2)]">
          <Link
            href={`/academy/glosar#${slug}`}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[color:var(--accent)] hover:underline"
          >
            {UI.more[lang]} <ArrowUpRight className="w-3 h-3" />
          </Link>
          {entry.module && (
            <Link
              href={`/academy#${entry.module}`}
              className="text-[10px] text-[color:var(--ink-4)] hover:text-[color:var(--ink-2)] truncate"
            >
              {UI.learn[lang]} →
            </Link>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
