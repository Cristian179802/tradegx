import type { QuizQuestion } from "./index";

// ── Quiz M9: Sisteme de Trading & Backtesting ────────────────────────────────

export const Q9_QUIZ: QuizQuestion[] = [
  {
    q: {
      ro: "De ce bate un sistem scris improvizația?",
      en: "Why does a written system beat improvisation?",
    },
    options: [
      { ro: "Pentru că garantează profit în fiecare lună", en: "Because it guarantees profit every month" },
      { ro: "Pentru că elimină complet pierderile", en: "Because it eliminates losses completely" },
      { ro: "Pentru că nu mai are nevoie de backtesting", en: "Because it no longer needs backtesting" },
      { ro: "Pentru că e măsurabil: o serie de 6 pierderi devine o statistică așteptată, nu haos — nu poți repara ce nu poți măsura", en: "Because it is measurable: a 6-loss streak becomes an expected statistic, not chaos — you can't fix what you can't measure" },
    ],
    correct: 3,
    explain: {
      ro: "Când improvizezi, o serie de pierderi nu îți spune dacă piața s-a schimbat, dacă ai greșit sau dacă n-ai avut niciodată avantaj; pe un sistem testat, aceeași serie e o statistică pe care o traversezi execuție după execuție.",
      en: "When you improvise, a losing streak can't tell you whether the market changed, you erred, or you never had an edge; on a tested system, the same streak is a statistic you execute your way through.",
    },
  },
  {
    q: {
      ro: "Ce cere testul celor doi traderi de la regulile unui sistem?",
      en: "What does the two-trader test demand from a system's rules?",
    },
    options: [
      { ro: "Să fie binare și testabile: 'trend puternic' devine 'preț peste EMA 50 pe H4, cu EMA 50 crescătoare'", en: "That they be binary and testable: 'strong trend' becomes 'price above the 50 EMA on H4, with the 50 EMA rising'" },
      { ro: "Să fie suficient de flexibile încât fiecare să le adapteze stilului propriu", en: "That they be flexible enough for each trader to adapt them to their own style" },
      { ro: "Să conțină minimum 12 parametri optimizați", en: "That they contain at least 12 optimized parameters" },
      { ro: "Să rămână secrete — un sistem împărtășit își pierde avantajul", en: "That they stay secret — a shared system loses its edge" },
    ],
    correct: 0,
    explain: {
      ro: "Doi traderi care nu se cunosc trebuie să ia aproape aceleași tranzacții din aceleași reguli; cuvintele vagi nu pot fi contrazise, dar tocmai de aceea nu pot fi nici testate, nici îmbunătățite.",
      en: "Two traders who've never met should take almost the same trades from the same rules; weasel words can't be contradicted, but for exactly that reason they can't be tested or improved either.",
    },
  },
  {
    q: {
      ro: "Care e profilul statistic tipic al trend following-ului?",
      en: "What is the typical statistical profile of trend following?",
    },
    options: [
      { ro: "Win rate mare (70%+) cu câștiguri mici — consistență zilnică", en: "A high win rate (70%+) with small winners — daily consistency" },
      { ro: "Win rate modest (35–50%) cu câștigători mari (2R–10R+); suferă în range prin whipsaw", en: "A modest win rate (35–50%) with large winners (2R–10R+); it suffers in ranges through whipsaw" },
      { ro: "Win rate fix de 50%, cu câștiguri egale cu pierderile", en: "A fixed 50% win rate, with wins equal to losses" },
      { ro: "Nu are profil statistic — depinde de fiecare zi", en: "It has no statistical profile — it depends on the day" },
    ],
    correct: 1,
    explain: {
      ro: "Câteva tranzacții pe an fac cea mai mare parte din profit, iar matematica funcționează chiar cu multe pierderi mici; prețul plătit e răbdarea — profilul opus (win rate mare, câștiguri mici) aparține mean reversion-ului.",
      en: "A handful of trades per year produce most of the profit, and the math works even with many small losses; the price paid is patience — the opposite profile (high win rate, small winners) belongs to mean reversion.",
    },
  },
  {
    q: {
      ro: "Care e eșantionul minim înainte să tragi concluzii dintr-un backtest?",
      en: "What is the minimum sample before drawing conclusions from a backtest?",
    },
    options: [
      { ro: "10 tranzacții — suficient pentru o tendință", en: "10 trades — enough for a tendency" },
      { ro: "30 de tranzacții, dintr-o singură lună", en: "30 trades, from a single month" },
      { ro: "Minimum 100 de tranzacții, pe regimuri diferite de piață (trend sus/jos, range, volatilitate mare și mică)", en: "At least 100 trades, across different market regimes (uptrend, downtrend, range, high and low volatility)" },
      { ro: "Numărul nu contează — contează doar profitul total", en: "The number doesn't matter — only the total profit does" },
    ],
    correct: 2,
    explain: {
      ro: "Un sistem cu win rate real de 50% poate afișa lejer 65% sau 35% pe 20 de tranzacții — pură varianță; abia la 100+ tranzacții, pe regimuri diverse, vezi sistemul și nu norocul.",
      en: "A system with a true 50% win rate can easily show 65% or 35% over 20 trades — pure variance; only at 100+ trades, across diverse regimes, are you seeing the system rather than luck.",
    },
  },
  {
    q: {
      ro: "Rezultate spectaculoase pe datele in-sample, prăbușire pe out-of-sample. Care e diagnosticul?",
      en: "Spectacular results on the in-sample data, collapse on the out-of-sample. What is the diagnosis?",
    },
    options: [
      { ro: "Overfitting: regulile s-au mulat pe zgomotul datelor studiate — ai memorat trecutul, nu ai descoperit un edge", en: "Overfitting: the rules molded themselves onto the studied data's noise — you memorized the past, you didn't discover an edge" },
      { ro: "Ghinion — rulezi testul încă o dată", en: "Bad luck — you run the test one more time" },
      { ro: "Perioada out-of-sample e defectă și trebuie exclusă", en: "The out-of-sample period is faulty and must be excluded" },
      { ro: "Normal — orice sistem merge mai slab pe date noi, deci poți trece pe live", en: "Normal — every system does worse on new data, so you can go live" },
    ],
    correct: 0,
    explain: {
      ro: "Simptomele clasice: parametri mulți și suspect de preciși, istoric perfect, live dezastruos. Preferă sistemul cu 3 reguli și rezultate decente pe orice perioadă celui cu 12 parametri perfecți pe o singură felie de istorie.",
      en: "The classic symptoms: many suspiciously precise parameters, a perfect history, a disastrous live. Prefer the system with 3 rules and decent results on any period over the one with 12 parameters perfect on a single slice of history.",
    },
  },
  {
    q: {
      ro: "Un sistem are win rate 40%, câștig mediu 3R și pierdere medie 1R. Care e expectancy-ul?",
      en: "A system has a 40% win rate, a 3R average win and a 1R average loss. What is its expectancy?",
    },
    options: [
      { ro: "−0.2R — sub 50% win rate înseamnă pierdere", en: "−0.2R — below a 50% win rate means losing" },
      { ro: "+0.2R per tranzacție", en: "+0.2R per trade" },
      { ro: "+1.2R per tranzacție", en: "+1.2R per trade" },
      { ro: "+0.6R per tranzacție: E = 0.40 × 3R − 0.60 × 1R = 1.2 − 0.6", en: "+0.6R per trade: E = 0.40 × 3R − 0.60 × 1R = 1.2 − 0.6" },
    ],
    correct: 3,
    explain: {
      ro: "Sistemul pierde în 60% din cazuri și totuși produce +60R la 100 de tranzacții — nu win rate-ul plătește facturile, ci expectancy-ul. Prețul: serii lungi de pierderi pe care trebuie să le poți executa.",
      en: "The system loses 60% of the time and still produces +60R over 100 trades — it's not win rate that pays the bills, it's expectancy. The price: long losing streaks you must be able to execute through.",
    },
  },
  {
    q: {
      ro: "Pe 100 de tranzacții: profit brut 120R, pierdere brută 60R. Care e profit factor-ul și cum îl interpretezi?",
      en: "Over 100 trades: 120R gross profit, 60R gross loss. What is the profit factor and how do you read it?",
    },
    options: [
      { ro: "0.5 — sistem pierzător", en: "0.5 — a losing system" },
      { ro: "60 — excepțional, gata de scalat", en: "60 — exceptional, ready to scale" },
      { ro: "2.0 — sistem solid (peste pragul de ~1.75), dacă eșantionul e suficient de mare și divers", en: "2.0 — a solid system (above the ~1.75 threshold), provided the sample is large and diverse enough" },
      { ro: "1.2 — abia tranzacționabil", en: "1.2 — barely tradeable" },
    ],
    correct: 2,
    explain: {
      ro: "PF = profit brut ÷ pierdere brută = 120 / 60 = 2.0. Sub 1 e pierzător, 1.3–1.5 tranzacționabil, peste 1.75 solid — iar peste 3 pe eșantion mare verifici de două ori: miroase a overfitting.",
      en: "PF = gross profit ÷ gross loss = 120 / 60 = 2.0. Below 1 is losing, 1.3–1.5 tradeable, above 1.75 solid — and above 3 on a large sample you double-check: it smells of overfitting.",
    },
  },
  {
    q: {
      ro: "Care e rolul fiecărei etape pe drumul demo → live mic → cont finanțat?",
      en: "What is the role of each stage on the demo → small live → funded account path?",
    },
    options: [
      { ro: "Demo validează psihologia, live-ul mic validează regulile, finanțarea validează brokerul", en: "Demo validates the psychology, small live validates the rules, funding validates the broker" },
      { ro: "Demo validează MECANICA (reguli, execuție), live-ul mic validează OMUL (emoții reale), iar finanțarea SCALEAZĂ un avantaj deja dovedit", en: "Demo validates the MECHANICS (rules, execution), small live validates the HUMAN (real emotions), and funding SCALES an already proven edge" },
      { ro: "Toate trei au același scop: acumularea de profit cât mai rapid", en: "All three share the same goal: accumulating profit as fast as possible" },
      { ro: "Etapele sunt opționale — poți sări direct în challenge dacă sistemul arată bine pe hârtie", en: "The stages are optional — you can jump straight into a challenge if the system looks good on paper" },
    ],
    correct: 1,
    explain: {
      ro: "Pe demo emoțiile lipsesc, deci nu dovedește nimic despre psihologie; abia pe live mic afli dacă respecți stopul când doare. Saltul direct din demo în challenge e cel mai frecvent mod de a dona taxe de participare.",
      en: "On demo the emotions are absent, so it proves nothing about psychology; only on small live do you learn whether you honor the stop when it hurts. Jumping straight from demo into a challenge is the most common way of donating participation fees.",
    },
  },
];
