import type { QuizQuestion } from "./index";

// ── Quiz M3: Candlestick Patterns ────────────────────────────────────────────

export const Q3_QUIZ: QuizQuestion[] = [
  {
    q: {
      ro: "Un doji apare după un trend ascendent lung și susținut. Ce înseamnă?",
      en: "A doji appears after a long, sustained uptrend. What does it mean?",
    },
    options: [
      { ro: "Inversare confirmată — vinzi imediat", en: "A confirmed reversal — sell immediately" },
      { ro: "Nimic — doji-ul e întotdeauna zgomot", en: "Nothing — a doji is always noise" },
      { ro: "Prima fisură în convingerea dominantă: o pauză care cere un nivel relevant și o lumânare de confirmare", en: "The first crack in the dominant conviction: a pause that needs a relevant level and a confirmation candle" },
      { ro: "Semnal de continuare — trendul accelerează", en: "A continuation signal — the trend is accelerating" },
    ],
    correct: 2,
    explain: {
      ro: "Tabăra care controla piața nu a mai reușit să închidă în direcția ei — dar fără nivel și fără confirmare, doji-ul rămâne doar un semn de întrebare, nu un semnal.",
      en: "The side controlling the market failed to close in its direction — but without a level and a confirmation, the doji stays a question mark, not a signal.",
    },
  },
  {
    q: {
      ro: "Care sunt criteriile unui hammer valid?",
      en: "What are the criteria of a valid hammer?",
    },
    options: [
      { ro: "Fitil inferior de cel puțin 2x corpul, corp mic în treimea superioară, apărut după o scădere, ideal la suport", en: "A lower wick at least 2x the body, a small body in the upper third, appearing after a decline, ideally at support" },
      { ro: "Corp mare verde, fără fitile, oriunde pe grafic", en: "A large green body with no wicks, anywhere on the chart" },
      { ro: "Fitil superior lung și corp mic în treimea inferioară, după o creștere", en: "A long upper wick and a small body in the lower third, after a rally" },
      { ro: "Orice lumânare cu fitil în jos, indiferent de trendul dinainte", en: "Any candle with a lower wick, regardless of the preceding trend" },
    ],
    correct: 0,
    explain: {
      ro: "Hammer-ul e o respingere de jos: fitilul lung e urma atacului eșuat al vânzătorilor. Fără scădere înainte și fără un suport sub el, e doar o lumânare cu fitil.",
      en: "The hammer is a rejection from below: the long wick is the trace of the sellers' failed attack. Without a decline before it and support beneath it, it's just a candle with a wick.",
    },
  },
  {
    q: {
      ro: "De ce e shooting star-ul un semnal bearish la rezistență?",
      en: "Why is the shooting star a bearish signal at resistance?",
    },
    options: [
      { ro: "Pentru că orice fitil superior lung înseamnă manipulare", en: "Because any long upper wick means manipulation" },
      { ro: "Pentru că închide întotdeauna pe roșu", en: "Because it always closes red" },
      { ro: "Pentru că apare doar pe timeframe-uri mari", en: "Because it only appears on high timeframes" },
      { ro: "Fitilul lung superior e plin de cumpărători prinși peste close — stopurile lor devin combustibil pentru scădere", en: "The long upper wick is full of buyers trapped above the close — their stops become fuel for the decline" },
    ],
    correct: 3,
    explain: {
      ro: "Cine a cumpărat în fitil e deja pe pierdere după close; execuția clasică e intrarea la spargerea Low-ului lumânării, cu stop deasupra vârfului fitilului.",
      en: "Whoever bought inside the wick is already losing after the close; the classic execution is entering on the break of the candle's Low, with the stop above the wick's tip.",
    },
  },
  {
    q: {
      ro: "Pe H4, la jumătatea intervalului, lumânarea curentă arată ca un hammer perfect la suport. Ce faci?",
      en: "On H4, mid-interval, the current candle looks like a perfect hammer at support. What do you do?",
    },
    options: [
      { ro: "Intri imediat — modelul e evident", en: "Enter immediately — the pattern is obvious" },
      { ro: "Aștepți închiderea lumânării: modelul nu există până la close", en: "Wait for the candle to close: the pattern doesn't exist until the close" },
      { ro: "Cobori pe M5 ca să intri mai devreme cu stop mai mic", en: "Drop to M5 to enter earlier with a smaller stop" },
      { ro: "Pui un sell limit — un hammer neterminat e semnal bearish", en: "Place a sell limit — an unfinished hammer is a bearish signal" },
    ],
    correct: 1,
    explain: {
      ro: "La jumătatea intervalului lumânarea poate arăta perfect și totuși să închidă ca o banală lumânare bearish; decizia se ia doar pe lumânări închise.",
      en: "Mid-interval the candle can look perfect and still close as an ordinary bearish candle; decisions are made only on closed candles.",
    },
  },
  {
    q: {
      ro: "Ce definește un bullish engulfing?",
      en: "What defines a bullish engulfing?",
    },
    options: [
      { ro: "După o scădere, o lumânare verde al cărei corp acoperă complet corpul lumânării roșii precedente", en: "After a decline, a green candle whose body completely covers the previous red candle's body" },
      { ro: "Două lumânări verzi consecutive de aceeași mărime", en: "Two consecutive green candles of equal size" },
      { ro: "O lumânare verde care depășește doar fitilul lumânării precedente", en: "A green candle that only exceeds the previous candle's wick" },
      { ro: "O lumânare verde mică, aflată complet în corpul roșu precedent", en: "A small green candle sitting completely inside the previous red body" },
    ],
    correct: 0,
    explain: {
      ro: "Într-o singură sesiune cumpărătorii anulează tot ce au construit vânzătorii și mai și avansează — o preluare ostilă a controlului. Ultima variantă descrie un harami, nu un engulfing.",
      en: "In a single session buyers erase everything sellers built and advance on top — a hostile takeover of control. The last option describes a harami, not an engulfing.",
    },
  },
  {
    q: {
      ro: "Ce semnalează un harami și ce activează scenariul bullish?",
      en: "What does a harami signal, and what activates the bullish scenario?",
    },
    options: [
      { ro: "Inversare garantată — intri la închiderea lumânării mici", en: "A guaranteed reversal — you enter at the small candle's close" },
      { ro: "Continuare de trend — corpul mic confirmă forța", en: "Trend continuation — the small body confirms strength" },
      { ro: "Pierdere de momentum: aștepți o închidere peste maximul lumânării-mamă înainte să intri", en: "Loss of momentum: you wait for a close above the mother candle's high before entering" },
      { ro: "Un breakout eșuat care cere vânzare imediată", en: "A failed breakout demanding an immediate sell" },
    ],
    correct: 2,
    explain: {
      ro: "Harami e un arc comprimat: volatilitatea s-a contractat brusc după impuls. Nu ghicești direcția — închiderea peste High-ul mamei activează scenariul bullish, sub Low îl reactivează pe cel dominant.",
      en: "The harami is a compressed spring: volatility contracted abruptly after the impulse. You don't guess the direction — a close above the mother's High activates the bullish scenario, below its Low reactivates the dominant one.",
    },
  },
  {
    q: {
      ro: "La un morning star, ce trebuie să facă a treia lumânare pentru a valida modelul?",
      en: "In a morning star, what must the third candle do to validate the pattern?",
    },
    options: [
      { ro: "Să fie un doji perfect", en: "Be a perfect doji" },
      { ro: "Să fie bullish și să închidă peste jumătatea corpului primei lumânări bearish", en: "Be bullish and close above the midpoint of the first bearish candle's body" },
      { ro: "Să atingă maximul primei lumânări", en: "Touch the first candle's high" },
      { ro: "Să lase un gap față de steaua din mijloc — fără gap modelul e invalid", en: "Leave a gap from the middle star — without a gap the pattern is invalid" },
    ],
    correct: 1,
    explain: {
      ro: "Al treilea act arată preluarea controlului de către cumpărători: cu cât recuperează mai mult din prima lumânare, cu atât semnalul e mai puternic. Gap-urile întăresc modelul, dar lipsa lor pe piețele 24/5 nu îl invalidează.",
      en: "The third act shows buyers taking control: the more of the first candle it recovers, the stronger the signal. Gaps strengthen the pattern, but their absence on 24/5 markets doesn't invalidate it.",
    },
  },
  {
    q: {
      ro: "Același hammer, perfect ca formă, apare în trei locuri: la un suport major testat anterior, în mijlocul unui range și în cădere liberă, departe de orice nivel. Care e concluzia corectă?",
      en: "The same textbook-perfect hammer appears in three spots: at a previously tested major support, in the middle of a range, and in free fall far from any level. What's the correct conclusion?",
    },
    options: [
      { ro: "Forma bate locația: toate trei sunt intrări valide", en: "Shape beats location: all three are valid entries" },
      { ro: "Doar hammer-ul din cădere liberă e tranzacționabil — prinde chiar minimul", en: "Only the free-fall hammer is tradeable — it catches the very bottom" },
      { ro: "Niciun hammer nu e tranzacționabil fără un indicator de confirmare", en: "No hammer is tradeable without a confirming indicator" },
      { ro: "Locația bate forma: modelul e declanșatorul, nivelul e motivul — doar cel de la suport merită atenție", en: "Location beats shape: the pattern is the trigger, the level is the reason — only the one at support deserves attention" },
    ],
    correct: 3,
    explain: {
      ro: "Un pattern mediocru la o zonă excelentă bate un pattern perfect în gol; traderii care câștigă așteaptă întâi LOCUL și abia apoi cer pieței un model.",
      en: "A mediocre pattern at an excellent zone beats a perfect pattern in a vacuum; winning traders wait for the PLACE first and only then ask the market for a pattern.",
    },
  },
];
