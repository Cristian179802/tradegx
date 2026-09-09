import type { DiagramDef, I18nText, OHLC } from "./types";

// ── Exercițiile Academiei ────────────────────────────────────────────────────
//
// Un pattern de lumânări învățat din poza din manual se recunoaște în manual.
// Pe grafic, unde vin cu 40 de lumânări în jur, nu se mai recunoaște. De aia
// FIECARE exercițiu de aici are CONTEXT: 5–8 lumânări înainte, care fac
// diferența dintre un ciocan (după o scădere) și o lumânare oarecare cu fitil.
//
// Contextul nu e decor. Un „hammer” în mijlocul unui range lateral nu e semnal
// de nimic, iar exercițiul trebuie să predea exact asta — de aceea printre
// variantele de răspuns există și „niciun semnal: lipsește contextul”.
//
// Datele sunt în spațiul 0..100 al lui <Diagram/>, deci se randează cu același
// motor testat ca diagramele lecțiilor. Fără cod de desen nou.

export interface PatternDrillItem {
  id: string;
  candles: OHLC[];
  /** indexul primei lumânări din pattern — o evidențiem la corectare */
  from: number;
  options: I18nText[];
  correct: number;
  explain: I18nText;
}

/** Câteva lumânări de fundal: o scădere lină, ca pattern-ul să aibă de ce să apară. */
const DOWN: OHLC[] = [
  { o: 78, h: 82, l: 74, c: 75 },
  { o: 75, h: 77, l: 68, c: 69 },
  { o: 69, h: 71, l: 62, c: 63 },
  { o: 63, h: 65, l: 56, c: 57 },
  { o: 57, h: 59, l: 50, c: 51 },
];

const UP: OHLC[] = [
  { o: 22, h: 28, l: 20, c: 27 },
  { o: 27, h: 34, l: 25, c: 33 },
  { o: 33, h: 40, l: 31, c: 39 },
  { o: 39, h: 46, l: 37, c: 45 },
  { o: 45, h: 52, l: 43, c: 51 },
];

const FLAT: OHLC[] = [
  { o: 48, h: 53, l: 44, c: 50 },
  { o: 50, h: 54, l: 45, c: 46 },
  { o: 46, h: 52, l: 43, c: 51 },
  { o: 51, h: 55, l: 46, c: 47 },
  { o: 47, h: 52, l: 44, c: 50 },
];

const OPT = {
  hammer: { ro: "Hammer (ciocan)", en: "Hammer" },
  shooting: { ro: "Shooting star", en: "Shooting star" },
  bullEngulf: { ro: "Bullish engulfing", en: "Bullish engulfing" },
  bearEngulf: { ro: "Bearish engulfing", en: "Bearish engulfing" },
  doji: { ro: "Doji (indecizie)", en: "Doji (indecision)" },
  morning: { ro: "Morning star", en: "Morning star" },
  evening: { ro: "Evening star", en: "Evening star" },
  soldiers: { ro: "Three white soldiers", en: "Three white soldiers" },
  crows: { ro: "Three black crows", en: "Three black crows" },
  noContext: {
    ro: "Formă corectă, dar fără context — nu e semnal",
    en: "Right shape, no context — not a signal",
  },
  nothing: { ro: "Niciun pattern relevant", en: "No relevant pattern" },
};

