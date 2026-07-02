import type { ModuleBundle } from "../types";

// ── M8: Psihologia Tradingului (Avansat) ─────────────────────────────────────

export const M8_BUNDLE: ModuleBundle = {
  module: {
    id: "psihologia-tradingului",
    level: "ADVANCED",
    icon: "heart",
    title: { ro: "Psihologia Tradingului", en: "Trading Psychology" },
    description: {
      ro: "Ai strategie, ai risk management — și totuși contul suferă. Ultimul adversar ești tu: frică, lăcomie, revenge trading, biasuri cognitive. Acest modul îți dă protocoale concrete, nu motivație goală.",
      en: "You have a strategy, you have risk management — and the account still suffers. The last opponent is you: fear, greed, revenge trading, cognitive biases. This module gives you concrete protocols, not empty motivation.",
    },
    lessons: [
      {
        id: "inamicul-din-oglinda",
        title: { ro: "Adevăratul inamic e în oglindă", en: "The real enemy is in the mirror" },
        minutes: 8,
        sections: [
          {
            body: {
              ro: "Iată un experiment repetat de nenumărate ori: dai aceluiași grup de traderi un sistem DOVEDIT profitabil, cu reguli clare de intrare, ieșire și sizing. După câteva luni, o parte au profit, o parte sunt pe zero, iar mulți au pierdut bani. Același sistem, aceleași piețe — singura variabilă a fost omul care apasă butonul.\n\nAsta e lecția centrală a acestui modul: după un anumit nivel, tradingul nu mai e o problemă de cunoștințe, ci una de **execuție sub presiune emoțională**. Sistemul spune „așteaptă confirmarea” — tu intri mai devreme. Sistemul spune „SL rămâne acolo” — tu îl muți. Fiecare abatere pare mică; suma lor transformă un sistem câștigător într-un cont care sângerează.",
              en: "Here's an experiment repeated countless times: give the same group of traders a PROVEN profitable system, with clear entry, exit and sizing rules. A few months later, some are in profit, some are flat, and many have lost money. Same system, same markets — the only variable was the human pressing the button.\n\nThat's the central lesson of this module: past a certain level, trading is no longer a knowledge problem but a problem of **execution under emotional pressure**. The system says 'wait for confirmation' — you enter early. The system says 'the SL stays there' — you move it. Each deviation seems small; their sum turns a winning system into a bleeding account.",
            },
          },
          {
            heading: { ro: "Cele 4 emoții și erorile lor exacte", en: "The 4 emotions and their exact errors" },
            body: {
              ro: "Fiecare emoție de bază produce erori de trading SPECIFICE. Învață să le recunoști după fapte, nu după stări:\n\n- **Frica** → ieși din poziții câștigătoare mult înainte de TP („să nu se întoarcă”); nu iei setup-ul valid după 2 pierderi; strângi SL-ul atât de aproape încât zgomotul normal te scoate.\n- **Lăcomia** → mărești lotul după câteva câștiguri; muți TP-ul tot mai departe până când profitul dispare; adaugi poziții peste poziții în același trend, până când o corecție normală le șterge pe toate.\n- **Speranța** → ții pierderea „că sigur revine”; muți SL-ul mai jos; faci average down la o poziție care țipă că ideea a fost invalidată.\n- **FOMO** → intri pe lumânarea care deja a fugit, fără setup, doar pentru că „toată lumea câștigă”; cumperi maximele pentru că graficul arată „că explodează”.\n\nObservă tiparul: frica te scoate prea devreme din tranzacțiile BUNE, iar speranța te ține prea mult în cele RELE — exact invers decât cere matematica expectancy-ului.",
              en: "Each basic emotion produces SPECIFIC trading errors. Learn to recognize them by actions, not feelings:\n\n- **Fear** → you exit winning positions long before TP ('before it reverses'); you skip the valid setup after 2 losses; you tighten the SL so much that normal noise takes you out.\n- **Greed** → you increase the lot after a few wins; you keep pushing the TP further until the profit evaporates; you stack position on position in the same trend until a normal pullback erases them all.\n- **Hope** → you hold the loser because 'it will surely come back'; you move the SL lower; you average down on a position that's screaming the idea was invalidated.\n- **FOMO** → you enter on the candle that already ran, without a setup, just because 'everyone is winning'; you buy the highs because the chart looks 'ready to explode'.\n\nNotice the pattern: fear takes you out of GOOD trades too early, and hope keeps you in BAD ones too long — exactly the opposite of what expectancy math requires.",
            },
          },
          {
            heading: { ro: "Biasurile cognitive: erori de fabrică", en: "Cognitive biases: factory defects" },
            body: {
              ro: "Creierul tău vine cu scurtături de gândire care în trading costă bani. Cele trei mari:\n\n- **Loss aversion (aversiunea la pierdere)** — cercetările lui Kahneman și Tversky arată că o pierdere doare aproximativ de două ori mai tare decât bucură un câștig egal. De aceea închizi câștigurile la +0.5R „ca să fie sigure”, dar ții pierderile pe −2R „ca să nu le realizezi”. Rezultatul: câștiguri mici, pierderi mari — expectancy negativ garantat.\n- **Sunk cost (costul irecuperabil)** — „am investit deja atât în poziția asta, nu pot renunța acum”. Banii pierduți sunt pierduți; singura întrebare validă e „aș deschide această poziție ACUM, la acest preț?”. Dacă nu, de ce o mai ții?\n- **Recency bias (biasul recenței)** — ultimele 3 tranzacții îți colorează judecata mai puternic decât ultimele 100. Trei câștiguri la rând → te crezi invincibil și dublezi lotul. Trei pierderi → „sistemul nu mai merge” și îl abandonezi exact înainte de seria bună.\n\nNu poți dezinstala aceste biasuri — sunt hardware. Poți doar construi reguli EXTERNE care le blochează efectele: sizing fix, SL nemutabil, jurnal.",
              en: "Your brain ships with thinking shortcuts that cost money in trading. The big three:\n\n- **Loss aversion** — Kahneman and Tversky's research shows a loss hurts roughly twice as much as an equal gain pleases. That's why you close winners at +0.5R 'to make them safe' but hold losers to −2R 'to avoid realizing them'. The result: small wins, big losses — guaranteed negative expectancy.\n- **Sunk cost** — 'I've already put so much into this position, I can't quit now'. Lost money is lost; the only valid question is 'would I open this position NOW, at this price?'. If not, why are you still holding it?\n- **Recency bias** — your last 3 trades color your judgment more than your last 100. Three wins in a row → you feel invincible and double the lot. Three losses → 'the system stopped working' and you abandon it right before the good streak.\n\nYou can't uninstall these biases — they're hardware. You can only build EXTERNAL rules that block their effects: fixed sizing, an immovable SL, a journal.",
            },
            tip: {
              ro: "Test rapid anti-sunk-cost, la orice poziție pe minus: „dacă aș fi flat acum, aș intra în acest trade, la acest preț, cu acest SL?”. Dacă răspunsul e nu, închide. Poziția nu știe și nu-i pasă că tu ai „investit” în ea.",
              en: "Quick anti-sunk-cost test for any losing position: 'if I were flat right now, would I enter this trade, at this price, with this SL?'. If the answer is no, close it. The position doesn't know or care that you've 'invested' in it.",
            },
            warning: {
              ro: "Scopul nu e să devii un robot fără emoții — e imposibil și inutil. Scopul e ca emoțiile să nu mai aibă acces la butoane: deciziile se iau ÎNAINTE (plan, sizing, SL, TP), execuția doar le respectă.",
              en: "The goal is not to become an emotionless robot — that's impossible and unnecessary. The goal is for emotions to lose access to the buttons: decisions are made IN ADVANCE (plan, sizing, SL, TP), execution merely follows them.",
            },
          },
        ],
      },
      {
        id: "revenge-trading-overtrading",
        title: { ro: "Revenge trading și overtrading", en: "Revenge trading and overtrading" },
        minutes: 9,
        sections: [
          {
            heading: { ro: "Spirala: pierdere → furie → poziție mai mare", en: "The spiral: loss → anger → bigger position" },
            body: {
              ro: "**Revenge trading** e cel mai scump tipar comportamental din trading, iar mecanismul lui e mereu același:\n\n- **Pasul 1** — iei o pierdere normală, statistică. Sistemul e ok, dar creierul o înregistrează ca pe o NEDREPTATE.\n- **Pasul 2** — apare nevoia de a „recupera ACUM”. Nu de a tranzacționa bine — de a recupera. Piața a devenit un adversar personal.\n- **Pasul 3** — intri fără setup, pe primul impuls, cu lot mărit „ca să scot pierderea dintr-o mișcare”.\n- **Pasul 4** — noua pierdere e mai mare. Furia crește, lotul crește, criteriile dispar complet.\n- **Pasul 5** — într-o oră ai făcut 8 tranzacții și ai pierdut cât într-o lună proastă. Uneori, tot contul.\n\nPartea perfidă: spirala pornește de la o tranzacție PERFECT normală. Nu pierderea e problema — reacția la ea e. **Overtrading-ul** e vărul ei tăcut: prea multe tranzacții fără criterii, din plictiseală sau dependență de adrenalină, în care costurile și setup-urile mediocre macină contul lent, dar sigur.",
              en: "**Revenge trading** is the most expensive behavioral pattern in trading, and its mechanism is always the same:\n\n- **Step 1** — you take a normal, statistical loss. The system is fine, but your brain registers it as an INJUSTICE.\n- **Step 2** — the urge to 'make it back NOW' appears. Not to trade well — to make it back. The market has become a personal opponent.\n- **Step 3** — you enter without a setup, on the first impulse, with a bigger lot 'to recover it in one move'.\n- **Step 4** — the new loss is bigger. The anger grows, the lot grows, the criteria vanish completely.\n- **Step 5** — within an hour you've placed 8 trades and lost a bad month's worth. Sometimes the whole account.\n\nThe insidious part: the spiral starts from a PERFECTLY normal trade. The loss isn't the problem — the reaction to it is. **Overtrading** is its quiet cousin: too many trades without criteria, out of boredom or adrenaline addiction, where costs and mediocre setups grind the account down slowly but surely.",
            },
            diagram: "m8-equity-tilt",
          },
          {
            heading: { ro: "Semnele fizice: corpul știe înaintea ta", en: "The physical signs: your body knows first" },
            body: {
              ro: "Tilt-ul nu anunță prin gânduri — gândurile par perfect raționale din interior („trebuie doar să recuperez”). Corpul, în schimb, nu minte. Semnele de recunoscut:\n\n- pulsul crescut, respirația scurtă, căldura în față imediat după o pierdere;\n- maxilarul încleștat, umerii ridicați, bătutul nervos în birou;\n- refresh compulsiv la grafic la fiecare câteva secunde;\n- graba fizică: click-uri rapide, lotul introdus fără calcul, ordinele puse din reflex;\n- dialog interior de tip „nu se poate așa ceva”, „acum ori niciodată”, „piața asta e manipulată”.\n\nAcestea nu sunt detalii — sunt un sistem de alarmă timpurie. Fiecare trader are 2–3 semne personale dominante. Identifică-le pe ale tale din ultimele episoade de tilt și scrie-le în jurnal: data viitoare le vei recunoaște ÎN timpul evenimentului, nu după.",
              en: "Tilt doesn't announce itself through thoughts — from the inside, the thoughts seem perfectly rational ('I just need to make it back'). The body, however, doesn't lie. Signs to recognize:\n\n- elevated pulse, short breathing, heat in your face right after a loss;\n- clenched jaw, raised shoulders, nervous desk-tapping;\n- compulsively refreshing the chart every few seconds;\n- physical haste: rapid clicks, a lot size typed without calculation, orders placed on reflex;\n- inner dialogue like 'this can't be happening', 'now or never', 'this market is rigged'.\n\nThese aren't details — they're an early-warning system. Every trader has 2–3 dominant personal signs. Identify yours from your last tilt episodes and write them in your journal: next time you'll recognize them DURING the event, not after.",
            },
          },
          {
            heading: { ro: "Protocolul STOP după 2 pierderi consecutive", en: "The STOP protocol after 2 consecutive losses" },
            body: {
              ro: "Regula e simplă și nenegociabilă: **după 2 pierderi consecutive în aceeași zi, te oprești**. Nu „mai încerc una mică” — te oprești. Protocolul complet:\n\n- **S — Stai.** Închide platforma. Nu graficul minimizat — platforma închisă.\n- **T — Timp.** Minimum 30 de minute departe de ecran. Mișcare fizică: mers, apă, aer. Adrenalina are nevoie de timp fiziologic ca să se metabolizeze.\n- **O — Observă.** Notează în jurnal, la cald: ce s-a întâmplat, ce simți, ce impuls ai. Scrisul mută activitatea din creierul reactiv în cel analitic.\n- **P — Planifică.** Revii DOAR cu un plan scris pentru următorul setup valid. Dacă limita zilnică e aproape, ziua s-a terminat — mâine e o zi nouă.\n\nDe ce după 2, nu după 3 sau 5? Pentru că datele arată că a treia tranzacție de după două pierderi e cel mai des cea impulsivă — spiralele se blochează la intrare, nu la mijloc. Două pierderi consecutive sunt complet normale statistic; reacția ta la ele decide dacă rămân o statistică sau devin o gaură în cont.",
              en: "The rule is simple and non-negotiable: **after 2 consecutive losses in the same day, you stop**. Not 'one more small try' — you stop. The full protocol:\n\n- **S — Stop.** Close the platform. Not a minimized chart — the platform closed.\n- **T — Time.** Minimum 30 minutes away from the screen. Physical movement: a walk, water, air. Adrenaline needs physiological time to metabolize.\n- **O — Observe.** Write in your journal, while it's fresh: what happened, what you feel, what impulse you have. Writing shifts activity from the reactive brain to the analytical one.\n- **P — Plan.** You come back ONLY with a written plan for the next valid setup. If the daily limit is close, the day is over — tomorrow is a new day.\n\nWhy after 2 and not 3 or 5? Because the data shows the third trade after two losses is most often the impulsive one — spirals are blocked at the entrance, not in the middle. Two consecutive losses are statistically completely normal; your reaction to them decides whether they stay a statistic or become a hole in the account.",
            },
            tip: {
              ro: "Fă protocolul STOP fizic, nu mental: un post-it pe monitor cu „2 pierderi = STOP 30 min”. În mijlocul tilt-ului nu te poți baza pe memorie sau voință — doar pe obiecte și reguli exterioare ție.",
              en: "Make the STOP protocol physical, not mental: a sticky note on your monitor saying '2 losses = STOP 30 min'. In the middle of tilt you can't rely on memory or willpower — only on objects and rules external to you.",
            },
          },
          {
            heading: { ro: "Cealaltă curbă: cum arată disciplina", en: "The other curve: what discipline looks like" },
            body: {
              ro: "Pune cele două curbe una lângă alta. Curba tilt-ului urcă frumos săptămâni întregi, apoi moare într-o singură după-amiază. Curba disciplinei arată aproape plictisitor: creștere moderată, pierderi mici, absorbite, niciun episod dramatic.\n\nExact acesta e secretul pe care începătorii nu-l cred: **traderii profitabili sunt plictisitori**. Aceleași ore, aceleași setup-uri, același risc de 1%, aceleași pauze după pierderi. Drama de pe curba de equity e întotdeauna semnul unei probleme de psihologie, nu de strategie.\n\nȘi aici TradeGx îți ține spatele: aplicația **detectează automat revenge trading-ul** (tranzacții impulsive imediat după pierderi, cu risc mărit) și **overtrading-ul** (număr anormal de tranzacții pe zi) din datele jurnalului tău și îți trimite alerte în aplicație și pe Telegram. Activează-le din setările contului — sunt exact plasa de siguranță de care ai nevoie în ziua în care protocolul STOP e greu de respectat singur.",
              en: "Put the two curves side by side. The tilt curve climbs nicely for weeks, then dies in a single afternoon. The discipline curve looks almost boring: moderate growth, small absorbed losses, no dramatic episodes.\n\nThat's exactly the secret beginners refuse to believe: **profitable traders are boring**. Same hours, same setups, same 1% risk, same pauses after losses. Drama on an equity curve is always the sign of a psychology problem, not a strategy problem.\n\nAnd here TradeGx has your back: the app **automatically detects revenge trading** (impulsive trades right after losses, with increased risk) and **overtrading** (an abnormal number of trades per day) from your journal data, and sends you alerts in-app and on Telegram. Enable them in your account settings — they're exactly the safety net you need on the day the STOP protocol is hard to follow alone.",
            },
            diagram: "m8-equity-discipline",
            warning: {
              ro: "Cel mai periculos moment nu e după o pierdere — e după o pierdere pe care „nu o meriți”: SL atins cu un pip înainte de mișcarea ta, știre neașteptată, slippage. Sentimentul de nedreptate e combustibilul numărul 1 al revenge trading-ului. Piața nu-ți datorează nimic și nu ține scorul.",
              en: "The most dangerous moment isn't after a loss — it's after a loss you 'didn't deserve': SL hit by one pip before your move, an unexpected news spike, slippage. The feeling of injustice is revenge trading's number-one fuel. The market owes you nothing and keeps no score.",
            },
          },
        ],
      },
      {
        id: "disciplina-si-rutina",
        title: { ro: "Disciplină și rutină: structura care te ține întreg", en: "Discipline and routine: the structure that holds you together" },
        minutes: 8,
        sections: [
          {
            heading: { ro: "Rutina pre-market", en: "The pre-market routine" },
            body: {
              ro: "Disciplina nu e o trăsătură de caracter — e un sistem de obiceiuri. Traderii care „au disciplină” au, de fapt, o rutină care face decizia corectă automată. Rutina pre-market, 15–20 de minute înainte de sesiune:\n\n- **Calendarul economic** — ce știri majore sunt azi (NFP? CPI? FOMC?) și la ce oră; în jurul lor nu tranzacționezi.\n- **Contextul higher-timeframe** — unde e prețul pe D1/H4 față de nivelurile cheie? Trend sau range?\n- **Scenariile zilei** — maximum 2–3: „dacă prețul ajunge în zona X și dă confirmare, intru long spre Y”. Scrise, nu ținute în cap.\n- **Starea proprie** — somn, energie, dispoziție. Nota sub 7 din 10? Redu riscul la jumătate sau nu tranzacționa deloc.\n\nScopul rutinei e să iei toate deciziile importante ÎNAINTE ca banii să fie în joc, când ești încă obiectiv.",
              en: "Discipline isn't a character trait — it's a system of habits. Traders who 'have discipline' actually have a routine that makes the right decision automatic. The pre-market routine, 15–20 minutes before the session:\n\n- **Economic calendar** — what major news is out today (NFP? CPI? FOMC?) and at what time; you don't trade around it.\n- **Higher-timeframe context** — where is price on D1/H4 relative to key levels? Trend or range?\n- **The day's scenarios** — 2–3 at most: 'if price reaches zone X and confirms, I go long toward Y'. Written down, not kept in your head.\n- **Your own state** — sleep, energy, mood. Below 7 out of 10? Halve your risk or don't trade at all.\n\nThe routine's purpose is to make all important decisions BEFORE money is at stake, while you're still objective.",
            },
          },
          {
            heading: { ro: "Checklist-ul pre-trade", en: "The pre-trade checklist" },
            body: {
              ro: "Piloții cu mii de ore de zbor trec prin checklist la FIECARE decolare — nu pentru că nu știu procedura, ci pentru că știu că memoria și atenția cedează sub presiune. În trading, presiunea e permanentă.\n\nUn checklist pre-trade bun are 5–8 întrebări binare, de exemplu:\n\n- Setup-ul respectă TOATE criteriile strategiei mele?\n- Sunt aliniat cu trendul de pe timeframe-ul superior?\n- R:R ≥ 1:2 față de un TP realist?\n- Lotul e calculat cu formula, pentru riscul de 1%?\n- Există știri majore în următoarea oră?\n- Sunt calm, sau simt graba/frustrarea în corp?\n\nO singură bifă lipsă = nu există tranzacție. Pagina **Checklist din TradeGx** există exact pentru asta: îți definești lista o singură dată și o parcurgi la fiecare intrare — iar în timp vezi în statistici cum arată tranzacțiile luate cu checklist complet față de cele luate „din ochi”.",
              en: "Pilots with thousands of flight hours run the checklist on EVERY takeoff — not because they don't know the procedure, but because they know memory and attention fail under pressure. In trading, the pressure is permanent.\n\nA good pre-trade checklist has 5–8 binary questions, for example:\n\n- Does the setup meet ALL my strategy's criteria?\n- Am I aligned with the higher-timeframe trend?\n- Is R:R ≥ 1:2 against a realistic TP?\n- Is the lot calculated with the formula, for 1% risk?\n- Is there major news in the next hour?\n- Am I calm, or do I feel haste/frustration in my body?\n\nOne missing checkmark = no trade. The **TradeGx Checklist page** exists exactly for this: define your list once and run through it on every entry — and over time your stats show how trades taken with a complete checklist compare with the ones taken 'by eye'.",
            },
            tip: {
              ro: "Adaugă în checklist și o întrebare despre TINE, nu doar despre piață — „sunt în starea potrivită pentru acest trade?”. Cele mai scumpe tranzacții trec toate filtrele tehnice și pică pe singurul filtru uman.",
              en: "Include a question about YOU in the checklist, not just about the market — 'am I in the right state for this trade?'. The most expensive trades pass every technical filter and fail on the single human one.",
            },
          },
          {
            heading: { ro: "Disciplina orelor de trading", en: "Trading-hours discipline" },
            body: {
              ro: "Piața e deschisă aproape non-stop; TU nu trebuie să fii. Traderii care „vânează” toată ziua sfârșesc în overtrading, pentru că după ore de ecran orice mișcare începe să semene cu un setup.\n\n- Alege-ți **fereastra fixă** în care strategia ta performează (ex. deschiderea Londrei, 10:00–13:00, sau suprapunerea Londra–NY, 15:00–18:00) și tranzacționează DOAR atunci.\n- În afara ferestrei: analiză, backtesting, jurnal — dar nu execuție.\n- Setup-ul apărut la ora 23:40? Piața oferă setup-uri în fiecare zi. Cel pe care îl „ratezi” dormind nu e o pierdere — e costul unui sistem sustenabil.\n\nOrarul fix are un beneficiu ascuns: transformă tradingul dintr-o stare permanentă de alertă într-o meserie cu program, iar creierul tău are nevoie de această graniță ca să se recupereze.",
              en: "The market is open almost non-stop; YOU don't have to be. Traders who 'hunt' all day end up overtrading, because after hours of screen time every move starts to look like a setup.\n\n- Pick the **fixed window** where your strategy performs (e.g. the London open, or the London–NY overlap) and trade ONLY then.\n- Outside the window: analysis, backtesting, journaling — but no execution.\n- A setup showing up at 11:40 pm? The market offers setups every single day. The one you 'miss' while sleeping isn't a loss — it's the cost of a sustainable system.\n\nA fixed schedule has a hidden benefit: it turns trading from a permanent state of alert into a job with working hours, and your brain needs that boundary to recover.",
            },
          },
          {
            heading: { ro: "Când NU tranzacționezi", en: "When NOT to trade" },
            body: {
              ro: "La fel de importantă ca lista de setup-uri e lista zilelor în care NU ai voie să te apropii de platformă:\n\n- **Obosit** — după o noapte proastă, controlul impulsurilor scade măsurabil; exact funcția de care depinde tot ce ai învățat aici.\n- **Furios sau stresat** — ceartă, probleme la job, anxietate financiară: creierul caută descărcare, iar piața devine sala lui de box.\n- **Bolnav** — concentrarea fragmentată face erori de execuție banale: lot greșit, buy în loc de sell.\n- **După un câștig mare** — surprinzător pentru mulți: euforia e la fel de periculoasă ca tilt-ul. Te simți invincibil, „joci cu banii casei”, lotul crește, criteriile se relaxează. Ziua de după cel mai bun trade al lunii e statistic una dintre cele mai riscante.\n\nO zi fără trading nu costă nimic. O zi de trading în starea greșită poate costa luna întreagă.",
              en: "Just as important as your setup list is the list of days you're NOT allowed near the platform:\n\n- **Tired** — after a bad night, impulse control measurably drops; exactly the function everything you've learned here depends on.\n- **Angry or stressed** — an argument, job problems, financial anxiety: the brain seeks discharge, and the market becomes its boxing ring.\n- **Sick** — fragmented focus makes trivial execution errors: wrong lot, buy instead of sell.\n- **After a big win** — surprising to many: euphoria is just as dangerous as tilt. You feel invincible, you're 'playing with house money', the lot grows, the criteria loosen. The day after your best trade of the month is statistically one of the riskiest.\n\nA day without trading costs nothing. A day of trading in the wrong state can cost the whole month.",
            },
            warning: {
              ro: "Euforia e tilt cu semn schimbat. După cel mai bun trade al săptămânii, cele mai sigure două decizii sunt: risc înjumătățit la următoarea tranzacție sau ziua încheiată în profit. „Sunt în formă maximă, forțez” e aceeași abatere de la sistem ca revenge trading-ul — doar că se simte bine.",
              en: "Euphoria is tilt with the sign flipped. After the best trade of your week, the two safest decisions are: half risk on the next trade, or ending the day in profit. 'I'm on fire, let's push it' is the same deviation from the system as revenge trading — it just feels good.",
            },
          },
        ],
      },
      {
        id: "jurnalul-ca-oglinda",
        title: { ro: "Jurnalul: oglinda care nu minte", en: "The journal: the mirror that doesn't lie" },
        minutes: 8,
        sections: [
          {
            heading: { ro: "Ce notezi la fiecare tranzacție", en: "What to log on every trade" },
            body: {
              ro: "Memoria traderului e un martor corupt: reține câștigurile „geniale”, uită abaterile și rescrie povestea fiecărei pierderi. Jurnalul există ca să pună fapte în locul poveștilor. La fiecare tranzacție notezi:\n\n- **Datele tehnice** — instrument, direcție, intrare, SL, TP, lot, R:R planificat, rezultatul în R.\n- **Setup-ul** — ce strategie și ce criterii au justificat intrarea; tag-uri (ex. „breakout”, „retest”, „london-open”).\n- **Emoțiile** — starea DINAINTE de intrare (calm? grăbit? frustrat după pierderea anterioară?) și din timpul poziției.\n- **Screenshot-uri** — graficul la intrare și la ieșire, cu nivelurile marcate. Peste 3 luni, memoria va minți; poza nu.\n- **Abaterile de la reguli** — cea mai valoroasă rubrică: ai mutat SL-ul? Ai intrat fără confirmare? Lot mai mare decât calculat? Scrie EXACT ce regulă ai încălcat.\n\nRegula de aur: jurnalul se completează la CALD, imediat după închiderea poziției — nu seara, din memorie, când creierul a cosmetizat deja totul.",
              en: "A trader's memory is a corrupt witness: it keeps the 'genius' wins, forgets the violations and rewrites the story of every loss. The journal exists to put facts where the stories are. On every trade you log:\n\n- **The technical data** — instrument, direction, entry, SL, TP, lot, planned R:R, result in R.\n- **The setup** — which strategy and which criteria justified the entry; tags (e.g. 'breakout', 'retest', 'london-open').\n- **The emotions** — your state BEFORE entry (calm? rushed? frustrated after the previous loss?) and during the position.\n- **Screenshots** — the chart at entry and exit, with levels marked. Three months later, memory will lie; the picture won't.\n- **Rule violations** — the most valuable field: did you move the SL? Enter without confirmation? Trade a bigger lot than calculated? Write EXACTLY which rule you broke.\n\nThe golden rule: the journal is filled in HOT, right after the position closes — not in the evening, from memory, when the brain has already airbrushed everything.",
            },
          },
          {
            heading: { ro: "Ritualul săptămânal: găsește-ți SINGURA scurgere mare", en: "The weekly ritual: find your ONE biggest leak" },
            body: {
              ro: "Jurnalul necitit e doar arhivă. Valoarea apare la **review-ul săptămânal** — 30–45 de minute, în weekend, cu piața închisă:\n\n- Recitește toate tranzacțiile săptămânii, cu screenshot-uri.\n- Împarte-le în două categorii: **conform planului** vs **cu abateri** — și compară rezultatele celor două grupe. Aproape întotdeauna, diferența e șocantă.\n- Caută tipare: pierderile vin la aceleași ore? După același tip de emoție? Pe același instrument? După zile câștigătoare?\n- Alege **O SINGURĂ scurgere** — cea mai scumpă greșeală recurentă a săptămânii — și formulează o regulă concretă împotriva ei pentru săptămâna următoare.\n\nDe ce doar una? Pentru că „de luni mă schimb complet” eșuează întotdeauna. O singură corecție pe săptămână, aplicată real, înseamnă 52 de corecții pe an — mai mult decât suficient ca să transforme un trader mediocru într-unul consistent.",
              en: "An unread journal is just an archive. The value appears at the **weekly review** — 30–45 minutes, on the weekend, with markets closed:\n\n- Re-read the week's trades, screenshots included.\n- Split them into two categories: **per plan** vs **with violations** — and compare the results of the two groups. Almost always, the difference is shocking.\n- Hunt for patterns: do losses cluster at the same hours? After the same emotion? On the same instrument? After winning days?\n- Pick **ONE leak** — the week's most expensive recurring mistake — and write one concrete rule against it for next week.\n\nWhy only one? Because 'starting Monday I'll change everything' always fails. One correction per week, actually applied, means 52 corrections a year — more than enough to turn a mediocre trader into a consistent one.",
            },
            tip: {
              ro: "Pune-ți review-ul săptămânal în calendar ca pe o ședință de la care nu poți lipsi — aceeași zi, aceeași oră. Un review sărit devine două, apoi un jurnal mort. Ritualul contează mai mult decât perfecțiunea lui.",
              en: "Put the weekly review in your calendar like a meeting you can't skip — same day, same hour. One skipped review becomes two, then a dead journal. The ritual matters more than its perfection.",
            },
          },
          {
            heading: { ro: "TradeGx: jurnalul construit exact pentru asta", en: "TradeGx: the journal built exactly for this" },
            body: {
              ro: "Tot ce descrie această lecție există deja în aplicația în care te afli. Jurnalul TradeGx a fost construit exact în jurul acestui flux:\n\n- fiecare tranzacție are câmpuri pentru **emoții**, **tag-uri de setup**, note și **screenshot-uri**;\n- **Analytics** îți calculează automat statisticile pe care altfel le-ai săpa manual: win rate și expectancy pe setup, pe instrument, pe oră, pe zi a săptămânii, pe stare emoțională;\n- vezi negru pe alb întrebările care contează: „cât mă costă tranzacțiile luate din FOMO?”, „care setup are cel mai bun R mediu?”, „cum performez marțea față de vinerea?”;\n- alertele de comportament (revenge trading, overtrading) din lecția anterioară se hrănesc din același jurnal.\n\nUn jurnal pe hârtie e mai bun decât nimic. Dar un jurnal care își calculează singur statisticile transformă review-ul săptămânal din arheologie în diagnostic: deschizi Analytics, iar scurgerea săptămânii e deja vizibilă în cifre.",
              en: "Everything this lesson describes already exists in the app you're using. The TradeGx journal was built exactly around this flow:\n\n- every trade has fields for **emotions**, **setup tags**, notes and **screenshots**;\n- **Analytics** automatically computes the statistics you'd otherwise dig out by hand: win rate and expectancy per setup, per instrument, per hour, per weekday, per emotional state;\n- you see the questions that matter in black and white: 'how much do FOMO trades cost me?', 'which setup has the best average R?', 'how do I perform on Tuesdays vs Fridays?';\n- the behavioral alerts (revenge trading, overtrading) from the previous lesson feed on this same journal.\n\nA paper journal beats nothing. But a journal that computes its own statistics turns the weekly review from archaeology into diagnosis: you open Analytics and the week's leak is already visible in numbers.",
            },
            warning: {
              ro: "Jurnalul funcționează doar dacă e COMPLET. Tentația clasică: sari peste tranzacțiile rușinoase — exact cele din revenge sau FOMO. Dar acelea sunt lecțiile cele mai scumpe pe care le-ai plătit deja; nejurnalizarea lor înseamnă să pierzi banii ȘI lecția.",
              en: "The journal only works if it's COMPLETE. The classic temptation: skipping the shameful trades — exactly the revenge and FOMO ones. But those are the most expensive lessons you've already paid for; leaving them out means losing the money AND the lesson.",
            },
          },
        ],
      },
      {
        id: "schimbarea-identitatii",
        title: { ro: "Schimbarea de identitate: de la parior la operator", en: "The identity shift: from gambler to operator" },
        minutes: 9,
        sections: [
          {
            heading: { ro: "Obiective de proces vs obiective de rezultat", en: "Process goals vs outcome goals" },
            body: {
              ro: "„Vreau 2.000 $ pe lună din trading” pare un obiectiv sănătos. Nu este. E un **obiectiv de rezultat** — iar rezultatul pe termen scurt NU e sub controlul tău: piața decide când plătește, tu decizi doar cât de corect execuți.\n\nProblema obiectivelor de rezultat: pe 25 ale lunii ești sub țintă → forțezi tranzacții care nu există → obiectivul de profit tocmai ți-a stricat execuția. Ai atins ținta pe 15? Creierul spune „gata, nu mai risca” și sari setup-urile valide.\n\n**Obiectivele de proces** sunt cele 100% sub controlul tău:\n\n- „Execut doar setup-uri care trec checklist-ul complet.”\n- „Risc fix 1% pe fiecare tranzacție, fără excepții.”\n- „Fac protocolul STOP după 2 pierderi consecutive.”\n- „Completez jurnalul la fiecare tranzacție și fac review duminica.”\n\nParadoxul central al tradingului: profitul e maximizat exact atunci când NU e ținta directă. Banii sunt scorul, nu jocul.",
              en: "'I want $2,000 a month from trading' sounds like a healthy goal. It isn't. It's an **outcome goal** — and short-term outcomes are NOT under your control: the market decides when it pays, you only decide how correctly you execute.\n\nThe problem with outcome goals: it's the 25th and you're under target → you force trades that don't exist → the profit goal just ruined your execution. Hit the target on the 15th? The brain says 'done, stop risking' and you skip valid setups.\n\n**Process goals** are the ones 100% under your control:\n\n- 'I only execute setups that pass the complete checklist.'\n- 'I risk a fixed 1% per trade, no exceptions.'\n- 'I run the STOP protocol after 2 consecutive losses.'\n- 'I journal every trade and review on Sundays.'\n\nTrading's central paradox: profit is maximized exactly when it's NOT the direct target. Money is the score, not the game.",
            },
          },
          {
            heading: { ro: "Gândește în probabilități: un trade e zgomot", en: "Think in probabilities: one trade is noise" },
            body: {
              ro: "Imaginează-ți o monedă măsluită care cade pe partea ta în 55% din aruncări. Ai un avantaj real — dar la ORICE aruncare individuală poți pierde, iar seriile de 5 pierderi consecutive sunt garantate pe parcurs. Ar fi absurd să spui după o aruncare pierdută „moneda nu mai funcționează”.\n\nExact asta e o strategie cu expectancy pozitiv:\n\n- **O tranzacție** = zgomot pur. Rezultatul ei nu spune NIMIC despre calitatea deciziei tale.\n- **10 tranzacții** = tot zgomot, cu iluzii de tipar.\n- **100 de tranzacții** = abia aici avantajul devine vizibil și statistica începe să aibă sens.\n\nConsecința practică e eliberatoare: o tranzacție PIERZĂTOARE poate fi o decizie EXCELENTĂ (setup valid, sizing corect, execuție perfectă — partea de 45% s-a întâmplat), iar una câștigătoare poate fi o decizie GROAZNICĂ (fără setup, lot dublu — noroc). Judecă-te după calitatea deciziei, nu după rezultatul unei singure aruncări.",
              en: "Imagine a rigged coin that lands your way 55% of the time. You have a real edge — yet on ANY individual flip you can lose, and streaks of 5 consecutive losses are guaranteed along the way. It would be absurd to say after one losing flip 'the coin stopped working'.\n\nThat's exactly what a positive-expectancy strategy is:\n\n- **One trade** = pure noise. Its result says NOTHING about the quality of your decision.\n- **10 trades** = still noise, with illusions of patterns.\n- **100 trades** = only here does the edge become visible and the statistics start to mean something.\n\nThe practical consequence is liberating: a LOSING trade can be an EXCELLENT decision (valid setup, correct sizing, perfect execution — the 45% side simply happened), and a winning trade can be a TERRIBLE decision (no setup, double lot — luck). Judge yourself by decision quality, not by the outcome of a single flip.",
            },
            tip: {
              ro: "Schimbă unitatea de măsură a performanței: nu ziua, ci LOTUL de 20 de tranzacții. Întrebarea corectă nu e „cum a mers azi?”, ci „cum au mers ultimele 20 de execuții față de precedentele 20?”. În Analytics-ul TradeGx poți urmări exact această evoluție.",
              en: "Change your unit of performance: not the day, but the BATCH of 20 trades. The right question isn't 'how did today go?' but 'how did my last 20 executions compare with the previous 20?'. TradeGx Analytics lets you track exactly that.",
            },
          },
          {
            heading: { ro: "Detașarea de rezultatul unui singur trade", en: "Detachment from single-trade outcomes" },
            body: {
              ro: "Detașarea nu înseamnă indiferență — înseamnă că identitatea ta nu mai urcă și coboară cu fiecare poziție. Practic:\n\n- **Înainte de intrare**, spune-ți explicit: „accept că acest trade poate pierde 1R și asta e o parte normală a sistemului”. Dacă suma din risc te sperie, lotul e prea mare — nu setup-ul e problema.\n- **În timpul poziției**, treaba ta s-a terminat la intrare: SL și TP sunt setate, planul decide. Statul cu ochii pe fiecare tick nu îmbunătățește rezultatul — doar îți erodează detașarea.\n- **După închidere**, o singură întrebare: „am respectat planul?”. Da + pierdere = execuție bună, punct. Nu + profit = eroare care va costa scump la repetare.\n\nUn semn clar că ai făcut saltul: pierderile pe plan corect nu te mai frământă seara, dar câștigurile cu abateri te deranjează sincer. În acel moment, identitatea ta s-a mutat de la „parior care are nevoie să câștige acum” la **operator al unui sistem probabilistic** — iar tradingul devine, în sfârșit, plictisitor în sensul bun.",
              en: "Detachment doesn't mean indifference — it means your identity no longer rises and falls with every position. In practice:\n\n- **Before entry**, tell yourself explicitly: 'I accept this trade can lose 1R and that's a normal part of the system'. If the amount at risk scares you, the lot is too big — the setup isn't the problem.\n- **During the position**, your job ended at entry: SL and TP are set, the plan decides. Watching every tick doesn't improve the outcome — it only erodes your detachment.\n- **After the close**, one question: 'did I follow the plan?'. Yes + loss = good execution, period. No + profit = an error that will cost dearly when repeated.\n\nA clear sign you've made the shift: on-plan losses no longer haunt your evenings, but off-plan wins genuinely bother you. At that moment your identity has moved from 'gambler who needs to win now' to **operator of a probabilistic system** — and trading finally becomes boring in the best possible way.",
            },
          },
          {
            heading: { ro: "Așteptări realiste și răbdarea creșterii", en: "Realistic expectations and the patience of growth" },
            body: {
              ro: "Ultimul reglaj de identitate: calibrarea așteptărilor. Marketingul din social media promite dublarea contului lunar; realitatea traderilor buni arată altfel:\n\n- **2–5% pe lună, cu consistență**, e o performanță excelentă — fondurile mari sărbătoresc 15–20% pe AN.\n- Consistența bate spectaculosul: 4% pe lună compus înseamnă aproximativ **+60% pe an** — fără nicio lună de eroism, doar execuție repetată.\n- Contul mic nu se crește prin risc mare, ci prin **dovezi**: 6–12 luni de statistică pozitivă documentată în jurnal e biletul către capital serios (cont propriu mai mare sau prop firm), cu ACEEAȘI execuție de 1%.\n\nCariera de trader nu e un sprint spre dublarea contului — e construcția unui istoric care demonstrează că sistemul tău funcționează și că TU îl poți executa. Fiecare lună disciplinată e o cărămidă; fiecare episod de „recuperez repede” dărâmă un etaj întreg.\n\nAi acum toate piesele: strategie, risk management, psihologie. Diferența dintre a le ști și a le trăi se construiește o tranzacție pe rând — iar jurnalul tău TradeGx e locul unde această construcție devine vizibilă.",
              en: "The final identity adjustment: calibrating expectations. Social-media marketing promises doubling your account monthly; the reality of good traders looks different:\n\n- **2–5% per month, consistently**, is excellent performance — large funds celebrate 15–20% per YEAR.\n- Consistency beats fireworks: 4% per month compounded is roughly **+60% per year** — with no heroic months, just repeated execution.\n- A small account doesn't grow through big risk but through **proof**: 6–12 months of positive, journal-documented statistics is the ticket to serious capital (a bigger personal account or a prop firm), with the SAME 1% execution.\n\nA trading career isn't a sprint to double the account — it's the construction of a track record proving your system works and that YOU can execute it. Every disciplined month is a brick; every 'quick recovery' episode tears down a whole floor.\n\nYou now have all the pieces: strategy, risk management, psychology. The difference between knowing them and living them is built one trade at a time — and your TradeGx journal is where that construction becomes visible.",
            },
            warning: {
              ro: "Ferește-te de comparația cu alții — e otrava răbdării. Screenshot-urile cu profituri uriașe de pe social media sunt selecție pură: nimeni nu postează cele cinci conturi arse de dinainte. Singura comparație validă ești tu, acum 100 de tranzacții.",
              en: "Beware of comparing yourself to others — it's the poison of patience. Huge-profit screenshots on social media are pure selection: nobody posts the five blown accounts that came before. The only valid comparison is you, 100 trades ago.",
            },
          },
        ],
      },
    ],
  },
  diagrams: {
    "m8-equity-tilt": {
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
      line: [40, 42, 44, 43, 46, 40, 38, 42, 36, 30, 22, 16, 12, 8, 6, 5],
      arrows: [{ x: 5, y: 50, dir: "down", color: "#f43f5e", label: "−1R, −1R" }],
      labels: [
        { x: 9, y: 40, text: "Revenge ×2", color: "#f43f5e" },
        { x: 12, y: 24, text: "×4", color: "#f43f5e" },
        { x: 14.4, y: 14, text: "Tilt", color: "#f43f5e" },
      ],
      caption: {
        ro: "Anatomia unei spirale de tilt: săptămâni de progres, două pierderi normale, apoi loturi dublate din furie — și contul moare într-o singură zi.",
        en: "Anatomy of a tilt spiral: weeks of progress, two normal losses, then lots doubled in anger — and the account dies in a single day.",
      },
    },
    "m8-equity-discipline": {
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
      line: [40, 42, 41, 44, 46, 45, 48, 50, 49, 52, 54, 53, 56, 58, 57, 60],
      labels: [{ x: 7.5, y: 66, text: "Risc 1% constant", color: "#10b981" }],
      caption: {
        ro: "Curba disciplinei: creștere moderată, pierderi mici absorbite de sistem, zero episoade dramatice. Plictisitor — exact așa arată consistența.",
        en: "The discipline curve: moderate growth, small losses absorbed by the system, zero dramatic episodes. Boring — that's exactly what consistency looks like.",
      },
    },
  },
};
