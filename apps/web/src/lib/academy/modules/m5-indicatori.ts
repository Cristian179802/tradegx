import type { ModuleBundle } from "../types";

// ── M5: Indicatori Tehnici (Intermediar) ─────────────────────────────────────

export const M5_BUNDLE: ModuleBundle = {
  module: {
    id: "indicatori",
    level: "INTERMEDIATE",
    icon: "activity",
    title: { ro: "Indicatori Tehnici", en: "Technical Indicators" },
    description: {
      ro: "RSI, MACD, Bollinger Bands, Stochastic, ATR și Fibonacci — ce măsoară de fapt, cum le folosești ca instrumente de confirmare și cum eviți capcana „indicator soup”.",
      en: "RSI, MACD, Bollinger Bands, Stochastic, ATR and Fibonacci — what they actually measure, how to use them as confirmation tools, and how to avoid the 'indicator soup' trap.",
    },
    lessons: [
      {
        id: "rsi",
        title: { ro: "RSI: mitul overbought/oversold", en: "RSI: the overbought/oversold myth" },
        minutes: 10,
        sections: [
          {
            body: {
              ro: "Înainte de orice indicator, un adevăr care îți va economisi ani de confuzie: **toți indicatorii sunt derivați din preț**. RSI, MACD, Bollinger — fiecare e o formulă matematică aplicată pe aceleași lumânări pe care le vezi deja. Niciun indicator nu „știe” ceva ce prețul nu a arătat deja; prin construcție, toți vin cu întârziere (**lag**).\n\nDe aceea rolul lor corect nu e de semnal în sine, ci de **instrument de confirmare**: prețul și structura îți dau ideea, indicatorul îți dă un al doilea vot. Cu mentalitatea asta, RSI devine o unealtă excelentă. Fără ea, devine o mașină de intrat contra trendului.\n\n**RSI (Relative Strength Index)** măsoară viteza și amplitudinea ultimelor mișcări (implicit 14 lumânări) și le comprimă pe o scară de la 0 la 100: valorile mari spun că au dominat creșterile recente, cele mici că au dominat scăderile.",
              en: "Before any indicator, one truth that will save you years of confusion: **all indicators are derived from price**. RSI, MACD, Bollinger — each is a mathematical formula applied to the very candles you're already looking at. No indicator 'knows' anything price hasn't already shown; by construction, they all **lag**.\n\nThat's why their correct role is not as signals in themselves, but as **confirmation tools**: price and structure give you the idea, the indicator gives you a second vote. With that mindset, RSI becomes an excellent tool. Without it, it becomes a machine for entering against the trend.\n\n**RSI (Relative Strength Index)** measures the speed and magnitude of recent moves (14 candles by default) and compresses them onto a 0–100 scale: high values say recent gains dominated, low values say losses did.",
            },
          },
          {
            heading: { ro: "Mitul: „peste 70 vinzi, sub 30 cumperi”", en: "The myth: 'sell above 70, buy below 30'" },
            body: {
              ro: "Manualul clasic spune: RSI peste 70 = **overbought** (scump, vinde), sub 30 = **oversold** (ieftin, cumpără). Sună logic și e periculos de fals în trenduri.\n\nÎntr-un trend puternic, RSI poate sta peste 70 zile sau săptămâni întregi în timp ce prețul continuă să urce. Overbought nu înseamnă „urmează scăderea” — înseamnă **forță**: cumpărătorii domină agresiv. Cine a vândut Bitcoin în 2020 „pentru că RSI era overbought” a vândut la începutul dublării prețului.\n\nDistincția corectă ține de regim:\n\n- **În range** (piață laterală) — extremele RSI chiar funcționează: la 70 prețul e lângă rezistența range-ului, la 30 lângă suport. Mean reversion are sens.\n- **În trend** — extremele RSI sunt semne de FORȚĂ, nu de inversare. Un RSI overbought într-un uptrend e un motiv să cauți long-uri pe pullback, nu short-uri.",
              en: "The classic textbook says: RSI above 70 = **overbought** (expensive, sell), below 30 = **oversold** (cheap, buy). It sounds logical and it's dangerously false in trends.\n\nIn a strong trend, RSI can sit above 70 for days or weeks while price keeps climbing. Overbought doesn't mean 'a fall is coming' — it means **strength**: buyers are dominating aggressively. Whoever sold Bitcoin in 2020 'because RSI was overbought' sold at the start of a price doubling.\n\nThe correct distinction is about regime:\n\n- **In a range** (sideways market) — RSI extremes genuinely work: at 70 price is near the range's resistance, at 30 near its support. Mean reversion makes sense.\n- **In a trend** — RSI extremes are signs of STRENGTH, not reversal. An overbought RSI in an uptrend is a reason to look for longs on the pullback, not shorts.",
            },
            warning: {
              ro: "Gândirea „e scump, trebuie să scadă” a ars nenumărate conturi. Prețul nu e un elastic care se întoarce automat la loc — overbought poate deveni și mai overbought. Nu vinde niciodată DOAR pentru că RSI e peste 70.",
              en: "The 'it's expensive, it has to fall' mindset has burned countless accounts. Price is not a rubber band that automatically snaps back — overbought can get even more overbought. Never sell ONLY because RSI is above 70.",
            },
          },
          {
            heading: { ro: "Divergențele — folosirea onestă", en: "Divergences — the honest use" },
            body: {
              ro: "Adevărata valoare a RSI e **divergența**: momentul în care prețul și indicatorul spun povești diferite.\n\n- **Divergență bearish** — prețul face un Higher High, dar RSI face un vârf MAI JOS decât precedentul. Traducere: noul maxim de preț s-a construit cu mai puțin momentum. Motorul tușește.\n- **Divergență bullish** — prețul face Lower Low, RSI face un minim mai sus. Presiunea de vânzare se stinge.\n\nÎn diagrama de mai jos, prețul urcă spre un nou maxim (HH), dar schița RSI de sub preț arată al doilea vârf mai jos (LH): exact anatomia unei divergențe bearish, urmată de rollover.\n\nEsențial: divergența e un **avertisment, nu un ordin de intrare**. Divergențele pot „încărca” mult timp înainte ca prețul să se întoarcă — în trenduri puternice apar și trei-patru divergențe consecutive călcate în picioare. Aștepți întotdeauna confirmarea structurii: ruperea unui swing, un pattern de inversare, o închidere sub nivelul cheie.",
              en: "RSI's real value is the **divergence**: the moment price and the indicator tell different stories.\n\n- **Bearish divergence** — price prints a Higher High, but RSI prints a LOWER peak than the previous one. Translation: the new price high was built with less momentum. The engine is sputtering.\n- **Bullish divergence** — price prints a Lower Low, RSI a higher low. Selling pressure is fading.\n\nIn the diagram below, price pushes to a new high (HH), but the RSI sketch under the price shows a second, lower peak (LH): the exact anatomy of a bearish divergence, followed by the rollover.\n\nEssential: a divergence is a **warning, not an entry order**. Divergences can 'load up' long before price actually turns — strong trends routinely steamroll three or four consecutive divergences. Always wait for structural confirmation: a swing break, a reversal pattern, a close below the key level.",
            },
            diagram: "m5-rsi-divergence",
          },
          {
            heading: { ro: "Cum îl folosești concret", en: "How to use it in practice" },
            body: {
              ro: "- **Setarea standard** — RSI(14). Rezistă tentației de a-l „optimiza” la 7 sau 21 după fiecare săptămână slabă: schimbi zgomotul, nu avantajul.\n- **Divergență + structură** — cea mai bună utilizare: divergență bearish PE un double top, sau divergență bullish PE un retest de suport major. Indicatorul confirmă ideea dată de preț.\n- **Regim înainte de semnal** — întreabă-te întâi: sunt în trend sau în range? Abia apoi decide ce înseamnă valoarea RSI.\n\nNu mă crede pe cuvânt: pagina de **Backtesting din TradeGx** are RSI printre cei 15+ indicatori disponibili. Testează singur regula „vinde la RSI 70” pe EURUSD sau BTC pe doi ani de date — apoi testează „cumpără pullback în uptrend când RSI iese din 40”. Diferența dintre cele două statistici e toată lecția asta, demonstrată cu cifrele tale.",
              en: "- **Standard setting** — RSI(14). Resist the urge to 'optimize' it to 7 or 21 after every weak week: you're changing the noise, not the edge.\n- **Divergence + structure** — the best use: a bearish divergence ON a double top, or a bullish divergence ON a major support retest. The indicator confirms the idea price gave you.\n- **Regime before signal** — first ask: am I in a trend or a range? Only then decide what the RSI value means.\n\nDon't take my word for it: the **TradeGx Backtesting** page includes RSI among its 15+ available indicators. Test the 'sell at RSI 70' rule yourself on two years of EURUSD or BTC data — then test 'buy the pullback in an uptrend when RSI climbs out of 40'. The difference between those two statistics is this entire lesson, proven with your own numbers.",
            },
            tip: {
              ro: "Marchează în jurnalul TradeGx fiecare tranzacție în care divergența RSI a făcut parte din decizie (un tag simplu: „rsi-div”). După 30 de tranzacții vei ști exact cât valorează divergențele în sistemul TĂU — nu în cel din cărți.",
              en: "Tag every trade in your TradeGx journal where an RSI divergence was part of the decision (a simple tag: 'rsi-div'). After 30 trades you'll know exactly what divergences are worth in YOUR system — not the one in books.",
            },
          },
        ],
      },
      {
        id: "macd",
        title: { ro: "MACD: trend și momentum", en: "MACD: trend and momentum" },
        minutes: 9,
        sections: [
          {
            body: {
              ro: "**MACD (Moving Average Convergence Divergence)** e un indicator de trend și momentum construit din trei piese:\n\n- **Linia MACD** — diferența dintre două medii mobile exponențiale: EMA(12) − EMA(26). Când e peste zero, media rapidă e deasupra celei lente → bias bullish; sub zero, bias bearish.\n- **Linia de semnal** — EMA(9) aplicată chiar pe linia MACD: o versiune „netezită” a ei.\n- **Histograma** — distanța dintre linia MACD și linia de semnal, desenată ca bare. E partea cea mai subestimată: arată ACCELERAREA sau frânarea momentum-ului.\n\nCitirea de bază: linia MACD peste zero și în creștere = trend ascendent care accelerează. Linia sub zero și în scădere = trend descendent în forță.",
              en: "**MACD (Moving Average Convergence Divergence)** is a trend-and-momentum indicator built from three pieces:\n\n- **The MACD line** — the difference between two exponential moving averages: EMA(12) − EMA(26). Above zero, the fast average is above the slow one → bullish bias; below zero, bearish bias.\n- **The signal line** — an EMA(9) applied to the MACD line itself: a 'smoothed' version of it.\n- **The histogram** — the distance between the MACD line and the signal line, drawn as bars. It's the most underrated part: it shows momentum ACCELERATING or braking.\n\nThe basic read: MACD line above zero and rising = an uptrend gaining speed. Below zero and falling = a downtrend in force.",
            },
          },
          {
            heading: { ro: "Cele două tipuri de cross", en: "The two types of cross" },
            body: {
              ro: "- **Signal cross** — linia MACD taie linia de semnal. E semnalul „rapid”: apare des, prinde devreme schimbările de momentum, dar generează și multe alarme false.\n- **Zero-line cross** — linia MACD trece prin zero (adică EMA12 traversează EMA26). E semnalul „lent”: mult mai rar, confirmă schimbări reale de trend, dar vine târziu — o bucată din mișcare e deja consumată.\n\nÎn diagrama de mai jos, schița MACD de sub preț traversează linia de zero exact când prețul își construiește baza și pornește noul trend — iar spre final, MACD se apleacă în timp ce prețul mai face un maxim: divergență, momentum-ul se stinge înaintea prețului.\n\nCombinația practică folosită de mulți traderi: zero-line pe timeframe-ul mare stabilește DIRECȚIA (tranzacționezi doar long cât MACD e peste zero pe H4/D1), iar signal cross pe timeframe-ul mic dă MOMENTUL intrării, în acea direcție.",
              en: "- **Signal cross** — the MACD line crosses the signal line. It's the 'fast' signal: frequent, catches momentum shifts early, but produces plenty of false alarms.\n- **Zero-line cross** — the MACD line crosses zero (meaning EMA12 crosses EMA26). It's the 'slow' signal: much rarer, confirms genuine trend changes, but arrives late — part of the move is already spent.\n\nIn the diagram below, the MACD sketch under the price crosses the zero line exactly as price builds its base and starts the new trend — and near the end, MACD rolls over while price makes one more high: a divergence, momentum dying before price does.\n\nThe practical combination many traders use: the zero-line on the higher timeframe sets the DIRECTION (only trade long while MACD is above zero on H4/D1), and the signal cross on the lower timeframe provides the entry TIMING, in that direction.",
            },
            diagram: "m5-macd-cross",
          },
          {
            heading: { ro: "Histograma: sistemul de avertizare timpurie", en: "The histogram: your early-warning system" },
            body: {
              ro: "Histograma răspunde la o singură întrebare: distanța dintre MACD și semnal CREȘTE sau SCADE?\n\n- Bare care cresc = momentum în accelerare — trendul are combustibil.\n- Bare care se scurtează, chiar dacă rămân pe aceeași parte = momentum în frânare — prima fisură, vizibilă ÎNAINTE de orice cross.\n\nDe aici vine și cea mai fină utilizare a MACD: divergența pe histogramă sau pe linia MACD (preț la maxime noi, MACD la vârfuri tot mai joase), citită la fel ca divergența RSI din lecția anterioară. Când ambele spun același lucru la o zonă importantă, avertismentul devine greu de ignorat.",
              en: "The histogram answers a single question: is the distance between MACD and signal GROWING or SHRINKING?\n\n- Growing bars = accelerating momentum — the trend has fuel.\n- Shrinking bars, even while staying on the same side = braking momentum — the first crack, visible BEFORE any cross.\n\nThis is also where MACD's most refined use comes from: divergence on the histogram or the MACD line (price at new highs, MACD at ever-lower peaks), read exactly like the RSI divergence from the previous lesson. When both say the same thing at an important zone, the warning becomes hard to ignore.",
            },
          },
          {
            heading: { ro: "Onestitate: lag dublu și whipsaw", en: "Honesty: double lag and whipsaw" },
            body: {
              ro: "MACD e construit din medii mobile, iar linia de semnal e o medie a unei diferențe de medii — **lag peste lag**, prin definiție. Consecințele practice:\n\n- În **range**, crossurile MACD sunt o mașină de whipsaw: cumperi sus, vinzi jos, în buclă. MACD are nevoie de trend ca să fie util.\n- Semnalul vine mereu DUPĂ ce mișcarea a început. Nu e un defect, e prețul plătit pentru filtrarea zgomotului — dar trebuie să-l știi ca să nu aștepți de la indicator ce nu poate oferi.\n\nRegula de aur rămâne aceeași ca la RSI: MACD confirmă, nu decide. Structura de preț decide.",
              en: "MACD is built from moving averages, and the signal line is an average of a difference of averages — **lag on top of lag**, by definition. The practical consequences:\n\n- In a **range**, MACD crosses are a whipsaw machine: buy high, sell low, on repeat. MACD needs a trend to be useful.\n- The signal always arrives AFTER the move has started. That's not a flaw, it's the price paid for filtering noise — but you must know it, so you don't expect what the indicator can't deliver.\n\nThe golden rule stays the same as with RSI: MACD confirms, it doesn't decide. Price structure decides.",
            },
            tip: {
              ro: "Testează pe pagina de Backtesting din TradeGx (MACD e inclus): compară „signal cross simplu” cu „signal cross DOAR în direcția zero-line de pe TF-ul mare”. A doua variantă filtrează exact whipsaw-ul din range — vezi diferența direct în win rate și drawdown.",
              en: "Test it on the TradeGx Backtesting page (MACD is included): compare 'plain signal cross' against 'signal cross ONLY in the direction of the higher-TF zero-line'. The second variant filters out exactly the range whipsaw — you'll see the difference directly in win rate and drawdown.",
            },
            warning: {
              ro: "Nu tranzacționa crossuri MACD într-o piață laterală. Dacă prețul e într-un range evident, indicatorul va traversa liniile la nesfârșit fără nicio mișcare reală în spate — fiecare cross e o mică tăietură în cont.",
              en: "Don't trade MACD crosses in a sideways market. If price is in an obvious range, the indicator will cross its lines endlessly with no real move behind them — every cross is another small cut to the account.",
            },
          },
        ],
      },
      {
        id: "bollinger-bands",
        title: { ro: "Bollinger Bands: mean reversion sau breakout?", en: "Bollinger Bands: mean reversion or breakout?" },
        minutes: 9,
        sections: [
          {
            body: {
              ro: "**Bollinger Bands** sunt un „plic” de volatilitate în jurul prețului: o medie mobilă simplă de 20 de perioade (**banda din mijloc**) plus/minus **două deviații standard**. Pentru că deviația standard se calculează din prețurile recente, benzile respiră odată cu piața: se strâng când e liniște, se umflă când e furtună.\n\nAsta le face speciale: nu îți arată doar UNDE e prețul, ci și CÂT de neobișnuită e poziția lui față de comportamentul recent. Statistic, marea majoritate a închiderilor rămâne între benzi — o atingere a benzii e, prin definiție, un eveniment de margine.\n\nCapcana clasică: „preț la banda de sus = vinde”. Exact ca la RSI, interpretarea corectă depinde de REGIMUL pieței.",
              en: "**Bollinger Bands** are a volatility 'envelope' around price: a 20-period simple moving average (**the middle band**) plus/minus **two standard deviations**. Because the standard deviation is computed from recent prices, the bands breathe with the market: they tighten when it's quiet and inflate when it storms.\n\nThat's what makes them special: they show not just WHERE price is, but HOW unusual its position is relative to recent behavior. Statistically, the large majority of closes stay inside the bands — a band touch is, by definition, an edge event.\n\nThe classic trap: 'price at the upper band = sell'. Exactly as with RSI, the correct interpretation depends on the market's REGIME.",
            },
          },
          {
            heading: { ro: "Două piețe, două citiri opuse", en: "Two markets, two opposite reads" },
            body: {
              ro: "- **În range: mean reversion.** Prețul oscilează între benzi ca într-un culoar: atingerea benzii de sus tinde să fie urmată de întoarcerea spre medie, atingerea benzii de jos la fel. Fade-ul extremelor funcționează — cât timp range-ul ține.\n- **În trend: walking the bands.** La un breakout real, prețul se „lipește” de banda exterioară și MERGE pe ea lumânare după lumânare. Fiecare atingere a benzii nu mai e semnal de vânzare — e dovadă de forță. Cine face fade unui walk donează bani trendului.\n\nDiagrama arată exact tranziția: în stânga, prețul face ping-pong în interiorul benzilor (mean reversion); în dreapta, după breakout, benzile se lărgesc și prețul călărește banda superioară, cu banda din mijloc ca suport dinamic.\n\nCum le deosebești în timp real? Trei indicii: panta benzii din mijloc (orizontală = range, înclinată = trend), lărgimea benzilor (expansiune bruscă = regim nou) și comportamentul pullback-urilor (în walk, corecțiile se opresc la banda din mijloc, nu mai traversează spre banda opusă).",
              en: "- **In a range: mean reversion.** Price oscillates between the bands like a corridor: an upper-band touch tends to be followed by a return to the mean, a lower-band touch likewise. Fading the extremes works — as long as the range holds.\n- **In a trend: walking the bands.** On a real breakout, price 'glues' itself to the outer band and WALKS it, candle after candle. Each band touch is no longer a sell signal — it's proof of strength. Fading a walk is donating money to the trend.\n\nThe diagram shows exactly this transition: on the left, price ping-pongs inside the bands (mean reversion); on the right, after the breakout, the bands widen and price rides the upper band, with the middle band as dynamic support.\n\nHow do you tell them apart in real time? Three clues: the middle band's slope (flat = range, tilted = trend), the bands' width (sudden expansion = new regime) and pullback behavior (in a walk, corrections stop at the middle band instead of crossing to the opposite one).",
            },
            diagram: "m5-bollinger",
            warning: {
              ro: "Cea mai frecventă sinucidere cu Bollinger: shorturi repetate „pentru că prețul a atins banda de sus” într-un trend care abia a început să meargă pe bandă. Prima întrebare nu e „unde e prețul față de bandă?”, ci „în ce regim e piața?”.",
              en: "The most common Bollinger suicide: repeated shorts 'because price touched the upper band' in a trend that has just started walking it. The first question is never 'where is price relative to the band?' but 'what regime is the market in?'.",
            },
          },
          {
            heading: { ro: "Squeeze-ul: liniștea dinaintea furtunii", en: "The squeeze: the calm before the storm" },
            body: {
              ro: "Când benzile se strâng la o lățime neobișnuit de mică (**squeeze**), piața îți spune că volatilitatea s-a comprimat — iar compresiile, cum ai văzut și la triunghiuri în modulul de Chart Patterns, preced expansiunile.\n\nSqueeze-ul NU îți spune direcția. Îți spune doar să fii atent: urmează o mișcare. Combinația firească e squeeze + structură: dacă compresia se formează sub o rezistență cu minime crescătoare (triunghi ascendent), ai și direcția probabilă, și momentul.\n\nAtenție și la prima mișcare de după squeeze: expansiunea inițială e uneori falsă (head-fake), cu mișcarea reală în direcția opusă — încă un motiv să ceri închidere de lumânare și confirmare de structură, nu doar prima bară colorată.",
              en: "When the bands tighten to an unusually narrow width (the **squeeze**), the market is telling you volatility has compressed — and compressions, as you saw with triangles in the Chart Patterns module, precede expansions.\n\nThe squeeze does NOT tell you the direction. It only tells you to pay attention: a move is coming. The natural combination is squeeze + structure: if the compression builds under a resistance with rising lows (an ascending triangle), you have the likely direction and the timing.\n\nAlso beware the first move after a squeeze: the initial expansion is sometimes a head-fake, with the real move in the opposite direction — one more reason to demand a candle close and structural confirmation, not just the first colored bar.",
            },
          },
          {
            heading: { ro: "Reguli pe care le poți testa azi", en: "Rules you can test today" },
            body: {
              ro: "Bollinger Bands sunt printre indicatorii disponibili în **Backtesting-ul TradeGx**, așa că lecția se poate transforma imediat în cifre. Trei reguli clasice de comparat pe același instrument și aceeași perioadă:\n\n- **Mean reversion pur** — cumpără la atingerea benzii de jos, ieși la banda din mijloc. Funcționează în range, sângerează în trend.\n- **Breakout** — cumpără la închidere peste banda de sus după un squeeze, trail pe banda din mijloc. Opusul aproape perfect al primei reguli.\n- **Pullback în trend** — cât banda din mijloc urcă, cumpără atingerile ei și ieși la banda superioară.\n\nAceeași unealtă, trei filosofii diferite. Rezultatele pe datele tale îți vor spune care se potrivește instrumentului și stilului tău — asta e exact diferența dintre a „ști” un indicator și a-l folosi.",
              en: "Bollinger Bands are among the indicators available in **TradeGx Backtesting**, so this lesson can turn into numbers immediately. Three classic rules to compare on the same instrument and period:\n\n- **Pure mean reversion** — buy the lower-band touch, exit at the middle band. Works in ranges, bleeds in trends.\n- **Breakout** — buy a close above the upper band after a squeeze, trail on the middle band. The near-perfect opposite of the first rule.\n- **Trend pullback** — while the middle band rises, buy its touches and exit at the upper band.\n\nSame tool, three different philosophies. The results on your data will tell you which fits your instrument and style — that's exactly the difference between 'knowing' an indicator and using one.",
            },
            tip: {
              ro: "În trenduri, banda din mijloc (SMA 20) e un trailing stop natural: cât timp lumânările închid deasupra ei, trendul respiră normal. Prima închidere clară sub ea e un semnal onest de degradare — mult mai util decât o țintă fixă aleasă la întâmplare.",
              en: "In trends, the middle band (SMA 20) is a natural trailing stop: as long as candles close above it, the trend is breathing normally. The first clear close below it is an honest degradation signal — far more useful than an arbitrary fixed target.",
            },
          },
        ],
      },
      {
        id: "stochastic-atr",
        title: { ro: "Stochastic și ATR: timing și dimensionarea stopului", en: "Stochastic and ATR: timing and stop sizing" },
        minutes: 10,
        sections: [
          {
            heading: { ro: "Stochastic: unde a închis prețul în range-ul recent", en: "Stochastic: where price closed within the recent range" },
            body: {
              ro: "**Stochastic Oscillator** răspunde la o întrebare simplă: unde a închis ultima lumânare față de range-ul ultimelor N perioade (implicit 14)? Închidere lângă maximele recente → valoare spre 100; lângă minime → spre 0. Linia principală se numește **%K**, iar **%D** e media ei mobilă — crossurile dintre ele dau semnalele.\n\nPragurile clasice sunt 80 (overbought) și 20 (oversold) — și da, e aceeași capcană ca la RSI: în trend, Stochastic stă lipit de extremă exact când mișcarea e mai sănătoasă.\n\nFolosirea lui onestă e ca **unealtă de timing în direcția trendului**: într-un uptrend confirmat de structură, aștepți pullback-ul, lași Stochastic să intre în zona 20 și intri long când %K taie %D în sus, ieșind din oversold. Nu prezice nimic — doar sincronizează intrarea cu momentul în care corecția dă semne că s-a terminat.",
              en: "The **Stochastic Oscillator** answers a simple question: where did the last candle close relative to the range of the past N periods (14 by default)? A close near the recent highs → value toward 100; near the lows → toward 0. The main line is **%K**, and **%D** is its moving average — their crosses produce the signals.\n\nThe classic thresholds are 80 (overbought) and 20 (oversold) — and yes, it's the same trap as RSI: in a trend, Stochastic pins itself to the extreme precisely when the move is healthiest.\n\nIts honest use is as a **timing tool in the trend's direction**: in a structurally confirmed uptrend, you wait for the pullback, let Stochastic dip into the 20 zone, and go long when %K crosses %D upward, exiting oversold. It predicts nothing — it simply synchronizes your entry with the moment the correction shows signs of being done.",
            },
          },
          {
            heading: { ro: "ATR: cât „respiră” piața", en: "ATR: how much the market 'breathes'" },
            body: {
              ro: "**ATR (Average True Range)** e cel mai subestimat indicator din toată lista — pentru că nu dă semnale deloc. ATR măsoară media amplitudinii reale a ultimelor 14 lumânări (inclusiv gap-urile) și îți spune un singur lucru: **cât se mișcă instrumentul, în unități de preț, într-o perioadă tipică**.\n\nNu are direcție, nu are overbought — are doar adevăr: EURUSD pe H1 respiră poate 15–20 pips, aurul poate de zece ori mai mult. Iar informația asta rezolvă cea mai frecventă cauză de stop-uri „vânate”: stopul pus mai aproape decât zgomotul natural al pieței.\n\nRegula practică: **stopul minim = 1.5 × ATR** față de intrare (mulți traderi folosesc 1.5–2×). Un stop mai strâns decât 1×ATR nu e „agresiv” — e statistic condamnat: o singură lumânare obișnuită îl poate atinge fără ca ideea ta să fie greșită.",
              en: "**ATR (Average True Range)** is the most underrated indicator on the entire list — because it gives no signals at all. ATR averages the true range of the last 14 candles (gaps included) and tells you exactly one thing: **how much the instrument moves, in price units, over a typical period**.\n\nNo direction, no overbought — just truth: EURUSD on H1 breathes maybe 15–20 pips, gold perhaps ten times that. And this information solves the most common cause of 'hunted' stops: a stop placed closer than the market's natural noise.\n\nThe practical rule: **minimum stop = 1.5 × ATR** from entry (many traders use 1.5–2×). A stop tighter than 1×ATR isn't 'aggressive' — it's statistically doomed: a single ordinary candle can hit it without your idea being wrong.",
            },
            diagram: "m5-atr-stop",
          },
          {
            heading: { ro: "Exemplul numeric complet", en: "The complete numeric example" },
            body: {
              ro: "Să legăm ATR de mărimea poziției — aici e bijuteria practică a lecției:\n\n- **Instrument:** EURUSD, timeframe H1, ATR(14) = 18 pips.\n- **Intrare:** long la 1.0850, pe retestul unui nivel rupt.\n- **Stop:** 1.5 × ATR = 27 pips → 1.0823. Sub zgomotul normal al pieței ȘI sub swing-ul tehnic.\n- **Cont:** 5.000 $, risc pe tranzacție 1% → 50 $.\n- **Calculul lotului:** 50 $ ÷ 27 pips ≈ 1.85 $/pip. La EURUSD, 1 lot standard ≈ 10 $/pip → 1.85 ÷ 10 = **0.18 loturi**.\n\nObservă ordinea: întâi distanța de stop (dictată de volatilitate și structură), ABIA APOI lotul. Traderii care pierd fac invers: aleg lotul „care le place” și apoi strâng stopul până încape — adică își pun singuri stopul în zona de zgomot.\n\nAceeași formulă te scalează corect pe orice instrument: la XAUUSD cu ATR de 180 de puncte, stopul e proporțional mai larg și lotul proporțional mai mic — riscul în bani rămâne identic: 1%.",
              en: "Let's connect ATR to position sizing — this is the lesson's practical gem:\n\n- **Instrument:** EURUSD, H1 timeframe, ATR(14) = 18 pips.\n- **Entry:** long at 1.0850, on the retest of a broken level.\n- **Stop:** 1.5 × ATR = 27 pips → 1.0823. Below the market's normal noise AND below the technical swing.\n- **Account:** $5,000, risk per trade 1% → $50.\n- **Lot calculation:** $50 ÷ 27 pips ≈ $1.85/pip. On EURUSD, 1 standard lot ≈ $10/pip → 1.85 ÷ 10 = **0.18 lots**.\n\nNotice the order: first the stop distance (dictated by volatility and structure), ONLY THEN the lot. Losing traders do it backwards: they pick the lot they 'like' and then squeeze the stop until it fits — placing their own stop inside the noise zone.\n\nThe same formula scales you correctly across instruments: on XAUUSD with a 180-point ATR, the stop is proportionally wider and the lot proportionally smaller — the money risk stays identical: 1%.",
            },
            tip: {
              ro: "Notează ATR-ul de la momentul intrării în jurnalul TradeGx, la fiecare tranzacție. La review-ul săptămânal, verifică stop-urile lovite: câte erau mai aproape de 1×ATR? Acela nu e ghinion — e un stop pus în zgomot, și e complet reparabil.",
              en: "Log the ATR at entry time in your TradeGx journal for every trade. At your weekly review, check the stopped-out trades: how many had stops closer than 1×ATR? That's not bad luck — it's a stop placed inside the noise, and it's completely fixable.",
            },
            warning: {
              ro: "Stopul fix „universal” (mereu 20 de pips, orice ar fi) ignoră complet volatilitatea: e sufocant pe aur și inutil de larg pe EURUSD într-o zi liniștită. Distanța de stop se calculează din ATR și structură, per instrument și per timeframe — nu se copiază de la o piață la alta.",
              en: "The 'universal' fixed stop (always 20 pips, no matter what) completely ignores volatility: suffocating on gold, needlessly wide on EURUSD during a quiet day. Stop distance is computed from ATR and structure, per instrument and per timeframe — never copied from one market to another.",
            },
          },
          {
            heading: { ro: "ATR dincolo de stop", en: "ATR beyond the stop" },
            body: {
              ro: "- **Trailing stop dinamic** — mută stopul la 2×ATR sub fiecare nou maxim al mișcării (tehnica „chandelier”): trendurile liniștite îți strâng stopul, cele volatile îi lasă loc să respire.\n- **Verificarea realistă a țintei** — dacă ATR-ul zilnic e de 60 de pips, o țintă intraday de 150 de pips e o fantezie: ceri pieței trei zile de mișcare într-o singură sesiune.\n- **Filtru de regim** — un ATR care crește brusc semnalează schimbare de regim (știri, volatilitate nouă); multe strategii de range merită oprite exact atunci.",
              en: "- **Dynamic trailing stop** — trail the stop 2×ATR below each new high of the move (the 'chandelier' technique): quiet trends tighten your stop, volatile ones give it room to breathe.\n- **Realistic target check** — if the daily ATR is 60 pips, a 150-pip intraday target is a fantasy: you're asking the market for three days of movement in a single session.\n- **Regime filter** — a suddenly rising ATR signals a regime change (news, fresh volatility); many range strategies deserve to be switched off exactly then.",
            },
          },
        ],
      },
      {
        id: "fibonacci-si-indicator-soup",
        title: { ro: "Fibonacci și capcana „indicator soup”", en: "Fibonacci and the 'indicator soup' trap" },
        minutes: 10,
        sections: [
          {
            heading: { ro: "Retracement: harta pullback-ului", en: "Retracement: the pullback map" },
            body: {
              ro: "**Fibonacci retracement** măsoară cât de adânc corectează prețul dintr-un impuls. Tragi unealta de la minimul la maximul mișcării (swing low → swing high pentru un impuls ascendent), iar nivelurile-cheie apar automat: **38.2%**, **50%** și **61.8%** din mișcare.\n\nCitirea practică:\n\n- **Retragere superficială (până în 38.2%)** — trend agresiv; cumpărătorii nu lasă prețul să respire. Continuarea vine adesea rapid.\n- **Zona 50–61.8%** — adâncimea „clasică” a corecțiilor sănătoase; aici caută intrări majoritatea traderilor de trend. De aceea intervalul e poreclit **golden zone**.\n- **Dincolo de 78.6%** — corecția a mâncat aproape tot impulsul; ideea de continuare slăbește serios, iar probabilitatea de inversare crește.\n\nÎn diagramă: impuls din 20 în 80, pullback care înțeapă exact nivelul de 61.8% (43), respingere și continuarea trendului spre maxime noi.",
              en: "**Fibonacci retracement** measures how deeply price corrects within an impulse. You drag the tool from the move's low to its high (swing low → swing high for an upward impulse), and the key levels appear automatically: **38.2%**, **50%** and **61.8%** of the move.\n\nThe practical read:\n\n- **Shallow retracement (up to 38.2%)** — an aggressive trend; buyers won't let price breathe. Continuation often comes fast.\n- **The 50–61.8% zone** — the 'classic' depth of healthy corrections; this is where most trend traders hunt entries. Hence its nickname: the **golden zone**.\n- **Beyond 78.6%** — the correction has eaten almost the whole impulse; the continuation idea weakens seriously and reversal odds grow.\n\nIn the diagram: an impulse from 20 to 80, a pullback that stabs exactly into the 61.8% level (43), rejection, and the trend resuming toward new highs.",
            },
            diagram: "m5-fibonacci",
          },
          {
            heading: { ro: "Adevărul despre „numerele magice”", en: "The truth about the 'magic numbers'" },
            body: {
              ro: "Să fim onești: nu există nicio lege a naturii care obligă piețele să respecte raportul de aur. 50% nici măcar nu e un număr Fibonacci. Nivelurile funcționează din două motive mult mai banale:\n\n- **Sunt parțial auto-împlinite** — milioane de traderi și algoritmi se uită la aceleași niveluri și pun ordine acolo.\n- **Descriu o realitate statistică simplă** — corecțiile sănătoase tind natural să se oprească undeva între o treime și două treimi din impuls, cu sau fără Fibonacci pe grafic.\n\nConcluzia practică schimbă modul de folosire: Fibonacci NU e un semnal, e o **hartă de zone unde merită să cauți**. Nivelul devine tranzacționabil abia când peste el se suprapune altceva: un fost nivel de structură (S/R flip), o divergență RSI, un pattern de respingere. **Fibonacci + structură + confirmare** e un setup; Fibonacci singur e o linie pe grafic.",
              en: "Let's be honest: no law of nature forces markets to respect the golden ratio. 50% isn't even a Fibonacci number. The levels work for two far more mundane reasons:\n\n- **They're partly self-fulfilling** — millions of traders and algorithms watch the same levels and place orders there.\n- **They describe a simple statistical reality** — healthy corrections naturally tend to stop somewhere between one-third and two-thirds of the impulse, with or without Fibonacci on the chart.\n\nThe practical conclusion changes how you use it: Fibonacci is NOT a signal, it's a **map of zones worth watching**. A level becomes tradeable only when something else stacks on top of it: an old structural level (S/R flip), an RSI divergence, a rejection pattern. **Fibonacci + structure + confirmation** is a setup; Fibonacci alone is a line on a chart.",
            },
            tip: {
              ro: "Trasează Fibonacci DOAR pe impulsuri evidente (mișcări pe care le vezi fără să miji ochii) și păstrează aceeași convenție de trasare — de la fitil la fitil sau de la închidere la închidere, dar mereu la fel. Consecvența trasării bate „corectitudinea” ei.",
              en: "Draw Fibonacci ONLY on obvious impulses (moves you can see without squinting) and keep one drawing convention — wick-to-wick or close-to-close, but always the same. Consistency of drawing beats 'correctness' of drawing.",
            },
          },
          {
            heading: { ro: "Capcana „indicator soup”", en: "The 'indicator soup' trap" },
            body: {
              ro: "Acum, lecția care leagă tot modulul. Traseul clasic al începătorului: pierde cu RSI → adaugă MACD „pentru confirmare” → adaugă Stochastic, două medii, Bollinger și un nor Ichimoku → graficul devine un pom de Crăciun în care prețul abia se mai vede. Asta e **indicator soup**.\n\nDe ce nu funcționează:\n\n- **Toți indicatorii derivă din același preț.** RSI, MACD și Stochastic măsoară toți momentum-ul, cu formule diferite. Trei indicatori care spun „da” nu înseamnă trei confirmări independente — înseamnă aceeași informație afișată de trei ori. E ca și cum ai cere trei opinii medicale... aceluiași doctor.\n- **Paralizie decizională.** Cu șapte indicatori, mereu unul spune altceva. Rezultatul: ori nu intri niciodată, ori alegi retroactiv indicatorul care „confirmă” ce voiai oricum să faci.\n- **Curve fitting emoțional.** După fiecare pierdere, „lipsea un indicator”. Adaugi încă unul, optimizezi setările pe trecut și construiești un sistem perfect pentru piața de luna trecută.",
              en: "Now, the lesson that ties the whole module together. The beginner's classic path: lose with RSI → add MACD 'for confirmation' → add Stochastic, two moving averages, Bollinger and an Ichimoku cloud → the chart becomes a Christmas tree where you can barely see price anymore. That's **indicator soup**.\n\nWhy it doesn't work:\n\n- **All indicators derive from the same price.** RSI, MACD and Stochastic all measure momentum with different formulas. Three indicators saying 'yes' isn't three independent confirmations — it's the same information displayed three times. It's like getting three medical opinions... from the same doctor.\n- **Decision paralysis.** With seven indicators, one always disagrees. The result: either you never enter, or you retroactively pick the indicator that 'confirms' what you wanted to do anyway.\n- **Emotional curve fitting.** After every loss, 'an indicator was missing'. You add one more, optimize the settings on the past, and build a system perfect for last month's market.",
            },
            warning: {
              ro: "Dacă după o pierdere primul tău impuls e să ADAUGI ceva pe grafic, oprește-te. Problema nu e aproape niciodată indicatorul lipsă — e execuția, riscul sau contextul. Mai mulți indicatori corelați nu adaugă informație; adaugă doar zgomot cu aer de știință.",
              en: "If your first impulse after a loss is to ADD something to the chart, stop. The problem is almost never a missing indicator — it's execution, risk or context. More correlated indicators don't add information; they add noise dressed up as science.",
            },
          },
          {
            heading: { ro: "Rețeta anti-supă: roluri, nu colecții", en: "The anti-soup recipe: roles, not collections" },
            body: {
              ro: "Soluția e să alegi indicatorii după ROL, nu după număr. Un set complet are nevoie de exact trei funcții:\n\n- **Un filtru de direcție** — CE direcție am voie să tranzacționez? (structura prețului pe TF-ul mare, MACD zero-line sau o medie mobilă simplă — alegi UNA).\n- **O unealtă de timing** — CÂND intru în acea direcție? (pullback la golden zone, Stochastic ieșind din oversold, retest de nivel — UNA).\n- **O măsură de risc** — CÂT risc și unde e stopul? (ATR — aici nu există alternativă mai bună).\n\nTrei roluri, trei unelte, un grafic pe care se vede prețul. Orice al patrulea indicator trebuie să răspundă la o întrebare la care primele trei nu răspund — altfel e decor.\n\nȘi testul final, ca întotdeauna: pagina de **Backtesting din TradeGx** are RSI, MACD, Bollinger și restul printre cei 15+ indicatori. Construiește-ți combinația de trei, rulează-o pe doi ani de date, apoi loghează tranzacțiile live în jurnal cu tag-urile setup-ului. Când statistica TA spune că sistemul funcționează, nu mai ai nevoie de al patrulea indicator ca să ai încredere în el.",
              en: "The solution is to pick indicators by ROLE, not by count. A complete kit needs exactly three functions:\n\n- **A direction filter** — WHICH direction am I allowed to trade? (higher-TF price structure, the MACD zero-line or a simple moving average — pick ONE).\n- **A timing tool** — WHEN do I enter in that direction? (pullback into the golden zone, Stochastic exiting oversold, a level retest — ONE).\n- **A risk measure** — HOW MUCH do I risk and where's the stop? (ATR — no better alternative exists here).\n\nThree roles, three tools, a chart where you can still see the price. Any fourth indicator must answer a question the first three don't — otherwise it's decoration.\n\nAnd the final test, as always: the **TradeGx Backtesting** page has RSI, MACD, Bollinger and the rest among its 15+ indicators. Build your three-piece combination, run it on two years of data, then log your live trades in the journal with the setup's tags. Once YOUR statistics say the system works, you won't need a fourth indicator to trust it.",
            },
            tip: {
              ro: "Exercițiu cu efect garantat: o săptămână pe grafic complet gol — doar preț și niveluri. Apoi adaugă înapoi, pe rând, doar indicatorii a căror lipsă ai simțit-o CONCRET. Majoritatea traderilor descoperă că le lipseau maximum doi.",
              en: "An exercise with guaranteed effect: one week on a completely bare chart — just price and levels. Then add back, one at a time, only the indicators whose absence you CONCRETELY felt. Most traders discover they were missing two at most.",
            },
          },
        ],
      },
    ],
  },
  diagrams: {
    "m5-rsi-divergence": {
      candles: [
        { o: 40, h: 46, l: 38, c: 44 },
        { o: 44, h: 52, l: 42, c: 50 },
        { o: 50, h: 58, l: 48, c: 56 },
        { o: 56, h: 64, l: 54, c: 62 },
        { o: 62, h: 68, l: 60, c: 64 },
        { o: 64, h: 66, l: 56, c: 58 },
        { o: 58, h: 60, l: 52, c: 54 },
        { o: 54, h: 62, l: 53, c: 60 },
        { o: 60, h: 68, l: 58, c: 66 },
        { o: 66, h: 72, l: 64, c: 70 },
        { o: 70, h: 76, l: 68, c: 72 },
        { o: 72, h: 74, l: 62, c: 64 },
        { o: 64, h: 66, l: 54, c: 56 },
      ],
      line: [12, 16, 21, 25, 28, 22, 15, 18, 20, 21, 22, 16, 9],
      zones: [{ y1: 4, y2: 31, color: "#71717a" }],
      trend: [
        { x1: 4, y1: 69, x2: 10, y2: 77, color: "#f43f5e", dashed: true },
        { x1: 4, y1: 29, x2: 10, y2: 23, color: "#f59e0b", dashed: true },
      ],
      labels: [
        { x: 0.4, y: 8, text: "RSI", color: "#71717a" },
        { x: 6.6, y: 84, text: "Price: HH", color: "#f43f5e" },
        { x: 6.8, y: 34, text: "RSI: LH", color: "#f59e0b" },
      ],
      arrows: [{ x: 11, y: 79, dir: "down", color: "#f43f5e", label: "Reversal" }],
      caption: {
        ro: "Divergență bearish: prețul face un Higher High, dar RSI (schițat în panoul de jos) face un vârf mai jos — momentum-ul moare înaintea prețului.",
        en: "Bearish divergence: price prints a Higher High while RSI (sketched in the lower panel) prints a lower peak — momentum dies before price does.",
      },
    },
    "m5-macd-cross": {
      candles: [
        { o: 64, h: 68, l: 60, c: 62 },
        { o: 62, h: 64, l: 56, c: 58 },
        { o: 58, h: 60, l: 50, c: 52 },
        { o: 52, h: 54, l: 46, c: 48 },
        { o: 48, h: 52, l: 44, c: 46 },
        { o: 46, h: 50, l: 43, c: 48 },
        { o: 48, h: 54, l: 46, c: 52 },
        { o: 52, h: 58, l: 50, c: 56 },
        { o: 56, h: 64, l: 54, c: 62 },
        { o: 62, h: 68, l: 60, c: 66 },
        { o: 66, h: 72, l: 64, c: 70 },
        { o: 70, h: 74, l: 66, c: 68 },
        { o: 68, h: 72, l: 64, c: 66 },
      ],
      line: [10, 8, 7, 8, 10, 13, 17, 21, 24, 26, 27, 26, 24],
      zones: [{ y1: 4, y2: 31, color: "#71717a" }],
      levels: [{ y: 17, label: "MACD 0", color: "#71717a", dashed: true }],
      labels: [
        { x: 0.4, y: 7, text: "MACD", color: "#71717a" },
        { x: 10.5, y: 78, text: "Divergence", color: "#f59e0b" },
      ],
      arrows: [{ x: 6, y: 36, dir: "up", color: "#10b981", label: "Zero-line cross" }],
      caption: {
        ro: "Linia MACD (schițată jos) taie zero exact când prețul își termină baza și pornește trendul; la final, MACD coboară în timp ce prețul mai urcă o dată — divergență.",
        en: "The MACD line (sketched below) crosses zero right as price finishes its base and starts trending; at the end, MACD turns down while price pushes once more — divergence.",
      },
    },
    "m5-bollinger": {
      candles: [
        { o: 44, h: 52, l: 42, c: 50 },
        { o: 50, h: 58, l: 48, c: 56 },
        { o: 56, h: 59, l: 48, c: 50 },
        { o: 50, h: 52, l: 38, c: 40 },
        { o: 40, h: 44, l: 35, c: 42 },
        { o: 42, h: 50, l: 40, c: 48 },
        { o: 48, h: 56, l: 46, c: 52 },
        { o: 52, h: 60, l: 50, c: 58 },
        { o: 58, h: 66, l: 56, c: 64 },
        { o: 64, h: 70, l: 61, c: 68 },
        { o: 68, h: 75, l: 65, c: 73 },
        { o: 73, h: 80, l: 70, c: 78 },
        { o: 78, h: 85, l: 75, c: 82 },
        { o: 82, h: 88, l: 79, c: 86 },
      ],
      line: [47, 47, 48, 47, 46, 46, 47, 49, 52, 56, 60, 64, 68, 72],
      zones: [{ y1: 35, y2: 60, x1: 0, x2: 7.5, color: "#818cf8", label: "±2σ" }],
      trend: [
        { x1: 7.5, y1: 60, x2: 13.5, y2: 90, color: "#818cf8" },
        { x1: 7.5, y1: 35, x2: 13.5, y2: 62, color: "#818cf8" },
      ],
      labels: [
        { x: 3.4, y: 64, text: "Mean reversion", color: "#818cf8" },
        { x: 10.3, y: 93, text: "Walking the band", color: "#10b981" },
      ],
      arrows: [
        { x: 1.5, y: 63, dir: "down", color: "#f43f5e" },
        { x: 4, y: 31, dir: "up", color: "#10b981" },
      ],
      caption: {
        ro: "Două regimuri, două citiri: în range, atingerile benzilor se întorc la medie (linia din mijloc = SMA 20); după breakout, benzile se lărgesc și prețul „merge” pe banda superioară.",
        en: "Two regimes, two reads: in the range, band touches revert to the mean (middle line = SMA 20); after the breakout, the bands widen and price 'walks' the upper band.",
      },
    },
    "m5-atr-stop": {
      candles: [
        { o: 40, h: 48, l: 36, c: 44 },
        { o: 44, h: 50, l: 38, c: 42 },
        { o: 42, h: 52, l: 40, c: 50 },
        { o: 50, h: 56, l: 42, c: 46 },
        { o: 46, h: 54, l: 44, c: 52 },
        { o: 52, h: 60, l: 46, c: 50 },
        { o: 50, h: 58, l: 48, c: 56 },
        { o: 56, h: 62, l: 52, c: 58 },
        { o: 58, h: 64, l: 54, c: 60 },
        { o: 60, h: 68, l: 58, c: 66 },
        { o: 66, h: 70, l: 60, c: 62 },
        { o: 62, h: 72, l: 61, c: 70 },
      ],
      levels: [
        { y: 56, label: "Entry", color: "#818cf8" },
        { y: 52, label: "Tight stop — hit", color: "#f43f5e", dashed: true },
        { y: 44, label: "ATR stop (1.5×ATR)", color: "#10b981", dashed: true },
      ],
      labels: [{ x: 7.5, y: 48, text: "Stop out", color: "#f43f5e" }],
      caption: {
        ro: "Aceeași intrare, două stop-uri: cel strâns e atins de un simplu fitil de zgomot înainte ca trendul să continue; cel calibrat la 1.5×ATR supraviețuiește și prinde mișcarea.",
        en: "Same entry, two stops: the tight one gets hit by a routine noise wick before the trend continues; the one calibrated at 1.5×ATR survives and catches the move.",
      },
    },
    "m5-fibonacci": {
      candles: [
        { o: 24, h: 30, l: 20, c: 28 },
        { o: 28, h: 40, l: 26, c: 38 },
        { o: 38, h: 52, l: 36, c: 50 },
        { o: 50, h: 62, l: 48, c: 60 },
        { o: 60, h: 72, l: 58, c: 70 },
        { o: 70, h: 80, l: 68, c: 78 },
        { o: 78, h: 79, l: 68, c: 70 },
        { o: 70, h: 72, l: 60, c: 62 },
        { o: 62, h: 64, l: 52, c: 54 },
        { o: 54, h: 56, l: 42, c: 46 },
        { o: 46, h: 58, l: 44, c: 56 },
        { o: 56, h: 68, l: 54, c: 66 },
        { o: 66, h: 78, l: 64, c: 76 },
        { o: 76, h: 86, l: 74, c: 84 },
      ],
      levels: [
        { y: 80, label: "0%", color: "#71717a", dashed: true },
        { y: 57, label: "38.2%", color: "#71717a", dashed: true },
        { y: 50, label: "50%", color: "#71717a", dashed: true },
        { y: 43, label: "61.8%", color: "#f59e0b" },
        { y: 20, label: "100%", color: "#71717a", dashed: true },
      ],
      zones: [{ y1: 43, y2: 50, x1: 6, x2: 13.5, color: "#f59e0b", label: "Golden zone" }],
      arrows: [{ x: 9, y: 36, dir: "up", color: "#10b981", label: "Entry" }],
      caption: {
        ro: "Retracement pe un impuls 20→80: pullback-ul înțeapă exact 61.8% (golden zone), e respins și trendul continuă spre maxime noi.",
        en: "Retracement on a 20→80 impulse: the pullback stabs exactly into 61.8% (the golden zone), gets rejected, and the trend resumes toward new highs.",
      },
    },
  },
};
