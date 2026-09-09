"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import type { Lang } from "@/lib/academy/types";
import {
  EMPTY_PROGRESS,
  mergeProgress,
  normalize,
  sameProgress,
  type AcademyProgressData,
  type DrillStat,
} from "@/lib/academy/progress-merge";

// ── Limba conținutului ───────────────────────────────────────────────────────
// Urmează limba site-ului. Înainte Academia avea propriul comutator, separat de
// cel din antet — două butoane RO/EN pe același ecran, care puteau să nu fie de
// acord. Un singur loc de decizie, cel pe care utilizatorul îl știe deja.
export function useAcademyLang(): Lang {
  const locale = useLocale();
  return locale === "en" ? "en" : "ro";
}

// ── Progresul ────────────────────────────────────────────────────────────────
//
// Două surse, o singură stare:
//   1. localStorage — instant, merge offline, și e tot ce are contul DEMO
//   2. serverul     — supraviețuiește schimbării de dispozitiv, ajunge în app
//
// La pornire: citim local (afișăm imediat), cerem serverul, ÎMBINĂM, și dacă
// îmbinarea e diferită de ce știa serverul, i-o trimitem. La fiecare bifă:
// scriem local pe loc, iar spre server trimitem cu întârziere mică, grupat —
// un elev care bifează trei lecții în zece secunde face UN apel, nu trei.

const STORAGE_KEY = "tradegx-academy-progress-v2";
// Cheile vechi, dinainte de sincronizare. Le citim o singură dată, la migrare,
// ca nimeni să nu-și piardă lecțiile terminate în vechea versiune.
const LEGACY_DONE_KEY = "tradegx-academy-done";
const LEGACY_QUIZ_KEY = "tradegx-academy-quiz";

function readLocal(): AcademyProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalize(JSON.parse(raw));

    // Migrare din formatul vechi.
    const legacyDone = localStorage.getItem(LEGACY_DONE_KEY);
    const legacyQuiz = localStorage.getItem(LEGACY_QUIZ_KEY);
    if (legacyDone || legacyQuiz) {
      const migrated = normalize({
        lessons: legacyDone ? JSON.parse(legacyDone) : [],
        quizzes: legacyQuiz ? JSON.parse(legacyQuiz) : {},
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {}
  return EMPTY_PROGRESS;
}

function writeLocal(p: AcademyProgressData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {}
}

// O singură stare partajată de toate componentele montate (index, lecție, quiz
// deschise în același tab): altfel bifa dintr-o pagină nu se vedea în cealaltă
// până la reîncărcare.
type Listener = (p: AcademyProgressData) => void;
const listeners = new Set<Listener>();
let shared: AcademyProgressData | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let serverKnown: AcademyProgressData | null = null;
let isLocalOnly = false;

function emit(p: AcademyProgressData) {
  shared = p;
  writeLocal(p);
  for (const l of listeners) l(p);
}

async function pushToServer(p: AcademyProgressData) {
  if (isLocalOnly) return;
  try {
    const res = await fetch("/api/academy/progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { local: boolean; progress: unknown };
    if (data.local) {
      isLocalOnly = true;
      return;
    }
    serverKnown = normalize(data.progress);
    // Serverul poate ști ceva ce noi nu (alt dispozitiv a bifat între timp).
    const merged = mergeProgress(shared ?? EMPTY_PROGRESS, serverKnown);
    if (!sameProgress(merged, shared ?? EMPTY_PROGRESS)) emit(merged);
  } catch {
    // Offline sau server căzut: starea locală rămâne adevărul, reîncercăm la
    // următoarea modificare.
  }
}

function schedulePush() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    if (shared) void pushToServer(shared);
  }, 1200);
}

function update(fn: (prev: AcademyProgressData) => AcademyProgressData) {
  const next = fn(shared ?? EMPTY_PROGRESS);
  if (sameProgress(next, shared ?? EMPTY_PROGRESS)) return;
  emit(next);
  schedulePush();
}

export function useAcademyProgress() {
  const { data: session, status } = useSession();
  const [progress, setProgress] = React.useState<AcademyProgressData>(() => shared ?? EMPTY_PROGRESS);
  const [synced, setSynced] = React.useState(serverKnown !== null || isLocalOnly);

  React.useEffect(() => {
    if (shared === null) emit(readLocal());
    else setProgress(shared);

    const l: Listener = (p) => setProgress(p);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  // Prima sincronizare cu serverul, o dată per sesiune de pagină.
  React.useEffect(() => {
    if (status !== "authenticated") return;
    if (serverKnown !== null || isLocalOnly) {
      setSynced(true);
      return;
    }
    if (session?.user?.role === "DEMO") {
      isLocalOnly = true;
      setSynced(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/academy/progress", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { local: boolean; progress: unknown };
        if (cancelled) return;
        if (data.local) {
          isLocalOnly = true;
          return;
        }
        serverKnown = normalize(data.progress);
        const merged = mergeProgress(shared ?? EMPTY_PROGRESS, serverKnown);
        if (!sameProgress(merged, shared ?? EMPTY_PROGRESS)) emit(merged);
        // Localul știa ceva ce serverul nu: urcăm îmbinarea.
        if (!sameProgress(merged, serverKnown)) void pushToServer(merged);
      } catch {
      } finally {
        if (!cancelled) setSynced(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.role]);

  const done = React.useMemo(() => new Set(progress.lessons), [progress.lessons]);

  const markDone = React.useCallback((key: string) => {
    update((p) => (p.lessons.includes(key) ? p : { ...p, lessons: [...p.lessons, key].sort() }));
  }, []);

  const toggle = React.useCallback((key: string) => {
    update((p) =>
      p.lessons.includes(key)
        ? { ...p, lessons: p.lessons.filter((k) => k !== key) }
        : { ...p, lessons: [...p.lessons, key].sort() }
    );
  }, []);

  const saveQuizScore = React.useCallback((moduleId: string, pct: number, missedIdx: number[] = []) => {
    update((p) => {
      const missed = { ...p.missed };
      for (const i of missedIdx) {
        const k = `${moduleId}#${i}`;
        missed[k] = (missed[k] ?? 0) + 1;
      }
      return {
        ...p,
        quizzes: { ...p.quizzes, [moduleId]: Math.max(p.quizzes[moduleId] ?? 0, Math.round(pct)) },
        missed,
      };
    });
  }, []);

  const recordDrill = React.useCallback((drillId: string, correct: boolean, streak: number) => {
    update((p) => {
      const cur: DrillStat = p.drills[drillId] ?? { attempts: 0, correct: 0, bestStreak: 0 };
      return {
        ...p,
        drills: {
          ...p.drills,
          [drillId]: {
            attempts: cur.attempts + 1,
            correct: cur.correct + (correct ? 1 : 0),
            bestStreak: Math.max(cur.bestStreak, streak),
          },
        },
      };
    });
  }, []);

  return {
    progress,
    done,
    quizScores: progress.quizzes,
    drills: progress.drills,
    missed: progress.missed,
    markDone,
    toggle,
    saveQuizScore,
    recordDrill,
    /** true după ce am vorbit cu serverul (sau am aflat că suntem doar local) */
    synced,
  };
}
