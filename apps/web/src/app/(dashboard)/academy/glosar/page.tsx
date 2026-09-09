"use client";

import * as React from "react";
import Link from "next/link";
import { BookMarked, ChevronLeft, Search, ArrowUpRight } from "lucide-react";
import { GLOSSARY, searchGlossary } from "@/lib/academy/glossary";
import { getModule } from "@/lib/academy";
import { renderInline } from "@/components/academy/lesson-body";
import { useAcademyLang } from "@/components/academy/use-academy";

const UI = {
  kicker: { ro: "Educație · Academia", en: "Education · Academy" },
  title: { ro: "Glosar de trading", en: "Trading glossary" },
  subtitle: {
    ro: "Fiecare termen, explicat cum i-ai explica unui prieten. Caută fără diacritice, prin sinonime sau prin definiție.",
    en: "Every term, explained the way you'd explain it to a friend. Search by synonym or by definition.",
  },
  search: { ro: "Caută un termen… (ex: lichiditate, RSI, pip)", en: "Search a term… (e.g. liquidity, RSI, pip)" },
  terms: { ro: "termeni", en: "terms" },
  none: { ro: "Niciun termen nu se potrivește.", en: "No term matches." },
  learn: { ro: "Predat în", en: "Taught in" },
  back: { ro: "Academie", en: "Academy" },
};

export default function GlossaryPage() {
  const lang = useAcademyLang();
  const [q, setQ] = React.useState("");
  const results = React.useMemo(() => searchGlossary(q, lang), [q, lang]);

  // Sare la termenul din URL (#slug) după randare — vine din popover-ul unei lecții.
  React.useEffect(() => {
    const slug = window.location.hash.slice(1);
    if (!slug || !GLOSSARY[slug]) return;
    const el = document.getElementById(slug);
    el?.scrollIntoView({ block: "center" });
  }, []);

  // Grupare pe litera inițială — doar când nu se caută.
  const grouped = React.useMemo(() => {
    if (q.trim()) return null;
    const map = new Map<string, typeof results>();
    for (const r of results) {
      const letter = r[1].term[lang][0]!.toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(r);
    }
    return [...map.entries()];
  }, [results, q, lang]);

  return (
    <div className="max-w-4xl space-y-6 pb-10">
      <Link
        href="/academy"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[color:var(--ink-4)] hover:text-[color:var(--ink-2)] transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> {UI.back[lang]}
      </Link>

      <header>
        <p className="tg-label mb-2">{UI.kicker[lang]}</p>
        <h1 className="font-display text-[28px] md:text-[34px] font-black tracking-[-0.025em] leading-[1.05] text-[color:var(--ink-1)]">
          {UI.title[lang]}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[color:var(--ink-3)] max-w-2xl">{UI.subtitle[lang]}</p>
      </header>

      <div className="tg-panel tg-boot tg-boot-edge relative rounded-2xl border p-2 flex items-center gap-2">
        <Search className="w-4 h-4 ml-2 shrink-0 text-[color:var(--ink-4)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={UI.search[lang]}
          autoFocus
          className="flex-1 bg-transparent px-1 py-2 text-[14px] text-[color:var(--ink-1)] placeholder:text-[color:var(--ink-4)] outline-none"
        />
        <span className="mr-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--ink-4)] tabular-nums whitespace-nowrap">
          {results.length} {UI.terms[lang]}
        </span>
      </div>

      {results.length === 0 && (
        <p className="text-[13px] text-[color:var(--ink-4)] py-10 text-center">{UI.none[lang]}</p>
      )}

      {grouped ? (
        <div className="space-y-8">
          {grouped.map(([letter, items]) => (
            <section key={letter}>
              <div className="flex items-center gap-3 mb-3">
                <span className="font-display text-[22px] font-black text-[color:var(--accent)] leading-none">{letter}</span>
                <span className="h-px flex-1 bg-[color:var(--line-1)]" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {items.map(([slug, e]) => (
                  <Entry key={slug} slug={slug} entry={e} lang={lang} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {results.map(([slug, e]) => (
            <Entry key={slug} slug={slug} entry={e} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}

function Entry({
  slug,
  entry,
  lang,
}: {
  slug: string;
  entry: (typeof GLOSSARY)[string];
  lang: "ro" | "en";
}) {
  const mod = entry.module ? getModule(entry.module) : null;
  return (
    <article
      id={slug}
      className="tg-surface rounded-xl p-4 scroll-mt-24 target:border-[color:var(--accent-line)] target:shadow-[0_0_0_1px_var(--accent-line)]"
    >
      <div className="flex items-start gap-2.5">
        <BookMarked className="w-3.5 h-3.5 mt-[3px] shrink-0 text-[color:var(--accent)]" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-bold text-[color:var(--ink-1)] leading-tight">{entry.term[lang]}</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[color:var(--ink-2)]">
            {renderInline(entry.def[lang], lang)}
          </p>
          {mod && (
            <Link
              href={`/academy#${mod.id}`}
              className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[color:var(--ink-4)] hover:text-[color:var(--accent)] transition-colors"
            >
              {UI.learn[lang]} {mod.title[lang]} <ArrowUpRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
