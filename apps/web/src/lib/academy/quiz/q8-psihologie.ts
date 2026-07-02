import type { QuizQuestion } from "./index";

// ── Quiz M8: Psihologia Tradingului ──────────────────────────────────────────

export const Q8_QUIZ: QuizQuestion[] = [
  {
    q: {
      ro: "Care e mecanismul revenge trading-ului?",
      en: "What is the mechanism of revenge trading?",
    },
    options: [
      { ro: "O pierdere normală e trăită ca o nedreptate → nevoia de a recupera ACUM → intrări fără setup, cu lot mărit → pierderi tot mai mari", en: "A normal loss is experienced as an injustice → the urge to make it back NOW → entries without a setup, with a bigger lot → ever larger losses" },
      { ro: "Prea multă analiză duce la paralizie decizională", en: "Too much analysis leads to decision paralysis" },
      { ro: "Frica te scoate prea devreme din pozițiile câștigătoare", en: "Fear takes you out of winning positions too early" },
      { ro: "Un sistem cu expectancy negativ pierde bani lent", en: "A negative-expectancy system loses money slowly" },
    ],
    correct: 0,
    explain: {
      ro: "Spirala pornește de la o tranzacție perfect normală: nu pierderea e problema, ci reacția la ea — piața devine adversar personal, iar criteriile dispar complet.",
      en: "The spiral starts from a perfectly normal trade: the loss isn't the problem, the reaction to it is — the market becomes a personal opponent and the criteria vanish completely.",
    },
  },
  {
    q: {
      ro: "Ce spune protocolul STOP?",
      en: "What does the STOP protocol say?",
    },
    options: [
      { ro: "Te oprești după prima pierdere din zi", en: "You stop after the first loss of the day" },
      { ro: "Te oprești doar când atingi limita zilnică de drawdown", en: "You only stop when you hit the daily drawdown limit" },
      { ro: "După 2 pierderi consecutive în aceeași zi: închizi platforma, minimum 30 de minute pauză, notezi în jurnal și revii doar cu un plan scris", en: "After 2 consecutive losses in the same day: close the platform, take at least a 30-minute break, write in the journal and only return with a written plan" },
      { ro: "Dublezi lotul controlat, o singură dată, ca să recuperezi rapid", en: "You double the lot once, in a controlled way, to recover quickly" },
    ],
    correct: 2,
    explain: {
      ro: "A treia tranzacție de după două pierderi e statistic cel mai des cea impulsivă — spiralele se blochează la intrare, nu la mijloc. Două pierderi consecutive sunt normale; reacția la ele decide totul.",
      en: "The third trade after two losses is statistically most often the impulsive one — spirals are blocked at the entrance, not in the middle. Two consecutive losses are normal; the reaction to them decides everything.",
    },
  },
  {
    q: {
      ro: "Care e antidotul principal al overtrading-ului?",
      en: "What is the main antidote to overtrading?",
    },
    options: [
      { ro: "Mai multe monitoare, ca să urmărești mai multe piețe", en: "More monitors, so you can watch more markets" },
      { ro: "Coborârea pe timeframe-uri mai mici, pentru mai multe oportunități", en: "Dropping to lower timeframes, for more opportunities" },
      { ro: "Un indicator suplimentar de confirmare", en: "One more confirmation indicator" },
      { ro: "O fereastră fixă de tranzacționare: după ore întregi de ecran, orice mișcare începe să semene cu un setup", en: "A fixed trading window: after hours of screen time, every move starts to look like a setup" },
    ],
    correct: 3,
    explain: {
      ro: "Piața e deschisă aproape non-stop, dar tu nu trebuie să fii: tranzacționezi doar în fereastra în care strategia ta performează, iar în rest analizezi, testezi și jurnalizezi.",
      en: "The market is open almost non-stop, but you don't have to be: you trade only in the window where your strategy performs, and otherwise you analyze, test and journal.",
    },
  },
  {
    q: {
      ro: "Ce efect are loss aversion (Kahneman și Tversky) asupra traderului?",
      en: "What effect does loss aversion (Kahneman and Tversky) have on a trader?",
    },
    options: [
      { ro: "Îl face imun la pierderi după suficientă experiență", en: "It makes them immune to losses after enough experience" },
      { ro: "Pierderea doare aproximativ dublu față de plăcerea unui câștig egal → închizi câștigurile la +0.5R și ții pierderile până la −2R", en: "A loss hurts roughly twice as much as an equal gain pleases → you close winners at +0.5R and hold losers to −2R" },
      { ro: "Crește win rate-ul prin prudență suplimentară", en: "It raises the win rate through extra caution" },
      { ro: "Se manifestă doar la conturile mari", en: "It only shows up on large accounts" },
    ],
    correct: 1,
    explain: {
      ro: "Rezultatul e câștiguri mici și pierderi mari — expectancy negativ garantat. Biasul e hardware: nu îl dezinstalezi, îl blochezi cu reguli externe (sizing fix, SL nemutabil, jurnal).",
      en: "The result is small wins and big losses — guaranteed negative expectancy. The bias is hardware: you can't uninstall it, you block it with external rules (fixed sizing, an immovable SL, a journal).",
    },
  },
  {
    q: {
      ro: "O lumânare uriașă tocmai a explodat în sus fără tine, iar pe rețele toți par să câștige. Ce faci?",
      en: "A huge candle just exploded upward without you, and on social media everyone seems to be winning. What do you do?",
    },
    options: [
      { ro: "Intri imediat cu lot redus — măcar prinzi o parte din mișcare", en: "Enter immediately with a reduced lot — at least you catch part of the move" },
      { ro: "Intri cu lot normal, dar fără stop, ca să nu te scoată volatilitatea", en: "Enter with a normal lot but no stop, so volatility can't shake you out" },
      { ro: "Nimic fără setup: intrarea pe lumânarea care a fugit deja e FOMO, nu analiză — piața oferă setup-uri în fiecare zi", en: "Nothing without a setup: entering on the candle that already ran is FOMO, not analysis — the market offers setups every single day" },
      { ro: "Deschizi poziție inversă — ce urcă repede trebuie să scadă", en: "Open the opposite position — what rises fast must fall" },
    ],
    correct: 2,
    explain: {
      ro: "FOMO te pune în piață exact la prețurile la care profesioniștii încasează; setup-ul ratat nu e o pierdere — e costul unui sistem sustenabil.",
      en: "FOMO puts you in the market exactly at the prices where professionals are cashing out; the missed setup isn't a loss — it's the cost of a sustainable system.",
    },
  },
  {
    q: {
      ro: "Tocmai ai închis cel mai bun trade al lunii și te simți invincibil. Care e decizia sigură?",
      en: "You just closed your best trade of the month and feel invincible. What is the safe decision?",
    },
    options: [
      { ro: "Risc înjumătățit la următoarea tranzacție sau ziua încheiată în profit: euforia e tilt cu semn schimbat", en: "Half risk on the next trade or ending the day in profit: euphoria is tilt with the sign flipped" },
      { ro: "Mărești lotul — ești în formă maximă și trebuie să profiți", en: "Increase the lot — you're on fire and must capitalize" },
      { ro: "Treci pe un timeframe mai mic, să prinzi cât mai multe intrări azi", en: "Drop to a lower timeframe to catch as many entries as possible today" },
      { ro: "Renunți la checklist pentru restul zilei — instinctul tocmai a dovedit că funcționează", en: "Skip the checklist for the rest of the day — instinct just proved it works" },
    ],
    correct: 0,
    explain: {
      ro: "După un câștig mare te simți invincibil, joci cu banii casei și relaxezi criteriile — statistic, ziua de după cel mai bun trade e una dintre cele mai riscante.",
      en: "After a big win you feel invincible, play with house money and loosen the criteria — statistically, the day after your best trade is one of the riskiest.",
    },
  },
  {
    q: {
      ro: "Care e regula de aur a jurnalului de trading?",
      en: "What is the golden rule of the trading journal?",
    },
    options: [
      { ro: "Notezi doar tranzacțiile câștigătoare, ca să-ți întărești încrederea", en: "You log only the winning trades, to build confidence" },
      { ro: "Îl completezi la cald, imediat după închiderea poziției, cu TOATE tranzacțiile — inclusiv cele rușinoase din revenge sau FOMO", en: "You fill it in hot, right after the position closes, with ALL trades — including the shameful revenge and FOMO ones" },
      { ro: "Îl completezi o dată pe lună, din memorie", en: "You fill it in once a month, from memory" },
      { ro: "Notezi doar rezultatul în bani — restul e pierdere de timp", en: "You log only the money result — the rest is a waste of time" },
    ],
    correct: 1,
    explain: {
      ro: "Memoria e un martor corupt care cosmetizează totul până seara; tranzacțiile rușinoase sunt lecțiile cele mai scumpe deja plătite — nejurnalizarea lor înseamnă să pierzi banii ȘI lecția.",
      en: "Memory is a corrupt witness that airbrushes everything by evening; the shameful trades are the most expensive lessons already paid for — leaving them out means losing the money AND the lesson.",
    },
  },
  {
    q: {
      ro: "Ai executat perfect un setup valid, cu sizing corect — și tranzacția a pierdut. Cum o judeci?",
      en: "You perfectly executed a valid setup with correct sizing — and the trade lost. How do you judge it?",
    },
    options: [
      { ro: "Decizie greșită — rezultatul e singurul care contează", en: "A wrong decision — the outcome is all that matters" },
      { ro: "Sistemul s-a stricat și trebuie schimbat imediat", en: "The system broke and must be changed immediately" },
      { ro: "Ghinion care trebuie recuperat imediat în următoarea tranzacție", en: "Bad luck that must be recovered immediately on the next trade" },
      { ro: "Decizie excelentă cu rezultat negativ: o singură tranzacție e zgomot — avantajul devine vizibil abia pe ~100 de tranzacții", en: "An excellent decision with a negative outcome: a single trade is noise — the edge only becomes visible over ~100 trades" },
    ],
    correct: 3,
    explain: {
      ro: "Un sistem cu avantaj e ca o monedă măsluită la 55%: pierzi frecvent aruncări individuale, iar seriile de pierderi sunt garantate. Te judeci după calitatea deciziei și respectarea planului, nu după o singură aruncare.",
      en: "An edge is like a coin rigged at 55%: you frequently lose individual flips, and losing streaks are guaranteed. You judge yourself by decision quality and plan adherence, not by a single flip.",
    },
  },
];
