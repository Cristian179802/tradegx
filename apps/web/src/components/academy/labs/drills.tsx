"use client";

import * as React from "react";
import { CheckCircle2, Flame, RotateCcw, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PATTERN_DRILLS, SL_DRILLS } from "@/lib/academy/drills";
import type { DiagramDef, Lang } from "@/lib/academy/types";
import { Diagram } from "../diagram";
import { LabShell } from "../lab-shell";
import { useAcademyProgress } from "../use-academy";

// ── Exercițiile ──────────────────────────────────────────────────────────────
//
// Diferența față de quiz: quiz-ul verifică dacă ai citit, exercițiul verifică
// dacă VEZI. Se dă un grafic, se cere o decizie, se explică imediat.
//
// Ordinea itemilor e amestecată la fiecare rulare — altfel a doua trecere se
// rezolvă din memoria pozițiilor, nu din recunoaștere.
//
// Rezultatele intră în progres (`recordDrill`), deci seria maximă supraviețuiește
// și pe alt dispozitiv. Nu ținem scor „de joc" cu puncte inventate: contorul e
// încercări / corecte / cea mai lungă serie, adică date pe care elevul le poate
// interpreta.

const UI = {
  streak: { ro: "serie", en: "streak" },
  score: { ro: "corecte", en: "correct" },
  next: { ro: "Următorul", en: "Next" },
  restart: { ro: "De la început", en: "Start over" },
  correct: { ro: "Corect", en: "Correct" },
  wrong: { ro: "Nu chiar", en: "Not quite" },
  doneTitle: { ro: "Ai terminat exercițiul", en: "Drill complete" },
  doneSub: {
    ro: "Recunoașterea se antrenează prin repetiție, nu prin înțelegere unică. Reia-l după câteva zile.",
    en: "Recognition is trained by repetition, not by understanding it once. Come back to it in a few days.",
  },
  best: { ro: "cea mai lungă serie", en: "longest streak" },
};

/** Amestecă o copie — nu atinge originalul. Fisher-Yates. */
function shuffled<T>(xs: readonly T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function DrillHeader({ lang, streak, correct, total }: { lang: Lang; streak: number; correct: number; total: number }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <div className="flex items-center gap-1.5">
        <Flame className={cn("w-3.5 h-3.5", streak >= 3 ? "" : "opacity-40")} style={{ color: streak >= 3 ? "#fbbf24" : "var(--ink-4)" }} />
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[color:var(--ink-4)]">
          {UI.streak[lang]} <span className="tabular-nums" style={{ color: streak >= 3 ? "#fbbf24" : "var(--ink-2)" }}>{streak}</span>
        </span>
      </div>
      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[color:var(--ink-4)] tabular-nums">
        {correct} / {total} {UI.score[lang]}
      </span>
    </div>
  );
}

