"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Award,
  BadgeCheck,
  BarChart3,
  BookMarked,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  GraduationCap,
  HeartPulse,
  Newspaper,
  Settings2,
  Shapes,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Workflow,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ACADEMY, TOTAL_LESSONS, lessonKey } from "@/lib/academy";
import type { AcademyLevel, AcademyModule } from "@/lib/academy/types";
import { PASS_THRESHOLD, QUIZZES } from "@/lib/academy/quiz";
import { GLOSSARY } from "@/lib/academy/glossary";
import { useAcademyLang, useAcademyProgress } from "@/components/academy/use-academy";

// ── Academia: traseul de învățare ────────────────────────────────────────────
//
// Nu o grilă de carduri egale, ci un DRUM: patru trepte (Începător → Expert),
// modulele înșirate pe el, cu o linie care le leagă. Elevul vede dintr-o
// privire unde e, ce urmează și cât mai are. Panoul de sus îi dă mereu UN
// singur buton: „continuă de unde ai rămas”.

const ICONS: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  book: BookOpen,
  chart: TrendingUp,
  candlestick: BarChart3,
  shapes: Shapes,
  activity: Activity,
  brain: Brain,
  shield: ShieldCheck,
  heart: HeartPulse,
  cog: Settings2,
  news: Newspaper,
  target: Target,
  workflow: Workflow,
};

const LEVELS: { id: AcademyLevel; label: { ro: string; en: string }; blurb: { ro: string; en: string } }[] = [
  {
    id: "BEGINNER",
    label: { ro: "Începător", en: "Beginner" },
    blurb: { ro: "Limbajul pieței și cum se citește un grafic.", en: "The market's language and how to read a chart." },
  },
  {
    id: "INTERMEDIATE",
    label: { ro: "Intermediar", en: "Intermediate" },
    blurb: { ro: "Pattern-uri, indicatori și — înainte de orice — riscul.", en: "Patterns, indicators and — before anything — risk." },
  },
  {
    id: "ADVANCED",
    label: { ro: "Avansat", en: "Advanced" },
    blurb: { ro: "Cum gândesc banii mari și cum gândești tu sub presiune.", en: "How big money thinks and how you think under pressure." },
  },
  {
    id: "EXPERT",
    label: { ro: "Expert", en: "Expert" },
    blurb: { ro: "Un sistem complet, testat, cu cifre în spate.", en: "A complete, tested system with numbers behind it." },
  },
];

const UI = {
  kicker: { ro: "Educație · Academia", en: "Education · Academy" },
  title: { ro: "Academia TradeGx", en: "TradeGx Academy" },
  subtitle: {
    ro: "Cursul complet de trading: de la prima lumânare până la un sistem propriu, testat. Lecții, diagrame, laboratoare pe date reale și quiz-uri — pas cu pas.",
    en: "The complete trading course: from your first candle to your own tested system. Lessons, diagrams, labs on real data and quizzes — step by step.",
  },
  yourProgress: { ro: "Progresul tău", en: "Your progress" },
  lessons: { ro: "lecții", en: "lessons" },
  lessonsDone: { ro: "lecții terminate", en: "lessons done" },
  quizzesPassed: { ro: "module absolvite", en: "modules passed" },
  minutesLeft: { ro: "min rămase", en: "min left" },
  continueWith: { ro: "Continuă cu", en: "Continue with" },
  startWith: { ro: "Începe cu", en: "Start with" },
  allDone: { ro: "Ai terminat tot cursul", en: "You've finished the whole course" },
  glossary: { ro: "Glosar", en: "Glossary" },
  glossaryTerms: { ro: "termeni explicați", en: "terms explained" },
  quiz: { ro: "Quiz final", en: "Final quiz" },
  passed: { ro: "Absolvit", en: "Passed" },
  start: { ro: "Începe", en: "Start" },
  continue: { ro: "Continuă", en: "Continue" },
  review: { ro: "Recitește", en: "Review" },
  minutes: { ro: "min", en: "min" },
  certTitle: { ro: "Certificat de absolvire", en: "Certificate of completion" },
  certBody: {
    ro: "a absolvit Academia TradeGx — toate modulele, cu scor de minim 80% la fiecare quiz final.",
    en: "has completed the TradeGx Academy — every module, scoring at least 80% on every final quiz.",
  },
  certPrint: { ro: "Descarcă / Printează", en: "Download / Print" },
  syncing: { ro: "se sincronizează…", en: "syncing…" },
} as const;

