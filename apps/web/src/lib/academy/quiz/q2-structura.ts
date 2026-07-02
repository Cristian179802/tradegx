import type { QuizQuestion } from "./index";

// ── Quiz M2: Structura Pieței & Suport/Rezistență ───────────────────────────

export const Q2_QUIZ: QuizQuestion[] = [
  {
    q: {
      ro: "De ce funcționează nivelurile de suport și rezistență?",
      en: "Why do support and resistance levels work?",
    },
    options: [
      { ro: "Pentru că indicatorii tehnici le confirmă automat", en: "Because technical indicators confirm them automatically" },
      { ro: "Pentru că ordinele mai multor categorii de participanți se concentrează în aceleași zone, iar piața are memorie", en: "Because orders from several categories of participants concentrate in the same zones, and the market has memory" },
      { ro: "Pentru că prețul se oprește întotdeauna exact la aceeași valoare", en: "Because price always stops at exactly the same value" },
      { ro: "Pentru că nivelurile rotunde produc mereu inversări garantate", en: "Because round numbers always produce guaranteed reversals" },
    ],
    correct: 1,
    explain: {
      ro: "Nivelurile marchează zone unde s-au executat volume mari de ordine: cei care vor să reintre, cei care au ratat mișcarea și cei care ies pe breakeven acționează în același loc.",
      en: "Levels mark zones where large amounts of orders were executed: those wanting back in, those who missed the move and those exiting at breakeven all act in the same place.",
    },
  },
  {
    q: {
      ro: "Cumperi de la o zonă de suport. Unde plasezi corect stop loss-ul?",
      en: "You buy from a support zone. Where does the stop loss correctly go?",
    },
    options: [
      { ro: "Exact pe linia de suport, ca să riști cât mai puțin", en: "Exactly on the support line, to risk as little as possible" },
      { ro: "La o distanță fixă de 20 pips, indiferent de instrument", en: "At a fixed 20-pip distance, regardless of instrument" },
      { ro: "Dincolo de întreaga zonă, cu o marjă suplimentară", en: "Beyond the entire zone, with an extra margin" },
      { ro: "Nu e nevoie de stop loss dacă suportul e puternic", en: "No stop loss needed if the support is strong" },
    ],
    correct: 2,
    explain: {
      ro: "Reacția se întâmplă într-o bandă, nu pe o linie: piața penetrează frecvent nivelul cu un wick, execută stopurile puse pe linie și abia apoi pleacă în direcția corectă.",
      en: "The reaction happens inside a band, not on a line: the market frequently pierces the level with a wick, takes out the stops sitting on the line, and only then moves the right way.",
    },
  },
  {
    q: {
      ro: "Câte atingeri fac o trendline tranzacționabilă?",
      en: "How many touches make a trendline tradeable?",
    },
    options: [
      { ro: "Trei: două puncte o trasează, a treia atingere o validează", en: "Three: two points draw it, the third touch validates it" },
      { ro: "Una: linia e valabilă de la prima atingere", en: "One: the line is valid from the first touch" },
      { ro: "Două: dacă unește două puncte, poți tranzacționa direct", en: "Two: if it connects two points, you can trade it right away" },
      { ro: "Cinci: sub cinci atingeri orice linie e zgomot", en: "Five: below five touches any line is noise" },
    ],
    correct: 0,
    explain: {
      ro: "Cu două puncte ai doar o ipoteză; abia a treia atingere confirmă că piața respectă linia și o transformă în nivel tranzacționabil.",
      en: "With two points you only have a hypothesis; only the third touch confirms the market respects the line and turns it into a tradeable level.",
    },
  },
  {
    q: {
      ro: "Ce este golden cross-ul și cum se folosește corect?",
      en: "What is the golden cross and how is it used correctly?",
    },
    options: [
      { ro: "EMA 20 taie MA 50 — semnal de intrare imediată pe long", en: "The 20 EMA crossing the 50 MA — an immediate long entry signal" },
      { ro: "MA 50 taie în jos MA 200 — semnal rapid de vânzare", en: "The 50 MA crossing below the 200 MA — a fast sell signal" },
      { ro: "Un semnal de timing precis care prinde chiar începutul trendului", en: "A precise timing signal that catches the very start of the trend" },
      { ro: "MA 50 taie în sus MA 200 — confirmare de regim, folosită ca filtru de direcție, nu ca unealtă de timing", en: "The 50 MA crossing above the 200 MA — regime confirmation, used as a direction filter, not a timing tool" },
    ],
    correct: 3,
    explain: {
      ro: "Mediile mobile sunt calculate din trecut și întârzie prin construcție: golden cross-ul apare după ce prețul a urcat deja semnificativ, deci confirmă regimul — intrarea o dau structura și nivelurile.",
      en: "Moving averages are computed from the past and lag by construction: the golden cross appears after price has already risen significantly, so it confirms the regime — the entry comes from structure and levels.",
    },
  },
  {
    q: {
      ro: "Prețul străpunge o rezistență evidentă cu un fitil lung, dar lumânarea închide înapoi sub nivel, iar următoarele lumânări scad. Ce s-a întâmplat cel mai probabil?",
      en: "Price pierces an obvious resistance with a long wick, but the candle closes back below the level and the next candles fall. What most likely happened?",
    },
    options: [
      { ro: "Un breakout valid care are nevoie doar de mai mult timp", en: "A valid breakout that just needs more time" },
      { ro: "Un false breakout: lichiditatea de deasupra nivelului a fost recoltată, iar capcana s-a închis", en: "A false breakout: the liquidity above the level was harvested and the trap snapped shut" },
      { ro: "O eroare de cotare a brokerului, fără semnificație tehnică", en: "A broker quoting error with no technical meaning" },
      { ro: "Un semnal de cumpărare — prețul va reveni sigur peste nivel", en: "A buy signal — price will surely reclaim the level" },
    ],
    correct: 1,
    explain: {
      ro: "Deasupra rezistențelor evidente stau stopurile short-urilor și buy stop-urile vânătorilor de breakout; wick-ul le execută, apoi prețul pleacă de regulă hotărât în direcția opusă.",
      en: "Above obvious resistance sit the shorts' stops and the breakout hunters' buy stops; the wick fills them, then price usually leaves decisively in the opposite direction.",
    },
  },
  {
    q: {
      ro: "Într-un range valid, de unde NU ar trebui să deschizi poziții?",
      en: "Inside a valid range, where should you NOT open positions from?",
    },
    options: [
      { ro: "De la suport, cu confirmare de respingere", en: "From support, with rejection confirmation" },
      { ro: "De la rezistență, cu confirmare de respingere", en: "From resistance, with rejection confirmation" },
      { ro: "Din mijlocul range-ului, unde nu ai nici avantaj statistic, nici stop logic", en: "From the middle of the range, where you have neither statistical edge nor a logical stop" },
      { ro: "De la retestul unei margini sparte", en: "From the retest of a broken edge" },
    ],
    correct: 2,
    explain: {
      ro: "Mijlocul range-ului e pământul nimănui: ești departe de ambele margini, stopul nu are un loc tehnic și probabilitățile sunt o monedă aruncată.",
      en: "The middle of the range is no man's land: you're far from both edges, the stop has no technical home and the odds are a coin flip.",
    },
  },
  {
    q: {
      ro: "Care combinație descrie un breakout credibil?",
      en: "Which combination describes a credible breakout?",
    },
    options: [
      { ro: "Close decisiv dincolo de nivel, corp mare, volum peste medie și follow-through pe lumânările următoare", en: "A decisive close beyond the level, a large body, above-average volume and follow-through on the next candles" },
      { ro: "Fitil lung prin nivel, corp mic și volum scăzut", en: "A long wick through the level, a small body and low volume" },
      { ro: "Orice atingere a nivelului în direcția trendului", en: "Any touch of the level in the trend's direction" },
      { ro: "Un gap peste nivel în sesiunea asiatică, pe lichiditate redusă", en: "A gap above the level during the Asian session, on thin liquidity" },
    ],
    correct: 0,
    explain: {
      ro: "Un breakout real are semnătura convingerii: închidere dincolo de nivel, participare reală (volum) și continuare — un wick prin nivel e doar o încercare.",
      en: "A real breakout carries the signature of conviction: a close beyond the level, real participation (volume) and continuation — a wick through the level is just an attempt.",
    },
  },
  {
    q: {
      ro: "Prețul face maxime noi, dar volumul scade la fiecare împingere. Cum interpretezi?",
      en: "Price prints new highs, but volume shrinks on every push. How do you read it?",
    },
    options: [
      { ro: "Trendul e mai puternic ca oricând — volumul nu contează în trend", en: "The trend is stronger than ever — volume doesn't matter in a trend" },
      { ro: "Semnal de vânzare imediată — inversarea e garantată", en: "An immediate sell signal — the reversal is guaranteed" },
      { ro: "Volumul e irelevant pe orice piață, fiind doar o aproximare", en: "Volume is irrelevant on any market, being just an approximation" },
      { ro: "Divergență preț–volum: trendul avansează din inerție — prudență, strângi stopurile și nu mai adaugi", en: "Price–volume divergence: the trend is running on inertia — caution, tighten stops and stop adding" },
    ],
    correct: 3,
    explain: {
      ro: "Tot mai puțini participanți cumpără la prețuri tot mai mari; divergența nu e ordin de vânzare — trendurile obosite pot continua — ci un avertisment care cere prudență.",
      en: "Fewer and fewer participants are buying at ever-higher prices; divergence is not a sell order — tired trends can keep running — but a warning that demands caution.",
    },
  },
];