export const PATTERN_DRILLS: PatternDrillItem[] = [
  {
    id: "hammer",
    candles: [...DOWN, { o: 51, h: 53, l: 36, c: 50 }],
    from: 5,
    options: [OPT.hammer, OPT.shooting, OPT.doji, OPT.bullEngulf],
    correct: 0,
    explain: {
      ro: "Fitil lung JOS, corp mic sus, după o scădere: vânzătorii au împins prețul în jos, dar cumpărătorii l-au adus înapoi. Ciocanul contează pentru că vine la capătul unei mișcări descendente — aceeași lumânare într-un range nu spune nimic.",
      en: "Long LOWER wick, small body on top, after a decline: sellers pushed price down but buyers dragged it back. The hammer matters because it comes at the end of a down-move — the same candle inside a range says nothing.",
    },
  },
  {
    id: "shooting-star",
    candles: [...UP, { o: 51, h: 68, l: 49, c: 52 }],
    from: 5,
    options: [OPT.hammer, OPT.shooting, OPT.soldiers, OPT.doji],
    correct: 1,
    explain: {
      ro: "Fitil lung SUS, corp mic jos, după o creștere: cumpărătorii au împins, dar au fost respinși complet. Oglinda ciocanului, la capătul opus al mișcării.",
      en: "Long UPPER wick, small body at the bottom, after a rally: buyers pushed and were fully rejected. The hammer's mirror image, at the opposite end of the move.",
    },
  },
  {
    id: "bull-engulfing",
    candles: [...DOWN, { o: 51, h: 53, l: 46, c: 47 }, { o: 46, h: 64, l: 45, c: 62 }],
    from: 6,
    options: [OPT.bullEngulf, OPT.bearEngulf, OPT.morning, OPT.hammer],
    correct: 0,
    explain: {
      ro: "A doua lumânare deschide sub închiderea primei și îi înghite complet corpul, în sus. Cumpărătorii n-au preluat controlul treptat — l-au luat într-o singură lumânare.",
      en: "The second candle opens below the first's close and completely engulfs its body, upward. Buyers didn't take control gradually — they took it in a single candle.",
    },
  },
  {
    id: "bear-engulfing",
    candles: [...UP, { o: 51, h: 56, l: 49, c: 55 }, { o: 56, h: 57, l: 40, c: 42 }],
    from: 6,
    options: [OPT.bullEngulf, OPT.bearEngulf, OPT.evening, OPT.shooting],
    correct: 1,
    explain: {
      ro: "A doua lumânare deschide peste închiderea primei și îi înghite corpul, în jos. Vânzătorii au preluat controlul brusc, la capătul unei creșteri.",
      en: "The second candle opens above the first's close and engulfs its body, downward. Sellers seized control abruptly, at the end of a rally.",
    },
  },
  {
    id: "morning-star",
    candles: [
      ...DOWN,
      { o: 51, h: 52, l: 40, c: 41 },
      { o: 39, h: 42, l: 36, c: 40 },
      { o: 42, h: 58, l: 41, c: 56 },
    ],
    from: 5,
    options: [OPT.morning, OPT.evening, OPT.soldiers, OPT.doji],
    correct: 0,
    explain: {
      ro: "Trei lumânări: una roșie puternică, una mică (indecizie — vânzătorii au obosit), apoi una verde puternică. Predarea controlului, în trei pași. Cea din mijloc e mesajul: presiunea de vânzare s-a epuizat.",
      en: "Three candles: a strong red one, a small one (indecision — sellers ran out of steam), then a strong green one. A handover of control, in three steps. The middle candle is the message: selling pressure exhausted.",
    },
  },
  {
    id: "evening-star",
    candles: [
      ...UP,
      { o: 51, h: 62, l: 50, c: 61 },
      { o: 63, h: 66, l: 61, c: 62 },
      { o: 61, h: 62, l: 45, c: 46 },
    ],
    from: 5,
    options: [OPT.morning, OPT.evening, OPT.crows, OPT.shooting],
    correct: 1,
    explain: {
      ro: "Oglinda morning star-ului, la vârf: verde puternic, indecizie, roșu puternic. Cumpărătorii au rămas fără combustibil, iar a treia lumânare o confirmă.",
      en: "The morning star's mirror, at a top: strong green, indecision, strong red. Buyers ran out of fuel, and the third candle confirms it.",
    },
  },
  {
    id: "hammer-no-context",
    candles: [...FLAT, { o: 50, h: 52, l: 36, c: 49 }],
    from: 5,
    options: [OPT.hammer, OPT.noContext, OPT.bullEngulf, OPT.doji],
    correct: 1,
    explain: {
      ro: "Forma E de ciocan — dar uită-te ÎNAINTE: piața e laterală, nu vine din nicio scădere. Un ciocan spune „scăderea a fost respinsă”; fără scădere, n-are ce respinge. Asta e capcana care costă cel mai des: pattern-ul recunoscut corect, contextul ignorat.",
      en: "The shape IS a hammer — but look BEFORE it: the market is sideways, it isn't coming out of any decline. A hammer says 'the drop was rejected'; with no drop, there's nothing to reject. This is the costliest trap: pattern read right, context ignored.",
    },
  },
  {
    id: "three-soldiers",
    candles: [
      ...FLAT,
      { o: 50, h: 58, l: 49, c: 57 },
      { o: 57, h: 65, l: 56, c: 64 },
      { o: 64, h: 72, l: 63, c: 71 },
    ],
    from: 5,
    options: [OPT.soldiers, OPT.crows, OPT.morning, OPT.nothing],
    correct: 0,
    explain: {
      ro: "Trei lumânări verzi consecutive, fiecare închizând peste maximul precedent, cu fitile mici: cumpărare susținută, nu un salt. Ieșirea dintr-o consolidare cu trei astfel de lumânări e una dintre cele mai clare confirmări de breakout.",
      en: "Three consecutive green candles, each closing above the previous high, with small wicks: sustained buying, not a spike. Leaving a consolidation with three such candles is one of the clearest breakout confirmations.",
    },
  },
  {
    id: "doji-top",
    candles: [...UP, { o: 52, h: 60, l: 44, c: 52 }],
    from: 5,
    options: [OPT.doji, OPT.hammer, OPT.shooting, OPT.bearEngulf],
    correct: 0,
    explain: {
      ro: "Închiderea cade exact pe deschidere, cu fitile în ambele direcții: echilibru perfect între cumpărători și vânzători. După o creștere, e un semn de oboseală — dar NU un semnal de vânzare singur. Aștepți lumânarea care rupe echilibrul.",
      en: "The close lands exactly on the open, with wicks both ways: perfect balance between buyers and sellers. After a rally it's a sign of fatigue — but NOT a sell signal on its own. You wait for the candle that breaks the balance.",
    },
  },
];

