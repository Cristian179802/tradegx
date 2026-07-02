"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  GraduationCap,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getModule } from "@/lib/academy";
import type { Lang } from "@/lib/academy/types";
import { PASS_THRESHOLD, QUIZZES } from "@/lib/academy/quiz";
import { useAcademyLang } from "@/components/academy/use-academy";

const SCORE_KEY = "tradegx-academy-quiz";

function saveBestScore(moduleId: string, pct: number) {
  try {
    const raw = localStorage.getItem(SCORE_KEY);
    const scores = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    if ((scores[moduleId] ?? 0) < pct) {
      scores[moduleId] = pct;
      localStorage.setItem(SCORE_KEY, JSON.stringify(scores));
    }
  } catch {}
}

const UI = {
  back: { ro: "Înapoi la modul", en: "Back to module" },
  quiz: { ro: "Quiz final", en: "Final quiz" },
  question: { ro: "Întrebarea", en: "Question" },
  of: { ro: "din", en: "of" },
  next: { ro: "Următoarea întrebare", en: "Next question" },
  seeResult: { ro: "Vezi rezultatul", en: "See result" },
  passed: { ro: "Modul absolvit!", en: "Module passed!" },
  failed: { ro: "Încă puțin — mai încearcă", en: "Almost there — try again" },
  passedSub: {
    ro: "Ai demonstrat că stăpânești materialul. Continuă cu modulul următor.",
    en: "You have proven you know the material. Continue with the next module.",
  },
  failedSub: {
    ro: "Pragul de promovare este 80%. Recitește lecțiile marcate greșit și revino.",
    en: "The passing threshold is 80%. Reread the lessons you missed and come back.",
  },
  retry: { ro: "Reia quiz-ul", en: "Retake quiz" },
  backToAcademy: { ro: "Înapoi la Academie", en: "Back to Academy" },
  correct: { ro: "Corect!", en: "Correct!" },
  wrong: { ro: "Greșit", en: "Wrong" },
  score: { ro: "Scorul tău", en: "Your score" },
} as const;

