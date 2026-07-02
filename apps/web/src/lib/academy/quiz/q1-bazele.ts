import type { QuizQuestion } from "./index";

// ── Quiz M1: Bazele Tradingului ─────────────────────────────────────────────

export const Q1_QUIZ: QuizQuestion[] = [
  {
    q: {
      ro: "Ce arată corpul unei lumânări japoneze?",
      en: "What does the body of a Japanese candlestick show?",
    },
    options: [
      { ro: "Distanța dintre maxim și minim", en: "The distance between high and low" },
      { ro: "Distanța dintre Open și Close", en: "The distance between Open and Close" },
      { ro: "Volumul tranzacționat în interval", en: "The volume traded in the interval" },
      { ro: "Spread-ul mediu al intervalului", en: "The average spread of the interval" },
    ],
    correct: 1,
    explain: {
      ro: "Corpul = Open→Close. Fitilele arată extremele (High/Low) atinse în interval.",
      en: "The body = Open→Close. The wicks show the extremes (High/Low) reached in the interval.",
    },
  },
  {
    q: {
      ro: "Un uptrend sănătos se definește prin:",
      en: "A healthy uptrend is defined by:",
    },
    options: [
      { ro: "Maxime mai sus și minime mai sus (HH + HL)", en: "Higher highs and higher lows (HH + HL)" },
      { ro: "Maxime mai jos și minime mai jos (LH + LL)", en: "Lower highs and lower lows (LH + LL)" },
      { ro: "Prețul peste orice medie mobilă", en: "Price above any moving average" },
      { ro: "Trei lumânări verzi consecutive", en: "Three consecutive green candles" },
    ],
    correct: 0,
    explain: {
      ro: "Structura HH + HL este definiția trendului ascendent. Mediile și culorile lumânărilor sunt doar indicii secundare.",
      en: "The HH + HL structure is the definition of an uptrend. Averages and candle colors are only secondary clues.",
    },
  },
  {
    q: {
      ro: "Care este cel mai lichid interval al zilei pe forex?",
      en: "Which is the most liquid window of the forex day?",
    },
    options: [
      { ro: "Sesiunea Asia", en: "The Asian session" },
      { ro: "Suprapunerea Londra–New York", en: "The London–New York overlap" },
      { ro: "După închiderea New York", en: "After the New York close" },
      { ro: "Weekendul", en: "The weekend" },
    ],
    correct: 1,
    explain: {
      ro: "Suprapunerea Londra–NY concentrează cel mai mare volum și cele mai direcționale mișcări.",
      en: "The London–NY overlap concentrates the highest volume and the most directional moves.",
    },
  },
  {
    q: {
      ro: "La EURUSD, 1 pip înseamnă de regulă:",
      en: "On EURUSD, 1 pip usually means:",
    },
    options: [
      { ro: "A 2-a zecimală", en: "The 2nd decimal" },
      { ro: "A 3-a zecimală", en: "The 3rd decimal" },
      { ro: "A 4-a zecimală", en: "The 4th decimal" },
      { ro: "A 5-a zecimală", en: "The 5th decimal" },
    ],
    correct: 2,
    explain: {
      ro: "La majoritatea perechilor forex pip-ul e a 4-a zecimală; a 5-a e punctul (0.1 pips). La perechile JPY, pip-ul e a 2-a zecimală.",
      en: "On most forex pairs the pip is the 4th decimal; the 5th is a point (0.1 pips). On JPY pairs, the pip is the 2nd decimal.",
    },
  },
  {
    q: {
      ro: "Cumperi 0.10 loturi EURUSD și prețul urcă 50 pips. Profitul aproximativ este:",
      en: "You buy 0.10 lots of EURUSD and price rises 50 pips. Your approximate profit is:",
    },
    options: [
      { ro: "5 $", en: "$5" },
      { ro: "50 $", en: "$50" },
      { ro: "500 $", en: "$500" },
      { ro: "0.50 $", en: "$0.50" },
    ],
    correct: 1,
    explain: {
      ro: "La 0.10 loturi, 1 pip ≈ 1 $. Deci 50 pips ≈ 50 $.",
      en: "At 0.10 lots, 1 pip ≈ $1. So 50 pips ≈ $50.",
    },
  },
  {
    q: {
      ro: "Ce face levierul 1:100?",
      en: "What does 1:100 leverage do?",
    },
    options: [
      { ro: "Îți garantează profituri de 100x", en: "Guarantees you 100x profits" },
      { ro: "Îți permite să controlezi poziții de 100x capitalul, amplificând și pierderile", en: "Lets you control positions 100x your capital, amplifying losses too" },
      { ro: "Reduce riscul de 100 de ori", en: "Reduces risk 100 times" },
      { ro: "Elimină nevoia de stop loss", en: "Removes the need for a stop loss" },
    ],
    correct: 1,
    explain: {
      ro: "Levierul e doar eficiență de capital: amplifică în egală măsură profiturile și pierderile. Riscul real îl decide mărimea lotului.",
      en: "Leverage is just capital efficiency: it amplifies profits and losses equally. Your real risk is set by lot size.",
    },
  },
  {
    q: {
      ro: "Vrei să cumperi DOAR dacă prețul scade întâi la o zonă de suport. Ce ordin folosești?",
      en: "You want to buy ONLY if price first drops to a support zone. Which order do you use?",
    },
    options: [
      { ro: "Market order", en: "Market order" },
      { ro: "Buy Stop", en: "Buy Stop" },
      { ro: "Buy Limit", en: "Buy Limit" },
      { ro: "Sell Limit", en: "Sell Limit" },
    ],
    correct: 2,
    explain: {
      ro: "Buy Limit = ordin în așteptare SUB prețul curent, la un preț mai bun. Buy Stop se plasează PESTE preț (pentru breakout).",
      en: "Buy Limit = a pending order BELOW the current price, at a better price. Buy Stop goes ABOVE price (for breakouts).",
    },
  },
  {
    q: {
      ro: "Când trebuie setat Stop Loss-ul?",
      en: "When should the Stop Loss be set?",
    },
    options: [
      { ro: "După ce poziția intră pe minus", en: "After the position goes negative" },
      { ro: "Înainte de intrare, într-un loc tehnic care invalidează ideea", en: "Before entry, at a technical spot that invalidates the idea" },
      { ro: "Doar la pozițiile mari", en: "Only on large positions" },
      { ro: "Nu e necesar dacă urmărești graficul", en: "Not needed if you watch the chart" },
    ],
    correct: 1,
    explain: {
      ro: "SL-ul se decide ÎNAINTE de intrare, plasat tehnic (dincolo de zona care îți invalidează scenariul), nu emoțional.",
      en: "The SL is decided BEFORE entry, placed technically (beyond the zone that invalidates your scenario), not emotionally.",
    },
  },
];