export default function AcademyPage() {
  const lang = useAcademyLang();
  const { done, quizScores, synced } = useAcademyProgress();
  const { data: session } = useSession();
  const [openId, setOpenId] = React.useState<string | null>(null);

  // Deschide modulul din URL (#modul-id) — vine din glosar sau din lecție.
  React.useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id && ACADEMY.some((b) => b.module.id === id)) {
      setOpenId(id);
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: "center", behavior: "smooth" }), 50);
    }
  }, []);

  const quizPassed = (id: string) => (quizScores[id] ?? 0) >= PASS_THRESHOLD;
  const doneCount = done.size;
  const pct = TOTAL_LESSONS > 0 ? Math.round((doneCount / TOTAL_LESSONS) * 100) : 0;
  const passedCount = ACADEMY.filter((b) => quizPassed(b.module.id)).length;
  const allPassed = passedCount === ACADEMY.length;
  const minutesLeft = ACADEMY.reduce(
    (a, b) => a + b.module.lessons.filter((l) => !done.has(lessonKey(b.module.id, l.id))).reduce((x, l) => x + l.minutes, 0),
    0
  );

  // Următoarea lecție: prima neterminată din primul modul neterminat.
  const next = React.useMemo(() => {
    for (const { module: m } of ACADEMY) {
      const l = m.lessons.find((x) => !done.has(lessonKey(m.id, x.id)));
      if (l) return { module: m, lesson: l };
    }
    return null;
  }, [done]);

  const glossaryCount = Object.keys(GLOSSARY).length;

  return (
    <div className="max-w-5xl space-y-8 pb-10">
      {/* Antet */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="tg-label mb-2">{UI.kicker[lang]}</p>
          <h1 className="font-display text-[30px] md:text-[38px] font-black tracking-[-0.03em] leading-[1.02] text-[color:var(--ink-1)]">
            {UI.title[lang]}
          </h1>
          <p className="mt-2.5 text-[14px] leading-relaxed text-[color:var(--ink-3)] max-w-2xl">{UI.subtitle[lang]}</p>
        </div>
        <Link
          href="/academy/glosar"
          className="tg-surface group rounded-xl px-4 py-3 flex items-center gap-3 hover:border-[color:var(--accent-line)] transition-colors"
        >
          <div className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-line)" }}>
            <BookMarked className="w-4 h-4 text-[color:var(--accent)]" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-[color:var(--ink-1)] leading-tight">{UI.glossary[lang]}</p>
            <p className="text-[10px] text-[color:var(--ink-4)] tabular-nums">{glossaryCount} {UI.glossaryTerms[lang]}</p>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[color:var(--ink-4)] group-hover:text-[color:var(--accent)] group-hover:translate-x-0.5 transition-all" />
        </Link>
      </header>

      {/* Panoul de progres + „continuă” */}
      <section className="tg-panel tg-boot tg-boot-edge relative overflow-hidden rounded-2xl border">
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, var(--accent-line) 30%, transparent 75%)" }}
        />
        <div className="grid md:grid-cols-[1fr_auto] gap-6 p-5 md:p-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[color:var(--accent)]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--ink-4)]">
                {UI.yourProgress[lang]}
                {!synced && <span className="ml-2 normal-case tracking-normal font-medium">{UI.syncing[lang]}</span>}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 md:gap-8">
              <Stat value={doneCount} of={TOTAL_LESSONS} label={UI.lessonsDone[lang]} />
              <Stat value={passedCount} of={ACADEMY.length} label={UI.quizzesPassed[lang]} />
              <Stat value={minutesLeft} label={UI.minutesLeft[lang]} icon={<Clock className="w-3 h-3" />} />
            </div>

            <div className="mt-5 h-1.5 rounded-full overflow-hidden bg-[color:var(--s-4)]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--accent), #8b5cf6)" }}
              />
            </div>
          </div>

          <div className="flex md:flex-col md:justify-center md:items-end gap-2 md:min-w-[260px]">
            {next ? (
              <Link
                href={`/academy/${next.module.id}/${next.lesson.id}`}
                className="tg-btn tg-btn-primary group w-full md:w-auto rounded-xl px-5 py-3.5 flex items-center justify-between gap-4"
              >
                <span className="min-w-0 text-left">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.12em] opacity-80">
                    {doneCount > 0 ? UI.continueWith[lang] : UI.startWith[lang]}
                  </span>
                  <span className="block text-[13px] font-bold truncate">{next.lesson.title[lang]}</span>
                </span>
                <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : (
              <p className="text-[13px] font-bold" style={{ color: "var(--gain)" }}>
                <CheckCircle2 className="inline w-4 h-4 mr-1.5 -mt-0.5" />
                {UI.allDone[lang]}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Certificat — apare când toate quiz-urile sunt promovate */}
      {allPassed && (
        <section className="rounded-2xl border p-8 text-center print:border-amber-600" style={{ borderColor: "rgba(251,191,36,0.35)", background: "linear-gradient(135deg, rgba(251,191,36,0.08), var(--s-2))" }}>
          <Award className="w-10 h-10 mx-auto mb-3" style={{ color: "#fbbf24" }} />
          <p className="tg-label mb-2" style={{ color: "rgba(251,191,36,0.8)" }}>TradeGx Academy</p>
          <h2 className="font-display text-[22px] font-black text-[color:var(--ink-1)] mb-3">{UI.certTitle[lang]}</h2>
          <p className="font-display text-[26px] font-black mb-2" style={{ color: "#fcd34d" }}>{session?.user?.name ?? "Trader"}</p>
          <p className="text-[12px] text-[color:var(--ink-3)] max-w-md mx-auto mb-1">{UI.certBody[lang]}</p>
          <p className="text-[10px] text-[color:var(--ink-4)] mb-5">
            {new Date().toLocaleDateString(lang === "ro" ? "ro-RO" : "en-US", { day: "numeric", month: "long", year: "numeric" })} · tradegx.com
          </p>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-[12px] font-bold transition-colors print:hidden hover:bg-[rgba(251,191,36,0.14)]"
            style={{ borderColor: "rgba(251,191,36,0.4)", background: "rgba(251,191,36,0.08)", color: "#fcd34d" }}
          >
            <Award className="w-3.5 h-3.5" /> {UI.certPrint[lang]}
          </button>
        </section>
      )}

      {/* Traseul */}
      <div className="relative">
        {/* linia drumului */}
        <div className="absolute left-[19px] top-4 bottom-4 w-px hidden md:block" style={{ background: "linear-gradient(180deg, var(--accent-line), var(--line-2) 40%, var(--line-1))" }} />

        <div className="space-y-10">
          {LEVELS.map((lvl, li) => {
            const mods = ACADEMY.filter((b) => b.module.level === lvl.id).map((b) => b.module);
            if (mods.length === 0) return null;
            const lvlDone = mods.every((m) => m.lessons.every((l) => done.has(lessonKey(m.id, l.id))));
            return (
              <section key={lvl.id} className="relative md:pl-14">
                {/* nodul treptei */}
                <div className="hidden md:grid absolute left-0 top-0 w-10 h-10 place-items-center">
                  <div
                    className={cn("w-10 h-10 rounded-xl grid place-items-center border font-display text-[13px] font-black", lvlDone ? "" : "text-[color:var(--ink-2)]")}
                    style={
                      lvlDone
                        ? { background: "rgba(52,211,153,0.10)", borderColor: "rgba(52,211,153,0.35)", color: "var(--gain)" }
                        : { background: "var(--s-3)", borderColor: "var(--line-2)" }
                    }
                  >
                    {lvlDone ? <CheckCircle2 className="w-[18px] h-[18px]" /> : `0${li + 1}`}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-3">
                    <h2 className="font-display text-[18px] font-black tracking-[-0.01em] text-[color:var(--ink-1)]">{lvl.label[lang]}</h2>
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--ink-4)] tabular-nums">
                      {mods.length} {mods.length === 1 ? (lang === "ro" ? "modul" : "module") : (lang === "ro" ? "module" : "modules")}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-[color:var(--ink-3)] mt-0.5">{lvl.blurb[lang]}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {mods.map((mod) => (
                    <ModuleCard
                      key={mod.id}
                      mod={mod}
                      lang={lang}
                      done={done}
                      quizScore={quizScores[mod.id]}
                      open={openId === mod.id}
                      onToggle={() => setOpenId(openId === mod.id ? null : mod.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <p className="text-center text-[11px] text-[color:var(--ink-4)] pt-2">
        <GraduationCap className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
        {ACADEMY.length} {lang === "ro" ? "module" : "modules"} · {TOTAL_LESSONS} {UI.lessons[lang]} ·{" "}
        {ACADEMY.reduce((a, b) => a + b.module.lessons.reduce((x, l) => x + l.minutes, 0), 0)} {UI.minutes[lang]}
      </p>
    </div>
  );
}

function Stat({ value, of, label, icon }: { value: number; of?: number; label: string; icon?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="font-display text-[26px] md:text-[30px] leading-none font-black tabular-nums text-[color:var(--ink-1)]">
        {value}
        {of != null && <span className="text-[14px] font-bold text-[color:var(--ink-4)]"> / {of}</span>}
      </p>
      <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--ink-4)] flex items-center gap-1 truncate">
        {icon}
        {label}
      </p>
    </div>
  );
}

function ProgressRing({ pct, size = 40 }: { pct: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const full = pct >= 100;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--s-4)" strokeWidth={3} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={full ? "var(--gain)" : "var(--accent)"}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.min(100, pct) / 100)}
        className="transition-[stroke-dashoffset] duration-700"
      />
    </svg>
  );
}

