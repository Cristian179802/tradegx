import type { AcademyLevel, DiagramDef, I18nText, ModuleBundle } from "./types";
import { M1_BUNDLE } from "./modules/m1-bazele";
import { M2_BUNDLE } from "./modules/m2-structura";
import { M3_BUNDLE } from "./modules/m3-candlestick";
import { M4_BUNDLE } from "./modules/m4-chart-patterns";
import { M5_BUNDLE } from "./modules/m5-indicatori";
import { M6_BUNDLE } from "./modules/m6-smc";
import { M7_BUNDLE } from "./modules/m7-risk";
import { M8_BUNDLE } from "./modules/m8-psihologie";
import { M9_BUNDLE } from "./modules/m9-sisteme";

export * from "./types";

// Ordinea = curriculum-ul recomandat (începător → expert).
export const ACADEMY: ModuleBundle[] = [
  M1_BUNDLE,
  M2_BUNDLE,
  M3_BUNDLE,
  M4_BUNDLE,
  M5_BUNDLE,
  M7_BUNDLE, // Risk management devreme — intenționat înainte de SMC
  M6_BUNDLE,
  M8_BUNDLE,
  M9_BUNDLE,
];

// Registru global de diagrame (cheile sunt prefixate mN- deci nu se ciocnesc).
export const DIAGRAMS: Record<string, DiagramDef> = Object.assign(
  {},
  ...ACADEMY.map((b) => b.diagrams)
);

export const LEVEL_META: Record<
  AcademyLevel,
  { label: I18nText; color: string; bg: string; border: string }
> = {
  BEGINNER: {
    label: { ro: "Începător", en: "Beginner" },
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  INTERMEDIATE: {
    label: { ro: "Intermediar", en: "Intermediate" },
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
  },
  ADVANCED: {
    label: { ro: "Avansat", en: "Advanced" },
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  EXPERT: {
    label: { ro: "Expert", en: "Expert" },
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
  },
};

export function getModule(moduleId: string) {
  return ACADEMY.find((b) => b.module.id === moduleId)?.module ?? null;
}

export function getLesson(moduleId: string, lessonId: string) {
  const mod = getModule(moduleId);
  if (!mod) return null;
  const idx = mod.lessons.findIndex((l) => l.id === lessonId);
  if (idx === -1) return null;
  return {
    module: mod,
    lesson: mod.lessons[idx],
    prev: idx > 0 ? mod.lessons[idx - 1] : null,
    next: idx < mod.lessons.length - 1 ? mod.lessons[idx + 1] : null,
  };
}

export function lessonKey(moduleId: string, lessonId: string) {
  return `${moduleId}/${lessonId}`;
}

export const TOTAL_LESSONS = ACADEMY.reduce(
  (acc, b) => acc + b.module.lessons.length,
  0
);
