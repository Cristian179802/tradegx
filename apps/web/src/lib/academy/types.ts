// ── Tipuri pentru Academia TradeGx ─────────────────────────────────────────
// Conținutul lecțiilor este bilingv (RO + EN). Diagramele sunt DATE pure
// (OHLC normalizat 0..100) randate de <Diagram/> — nu SVG scris manual.

export type Lang = "ro" | "en";

export interface I18nText {
  ro: string;
  en: string;
}

export type AcademyLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

// ── Diagrame data-driven ────────────────────────────────────────────────────
// Spațiul vertical este 0..100 (0 = jos, 100 = sus). X-ul liniilor/etichetelor
// este exprimat în UNITĂȚI DE INDEX DE LUMÂNARE (0 = prima lumânare).

export interface OHLC {
  o: number;
  h: number;
  l: number;
  c: number;
  /** true = lumânarea NU se desenează (folosită doar ca spațiere pe axa X) */
  hidden?: boolean;
}

export interface DiagramLevel {
  y: number;
  label?: string;
  color?: string; // hex; implicit zinc
  dashed?: boolean;
}

export interface DiagramZone {
  y1: number;
  y2: number;
  x1?: number; // index lumânare (implicit: toată lățimea)
  x2?: number;
  color?: string; // hex cu alpha aplicat automat
  label?: string;
}

export interface DiagramTrendline {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  dashed?: boolean;
}

export interface DiagramArrow {
  x: number; // index lumânare
  y: number;
  dir: "up" | "down";
  color?: string;
  label?: string;
}

export interface DiagramLabel {
  x: number;
  y: number;
  text: string;
  color?: string;
}

export interface DiagramDef {
  candles: OHLC[];
  line?: (number | null)[]; // overlay tip MA — null = fără punct
  levels?: DiagramLevel[];
  zones?: DiagramZone[];
  trend?: DiagramTrendline[];
  arrows?: DiagramArrow[];
  labels?: DiagramLabel[];
  caption?: I18nText;
}

// ── Structura cursului ──────────────────────────────────────────────────────

export interface LessonSection {
  heading?: I18nText;
  /**
   * Text simplu cu mini-markdown:
   *  - paragrafe separate prin linie goală (\n\n)
   *  - **bold**
   *  - linii care încep cu "- " devin bullet list
   */
  body: I18nText;
  diagram?: string; // cheie în registrul de diagrame
  tip?: I18nText; // callout verde (sfat practic)
  warning?: I18nText; // callout roșu (capcană frecventă)
}

export interface Lesson {
  id: string;
  title: I18nText;
  minutes: number; // durată estimată de citire
  sections: LessonSection[];
}

export interface AcademyModule {
  id: string;
  level: AcademyLevel;
  /** nume de icon lucide suportat de pagina de index (ex: "candlestick") */
  icon: string;
  title: I18nText;
  description: I18nText;
  lessons: Lesson[];
}

export interface ModuleBundle {
  module: AcademyModule;
  diagrams: Record<string, DiagramDef>;
}
