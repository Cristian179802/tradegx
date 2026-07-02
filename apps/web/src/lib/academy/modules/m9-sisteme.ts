import type { ModuleBundle } from "../types";

// ── M9: Sisteme de Trading & Backtesting (Expert) ───────────────────────────

export const M9_BUNDLE: ModuleBundle = {
  module: {
    id: "sisteme-de-trading",
    level: "EXPERT",
    icon: "cog",
    title: { ro: "Sisteme de Trading & Backtesting", en: "Trading Systems & Backtesting" },
    description: {
      ro: "De la idee la sistem măsurabil: cele 7 componente ale unui sistem complet, arhetipurile de strategii, backtesting făcut corect, statisticile care contează și drumul de la demo la cont finanțat.",
      en: "From idea to measurable system: the 7 components of a complete system, strategy archetypes, backtesting done right, the statistics that matter and the road from demo to a funded account.",
    },
    lessons: [
      {
        id: "anatomia-unui-sistem",
        title: { ro: "Anatomia unui sistem complet", en: "Anatomy of a complete system" },
        minutes: 10,
        sections: [
          {
            body: {
              ro: "Diferența dintre un trader profitabil și unul veșnic „aproape profitabil\" nu este talentul — este faptul că primul operează un SISTEM, iar al doilea improvizează. Un sistem de trading este un set de reguli scrise care îți spun, fără ambiguitate, ce tranzacționezi, când intri, unde ieși și cât riști.\n\nDe ce bate sistemul improvizația? Dintr-un singur motiv, suficient: **este măsurabil**. O serie de 6 pierderi pe un sistem testat este o statistică așteptată — o traversezi execuție după execuție. Aceeași serie când improvizezi este haos: nu știi dacă piața s-a schimbat, dacă tu ai greșit sau dacă pur și simplu n-ai avut niciodată un avantaj. Nu poți repara ce nu poți măsura.",
              en: "The difference between a profitable trader and a perpetually 'almost profitable' one isn't talent — it's that the first operates a SYSTEM while the second improvises. A trading system is a set of written rules that tell you, without ambiguity, what you trade, when you enter, where you exit and how much you risk.\n\nWhy does a system beat improvisation? For one sufficient reason: **it is measurable**. A streak of 6 losses on a tested system is an expected statistic — you execute your way through it. The same streak while improvising is chaos: you don't know whether the market changed, whether you made mistakes, or whether you simply never had an edge. You can't fix what you can't measure.",
            },
          },
          {
            heading: { ro: "Cele 7 componente", en: "The 7 components" },
            body: {
              ro: "Un sistem complet răspunde la 7 întrebări. Dacă una rămâne fără răspuns scris, sistemul are o gaură prin care se scurg banii:\n\n- **1. Piața** — ce instrument(e) tranzacționezi? EURUSD? Aur? BTC? Fiecare are personalitate proprie; un sistem funcționează rar identic pe toate.\n- **2. Timeframe-ul** — pe ce TF apare setup-ul și pe ce TF execuți? Fixat, nu „depinde de zi\".\n- **3. Setup + trigger** — ce condiții de context trebuie să existe și care este evenimentul EXACT care declanșează intrarea (de exemplu: închidere M15 peste nivel, după sweep)?\n- **4. Stop loss** — unde este invalidată ideea? Definit TEHNIC, înainte de intrare.\n- **5. Take profit** — unde iei profitul? Nivel fix, R:R fix sau trailing — dar definit.\n- **6. Sizing** — ce procent din cont riști per tranzacție? (1% este standardul sănătos.)\n- **7. Management** — ce faci ÎNTRE intrare și ieșire: muți stopul pe break-even? Iei profit parțial? În ce condiții exacte?",
              en: "A complete system answers 7 questions. If one stays unanswered in writing, the system has a hole your money leaks through:\n\n- **1. The market** — which instrument(s) do you trade? EURUSD? Gold? BTC? Each has its own personality; a system rarely works identically on all.\n- **2. The timeframe** — on which TF does the setup appear and on which do you execute? Fixed, not 'depends on the day'.\n- **3. Setup + trigger** — which context conditions must exist, and what is the EXACT event that triggers the entry (e.g. an M15 close above the level, after a sweep)?\n- **4. The stop loss** — where is the idea invalidated? Defined TECHNICALLY, before entry.\n- **5. The take profit** — where do you take profit? Fixed level, fixed R:R or trailing — but defined.\n- **6. Sizing** — what percentage of the account do you risk per trade? (1% is the healthy standard.)\n- **7. Management** — what do you do BETWEEN entry and exit: move the stop to break-even? Take partials? Under exactly which conditions?",
            },
            warning: {
              ro: "„Ies când simt că se întoarce\" nu este regulă de management — este improvizație deghizată. Orice componentă lăsată la latitudinea emoției din momentul tranzacției va fi decisă de frică sau de lăcomie, nu de tine.",
              en: "'I exit when it feels like it's turning' is not a management rule — it's improvisation in disguise. Any component left to in-the-moment emotion will be decided by fear or greed, not by you.",
            },
          },
          {
            heading: { ro: "Testul celor doi traderi", en: "The two-trader test" },
            body: {
              ro: "Standardul de aur pentru un sistem bine scris: dai regulile la doi traderi care nu se cunosc, iar peste o lună au luat (aproape) aceleași tranzacții. Dacă rezultatele diferă radical, regulile tale conțin cuvinte-vagi: „trend puternic\", „aproape de nivel\", „arată bine\".\n\nVagul este confortabil pentru că nu poate fi contrazis — dar exact din același motiv nu poate fi nici testat, nici îmbunătățit. Rescrie fiecare regulă până devine binară: orice condiție ori ESTE îndeplinită, ori NU este. „Trend puternic\" devine „preț peste EMA 50 pe H4 și EMA 50 crescătoare\". Poate fi o definiție imperfectă — dar este testabilă, iar imperfecțiunea măsurabilă bate perfecțiunea imaginară.",
              en: "The gold standard for a well-written system: hand the rules to two traders who've never met, and a month later they've taken (almost) the same trades. If their results differ radically, your rules contain weasel words: 'strong trend', 'near the level', 'looks good'.\n\nVagueness is comfortable because it can't be contradicted — but for exactly the same reason it can't be tested or improved either. Rewrite every rule until it's binary: each condition either IS met or is NOT. 'Strong trend' becomes 'price above the 50 EMA on H4, with the 50 EMA rising'. It may be an imperfect definition — but it's testable, and measurable imperfection beats imaginary perfection.",
            },
            tip: {
              ro: "Scrie-ți sistemul ca și cum l-ai preda unui om care nu te poate întreba nimic. Apoi respectă-l 30 de tranzacții FĂRĂ nicio modificare — abia după aceea ai date pe baza cărora să schimbi ceva în cunoștință de cauză.",
              en: "Write your system as if teaching it to someone who can't ask you anything. Then follow it for 30 trades WITHOUT a single modification — only then do you have data to change anything knowingly.",
            },
          },
        ],
      },
      {
        id: "arhetipuri-de-strategii",
        title: { ro: "Arhetipuri de strategii", en: "Strategy archetypes" },
        minutes: 11,
        sections: [
          {
            body: {
              ro: "Aproape orice sistem profitabil din lume este o variație a câtorva ARHETIPURI fundamentale. Să știi din ce familie face parte sistemul tău nu este teorie — este supraviețuire: fiecare arhetip are un regim de piață în care înflorește și unul în care sângerează. Când știi asta dinainte, o serie de pierderi devine previzibilă („e range, sistemul meu de trend suferă, e normal\") în loc să devină criză de încredere.",
              en: "Almost every profitable system in the world is a variation on a few fundamental ARCHETYPES. Knowing which family your system belongs to isn't theory — it's survival: each archetype has a market regime where it thrives and one where it bleeds. When you know that in advance, a losing streak becomes predictable ('it's a range, my trend system suffers, this is normal') instead of becoming a crisis of confidence.",
            },
          },
          {
            heading: { ro: "Trend following", en: "Trend following" },
            body: {
              ro: "**Ideea**: piețele care se mișcă tind să continue; cumperi forța, vinzi slăbiciunea și călărești mișcarea cât ține.\n\n- **Intrare tipică** — pullback la o medie mobilă în trend, ruptură de structură (BOS), închidere peste un maxim relevant.\n- **Profil statistic** — win rate modest (35-50%), câștigători mari (2R-10R+). Câteva tranzacții pe an fac cea mai mare parte din profit.\n- **Punct forte** — prinde mișcările mari; matematica funcționează chiar și cu multe pierderi mici.\n- **Punct slab** — în range este tocat mărunt: semnal fals după semnal fals (whipsaw). Cere o răbdare psihologică rară: vei da înapoi profit deschis și vei pierde des.",
              en: "**The idea**: markets in motion tend to stay in motion; you buy strength, sell weakness and ride the move for as long as it lasts.\n\n- **Typical entry** — a pullback to a moving average within the trend, a structure break (BOS), a close above a relevant high.\n- **Statistical profile** — modest win rate (35-50%), large winners (2R-10R+). A handful of trades per year produce most of the profit.\n- **Strength** — it catches the big moves; the math works even with many small losses.\n- **Weakness** — in a range it gets chopped to pieces: false signal after false signal (whipsaw). It demands rare psychological patience: you'll give back open profit and you'll lose often.",
            },
          },
          {
            heading: { ro: "Mean reversion", en: "Mean reversion" },
            body: {
              ro: "**Ideea**: excesele se corectează; când prețul se întinde prea departe de „normal\", pariezi pe întoarcere.\n\n- **Intrare tipică** — cumpărare la suportul unui range, vânzare la rezistență; RSI extrem plus respingere; abatere mare față de VWAP sau de o medie.\n- **Profil statistic** — win rate mare (55-70%), câștigători mici (0,5R-1,5R). Multe reușite mărunte.\n- **Punct forte** — consistență plăcută psihologic; funcționează în piețele laterale, adică în majoritatea timpului.\n- **Punct slab** — riscul de coadă. Range-ul se rupe într-o zi, iar ziua aceea poate înghiți săptămâni de profituri dacă managementul pierderii este slab.\n\nDiagrama arată exact aceeași secvență de preț văzută prin cei doi ochelari: mean reversion cumpără jos și vinde sus CÂT TIMP range-ul ține; trend following stă deoparte și cumpără abia RUPEREA range-ului.",
              en: "**The idea**: excesses correct; when price stretches too far from 'normal', you bet on the snap-back.\n\n- **Typical entry** — buying at a range's support, selling at resistance; extreme RSI plus rejection; a large deviation from VWAP or a moving average.\n- **Statistical profile** — high win rate (55-70%), small winners (0.5R-1.5R). Many small successes.\n- **Strength** — psychologically pleasant consistency; it works in sideways markets, i.e. most of the time.\n- **Weakness** — tail risk. One day the range breaks, and that day can swallow weeks of profits if loss management is weak.\n\nThe diagram shows the exact same price sequence through both lenses: mean reversion buys low and sells high FOR AS LONG AS the range holds; trend following stands aside and only buys the BREAK of the range.",
            },
            diagram: "m9-archetypes",
            warning: {
              ro: "Capcana mean reversion: „dacă a scăzut atât, TREBUIE să revină\". Nu trebuie nimic. Fără un stop loss respectat cu sfințenie, o singură zi de trend puternic împotriva ta poate șterge luni de câștiguri mărunte.",
              en: "The mean reversion trap: 'it's dropped so much, it HAS to come back'. It doesn't have to do anything. Without a religiously respected stop loss, a single day of strong trend against you can erase months of small gains.",
            },
          },
          {
            heading: { ro: "Breakout", en: "Breakout" },
            body: {
              ro: "**Ideea**: compresie → expansiune. Piețele alternează între consolidare și mișcare; traderul de breakout vânează momentul ruperii.\n\n- **Intrare tipică** — închidere dincolo de un range comprimat, retest al nivelului rupt, expansiune de volatilitate după o zonă îngustă.\n- **Profil statistic** — win rate mediu (40-55%), câștigători potențial mari când breakout-ul prinde trend.\n- **Punct forte** — te pune în piață exact când începe acțiunea; invalidare clară (revenirea în range = ieșire).\n- **Punct slab** — breakout-urile false, mai ales în piețele liniștite și în jurul lichidității evidente. Îți amintești sweep-urile din modulul SMC? Multe „breakout-uri\" sunt exact asta: recoltare de stopuri, nu expansiune.",
              en: "**The idea**: compression → expansion. Markets alternate between consolidation and movement; the breakout trader hunts the moment of the break.\n\n- **Typical entry** — a close beyond a compressed range, a retest of the broken level, a volatility expansion after a tight zone.\n- **Statistical profile** — medium win rate (40-55%), potentially large winners when the breakout catches a trend.\n- **Strength** — it puts you in the market exactly when the action starts; clear invalidation (back inside the range = out).\n- **Weakness** — false breakouts, especially in quiet markets and around obvious liquidity. Remember the sweeps from the SMC module? Many 'breakouts' are exactly that: stop harvesting, not expansion.",
            },
          },
          {
            heading: { ro: "Confluență și scoring (stil HPS)", en: "Confluence and scoring (HPS-style)" },
            body: {
              ro: "**Ideea**: în loc de un singur semnal, aduni un PUNCTAJ din mai mulți factori independenți — structură, zonă (OB/FVG), lichiditate luată, context HTF, sesiune, confirmare — și tranzacționezi doar peste un prag (de exemplu 7 din 10).\n\n- **Punct forte** — filtrează agresiv zgomotul; te forțează să aștepți setup-urile A+; se potrivește natural cu jurnalizarea (fiecare factor devine o coloană de analizat).\n- **Punct slab** — mai puține tranzacții (eșantionul statistic se adună lent) și un pericol subtil: dacă factorii nu sunt definiți binar, scoringul devine un mod elegant de a-ți raționaliza impulsurile.\n\nNiciun arhetip nu este „cel mai bun\". Cel mai bun este cel pe care îl poți EXECUTA: temperamentul tău, programul tău și toleranța ta la serii de pierderi contează mai mult decât eleganța teoretică a strategiei.",
              en: "**The idea**: instead of a single signal, you build a SCORE from several independent factors — structure, zone (OB/FVG), liquidity taken, HTF context, session, confirmation — and only trade above a threshold (e.g. 7 out of 10).\n\n- **Strength** — it filters noise aggressively; it forces you to wait for A+ setups; it fits journaling naturally (every factor becomes a column to analyze).\n- **Weakness** — fewer trades (the statistical sample builds slowly) and one subtle danger: if the factors aren't defined in binary terms, scoring becomes an elegant way to rationalize your impulses.\n\nNo archetype is 'the best'. The best one is the one you can EXECUTE: your temperament, your schedule and your tolerance for losing streaks matter more than the strategy's theoretical elegance.",
            },
            tip: {
              ro: "Alege UN arhetip și sapă adânc 6 luni. Traderii care schimbă strategia după fiecare săptămână slabă colecționează începuturi — niciodată statistici.",
              en: "Pick ONE archetype and dig deep for 6 months. Traders who switch strategies after every weak week collect fresh starts — never statistics.",
            },
          },
        ],
      },
      {
        id: "backtesting-corect",
        title: { ro: "Backtesting făcut corect", en: "Backtesting done right" },
        minutes: 12,
        sections: [
          {
            body: {
              ro: "Backtesting-ul este procesul prin care îți confrunți sistemul cu istoricul pieței: dacă aș fi aplicat aceste reguli, mecanic, pe ultimii 2-3 ani, ce s-ar fi întâmplat? El transformă o părere („cred că merge\") într-o distribuție de rezultate (win rate, expectancy, drawdown). Fără el, tranzacționezi o ipoteză netestată cu bani reali.\n\n- **Backtesting manual** — derulezi graficul lumânare cu lumânare (bar replay) și execuți regulile pe hârtie. Lent, dar îți antrenează ochiul și te obligă să vezi setup-urile formându-se în timp real. Riscul: ochiul „știe\" ce urmează și te lasă să trișezi.\n- **Backtesting automat** — codul aplică regulile pe date istorice. Rapid, obiectiv, scalabil pe ani întregi de date. Riscul: erori de logică și reguli care nu pot fi exprimate în cod exact așa cum le tranzacționezi.\n\nCombinația ideală: automat pentru validarea statistică brută, manual pentru a înțelege NUANȚA setup-urilor.",
              en: "Backtesting is the process of confronting your system with market history: if I had applied these rules, mechanically, over the past 2-3 years, what would have happened? It turns an opinion ('I think it works') into a distribution of outcomes (win rate, expectancy, drawdown). Without it, you're trading an untested hypothesis with real money.\n\n- **Manual backtesting** — you scroll the chart candle by candle (bar replay) and execute the rules on paper. Slow, but it trains your eye and forces you to watch setups form in real time. The risk: your eye 'knows' what comes next and lets you cheat.\n- **Automated backtesting** — code applies the rules to historical data. Fast, objective, scalable across years of data. The risk: logic errors and rules that can't be expressed in code exactly the way you trade them.\n\nThe ideal combination: automated for the raw statistical validation, manual to understand the NUANCE of the setups.",
            },
          },
          {
            heading: { ro: "Eșantionul: minimum 100", en: "The sample: 100 minimum" },
            body: {
              ro: "Regula nenegociabilă: **minimum 100 de tranzacții** înainte să tragi orice concluzie. De ce? Varianța.\n\nUn sistem cu un win rate real de 50% poate afișa lejer 65% sau 35% pe un eșantion de 20 de tranzacții — pură întâmplare, ca 20 de aruncări de monedă. La 100+ tranzacții, zgomotul începe să se așeze și abia atunci vezi sistemul, nu norocul.\n\nȘi eșantionul trebuie să fie DIVERS: 100 de tranzacții din 2021 (un an de trend euforic pe crypto) nu îți spun nimic despre cum se descurcă sistemul în 2022 (un an de scădere). Acoperă regimuri diferite: trend sus, trend jos, range, volatilitate mare și mică.",
              en: "The non-negotiable rule: **100 trades minimum** before drawing any conclusion. Why? Variance.\n\nA system with a true 50% win rate can easily display 65% or 35% on a 20-trade sample — pure chance, like 20 coin flips. At 100+ trades the noise starts settling, and only then are you seeing the system rather than luck.\n\nAnd the sample must be DIVERSE: 100 trades from 2021 (a year of euphoric crypto trending) tell you nothing about how the system copes with 2022 (a down year). Cover different regimes: uptrend, downtrend, range, high and low volatility.",
            },
          },
          {
            heading: { ro: "In-sample, out-of-sample și overfitting", en: "In-sample, out-of-sample and overfitting" },
            body: {
              ro: "**Overfitting-ul** este ucigașul tăcut al sistemelor: în loc să surprinzi un avantaj real, îți mulezi regulile pe ZGOMOTUL specific datelor pe care le-ai studiat. Sistemul devine o cheie perfectă pentru o ușă care nu va mai exista niciodată.\n\nSimptomele: parametri mulți și suspect de preciși (RSI 13,5 în loc de 14, TP la 1,87R), rezultate spectaculoase pe istoric, prăbușire pe live.\n\nAntidotul standard: împarte datele.\n\n- **In-sample (IS)** — de exemplu 70% din istoric: aici construiești și calibrezi regulile.\n- **Out-of-sample (OOS)** — restul de 30%, NEATINS în timpul construcției: aici validezi. Dacă performanța pe OOS se prăbușește față de IS (ca pe diagramă), n-ai descoperit un edge — ai memorat trecutul.\n\nRegulă de robustețe: preferă sistemul cu 3 reguli și rezultate decente pe orice perioadă în locul celui cu 12 parametri și rezultate perfecte pe o singură felie de istorie.",
              en: "**Overfitting** is the silent killer of systems: instead of capturing a real edge, you mold your rules onto the NOISE specific to the data you studied. The system becomes a perfect key for a door that will never exist again.\n\nThe symptoms: many, suspiciously precise parameters (RSI 13.5 instead of 14, TP at 1.87R), spectacular results on history, collapse on live.\n\nThe standard antidote: split the data.\n\n- **In-sample (IS)** — e.g. 70% of the history: here you build and calibrate the rules.\n- **Out-of-sample (OOS)** — the remaining 30%, UNTOUCHED during construction: here you validate. If OOS performance collapses relative to IS (as in the diagram), you haven't discovered an edge — you've memorized the past.\n\nA robustness rule: prefer the system with 3 rules and decent results on any period over the one with 12 parameters and perfect results on a single slice of history.",
            },
            diagram: "m9-overfitting",
          },
          {
            heading: { ro: "Pune mâna: backtesting în TradeGx", en: "Hands on: backtesting in TradeGx" },
            body: {
              ro: "Teoria fără practică nu valorează nimic, așa că iată tema: TradeGx are o pagină de **Backtesting** conectată la date istorice reale (Yahoo Finance), cu **5 strategii gata construite** pe care le poți rula imediat și un **constructor de strategii custom cu peste 15 indicatori** (medii mobile, RSI, MACD, Bollinger și restul arsenalului).\n\n- Rulează întâi strategiile gata făcute pe instrumentul tău preferat, pe 2-3 ani de date, și studiază rapoartele: equity curve, win rate, drawdown.\n- Apoi construiește-ți propria variantă în builder și compar-o cinstit cu cele de referință.\n- Schimbă UN parametru pe rând și observă cât de mult se mișcă rezultatele: sensibilitatea mare la parametri este mirosul overfitting-ului.",
              en: "Theory without practice is worth nothing, so here's your homework: TradeGx has a **Backtesting** page connected to real historical data (Yahoo Finance), with **5 ready-built strategies** you can run immediately and a **custom strategy builder with 15+ indicators** (moving averages, RSI, MACD, Bollinger and the rest of the arsenal).\n\n- First run the ready-made strategies on your favorite instrument over 2-3 years of data and study the reports: equity curve, win rate, drawdown.\n- Then build your own variant in the builder and compare it honestly against the reference ones.\n- Change ONE parameter at a time and watch how much the results move: high sensitivity to parameters is the smell of overfitting.",
            },
            tip: {
              ro: "Ține un „jurnal de experimente\": pentru fiecare backtest notează ipoteza, parametrii și rezultatul. Fără el, în 3 săptămâni nu mai știi ce ai testat și retestezi aceleași idei la nesfârșit.",
              en: "Keep an 'experiment log': for every backtest, write down the hypothesis, the parameters and the result. Without it, in 3 weeks you won't remember what you've tested and you'll keep retesting the same ideas forever.",
            },
            warning: {
              ro: "În backtesting-ul manual, cel mai periculos inamic ești tu: ochiul care „vede\" retroactiv doar setup-urile câștigătoare (hindsight bias). Folosește bar replay, acoperă partea dreaptă a graficului și decide ÎNAINTE să derulezi — altfel obții statistici de vis pe care live-ul nu le va confirma niciodată.",
              en: "In manual backtesting, the most dangerous enemy is you: the eye that retroactively 'sees' only the winning setups (hindsight bias). Use bar replay, cover the right side of the chart and decide BEFORE you scroll — otherwise you'll produce dream statistics that live trading will never confirm.",
            },
          },
        ],
      },
      {
        id: "citirea-statisticilor",
        title: { ro: "Citirea statisticilor", en: "Reading the statistics" },
        minutes: 12,
        sections: [
          {
            heading: { ro: "R-multiples: limba comună a riscului", en: "R-multiples: the common language of risk" },
            body: {
              ro: "Înainte de orice statistică, standardizează unitatea de măsură: **R** = suma riscată pe o tranzacție (distanța intrare→stop, exprimată în bani). Dacă riști 200 $ și câștigi 500 $, ai făcut **+2,5R**; dacă stopul se execută, **−1R**.\n\nGândirea în R face două lucruri esențiale: elimină dimensiunea contului din discuție (un +2R este la fel de bun pe un cont de 1.000 $ ca pe unul de 100.000 $) și îți permite să compari CORECT tranzacții și sisteme între ele. Toate statisticile care urmează se exprimă natural în R.",
              en: "Before any statistic, standardize the unit of measurement: **R** = the amount risked on one trade (the entry→stop distance, in money). If you risk $200 and win $500, you made **+2.5R**; if the stop executes, **−1R**.\n\nThinking in R does two essential things: it removes account size from the discussion (a +2R is just as good on a $1,000 account as on a $100,000 one) and it lets you compare trades and systems FAIRLY. All the statistics that follow are naturally expressed in R.",
            },
          },
          {
            heading: { ro: "Win rate: cea mai supraevaluată cifră", en: "Win rate: the most overrated number" },
            body: {
              ro: "**Win rate** = procentul tranzacțiilor câștigătoare. Este cifra cu care se laudă toată lumea și, singură, este aproape lipsită de sens: un win rate de 90% cu câștiguri de 0,2R și pierderi de 1R pierde bani constant (0,90 × 0,2 − 0,10 × 1 = +0,08R... la limită, iar cu 85% deja E = 0,85 × 0,2 − 0,15 × 1 = +0,02R — practic zero, înainte de costuri).\n\nWin rate-ul capătă sens doar lângă raportul dintre câștigul mediu și pierderea medie. Pragul de break-even este:\n\n**W_min = AvgLoss ÷ (AvgWin + AvgLoss)**\n\nLa un câștig mediu de 2R și o pierdere medie de 1R, ai nevoie de doar 1 ÷ 3 ≈ 33% win rate ca să fii pe zero — orice procent peste înseamnă profit.",
              en: "**Win rate** = the percentage of winning trades. It's the number everyone brags about and, alone, it's nearly meaningless: a 90% win rate with 0.2R winners and 1R losers barely survives (0.90 × 0.2 − 0.10 × 1 = +0.08R... borderline, and at 85% it's already E = 0.85 × 0.2 − 0.15 × 1 = +0.02R — effectively zero, before costs).\n\nWin rate only acquires meaning next to the ratio of average win to average loss. The break-even threshold is:\n\n**W_min = AvgLoss ÷ (AvgWin + AvgLoss)**\n\nWith a 2R average win and a 1R average loss, you need only 1 ÷ 3 ≈ 33% win rate to break even — every percentage point above that is profit.",
            },
          },
          {
            heading: { ro: "Expectancy: cifra care decide totul", en: "Expectancy: the number that decides everything" },
            body: {
              ro: "**Expectancy** = câștigul mediu așteptat per tranzacție, cu tot cu pierderi:\n\n**E = Win% × AvgWin − Loss% × AvgLoss**\n\nSă comparăm două sisteme, fiecare pe 100 de tranzacții cu risc de 1R:\n\n- **Sistemul A** — win rate 65%, câștig mediu 1R, pierdere medie 1R: E = 0,65 × 1 − 0,35 × 1 = **+0,30R** per tranzacție → +30R pe 100 de tranzacții.\n- **Sistemul B** — win rate 40%, câștig mediu 3R, pierdere medie 1R: E = 0,40 × 3 − 0,60 × 1 = 1,20 − 0,60 = **+0,60R** per tranzacție → +60R pe 100 de tranzacții.\n\nLa un risc de 1% per tranzacție, A produce aproximativ +30%, iar B aproximativ +60% (necompus). Sistemul care PIERDE în 60% din cazuri face de două ori mai mulți bani decât cel care câștigă în 65% din cazuri. Asta este lecția: nu win rate-ul plătește facturile, ci expectancy-ul.\n\nPrețul plătit de B: seriile lungi de pierderi. La o rată de pierdere de 60%, probabilitatea ca oricare 5 tranzacții consecutive să fie toate pierzătoare este 0,6⁵ ≈ 7,8% — pe 100 de tranzacții, seriile de 5-6 pierderi la rând sunt practic garantate. Pentru A, aceeași probabilitate este 0,35⁵ ≈ 0,5%. Sistemul B este superior matematic; întrebarea este dacă TU îl poți executa fără să cedezi la a patra pierdere consecutivă.",
              en: "**Expectancy** = the average expected gain per trade, losses included:\n\n**E = Win% × AvgWin − Loss% × AvgLoss**\n\nLet's compare two systems, each over 100 trades risking 1R:\n\n- **System A** — 65% win rate, 1R average win, 1R average loss: E = 0.65 × 1 − 0.35 × 1 = **+0.30R** per trade → +30R over 100 trades.\n- **System B** — 40% win rate, 3R average win, 1R average loss: E = 0.40 × 3 − 0.60 × 1 = 1.20 − 0.60 = **+0.60R** per trade → +60R over 100 trades.\n\nRisking 1% per trade, A produces roughly +30% and B roughly +60% (non-compounded). The system that LOSES 60% of the time makes twice as much money as the one that wins 65% of the time. That is the lesson: it's not win rate that pays the bills — it's expectancy.\n\nThe price B pays: long losing streaks. At a 60% loss rate, the probability that any given 5 consecutive trades are all losers is 0.6⁵ ≈ 7.8% — over 100 trades, streaks of 5-6 straight losses are practically guaranteed. For A, the same probability is 0.35⁵ ≈ 0.5%. System B is mathematically superior; the question is whether YOU can execute it without folding at the fourth consecutive loss.",
            },
            tip: {
              ro: "Loghează-ți fiecare tranzacție în TradeGx cu R-ul realizat. După 50-100 de intrări ai propriul win rate, propriul expectancy și propriul drawdown — aceleași cifre pe care le studiezi aici, dar despre TINE.",
              en: "Log every trade in TradeGx with its realized R. After 50-100 entries you'll have your own win rate, your own expectancy and your own drawdown — the same numbers you're studying here, but about YOU.",
            },
          },
          {
            heading: { ro: "Profit factor și max drawdown", en: "Profit factor and max drawdown" },
            body: {
              ro: "**Profit factor (PF)** = profitul brut ÷ pierderea brută. Sub 1 = sistem pierzător; 1,3-1,5 = tranzacționabil; peste 1,75 = solid; peste 3 pe un eșantion mare = verifică de două ori, miroase a overfitting. Pentru sistemele de mai sus: A are PF = 65 ÷ 35 ≈ 1,86, iar B are PF = 120 ÷ 60 = 2,0.\n\n**Max drawdown (Max DD)** = cea mai adâncă scădere a equity-ului de la un vârf până la minimul care îi urmează — pe diagramă, distanța dintre Peak și fundul văii. Este statistica supraviețuirii, din două motive:\n\n- Matematica recuperării este nemiloasă: după −10% ai nevoie de +11% ca să revii, după −20% de +25%, după −50% de +100%.\n- Max DD-ul istoric este nivelul la care firmele de finanțare te descalifică și la care majoritatea traderilor își abandonează sistemul — de obicei chiar înainte de revenire.\n\nRegulă practică: presupune că viitorul îți va livra un drawdown MAI MARE decât cel din backtest (o calibrare uzuală: 1,5× cel istoric) și dimensionează-ți riscul per tranzacție în consecință.",
              en: "**Profit factor (PF)** = gross profit ÷ gross loss. Below 1 = a losing system; 1.3-1.5 = tradeable; above 1.75 = solid; above 3 on a large sample = double-check, it smells of overfitting. For the systems above: A has PF = 65 ÷ 35 ≈ 1.86, and B has PF = 120 ÷ 60 = 2.0.\n\n**Max drawdown (Max DD)** = the deepest equity decline from a peak to the trough that follows it — on the diagram, the distance between the Peak and the bottom of the valley. It is the statistic of survival, for two reasons:\n\n- Recovery math is merciless: after −10% you need +11% to get back, after −20% you need +25%, after −50% you need +100%.\n- Your historical Max DD is the level where funding firms disqualify you and where most traders abandon their system — usually right before the recovery.\n\nPractical rule: assume the future will hand you a LARGER drawdown than the backtest showed (a common calibration: 1.5× the historical one) and size your per-trade risk accordingly.",
            },
            diagram: "m9-equity-curve",
            warning: {
              ro: "Un PF spectaculos pe 30 de tranzacții nu înseamnă nimic — la eșantioane mici, varianța produce monștri frumoși. Cere-i oricărei statistici două lucruri înainte să o crezi: eșantion (100+) și diversitate de regimuri de piață.",
              en: "A spectacular PF over 30 trades means nothing — on small samples, variance produces beautiful monsters. Demand two things from any statistic before believing it: sample size (100+) and diversity of market regimes.",
            },
          },
        ],
      },
      {
        id: "de-la-demo-la-finantare",
        title: { ro: "De la demo la cont finanțat", en: "From demo to funded account" },
        minutes: 11,
        sections: [
          {
            heading: { ro: "Traseul: demo → live mic → finanțare", en: "The path: demo → small live → funding" },
            body: {
              ro: "Drumul sănătos spre un cont serios are trei etape, fiecare cu un SCOP diferit:\n\n- **Demo** — validezi MECANICA: regulile sistemului, execuția, jurnalizarea. Banii sunt fictivi, deci emoțiile lipsesc — exact de aceea demo-ul nu dovedește nimic despre psihologia ta.\n- **Live mic** — validezi OMUL. Chiar și cu 200-500 $, durerea unei pierderi reale este reală. Aici afli dacă respecți stopul atunci când doare.\n- **Finanțare (prop firm)** — scalezi. După ce ai un expectancy pozitiv dovedit pe live mic, capitalul firmelor de finanțare îți amplifică avantajul fără să-ți riști economiile.\n\nSaltul direct din demo în challenge-uri de finanțare este cea mai frecventă scurtătură — și cel mai frecvent mod de a dona taxe de participare.",
              en: "The healthy road to a serious account has three stages, each with a different PURPOSE:\n\n- **Demo** — you validate the MECHANICS: the system's rules, execution, journaling. The money is fictional, so the emotions are absent — which is exactly why demo proves nothing about your psychology.\n- **Small live** — you validate the HUMAN. Even with $200-500, the pain of a real loss is real. This is where you find out whether you honor your stop when it hurts.\n- **Funding (prop firm)** — you scale. Once you have positive expectancy proven on small live, prop-firm capital amplifies your edge without risking your savings.\n\nJumping straight from demo into funding challenges is the most common shortcut — and the most common way of donating participation fees.",
            },
          },
          {
            heading: { ro: "Criterii de absolvire, nu impresii", en: "Graduation criteria, not impressions" },
            body: {
              ro: "Treci de la o etapă la alta pe bază de CRITERII măsurabile, decise dinainte:\n\n- **Demo → live mic**: minimum 50-100 de tranzacții pe sistemul final, expectancy pozitiv, reguli respectate în peste 90% din intrări (jurnalul nu minte).\n- **Live mic → challenge**: minimum 2-3 luni consecutive pe plus, drawdown ținut sub limita pe care ți-o va impune firma de finanțare și dovada, negru pe alb, că îți respecți limita zilnică de pierdere.\n\nObservă că al doilea set de criterii nu cere profituri spectaculoase — cere CONTROL. Firmele de finanțare nu caută lunetiști de elită; caută oameni care nu aruncă în aer contul.",
              en: "You move from one stage to the next based on measurable CRITERIA, decided in advance:\n\n- **Demo → small live**: at least 50-100 trades on the final system, positive expectancy, rules followed on more than 90% of entries (the journal doesn't lie).\n- **Small live → challenge**: at least 2-3 consecutive positive months, drawdown kept under the limit your funding firm will impose, and black-on-white proof that you respect your daily loss limit.\n\nNotice that the second set of criteria doesn't demand spectacular profits — it demands CONTROL. Funding firms aren't looking for elite snipers; they're looking for people who don't blow up the account.",
            },
          },
          {
            heading: { ro: "Regulile prop: de ce pică majoritatea", en: "Prop rules: why most candidates fail" },
            body: {
              ro: "Un challenge tipic: atinge o țintă de profit de 8-10% respectând două limite dure:\n\n- **Daily drawdown ~5%** — dacă pierzi 5% din cont într-o singură zi, ai picat. Definitiv.\n- **Max drawdown ~10%** — dacă equity-ul scade cu 10% față de start (sau față de vârf, la unele firme), ai picat.\n\nFă calculul pe un cont de 100.000 $: limita zilnică este 5.000 $. Dacă riști 1% (1.000 $) per tranzacție, 5 stopuri consecutive într-o zi te elimină — iar seriile de 5 pierderi sunt, cum ai văzut în lecția de statistici, normale pentru orice sistem. De aceea traderii de prop serioși riscă 0,25-0,5% per tranzacție și își impun maximum 2-3 tranzacții pe zi: la 0,5% (500 $), ți-ar trebui 10 stopuri într-o singură zi ca să pici — practic imposibil dacă te oprești după 2-3.\n\nÎnțelege și modelul de business: taxele celor care pică finanțează plățile celor care trec. Firma nu este inamicul tău, dar matematica ei pariază pe nerăbdarea ta. Arma ta este să fii plictisitor: risc mic, puține tranzacții, zile verzi mărunte.",
              en: "A typical challenge: hit a profit target of 8-10% while respecting two hard limits:\n\n- **Daily drawdown ~5%** — lose 5% of the account in a single day and you've failed. Permanently.\n- **Max drawdown ~10%** — if equity drops 10% from the start (or from the peak, at some firms), you've failed.\n\nDo the math on a $100,000 account: the daily limit is $5,000. Risking 1% ($1,000) per trade, 5 consecutive stops in one day eliminates you — and 5-loss streaks are, as you saw in the statistics lesson, normal for any system. That's why serious prop traders risk 0.25-0.5% per trade and cap themselves at 2-3 trades per day: at 0.5% ($500), you'd need 10 stops in a single day to fail — practically impossible if you stop after 2-3.\n\nUnderstand the business model too: the fees of those who fail fund the payouts of those who pass. The firm isn't your enemy, but its math bets on your impatience. Your weapon is being boring: small risk, few trades, modest green days.",
            },
          },
          {
            heading: { ro: "Monitorizarea în TradeGx", en: "Monitoring in TradeGx" },
            body: {
              ro: "Regulile prop se încalcă rar din neștiință — se încalcă din pierderea evidenței în focul zilei. Exact pentru asta există pagina **Obiective** din TradeGx: un monitor dedicat conturilor de finanțare, în care îți setezi limitele challenge-ului (daily drawdown, max drawdown, ținta de profit), iar platforma îți urmărește progresul și îți trimite **alerte automate de risc** când te apropii de limite.\n\nConfigurarea corectă: pune-ți alertele mai STRÂNS decât regulile firmei — alertă la 3% pierdere zilnică pentru o limită de 5%, stop personal la 4%. Vrei să afli că ești aproape de margine cât încă mai poți alege, nu după.",
              en: "Prop rules are rarely broken out of ignorance — they're broken by losing track in the heat of the day. That's exactly what the **Obiective (Goals)** page in TradeGx is for: a dedicated prop-firm monitor where you set your challenge limits (daily drawdown, max drawdown, profit target), and the platform tracks your progress and sends **automatic risk alerts** as you approach the limits.\n\nThe correct configuration: set your alerts TIGHTER than the firm's rules — an alert at 3% daily loss for a 5% limit, a personal stop at 4%. You want to learn you're near the edge while you can still choose, not after.",
            },
            tip: {
              ro: "Tratează fiecare zi de challenge ca pe o zi normală de sistem, nu ca pe o finală de campionat. Cei care pică forțează ținta în prima săptămână; cei care trec o ating „din greșeală\", executându-și sistemul plictisitor încă o zi, și încă una.",
              en: "Treat every challenge day as a normal system day, not as a championship final. Those who fail force the target in the first week; those who pass hit it 'by accident', executing their boring system one more day, and then one more.",
            },
            warning: {
              ro: "Ai picat un challenge? NU cumpăra imediat următorul ca să „te revanșezi\" — este echivalentul revenge trading-ului, plătit cash. Întoarce-te în jurnal, găsește regula încălcată (aproape întotdeauna există una), repar-o pe live mic și abia apoi replătește taxa. Challenge-urile nu se trec prin insistență, ci prin proces.",
              en: "Failed a challenge? Do NOT buy the next one immediately to 'get even' — that's revenge trading, paid for in cash. Go back to your journal, find the rule you broke (there almost always is one), fix it on small live, and only then pay the fee again. Challenges aren't passed through insistence, but through process.",
            },
          },
        ],
      },
    ],
  },
  diagrams: {
    "m9-archetypes": {
      candles: [
        { o: 44, h: 50, l: 42, c: 48 },
        { o: 48, h: 52, l: 46, c: 50 },
        { o: 50, h: 52, l: 44, c: 46 },
        { o: 46, h: 48, l: 40, c: 42 },
        { o: 42, h: 46, l: 40, c: 44 },
        { o: 44, h: 50, l: 42, c: 48 },
        { o: 48, h: 52, l: 46, c: 50 },
        { o: 50, h: 52, l: 44, c: 46 },
        { o: 46, h: 48, l: 40, c: 42 },
        { o: 42, h: 50, l: 40, c: 48 },
        { o: 48, h: 58, l: 46, c: 56 },
        { o: 56, h: 58, l: 50, c: 52 },
        { o: 52, h: 62, l: 51, c: 60 },
        { o: 60, h: 68, l: 58, c: 66 },
      ],
      levels: [
        { y: 52, label: "Range high", color: "#71717a", dashed: true },
        { y: 40, label: "Range low", color: "#71717a", dashed: true },
      ],
      arrows: [
        { x: 4, y: 36, dir: "up", color: "#10b981", label: "MR buy" },
        { x: 6, y: 56, dir: "down", color: "#f43f5e", label: "MR sell" },
        { x: 11, y: 46, dir: "up", color: "#818cf8", label: "TF buy" },
      ],
      caption: {
        ro: "Aceeași secvență, două logici: mean reversion (MR) cumpără la baza range-ului și vinde la vârf cât timp range-ul ține; trend following (TF) așteaptă ruperea și cumpără retestul nivelului spart.",
        en: "Same sequence, two logics: mean reversion (MR) buys the bottom of the range and sells the top while the range holds; trend following (TF) waits for the break and buys the retest of the broken level.",
      },
    },
    "m9-overfitting": {
      candles: [
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
      ],
      line: [20, 26, 31, 37, 42, 49, 55, 61, 66, 72, 70, 64, 58, 54, 50, 47],
      zones: [
        { y1: 8, y2: 92, x1: 0, x2: 9.5, color: "#10b981", label: "In-sample" },
        { y1: 8, y2: 92, x1: 9.5, x2: 15, color: "#f43f5e", label: "Out-of-sample" },
      ],
      caption: {
        ro: "Semnătura overfitting-ului: equity curve impecabilă pe datele pe care sistemul a fost calibrat (in-sample) și prăbușire pe datele nevăzute (out-of-sample).",
        en: "The signature of overfitting: a flawless equity curve on the data the system was calibrated on (in-sample) and a collapse on unseen data (out-of-sample).",
      },
    },
    "m9-equity-curve": {
      candles: [
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
      ],
      line: [15, 19, 17, 24, 28, 26, 34, 40, 37, 48, 42, 34, 30, 39, 50, 62],
      levels: [
        { y: 48, label: "Peak", color: "#10b981", dashed: true },
        { y: 30, label: "Max Drawdown", color: "#f43f5e", dashed: true },
      ],
      zones: [{ y1: 30, y2: 48, x1: 9, x2: 12.6, color: "#f43f5e", label: "DD" }],
      caption: {
        ro: "Equity curve-ul unui sistem sănătos nu urcă în linie dreaptă: max drawdown-ul este distanța de la vârf (Peak) până la minimul care îi urmează — statistica ta de supraviețuire.",
        en: "A healthy system's equity curve doesn't rise in a straight line: max drawdown is the distance from the peak to the trough that follows it — your survival statistic.",
      },
    },
  },
};
