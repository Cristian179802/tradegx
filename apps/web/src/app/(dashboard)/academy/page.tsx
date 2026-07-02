"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  GraduationCap,
  HeartPulse,
  Settings2,
  Shapes,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { ACADEMY, LEVEL_META, TOTAL_LESSONS, lessonKey } from "@/lib/academy";
import { PASS_THRESHOLD, QUIZZES } from "@/lib/academy/quiz";
import type { Lang } from "@/lib/academy/types";
import {
  useAcademyLang,
  useAcademyProgress,
  useQuizScores,
} from "@/components/academy/use-academy";
import { Award, BadgeCheck } from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  book: BookOpen,
  chart: TrendingUp,
  candlestick: BarChart3,
  shapes: Shapes,
  activity: Activity,
  brain: Brain,
  shield: ShieldCheck,
  heart: HeartPulse,
  cog: Settings2,
};

const UI = {
  title: { ro: "Academia TradeGx", en: "TradeGx Academy" },
  subtitle: {
    ro: "Cursul complet de trading — de la prima lumânare până la sisteme profesionale. Text, diagrame și exemple practice, pas cu pas.",
    en: "The complete trading course — from your first candle to professional systems. Text, diagrams and practical examples, step by step.",
  },
  progress: { ro: "Progresul tău", en: "Your progress" },
  lessonsDone: { ro: "lecții finalizate", en: "lessons completed" },
  modules: { ro: "module", en: "modules" },
  minutes: { ro: "min", en: "min" },
  lessons: { ro: "lecții", en: "lessons" },
  continue: { ro: "Continuă", en: "Continue" },
  start: { ro: "Începe", en: "Start" },
  completed: { ro: "Finalizat", en: "Completed" },
  quiz: { ro: "Quiz final", en: "Final quiz" },
  quizPassed: { ro: "Absolvit", en: "Passed" },
  certTitle: { ro: "Certificat de absolvire", en: "Certificate of completion" },
  certBody: {
    ro: "a absolvit Academia TradeGx — toate cele 9 module, cu scor de minim 80% la fiecare quiz final.",
    en: "has completed the TradeGx Academy — all 9 modules, scoring at least 80% on every final quiz.",
  },
  certPrint: { ro: "Descarcă / Printează", en: "Download / Print" },
} as const;

