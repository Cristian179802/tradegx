"use client";

import * as React from "react";
import { Flame, Medal, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { CountUp } from "@/components/ui/count-up";
import { ACADEMY, TOTAL_LESSONS, lessonKey } from "@/lib/academy";
import { PASS_THRESHOLD, QUIZZES } from "@/lib/academy/quiz";
import {
  useAcademyProgress,
  useQuizScores,
} from "@/components/academy/use-academy";
import type { Achievement, GamificationData } from "@/lib/gamification";

// ── Realizări & Streak ──────────────────────────────────────────────────────
// Server: 12 realizări din tranzacții/alerte/backteste (date reale).
// Client: 2 realizări din Academie (progresul e stocat local, per dispozitiv).

function AchievementCard({ a }: { a: Achievement }) {
  const pct = Math.min(100, Math.round((a.progress / a.target) * 100));
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all",
        a.unlocked
          ? "border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] to-zinc-900/80"
          : "border-zinc-800/70 bg-zinc-900/60 opacity-80"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-11 h-11 rounded-xl border flex items-center justify-center text-xl shrink-0",
            a.unlocked
              ? "bg-amber-500/15 border-amber-500/40"
              : "bg-zinc-800/60 border-zinc-700/50 grayscale"
          )}
        >
          {a.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-black", a.unlocked ? "text-amber-300" : "text-zinc-400")}>
            {a.title}
          </p>
          <p className="text-[11px] leading-relaxed text-zinc-500 mt-0.5">{a.description}</p>
          {!a.unlocked && a.target > 1 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-zinc-600"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[9px] font-bold text-zinc-600 whitespace-nowrap">
                {a.progress}/{a.target}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  const [data, setData] = React.useState<GamificationData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { done } = useAcademyProgress();
  const quizScores = useQuizScores();

  React.useEffect(() => {
    fetch("/api/gamification", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  // Realizările Academiei — calculate local (progresul e per dispozitiv)
  const lessonsDone = done.size;
  const quizzesPassed = ACADEMY.filter(
    (b) => (quizScores[b.module.id] ?? 0) >= PASS_THRESHOLD
  ).length;
  const totalQuizzes = Object.keys(QUIZZES).length;

  const academyAchievements: Achievement[] = [
    {
      id: "student", emoji: "📚",
      title: "Student",
      description: "10 lecții finalizate în Academia TradeGx.",
      unlocked: lessonsDone >= 10,
      progress: Math.min(lessonsDone, 10), target: 10,
    },
    {
      id: "absolvent", emoji: "🎓",
      title: "Absolvent",
      description: `Toate cele ${totalQuizzes} quiz-uri promovate cu minim ${PASS_THRESHOLD}%.`,
      unlocked: quizzesPassed >= totalQuizzes,
      progress: quizzesPassed, target: totalQuizzes,
    },
  ];

  const all = [...(data?.achievements ?? []), ...academyAchievements];
  const unlockedCount = all.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6 pb-8 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
            <Medal className="w-4 h-4 text-amber-400" />
          </div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Realizări</h1>
        </div>
        <p className="text-sm text-zinc-500">
          Câștigate din date reale — jurnalizare, disciplină, statistică. Nu se cumpără, se fac.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl bg-zinc-800/60" />
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl bg-zinc-800/60" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Streak hero */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/[0.08] to-zinc-900/80 p-5 text-center">
              <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
              <p className="text-3xl font-black text-orange-300 num">
                <CountUp value={data?.streak.current ?? 0} />
              </p>
              <p className="text-[11px] font-bold text-zinc-500 mt-1">
                zile streak curent de jurnalizare
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/80 p-5 text-center">
              <Trophy className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
              <p className="text-3xl font-black text-zinc-200 num">
                <CountUp value={data?.streak.best ?? 0} />
              </p>
              <p className="text-[11px] font-bold text-zinc-500 mt-1">recordul tău de streak</p>
            </div>
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] to-zinc-900/80 p-5 text-center">
              <Medal className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-3xl font-black text-amber-300 num">
                <CountUp value={unlockedCount} />
                <span className="text-lg text-zinc-500">/{all.length}</span>
              </p>
              <p className="text-[11px] font-bold text-zinc-500 mt-1">realizări deblocate</p>
            </div>
          </div>

          {/* Grila de realizări */}
          <div className="grid gap-3 sm:grid-cols-2">
            {all.map((a) => (
              <AchievementCard key={a.id} a={a} />
            ))}
          </div>

          <p className="text-[10px] text-zinc-600">
            Realizările din Academie (Student, Absolvent) se calculează pe acest dispozitiv —
            progresul lecțiilor și quiz-urilor e stocat local.
          </p>
        </>
      )}
    </div>
  );
}