// ── Exercițiul de stop loss ──────────────────────────────────────────────────
//
// Cea mai frecventă greșeală la SL nu e că lipsește, ci că e pus la o distanță
// ALEASĂ (10 pips, „cât suport”) în loc de un loc TEHNIC. Aici elevul vede
// setup-ul și alege dintre patru plasări: una tehnică și trei tentante.

export interface SlDrillItem {
  id: string;
  diagram: DiagramDef;
  question: I18nText;
  /** nivelurile candidate, în ordinea A-B-C-D; `y` în spațiul 0..100 */
  options: { y: number; label: I18nText }[];
  correct: number;
  explain: I18nText;
}

export const SL_DRILLS: SlDrillItem[] = [
  {
    id: "long-la-suport",
    diagram: {
      candles: [
        { o: 70, h: 73, l: 66, c: 67 },
        { o: 67, h: 69, l: 58, c: 59 },
        { o: 59, h: 61, l: 48, c: 49 },
        { o: 49, h: 51, l: 38, c: 40 },
        { o: 40, h: 42, l: 30, c: 41 },
        { o: 41, h: 47, l: 39, c: 46 },
      ],
      zones: [{ y1: 30, y2: 42, color: "#34d399", label: "suport" }],
      levels: [{ y: 46, label: "intrare", color: "#6d75f6", dashed: false }],
      caption: {
        ro: "Long la retestul suportului. Ultima lumânare a respins minimul de 30 și a închis în sus.",
        en: "Long on the support retest. The last candle rejected the 30 low and closed higher.",
      },
    },
    question: {
      ro: "Ai intrat long la retestul suportului. Unde pui stop loss-ul?",
      en: "You entered long on the support retest. Where do you put the stop loss?",
    },
    options: [
      { y: 43, label: { ro: "Chiar sub intrare", en: "Just below entry" } },
      { y: 39, label: { ro: "La mijlocul zonei de suport", en: "Mid support zone" } },
      { y: 27, label: { ro: "Sub minimul zonei", en: "Below the zone's low" } },
      { y: 10, label: { ro: "Foarte jos, ca să nu fie atins", en: "Very far, so it can't be hit" } },
    ],
    correct: 2,
    explain: {
      ro: "Sub minimul zonei. Ideea ta e „suportul ăsta ține” — deci ea se invalidează exact când prețul închide sub el, nu mai devreme. Variantele A și B te scot din piață în timp ce ideea e încă VALIDĂ: zona de suport e o zonă, prețul are voie să respire în ea. Varianta D nu e prudență, e absența unui plan: un SL prea larg fie te obligă la un lot ridicol de mic, fie transformă o pierdere planificată într-una care contează.",
      en: "Below the zone's low. Your idea is 'this support holds' — so it's invalidated exactly when price closes below it, not sooner. Options A and B take you out while the idea is still VALID: a support zone is a zone, price is allowed to breathe inside it. Option D isn't caution, it's the absence of a plan: too wide a stop either forces a ridiculously small lot or turns a planned loss into one that matters.",
    },
  },
  {
    id: "short-la-rezistenta",
    diagram: {
      candles: [
        { o: 30, h: 36, l: 28, c: 35 },
        { o: 35, h: 44, l: 33, c: 43 },
        { o: 43, h: 54, l: 42, c: 53 },
        { o: 53, h: 68, l: 52, c: 60 },
        { o: 60, h: 70, l: 58, c: 59 },
        { o: 59, h: 61, l: 52, c: 54 },
      ],
      zones: [{ y1: 58, y2: 70, color: "#fb5c72", label: "rezistență" }],
      levels: [{ y: 54, label: "intrare", color: "#6d75f6", dashed: false }],
      caption: {
        ro: "Short după respingerea rezistenței. Două fitile lungi la 68–70, apoi o lumânare roșie.",
        en: "Short after the resistance rejection. Two long wicks at 68–70, then a red candle.",
      },
    },
    question: {
      ro: "Short după respingerea rezistenței. Unde pui stop loss-ul?",
      en: "Short after the resistance rejection. Where do you put the stop loss?",
    },
    options: [
      { y: 62, label: { ro: "În mijlocul zonei", en: "Mid zone" } },
      { y: 72, label: { ro: "Peste maximul fitilelor", en: "Above the wicks' high" } },
      { y: 56, label: { ro: "Chiar peste intrare", en: "Just above entry" } },
      { y: 90, label: { ro: "Mult deasupra, la un nivel rotund", en: "Far above, at a round number" } },
    ],
    correct: 1,
    explain: {
      ro: "Peste maximul fitilelor (70). Fitilele SUNT informația: acolo a fost împins prețul și respins. Atâta timp cât nu se închide deasupra lor, respingerea rămâne validă. A și C sunt înăuntrul zonei în care prețul se mișcă normal — te vor scoate pe zgomot. D pare sigură, dar te costă: la o distanță de 36 de puncte în loc de 16, la același risc în bani lotul tău se înjumătățește, deci și profitul.",
      en: "Above the wicks' high (70). The wicks ARE the information: that's where price was pushed and rejected. As long as it doesn't close above them, the rejection stands. A and C sit inside the range where price normally moves — they'll stop you out on noise. D looks safe but costs you: at 36 points of distance instead of 16, the same money risk halves your lot, and your profit with it.",
    },
  },
  {
    id: "breakout-retest",
    diagram: {
      candles: [
        { o: 40, h: 46, l: 38, c: 44 },
        { o: 44, h: 48, l: 41, c: 45 },
        { o: 45, h: 49, l: 42, c: 47 },
        { o: 47, h: 64, l: 46, c: 62 },
        { o: 62, h: 66, l: 55, c: 57 },
        { o: 57, h: 60, l: 54, c: 59 },
      ],
      levels: [
        { y: 49, label: "rezistență spartă", color: "#8b93a5" },
        { y: 59, label: "intrare", color: "#6d75f6", dashed: false },
      ],
      caption: {
        ro: "Breakout peste 49, apoi retest care ține la 54–55. Intrare pe reluare.",
        en: "Breakout above 49, then a retest holding at 54–55. Entry on the resumption.",
      },
    },
    question: {
      ro: "Long pe retestul unui breakout. Unde pui stop loss-ul?",
      en: "Long on a breakout retest. Where do you put the stop loss?",
    },
    options: [
      { y: 56, label: { ro: "Sub minimul retestului", en: "Below the retest low" } },
      { y: 47, label: { ro: "Sub nivelul spart", en: "Below the broken level" } },
      { y: 58, label: { ro: "Foarte aproape, la −1 punct", en: "Very tight, −1 point" } },
      { y: 36, label: { ro: "Sub tot consolidarea de la început", en: "Below the whole early range" } },
    ],
    correct: 1,
    explain: {
      ro: "Sub nivelul spart (49). Asta e ideea unui retest: nivelul rupt a devenit suport. Dacă prețul închide iar sub el, spargerea a fost falsă și nu mai ai de ce să fii în piață — abia ATUNCI ai greșit. A (56) e tentantă pentru un R:R frumos, dar stă în interiorul zgomotului retestului. C e o pierdere garantată pe prima oscilație. D e corectă tehnic, dar plătești de trei ori mai mult pentru aceeași informație.",
      en: "Below the broken level (49). That's the whole idea of a retest: the broken level became support. If price closes back under it, the breakout was false and you have no reason to be in — only THEN were you wrong. A (56) is tempting for a pretty R:R, but it sits inside the retest's noise. C is a guaranteed loss on the first wiggle. D is technically right, but you pay three times as much for the same information.",
    },
  },
];