export default function AcademyPage() {
  const [lang, setLang] = useAcademyLang();
  const { done } = useAcademyProgress();
  const quizScores = useQuizScores();
  const { data: session } = useSession();
  const [openId, setOpenId] = React.useState<string | null>(null);

  const doneCount = done.size;
  const pct = TOTAL_LESSONS > 0 ? Math.round((doneCount / TOTAL_LESSONS) * 100) : 0;
  const quizPassed = (id: string) => (quizScores[id] ?? 0) >= PASS_THRESHOLD;
  const allPassed = ACADEMY.every((b) => quizPassed(b.module.id));

  return (
    <div className="space-y-6 pb-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-black text-zinc-100 tracking-tight">{UI.title[lang]}</h1>
          </div>
          <p className="text-sm text-zinc-500 max-w-xl">{UI.subtitle[lang]}</p>
        </div>

        {/* Comutator limbă */}
        <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/80 p-0.5">
          {(["ro", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-md transition-colors uppercase",
                lang === l ? "bg-indigo-500/20 text-indigo-300" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Progres global */}
      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/80 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-zinc-300">{UI.progress[lang]}</span>
          </div>
          <span className="text-xs text-zinc-500">
            <span className="text-zinc-200 font-bold">{doneCount}</span> / {TOTAL_LESSONS}{" "}
            {UI.lessonsDone[lang]} · {ACADEMY.length} {UI.modules[lang]}
          </span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg,#4f46e5,#818cf8)",
            }}
          />
        </div>
      </div>

      {/* Certificat de absolvire — apare când toate quiz-urile sunt promovate */}
      {allPassed && (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/[0.08] to-zinc-900/80 p-8 text-center print:border-amber-600">
          <Award className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400/80 mb-2">
            TradeGx Academy
          </p>
          <h2 className="text-xl font-black text-zinc-100 mb-3">{UI.certTitle[lang]}</h2>
          <p className="text-2xl font-black text-amber-300 mb-2">
            {session?.user?.name ?? "Trader"}
          </p>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mb-1">{UI.certBody[lang]}</p>
          <p className="text-[10px] text-zinc-600 mb-5">
            {new Date().toLocaleDateString(lang === "ro" ? "ro-RO" : "en-US", {
              day: "numeric", month: "long", year: "numeric",
            })}{" "}
            · tradegx.com
          </p>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-colors print:hidden"
          >
            <Award className="w-3.5 h-3.5" /> {UI.certPrint[lang]}
          </button>
        </div>
      )}

      {/* Module */}
      <div className="grid gap-4 md:grid-cols-2">
        {ACADEMY.map(({ module: mod }) => {
          const Icon = ICONS[mod.icon] ?? Sparkles;
          const meta = LEVEL_META[mod.level];
          const modDone = mod.lessons.filter((l) => done.has(lessonKey(mod.id, l.id))).length;
          const modPct = Math.round((modDone / mod.lessons.length) * 100);
          const isOpen = openId === mod.id;
          const totalMin = mod.lessons.reduce((a, l) => a + l.minutes, 0);
          const firstUnfinished =
            mod.lessons.find((l) => !done.has(lessonKey(mod.id, l.id))) ?? mod.lessons[0];

          return (
            <div
              key={mod.id}
              className={cn(
                "rounded-2xl border bg-zinc-900/80 transition-colors",
                modPct === 100 ? "border-emerald-500/30" : "border-zinc-800/70 hover:border-zinc-700"
              )}
            >
              {/* Card header */}
              <button
                onClick={() => setOpenId(isOpen ? null : mod.id)}
                className="w-full text-left p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/25 to-indigo-500/5 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-zinc-100 leading-tight">
                        {mod.title[lang]}
                      </h2>
                      <span
                        className={cn(
                          "inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border",
                          meta.color,
                          meta.bg,
                          meta.border
                        )}
                      >
                        {meta.label[lang]}
                      </span>
                      {quizPassed(mod.id) && (
                        <span className="inline-flex items-center gap-0.5 ml-1.5 mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border text-amber-400 bg-amber-500/10 border-amber-500/30">
                          <BadgeCheck className="w-3 h-3" /> {UI.quizPassed[lang]}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-zinc-600 transition-transform shrink-0 mt-1",
                      isOpen && "rotate-180"
                    )}
                  />
                </div>

                <p className="text-xs text-zinc-500 leading-relaxed mb-3">
                  {mod.description[lang]}
                </p>

                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${modPct}%`,
                        background:
                          modPct === 100
                            ? "linear-gradient(90deg,#059669,#34d399)"
                            : "linear-gradient(90deg,#4f46e5,#818cf8)",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                    {modDone}/{mod.lessons.length} {UI.lessons[lang]} ·{" "}
                    <Clock className="inline w-3 h-3 -mt-0.5" /> {totalMin} {UI.minutes[lang]}
                  </span>
                </div>
              </button>

              {/* Lecții (expandat) */}
              {isOpen && (
                <div className="border-t border-zinc-800/50 divide-y divide-zinc-800/40">
                  {mod.lessons.map((lesson, li) => {
                    const isDone = done.has(lessonKey(mod.id, lesson.id));
                    return (
                      <Link
                        key={lesson.id}
                        href={`/academy/${mod.id}/${lesson.id}`}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/30 transition-colors group"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-zinc-700 shrink-0" />
                        )}
                        <span
                          className={cn(
                            "flex-1 text-xs font-medium",
                            isDone ? "text-zinc-500" : "text-zinc-300 group-hover:text-zinc-100"
                          )}
                        >
                          {li + 1}. {lesson.title[lang]}
                        </span>
                        <span className="text-[10px] text-zinc-600">
                          {lesson.minutes} {UI.minutes[lang]}
                        </span>
                      </Link>
                    );
                  })}
                  {/* Quiz final */}
                  {QUIZZES[mod.id]?.length > 0 && (
                    <Link
                      href={`/academy/${mod.id}/quiz`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-amber-500/[0.06] transition-colors group"
                    >
                      {quizPassed(mod.id) ? (
                        <BadgeCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Award className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 shrink-0 transition-colors" />
                      )}
                      <span className="flex-1 text-xs font-bold text-amber-400/90 group-hover:text-amber-300">
                        {UI.quiz[lang]}
                        {quizScores[mod.id] != null && (
                          <span className="ml-2 text-[10px] text-zinc-500 font-semibold">
                            {UI.quizPassed[lang]}: {quizScores[mod.id]}%
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-zinc-600">
                        {QUIZZES[mod.id].length} × ?
                      </span>
                    </Link>
                  )}
                </div>
              )}

              {/* CTA */}
              {!isOpen && (
                <div className="px-5 pb-4 -mt-1">
                  <Link
                    href={`/academy/${mod.id}/${firstUnfinished.id}`}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-bold transition-colors",
                      modPct === 100
                        ? "text-emerald-400 hover:text-emerald-300"
                        : "text-indigo-400 hover:text-indigo-300"
                    )}
                  >
                    {modPct === 100
                      ? UI.completed[lang]
                      : modDone > 0
                        ? `${UI.continue[lang]} →`
                        : `${UI.start[lang]} →`}
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
