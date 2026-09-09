"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronLeft,
  Clock,
  GraduationCap,
  ListTree,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DIAGRAMS, getLesson, lessonKey } from "@/lib/academy";
import { Diagram } from "@/components/academy/diagram";
import { LessonBody } from "@/components/academy/lesson-body";
import {
  ExampleBlock,
  FormulaBlock,
  TableBlock,
  TakeawaysBlock,
  TipBlock,
  WarningBlock,
} from "@/components/academy/blocks";
import { Lab } from "@/components/academy/labs";
import { LessonTutor } from "@/components/academy/tutor";
import { useAcademyLang, useAcademyProgress } from "@/components/academy/use-academy";

// ── Pagina de lecție ─────────────────────────────────────────────────────────
//
// Două coloane pe ecran mare: conținutul (lățime de citit, ~68 de caractere pe
// rând) și, în dreapta, un cuprins lipicios care urmărește derularea. Sus, o
// linie subțire arată cât ai citit. Săgețile ← → sar între lecții.
//
// Sfârșitul lecției e o singură decizie: „Am înțeles” → lecția următoare.
// Bifa se pune la trecerea mai departe, nu la simpla deschidere a paginii.

const LEVEL_LABEL = {
  BEGINNER: { ro: "Începător", en: "Beginner" },
  INTERMEDIATE: { ro: "Intermediar", en: "Intermediate" },
  ADVANCED: { ro: "Avansat", en: "Advanced" },
  EXPERT: { ro: "Expert", en: "Expert" },
} as const;

const UI = {
  back: { ro: "Academie", en: "Academy" },
  minutes: { ro: "min de citit", en: "min read" },
  markDone: { ro: "Am înțeles — marchează lecția", en: "Got it — mark lesson done" },
  isDone: { ro: "Lecție terminată", en: "Lesson completed" },
  undo: { ro: "anulează", en: "undo" },
  prev: { ro: "Lecția anterioară", en: "Previous lesson" },
  next: { ro: "Lecția următoare", en: "Next lesson" },
  toQuiz: { ro: "Testează-te", en: "Test yourself" },
  quiz: { ro: "Quiz final", en: "Final quiz" },
  backToModules: { ro: "Înapoi la module", en: "Back to modules" },
  notFound: { ro: "Lecția nu a fost găsită.", en: "Lesson not found." },
  contents: { ro: "În această lecție", en: "In this lesson" },
  lessonOf: { ro: "Lecția", en: "Lesson" },
  of: { ro: "din", en: "of" },
  keys: { ro: "← → navighează", en: "← → to navigate" },
} as const;

