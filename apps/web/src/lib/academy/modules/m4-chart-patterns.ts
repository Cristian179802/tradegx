import type { ModuleBundle } from "../types";

// ── M4: Chart Patterns (Intermediar) ─────────────────────────────────────────

export const M4_BUNDLE: ModuleBundle = {
  module: {
    id: "chart-patterns",
    level: "INTERMEDIATE",
    icon: "shapes",
    title: { ro: "Chart Patterns", en: "Chart Patterns" },
    description: {
      ro: "Head & Shoulders, double top, flags, triunghiuri și wedges — cum recunoști formațiunile clasice și, mai important, cum le tranzacționezi cu reguli clare de intrare, stop și țintă.",
      en: "Head & Shoulders, double tops, flags, triangles and wedges — how to recognize the classic formations and, more importantly, how to trade them with clear entry, stop and target rules.",
    },
    lessons: [
      {
        id: "inversari-head-shoulders",
        title: { ro: "Inversări I: Head & Shoulders", en: "Reversals I: Head & Shoulders" },
        minutes: 10,
        sections: [
          {
            body: {
              ro: "Pattern-urile grafice sunt forme repetitive pe care prețul le desenează atunci când raportul de forțe dintre cumpărători și vânzători se schimbă. Ele nu funcționează pentru că ar fi „desene magice” — funcționează pentru că surprind un proces real: epuizarea unei tabere și preluarea controlului de către cealaltă.\n\nÎn acest modul parcurgi formațiunile clasice în ordine logică: inversările majore (Head & Shoulders, double top), continuările (flags, pennants), compresiile (triunghiuri, wedges) și — cea mai importantă lecție — cum le tranzacționezi de fapt. Să recunoști un pattern e partea ușoară; să-l execuți cu reguli e ceea ce desparte analiza de profit.",
              en: "Chart patterns are repetitive shapes price draws when the balance of power between buyers and sellers shifts. They don't work because they're 'magic drawings' — they work because they capture a real process: one side getting exhausted and the other taking control.\n\nIn this module you'll cover the classic formations in logical order: major reversals (Head & Shoulders, double top), continuations (flags, pennants), compressions (triangles, wedges) and — the most important lesson — how to actually trade them. Recognizing a pattern is the easy part; executing it with rules is what separates analysis from profit.",
            },
          },
          {
            heading: { ro: "Anatomia Head & Shoulders", en: "The anatomy of Head & Shoulders" },
            body: {
              ro: "**Head & Shoulders** este cel mai cunoscut pattern de inversare a unui uptrend. Se construiește din trei vârfuri:\n\n- **Left Shoulder (umărul stâng)** — un maxim normal în trend, urmat de o corecție.\n- **Head (capul)** — un maxim MAI SUS, de fapt ultimul Higher High al trendului, urmat de o corecție care revine în aceeași zonă.\n- **Right Shoulder (umărul drept)** — o încercare de creștere care eșuează MAI JOS decât capul: primul Lower High.\n\n**Neckline** este linia care unește cele două minime formate între umeri și cap. Cât timp prețul se ține deasupra ei, pattern-ul rămâne o simplă ipoteză. Închiderea sub neckline este confirmarea: structura de uptrend (HH + HL) s-a rupt oficial, iar cine a cumpărat pe umărul drept este acum blocat pe pierdere — vânzările lor alimentează mișcarea în jos.",
              en: "**Head & Shoulders** is the best-known uptrend reversal pattern. It's built from three peaks:\n\n- **Left Shoulder** — a normal high in the trend, followed by a correction.\n- **Head** — a HIGHER high, in fact the trend's final Higher High, followed by a correction back into the same area.\n- **Right Shoulder** — a rally attempt that fails LOWER than the head: the first Lower High.\n\nThe **neckline** is the line connecting the two lows formed between the shoulders and the head. As long as price holds above it, the pattern is just a hypothesis. A close below the neckline is the confirmation: the uptrend structure (HH + HL) has officially broken, and everyone who bought the right shoulder is now trapped in a loss — their selling fuels the move down.",
            },
            diagram: "m4-head-shoulders",
            warning: {
              ro: "Fără un uptrend clar ÎNAINTE, nu există ce inversa. Trei cocoașe într-un range lateral nu sunt un Head & Shoulders — sunt zgomot. Pattern-ul are sens doar la capătul unei mișcări direcționale.",
              en: "Without a clear uptrend BEFORE it, there's nothing to reverse. Three bumps inside a sideways range are not a Head & Shoulders — they're noise. The pattern only means something at the end of a directional move.",
            },
          },
          {
            heading: { ro: "Ținta măsurată", en: "The measured target" },
            body: {
              ro: "Ținta clasică se calculează simplu: măsori distanța pe verticală de la vârful capului până la neckline (**înălțimea pattern-ului**) și o proiectezi în jos din punctul de break. În diagrama de mai sus: cap la 80, neckline la 45 → înălțime 35 → țintă la 10.\n\nDouă nuanțe practice:\n\n- Neckline-ul nu e mereu perfect orizontal — poate fi ușor înclinat. Trasează-l pe cele două minime reale, nu pe unde ți-ar conveni.\n- Ținta măsurată e o ESTIMARE, nu o garanție. Dacă în drum există un suport major (zonă de pe timeframe-ul mare), e adesea mai înțelept să închizi acolo o parte din poziție.",
              en: "The classic target is simple to compute: measure the vertical distance from the top of the head to the neckline (the **pattern height**) and project it downward from the break point. In the diagram above: head at 80, neckline at 45 → height 35 → target at 10.\n\nTwo practical nuances:\n\n- The neckline isn't always perfectly horizontal — it can slope slightly. Draw it on the two actual lows, not where you'd like it to be.\n- The measured target is an ESTIMATE, not a guarantee. If a major support sits along the way (a higher-timeframe zone), it's often wiser to bank part of the position there.",
            },
            tip: {
              ro: "Confirmarea corectă este ÎNCHIDEREA lumânării sub neckline, nu doar un fitil care înțeapă linia. Fitilele sub neckline urmate de reveniri rapide sunt clasicele capcane de lichiditate.",
              en: "Proper confirmation is a candle CLOSE below the neckline, not just a wick poking through. Wicks below the neckline followed by quick recoveries are the classic liquidity traps.",
            },
          },
          {
            heading: { ro: "Inverse Head & Shoulders", en: "Inverse Head & Shoulders" },
            body: {
              ro: "Varianta inversă apare la capătul unui **downtrend** și e oglinda perfectă: două minime (umerii) cu un minim MAI JOS între ele (capul — ultimul Lower Low), apoi un Higher Low pe umărul drept. Neckline-ul unește cele două maxime intermediare, iar confirmarea este închiderea DEASUPRA lui.\n\nLogica e identică: downtrend-ul încearcă un ultim Lower Low (capul), dar vânzătorii nu mai pot împinge — umărul drept se oprește mai sus, cumpărătorii preiau controlul, iar break-ul de neckline oficializează inversarea. Ținta: înălțimea capului proiectată în sus din break.\n\nMulți traderi îl consideră chiar mai fiabil decât varianta de top, pentru că acumularea de la minime tinde să fie un proces mai ordonat decât distribuția de la maxime.",
              en: "The inverse variant appears at the end of a **downtrend** and is a perfect mirror: two lows (the shoulders) with a LOWER low between them (the head — the final Lower Low), then a Higher Low on the right shoulder. The neckline connects the two intermediate highs, and confirmation is a close ABOVE it.\n\nThe logic is identical: the downtrend attempts one final Lower Low (the head), but sellers can't push anymore — the right shoulder stops higher, buyers take control, and the neckline break makes the reversal official. Target: the head's height projected upward from the break.\n\nMany traders consider it even more reliable than the topping variant, because accumulation at lows tends to be a more orderly process than distribution at highs.",
            },
          },
        ],
      },
      {
        id: "inversari-double-top",
        title: { ro: "Inversări II: Double Top și Double Bottom", en: "Reversals II: Double top and double bottom" },
        minutes: 8,
        sections: [
          {
            body: {
              ro: "**Double top** este povestea unui eșec repetat: prețul urcă, atinge un nivel, e respins, revine la același nivel... și e respins din nou. Două încercări, același rezultat — cumpărătorii nu au forța să treacă.\n\nCe se întâmplă de fapt la al doilea vârf? Cine a cumpărat lângă primul maxim și a suferit corecția abia așteaptă să iasă „pe zero” — vinde la retest. În același timp, vânzătorii agresivi văd exact același nivel și adaugă poziții. Cererea slăbește, oferta crește: al doilea vârf se formează de regulă cu momentum vizibil mai mic decât primul.",
              en: "A **double top** is the story of a repeated failure: price rallies, hits a level, gets rejected, returns to the same level... and gets rejected again. Two attempts, same result — buyers lack the strength to break through.\n\nWhat actually happens at the second peak? Whoever bought near the first high and sat through the correction can't wait to get out 'at breakeven' — they sell into the retest. Meanwhile, aggressive sellers see the exact same level and add positions. Demand weakens, supply grows: the second peak usually forms with visibly less momentum than the first.",
            },
          },
          {
            heading: { ro: "Confirmarea: break-ul de neckline", en: "Confirmation: the neckline break" },
            body: {
              ro: "Neckline-ul unui double top este minimul format ÎNTRE cele două vârfuri. Regula e aceeași ca la Head & Shoulders: pattern-ul NU există până când prețul nu închide sub neckline. Până atunci ai doar o rezistență testată de două ori — care poate foarte bine să se rupă în sus.\n\nȚinta măsurată: distanța de la vârfuri la neckline, proiectată în jos din break. În diagramă: vârfuri la ~66, neckline la 43 → înălțime 23 → țintă la 20.\n\n**Double bottom** e oglinda exactă la finalul unui downtrend — forma literei W: două minime aproximativ egale, neckline-ul e maximul dintre ele, confirmarea e închiderea deasupra.",
              en: "The neckline of a double top is the low formed BETWEEN the two peaks. The rule is the same as with Head & Shoulders: the pattern does NOT exist until price closes below the neckline. Until then, all you have is a resistance tested twice — which may very well break upward instead.\n\nMeasured target: the distance from the peaks to the neckline, projected down from the break. In the diagram: peaks at ~66, neckline at 43 → height 23 → target at 20.\n\nThe **double bottom** is the exact mirror at the end of a downtrend — a W shape: two roughly equal lows, the neckline is the high between them, confirmation is a close above it.",
            },
            diagram: "m4-double-top",
            warning: {
              ro: "Cea mai scumpă greșeală: să vinzi „pentru că prețul a ajuns iar la nivel”. La primul touch nu ai NICIUN pattern — ai o rezistență. Statistic, nivelurile se rup destul de des; fără confirmarea neckline-ului, tranzacționezi o monedă aruncată în aer.",
              en: "The most expensive mistake: selling 'because price reached the level again'. At the first touch you have NO pattern — you have a resistance. Levels break fairly often; without the neckline confirmation, you're trading a coin flip.",
            },
          },
          {
            heading: { ro: "Triple top și nuanța onestă", en: "Triple tops and the honest nuance" },
            body: {
              ro: "**Triple top / triple bottom** urmează exact aceeași logică, cu trei testări în loc de două — mai rar, dar cu aceeași confirmare (neckline) și aceeași metodă de măsurare a țintei.\n\nAici însă apare o nuanță pe care manualele clasice o omit: fiecare testare a unui nivel CONSUMĂ din ordinele care îl apără. Un nivel testat de 3–4–5 ori în intervale scurte, cu minime din ce în ce mai sus care se „lipesc” de rezistență, arată adesea a acumulare înainte de breakout, nu a inversare. Maximele egale sunt totodată un magnet de lichiditate: deasupra lor stau stop-urile vânzătorilor, iar jucătorii mari au tot interesul să le culeagă înainte de mișcarea reală.\n\nConcluzia practică: două testări cu momentum în scădere = potențială inversare. Testări repetate cu presiune crescândă dedesubt = potențial breakout. Contextul decide, nu forma în sine.",
              en: "**Triple top / triple bottom** follows exactly the same logic with three tests instead of two — rarer, but with the same confirmation (neckline) and the same target measurement.\n\nHere's a nuance the classic textbooks skip: every test of a level CONSUMES some of the orders defending it. A level tested 3–4–5 times in quick succession, with rising lows 'squeezing' into the resistance, often looks like accumulation before a breakout, not a reversal. Equal highs are also a liquidity magnet: sellers' stops sit right above them, and big players have every incentive to sweep those before the real move.\n\nThe practical takeaway: two tests with fading momentum = potential reversal. Repeated tests with growing pressure underneath = potential breakout. Context decides, not the shape itself.",
            },
            tip: {
              ro: "Confluența care ridică serios calitatea unui double top: divergență RSI pe al doilea vârf (preț la același nivel, RSI mai jos). O înveți în detaliu în modulul de Indicatori — cele două lecții se completează perfect.",
              en: "The confluence that seriously upgrades a double top: RSI divergence on the second peak (price at the same level, RSI lower). You'll learn it in detail in the Indicators module — the two lessons complement each other perfectly.",
            },
          },
        ],
      },
      {
        id: "continuari-flags",
        title: { ro: "Continuări: Flags și Pennants", en: "Continuations: flags and pennants" },
        minutes: 8,
        sections: [
          {
            body: {
              ro: "Trendurile nu urcă în linie dreaptă — se mișcă în ritm de **impuls → pauză → impuls**. Pattern-urile de continuare sunt exact aceste pauze: momente în care piața respiră, unii încasează profit, alții intră, iar apoi trendul își reia direcția.\n\n**Flag-ul (steagul)** este cel mai curat pattern de continuare: un impuls puternic și abrupt (**pole** — catargul), urmat de o consolidare îngustă, ușor înclinată CONTRA trendului (steagul propriu-zis). Contra-înclinarea e sănătoasă: arată că nu există presiune reală de vânzare, doar profit-taking ordonat.",
              en: "Trends don't move in a straight line — they move in a rhythm of **impulse → pause → impulse**. Continuation patterns are exactly these pauses: moments where the market breathes, some take profit, others get in, and then the trend resumes.\n\nThe **flag** is the cleanest continuation pattern: a strong, steep impulse (the **pole**), followed by a narrow consolidation gently sloping AGAINST the trend (the flag itself). The counter-slope is healthy: it shows there's no real selling pressure, just orderly profit-taking.",
            },
            diagram: "m4-bull-flag",
          },
          {
            heading: { ro: "Anatomia unui bull flag de calitate", en: "The anatomy of a quality bull flag" },
            body: {
              ro: "Nu orice pauză e un flag tranzacționabil. Criteriile care contează:\n\n- **Pole abrupt** — impulsul inițial trebuie să fie evident: lumânări mari, consecutive, în aceeași direcție. Fără pole, nu există flag.\n- **Retragere superficială** — steagul corectează ideal sub 38–50% din pole. O corecție mai adâncă de 50% ridică semne de întrebare asupra forței trendului.\n- **Durată scurtă** — câteva lumânări (orientativ 5–15). Cu cât consolidarea se lungește, cu atât avantajul continuării se diluează.\n- **Canal ordonat** — două linii aproximativ paralele, ușor descendente la bull flag, ascendente la bear flag.\n\nIntrarea clasică: break-ul liniei superioare a steagului. Ținta măsurată: **înălțimea pole-ului** proiectată din punctul de break — la un pole de 40 de puncte, te aștepți la încă ~40 după breakout.",
              en: "Not every pause is a tradeable flag. The criteria that matter:\n\n- **Steep pole** — the initial impulse must be obvious: large, consecutive candles in one direction. No pole, no flag.\n- **Shallow retracement** — the flag ideally corrects less than 38–50% of the pole. A retracement deeper than 50% questions the trend's strength.\n- **Short duration** — a handful of candles (roughly 5–15). The longer the consolidation drags, the more the continuation edge dilutes.\n- **Orderly channel** — two roughly parallel lines, gently sloping down for a bull flag, up for a bear flag.\n\nThe classic entry: the break of the flag's upper boundary. Measured target: the **pole's height** projected from the break point — a 40-point pole suggests roughly another 40 after the breakout.",
            },
            tip: {
              ro: "Ai două stiluri de intrare: agresiv — pe break-ul liniei steagului (intri devreme, risc de fakeout mai mare) sau conservator — pe break-ul maximului pole-ului (confirmare mai solidă, dar R:R puțin mai slab). Alege UNUL și rămâi consecvent, ca să-ți poți măsura statistica în jurnal.",
              en: "You have two entry styles: aggressive — on the break of the flag line (early entry, higher fakeout risk) or conservative — on the break of the pole's high (stronger confirmation, slightly worse R:R). Pick ONE and stay consistent, so you can measure your stats in the journal.",
            },
          },
          {
            heading: { ro: "Bear flags și pennants", en: "Bear flags and pennants" },
            body: {
              ro: "**Bear flag-ul** e oglinda exactă: impuls puternic în jos, consolidare îngustă ușor ASCENDENTĂ, apoi break sub linia inferioară și continuarea scăderii. Aceleași criterii de calitate, aceeași țintă măsurată.\n\n**Pennant-ul (fanionul)** diferă doar prin forma pauzei: în loc de canal paralel, consolidarea ia forma unui mic triunghi simetric — maxime tot mai jos și minime tot mai sus, imediat după pole. Tratamentul e identic cu al flag-ului: intrare pe break în direcția pole-ului, țintă = înălțimea pole-ului.\n\nAtenție la scară: pennant-ul e o formațiune MICĂ, de câteva lumânări, lipită de pole. Un triunghi mare, format în zeci de lumânări, e altă specie — o discutăm în lecția următoare.",
              en: "The **bear flag** is the exact mirror: strong impulse down, narrow consolidation sloping slightly UP, then a break below the lower line and continuation down. Same quality criteria, same measured target.\n\nThe **pennant** differs only in the pause's shape: instead of a parallel channel, the consolidation forms a small symmetrical triangle — lower highs and higher lows, right after the pole. Treatment is identical to the flag: enter on the break in the pole's direction, target = the pole's height.\n\nMind the scale: a pennant is a SMALL formation, a few candles, glued to the pole. A large triangle built over dozens of candles is a different species — covered in the next lesson.",
            },
            warning: {
              ro: "Un „flag” care se formează CONTRA trendului de pe timeframe-ul superior nu e un flag — e adesea chiar începutul inversării. Înainte să tranzacționezi o continuare, verifică direcția pe TF-ul mare (analiza top-down din modulul Bazele Tradingului). Continuările se tranzacționează DOAR în sensul trendului dominant.",
              en: "A 'flag' forming AGAINST the higher-timeframe trend is not a flag — it's often the very start of a reversal. Before trading a continuation, check the direction on the higher TF (the top-down analysis from the Trading Basics module). Continuations are traded ONLY in the direction of the dominant trend.",
            },
          },
        ],
      },
      {
        id: "triunghiuri-wedges",
        title: { ro: "Triunghiuri și Wedges", en: "Triangles and wedges" },
        minutes: 9,
        sections: [
          {
            body: {
              ro: "Volatilitatea piețelor e ciclică: perioadele de compresie (range-uri tot mai înguste) sunt urmate de perioade de expansiune (mișcări direcționale ample). **Triunghiurile** sunt forma vizuală a compresiei: prețul face oscilații din ce în ce mai mici între două linii care converg, energia se acumulează, iar breakout-ul o eliberează.\n\nDe aceea triunghiurile sunt atât de urmărite: nu îți spun mereu direcția, dar îți spun că VINE o mișcare. Iar felul în care converg liniile îți dă indicii serioase despre cine e mai nerăbdător — cumpărătorii sau vânzătorii.",
              en: "Market volatility is cyclical: periods of compression (tighter and tighter ranges) are followed by periods of expansion (large directional moves). **Triangles** are the visual form of compression: price oscillates in ever-smaller swings between two converging lines, energy builds up, and the breakout releases it.\n\nThat's why triangles get so much attention: they don't always tell you the direction, but they tell you a move is COMING. And the way the lines converge gives you serious clues about who's more impatient — buyers or sellers.",
            },
          },
          {
            heading: { ro: "Triunghiul ascendent", en: "The ascending triangle" },
            body: {
              ro: "**Triunghiul ascendent** combină o rezistență orizontală (vânzătorii apără mereu același preț) cu minime tot mai sus (cumpărătorii devin tot mai agresivi și nu mai lasă prețul să coboare). E o imagine de absorbție: la fiecare atingere, oferta de la rezistență se subțiază, iar cererea urcă scara.\n\nBias-ul statistic e spre rupere ÎN SUS — dar nu e o lege. Confirmarea rămâne închiderea deasupra rezistenței. Ținta măsurată: **înălțimea maximă a triunghiului** (baza — distanța dintre rezistență și primul minim) proiectată din punctul de break. În diagramă: 62 − 30 = 32 → țintă la 94.\n\n**Triunghiul descendent** e oglinda: suport orizontal + maxime tot mai jos, bias spre rupere în jos.",
              en: "The **ascending triangle** combines a horizontal resistance (sellers keep defending the same price) with rising lows (buyers grow more aggressive and stop letting price fall). It's a picture of absorption: with each touch, the supply at resistance thins out while demand climbs the ladder.\n\nThe statistical bias is a break UP — but it's not a law. Confirmation remains a close above the resistance. Measured target: the **triangle's widest height** (the base — the distance between resistance and the first low) projected from the break point. In the diagram: 62 − 30 = 32 → target at 94.\n\nThe **descending triangle** is the mirror: horizontal support + lower highs, bias toward a downside break.",
            },
            diagram: "m4-ascending-triangle",
          },
          {
            heading: { ro: "Triunghiul simetric", en: "The symmetrical triangle" },
            body: {
              ro: "La **triunghiul simetric** ambele linii converg: maxime tot mai jos ȘI minime tot mai sus. Nicio tabără nu domină — e compresie pură, fără bias structural propriu.\n\nCum îl abordezi:\n\n- **Direcția probabilă** vine din context: într-un uptrend clar, triunghiul simetric funcționează cel mai des ca pauză de continuare (similar cu un pennant mare).\n- **Nu ghici înăuntru.** Tranzacțiile luate în interiorul compresiei, înainte de break, au R:R prost și rată mare de eșec — aștepți închiderea în afara unei laturi.\n- **Ținta** se măsoară la fel: baza triunghiului proiectată din break.",
              en: "In the **symmetrical triangle** both lines converge: lower highs AND higher lows. Neither side dominates — it's pure compression, with no structural bias of its own.\n\nHow to approach it:\n\n- **The likely direction** comes from context: within a clear uptrend, a symmetrical triangle most often acts as a continuation pause (like a large pennant).\n- **Don't guess inside.** Trades taken inside the compression, before the break, have poor R:R and a high failure rate — wait for a close outside one of the sides.\n- **The target** is measured the same way: the triangle's base projected from the break.",
            },
          },
          {
            heading: { ro: "Wedges: rising și falling", en: "Wedges: rising and falling" },
            body: {
              ro: "**Wedge-ul (pana)** seamănă cu triunghiul, dar cu o diferență esențială: AMBELE linii sunt înclinate în aceeași direcție și converg. Iar mesajul lui e contraintuitiv:\n\n- **Rising wedge** — prețul urcă, dar în împingeri tot mai scurte: maximele cresc din ce în ce mai puțin, liniile se strâng. Momentum-ul moare în timp ce prețul încă urcă. Rezolvare tipică: rupere în JOS.\n- **Falling wedge** — oglinda: scădere cu împingeri tot mai anemice, rezolvare tipică în SUS.\n\nDiferența față de flag: flag-ul e un canal PARALEL scurt după un impuls (semnal de continuare), wedge-ul e o CONVERGENȚĂ cu momentum în degradare (cel mai des semnal de epuizare). Confuzia dintre ele e una dintre cele mai frecvente greșeli de citire a graficului.",
              en: "The **wedge** resembles a triangle with one essential difference: BOTH lines slope in the same direction while converging. And its message is counterintuitive:\n\n- **Rising wedge** — price climbs, but in ever-shorter pushes: each high gains less ground, the lines tighten. Momentum dies while price is still rising. Typical resolution: a break DOWN.\n- **Falling wedge** — the mirror: a decline with increasingly anemic pushes, typically resolving UP.\n\nThe difference from a flag: a flag is a short PARALLEL channel after an impulse (continuation signal), a wedge is a CONVERGENCE with decaying momentum (most often an exhaustion signal). Confusing the two is one of the most common chart-reading mistakes.",
            },
            tip: {
              ro: "Cele mai bune breakout-uri din triunghiuri se produc la aproximativ 2/3–3/4 din distanța până la apex (vârful convergenței). Dacă prețul se târăște până în apex fără să rupă nimic, compresia și-a consumat energia — pattern-ul e de regulă mort și e mai sănătos să treci la următoarea oportunitate.",
              en: "The best triangle breakouts happen at roughly 2/3–3/4 of the distance to the apex (the convergence point). If price crawls all the way into the apex without breaking, the compression has spent its energy — the pattern is usually dead and you're better off moving to the next opportunity.",
            },
            warning: {
              ro: "Compresiile sunt terenul favorit al fakeout-urilor: o împunsătură falsă printr-o latură, care culege stop-urile, urmată de mișcarea reală în direcția OPUSĂ. Protecția ta: cere închidere de lumânare în afara liniei, nu doar un fitil — sau așteaptă retestul (lecția următoare).",
              en: "Compressions are fakeout territory: a false poke through one side that sweeps the stops, followed by the real move in the OPPOSITE direction. Your protection: demand a candle close outside the line, not just a wick — or wait for the retest (next lesson).",
            },
          },
        ],
      },
      {
        id: "cum-tranzactionezi-patterns",
        title: { ro: "Cum tranzacționezi pattern-urile corect", en: "How to actually trade patterns" },
        minutes: 11,
        sections: [
          {
            body: {
              ro: "Aici se despart apele. Toată lumea „vede” pattern-uri — puțini le tranzacționează cu reguli. Un pattern devine o tranzacție abia când ai răspuns, ÎNAINTE de intrare, la patru întrebări:\n\n- Unde intru exact?\n- Unde e stop loss-ul (ce invalidează ideea)?\n- Unde e ținta și ce R:R rezultă?\n- Ce fac dacă pattern-ul eșuează?\n\nLecția asta îți dă un cadru pentru toate patru — același cadru, indiferent că e vorba de un Head & Shoulders, un flag sau un triunghi.",
              en: "This is where the paths split. Everyone 'sees' patterns — few trade them with rules. A pattern becomes a trade only when you've answered four questions BEFORE entry:\n\n- Where exactly do I enter?\n- Where is the stop loss (what invalidates the idea)?\n- Where is the target and what R:R does it produce?\n- What do I do if the pattern fails?\n\nThis lesson gives you a framework for all four — the same framework whether it's a Head & Shoulders, a flag or a triangle.",
            },
          },
          {
            heading: { ro: "Intrare pe break sau pe retest?", en: "Enter on the break or the retest?" },
            body: {
              ro: "Ai două momente clasice de intrare, fiecare cu un compromis diferit:\n\n- **Pe break** — intri la închiderea lumânării care rupe nivelul (neckline, linia steagului, latura triunghiului). Avantaj: nu ratezi niciodată mișcarea. Dezavantaj: mănânci toate fakeout-urile, iar stopul e adesea mai departe → R:R mai slab.\n- **Pe retest** — aștepți ca prețul să revină la nivelul rupt (fosta rezistență devenită suport — **S/R flip**) și intri pe semnul de respingere. Avantaj: stop mai strâns, R:R vizibil mai bun, fakeout-urile te ocolesc. Dezavantaj: retestul nu vine mereu — uneori mișcarea pleacă fără tine.\n\nNu există variantă „corectă” universal. Există varianta pe care o poți executa disciplinat și pe care ți-o validează statistica din jurnal. Mulți traderi combină: jumătate de poziție pe break, jumătate la retest.",
              en: "You have two classic entry moments, each with a different trade-off:\n\n- **On the break** — enter at the close of the candle that breaks the level (neckline, flag line, triangle side). Advantage: you never miss the move. Disadvantage: you eat every fakeout, and the stop is often farther away → worse R:R.\n- **On the retest** — wait for price to return to the broken level (old resistance turned support — the **S/R flip**) and enter on the rejection sign. Advantage: tighter stop, visibly better R:R, fakeouts pass you by. Disadvantage: the retest doesn't always come — sometimes the move leaves without you.\n\nThere is no universally 'correct' option. There's the one you can execute with discipline and that your journal statistics validate. Many traders combine both: half the position on the break, half at the retest.",
            },
            diagram: "m4-breakout-retest",
          },
          {
            heading: { ro: "Unde pui stopul", en: "Where the stop goes" },
            body: {
              ro: "Stopul se pune acolo unde IDEEA moare, nu la o distanță „confortabilă” în pips. Practic, dincolo de punctul care invalidează pattern-ul:\n\n- **Head & Shoulders** — deasupra umărului drept (dacă prețul urcă peste RS, inversarea e anulată).\n- **Double top** — deasupra celor două vârfuri (la retestul neckline-ului poți folosi un stop mai strâns, deasupra ultimului Lower High).\n- **Flag** — sub minimul steagului (la bull flag); dacă se pierde, „pauza” era de fapt inversare.\n- **Triunghi** — dincolo de latura opusă break-ului sau, mai strâns, dincolo de ultimul swing dinaintea break-ului.\n\nLasă mereu o marjă peste nivelul evident — exact acolo stau stop-urile tuturor, și exact acolo trimite piața fitilele. Cum calibrezi matematic marja asta cu ATR înveți în modulul de Indicatori.",
              en: "The stop goes where the IDEA dies, not at a 'comfortable' distance in pips. Practically, beyond the point that invalidates the pattern:\n\n- **Head & Shoulders** — above the right shoulder (if price climbs past the RS, the reversal is void).\n- **Double top** — above the two peaks (on a neckline retest you can use a tighter stop, above the last Lower High).\n- **Flag** — below the flag's low (for a bull flag); if that's lost, the 'pause' was actually a reversal.\n- **Triangle** — beyond the side opposite the break or, tighter, beyond the last swing before the break.\n\nAlways leave a margin past the obvious level — that's exactly where everyone's stops sit, and exactly where the market sends its wicks. How to calibrate that margin mathematically with ATR is covered in the Indicators module.",
            },
          },
          {
            heading: { ro: "Ținte, rate de eșec și onestitate statistică", en: "Targets, failure rates and statistical honesty" },
            body: {
              ro: "Adevărul pe care cursurile de marketing nu ți-l spun: **pattern-urile eșuează des**. În funcție de formațiune și context, undeva la 30–45% din pattern-urile „de manual” nu își ating ținta măsurată. Și e în regulă — avantajul tău nu vine din rată de câștig, ci din asimetrie: când funcționează, câștigi 2–3R; când eșuează, pierzi 1R.\n\nDouă consecințe practice:\n\n- **Ținta măsurată e un reper, nu o promisiune.** Combin-o cu structura: dacă un nivel major stă înaintea țintei, ia profit parțial acolo.\n- **Pattern-urile eșuate sunt ele însele semnale.** Un Head & Shoulders care rupe neckline-ul și apoi se întoarce agresiv peste umărul drept prinde în capcană toți vânzătorii — continuarea în sus e adesea violentă. Traderii avansați tranzacționează eșecul cu aceeași seriozitate ca pattern-ul.",
              en: "The truth marketing courses won't tell you: **patterns fail often**. Depending on the formation and context, somewhere around 30–45% of 'textbook' patterns never reach their measured target. And that's fine — your edge doesn't come from win rate, it comes from asymmetry: when it works you make 2–3R, when it fails you lose 1R.\n\nTwo practical consequences:\n\n- **The measured target is a reference, not a promise.** Combine it with structure: if a major level sits before the target, take partial profit there.\n- **Failed patterns are signals in themselves.** A Head & Shoulders that breaks the neckline and then reclaims the right shoulder aggressively traps every seller — the continuation up is often violent. Advanced traders trade the failure as seriously as the pattern.",
            },
            warning: {
              ro: "Pareidolia e boala profesională a traderului de pattern-uri: creierul tău e construit să vadă forme peste tot. Dacă trebuie să „forțezi” liniile ca să iasă pattern-ul, nu e un pattern. Regula simplă: dacă nu-l vezi în 3 secunde, nu există.",
              en: "Pareidolia is the pattern trader's occupational disease: your brain is built to see shapes everywhere. If you have to 'force' the lines to make the pattern work, it's not a pattern. Simple rule: if you don't see it in 3 seconds, it isn't there.",
            },
          },
          {
            heading: { ro: "Transformă pattern-urile în statistici", en: "Turn patterns into statistics" },
            body: {
              ro: "Diferența dintre „mie mi se pare că flag-urile merg” și „flag-urile pe H4, în trendul D1, îmi dau 52% rată de câștig la 2.1R mediu” este diferența dintre hobby și meserie.\n\nCum ajungi acolo cu TradeGx:\n\n- **Definește pattern-ul în scris.** Ce înseamnă, pentru tine, un bull flag valid? Câte lumânări, ce adâncime de retragere, ce context de trend? Reguli pe hârtie, nu impresii.\n- **Loghează fiecare tranzacție în jurnal** cu screenshot la intrare și tag-ul pattern-ului (ex. „bull-flag”, „h&s”). După 30–50 de tranzacții, filtrezi pe tag și vezi negru pe alb care formațiuni ÎȚI fac bani și care doar arată bine.\n- **Backtestează regulile de intrare** pe pagina de Backtesting înainte să riști capital real — validezi pe date istorice în minute, nu în luni de încercări live.",
              en: "The difference between 'I feel like flags work' and 'H4 flags in the D1 trend give me a 52% win rate at 2.1R average' is the difference between a hobby and a profession.\n\nHow to get there with TradeGx:\n\n- **Define the pattern in writing.** What does a valid bull flag mean to you? How many candles, what retracement depth, what trend context? Rules on paper, not impressions.\n- **Log every trade in the journal** with an entry screenshot and the pattern tag (e.g. 'bull-flag', 'h&s'). After 30–50 trades, filter by tag and see in black and white which formations make YOU money and which just look pretty.\n- **Backtest your entry rules** on the Backtesting page before risking real capital — validate on historical data in minutes instead of months of live trial and error.",
            },
            tip: {
              ro: "Alege UN singur pattern — cel care ți se pare cel mai clar — și tranzacționează-l exclusiv o lună, pe demo sau cu risc minim. Un pattern stăpânit cu statistică bate zece pattern-uri „știute” aproximativ.",
              en: "Pick ONE pattern — the one that looks clearest to you — and trade it exclusively for a month, on demo or with minimal risk. One pattern mastered with statistics beats ten patterns 'sort of' known.",
            },
          },
        ],
      },
    ],
  },
  diagrams: {
    "m4-head-shoulders": {
      candles: [
        { o: 30, h: 40, l: 28, c: 38 },
        { o: 38, h: 50, l: 36, c: 48 },
        { o: 48, h: 62, l: 46, c: 58 },
        { o: 58, h: 66, l: 56, c: 60 },
        { o: 60, h: 62, l: 50, c: 52 },
        { o: 52, h: 54, l: 44, c: 46 },
        { o: 46, h: 58, l: 45, c: 56 },
        { o: 56, h: 72, l: 54, c: 68 },
        { o: 68, h: 80, l: 64, c: 72 },
        { o: 72, h: 74, l: 58, c: 60 },
        { o: 60, h: 62, l: 44, c: 47 },
        { o: 47, h: 58, l: 46, c: 55 },
        { o: 55, h: 64, l: 52, c: 57 },
        { o: 57, h: 59, l: 46, c: 48 },
        { o: 48, h: 50, l: 36, c: 38 },
        { o: 38, h: 40, l: 28, c: 30 },
      ],
      trend: [{ x1: 4.5, y1: 45, x2: 15.5, y2: 45, color: "#818cf8" }],
      levels: [{ y: 10, label: "Target", color: "#f43f5e", dashed: true }],
      labels: [
        { x: 3, y: 71, text: "LS", color: "#71717a" },
        { x: 8, y: 85, text: "Head", color: "#f43f5e" },
        { x: 12, y: 69, text: "RS", color: "#71717a" },
        { x: 6.2, y: 40, text: "Neckline", color: "#818cf8" },
      ],
      arrows: [{ x: 14, y: 55, dir: "down", color: "#f43f5e", label: "Break" }],
      caption: {
        ro: "Head & Shoulders: umăr — cap (ultimul HH) — umăr mai jos (primul LH). Închiderea sub neckline confirmă; ținta = înălțimea capului (80−45=35) proiectată din break.",
        en: "Head & Shoulders: shoulder — head (the final HH) — lower shoulder (the first LH). A close below the neckline confirms; target = the head's height (80−45=35) projected from the break.",
      },
    },
    "m4-double-top": {
      candles: [
        { o: 25, h: 33, l: 23, c: 31 },
        { o: 31, h: 42, l: 30, c: 40 },
        { o: 40, h: 52, l: 38, c: 50 },
        { o: 50, h: 64, l: 48, c: 60 },
        { o: 60, h: 66, l: 56, c: 58 },
        { o: 58, h: 60, l: 46, c: 48 },
        { o: 48, h: 50, l: 42, c: 44 },
        { o: 44, h: 56, l: 43, c: 54 },
        { o: 54, h: 65, l: 52, c: 62 },
        { o: 62, h: 64, l: 54, c: 56 },
        { o: 56, h: 58, l: 46, c: 48 },
        { o: 48, h: 50, l: 40, c: 42 },
        { o: 42, h: 44, l: 32, c: 34 },
        { o: 34, h: 36, l: 26, c: 29 },
      ],
      zones: [{ y1: 63, y2: 67, x1: 2.5, x2: 10, color: "#f43f5e", label: "Resistance" }],
      trend: [{ x1: 5.5, y1: 43, x2: 13.5, y2: 43, color: "#818cf8" }],
      levels: [{ y: 20, label: "Target", color: "#f43f5e", dashed: true }],
      labels: [
        { x: 4, y: 71, text: "Top 1", color: "#71717a" },
        { x: 8.7, y: 70, text: "Top 2", color: "#71717a" },
        { x: 6.8, y: 39, text: "Neckline", color: "#818cf8" },
      ],
      arrows: [{ x: 11, y: 53, dir: "down", color: "#f43f5e", label: "Break" }],
      caption: {
        ro: "Double top: două respingeri din aceeași zonă, al doilea vârf cu momentum mai slab. Pattern-ul există DOAR după închiderea sub neckline; ținta = înălțimea (66−43) proiectată în jos.",
        en: "Double top: two rejections from the same zone, the second peak with weaker momentum. The pattern exists ONLY after the close below the neckline; target = the height (66−43) projected down.",
      },
    },
    "m4-bull-flag": {
      candles: [
        { o: 15, h: 24, l: 13, c: 22 },
        { o: 22, h: 34, l: 21, c: 32 },
        { o: 32, h: 46, l: 31, c: 44 },
        { o: 44, h: 56, l: 42, c: 54 },
        { o: 54, h: 56, l: 48, c: 50 },
        { o: 50, h: 52, l: 45, c: 47 },
        { o: 47, h: 49, l: 42, c: 44 },
        { o: 44, h: 47, l: 40, c: 42 },
        { o: 42, h: 45, l: 40, c: 44 },
        { o: 44, h: 54, l: 43, c: 52 },
        { o: 52, h: 62, l: 50, c: 60 },
        { o: 60, h: 72, l: 58, c: 70 },
        { o: 70, h: 80, l: 68, c: 78 },
      ],
      trend: [
        { x1: 4, y1: 56.5, x2: 8.8, y2: 44.5, color: "#f59e0b" },
        { x1: 4, y1: 48.5, x2: 8.3, y2: 39.5, color: "#f59e0b" },
      ],
      levels: [{ y: 88, label: "Target = pole", color: "#10b981", dashed: true }],
      labels: [
        { x: 0.7, y: 44, text: "Pole", color: "#10b981" },
        { x: 6.5, y: 58, text: "Flag", color: "#f59e0b" },
      ],
      arrows: [{ x: 9, y: 37, dir: "up", color: "#10b981", label: "Break" }],
      caption: {
        ro: "Bull flag: impuls abrupt (pole), consolidare îngustă contra trendului (flag), break în sus. Ținta = înălțimea pole-ului proiectată din punctul de break.",
        en: "Bull flag: steep impulse (pole), narrow counter-trend consolidation (flag), break to the upside. Target = the pole's height projected from the break point.",
      },
    },
    "m4-ascending-triangle": {
      candles: [
        { o: 32, h: 44, l: 30, c: 42 },
        { o: 42, h: 56, l: 40, c: 54 },
        { o: 54, h: 62, l: 52, c: 58 },
        { o: 58, h: 60, l: 46, c: 48 },
        { o: 48, h: 52, l: 38, c: 40 },
        { o: 40, h: 54, l: 39, c: 52 },
        { o: 52, h: 62, l: 50, c: 59 },
        { o: 59, h: 61, l: 48, c: 50 },
        { o: 50, h: 53, l: 45, c: 47 },
        { o: 47, h: 58, l: 46, c: 56 },
        { o: 56, h: 62, l: 54, c: 58 },
        { o: 58, h: 60, l: 51, c: 53 },
        { o: 53, h: 66, l: 52, c: 64 },
        { o: 64, h: 74, l: 62, c: 72 },
      ],
      levels: [
        { y: 62, label: "Resistance", color: "#f43f5e" },
        { y: 94, label: "Target", color: "#10b981", dashed: true },
      ],
      trend: [{ x1: 0, y1: 30, x2: 11.5, y2: 52, color: "#10b981" }],
      labels: [
        { x: 4, y: 34, text: "HL", color: "#10b981" },
        { x: 8, y: 41, text: "HL", color: "#10b981" },
        { x: 11, y: 47, text: "HL", color: "#10b981" },
      ],
      arrows: [{ x: 12, y: 46, dir: "up", color: "#10b981", label: "Break" }],
      caption: {
        ro: "Triunghi ascendent: rezistență orizontală + minime tot mai sus (HL) = absorbție. Ținta = baza triunghiului (62−30=32) proiectată din break.",
        en: "Ascending triangle: horizontal resistance + rising lows (HL) = absorption. Target = the triangle's base (62−30=32) projected from the break.",
      },
    },
    "m4-breakout-retest": {
      candles: [
        { o: 40, h: 46, l: 38, c: 44 },
        { o: 44, h: 50, l: 42, c: 46 },
        { o: 46, h: 48, l: 40, c: 42 },
        { o: 42, h: 49, l: 41, c: 47 },
        { o: 47, h: 50, l: 44, c: 45 },
        { o: 45, h: 47, l: 41, c: 43 },
        { o: 43, h: 56, l: 42, c: 54 },
        { o: 54, h: 60, l: 52, c: 58 },
        { o: 58, h: 59, l: 51, c: 53 },
        { o: 53, h: 54, l: 49, c: 51 },
        { o: 51, h: 58, l: 50, c: 56 },
        { o: 56, h: 64, l: 54, c: 62 },
        { o: 62, h: 70, l: 60, c: 68 },
      ],
      levels: [
        { y: 68, label: "Target", color: "#10b981" },
        { y: 50, label: "S/R flip", color: "#818cf8" },
        { y: 44, label: "Stop Loss", color: "#f43f5e", dashed: true },
      ],
      arrows: [
        { x: 6, y: 38, dir: "up", color: "#f59e0b", label: "Break" },
        { x: 9, y: 43.5, dir: "up", color: "#10b981", label: "Retest entry" },
      ],
      caption: {
        ro: "Breakout + retest: rezistența ruptă devine suport (S/R flip). Intrarea la retest oferă stop mai strâns și R:R mai bun decât intrarea pe break.",
        en: "Breakout + retest: broken resistance becomes support (the S/R flip). The retest entry offers a tighter stop and better R:R than entering on the break.",
      },
    },
  },
};
