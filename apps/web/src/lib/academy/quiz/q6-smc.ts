import type { QuizQuestion } from "./index";

// ── Quiz M6: Smart Money Concepts (SMC) ──────────────────────────────────────

export const Q6_QUIZ: QuizQuestion[] = [
  {
    q: {
      ro: "Ce este un Swing High?",
      en: "What is a Swing High?",
    },
    options: [
      { ro: "Orice maxim atins în sesiunea curentă", en: "Any high reached during the current session" },
      { ro: "O lumânare al cărei maxim e mai sus decât maximele lumânărilor din stânga și din dreapta ei — un vârf local confirmat", en: "A candle whose high is higher than the highs of the candles to its left and right — a confirmed local top" },
      { ro: "Maximul zilei precedente (PDH)", en: "The previous day's high (PDH)" },
      { ro: "Punctul în care RSI depășește 70", en: "The point where RSI exceeds 70" },
    ],
    correct: 1,
    explain: {
      ro: "Swing-urile sunt scheletul structurii: fără ele marcate corect și consecvent, BOS și CHoCH devin arbitrare. Alege o definiție și nu o mai schimba.",
      en: "Swings are the skeleton of structure: without them marked correctly and consistently, BOS and CHoCH become arbitrary. Pick one definition and never change it.",
    },
  },
  {
    q: {
      ro: "Care e diferența dintre BOS și CHoCH?",
      en: "What is the difference between BOS and CHoCH?",
    },
    options: [
      { ro: "BOS apare pe timeframe-uri mari, CHoCH pe timeframe-uri mici", en: "BOS appears on high timeframes, CHoCH on low timeframes" },
      { ro: "Sunt sinonime — ambele înseamnă ruperea unui swing", en: "They're synonyms — both mean the break of a swing" },
      { ro: "CHoCH confirmă continuarea trendului, iar BOS anunță inversarea", en: "CHoCH confirms trend continuation, while BOS announces the reversal" },
      { ro: "BOS rupe structura ÎN direcția trendului (continuare); CHoCH e prima ruptură ÎMPOTRIVA direcției (schimbare de context)", en: "BOS breaks structure IN the trend's direction (continuation); CHoCH is the first break AGAINST the direction (change of context)" },
    ],
    correct: 3,
    explain: {
      ro: "BOS extinde structura existentă și spune că tabăra dominantă încă domină; CHoCH marchează prima cedare de teren — nu un semnal de intrare, ci o schimbare de context.",
      en: "A BOS extends the existing structure and says the dominant side still dominates; a CHoCH marks the first surrender of ground — not an entry signal, but a change of context.",
    },
  },
  {
    q: {
      ro: "Uptrend cu HH și HL. Prețul eșuează într-un Lower High, apoi sparge prin închidere ultimul Higher Low. Ce s-a produs?",
      en: "An uptrend printing HH and HL. Price fails at a Lower High, then breaks the last Higher Low by close. What just happened?",
    },
    options: [
      { ro: "Un BOS bullish — continuarea trendului", en: "A bullish BOS — trend continuation" },
      { ro: "Un simplu pullback — structura rămâne intactă", en: "A simple pullback — the structure remains intact" },
      { ro: "Un CHoCH: caracterul pieței s-a schimbat — nu mai cauți long-uri pe retrageri", en: "A CHoCH: the market's character has changed — you stop hunting longs on pullbacks" },
      { ro: "Un liquidity sweep care garantează maxime noi", en: "A liquidity sweep that guarantees new highs" },
    ],
    correct: 2,
    explain: {
      ro: "Secvența LH + spargerea ultimului HL e anatomia clasică a CHoCH-ului: cumpărătorii au cedat terenul pentru prima dată, iar contextul trece spre evaluarea short-urilor pe retestări.",
      en: "The LH + break of the last HL sequence is the classic anatomy of a CHoCH: buyers gave up ground for the first time, and the context shifts toward evaluating shorts on retests.",
    },
  },
  {
    q: {
      ro: "Ce se află de regulă deasupra unor Equal Highs (EQH)?",
      en: "What usually sits above Equal Highs (EQH)?",
    },
    options: [
      { ro: "Un bazin de ordine de cumpărare: stopurile short-urilor plus buy stop-urile traderilor de breakout", en: "A pool of buy orders: the shorts' stop losses plus the breakout traders' buy stops" },
      { ro: "Doar ordine de vânzare ale instituțiilor", en: "Only institutional sell orders" },
      { ro: "Nimic — maximele egale resping întotdeauna prețul", en: "Nothing — equal highs always reject price" },
      { ro: "O zonă fără lichiditate, pe care prețul o evită", en: "A liquidity-free zone that price avoids" },
    ],
    correct: 0,
    explain: {
      ro: "Fiecare stop al unui short e un ordin de cumpărare care se execută automat; cu cât nivelul e mai curat și mai vizibil, cu atât mai multă lichiditate se adună acolo — de asta EQH par să cheme prețul.",
      en: "Every short's stop is a buy order that executes automatically; the cleaner and more visible the level, the more liquidity gathers there — which is why EQH seem to call price.",
    },
  },
  {
    q: {
      ro: "Cum deosebești un liquidity sweep de un breakout real?",
      en: "How do you tell a liquidity sweep from a real breakout?",
    },
    options: [
      { ro: "Sweep-ul are volum mare, breakout-ul volum mic", en: "The sweep carries high volume, the breakout low volume" },
      { ro: "Nu se pot deosebi în timp real, doar retroactiv", en: "They can't be told apart in real time, only in hindsight" },
      { ro: "Acceptarea: sweep = fitil prin nivel + închidere rapidă înapoi în range; breakout real = închidere dincolo de nivel, urmată de consolidare acolo", en: "Acceptance: sweep = wick through the level + a quick close back inside the range; real breakout = a close beyond the level, followed by consolidation there" },
      { ro: "Sweep-urile apar doar în sesiunea Asia", en: "Sweeps only happen during the Asian session" },
    ],
    correct: 2,
    explain: {
      ro: "Diferența e acceptarea prețului dincolo de nivel: dacă prețul stă confortabil peste EQH mai multe lumânări la rând, nu a fost vânătoare de stopuri — a fost expansiune.",
      en: "The difference is price acceptance beyond the level: if price sits comfortably above the EQH for several candles, it wasn't a stop hunt — it was expansion.",
    },
  },
  {
    q: {
      ro: "Ce este un Order Block bullish?",
      en: "What is a bullish Order Block?",
    },
    options: [
      { ro: "Prima lumânare verde a unui uptrend nou", en: "The first green candle of a new uptrend" },
      { ro: "Ultima lumânare bearish dinaintea unui impuls în sus care rupe structura — o zonă de interes, nu un buton de cumpărat", en: "The last bearish candle before an upward impulse that breaks structure — a zone of interest, not a buy button" },
      { ro: "Orice lumânare roșie mare, oriunde pe grafic", en: "Any large red candle, anywhere on the chart" },
      { ro: "O zonă deja traversată de trei ori de preț", en: "A zone price has already traded through three times" },
    ],
    correct: 1,
    explain: {
      ro: "OB-ul marchează zona de acumulare a unui jucător mare; fără ruptură de structură și displacement după el nu ai un OB valid, iar prima atingere (zona proaspătă, nemitigată) e cea mai valoroasă.",
      en: "The OB marks a large player's accumulation zone; without a structure break and displacement after it you don't have a valid OB, and the first touch (a fresh, unmitigated zone) is the most valuable.",
    },
  },
  {
    q: {
      ro: "Cum se măsoară un FVG bullish?",
      en: "How is a bullish FVG measured?",
    },
    options: [
      { ro: "Distanța dintre open-ul și close-ul lumânării din mijloc", en: "The distance between the middle candle's open and close" },
      { ro: "Golul dintre minimul lumânării 1 și maximul lumânării 3", en: "The gap between candle 1's low and candle 3's high" },
      { ro: "Distanța dintre două medii mobile consecutive", en: "The distance between two consecutive moving averages" },
      { ro: "Golul dintre maximul lumânării 1 și minimul lumânării 3, atunci când acestea nu se suprapun", en: "The gap between candle 1's high and candle 3's low, when the two do not overlap" },
    ],
    correct: 3,
    explain: {
      ro: "FVG-ul e un tipar de 3 lumânări: lumânarea din mijloc e atât de impulsivă încât high-ul primei și low-ul celei de-a treia lasă un gol — acolo a tranzacționat practic o singură parte a pieței. Varianta cu low-ul lumânării 1 descrie FVG-ul bearish.",
      en: "The FVG is a 3-candle pattern: the middle candle is so impulsive that candle 1's high and candle 3's low leave a gap — essentially only one side of the market traded there. The version using candle 1's low describes the bearish FVG.",
    },
  },
  {
    q: {
      ro: "Dealing range: swing low la 1.0700, swing high la 1.0900. Prețul e la 1.0860. În ce zonă te afli și ce înseamnă pentru long-uri?",
      en: "Dealing range: swing low at 1.0700, swing high at 1.0900. Price is at 1.0860. Which zone are you in, and what does it mean for longs?",
    },
    options: [
      { ro: "Premium (peste equilibrium-ul de la 1.0800) — zonă de încasat profit pe long-uri, nu de cumpărat", en: "Premium (above the 1.0800 equilibrium) — a zone for banking long profits, not for buying" },
      { ro: "Discount — loc ideal de cumpărare", en: "Discount — an ideal buying spot" },
      { ro: "Exact la equilibrium — piața e la valoarea corectă", en: "Exactly at equilibrium — the market is at fair value" },
      { ro: "În afara range-ului — range-ul trebuie redesenat", en: "Outside the range — the range must be redrawn" },
    ],
    correct: 0,
    explain: {
      ro: "Equilibrium = 50% din range: (1.0700 + 1.0900) / 2 = 1.0800; la 1.0860 ești în jumătatea scumpă. Long-urile din premium înseamnă să cumperi exact acolo unde profesioniștii încasează.",
      en: "Equilibrium = 50% of the range: (1.0700 + 1.0900) / 2 = 1.0800; at 1.0860 you're in the expensive half. Longs from premium mean buying exactly where professionals are cashing out.",
    },
  },
];