function ModuleCard({
  mod,
  lang,
  done,
  quizScore,
  open,
  onToggle,
}: {
  mod: AcademyModule;
  lang: "ro" | "en";
  done: Set<string>;
  quizScore: number | undefined;
  open: boolean;
  onToggle: () => void;
}) {
  const Icon = ICONS[mod.icon] ?? Sparkles;
  const modDone = mod.lessons.filter((l) => done.has(lessonKey(mod.id, l.id))).length;
  const modPct = Math.round((modDone / mod.lessons.length) * 100);
  const totalMin = mod.lessons.reduce((a, l) => a + l.minutes, 0);
  const passed = (quizScore ?? 0) >= PASS_THRESHOLD;
  const firstUnfinished = mod.lessons.find((l) => !done.has(lessonKey(mod.id, l.id))) ?? mod.lessons[0]!;
  const hasQuiz = (QUIZZES[mod.id]?.length ?? 0) > 0;

  return (
    <div
      id={mod.id}
      className={cn(
        "tg-surface rounded-2xl transition-colors scroll-mt-24",
        modPct === 100 ? "border-[color:rgba(52,211,153,0.28)]" : "hover:border-[color:var(--line-2)]"
      )}
    >
      <button onClick={onToggle} className="w-full text-left p-4 md:p-5" aria-expanded={open}>
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0">
            <ProgressRing pct={modPct} size={44} />
            <Icon className={cn("absolute inset-0 m-auto w-[18px] h-[18px]", modPct === 100 ? "" : "text-[color:var(--ink-2)]")} style={modPct === 100 ? { color: "var(--gain)" } : undefined} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[14px] font-bold text-[color:var(--ink-1)] leading-tight">{mod.title[lang]}</h3>
              <ChevronDown className={cn("w-4 h-4 shrink-0 text-[color:var(--ink-4)] transition-transform mt-0.5", open && "rotate-180")} />
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[color:var(--ink-3)] line-clamp-2">{mod.description[lang]}</p>
            <div className="mt-2.5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--ink-4)] tabular-nums">
              <span>{modDone}/{mod.lessons.length} {UI.lessons[lang]}</span>
              <span className="w-px h-3 bg-[color:var(--line-2)]" />
              <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {totalMin} {UI.minutes[lang]}</span>
              {passed && (
                <>
                  <span className="w-px h-3 bg-[color:var(--line-2)]" />
                  <span className="inline-flex items-center gap-1" style={{ color: "#fbbf24" }}>
                    <BadgeCheck className="w-3 h-3" /> {UI.passed[lang]} {quizScore}%
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-[color:var(--line-1)]">
          {mod.lessons.map((lesson, li) => {
            const isDone = done.has(lessonKey(mod.id, lesson.id));
            return (
              <Link
                key={lesson.id}
                href={`/academy/${mod.id}/${lesson.id}`}
                className="flex items-center gap-3 px-4 md:px-5 py-2.5 hover:bg-[color:var(--s-3)] transition-colors group border-b border-[color:var(--line-1)] last:border-b-0"
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--gain)" }} />
                ) : (
                  <Circle className="w-4 h-4 shrink-0 text-[color:var(--ink-4)] opacity-50" />
                )}
                <span className="w-5 text-[10px] font-mono font-bold text-[color:var(--ink-4)] tabular-nums">{String(li + 1).padStart(2, "0")}</span>
                <span className={cn("flex-1 text-[12.5px] font-medium", isDone ? "text-[color:var(--ink-3)]" : "text-[color:var(--ink-2)] group-hover:text-[color:var(--ink-1)]")}>
                  {lesson.title[lang]}
                </span>
                <span className="text-[10px] text-[color:var(--ink-4)] tabular-nums">{lesson.minutes} {UI.minutes[lang]}</span>
              </Link>
            );
          })}
          {hasQuiz && (
            <Link
              href={`/academy/${mod.id}/quiz`}
              className="flex items-center gap-3 px-4 md:px-5 py-3 transition-colors group hover:bg-[rgba(251,191,36,0.05)]"
            >
              {passed ? (
                <BadgeCheck className="w-4 h-4 shrink-0" style={{ color: "#fbbf24" }} />
              ) : (
                <Award className="w-4 h-4 shrink-0 text-[color:var(--ink-4)] group-hover:text-[#fbbf24] transition-colors" />
              )}
              <span className="w-5" />
              <span className="flex-1 text-[12.5px] font-bold" style={{ color: "#fbbf24" }}>
                {UI.quiz[lang]}
                {quizScore != null && <span className="ml-2 text-[10px] font-semibold text-[color:var(--ink-4)]">{quizScore}%</span>}
              </span>
              <span className="text-[10px] text-[color:var(--ink-4)] tabular-nums">{QUIZZES[mod.id]!.length} ×</span>
            </Link>
          )}
        </div>
      )}

      {!open && (
        <div className="px-4 md:px-5 pb-4 -mt-1">
          <Link
            href={`/academy/${mod.id}/${firstUnfinished.id}`}
            className="inline-flex items-center gap-1.5 text-[12px] font-bold transition-colors group"
            style={{ color: modPct === 100 ? "var(--gain)" : "var(--accent)" }}
          >
            {modPct === 100 ? UI.review[lang] : modDone > 0 ? UI.continue[lang] : UI.start[lang]}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  );
}
