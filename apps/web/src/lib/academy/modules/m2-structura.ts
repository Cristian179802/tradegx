import type { ModuleBundle } from "../types";

// ── M2: Structura Pieței & Suport/Rezistență (Începător) ────────────────────

export const M2_BUNDLE: ModuleBundle = {
  module: {
    id: "structura-pietei",
    level: "BEGINNER",
    icon: "chart",
    title: { ro: "Structura Pieței & Suport/Rezistență", en: "Market Structure & Support/Resistance" },
    description: {
      ro: "Suport și rezistență, trendline-uri, medii mobile, range-uri, breakout-uri și volum — cum citești structura pieței și găsești zonele în care chiar merită să acționezi.",
      en: "Support and resistance, trendlines, moving averages, ranges, breakouts and volume — how to read market structure and find the zones actually worth acting on.",
    },
    lessons: [
      {
        id: "suport-si-rezistenta",
        title: { ro: "Suport și rezistență", en: "Support and resistance" },
        minutes: 10,
        sections: [
          {
            body: {
              ro: "Dacă structura pieței e scheletul analizei tehnice, **suportul** și **rezistența** sunt articulațiile lui. Suportul e o zonă de preț unde presiunea de cumpărare a oprit istoric scăderile — o „podea”. Rezistența e opusul: o zonă unde presiunea de vânzare a oprit creșterile — un „tavan”.\n\nNivelurile nu sunt magie: sunt locuri unde s-au executat volume mari de ordine în trecut, iar piața are memorie. Cu cât o zonă a întors prețul de mai multe ori și cu cât reacțiile au fost mai violente, cu atât mai mulți traderi o urmăresc — și cu atât devine mai relevantă data viitoare când prețul ajunge acolo.",
              en: "If market structure is the skeleton of technical analysis, **support** and **resistance** are its joints. Support is a price area where buying pressure has historically stopped declines — a 'floor'. Resistance is the opposite: an area where selling pressure has stopped rallies — a 'ceiling'.\n\nLevels aren't magic: they're places where large amounts of orders were executed in the past, and the market has memory. The more times a zone has turned price around, and the more violent those reactions were, the more traders are watching it — and the more relevant it becomes the next time price gets there.",
            },
            diagram: "m2-suport-rezistenta",
          },
          {
            heading: { ro: "De ce funcționează nivelurile", en: "Why levels work" },
            body: {
              ro: "La un nivel important se adună, în același loc, deciziile mai multor categorii de participanți:\n\n- **Cei care au cumpărat la suport** și au ieșit prea devreme — vor să reintre la același preț.\n- **Cei care au ratat mișcarea** — așteaptă „a doua șansă” exact în aceeași zonă.\n- **Cei care au vândut sub suport** și acum sunt pe pierdere — închid pozițiile pe breakeven când prețul revine, adică apasă și ei pe buy.\n\nToate aceste intenții diferite se transformă în ordine de cumpărare concentrate în aceeași bandă de preț. De asta suportul „ține”: nu pentru că linia are puteri, ci pentru că oamenii și algoritmii reacționează în același loc.",
              en: "At an important level, the decisions of several categories of participants pile up in the same place:\n\n- **Those who bought at support** and exited too early — they want back in at the same price.\n- **Those who missed the move** — they wait for a 'second chance' in exactly the same area.\n- **Those who sold below support** and are now losing — they close at breakeven when price returns, which means they're pressing buy too.\n\nAll these different intentions turn into buy orders concentrated in the same price band. That's why support 'holds': not because the line has powers, but because humans and algorithms react in the same place.",
            },
          },
          {
            heading: { ro: "Zone, nu linii", en: "Zones, not lines" },
            body: {
              ro: "Prețul se oprește rareori exact la aceeași valoare. Wick-urile penetrează nivelul, închiderea se face puțin mai sus sau mai jos — reacția se întâmplă într-o **bandă**, nu pe o linie de un pip.\n\nDesenează zona practic: marginea exterioară la extremele wick-urilor, marginea interioară la corpurile lumânărilor care au reacționat. Pe timeframe-uri mari zonele sunt firesc mai late — o zonă de 30–50 pips pe D1 la EURUSD e complet normală. Dacă zona ta pare „prea lată”, problema nu e zona, ci așteptarea de precizie chirurgicală de la o piață care nu funcționează așa.",
              en: "Price rarely stops at exactly the same value. Wicks pierce the level, closes land slightly higher or lower — the reaction happens inside a **band**, not on a one-pip line.\n\nDraw the zone practically: outer edge at the wick extremes, inner edge at the bodies of the candles that reacted. On higher timeframes zones are naturally wider — a 30–50 pip zone on EURUSD D1 is completely normal. If your zone feels 'too wide', the problem isn't the zone — it's expecting surgical precision from a market that doesn't work that way.",
            },
            warning: {
              ro: "Cea mai scumpă greșeală de începător: stop loss-ul pus EXACT pe nivel. Piața penetrează frecvent nivelul cu un wick, îți execută stop-ul și apoi pleacă în direcția ta. SL-ul se pune dincolo de ZONĂ, cu o marjă, nu pe linia pe care o vede toată lumea.",
              en: "The most expensive beginner mistake: a stop loss placed EXACTLY on the level. The market frequently pierces the level with a wick, takes out your stop, then moves in your direction. The SL goes beyond the ZONE, with a margin — not on the line everyone can see.",
            },
          },
          {
            heading: { ro: "Role reversal: nivelul spart își schimbă rolul", en: "Role reversal: a broken level switches sides" },
            body: {
              ro: "Când o rezistență e spartă decisiv, ea devine, de regulă, suport — și invers. Fenomenul se numește **role reversal** sau „flip”.\n\nMecanica e logică: cei care au vândut la rezistență sunt acum prinși pe pierdere și ies la breakeven când prețul revine la nivel (cumpără). Cei care au prins breakout-ul vor să adauge la retest (cumpără). Cei care au ratat intrarea o primesc acum (cumpără). Trei valuri de cumpărare în aceeași zonă — de asta **retestul** unui nivel spart e una dintre cele mai fiabile intrări din analiza tehnică: intri în direcția mișcării deja confirmate, cu stop clar sub zonă.",
              en: "When resistance is broken decisively, it usually becomes support — and vice versa. This is called **role reversal**, or the 'flip'.\n\nThe mechanics are logical: those who sold at resistance are now trapped at a loss and exit at breakeven when price returns to the level (they buy). Those who caught the breakout want to add on the retest (they buy). Those who missed the entry now get it (they buy). Three waves of buying in the same zone — which is why the **retest** of a broken level is one of the most reliable entries in technical analysis: you enter in the direction of an already confirmed move, with a clear stop below the zone.",
            },
            diagram: "m2-flip",
            tip: {
              ro: "Fă-ți un ritual: duminică seara marchezi nivelurile majore de pe D1 și H4 pentru instrumentele tale, apoi setezi alerte de preț în TradeGx pe fiecare zonă. Când prețul ajunge acolo primești notificare și analizezi calm — în loc să stai lipit de grafic toată săptămâna.",
              en: "Build a ritual: every Sunday evening, mark the major D1 and H4 levels on your instruments, then set TradeGx price alerts on each zone. When price gets there you're notified and analyze calmly — instead of staring at charts all week.",
            },
          },
        ],
      },
      {
        id: "trendline-uri-si-canale",
        title: { ro: "Trendline-uri și canale", en: "Trendlines and channels" },
        minutes: 8,
        sections: [
          {
            body: {
              ro: "O **trendline** e un nivel înclinat: în uptrend unești minimele tot mai sus (linia stă SUB preț și acționează ca suport), în downtrend unești maximele tot mai jos (linia stă DEASUPRA prețului, ca rezistență).\n\nRegula fundamentală: ai nevoie de **minimum 2 puncte** ca să trasezi linia, iar **a 3-a atingere o validează**. Abia de la a treia atingere trendline-ul devine interesant pentru tranzacționare — până atunci e doar o ipoteză.",
              en: "A **trendline** is a sloped level: in an uptrend you connect the rising lows (the line sits BELOW price, acting as support); in a downtrend you connect the falling highs (the line sits ABOVE price, as resistance).\n\nThe fundamental rule: you need a **minimum of 2 points** to draw the line, and the **3rd touch validates it**. Only from the third touch does a trendline become tradeable — before that it's just a hypothesis.",
            },
            diagram: "m2-trendline",
          },
          {
            heading: { ro: "Regulile unei trendline corecte", en: "Rules of a proper trendline" },
            body: {
              ro: "- **Fii consecvent**: ori unești wick-urile, ori corpurile — dar la fel pe tot graficul. Micile penetrări cu wick-ul sunt normale.\n- **Nu forța linia.** O trendline reală „sare în ochi” în 2 secunde. Dacă o tot rotești și o muți ca să atingă punctele, nu există.\n- **Panta contează**: liniile foarte abrupte (mișcări parabolice) se sparg repede — nu sunt sustenabile. Liniile cu pantă moderată, construite în timp, sunt cele care țin.\n- **Timeframe-ul mare bate timeframe-ul mic**: o trendline de pe D1 cu 4 atingeri valorează mai mult decât zece linii de pe M15.\n- **Spargerea trendline-ului nu inversează trendul instant** — semnalează doar că ritmul s-a schimbat. Inversarea o confirmă structura (un LH și un LL după uptrend).",
              en: "- **Be consistent**: connect either wicks or bodies — but the same way across the whole chart. Small wick penetrations are normal.\n- **Don't force the line.** A real trendline 'jumps out' at you in 2 seconds. If you keep rotating and nudging it to touch the points, it doesn't exist.\n- **Slope matters**: very steep lines (parabolic moves) break quickly — they're unsustainable. Moderately sloped lines built over time are the ones that hold.\n- **Higher timeframe beats lower timeframe**: one D1 trendline with 4 touches is worth more than ten M15 lines.\n- **A trendline break doesn't instantly reverse the trend** — it only signals the rhythm has changed. Reversal is confirmed by structure (an LH and an LL after an uptrend).",
            },
            warning: {
              ro: "Dacă muți linia până „se potrivește” cu ideea ta de trade, nu mai faci analiză — cauți confirmare pentru o decizie deja luată emoțional. Trendline-ul se trasează întâi, obiectiv; ideea de trade vine după.",
              en: "If you keep adjusting the line until it 'fits' your trade idea, you're no longer analyzing — you're seeking confirmation for a decision already made emotionally. Draw the trendline first, objectively; the trade idea comes after.",
            },
          },
          {
            heading: { ro: "Canale", en: "Channels" },
            body: {
              ro: "Când poți duce o **paralelă** la trendline pe partea opusă a prețului, ai un **canal**. Prețul „respiră” între cele două margini: în canal ascendent, baza canalului e zona de cumpărare, iar banda superioară e zona de take profit.\n\nDouă reguli practice: tranzacționează în direcția pantei (în canal ascendent cauți buy la bază, nu sell la vârf — sell-ul contra-trend e rezervat traderilor avansați) și urmărește comportamentul la mijlocul canalului: dacă prețul nu mai ajunge la banda superioară și se întoarce de la mijloc, presiunea slăbește — un prim avertisment înainte de spargerea bazei.",
              en: "When you can place a **parallel** to the trendline on the opposite side of price, you have a **channel**. Price 'breathes' between the two edges: in an ascending channel, the base is the buying area and the upper band is the take-profit area.\n\nTwo practical rules: trade in the direction of the slope (in an ascending channel you look for buys at the base, not sells at the top — counter-trend selling is for advanced traders), and watch the behavior at the channel's midline: if price stops reaching the upper band and turns back from the middle, pressure is weakening — an early warning before the base breaks.",
            },
            diagram: "m2-canal",
            tip: {
              ro: "La fiecare intrare bazată pe trendline sau canal, salvează un screenshot cu linia trasată și atașează-l tranzacției din jurnalul TradeGx. După 20 de tranzacții, revezi pozele: vei vedea imediat care linii erau reale și care erau desenate din dorința de a intra.",
              en: "For every trendline or channel entry, save a screenshot with the line drawn and attach it to the trade in your TradeGx journal. After 20 trades, review the images: you'll instantly see which lines were real and which were drawn out of the desire to enter.",
            },
          },
        ],
      },
      {
        id: "medii-mobile",
        title: { ro: "Medii mobile: SMA, EMA și crossover-uri", en: "Moving averages: SMA, EMA and crossovers" },
        minutes: 9,
        sections: [
          {
            body: {
              ro: "**Media mobilă (MA — Moving Average)** e media ultimelor N închideri, recalculată la fiecare lumânare. Rolul ei: netezește zgomotul și îți arată direcția și ritmul trendului dintr-o privire.\n\nDouă variante domină:\n\n- **SMA (Simple Moving Average)** — media aritmetică simplă: toate cele N lumânări cântăresc la fel. Mai lentă, mai netedă.\n- **EMA (Exponential Moving Average)** — dă greutate mai mare lumânărilor recente. Reacționează mai repede la schimbări, dar dă și mai multe semnale false.\n\nNiciuna nu e „mai bună”. EMA e preferată pe timeframe-uri mici și în strategii de momentum; SMA pe timeframe-uri mari, unde stabilitatea contează mai mult decât viteza.",
              en: "A **Moving Average (MA)** is the average of the last N closes, recalculated on every candle. Its job: smooth out the noise and show you the trend's direction and rhythm at a glance.\n\nTwo variants dominate:\n\n- **SMA (Simple Moving Average)** — the plain arithmetic mean: all N candles weigh the same. Slower, smoother.\n- **EMA (Exponential Moving Average)** — gives more weight to recent candles. It reacts faster to change, but also produces more false signals.\n\nNeither is 'better'. EMA is preferred on lower timeframes and momentum strategies; SMA on higher timeframes, where stability matters more than speed.",
            },
          },
          {
            heading: { ro: "Perioadele care contează: 20, 50, 200", en: "The periods that matter: 20, 50, 200" },
            body: {
              ro: "Poți pune orice număr într-o MA, dar trei perioade sunt urmărite de toată piața — și tocmai pentru că toți se uită la ele, funcționează:\n\n- **EMA 20** — pulsul trendului pe termen scurt. În trendurile puternice, prețul „călărește” EMA 20 și abia o atinge la pullback-uri.\n- **MA 50** — trendul mediu. Corecțiile din trendurile sănătoase se opresc des în jurul ei.\n- **SMA 200** — granița macro dintre bull și bear, referința instituțiilor. Preț peste SMA 200 pe D1 = bias de cumpărare; sub = bias de vânzare. E filtrul cel mai simplu și mai puternic pe care îl poți folosi ca începător.",
              en: "You can feed any number into an MA, but three periods are watched by the entire market — and precisely because everyone watches them, they work:\n\n- **EMA 20** — the pulse of the short-term trend. In strong trends, price 'rides' the EMA 20 and only touches it on pullbacks.\n- **MA 50** — the medium trend. Corrections in healthy trends often stall around it.\n- **SMA 200** — the macro line between bull and bear, the institutional benchmark. Price above the 200 SMA on D1 = buy bias; below = sell bias. It's the simplest and most powerful filter you can use as a beginner.",
            },
          },
          {
            heading: { ro: "Suport și rezistență dinamică", en: "Dynamic support and resistance" },
            body: {
              ro: "Într-un trend curat, media mobilă devine un **nivel dinamic**: un suport care urcă odată cu prețul (sau o rezistență care coboară, în downtrend). Pullback-ul la EMA 20/50 urmat de o lumânare de respingere e unul dintre cele mai simple setup-uri de continuare de trend.\n\nAtenție însă: nu cumperi „pentru că prețul a atins media”. Atingerea e doar LOCUL; ai nevoie și de MOTIV (trendul clar pe timeframe-ul mare) și de DECLANȘATOR (o lumânare de confirmare — le înveți în modulul de candlestick patterns).",
              en: "In a clean trend, the moving average becomes a **dynamic level**: support that rises with price (or resistance that falls, in a downtrend). A pullback to the EMA 20/50 followed by a rejection candle is one of the simplest trend-continuation setups there is.\n\nBut be careful: you don't buy 'because price touched the average'. The touch is only the LOCATION; you also need a REASON (a clear trend on the higher timeframe) and a TRIGGER (a confirmation candle — covered in the candlestick patterns module).",
            },
            diagram: "m2-ma-dinamica",
            tip: {
              ro: "Fiecare instrument își are media „lui”: XAUUSD pe H1 poate respecta EMA 20, EURUSD pe H4 poate respecta MA 50. Folosește backtesting-ul din TradeGx ca să verifici pe istoricul TĂU care medie e respectată pe instrumentul și timeframe-ul tău — nu prelua setări de pe internet fără verificare.",
              en: "Every instrument has 'its own' average: XAUUSD on H1 may respect the EMA 20, EURUSD on H4 may respect the MA 50. Use TradeGx backtesting to check on YOUR history which average is respected on your instrument and timeframe — don't copy settings off the internet unverified.",
            },
          },
          {
            heading: { ro: "Golden cross și death cross", en: "Golden cross and death cross" },
            body: {
              ro: "**Golden cross** = MA 50 taie în sus MA 200. **Death cross** = MA 50 taie în jos MA 200. Sunt cele mai cunoscute semnale de schimbare de regim și apar frecvent în presa financiară.\n\nAdevărul despre ele: mediile mobile sunt calculate din trecut, deci **întârzie prin construcție**. Golden cross-ul apare după ce prețul a urcat deja semnificativ — nu e o unealtă de timing, ci de CONFIRMARE de regim. Folosește-l ca filtru de direcție: după golden cross pe D1, cauți doar setup-uri de cumpărare; după death cross, doar de vânzare. Intrarea propriu-zisă o faci pe structură și niveluri, nu pe crossover.",
              en: "**Golden cross** = the 50 MA crossing above the 200 MA. **Death cross** = the 50 MA crossing below the 200 MA. They're the most famous regime-change signals and show up regularly in financial media.\n\nThe truth about them: moving averages are computed from the past, so **they lag by construction**. A golden cross appears after price has already risen significantly — it's not a timing tool, it's a regime CONFIRMATION tool. Use it as a direction filter: after a golden cross on D1 you only look for buy setups; after a death cross, only sells. The actual entry comes from structure and levels, not from the crossover.",
            },
            diagram: "m2-golden-cross",
            warning: {
              ro: "Mediile mobile funcționează în trend și te toacă în range: prețul taie media în sus și în jos, crossover-ele se succed rapid și fiecare semnal pierde. Înainte de ORICE semnal bazat pe MA, răspunde la întrebarea: piața e în trend sau în range? Dacă e în range, pune mediile deoparte.",
              en: "Moving averages work in trends and chop you up in ranges: price slices through the average both ways, crossovers fire back-to-back and every signal loses. Before ANY MA-based signal, answer this: is the market trending or ranging? If it's ranging, put the averages away.",
            },
          },
        ],
      },
      {
        id: "range-si-breakout",
        title: { ro: "Range și breakout", en: "Range and breakout" },
        minutes: 9,
        sections: [
          {
            body: {
              ro: "Piețele nu trendează tot timpul — dimpotrivă, își petrec cea mai mare parte a timpului în **range** (consolidare): prețul oscilează între un suport și o rezistență clare, fără direcție.\n\nRange-ul nu e „timp mort”. E faza în care pozițiile își schimbă proprietarii: jucătorii mari **acumulează** (cumpără treptat, fără să miște prețul) sau **distribuie** (vând treptat) — iar breakout-ul care urmează arată cine a câștigat. De aceea regula clasică spune: cu cât consolidarea e mai lungă, cu atât mișcarea de după spargere e mai amplă.",
              en: "Markets don't trend all the time — quite the opposite: they spend most of their time in a **range** (consolidation), with price oscillating between clear support and resistance, directionless.\n\nA range isn't 'dead time'. It's the phase where positions change hands: big players **accumulate** (buy gradually without moving price) or **distribute** (sell gradually) — and the breakout that follows reveals who won. Hence the classic rule: the longer the consolidation, the larger the move after the break.",
            },
          },
          {
            heading: { ro: "Cum tranzacționezi range-ul", en: "How to trade the range" },
            body: {
              ro: "Cât timp range-ul e valid, jocul e simplu în teorie:\n\n- **Cumperi la suport, vinzi la rezistență** — dar numai cu confirmare (o lumânare de respingere la margine), nu orbește la atingere.\n- **Ținta e marginea opusă**, stop-ul dincolo de zona de la care ai intrat.\n- **Mijlocul range-ului e pământul nimănui**: acolo nu ai nici avantaj statistic, nici stop logic. Nu intra din mijloc.\n\nVerifică și dacă range-ul e destul de LAT: pe un range de 15 pips pe M5, spread-ul și slippage-ul îți mănâncă avantajul. Range-urile tranzacționabile sunt cele de pe H1 în sus.",
              en: "While the range is valid, the game is simple in theory:\n\n- **Buy at support, sell at resistance** — but only with confirmation (a rejection candle at the edge), never blindly on the touch.\n- **The target is the opposite edge**, the stop beyond the zone you entered from.\n- **The middle of the range is no man's land**: no statistical edge, no logical stop. Don't enter from the middle.\n\nAlso check that the range is wide ENOUGH: on a 15-pip M5 range, spread and slippage eat your edge. Tradeable ranges live on H1 and above.",
            },
          },
          {
            heading: { ro: "Breakout-ul valid", en: "The valid breakout" },
            body: {
              ro: "**Breakout** = prețul sparge marginea range-ului și pleacă. Un breakout credibil are semnătură clară:\n\n- **Close decisiv dincolo de nivel** — un wick prin nivel nu e breakout, e doar o încercare.\n- **Corp mare** pe lumânarea de spargere — convingere, nu ezitare.\n- **Volum peste medie** — participare reală (detalii în lecția următoare).\n- **Follow-through** — lumânările următoare continuă direcția în loc să se întoarcă imediat în range.\n\nAi două moduri de a intra: **agresiv**, la închiderea lumânării de breakout (prinzi toată mișcarea, dar mănânci mai multe semnale false) sau **conservator**, la retestul nivelului spart (raport risc/recompensă mai bun, dar uneori retestul nu mai vine și mișcarea pleacă fără tine). Ambele sunt corecte — important e să alegi UNA și s-o aplici consecvent.",
              en: "A **breakout** = price breaks the edge of the range and leaves. A credible breakout has a clear signature:\n\n- **A decisive close beyond the level** — a wick through the level isn't a breakout, it's just an attempt.\n- **A large body** on the breakout candle — conviction, not hesitation.\n- **Above-average volume** — real participation (details in the next lesson).\n- **Follow-through** — the next candles continue the direction instead of falling straight back into the range.\n\nYou have two ways in: **aggressive**, at the close of the breakout candle (you catch the whole move but eat more false signals), or **conservative**, on the retest of the broken level (better risk/reward, but sometimes the retest never comes and the move leaves without you). Both are valid — what matters is picking ONE and applying it consistently.",
            },
            diagram: "m2-range-breakout",
            tip: {
              ro: "Nu dezbate la nesfârșit „close sau retest?” — testează. Rulează ambele variante pe istoricul instrumentului tău în backtesting-ul TradeGx și compară rezultatele. Datele tale bat orice opinie de pe internet.",
              en: "Don't endlessly debate 'close or retest?' — test it. Run both variants on your instrument's history in TradeGx backtesting and compare the results. Your data beats any opinion on the internet.",
            },
          },
          {
            heading: { ro: "False breakout: capcana clasică", en: "The false breakout: the classic trap" },
            body: {
              ro: "Deasupra oricărei rezistențe evidente stau două grămezi de ordine: stop loss-urile celor cu poziții de sell și buy stop-urile vânătorilor de breakout. Adică **lichiditate** — exact ce au nevoie jucătorii mari ca să-și execute vânzările.\n\nDe aici capcana: prețul e împins peste nivel, ordinele se execută, iar apoi piața se prăbușește înapoi în range. Semnele unui **false breakout**: wick lung dincolo de nivel, revenire rapidă sub el (de obicei în 1–3 lumânări) și lipsa totală de follow-through. Vestea bună: un false breakout e el însuși un semnal — odată ce capcana s-a închis, prețul pleacă de regulă hotărât în direcția OPUSĂ. Traderii avansați îl tranzacționează exact așa.",
              en: "Above every obvious resistance sit two piles of orders: the stop losses of sellers and the buy stops of breakout hunters. In other words, **liquidity** — exactly what big players need to fill their sells.\n\nHence the trap: price gets pushed above the level, the orders execute, then the market collapses back into the range. The signs of a **false breakout**: a long wick beyond the level, a quick reclaim below it (usually within 1–3 candles), and zero follow-through. The good news: a false breakout is itself a signal — once the trap has closed, price usually leaves decisively in the OPPOSITE direction. Advanced traders trade it exactly that way.",
            },
            diagram: "m2-false-breakout",
            warning: {
              ro: "Nu cumpăra niciodată în mijlocul lumânării de breakout, la piață, de frica de a rata mișcarea (FOMO). Ori ai un plan stabilit dinainte, ori stai deoparte. O mare parte dintre breakout-uri eșuează — și exact cele care „arată cel mai bine” pe moment sunt adesea cele false.",
              en: "Never buy mid-breakout-candle, at market, out of fear of missing the move (FOMO). Either you have a plan set in advance, or you stand aside. A large share of breakouts fail — and the ones that 'look best' in the moment are often the false ones.",
            },
          },
        ],
      },
      {
        id: "volumul",
        title: { ro: "Volumul: confirmarea din spatele prețului", en: "Volume: the confirmation behind price" },
        minutes: 7,
        sections: [
          {
            body: {
              ro: "**Volumul** măsoară câte unități s-au tranzacționat pe fiecare lumânare — adică participarea. Prețul îți spune CE s-a întâmplat; volumul îți spune CÂT DE CONVINGĂTOR a fost.\n\nO precizare importantă: pe piața spot forex nu există un volum centralizat real, așa că platformele afișează **tick volume** — numărul de schimbări de preț din interval. Studiile arată că e un proxy bun pentru volumul real, dar rămâne o aproximare. Pe crypto și acțiuni, volumul afișat e cel real, tranzacționat la bursă.",
              en: "**Volume** measures how many units were traded on each candle — in other words, participation. Price tells you WHAT happened; volume tells you HOW CONVINCING it was.\n\nOne important note: spot forex has no real centralized volume, so platforms display **tick volume** — the number of price changes within the interval. Studies show it's a decent proxy for real volume, but it remains an approximation. On crypto and stocks, the displayed volume is the real, exchange-traded one.",
            },
          },
          {
            heading: { ro: "Volumul confirmă sau trădează mișcarea", en: "Volume confirms or betrays the move" },
            body: {
              ro: "Regulile de bază, direct aplicabile:\n\n- **Breakout cu volum peste medie** = participare reală → șanse mari de follow-through.\n- **Breakout cu volum mic** = suspect → candidat de false breakout.\n- **Trend sănătos**: volumul crește pe impulsurile în direcția trendului și scade pe corecții.\n- **Vârf de volum extrem după un trend lung** (climax) = posibilă epuizare: ultimii cumpărători au intrat, nu mai are cine să împingă.\n\nObservă că volumul nu se citește niciodată singur — se citește ÎMPREUNĂ cu locul în care se află prețul: același volum uriaș înseamnă una la spargerea unei rezistențe majore și cu totul altceva în mijlocul unui range.",
              en: "The base rules, directly applicable:\n\n- **Breakout on above-average volume** = real participation → high odds of follow-through.\n- **Breakout on low volume** = suspicious → a false-breakout candidate.\n- **Healthy trend**: volume expands on impulses in the trend's direction and contracts on corrections.\n- **An extreme volume spike after a long trend** (climax) = possible exhaustion: the last buyers are in, no one is left to push.\n\nNotice that volume is never read alone — it's read TOGETHER with where price is: the same huge volume means one thing at the break of a major resistance and something entirely different in the middle of a range.",
            },
          },
          {
            heading: { ro: "Divergența preț–volum", en: "Price–volume divergence" },
            body: {
              ro: "Cel mai valoros semnal de volum pentru un începător: **divergența**. Prețul face maxime noi, dar fiecare împingere vine pe volum tot mai mic — tot mai puțini participanți sunt dispuși să cumpere la prețuri tot mai mari. Trendul avansează din inerție, nu din convingere.\n\nDivergența NU e semnal de vânzare instant — trendurile obosite pot continua surprinzător de mult. E un semnal de PRUDENȚĂ: strânge stop loss-ul pe pozițiile deschise, nu mai adăuga în direcția trendului și fii atent la primul semn de structură spartă. Când reversal-ul chiar vine, divergența te-a pregătit cu mult înainte.",
              en: "The most valuable volume signal for a beginner: **divergence**. Price prints new highs, but each push comes on smaller volume — fewer and fewer participants are willing to buy at ever-higher prices. The trend is advancing on inertia, not conviction.\n\nDivergence is NOT an instant sell signal — tired trends can run surprisingly far. It's a signal for CAUTION: tighten stops on open positions, stop adding in the trend's direction, and watch for the first sign of broken structure. When the reversal does come, divergence warned you well in advance.",
            },
            diagram: "m2-volum",
            tip: {
              ro: "Adaugă în checklist-ul pre-trade din TradeGx întrebarea: „Volumul confirmă direcția intrării?”. Un singur „nu” nu anulează un setup bun — dar dacă și volumul, și structura, și timeframe-ul mare spun „nu”, checklist-ul tocmai te-a salvat de un trade prost.",
              en: "Add this question to your TradeGx pre-trade checklist: 'Does volume confirm the direction of my entry?'. A single 'no' doesn't kill a good setup — but if volume, structure AND the higher timeframe all say 'no', the checklist just saved you from a bad trade.",
            },
            warning: {
              ro: "Tick volume diferă de la broker la broker — nu compara valori absolute între platforme. Folosește-l mereu RELATIV: față de ultimele 20–50 de lumânări de pe același grafic. Și evită concluziile trase din volum în sesiunea asiatică, unde participarea e oricum scăzută.",
              en: "Tick volume differs from broker to broker — never compare absolute values across platforms. Always use it RELATIVELY: against the last 20–50 candles on the same chart. And avoid volume conclusions during the Asian session, where participation is low anyway.",
            },
          },
        ],
      },
    ],
  },
  diagrams: {
    "m2-suport-rezistenta": {
      candles: [
        { o: 55, h: 58, l: 44, c: 46 },
        { o: 46, h: 49, l: 36, c: 38 },
        { o: 38, h: 41, l: 27, c: 31 },
        { o: 31, h: 45, l: 29, c: 43 },
        { o: 43, h: 56, l: 41, c: 53 },
        { o: 53, h: 62, l: 50, c: 59 },
        { o: 59, h: 71, l: 57, c: 63 },
        { o: 63, h: 65, l: 52, c: 55 },
        { o: 55, h: 57, l: 42, c: 45 },
        { o: 45, h: 47, l: 28, c: 32 },
        { o: 32, h: 48, l: 30, c: 46 },
        { o: 46, h: 60, l: 44, c: 57 },
      ],
      zones: [{ y1: 26, y2: 33, color: "#10b981", label: "Support" }],
      levels: [{ y: 70, label: "Resistance", color: "#f43f5e", dashed: true }],
      arrows: [
        { x: 2, y: 22, dir: "up", color: "#10b981" },
        { x: 9, y: 23, dir: "up", color: "#10b981" },
        { x: 6, y: 76, dir: "down", color: "#f43f5e" },
      ],
      caption: {
        ro: "Zona de suport întoarce prețul de două ori (wick-urile penetrează zona — de asta e zonă, nu linie), iar rezistența respinge creșterea.",
        en: "The support zone turns price twice (wicks pierce into it — that's why it's a zone, not a line), while resistance rejects the rally.",
      },
    },
    "m2-flip": {
      candles: [
        { o: 38, h: 44, l: 35, c: 42 },
        { o: 42, h: 56, l: 40, c: 50 },
        { o: 50, h: 53, l: 42, c: 45 },
        { o: 45, h: 48, l: 38, c: 40 },
        { o: 40, h: 56, l: 39, c: 48 },
        { o: 48, h: 52, l: 43, c: 46 },
        { o: 46, h: 62, l: 45, c: 60 },
        { o: 60, h: 66, l: 57, c: 64 },
        { o: 64, h: 65, l: 54, c: 57 },
        { o: 57, h: 59, l: 53, c: 56 },
        { o: 56, h: 68, l: 55, c: 66 },
        { o: 66, h: 76, l: 64, c: 74 },
      ],
      levels: [{ y: 55, label: "R → S", color: "#818cf8" }],
      arrows: [
        { x: 1, y: 61, dir: "down", color: "#f43f5e" },
        { x: 4, y: 61, dir: "down", color: "#f43f5e" },
        { x: 9, y: 48, dir: "up", color: "#10b981", label: "Retest" },
      ],
      labels: [{ x: 6, y: 68, text: "Breakout", color: "#10b981" }],
      caption: {
        ro: "Role reversal: rezistența testată de două ori e spartă decisiv, apoi retestată ca suport — intrarea clasică de continuare.",
        en: "Role reversal: resistance tested twice gets broken decisively, then retested as support — the classic continuation entry.",
      },
    },
    "m2-trendline": {
      candles: [
        { o: 20, h: 28, l: 17, c: 26 },
        { o: 26, h: 36, l: 24, c: 34 },
        { o: 34, h: 42, l: 32, c: 40 },
        { o: 40, h: 42, l: 29, c: 33 },
        { o: 33, h: 44, l: 31, c: 42 },
        { o: 42, h: 52, l: 40, c: 50 },
        { o: 50, h: 56, l: 46, c: 48 },
        { o: 48, h: 50, l: 44, c: 46 },
        { o: 46, h: 58, l: 45, c: 56 },
        { o: 56, h: 64, l: 54, c: 62 },
        { o: 62, h: 70, l: 60, c: 68 },
        { o: 68, h: 74, l: 64, c: 72 },
      ],
      trend: [{ x1: 0, y1: 16, x2: 11, y2: 60, color: "#818cf8" }],
      labels: [
        { x: 0, y: 11, text: "1", color: "#818cf8" },
        { x: 3, y: 24, text: "2", color: "#818cf8" },
        { x: 7, y: 39, text: "3", color: "#10b981" },
      ],
      caption: {
        ro: "Trendline de uptrend sub minime: punctele 1 și 2 o trasează, atingerea 3 o validează și devine tranzacționabilă.",
        en: "An uptrend trendline under the lows: points 1 and 2 draw it, touch 3 validates it and makes it tradeable.",
      },
    },
    "m2-canal": {
      candles: [
        { o: 26, h: 32, l: 20, c: 30 },
        { o: 30, h: 39, l: 28, c: 37 },
        { o: 37, h: 44, l: 35, c: 42 },
        { o: 42, h: 43, l: 35, c: 37 },
        { o: 37, h: 40, l: 32, c: 38 },
        { o: 38, h: 48, l: 37, c: 46 },
        { o: 46, h: 56, l: 44, c: 53 },
        { o: 53, h: 54, l: 45, c: 47 },
        { o: 47, h: 49, l: 43, c: 45 },
        { o: 45, h: 56, l: 44, c: 54 },
        { o: 54, h: 67, l: 52, c: 64 },
        { o: 64, h: 66, l: 56, c: 58 },
      ],
      trend: [
        { x1: 0, y1: 20, x2: 11, y2: 53, color: "#818cf8" },
        { x1: 0, y1: 38, x2: 11, y2: 71, color: "#818cf8", dashed: true },
      ],
      arrows: [
        { x: 4, y: 26, dir: "up", color: "#10b981", label: "Buy" },
        { x: 8, y: 37, dir: "up", color: "#10b981", label: "Buy" },
      ],
      caption: {
        ro: "Canal ascendent: baza (linia continuă) e zona de cumpărare, banda superioară (linia punctată) e zona de take profit.",
        en: "Ascending channel: the base (solid line) is the buy zone, the upper band (dashed) is the take-profit zone.",
      },
    },
    "m2-ma-dinamica": {
      candles: [
        { o: 24, h: 30, l: 22, c: 28 },
        { o: 28, h: 35, l: 26, c: 33 },
        { o: 33, h: 40, l: 31, c: 38 },
        { o: 38, h: 39, l: 28, c: 32 },
        { o: 32, h: 42, l: 30, c: 40 },
        { o: 40, h: 47, l: 38, c: 45 },
        { o: 45, h: 52, l: 43, c: 50 },
        { o: 50, h: 51, l: 39, c: 43 },
        { o: 43, h: 52, l: 42, c: 50 },
        { o: 50, h: 58, l: 48, c: 56 },
        { o: 56, h: 62, l: 54, c: 60 },
        { o: 60, h: 61, l: 51, c: 54 },
        { o: 54, h: 66, l: 53, c: 64 },
      ],
      line: [22, 24, 26, 28, 31, 34, 37, 40, 43, 46, 49, 52, 55],
      arrows: [
        { x: 3, y: 24, dir: "up", color: "#10b981" },
        { x: 7, y: 35, dir: "up", color: "#10b981" },
        { x: 11, y: 47, dir: "up", color: "#10b981" },
      ],
      labels: [{ x: 1.5, y: 18, text: "EMA 20", color: "#818cf8" }],
      caption: {
        ro: "Suport dinamic: în trend, pullback-urile ating EMA 20 și sunt cumpărate — nivelul urcă odată cu prețul.",
        en: "Dynamic support: in a trend, pullbacks tag the EMA 20 and get bought — the level rises together with price.",
      },
    },
    "m2-golden-cross": {
      candles: [
        { o: 50, h: 53, l: 44, c: 46 },
        { o: 46, h: 48, l: 40, c: 42 },
        { o: 42, h: 44, l: 35, c: 37 },
        { o: 37, h: 40, l: 32, c: 35 },
        { o: 35, h: 38, l: 31, c: 36 },
        { o: 36, h: 41, l: 34, c: 39 },
        { o: 39, h: 45, l: 37, c: 43 },
        { o: 43, h: 49, l: 41, c: 47 },
        { o: 47, h: 53, l: 45, c: 51 },
        { o: 51, h: 56, l: 48, c: 54 },
        { o: 54, h: 60, l: 52, c: 58 },
        { o: 58, h: 64, l: 55, c: 62 },
        { o: 62, h: 68, l: 60, c: 66 },
        { o: 66, h: 73, l: 64, c: 70 },
      ],
      line: [42, 40, 38, 36, 35, 35, 36, 38, 41, 44, 47, 50, 53, 56],
      trend: [{ x1: 0, y1: 52, x2: 13, y2: 46, color: "#f59e0b", dashed: true }],
      labels: [
        { x: 2.5, y: 28, text: "MA 50", color: "#818cf8" },
        { x: 2.5, y: 56, text: "MA 200", color: "#f59e0b" },
        { x: 10.5, y: 40, text: "Golden Cross", color: "#10b981" },
      ],
      caption: {
        ro: "Golden cross: MA 50 (linia continuă) taie în sus MA 200 (linia punctată) — DUPĂ ce prețul a urcat deja. Confirmare de regim, nu unealtă de timing.",
        en: "Golden cross: the 50 MA (solid line) crosses above the 200 MA (dashed) — AFTER price has already risen. Regime confirmation, not a timing tool.",
      },
    },
    "m2-range-breakout": {
      candles: [
        { o: 40, h: 47, l: 38, c: 44 },
        { o: 44, h: 49, l: 41, c: 43 },
        { o: 43, h: 45, l: 34, c: 37 },
        { o: 37, h: 44, l: 35, c: 42 },
        { o: 42, h: 48, l: 40, c: 45 },
        { o: 45, h: 47, l: 36, c: 39 },
        { o: 39, h: 43, l: 34, c: 41 },
        { o: 41, h: 47, l: 39, c: 46 },
        { o: 46, h: 54, l: 44, c: 52 },
        { o: 52, h: 58, l: 50, c: 56 },
        { o: 56, h: 57, l: 49, c: 51 },
        { o: 51, h: 62, l: 50, c: 60 },
        { o: 60, h: 68, l: 58, c: 66 },
      ],
      zones: [{ y1: 35, y2: 48, x1: 0, x2: 8, color: "#818cf8", label: "Range" }],
      levels: [
        { y: 48, label: "Resistance", color: "#f43f5e", dashed: true },
        { y: 35, label: "Support", color: "#10b981", dashed: true },
      ],
      labels: [
        { x: 8, y: 60, text: "Breakout", color: "#10b981" },
        { x: 10, y: 44, text: "Retest", color: "#818cf8" },
      ],
      caption: {
        ro: "Breakout valid: close decisiv peste rezistența range-ului, follow-through, apoi retestul nivelului spart — a doua șansă de intrare.",
        en: "A valid breakout: a decisive close above the range's resistance, follow-through, then a retest of the broken level — the second entry chance.",
      },
    },
    "m2-false-breakout": {
      candles: [
        { o: 48, h: 54, l: 45, c: 52 },
        { o: 52, h: 59, l: 50, c: 56 },
        { o: 56, h: 60, l: 52, c: 54 },
        { o: 54, h: 57, l: 49, c: 51 },
        { o: 51, h: 58, l: 49, c: 56 },
        { o: 56, h: 66, l: 54, c: 58 },
        { o: 58, h: 60, l: 50, c: 52 },
        { o: 52, h: 54, l: 44, c: 46 },
        { o: 46, h: 48, l: 38, c: 40 },
        { o: 40, h: 44, l: 34, c: 36 },
        { o: 36, h: 40, l: 32, c: 38 },
        { o: 38, h: 41, l: 30, c: 33 },
      ],
      levels: [{ y: 60, label: "Resistance", color: "#f43f5e" }],
      arrows: [{ x: 5, y: 71, dir: "down", color: "#f43f5e" }],
      labels: [{ x: 5, y: 78, text: "False breakout", color: "#f43f5e" }],
      caption: {
        ro: "False breakout: wick-ul sparge rezistența, execută stop-urile și buy stop-urile, dar lumânarea închide înapoi sub nivel — capcana s-a închis și prețul pleacă în direcția opusă.",
        en: "False breakout: the wick breaks resistance, fills the stops and buy stops, but the candle closes back below the level — the trap snaps shut and price leaves in the opposite direction.",
      },
    },
    "m2-volum": {
      candles: [
        { o: 30, h: 36, l: 28, c: 35 },
        { o: 35, h: 42, l: 34, c: 41 },
        { o: 41, h: 48, l: 40, c: 47 },
        { o: 47, h: 50, l: 44, c: 46 },
        { o: 46, h: 52, l: 45, c: 51 },
        { o: 51, h: 55, l: 49, c: 54 },
        { o: 54, h: 57, l: 52, c: 56 },
        { o: 56, h: 59, l: 54, c: 57 },
        { o: 57, h: 60, l: 55, c: 58 },
        { o: 58, h: 59, l: 52, c: 54 },
        { o: 54, h: 56, l: 46, c: 48 },
        { o: 48, h: 50, l: 40, c: 42 },
      ],
      labels: [
        { x: 1, y: 22, text: "Volum ↑", color: "#10b981" },
        { x: 7.5, y: 68, text: "Volum ↓", color: "#f43f5e" },
      ],
      arrows: [{ x: 10, y: 62, dir: "down", color: "#f43f5e" }],
      caption: {
        ro: "Divergență preț–volum: prețul mai face maxime noi, dar pe corpuri tot mai mici și volum în scădere — trendul avansează din inerție, apoi cedează.",
        en: "Price–volume divergence: price still prints new highs, but on shrinking bodies and falling volume — the trend runs on inertia, then gives way.",
      },
    },
  },
};