export default function LessonPage() {
  const params = useParams<{ moduleId: string; lessonId: string }>();
  const router = useRouter();
  const lang = useAcademyLang();
  const { done, toggle, markDone } = useAcademyProgress();

  const data = getLesson(params.moduleId, params.lessonId);

  // ── Progresul de citire (linia de sus) + secțiunea activă (cuprins) ──
  const [readPct, setReadPct] = React.useState(0);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const sectionRefs = React.useRef<(HTMLElement | null)[]>([]);

  React.useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setReadPct(max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 100);

      // Secțiunea activă: ultima al cărei început a trecut de treimea de sus.
      const line = window.innerHeight * 0.33;
      let idx = 0;
      sectionRefs.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= line) idx = i;
      });
      setActiveIdx(idx);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [params.lessonId]);

  // ── Navigare cu tastatura ──
  React.useEffect(() => {
    if (!data) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowRight" && data.next) router.push(`/academy/${data.module.id}/${data.next.id}`);
      if (e.key === "ArrowLeft" && data.prev) router.push(`/academy/${data.module.id}/${data.prev.id}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, router]);

  if (!data) {
    return (
      <div className="max-w-3xl py-16 text-center">
        <p className="text-[13px] text-[color:var(--ink-4)]">{UI.notFound[lang]}</p>
        <Link href="/academy" className="inline-flex items-center gap-1.5 mt-4 text-[12px] font-bold text-[color:var(--accent)] hover:underline">
          <ChevronLeft className="w-3.5 h-3.5" /> {UI.backToModules[lang]}
        </Link>
      </div>
    );
  }

  const { module: mod, lesson, prev, next } = data;
  const key = lessonKey(mod.id, lesson.id);
  const isDone = done.has(key);
  const lessonIdx = mod.lessons.findIndex((l) => l.id === lesson.id);
  const headings = lesson.sections
    .map((s, i) => ({ i, text: s.heading?.[lang] ?? null }))
    .filter((h): h is { i: number; text: string } => !!h.text);

  const scrollTo = (i: number) => {
    const el = sectionRefs.current[i];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <>
      {/* Linia de citire — fixă sub navbar */}
      <div className="fixed left-0 right-0 top-0 z-40 h-[2px] pointer-events-none" aria-hidden>
        <div
          className="h-full transition-[width] duration-150"
          style={{ width: `${readPct}%`, background: "linear-gradient(90deg, var(--accent), #8b5cf6)" }}
        />
      </div>

      <div className="max-w-[1120px] grid lg:grid-cols-[minmax(0,1fr)_260px] gap-8 lg:gap-12 pb-12">
        {/* ── Coloana de conținut ── */}
        <div className="min-w-0 max-w-[720px]">
          {/* Breadcrumb */}
          <Link
            href={`/academy#${mod.id}`}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[color:var(--ink-4)] hover:text-[color:var(--ink-2)] transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <GraduationCap className="w-3.5 h-3.5" />
            {UI.back[lang]} <span className="opacity-50">/</span> {mod.title[lang]}
          </Link>

          {/* Titlu */}
          <header className="mt-5 mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--ink-4)]">
              <span className="px-2 py-0.5 rounded-md border border-[color:var(--line-2)] bg-[color:var(--s-3)] text-[color:var(--ink-3)]">
                {LEVEL_LABEL[mod.level][lang]}
              </span>
              <span className="tabular-nums">
                {UI.lessonOf[lang]} {lessonIdx + 1} {UI.of[lang]} {mod.lessons.length}
              </span>
              <span className="w-px h-3 bg-[color:var(--line-2)]" />
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock className="w-3 h-3" /> {lesson.minutes} {UI.minutes[lang]}
              </span>
              {isDone && (
                <span className="inline-flex items-center gap-1" style={{ color: "var(--gain)" }}>
                  <CheckCircle2 className="w-3 h-3" /> {UI.isDone[lang]}
                </span>
              )}
            </div>
            <h1 className="font-display text-[28px] md:text-[36px] font-black tracking-[-0.03em] leading-[1.06] text-[color:var(--ink-1)] text-balance">
              {lesson.title[lang]}
            </h1>
          </header>

          {/* Secțiuni */}
          <div className="space-y-10">
            {lesson.sections.map((section, si) => {
              const diagram = section.diagram ? DIAGRAMS[section.diagram] : null;
              return (
                <section
                  key={si}
                  ref={(el) => {
                    sectionRefs.current[si] = el;
                  }}
                  className="scroll-mt-24"
                >
                  {section.heading && (
                    <h2 className="font-display text-[19px] md:text-[21px] font-bold tracking-[-0.015em] text-[color:var(--ink-1)] mb-3.5">
                      {section.heading[lang]}
                    </h2>
                  )}
                  <LessonBody text={section.body[lang]} lang={lang} />
                  {section.formula && <FormulaBlock expr={section.formula.expr} legend={section.formula.legend} lang={lang} />}
                  {section.table && <TableBlock head={section.table.head} rows={section.table.rows} lang={lang} />}
                  {diagram && <Diagram def={diagram} lang={lang} />}
                  {/* Laboratorul vine DUPĂ diagramă: întâi vezi ideea desenată,
                      abia apoi te lăsăm să tragi de ea. */}
                  {section.lab && <Lab lab={section.lab} lang={lang} />}
                  {section.example && <ExampleBlock text={section.example[lang]} lang={lang} />}
                  {section.tip && <TipBlock text={section.tip[lang]} lang={lang} />}
                  {section.warning && <WarningBlock text={section.warning[lang]} lang={lang} />}
                  {section.takeaways && section.takeaways.length > 0 && <TakeawaysBlock items={section.takeaways} lang={lang} />}
                </section>
              );
            })}
          </div>

          {/* Tutorele vine ÎNAINTE de butonul de finalizare: dacă n-ai înțeles
              ceva, întrebi acum, nu după ce ai bifat lecția ca terminată. */}
          <LessonTutor moduleId={mod.id} lessonId={lesson.id} lang={lang} />

          {/* Finalizare */}
          <div className="mt-12 flex items-center gap-3">
            <button
              onClick={() => (isDone ? toggle(key) : markDone(key))}
              className={cn(
                "flex-1 rounded-xl border py-3.5 text-[13px] font-bold transition-colors",
                isDone
                  ? "border-[rgba(52,211,153,0.35)] bg-[rgba(52,211,153,0.08)]"
                  : "tg-surface hover:border-[color:var(--accent-line)] text-[color:var(--ink-2)] hover:text-[color:var(--ink-1)]"
              )}
              style={isDone ? { color: "var(--gain)" } : undefined}
            >
              <CheckCircle2 className="inline w-4 h-4 mr-1.5 -mt-0.5" />
              {isDone ? UI.isDone[lang] : UI.markDone[lang]}
              {isDone && <span className="ml-2 text-[11px] font-medium opacity-70">({UI.undo[lang]})</span>}
            </button>
          </div>

          {/* Navigare */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {prev ? (
              <Link
                href={`/academy/${mod.id}/${prev.id}`}
                className="tg-surface rounded-xl p-3.5 hover:border-[color:var(--line-2)] transition-colors group"
              >
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--ink-4)] mb-1">
                  <ArrowLeft className="w-3 h-3" /> {UI.prev[lang]}
                </span>
                <span className="block text-[12.5px] font-bold text-[color:var(--ink-2)] group-hover:text-[color:var(--ink-1)] line-clamp-1">
                  {prev.title[lang]}
                </span>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                href={`/academy/${mod.id}/${next.id}`}
                onClick={() => markDone(key)}
                className="rounded-xl p-3.5 border transition-colors group text-right"
                style={{ borderColor: "var(--accent-line)", background: "var(--accent-soft)" }}
              >
                <span className="flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-[0.12em] mb-1 text-[color:var(--accent)] opacity-80">
                  {UI.next[lang]} <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
                <span className="block text-[12.5px] font-bold text-[color:var(--ink-1)] line-clamp-1">{next.title[lang]}</span>
              </Link>
            ) : (
              <Link
                href={`/academy/${mod.id}/quiz`}
                onClick={() => markDone(key)}
                className="rounded-xl p-3.5 border transition-colors group text-right"
                style={{ borderColor: "rgba(251,191,36,0.35)", background: "rgba(251,191,36,0.07)" }}
              >
                <span className="flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-[0.12em] mb-1" style={{ color: "#fbbf24" }}>
                  {UI.toQuiz[lang]} <Award className="w-3 h-3" />
                </span>
                <span className="block text-[12.5px] font-bold text-[color:var(--ink-1)] line-clamp-1">
                  {UI.quiz[lang]} — {mod.title[lang]}
                </span>
              </Link>
            )}
          </div>
          <p className="mt-3 text-center text-[10px] text-[color:var(--ink-4)] hidden lg:block">{UI.keys[lang]}</p>
        </div>

        {/* ── Cuprinsul lipicios ── */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="tg-surface rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <ListTree className="w-3.5 h-3.5 text-[color:var(--ink-4)]" />
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--ink-4)]">{UI.contents[lang]}</p>
              </div>
              {headings.length > 0 ? (
                <ol className="space-y-0.5 relative">
                  <span className="absolute left-[5px] top-2 bottom-2 w-px bg-[color:var(--line-1)]" />
                  {headings.map((h) => {
                    const active = h.i === activeIdx || (h.i < activeIdx && !headings.some((x) => x.i > h.i && x.i <= activeIdx));
                    return (
                      <li key={h.i}>
                        <button
                          onClick={() => scrollTo(h.i)}
                          className={cn(
                            "relative w-full text-left pl-5 py-1.5 text-[12px] leading-snug transition-colors rounded-md",
                            active ? "text-[color:var(--ink-1)] font-semibold" : "text-[color:var(--ink-3)] hover:text-[color:var(--ink-2)]"
                          )}
                        >
                          <span
                            className={cn("absolute left-[3px] top-[11px] w-[5px] h-[5px] rounded-full transition-colors", active ? "bg-[color:var(--accent)]" : "bg-[color:var(--line-2)]")}
                          />
                          {h.text}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="text-[12px] text-[color:var(--ink-4)]">—</p>
              )}
            </div>

            {/* Lecțiile modulului */}
            <div className="tg-surface rounded-2xl p-2">
              {mod.lessons.map((l, i) => {
                const k = lessonKey(mod.id, l.id);
                const cur = l.id === lesson.id;
                return (
                  <Link
                    key={l.id}
                    href={`/academy/${mod.id}/${l.id}`}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11.5px] transition-colors",
                      cur ? "bg-[color:var(--accent-soft)] text-[color:var(--ink-1)] font-semibold" : "text-[color:var(--ink-3)] hover:bg-[color:var(--s-3)] hover:text-[color:var(--ink-2)]"
                    )}
                  >
                    {done.has(k) ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--gain)" }} />
                    ) : (
                      <span className="w-3.5 h-3.5 shrink-0 grid place-items-center text-[9px] font-mono font-bold text-[color:var(--ink-4)]">{i + 1}</span>
                    )}
                    <span className="line-clamp-1">{l.title[lang]}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
