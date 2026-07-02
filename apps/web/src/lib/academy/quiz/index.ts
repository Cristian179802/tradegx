import type { I18nText } from "../types";
import { Q1_QUIZ } from "./q1-bazele";
import { Q2_QUIZ } from "./q2-structura";
import { Q3_QUIZ } from "./q3-candlestick";
import { Q4_QUIZ } from "./q4-chart-patterns";
import { Q5_QUIZ } from "./q5-indicatori";
import { Q6_QUIZ } from "./q6-smc";
import { Q7_QUIZ } from "./q7-risk";
import { Q8_QUIZ } from "./q8-psihologie";
import { Q9_QUIZ } from "./q9-sisteme";

// ── Quiz-urile Academiei ────────────────────────────────────────────────────
// Câte o bancă de întrebări per modul. Prag de promovare: 80%.

export interface QuizQuestion {
  q: I18nText;
  /** exact 4 variante */
  options: I18nText[];
  /** indexul variantei corecte (0-3) */
  correct: number;
  /** explicația răspunsului corect — afișată după alegere */
  explain: I18nText;
}

export const PASS_THRESHOLD = 80; // %

export const QUIZZES: Record<string, QuizQuestion[]> = {
  "bazele-tradingului": Q1_QUIZ,
  "structura-pietei": Q2_QUIZ,
  "candlestick-patterns": Q3_QUIZ,
  "chart-patterns": Q4_QUIZ,
  "indicatori": Q5_QUIZ,
  "smart-money-concepts": Q6_QUIZ,
  "risk-management": Q7_QUIZ,
  "psihologia-tradingului": Q8_QUIZ,
  "sisteme-de-trading": Q9_QUIZ,
};
