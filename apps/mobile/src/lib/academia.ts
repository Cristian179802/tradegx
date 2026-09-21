import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

// ── Academia pe telefon ──────────────────────────────────────────────────────
//
// Conținutul (lecții, diagrame, quiz-uri, glosar) vine de la server O SINGURĂ
// DATĂ și se păstrează local. Motivul e simplu: un curs de nouă module nu se
// descarcă de fiecare dată când deschizi aplicația în metrou, iar o lecție
// citită ieri trebuie să se deschidă și fără semnal.
//
// STRATEGIA E „ARATĂ ÎNTÂI CE AI”. La deschidere se afișează imediat versiunea
// salvată, iar în fundal se întreabă serverul dacă are alta. Când are, se
// înlocuiește. Alternativa — schelet până vine răspunsul — ar fi însemnat două
// secunde de ecran gol pentru conținut pe care îl aveam deja pe disc.
//
// PROGRESUL SE ÎMBINĂ, nu se suprascrie. Aceeași regulă ca pe web: o lecție
// terminată oriunde rămâne terminată, la quiz contează cel mai bun scor. Doi
// clienți care scriu în paralel converg la același rezultat, fiindcă îmbinarea
// nu depinde de ordine.

export type Lang = "ro" | "en";

export interface I18nText {
  ro: string;
  en: string;
}

export interface OHLC {
  o: number;
  h: number;
  l: number;
  c: number;
  hidden?: boolean;
}

export interface DiagramDef {
  candles: OHLC[];
  line?: (number | null)[];
  levels?: { y: number; label?: string; color?: string; dashed?: boolean }[];
  zones?: { y1: number; y2: number; x1?: number; x2?: number; color?: string; label?: string }[];
  trend?: { x1: number; y1: number; x2: number; y2: number; color?: string; dashed?: boolean }[];
  arrows?: { x: number; y: number; dir: "up" | "down"; color?: string; label?: string }[];
  labels?: { x: number; y: number; text: string; color?: string }[];
  caption?: I18nText;
}

export type LabRef =
  | { kind: "risk-lab"; preset?: Record<string, number> }
  | { kind: "drawdown-lab" }
  | { kind: "expectancy-lab"; preset?: Record<string, number> }
  | { kind: "chart-lab"; symbol: string; tf: "15" | "60" | "240" | "D"; overlays: string[]; focus?: I18nText }
  | { kind: "pattern-drill"; patterns: string[] }
  | { kind: "sl-drill" };

export interface LessonSection {
  heading?: I18nText;
  body: I18nText;
  diagram?: string;
  tip?: I18nText;
  warning?: I18nText;
  example?: I18nText;
  takeaways?: I18nText[];
  table?: { head: I18nText[]; rows: I18nText[][] };
  formula?: { expr: string; legend?: I18nText };
  lab?: LabRef;
}

export interface Lesson {
  id: string;
  title: I18nText;
  minutes: number;
  sections: LessonSection[];
}

export type AcademyLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

export interface AcademyModule {
  id: string;
  level: AcademyLevel;
  icon: string;
  title: I18nText;
  description: I18nText;
  lessons: Lesson[];
}

export interface QuizQuestion {
  q: I18nText;
  options: I18nText[];
  correct: number;
  explain: I18nText;
}

export interface GlossaryEntry {
  term: I18nText;
  def: I18nText;
  module?: string;
  aliases?: string[];
}

export interface ContinutAcademie {
  version: string;
  totalLessons: number;
  passThreshold: number;
  modules: AcademyModule[];
  diagrams: Record<string, DiagramDef>;
  quizzes: Record<string, QuizQuestion[]>;
  glossary: Record<string, GlossaryEntry>;
}

export interface DrillStat {
  attempts: number;
  correct: number;
  bestStreak: number;
}

export interface Progres {
  lessons: string[];
  quizzes: Record<string, number>;
  drills: Record<string, DrillStat>;
  missed: Record<string, number>;
}

export const PROGRES_GOL: Progres = { lessons: [], quizzes: {}, drills: {}, missed: {} };

const CHEIE_CONTINUT = "tradegx-academia-continut";
const CHEIE_PROGRES = "tradegx-academia-progres";

/* ── Conținut ─────────────────────────────────────────────────────────────── */

