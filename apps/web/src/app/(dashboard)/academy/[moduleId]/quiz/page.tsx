"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Award, BookOpen, CheckCircle2, ChevronLeft, GraduationCap, RotateCcw, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACADEMY, getModule } from "@/lib/academy";
import { PASS_THRESHOLD, QUIZZES } from "@/lib/academy/quiz";
import { renderInline } from "@/components/academy/lesson-body";
import { useAcademyLang, useAcademyProgress } from "@/components/academy/use-academy";

// ── Quiz-ul final al unui modul ──────────────────────────────────────────────
//
// O întrebare pe ecran, răspuns → explicație → următoarea. La final, scorul se
// salvează (cel mai bun rămâne), iar întrebările GREȘITE se țin minte: de acolo
// pornește repetiția — data viitoare le vezi întâi pe ele.

const UI = {
  back: { ro: "Înapoi la modul", en: "Back to module" },
  kicker: { ro: "Quiz final", en: "Final quiz" },
  question: { ro: "Întrebarea", en: "Question" },
  of: { ro: "din", en: "of" },
  next: { ro: "Următoarea întrebare", en: "Next question" },
  seeResult: { ro: "Vezi rezultatul", en: "See result" },
  passed: { ro: "Modul absolvit", en: "Module passed" },
  failed: { ro: "Încă puțin", en: "Almost there" },
  passedSub: {
    ro: "Ai demonstrat că stăpânești materialul. Modulul următor te așteaptă.",
    en: "You've shown you know the material. The next module is waiting.",
  },
  failedSub: {
    ro: "Pragul e 80%. Recitește lecțiile de mai jos — sunt cele din care ai greșit — și revino.",
    en: "The bar is 80%. Reread the lessons below — they're the ones you missed — and come back.",
  },
  retry: { ro: "Reia quiz-ul", en: "Retake quiz" },
  nextModule: { ro: "Modulul următor", en: "Next module" },
  backToAcademy: { ro: "Înapoi la Academie", en: "Back to Academy" },
  correct: { ro: "Corect", en: "Correct" },
  wrong: { ro: "Greșit", en: "Wrong" },
  score: { ro: "Scorul tău", en: "Your score" },
  best: { ro: "cel mai bun", en: "best" },
  review: { ro: "De recitit", en: "To reread" },
  unavailable: { ro: "Quiz indisponibil.", en: "Quiz unavailable." },
} as const;

