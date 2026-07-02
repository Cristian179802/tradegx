"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Clock,
  GraduationCap,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DIAGRAMS, LEVEL_META, getLesson, lessonKey } from "@/lib/academy";
import type { Lang } from "@/lib/academy/types";
import { Diagram } from "@/components/academy/diagram";
import { LessonBody } from "@/components/academy/lesson-body";
import { useAcademyLang, useAcademyProgress } from "@/components/academy/use-academy";

const UI = {
  back: { ro: "Academie", en: "Academy" },
  minutes: { ro: "min de citit", en: "min read" },
  markDone: { ro: "Marchează ca finalizată", en: "Mark as completed" },
  isDone: { ro: "Lecție finalizată", en: "Lesson completed" },
  prev: { ro: "Lecția anterioară", en: "Previous lesson" },
  next: { ro: "Lecția următoare", en: "Next lesson" },
  backToModules: { ro: "Înapoi la module", en: "Back to modules" },
  tip: { ro: "Sfat practic", en: "Practical tip" },
  warning: { ro: "Capcană frecventă", en: "Common trap" },
  notFound: { ro: "Lecția nu a fost găsită.", en: "Lesson not found." },
} as const;

export default function LessonPage() {
  const params = useParams<{ moduleId: string; lessonId: string }>();
  const [lang, setLang] = useAcademyLang();
  const { done, toggle, markDone } = useAcademyProgress();

  const data = getLesson(params.moduleId, params.lessonId);

  if (!data) {
    return (
      <div className="max-w-3xl py-16 text-center">
        <p className="text-sm text-zinc-500">{UI.notFound[lang]}</p>
        <Link
          href="/academy"
          className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-indigo-400 hover:text-indigo-300"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> {UI.backToModules[lang]}
        </Link>
      </div>
    );
  }

  const { module: mod, lesson, prev, next } = data;
  const meta = LEVEL_META[mod.level];
  const key = lessonKey(mod.id, lesson.id);
  const isDone = done.has(key);

  return (
    <div className="max-w-3xl space-y-6 pb-10">
      {/* Breadcrumb + limbă */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/academy"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <GraduationCap className="w-3.5 h-3.5" />
          {UI.back[lang]} · {mod.title[lang]}
        </Link>
        <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/80 p-0.5 shrink-0">
          {(["ro", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors uppercase",
                lang === l ? "bg-indigo-500/20 text-indigo-300" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Titlu lecție */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span
            className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full border",
              meta.color,
              meta.bg,
              meta.border
            )}
          >
            {meta.label[lang]}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
            <Clock className="w-3 h-3" /> {lesson.minutes} {UI.minutes[lang]}
          </span>
          {isDone && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> {UI.isDone[lang]}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-black text-zinc-100 tracking-tight leading-tight">
          {lesson.title[lang]}
        </h1>
      </div>

      {/* Secțiuni */}
      <div className="space-y-8">
        {lesson.sections.map((section, si) => {
          const diagram = section.diagram ? DIAGRAMS[section.diagram] : null;
          return (
            <section key={si}>
              {section.heading && (
                <h2 className="text-base font-bold text-zinc-100 mb-3">
                  {section.heading[lang]}
                </h2>
              )}
              <LessonBody text={section.body[lang]} />
              {diagram && <Diagram def={diagram} lang={lang} />}

              {section.tip && (
                <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4 flex gap-3">
                  <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-emerald-300 mb-1">{UI.tip[lang]}</p>
                    <p className="text-xs leading-relaxed text-emerald-200/70">
                      {section.tip[lang]}
                    </p>
                  </div>
                </div>
              )}

              {section.warning && (
                <div className="mt-4 rounded-xl border border-rose-500/25 bg-rose-500/[0.06] p-4 flex gap-3">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-rose-300 mb-1">{UI.warning[lang]}</p>
                    <p className="text-xs leading-relaxed text-rose-200/70">
                      {section.warning[lang]}
                    </p>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Finalizare */}
      <button
        onClick={() => toggle(key)}
        className={cn(
          "w-full rounded-xl border py-3 text-sm font-bold transition-colors",
          isDone
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
            : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-indigo-500/50 hover:text-indigo-300"
        )}
      >
        <CheckCircle2 className="inline w-4 h-4 mr-1.5 -mt-0.5" />
        {isDone ? UI.isDone[lang] : UI.markDone[lang]}
      </button>

      {/* Navigare */}
      <div className="flex items-stretch gap-3 pt-2">
        {prev ? (
          <Link
            href={`/academy/${mod.id}/${prev.id}`}
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3.5 hover:border-zinc-700 transition-colors group"
          >
            <span className="flex items-center gap-1 text-[10px] text-zinc-600 mb-1">
              <ArrowLeft className="w-3 h-3" /> {UI.prev[lang]}
            </span>
            <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-200 line-clamp-1">
              {prev.title[lang]}
            </span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {next ? (
          <Link
            href={`/academy/${mod.id}/${next.id}`}
            onClick={() => markDone(key)}
            className="flex-1 rounded-xl border border-indigo-500/30 bg-indigo-500/[0.07] p-3.5 hover:border-indigo-500/50 transition-colors group text-right"
          >
            <span className="flex items-center justify-end gap-1 text-[10px] text-indigo-400/70 mb-1">
              {UI.next[lang]} <ArrowRight className="w-3 h-3" />
            </span>
            <span className="text-xs font-bold text-indigo-300 group-hover:text-indigo-200 line-clamp-1">
              {next.title[lang]}
            </span>
          </Link>
        ) : (
          <Link
            href={`/academy/${mod.id}/quiz`}
            onClick={() => markDone(key)}
            className="flex-1 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-3.5 hover:border-amber-500/50 transition-colors text-right"
          >
            <span className="flex items-center justify-end gap-1 text-[10px] text-amber-400/70 mb-1">
              {lang === "ro" ? "Testează-te" : "Test yourself"} <ArrowRight className="w-3 h-3" />
            </span>
            <span className="text-xs font-bold text-amber-300 line-clamp-1">
              {lang === "ro" ? "Quiz final" : "Final quiz"} — {mod.title[lang]}
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