export async function continutLocal(): Promise<ContinutAcademie | null> {
  try {
    const brut = await AsyncStorage.getItem(CHEIE_CONTINUT);
    if (!brut) return null;
    const c = JSON.parse(brut) as ContinutAcademie;
    return Array.isArray(c?.modules) && c.modules.length > 0 ? c : null;
  } catch {
    return null;
  }
}

export async function aduContinut(): Promise<ContinutAcademie> {
  const c = (await api.academy.content()) as ContinutAcademie;
  // Scrierea nu trebuie să poată strica încărcarea: pe un telefon plin,
  // `setItem` aruncă, iar conținutul din memorie e perfect utilizabil.
  AsyncStorage.setItem(CHEIE_CONTINUT, JSON.stringify(c)).catch(() => {});
  return c;
}

/* ── Progres ──────────────────────────────────────────────────────────────── */

export function imbina(a: Progres, b: Progres): Progres {
  const lectii = [...new Set([...a.lessons, ...b.lessons])].sort();

  const quizuri: Record<string, number> = { ...a.quizzes };
  for (const [k, v] of Object.entries(b.quizzes)) {
    quizuri[k] = Math.max(quizuri[k] ?? 0, v);
  }

  const exercitii: Record<string, DrillStat> = { ...a.drills };
  for (const [k, v] of Object.entries(b.drills)) {
    const x = exercitii[k];
    exercitii[k] = x
      ? {
          // Câștigă înregistrarea care arată mai multă muncă; seria e un
          // record personal, deci se ia cea mai lungă din amândouă.
          attempts: Math.max(x.attempts, v.attempts),
          correct: Math.max(x.correct, v.correct),
          bestStreak: Math.max(x.bestStreak, v.bestStreak),
        }
      : v;
  }

  const gresite: Record<string, number> = { ...a.missed };
  for (const [k, v] of Object.entries(b.missed)) {
    gresite[k] = Math.max(gresite[k] ?? 0, v);
  }

  return { lessons: lectii, quizzes: quizuri, drills: exercitii, missed: gresite };
}

export async function progresLocal(): Promise<Progres> {
  try {
    const brut = await AsyncStorage.getItem(CHEIE_PROGRES);
    if (!brut) return PROGRES_GOL;
    const p = JSON.parse(brut) as Progres;
    return {
      lessons: Array.isArray(p?.lessons) ? p.lessons : [],
      quizzes: p?.quizzes ?? {},
      drills: p?.drills ?? {},
      missed: p?.missed ?? {},
    };
  } catch {
    return PROGRES_GOL;
  }
}

/**
 * Citește progresul de pe server, îl îmbină cu cel local și salvează în ambele
 * locuri. Dacă serverul nu răspunde, rămâne ce e local — un curs nu are de ce
 * să se blocheze fără semnal.
 */
export async function sincronizeaza(local?: Progres): Promise<Progres> {
  const alMeu = local ?? (await progresLocal());
  try {
    const r = (await api.academy.progress()) as { local: boolean; progress: Progres };
    const imbinat = imbina(alMeu, r.progress ?? PROGRES_GOL);
    await salveazaLocal(imbinat);
    if (!r.local) api.academy.saveProgress(imbinat).catch(() => {});
    return imbinat;
  } catch {
    return alMeu;
  }
}

async function salveazaLocal(p: Progres): Promise<void> {
  AsyncStorage.setItem(CHEIE_PROGRES, JSON.stringify(p)).catch(() => {});
}

/** Salvează local imediat și trimite spre server în fundal. */
export async function scrieProgres(p: Progres): Promise<void> {
  await salveazaLocal(p);
  api.academy.saveProgress(p).catch(() => {});
}

/* ── Ajutoare ─────────────────────────────────────────────────────────────── */

export const cheieLectie = (moduleId: string, lessonId: string) => `${moduleId}/${lessonId}`;

export function textul(t: I18nText | undefined, limba: Lang = "ro"): string {
  if (!t) return "";
  return t[limba] || t.ro || t.en || "";
}

export const ETICHETA_NIVEL: Record<AcademyLevel, string> = {
  BEGINNER: "Începător",
  INTERMEDIATE: "Intermediar",
  ADVANCED: "Avansat",
  EXPERT: "Expert",
};
