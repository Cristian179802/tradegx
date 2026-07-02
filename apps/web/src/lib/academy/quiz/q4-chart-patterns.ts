import type { QuizQuestion } from "./index";

// ── Quiz M4: Chart Patterns ──────────────────────────────────────────────────

export const Q4_QUIZ: QuizQuestion[] = [
  {
    q: {
      ro: "Ce confirmă un Head & Shoulders?",
      en: "What confirms a Head & Shoulders?",
    },
    options: [
      { ro: "Închiderea unei lumânări sub neckline — până atunci pattern-ul e doar o ipoteză", en: "A candle close below the neckline — until then the pattern is just a hypothesis" },
      { ro: "Formarea umărului drept", en: "The formation of the right shoulder" },
      { ro: "Un fitil care înțeapă neckline-ul", en: "A wick poking through the neckline" },
      { ro: "Atingerea capului — al treilea vârf al formațiunii", en: "The touch of the head — the formation's third peak" },
    ],
    correct: 0,
    explain: {
      ro: "Abia închiderea sub neckline rupe oficial structura de uptrend (HH + HL) și prinde pe pierdere cumpărătorii de pe umărul drept; fitilele prin neckline sunt clasicele capcane de lichiditate.",
      en: "Only the close below the neckline officially breaks the uptrend structure (HH + HL) and traps the right-shoulder buyers; wicks through the neckline are the classic liquidity traps.",
    },
  },
  {
    q: {
      ro: "Un Head & Shoulders are capul la 1.1200 și neckline-ul la 1.1000. Care e ținta măsurată după break?",
      en: "A Head & Shoulders has the head at 1.1200 and the neckline at 1.1000. What is the measured target after the break?",
    },
    options: [
      { ro: "1.0900", en: "1.0900" },
      { ro: "1.1000", en: "1.1000" },
      { ro: "1.0800", en: "1.0800" },
      { ro: "1.0600", en: "1.0600" },
    ],
    correct: 2,
    explain: {
      ro: "Înălțimea pattern-ului = 1.1200 − 1.1000 = 200 pips, proiectată în jos din punctul de break: 1.1000 − 0.0200 = 1.0800. Ținta e o estimare, nu o promisiune.",
      en: "Pattern height = 1.1200 − 1.1000 = 200 pips, projected down from the break point: 1.1000 − 0.0200 = 1.0800. The target is an estimate, not a promise.",
    },
  },
  {
    q: {
      ro: "Prețul atinge a doua oară același maxim. Ai deja un double top tranzacționabil?",
      en: "Price touches the same high for the second time. Do you already have a tradeable double top?",
    },
    options: [
      { ro: "Da — vinzi direct la al doilea vârf", en: "Yes — you sell right at the second peak" },
      { ro: "Nu — pattern-ul există abia după închiderea sub neckline (minimul dintre cele două vârfuri)", en: "No — the pattern exists only after a close below the neckline (the low between the two peaks)" },
      { ro: "Da, dacă RSI e peste 70", en: "Yes, if RSI is above 70" },
      { ro: "Nu — un double top cere minimum trei vârfuri", en: "No — a double top requires at least three peaks" },
    ],
    correct: 1,
    explain: {
      ro: "La al doilea touch ai doar o rezistență testată de două ori, care se poate foarte bine rupe în sus; fără confirmarea neckline-ului tranzacționezi o monedă aruncată.",
      en: "At the second touch you only have a resistance tested twice, which may very well break upward; without the neckline confirmation you're trading a coin flip.",
    },
  },
  {
    q: {
      ro: "Un bull flag are pole-ul de la 100 la 160, iar break-ul steagului se produce la 150. Care e ținta măsurată?",
      en: "A bull flag has its pole from 100 to 160, and the flag breaks out at 150. What is the measured target?",
    },
    options: [
      { ro: "160 — maximul pole-ului", en: "160 — the pole's high" },
      { ro: "185", en: "185" },
      { ro: "200", en: "200" },
      { ro: "210 — înălțimea pole-ului (60) proiectată din punctul de break", en: "210 — the pole's height (60) projected from the break point" },
    ],
    correct: 3,
    explain: {
      ro: "Ținta flag-ului = înălțimea pole-ului proiectată din break: 160 − 100 = 60 de puncte, deci 150 + 60 = 210.",
      en: "The flag's target = the pole's height projected from the break: 160 − 100 = 60 points, so 150 + 60 = 210.",
    },
  },
  {
    q: {
      ro: "Ce definește un triunghi ascendent și care e bias-ul lui statistic?",
      en: "What defines an ascending triangle and what is its statistical bias?",
    },
    options: [
      { ro: "Rezistență orizontală + minime tot mai sus; bias de rupere în sus, confirmat de close peste rezistență", en: "Horizontal resistance + rising lows; an upside-break bias, confirmed by a close above the resistance" },
      { ro: "Suport orizontal + maxime tot mai jos; bias de rupere în sus", en: "Horizontal support + lower highs; an upside-break bias" },
      { ro: "Două linii convergente înclinate în aceeași direcție; bias de continuare garantată", en: "Two converging lines sloping the same way; a guaranteed continuation bias" },
      { ro: "Un canal paralel scurt după un impuls puternic", en: "A short parallel channel after a strong impulse" },
    ],
    correct: 0,
    explain: {
      ro: "Minimele crescătoare arată cumpărători tot mai agresivi care absorb oferta de la rezistență — bias-ul e spre rupere în sus, dar nu e o lege: confirmarea rămâne close-ul peste nivel.",
      en: "The rising lows show increasingly aggressive buyers absorbing the supply at resistance — the bias is toward an upside break, but it's not a law: confirmation remains the close above the level.",
    },
  },
  {
    q: {
      ro: "Prin ce diferă un rising wedge de un bull flag?",
      en: "How does a rising wedge differ from a bull flag?",
    },
    options: [
      { ro: "Nu diferă — ambele sunt formațiuni de continuare bullish", en: "They don't differ — both are bullish continuation formations" },
      { ro: "Wedge-ul are întotdeauna volum mai mare decât flag-ul", en: "The wedge always carries more volume than the flag" },
      { ro: "Flag-ul e un canal paralel scurt după impuls (continuare); rising wedge-ul e o convergență cu momentum în degradare, rezolvată tipic printr-o rupere în JOS", en: "The flag is a short parallel channel after an impulse (continuation); the rising wedge is a convergence with decaying momentum, typically resolving with a break DOWN" },
      { ro: "Wedge-ul se tranzacționează doar pe break în sus, flag-ul doar pe break în jos", en: "The wedge is traded only on upside breaks, the flag only on downside breaks" },
    ],
    correct: 2,
    explain: {
      ro: "La rising wedge maximele cresc din ce în ce mai puțin și liniile converg — momentum-ul moare în timp ce prețul încă urcă. Confuzia dintre cele două e una dintre cele mai frecvente greșeli de citire a graficului.",
      en: "In a rising wedge each high gains less ground and the lines converge — momentum dies while price is still rising. Confusing the two is one of the most common chart-reading mistakes.",
    },
  },
  {
    q: {
      ro: "Care e avantajul intrării pe retest față de intrarea pe break?",
      en: "What is the advantage of the retest entry over the break entry?",
    },
    options: [
      { ro: "Prinzi garantat fiecare mișcare", en: "You're guaranteed to catch every move" },
      { ro: "Nu mai ai nevoie de stop loss", en: "You no longer need a stop loss" },
      { ro: "Retestul vine întotdeauna, deci nu ratezi nimic", en: "The retest always comes, so you never miss anything" },
      { ro: "Stop mai strâns și R:R mai bun, iar multe fakeout-uri te ocolesc — dar uneori retestul nu mai vine", en: "A tighter stop and better R:R, and many fakeouts pass you by — but sometimes the retest never comes" },
    ],
    correct: 3,
    explain: {
      ro: "La retest intri pe S/R flip, cu stop strâns sub nivelul rupt; compromisul e că mișcarea poate pleca fără tine. Nicio variantă nu e universal corectă — alegi una și o execuți consecvent.",
      en: "On the retest you enter at the S/R flip, with a tight stop below the broken level; the trade-off is that the move can leave without you. Neither option is universally correct — pick one and execute it consistently.",
    },
  },
  {
    q: {
      ro: "Un Head & Shoulders rupe neckline-ul, apoi prețul revine agresiv peste umărul drept. Ce faci cu informația?",
      en: "A Head & Shoulders breaks the neckline, then price aggressively reclaims the right shoulder. What do you do with that information?",
    },
    options: [
      { ro: "Rămâi short — ținta măsurată rămâne valabilă indiferent de revenire", en: "Stay short — the measured target stays valid regardless of the reclaim" },
      { ro: "Pattern-ul a eșuat: vânzătorii sunt prinși în capcană, iar continuarea în sus e adesea violentă — eșecul e el însuși un semnal", en: "The pattern has failed: sellers are trapped and the continuation up is often violent — the failure is itself a signal" },
      { ro: "Aștepți al doilea break de neckline, păstrând aceeași poziție", en: "Wait for a second neckline break while keeping the same position" },
      { ro: "Dublezi short-ul — prețul e acum la un nivel mai bun", en: "Double the short — price is now at a better level" },
    ],
    correct: 1,
    explain: {
      ro: "Revenirea peste umărul drept invalidează inversarea și prinde toți vânzătorii pe partea greșită; traderii avansați tranzacționează eșecul pattern-ului cu aceeași seriozitate ca pattern-ul însuși.",
      en: "The reclaim above the right shoulder invalidates the reversal and traps every seller on the wrong side; advanced traders trade the pattern's failure as seriously as the pattern itself.",
    },
  },
];
