import { rateLimit } from "@/lib/rate-limit";

// ── Cât AI intră într-un abonament ───────────────────────────────────────────
//
// DE CE EXISTĂ. Funcțiile AI aveau limite pe ORĂ, dar niciuna pe lună. 30 de
// mesaje pe oră înmulțit cu 720 de ore înseamnă 21.600 de mesaje permise de cod
// într-o singură lună — peste 450 $ în credit Anthropic, pentru un abonament de
// 19 $. Limita pe oră oprește un scenariu de abuz; nu oprește deloc costul.
//
// Iar problema nu e abuzatorul. Un client entuziasmat care pune 33 de întrebări
// pe zi costă ~37 $ pe lună: unul singur mănâncă profitul de la alți patru.
//
// PLAFOANELE de mai jos acoperă în jur de zece interacțiuni pe zi — mai mult
// decât folosește un trader real — și duc expunerea maximă la ~12 $ pe abonat,
// deci chiar și cel mai intens client rămâne pe profit la 19 $.
//
// Fereastra e ROTITOARE, de treizeci de zile de la prima folosire, nu calendar-
// istică. Așa nu apare valul de la întâi ale lunii, când toată lumea își
// primește cota în aceeași zi.

export const BUGET_LUNAR = {
  chat: 300,
  chartAnalyze: 60,
  tradeAnalyze: 100,
} as const;

export type FunctieAI = keyof typeof BUGET_LUNAR;

const O_LUNA_SEC = 30 * 24 * 3600;

/**
 * Consumă o unitate din bugetul lunar al utilizatorului pentru o funcție AI.
 *
 * Se apelează DUPĂ limita pe oră, intenționat: aceea e o barieră de rafală, iar
 * cine e oprit de ea n-are de ce să piardă din cota lunii.
 */
export async function consumaBugetLunar(functie: FunctieAI, userId: string) {
  const rl = await rateLimit(`ai-month:${functie}:${userId}`, {
    limit: BUGET_LUNAR[functie],
    windowSecs: O_LUNA_SEC,
  });
  return { ok: rl.success, ramase: rl.remaining, seReinnoieste: rl.resetAt };
}