export default function QuizPage() {
  const params = useParams<{ moduleId: string }>();
  const [lang, setLang] = useAcademyLang();

  const mod = getModule(params.moduleId);
  const questions = QUIZZES[params.moduleId] ?? [];

  const [idx, setIdx] = React.useState(0);
  const [picked, setPicked] = React.useState<number | null>(null);
  const [correctCount, setCorrectCount] = React.useState(0);
  const [finished, setFinished] = React.useState(false);

  if (!mod || questions.length === 0) {
    return (
      <div className="max-w-2xl py-16 text-center">
        <p className="text-sm text-zinc-500">Quiz indisponibil.</p>
        <Link
          href="/academy"
          className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-indigo-400 hover:text-indigo-300"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> {UI.backToAcademy[lang]}
        </Link>
      </div>
    );
  }

  const question = questions[idx];
  const isLast = idx === questions.length - 1;
  const pct = Math.round((correctCount / questions.length) * 100);
  const passed = pct >= PASS_THRESHOLD;

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === question.correct) setCorrectCount((c) => c + 1);
  };

  const advance = () => {
    if (isLast) {
      setFinished(true);
      // scorul final se calculează cu ultimul răspuns deja inclus
      const finalPct = Math.round((correctCount / questions.length) * 100);
      saveBestScore(mod.id, finalPct);
    } else {
      setIdx((i) => i + 1);
      setPicked(null);
    }
  };

  const restart = () => {
    setIdx(0);
    setPicked(null);
    setCorrectCount(0);
    setFinished(false);
  };

  // ── Ecran final ──
  if (finished) {
    return (
      <div className="max-w-2xl space-y-6 pb-10">
        <div
          className={cn(
            "rounded-2xl border p-10 text-center",
            passed
              ? "border-emerald-500/40 bg-emerald-500/[0.06]"
              : "border-amber-500/40 bg-amber-500/[0.06]"
          )}
        >
          {passed ? (
            <Award className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          ) : (
            <RotateCcw className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          )}
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
            {UI.score[lang]}
          </p>
          <p
            className={cn(
              "text-5xl font-black mb-3",
              passed ? "text-emerald-400" : "text-amber-400"
            )}
          >
            {pct}%
          </p>
          <p className="text-lg font-black text-zinc-100 mb-1">
            {passed ? UI.passed[lang] : UI.failed[lang]}
          </p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {passed ? UI.passedSub[lang] : UI.failedSub[lang]}
          </p>

          <div className="flex items-center justify-center gap-3 mt-6">
            {!passed && (
              <button
                onClick={restart}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {UI.retry[lang]}
              </button>
            )}
            <Link
              href="/academy"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-300 hover:border-zinc-600 transition-colors"
            >
              <GraduationCap className="w-3.5 h-3.5" /> {UI.backToAcademy[lang]}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Întrebare curentă ──
  return (
    <div className="max-w-2xl space-y-5 pb-10">
      {/* Breadcrumb + limbă */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/academy"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <GraduationCap className="w-3.5 h-3.5" />
          {mod.title[lang]} · {UI.quiz[lang]}
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

      {/* Progres */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-zinc-500">
            {UI.question[lang]} {idx + 1} {UI.of[lang]} {questions.length}
          </span>
          <span className="text-[11px] text-zinc-600">
            {correctCount} ✓
          </span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-300"
            style={{ width: `${((idx + (picked !== null ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Întrebare */}
      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/80 p-6">
        <h1 className="text-base font-bold text-zinc-100 leading-snug mb-5">
          {question.q[lang]}
        </h1>

        <div className="space-y-2.5">
          {question.options.map((opt, i) => {
            const isCorrect = i === question.correct;
            const isPicked = i === picked;
            const revealed = picked !== null;
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={revealed}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                  !revealed &&
                    "border-zinc-700/60 bg-zinc-950/40 text-zinc-300 hover:border-indigo-500/50 hover:bg-indigo-500/[0.06]",
                  revealed && isCorrect &&
                    "border-emerald-500/50 bg-emerald-500/10 text-emerald-200",
                  revealed && isPicked && !isCorrect &&
                    "border-rose-500/50 bg-rose-500/10 text-rose-200",
                  revealed && !isPicked && !isCorrect &&
                    "border-zinc-800/60 bg-zinc-950/30 text-zinc-600"
                )}
              >
                <span
                  className={cn(
                    "w-6 h-6 rounded-lg border flex items-center justify-center text-[11px] font-black shrink-0",
                    revealed && isCorrect
                      ? "border-emerald-500/50 text-emerald-300"
                      : revealed && isPicked
                        ? "border-rose-500/50 text-rose-300"
                        : "border-zinc-700 text-zinc-500"
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1 font-medium">{opt[lang]}</span>
                {revealed && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {revealed && isPicked && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Explicație */}
        {picked !== null && (
          <div
            className={cn(
              "mt-4 rounded-xl border p-4",
              picked === question.correct
                ? "border-emerald-500/25 bg-emerald-500/[0.06]"
                : "border-rose-500/25 bg-rose-500/[0.06]"
            )}
          >
            <p
              className={cn(
                "text-xs font-bold mb-1",
                picked === question.correct ? "text-emerald-300" : "text-rose-300"
              )}
            >
              {picked === question.correct ? UI.correct[lang] : UI.wrong[lang]}
            </p>
            <p className="text-xs leading-relaxed text-zinc-400">{question.explain[lang]}</p>
          </div>
        )}
      </div>

      {/* Următoarea */}
      {picked !== null && (
        <button
          onClick={advance}
          className="w-full rounded-xl border border-indigo-500/40 bg-indigo-500/10 py-3 text-sm font-bold text-indigo-300 hover:bg-indigo-500/20 transition-colors"
        >
          {isLast ? UI.seeResult[lang] : UI.next[lang]} →
        </button>
      )}
    </div>
  );
}