function Verdict({ ok, explain, lang, onNext, isLast }: { ok: boolean; explain: string; lang: Lang; onNext: () => void; isLast: boolean }) {
  return (
    <div
      className="mt-4 rounded-xl border p-4"
      style={ok ? { borderColor: "rgba(52,211,153,0.25)", background: "rgba(52,211,153,0.05)" } : { borderColor: "rgba(251,92,114,0.25)", background: "rgba(251,92,114,0.05)" }}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5" style={{ color: ok ? "var(--gain)" : "var(--loss)" }}>
        {ok ? UI.correct[lang] : UI.wrong[lang]}
      </p>
      <p className="text-[13px] leading-relaxed text-[color:var(--ink-2)]">{explain}</p>
      <button onClick={onNext} className="tg-btn tg-btn-primary mt-4 rounded-xl px-4 py-2 text-[12px] font-bold">
        {isLast ? UI.restart[lang] : UI.next[lang]} →
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Recunoașterea pattern-urilor
// ═══════════════════════════════════════════════════════════════════════════

const T_PAT = {
  title: { ro: "Ce vezi pe grafic?", en: "What do you see?" },
  intro: {
    ro: "Fiecare grafic are context înainte de pattern — pentru că pe un grafic real contextul e cel care decide dacă forma înseamnă ceva. Uită-te la ce s-a întâmplat ÎNAINTE.",
    en: "Every chart has context before the pattern — because on a real chart, context decides whether the shape means anything. Look at what happened BEFORE.",
  },
};

export function PatternDrill({ lang, patterns }: { lang: Lang; patterns: string[] }) {
  const { recordDrill, drills } = useAcademyProgress();

  const bank = React.useMemo(() => {
    const wanted = patterns.length ? PATTERN_DRILLS.filter((d) => patterns.includes(d.id)) : PATTERN_DRILLS;
    // O lecție care cere un id inexistent nu rămâne cu exercițiul gol.
    return shuffled(wanted.length ? wanted : PATTERN_DRILLS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patterns.join(",")]);

  const [pos, setPos] = React.useState(0);
  const [picked, setPicked] = React.useState<number | null>(null);
  const [correct, setCorrect] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [done, setDone] = React.useState(false);

  const item = bank[pos];
  const best = drills["pattern-drill"]?.bestStreak ?? 0;

  if (!item || done) {
    return (
      <LabShell title={T_PAT.title} lang={lang}>
        <div className="py-8 text-center">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--gain)" }} />
          <p className="text-[15px] font-bold text-[color:var(--ink-1)]">{UI.doneTitle[lang]}</p>
          <p className="mt-1.5 font-mono text-[13px] tabular-nums text-[color:var(--ink-3)]">
            {correct} / {bank.length} · {UI.best[lang]}: {Math.max(best, streak)}
          </p>
          <p className="mt-3 text-[12.5px] leading-relaxed text-[color:var(--ink-4)] max-w-sm mx-auto">{UI.doneSub[lang]}</p>
          <button
            onClick={() => {
              setPos(0);
              setPicked(null);
              setCorrect(0);
              setStreak(0);
              setDone(false);
            }}
            className="tg-btn tg-btn-secondary mt-5 rounded-xl px-4 py-2 text-[12px] font-bold inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> {UI.restart[lang]}
          </button>
        </div>
      </LabShell>
    );
  }

  // La corectare evidențiem pattern-ul: fără asta, elevul care a greșit nu
  // află nici măcar CARE lumânări erau în discuție.
  const def: DiagramDef = {
    candles: item.candles,
    ...(picked !== null
      ? {
          zones: [
            {
              y1: 0,
              y2: 100,
              x1: item.from,
              x2: item.candles.length - 1,
              color: picked === item.correct ? "#34d399" : "#fbbf24",
            },
          ],
        }
      : {}),
  };

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === item.correct;
    const newStreak = ok ? streak + 1 : 0;
    setStreak(newStreak);
    if (ok) setCorrect((c) => c + 1);
    recordDrill("pattern-drill", ok, newStreak);
  };

  const next = () => {
    if (pos === bank.length - 1) setDone(true);
    else {
      setPos((p) => p + 1);
      setPicked(null);
    }
  };

  return (
    <LabShell title={T_PAT.title} intro={T_PAT.intro} lang={lang}>
      <DrillHeader lang={lang} streak={streak} correct={correct} total={bank.length} />
      <Diagram def={def} lang={lang} />

      <div className="grid sm:grid-cols-2 gap-2 mt-2">
        {item.options.map((opt, i) => {
          const revealed = picked !== null;
          const isCorrect = i === item.correct;
          const isPicked = picked === i;
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={revealed}
              className={cn(
                "text-left rounded-xl border px-3.5 py-3 text-[12.5px] leading-snug transition-all flex items-start gap-2.5",
                !revealed && "border-[color:var(--line-1)] bg-[color:var(--s-1)] hover:border-[color:var(--accent-line)] hover:bg-[color:var(--s-3)] text-[color:var(--ink-2)]",
                revealed && isCorrect && "border-[rgba(52,211,153,0.4)] bg-[rgba(52,211,153,0.08)] text-[color:var(--ink-1)]",
                revealed && isPicked && !isCorrect && "border-[rgba(251,92,114,0.4)] bg-[rgba(251,92,114,0.07)] text-[color:var(--ink-1)]",
                revealed && !isPicked && !isCorrect && "border-[color:var(--line-1)] text-[color:var(--ink-4)]"
              )}
            >
              <span className="mt-[1px] shrink-0">
                {revealed && isCorrect ? (
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--gain)" }} />
                ) : revealed && isPicked ? (
                  <XCircle className="w-3.5 h-3.5" style={{ color: "var(--loss)" }} />
                ) : (
                  <span className="block w-3.5 h-3.5 rounded-md border border-[color:var(--line-2)] text-[8px] font-black font-mono grid place-items-center text-[color:var(--ink-4)]">
                    {"ABCD"[i]}
                  </span>
                )}
              </span>
              {opt[lang]}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <Verdict ok={picked === item.correct} explain={item.explain[lang]} lang={lang} onNext={next} isLast={pos === bank.length - 1} />
      )}
    </LabShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Unde pui stop loss-ul
// ═══════════════════════════════════════════════════════════════════════════

const T_SL = {
  title: { ro: "Unde pui stop loss-ul?", en: "Where does the stop loss go?" },
  intro: {
    ro: "Un stop loss corect stă acolo unde IDEEA ta se dovedește greșită — nu la o distanță pe care o suporți emoțional. Fiecare variantă de mai jos e desenată pe grafic.",
    en: "A correct stop loss sits where your IDEA is proven wrong — not at a distance you can emotionally stomach. Each option below is drawn on the chart.",
  },
};

const SL_COLORS = ["#fb923c", "#38bdf8", "#a78bfa", "#f472b6"];

export function SlDrill({ lang }: { lang: Lang }) {
  const { recordDrill, drills } = useAcademyProgress();
  const bank = React.useMemo(() => shuffled(SL_DRILLS), []);

  const [pos, setPos] = React.useState(0);
  const [picked, setPicked] = React.useState<number | null>(null);
  const [correct, setCorrect] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [done, setDone] = React.useState(false);

  const item = bank[pos];
  const best = drills["sl-drill"]?.bestStreak ?? 0;

  if (!item || done) {
    return (
      <LabShell title={T_SL.title} lang={lang}>
        <div className="py-8 text-center">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--gain)" }} />
          <p className="text-[15px] font-bold text-[color:var(--ink-1)]">{UI.doneTitle[lang]}</p>
          <p className="mt-1.5 font-mono text-[13px] tabular-nums text-[color:var(--ink-3)]">
            {correct} / {bank.length} · {UI.best[lang]}: {Math.max(best, streak)}
          </p>
          <button
            onClick={() => {
              setPos(0);
              setPicked(null);
              setCorrect(0);
              setStreak(0);
              setDone(false);
            }}
            className="tg-btn tg-btn-secondary mt-5 rounded-xl px-4 py-2 text-[12px] font-bold inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> {UI.restart[lang]}
          </button>
        </div>
      </LabShell>
    );
  }

  // Nivelurile candidate se desenează PE grafic, cu litera lor. Un exercițiu
  // despre plasare care descrie plasările în cuvinte ar rata tot rostul.
  const def: DiagramDef = {
    ...item.diagram,
    levels: [
      ...(item.diagram.levels ?? []),
      ...item.options.map((o, i) => ({
        y: o.y,
        label: picked === null ? "ABCD"[i]! : `${"ABCD"[i]}${i === item.correct ? " ✓" : ""}`,
        color: picked === null ? SL_COLORS[i] : i === item.correct ? "#34d399" : "rgba(139,147,165,0.55)",
      })),
    ],
  };

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === item.correct;
    const newStreak = ok ? streak + 1 : 0;
    setStreak(newStreak);
    if (ok) setCorrect((c) => c + 1);
    recordDrill("sl-drill", ok, newStreak);
  };

  const next = () => {
    if (pos === bank.length - 1) setDone(true);
    else {
      setPos((p) => p + 1);
      setPicked(null);
    }
  };

  return (
    <LabShell title={T_SL.title} intro={T_SL.intro} lang={lang}>
      <DrillHeader lang={lang} streak={streak} correct={correct} total={bank.length} />
      <p className="text-[13.5px] font-semibold text-[color:var(--ink-1)] mb-1">{item.question[lang]}</p>
      <Diagram def={def} lang={lang} />

      <div className="grid sm:grid-cols-2 gap-2 mt-2">
        {item.options.map((opt, i) => {
          const revealed = picked !== null;
          const isCorrect = i === item.correct;
          const isPicked = picked === i;
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={revealed}
              className={cn(
                "text-left rounded-xl border px-3.5 py-3 text-[12.5px] leading-snug transition-all flex items-start gap-2.5",
                !revealed && "border-[color:var(--line-1)] bg-[color:var(--s-1)] hover:bg-[color:var(--s-3)] text-[color:var(--ink-2)]",
                revealed && isCorrect && "border-[rgba(52,211,153,0.4)] bg-[rgba(52,211,153,0.08)] text-[color:var(--ink-1)]",
                revealed && isPicked && !isCorrect && "border-[rgba(251,92,114,0.4)] bg-[rgba(251,92,114,0.07)] text-[color:var(--ink-1)]",
                revealed && !isPicked && !isCorrect && "border-[color:var(--line-1)] text-[color:var(--ink-4)]"
              )}
              style={!revealed ? { borderLeftColor: SL_COLORS[i], borderLeftWidth: 3 } : undefined}
            >
              <span
                className="mt-[1px] shrink-0 w-3.5 h-3.5 rounded-md grid place-items-center text-[8px] font-black font-mono"
                style={{
                  background: revealed ? (isCorrect ? "rgba(52,211,153,0.15)" : "var(--s-4)") : `${SL_COLORS[i]}22`,
                  color: revealed ? (isCorrect ? "var(--gain)" : "var(--ink-4)") : SL_COLORS[i],
                }}
              >
                {"ABCD"[i]}
              </span>
              {opt.label[lang]}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <Verdict ok={picked === item.correct} explain={item.explain[lang]} lang={lang} onNext={next} isLast={pos === bank.length - 1} />
      )}
    </LabShell>
  );
}
