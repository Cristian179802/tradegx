import type { QuizQuestion } from "./index";

// ── Quiz M7: Risk Management ─────────────────────────────────────────────────

export const Q7_QUIZ: QuizQuestion[] = [
  {
    q: {
      ro: "Contul tău a scăzut cu 25%. Ce procent de câștig îți trebuie ca să revii la nivelul inițial?",
      en: "Your account is down 25%. What percentage gain do you need to get back to the starting level?",
    },
    options: [
      { ro: "+20%", en: "+20%" },
      { ro: "+25%", en: "+25%" },
      { ro: "+33%", en: "+33%" },
      { ro: "+50%", en: "+50%" },
    ],
    correct: 2,
    explain: {
      ro: "Recuperezi dintr-o bază mai mică: de la 75% din cont ai nevoie de 25/75 ≈ +33% ca să revii la 100%. De asta prima regulă nu e 'câștigă mult', ci 'nu pierde mult'.",
      en: "You recover from a smaller base: from 75% of the account you need 25/75 ≈ +33% to get back to 100%. That's why the first rule isn't 'win big' but 'don't lose big'.",
    },
  },
  {
    q: {
      ro: "Cont de 10.000 $, risc 1% per tranzacție, SL tehnic de 20 pips pe EURUSD (1 pip ≈ 10 $ per lot standard). Ce lot deschizi?",
      en: "A $10,000 account, 1% risk per trade, a 20-pip technical SL on EURUSD (1 pip ≈ $10 per standard lot). What lot size do you open?",
    },
    options: [
      { ro: "0.20 loturi", en: "0.20 lots" },
      { ro: "0.50 loturi", en: "0.50 lots" },
      { ro: "1.00 lot", en: "1.00 lot" },
      { ro: "0.05 loturi", en: "0.05 lots" },
    ],
    correct: 1,
    explain: {
      ro: "Risc în bani = 10.000 × 1% = 100 $; lot = 100 / (20 × 10) = 0.50. Verificare: 0.50 lot → 5 $/pip × 20 pips = 100 $. Întâi stopul tehnic, abia apoi lotul.",
      en: "Money risk = 10,000 × 1% = $100; lot = 100 / (20 × 10) = 0.50. Check: 0.50 lots → $5/pip × 20 pips = $100. The technical stop comes first, the lot only after.",
    },
  },
  {
    q: {
      ro: "La un R:R de 1:2, ce win rate minim îți trebuie ca să ieși pe zero?",
      en: "At a 1:2 R:R, what minimum win rate do you need to break even?",
    },
    options: [
      { ro: "50%", en: "50%" },
      { ro: "40%", en: "40%" },
      { ro: "25%", en: "25%" },
      { ro: "≈33%", en: "≈33%" },
    ],
    correct: 3,
    explain: {
      ro: "Win rate breakeven = 1 / (1 + R:R) = 1 / 3 ≈ 33%. Un R:R bun îți cumpără dreptul de a greși des — la 1:3 poți pierde trei din patru tranzacții fără să pierzi bani.",
      en: "Breakeven win rate = 1 / (1 + R:R) = 1 / 3 ≈ 33%. A good R:R buys you the right to be wrong often — at 1:3 you can lose three trades out of four without losing money.",
    },
  },
  {
    q: {
      ro: "Un sistem are win rate 55%, dar riscă 100 $ ca să câștige 50 $ (R:R 1:0.5). Ce se întâmplă pe termen lung?",
      en: "A system has a 55% win rate but risks $100 to make $50 (1:0.5 R:R). What happens over the long run?",
    },
    options: [
      { ro: "Pierde bani sistematic: E = 0.55 × 0.5R − 0.45 × 1R = −0.175R per tranzacție", en: "It loses money systematically: E = 0.55 × 0.5R − 0.45 × 1R = −0.175R per trade" },
      { ro: "Câștigă — peste 50% win rate înseamnă întotdeauna profit", en: "It wins — above a 50% win rate always means profit" },
      { ro: "Iese exact pe zero", en: "It breaks exactly even" },
      { ro: "Rezultatul depinde doar de levierul folosit", en: "The outcome depends only on the leverage used" },
    ],
    correct: 0,
    explain: {
      ro: "Câștigi mai mult de jumătate din tranzacții și totuși pierzi bani: win rate-ul singur nu spune nimic — doar perechea win rate + R:R decide dacă ai un avantaj real.",
      en: "You win more than half your trades and still lose money: win rate alone says nothing — only the win rate + R:R pair decides whether you have a real edge.",
    },
  },
  {
    q: {
      ro: "Challenge de prop firm pe 100.000 $ cu max daily loss de 5%. Riscând 1% (1.000 $) pe tranzacție, câte stopuri consecutive într-o singură zi îți pică contul?",
      en: "A prop-firm challenge on $100,000 with a 5% max daily loss. Risking 1% ($1,000) per trade, how many consecutive stops in a single day fail the account?",
    },
    options: [
      { ro: "3", en: "3" },
      { ro: "5", en: "5" },
      { ro: "10", en: "10" },
      { ro: "20", en: "20" },
    ],
    correct: 1,
    explain: {
      ro: "Limita zilnică e 5.000 $, deci 5.000 / 1.000 = 5 stopuri — iar seriile de 5 pierderi sunt statistic normale. De asta traderii de prop serioși riscă 0.25–0.5% și se opresc după 2–3 tranzacții pe zi.",
      en: "The daily limit is $5,000, so 5,000 / 1,000 = 5 stops — and 5-loss streaks are statistically normal. That's why serious prop traders risk 0.25–0.5% and stop after 2–3 trades a day.",
    },
  },
  {
    q: {
      ro: "Ai simultan buy 1% pe EURUSD și buy 1% pe GBPUSD. Care e riscul tău real?",
      en: "You simultaneously hold a 1% buy on EURUSD and a 1% buy on GBPUSD. What is your real risk?",
    },
    options: [
      { ro: "Două riscuri independente de câte 1%", en: "Two independent 1% risks" },
      { ro: "Riscurile se anulează reciproc — perechile se echilibrează", en: "The risks cancel each other out — the pairs balance" },
      { ro: "În esență o singură idee (dolar slab) cu risc de ~2% — perechile sunt puternic corelate pozitiv", en: "Essentially one idea (a weak dollar) with ~2% risk — the pairs are strongly positively correlated" },
      { ro: "0.5% — diversificarea înjumătățește riscul", en: "0.5% — diversification halves the risk" },
    ],
    correct: 2,
    explain: {
      ro: "Ambele perechi au dolarul pe partea a doua și se mișcă de regulă împreună: dacă dolarul se întărește, ambele stopuri se ating simultan. Pozițiile corelate se tratează ca UNA la sizing.",
      en: "Both pairs have the dollar on the second side and usually move together: if the dollar strengthens, both stops get hit at once. Correlated positions are treated as ONE trade when sizing.",
    },
  },
  {
    q: {
      ro: "Ce proprietate face metoda fixed fractional superioară lotului fix?",
      en: "What property makes fixed fractional superior to a fixed lot?",
    },
    options: [
      { ro: "Frânează în drawdown și accelerează în creștere: lotul se recalculează din soldul curent la fiecare tranzacție", en: "It brakes in drawdowns and accelerates in growth: the lot is recalculated from the current balance on every trade" },
      { ro: "Garantează că nu vei mai avea serii de pierderi", en: "It guarantees you'll never have losing streaks again" },
      { ro: "Îți permite să riști mai mult după pierderi, ca să recuperezi rapid", en: "It lets you risk more after losses, to recover fast" },
      { ro: "Elimină nevoia de stop loss", en: "It removes the need for a stop loss" },
    ],
    correct: 0,
    explain: {
      ro: "La risc procentual fix, pierderile consecutive devin tot mai mici în bani, iar câștigurile se compun natural — exact opusul lotului fix, care în drawdown mușcă un procent tot mai mare dintr-un cont tot mai mic.",
      en: "With a fixed percentage risk, consecutive losses get smaller and smaller in money terms while gains compound naturally — the exact opposite of a fixed lot, which in a drawdown bites an ever larger share of an ever smaller account.",
    },
  },
  {
    q: {
      ro: "În ce situații poți pierde MAI MULT decât riscul calculat de 1%?",
      en: "In which situations can you lose MORE than your calculated 1% risk?",
    },
    options: [
      { ro: "Niciodată — stop loss-ul garantează pierderea maximă", en: "Never — the stop loss guarantees the maximum loss" },
      { ro: "Doar când brokerul face erori de execuție", en: "Only when the broker makes execution errors" },
      { ro: "Când folosești un levier prea mic", en: "When you use too little leverage" },
      { ro: "La slippage pe știri majore (NFP, CPI, FOMC) și la gap-urile de weekend — SL-ul se execută la primul preț disponibil", en: "With slippage on major news (NFP, CPI, FOMC) and weekend gaps — the SL executes at the first available price" },
    ],
    correct: 3,
    explain: {
      ro: "În jurul știrilor spread-urile se lărgesc și lichiditatea dispare, iar peste weekend prețul se poate deschide cu gap dincolo de stop; nu le poți elimina — le eviți (stai deoparte) sau le amortizezi (loturi reduse).",
      en: "Around news, spreads widen and liquidity vanishes, and over the weekend price can open with a gap beyond your stop; you can't eliminate these — you avoid them (stand aside) or cushion them (smaller lots).",
    },
  },
];