export default function QuizPage() {
  const params = useParams<{ moduleId: string }>();
  const lang = useAcademyLang();
  const { quizScores, saveQuizScore, missed } = useAcademyProgress();

  const mod = getModule(params.moduleId);
  const bank = QUIZZES[params.moduleId] ?? [];

  // Ordinea: întâi cele greșite anterior (repetiție), apoi restul. Ordinea se
  // fixează o dată per încercare, ca să nu se amestece în timp ce răspunzi.
  const order = React.useMemo(() => {
    const idx = bank.map((_, i) => i);
    const weight = (i: number) => missed[`${params.moduleId}#${i}`] ?? 0;
    return idx.sort((a, b) => weight(b) - weight(a) || a - b);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.moduleId, bank.length]);

  const [pos, setPos] = React.useState(0);
  const [picked, setPicked] = React.useState<number | null>(null);
  const [answers, setAnswers] = React.useState<{ qi: number; ok: boolean }[]>([]);
  const [finished, setFinished] = React.useState(false);

  if (!mod || bank.length === 0) {
    return (
      <div className="max-w-2xl py-16 text-center">
        <p className="text-[13px] text-[color:var(--ink-4)]">{UI.unavailable[lang]}</p>
        <Link href="/academy" className="inline-flex items-center gap-1.5 mt-4 text-[12px] font-bold text-[color:var(--accent)] hover:underline">
          <ChevronLeft className="w-3.5 h-3.5" /> {UI.backToAcademy[lang]}
        </Link>
      </div>
    );
  }

  const qi = order[pos]!;
  const question = bank[qi]!;
  const isLast = pos === order.length - 1;
  const correctCount = answers.filter((a) => a.ok).length;

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    setAnswers((a) => [...a, { qi, ok: i === question.correct }]);
  };

  const advance = () => {
    if (isLast) {
      const pct = Math.round((correctCount / bank.length) * 100);
      saveQuizScore(mod.id, pct, answers.filter((a) => !a.ok).map((a) => a.qi));
      setFinished(true);
    } else {
      setPos((p) => p + 1);
      setPicked(null);
    }
  };

  const restart = () => {
    setPos(0);
    setPicked(null);
    setAnswers([]);
    setFinished(false);
  };

  // ── Ecranul final ──
  if (finished) {
    const pct = Math.round((correctCount / bank.length) * 100);
    const passed = pct >= PASS_THRESHOLD;
    const best = Math.max(pct, quizScores[mod.id] ?? 0);
    const modIdx = ACADEMY.findIndex((b) => b.module.id === mod.id);
    const nextMod = ACADEMY[modIdx + 1]?.module ?? null;
    const wrongQs = answers.filter((a) => !a.ok).map((a) => bank[a.qi]!);

    return (
      <div className="max-w-2xl space-y-5 pb-10">
        <section
          className="tg-panel tg-boot tg-boot-edge relative rounded-2xl border p-8 md:p-10 text-center overflow-hidden"
          style={passed ? { borderColor: "rgba(52,211,153,0.3)" } : undefined}
        >
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl grid place-items-center border"
            style={
              passed
                ? { background: "rgba(52,211,153,0.10)", borderColor: "rgba(52,211,153,0.35)" }
                : { background: "var(--s-3)", borderColor: "var(--line-2)" }
            }
          >
            {passed ? (
              <Award className="w-8 h-8" style={{ color: "var(--gain)" }} />
            ) : (
              <RotateCcw className="w-7 h-7 text-[color:var(--ink-3)]" />
            )}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--ink-4)] mb-1">{UI.score[lang]}</p>
          <p className="font-display text-[56px] leading-none font-black tabular-nums text-[color:var(--ink-1)]">
            {pct}<span className="text-[24px] text-[color:var(--ink-4)]">%</span>
          </p>
          <p className="mt-1 text-[11px] text-[color:var(--ink-4)] tabular-nums">
            {correctCount}/{bank.length} · {UI.best[lang]} {best}%
          </p>
          <h2 className="font-display text-[22px] font-black mt-5 text-[color:var(--ink-1)]">
            {passed ? UI.passed[lang] : UI.failed[lang]}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--ink-3)] max-w-md mx-auto">
            {passed ? UI.passedSub[lang] : UI.failedSub[lang]}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button onClick={restart} className="tg-btn tg-btn-secondary rounded-xl px-4 py-2.5 text-[12.5px] font-bold inline-flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> {UI.retry[lang]}
            </button>
            {passed && nextMod ? (
              <Link href={`/academy/${nextMod.id}/${nextMod.lessons[0]!.id}`} className="tg-btn tg-btn-primary rounded-xl px-4 py-2.5 text-[12.5px] font-bold inline-flex items-center gap-1.5">
                {UI.nextModule[lang]}: {nextMod.title[lang]}
              </Link>
            ) : (
              <Link href="/academy" className="tg-btn tg-btn-primary rounded-xl px-4 py-2.5 text-[12.5px] font-bold inline-flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" /> {UI.backToAcademy[lang]}
              </Link>
            )}
          </div>
        </section>

        {wrongQs.length > 0 && (
          <section className="tg-surface rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-3.5 h-3.5 text-[color:var(--ink-4)]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--ink-4)]">{UI.review[lang]}</p>
            </div>
            <ul className="space-y-3">
              {wrongQs.map((q, i) => (
                <li key={i} className="text-[13px] leading-relaxed">
                  <p className="font-semibold text-[color:var(--ink-1)]">{q.q[lang]}</p>
                  <p className="mt-0.5 text-[color:var(--ink-3)]">{renderInline(q.explain[lang], lang)}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  // ── Întrebarea curentă ──
  return (
    <div className="max-w-2xl space-y-5 pb-10">
      <Link href={`/academy#${mod.id}`} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[color:var(--ink-4)] hover:text-[color:var(--ink-2)] transition-colors">
        <ChevronLeft className="w-3.5 h-3.5" /> {UI.back[lang]}
      </Link>

      <header>
        <p className="tg-label mb-2" style={{ color: "#fbbf24" }}>{UI.kicker[lang]} · {mod.title[lang]}</p>
        <div className="flex items-center justify-between gap-4">
          <p className="text-[12px] font-bold text-[color:var(--ink-3)] tabular-nums">
            {UI.question[lang]} {pos + 1} {UI.of[lang]} {order.length}
          </p>
          <p className="text-[11px] text-[color:var(--ink-4)] tabular-nums">
            <span style={{ color: "var(--gain)" }}>{correctCount}</span> / {answers.length}
          </p>
        </div>
        {/* progres pe întrebări */}
        <div className="mt-2 flex gap-1">
          {order.map((_, i) => {
            const a = answers[i];
            return (
              <span
                key={i}
                className="h-1 flex-1 rounded-full transition-colors"
                style={{
                  background: a ? (a.ok ? "var(--gain)" : "var(--loss)") : i === pos ? "var(--accent)" : "var(--s-4)",
                }}
              />
            );
          })}
        </div>
      </header>

      <section className="tg-panel tg-boot relative rounded-2xl border p-5 md:p-7">
        <h2 className="font-display text-[18px] md:text-[21px] font-bold tracking-[-0.01em] leading-snug text-[color:var(--ink-1)] mb-5 text-balance">
          {question.q[lang]}
        </h2>

        <div className="space-y-2.5">
          {question.options.map((opt, i) => {
            const isCorrect = i === question.correct;
            const isPicked = picked === i;
            const revealed = picked !== null;
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={revealed}
                className={cn(
                  "w-full text-left rounded-xl border px-4 py-3.5 text-[13.5px] leading-relaxed transition-all flex items-start gap-3",
                  !revealed && "tg-surface hover:border-[color:var(--accent-line)] hover:bg-[color:var(--s-3)] text-[color:var(--ink-2)]",
                  revealed && isCorrect && "border-[rgba(52,211,153,0.4)] bg-[rgba(52,211,153,0.08)] text-[color:var(--ink-1)]",
                  revealed && isPicked && !isCorrect && "border-[rgba(251,92,114,0.4)] bg-[rgba(251,92,114,0.07)] text-[color:var(--ink-1)]",
                  revealed && !isPicked && !isCorrect && "border-[color:var(--line-1)] bg-[color:var(--s-1)] text-[color:var(--ink-4)]"
                )}
              >
                <span
                  className="mt-[2px] w-5 h-5 shrink-0 rounded-md grid place-items-center text-[10px] font-black font-mono border"
                  style={
                    revealed && isCorrect
                      ? { background: "rgba(52,211,153,0.15)", borderColor: "rgba(52,211,153,0.4)", color: "var(--gain)" }
                      : revealed && isPicked
                        ? { background: "rgba(251,92,114,0.15)", borderColor: "rgba(251,92,114,0.4)", color: "var(--loss)" }
                        : { background: "var(--s-4)", borderColor: "var(--line-2)", color: "var(--ink-4)" }
                  }
                >
                  {revealed && isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : revealed && isPicked ? <XCircle className="w-3.5 h-3.5" /> : "ABCD"[i]}
                </span>
                <span>{opt[lang]}</span>
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div
            className="mt-5 rounded-xl border p-4"
            style={
              picked === question.correct
                ? { borderColor: "rgba(52,211,153,0.25)", background: "rgba(52,211,153,0.05)" }
                : { borderColor: "rgba(251,92,114,0.25)", background: "rgba(251,92,114,0.05)" }
            }
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: picked === question.correct ? "var(--gain)" : "var(--loss)" }}>
              {picked === question.correct ? UI.correct[lang] : UI.wrong[lang]}
            </p>
            <p className="text-[13px] leading-relaxed text-[color:var(--ink-2)]">{renderInline(question.explain[lang], lang)}</p>
            <button onClick={advance} className="tg-btn tg-btn-primary mt-4 rounded-xl px-4 py-2.5 text-[12.5px] font-bold w-full md:w-auto">
              {isLast ? UI.seeResult[lang] : UI.next[lang]} →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
