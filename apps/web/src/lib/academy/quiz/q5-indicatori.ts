import type { QuizQuestion } from "./index";

// ── Quiz M5: Indicatori Tehnici ──────────────────────────────────────────────

export const Q5_QUIZ: QuizQuestion[] = [
  {
    q: {
      ro: "RSI stă de o săptămână peste 70 într-un uptrend puternic. Ce înseamnă?",
      en: "RSI has been sitting above 70 for a week in a strong uptrend. What does it mean?",
    },
    options: [
      { ro: "Piața e overbought — vinzi acum", en: "The market is overbought — you sell now" },
      { ro: "Indicatorul e defect — RSI nu poate sta atât peste 70", en: "The indicator is broken — RSI can't stay above 70 that long" },
      { ro: "Urmează obligatoriu o corecție de proporții", en: "A major correction must necessarily follow" },
      { ro: "Forță: cumpărătorii domină agresiv — în trend, extremele RSI nu sunt semnale de inversare", en: "Strength: buyers are dominating aggressively — in a trend, RSI extremes are not reversal signals" },
    ],
    correct: 3,
    explain: {
      ro: "În trendurile puternice RSI poate rămâne overbought zile sau săptămâni întregi în timp ce prețul urcă; extremele lui înseamnă acolo forță — un motiv să cauți long-uri pe pullback, nu short-uri.",
      en: "In strong trends RSI can stay overbought for days or weeks while price keeps climbing; there, its extremes mean strength — a reason to look for longs on pullbacks, not shorts.",
    },
  },
  {
    q: {
      ro: "Ce este o divergență bearish pe RSI?",
      en: "What is a bearish RSI divergence?",
    },
    options: [
      { ro: "RSI scade sub 30 în timp ce prețul urcă", en: "RSI dropping below 30 while price rises" },
      { ro: "Prețul face un Higher High, dar RSI face un vârf mai jos — un avertisment de momentum, nu un ordin de intrare", en: "Price prints a Higher High but RSI prints a lower peak — a momentum warning, not an entry order" },
      { ro: "RSI și prețul urcă împreună spre maxime noi", en: "RSI and price rising together toward new highs" },
      { ro: "RSI taie linia de 50 în jos", en: "RSI crossing below the 50 line" },
    ],
    correct: 1,
    explain: {
      ro: "Noul maxim de preț s-a construit cu mai puțin momentum — motorul tușește. Dar divergențele pot fi călcate în picioare mult timp: aștepți întotdeauna confirmarea structurii.",
      en: "The new price high was built with less momentum — the engine is sputtering. But divergences can get steamrolled for a long time: always wait for structural confirmation.",
    },
  },
  {
    q: {
      ro: "Linia MACD e peste zero și în creștere. Ce îți spune asta?",
      en: "The MACD line is above zero and rising. What does that tell you?",
    },
    options: [
      { ro: "EMA 12 e peste EMA 26, iar trendul ascendent accelerează — bias bullish", en: "The 12 EMA is above the 26 EMA and the uptrend is accelerating — bullish bias" },
      { ro: "Piața e overbought și urmează scăderea", en: "The market is overbought and a decline follows" },
      { ro: "E un semnal de vânzare — MACD peste zero înseamnă epuizare", en: "It's a sell signal — MACD above zero means exhaustion" },
      { ro: "Nimic — MACD se citește doar prin crossurile cu linia de semnal", en: "Nothing — MACD is only read through its crosses with the signal line" },
    ],
    correct: 0,
    explain: {
      ro: "Linia MACD e diferența EMA(12) − EMA(26): peste zero, media rapidă e deasupra celei lente (bias bullish), iar creșterea liniei arată momentum în accelerare.",
      en: "The MACD line is the EMA(12) − EMA(26) difference: above zero, the fast average sits above the slow one (bullish bias), and the line rising shows accelerating momentum.",
    },
  },
  {
    q: {
      ro: "După un breakout, prețul se lipește de banda Bollinger superioară și merge pe ea lumânare după lumânare. Ce faci?",
      en: "After a breakout, price glues itself to the upper Bollinger band and walks it candle after candle. What do you do?",
    },
    options: [
      { ro: "Vinzi la fiecare atingere a benzii — prețul e statistic prea sus", en: "Sell every band touch — price is statistically too high" },
      { ro: "Aștepți întoarcerea la banda inferioară pentru o cumpărare", en: "Wait for a return to the lower band to buy" },
      { ro: "Nu faci fade: walking the bands e dovadă de forță în trend — atingerea benzii nu mai e semnal de vânzare", en: "You don't fade it: walking the bands is proof of trend strength — the band touch is no longer a sell signal" },
      { ro: "Închizi graficul — benzile Bollinger nu funcționează după breakout", en: "Close the chart — Bollinger Bands don't work after a breakout" },
    ],
    correct: 2,
    explain: {
      ro: "Citirea benzilor depinde de regim: mean reversion funcționează în range, dar în trend prețul călărește banda exterioară, iar fade-ul unui walk donează bani trendului.",
      en: "Reading the bands depends on regime: mean reversion works in ranges, but in a trend price rides the outer band, and fading a walk is donating money to the trend.",
    },
  },
  {
    q: {
      ro: "Care e folosirea onestă a Stochastic-ului?",
      en: "What is the honest use of the Stochastic?",
    },
    options: [
      { ro: "Vinzi mecanic la 80 și cumperi la 20, în orice piață", en: "Mechanically sell at 80 and buy at 20, in any market" },
      { ro: "Unealtă de timing în direcția trendului: în uptrend aștepți pullback-ul și intri când %K taie %D în sus, ieșind din oversold", en: "A timing tool in the trend's direction: in an uptrend you wait for the pullback and enter when %K crosses %D upward, exiting oversold" },
      { ro: "Predicție: valorile extreme anunță exact vârfurile și minimele", en: "Prediction: extreme values pinpoint the exact tops and bottoms" },
      { ro: "Filtru de volum — Stochastic măsoară participarea din piață", en: "A volume filter — the Stochastic measures market participation" },
    ],
    correct: 1,
    explain: {
      ro: "Stochastic-ul nu prezice nimic — arată doar unde a închis prețul în range-ul recent; folosit ca timing în direcția unui trend confirmat, sincronizează intrarea cu finalul corecției.",
      en: "The Stochastic predicts nothing — it only shows where price closed within the recent range; used for timing in a confirmed trend's direction, it synchronizes the entry with the end of the correction.",
    },
  },
  {
    q: {
      ro: "EURUSD pe H1 are ATR(14) = 20 pips. Care e distanța minimă recomandată pentru stop loss?",
      en: "EURUSD on H1 has ATR(14) = 20 pips. What is the minimum recommended stop-loss distance?",
    },
    options: [
      { ro: "10 pips — jumătate din ATR e suficient", en: "10 pips — half the ATR is enough" },
      { ro: "20 pips — exact 1×ATR", en: "20 pips — exactly 1×ATR" },
      { ro: "30 pips — minimum 1.5×ATR, ca stopul să stea în afara zgomotului normal", en: "30 pips — at least 1.5×ATR, so the stop sits outside the normal noise" },
      { ro: "100 pips — 5×ATR, pentru siguranță maximă", en: "100 pips — 5×ATR, for maximum safety" },
    ],
    correct: 2,
    explain: {
      ro: "1.5 × 20 = 30 pips. Un stop mai strâns decât 1×ATR e statistic condamnat: o singură lumânare obișnuită îl poate atinge fără ca ideea ta să fie greșită.",
      en: "1.5 × 20 = 30 pips. A stop tighter than 1×ATR is statistically doomed: a single ordinary candle can hit it without your idea being wrong.",
    },
  },
  {
    q: {
      ro: "Ce este golden zone la Fibonacci retracement?",
      en: "What is the golden zone in Fibonacci retracement?",
    },
    options: [
      { ro: "Zona 50–61.8% — adâncimea clasică a corecțiilor sănătoase, unde traderii de trend caută intrări", en: "The 50–61.8% zone — the classic depth of healthy corrections, where trend traders hunt entries" },
      { ro: "Zona 0–23.6% — retragerile cele mai profitabile", en: "The 0–23.6% zone — the most profitable retracements" },
      { ro: "Nivelul de 100% — punctul din care pornește orice mișcare", en: "The 100% level — the point every move starts from" },
      { ro: "Zona de peste 78.6% — cu cât corecția e mai adâncă, cu atât continuarea e mai probabilă", en: "The zone beyond 78.6% — the deeper the correction, the more likely the continuation" },
    ],
    correct: 0,
    explain: {
      ro: "Corecțiile sănătoase tind să se oprească între o treime și două treimi din impuls; dincolo de 78.6%, ideea de continuare slăbește serios. Fibonacci e o hartă de zone, nu un semnal — cere confluență cu structura.",
      en: "Healthy corrections tend to stop between one-third and two-thirds of the impulse; beyond 78.6%, the continuation idea weakens seriously. Fibonacci is a map of zones, not a signal — it needs confluence with structure.",
    },
  },
  {
    q: {
      ro: "RSI, MACD și Stochastic confirmă toate trei același semnal long. Câte confirmări independente ai de fapt?",
      en: "RSI, MACD and Stochastic all confirm the same long signal. How many independent confirmations do you actually have?",
    },
    options: [
      { ro: "Trei — fiecare indicator aduce informație nouă", en: "Three — each indicator brings new information" },
      { ro: "Două — RSI și Stochastic se suprapun, dar MACD e independent", en: "Two — RSI and Stochastic overlap, but MACD is independent" },
      { ro: "Depinde de timeframe — pe H4 sunt independente", en: "It depends on the timeframe — on H4 they're independent" },
      { ro: "Practic una: toți trei derivă din același preț și măsoară momentum-ul — aceeași informație afișată de trei ori", en: "Practically one: all three derive from the same price and measure momentum — the same information displayed three times" },
    ],
    correct: 3,
    explain: {
      ro: "Asta e capcana indicator soup: mai mulți indicatori corelați nu adaugă informație, doar zgomot cu aer de știință. Alege uneltele după rol — un filtru de direcție, o unealtă de timing și o măsură de risc (ATR).",
      en: "That's the indicator-soup trap: multiple correlated indicators add no information, only noise dressed up as science. Pick tools by role — one direction filter, one timing tool and one risk measure (ATR).",
    },
  },
];
