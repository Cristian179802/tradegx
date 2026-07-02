"use client";

import * as React from "react";
import type { Lang } from "@/lib/academy/types";

const LANG_KEY = "tradegx-academy-lang";
const PROGRESS_KEY = "tradegx-academy-done";
const QUIZ_KEY = "tradegx-academy-quiz";

// ── Limba conținutului (RO/EN), persistată local ────────────────────────────
export function useAcademyLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = React.useState<Lang>("ro");

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "en" || saved === "ro") setLang(saved);
    } catch {}
  }, []);

  const update = React.useCallback((l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {}
  }, []);

  return [lang, update];
}

// ── Progres lecții (chei "moduleId/lessonId"), persistat local ──────────────
export function useAcademyProgress() {
  const [done, setDone] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (raw) setDone(new Set(JSON.parse(raw) as string[]));
    } catch {}
  }, []);

  const toggle = React.useCallback((key: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

  const markDone = React.useCallback((key: string) => {
    setDone((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

  return { done, toggle, markDone };
}

// ── Scoruri quiz per modul (cel mai bun scor %, persistat local) ────────────
export function useQuizScores(): Record<string, number> {
  const [scores, setScores] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(QUIZ_KEY);
        setScores(raw ? (JSON.parse(raw) as Record<string, number>) : {});
      } catch {}
    };
    load();
    // Reîncarcă la revenirea pe tab (după un quiz terminat)
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, []);

  return scores;
}
