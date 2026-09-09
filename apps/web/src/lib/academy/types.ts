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

// ── Laboratoare interactive ─────────────────────────────────────────────────
// O lecție nu se mai termină la „ai citit”. Un laborator e o componentă în
// care elevul FACE ceva: trage de riscul per tranzacție și vede ruina, vede
// RSI-ul calculat pe aurul de azi, marchează el zona de lichiditate.
//
// Sunt DATE, nu componente: conținutul rămâne serializabil (JSON), deci poate
// pleca spre aplicația mobilă exact ca restul lecției. Pagina mapează `kind`
// la componenta potrivită.

export type LabRef =
  /** Calculator de poziție + Monte Carlo pe risc de ruină. */
  | { kind: "risk-lab"; preset?: { balance?: number; riskPct?: number; winRate?: number; rr?: number } }
  /** Matematica drawdown-ului: cât ai de recuperat după o pierdere. */
  | { kind: "drawdown-lab" }
  /** Expectanță: win rate × R:R, cu simulare de curbă de capital. */
  | { kind: "expectancy-lab"; preset?: { winRate?: number; rr?: number } }
  /**
   * Grafic REAL (date de piață recente) cu straturi calculate live:
   * indicatori din biblioteca aplicației, sau detecția SMC.
   */
  | {
      kind: "chart-lab";
      symbol: string;
      /** interval TradingView: "60" = H1, "240" = H4, "D" = zilnic */
      tf: "15" | "60" | "240" | "D";
      overlays: ("ema20" | "ema50" | "ema200" | "sma200" | "bb" | "rsi" | "macd" | "atr" | "smc" | "volume")[];
      /** ce să caute elevul pe grafic — apare deasupra graficului */
      focus?: I18nText;
    }
  /** Recunoașterea pattern-urilor de lumânări: „ce vezi aici?” */
  | { kind: "pattern-drill"; patterns: string[] }
  /** „Unde pui stop loss-ul?” pe un setup generat. */
  | { kind: "sl-drill" };

export interface LessonSection {
  heading?: I18nText;
  /**
   * Text simplu cu mini-markdown:
   *  - paragrafe separate prin linie goală (\n\n)
   *  - **bold**, `cod`
   *  - linii care încep cu "- " devin bullet list; "1. " devin listă numerotată
   *  - [[termen]] sau [[termen|text afișat]] → termen din glosar, cu tooltip
   */
  body: I18nText;
  diagram?: string; // cheie în registrul de diagrame
  tip?: I18nText; // callout verde (sfat practic)
  warning?: I18nText; // callout roșu (capcană frecventă)

  /** Exemplu concret, cu cifre — blocul „Exemplu real”. */
  example?: I18nText;
  /** Ideile de reținut, la finalul secțiunii. 2–4 rânduri scurte. */
  takeaways?: I18nText[];
  /** Tabel simplu: capete + rânduri. Bun pentru comparații (SMA vs EMA). */
  table?: { head: I18nText[]; rows: I18nText[][] };
  /** Formulă afișată monospațiat, cu legendă opțională. */
  formula?: { expr: string; legend?: I18nText };
  /** Laborator interactiv. */
  lab?: LabRef;
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
