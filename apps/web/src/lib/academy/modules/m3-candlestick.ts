import type { ModuleBundle } from "../types";

// ── M3: Candlestick Patterns (Intermediar) ──────────────────────────────────

export const M3_BUNDLE: ModuleBundle = {
  module: {
    id: "candlestick-patterns",
    level: "INTERMEDIATE",
    icon: "candlestick",
    title: { ro: "Candlestick Patterns", en: "Candlestick Patterns" },
    description: {
      ro: "Doji, hammer, engulfing, morning star — înveți psihologia din spatele fiecărui model și, mai important, CÂND contează și când e doar zgomot.",
      en: "Doji, hammer, engulfing, morning star — learn the psychology behind each pattern and, more importantly, WHEN it matters and when it's just noise.",
    },
    lessons: [
      {
        id: "modele-cu-o-lumanare",
        title: { ro: "Modele cu o singură lumânare", en: "Single-candle patterns" },
        minutes: 11,
        sections: [
          {
            body: {
              ro: "Fiecare lumânare e rezumatul unei bătălii dintre cumpărători și vânzători. Un model cu o singură lumânare comprimă acea bătălie într-o poveste scurtă: **respingere** (o tabără a atacat și a fost aruncată înapoi) sau **indecizie** (nimeni nu a câștigat).\n\nÎnainte să intrăm în modele, fixează regula care desparte traderii profitabili de colecționarii de pattern-uri: modelul de lumânare e un DECLANȘATOR, nu un semnal de sine stătător. Același hammer poate fi o intrare excelentă la un suport major și o capcană perfectă în mijlocul nimicului. Lecția 4 din acest modul e dedicată exact acestei diferențe.",
              en: "Every candle is the summary of a battle between buyers and sellers. A single-candle pattern compresses that battle into a short story: **rejection** (one side attacked and got thrown back) or **indecision** (nobody won).\n\nBefore we get into the patterns, lock in the rule that separates profitable traders from pattern collectors: a candlestick pattern is a TRIGGER, not a standalone signal. The same hammer can be an excellent entry at major support and a perfect trap in the middle of nowhere. Lesson 4 of this module is dedicated exactly to that difference.",
            },
          },
          {
            heading: { ro: "Doji: piața nu s-a decis", en: "Doji: the market couldn't decide" },
            body: {
              ro: "**Doji** = lumânarea la care Open ≈ Close: s-a luptat tot intervalul și s-a terminat la egalitate. Variantele contează, pentru că fitilele spun povești diferite:\n\n- **Doji standard** — fitile moderate în ambele direcții: echilibru simplu.\n- **Long-legged doji** — fitile foarte lungi sus și jos: volatilitate mare + indecizie maximă. Ambele tabere au atacat, ambele au fost respinse.\n- **Dragonfly doji** — Open și Close lângă High, fitil lung jos: vânzătorii au împins adânc, cumpărătorii au recuperat TOT. Bias bullish, mai ales la suport.\n- **Gravestone doji** — oglinda: Open și Close lângă Low, fitil lung sus. Bias bearish, mai ales la rezistență.\n\nUn doji apărut după un trend lung și susținut e prima fisură în convingerea dominantă — tabăra care controla piața nu a mai reușit să închidă în direcția ei. Același doji în mijlocul unui range nu înseamnă absolut nimic: acolo indecizia e starea normală.",
              en: "A **doji** = a candle where Open ≈ Close: both sides fought all interval and it ended in a draw. The variants matter, because the wicks tell different stories:\n\n- **Standard doji** — moderate wicks both ways: plain equilibrium.\n- **Long-legged doji** — very long wicks up and down: high volatility + maximum indecision. Both sides attacked, both got rejected.\n- **Dragonfly doji** — Open and Close near the High, long lower wick: sellers pushed deep, buyers clawed back EVERYTHING. Bullish bias, especially at support.\n- **Gravestone doji** — the mirror: Open and Close near the Low, long upper wick. Bearish bias, especially at resistance.\n\nA doji after a long, sustained trend is the first crack in the dominant conviction — the side controlling the market failed to close in its direction. The same doji in the middle of a range means absolutely nothing: there, indecision is the normal state.",
            },
            diagram: "m3-doji-variants",
            warning: {
              ro: "Un doji NU e semnal de inversare de unul singur — e o pauză, un semn de întrebare. Fără un nivel relevant sub/deasupra lui și fără o lumânare de confirmare după el, e doar o lumânare mică pe grafic.",
              en: "A doji is NOT a reversal signal on its own — it's a pause, a question mark. Without a relevant level under/above it and a confirmation candle after it, it's just a small candle on the chart.",
            },
          },
          {
            heading: { ro: "Marubozu: control total", en: "Marubozu: total control" },
            body: {
              ro: "**Marubozu** e opusul doji-ului: corp plin, fără fitile (sau cu fitile neglijabile). O singură tabără a controlat piața de la Open până la Close, fără nicio contestare.\n\nCum îl folosești: un marubozu care sparge un nivel e cea mai convingătoare lumânare de breakout posibilă — participare și hotărâre maximă. Un marubozu ÎMPOTRIVA poziției tale e un mesaj pe care nu ai voie să-l ignori: piața tocmai ți-a spus, cu toată forța, că se mișcă în cealaltă direcție. Caracterul lui e de CONTINUARE: după un marubozu, prima așteptare statistică e că direcția se păstrează.",
              en: "The **marubozu** is the doji's opposite: a full body with no wicks (or negligible ones). One side controlled the market from Open to Close without a single challenge.\n\nHow to use it: a marubozu breaking a level is the most convincing breakout candle possible — maximum participation and determination. A marubozu AGAINST your position is a message you're not allowed to ignore: the market just told you, at full force, that it's moving the other way. Its character is CONTINUATION: after a marubozu, the first statistical expectation is that the direction holds.",
            },
            diagram: "m3-marubozu",
          },
          {
            heading: { ro: "Hammer: respingerea de jos", en: "Hammer: rejection from below" },
            body: {
              ro: "**Hammer-ul** apare după o scădere: vânzătorii împing prețul adânc în jos, dar până la închidere cumpărătorii recuperează aproape tot. Rămâne un fitil lung jos — urma atacului eșuat — și un corp mic sus. Psihologia: cine a vândut în interiorul acelui fitil e deja pe pierdere; combustibil pentru mișcarea în sus.\n\nCriteriile unui hammer valid:\n\n- **Fitilul inferior ≥ 2x corpul** — respingerea trebuie să fie evidentă.\n- **Corp mic, în treimea superioară** a lumânării; culoarea corpului contează puțin (verde = ușor mai bullish).\n- **Apare DUPĂ o scădere** — fără trend descendent înainte, nu e hammer, e doar o lumânare cu fitil.\n- **La o zonă de suport** — locația face diferența dintre semnal și zgomot.\n\nExecuția clasică: intrare la spargerea High-ului hammer-ului, stop loss sub vârful fitilului. În limbajul price action, hammer-ul și shooting star-ul fac parte din familia **pin bar** (Pinocchio bar) — lumânarea care „minte”: pare că sparge nivelul, dar închide respinsă înapoi.",
              en: "The **hammer** appears after a decline: sellers push price deep down, but by the close buyers claw back nearly everything. What remains is a long lower wick — the trace of the failed attack — and a small body on top. The psychology: everyone who sold inside that wick is already losing; fuel for the move up.\n\nThe criteria of a valid hammer:\n\n- **Lower wick ≥ 2x the body** — the rejection must be obvious.\n- **Small body in the upper third** of the candle; body color matters little (green = slightly more bullish).\n- **It appears AFTER a decline** — without a downtrend before it, it's not a hammer, just a candle with a wick.\n- **At a support zone** — location is what separates signal from noise.\n\nThe classic execution: entry on the break of the hammer's High, stop loss below the tip of the wick. In price-action language, the hammer and shooting star belong to the **pin bar** (Pinocchio bar) family — the candle that 'lies': it looks like it's breaking the level, but closes rejected back inside.",
            },
            diagram: "m3-hammer",
            tip: {
              ro: "Un hammer NU există până când lumânarea nu s-a închis. La jumătatea intervalului poate arăta perfect, iar la close să fie o banală lumânare bearish. Așteaptă close-ul — întotdeauna. Dacă tranzacționezi pe H4, asta înseamnă că decizia se ia doar la ore fixe: mai puțin stres, mai multă disciplină.",
              en: "A hammer does NOT exist until the candle has closed. Mid-interval it can look perfect, then close as an ordinary bearish candle. Wait for the close — always. If you trade H4, that means decisions happen only at fixed hours: less stress, more discipline.",
            },
          },
          {
            heading: { ro: "Shooting star: respingerea de sus", en: "Shooting star: rejection from above" },
            body: {
              ro: "**Shooting star** e oglinda hammer-ului, la capătul unei creșteri: cumpărătorii împing prețul sus — adesea chiar peste o rezistență — dar vânzătorii preiau controlul și lumânarea închide jos, lăsând un fitil lung superior.\n\nFitilul acela e plin de cumpărători prinși: au cumpărat sus, prețul a închis sub ei, iar stop-urile lor devin combustibil pentru scădere. Criteriile sunt simetrice cu ale hammer-ului: fitil superior ≥ 2x corpul, corp mic în treimea inferioară, după o creștere, la o zonă de rezistență. Execuția: intrare la spargerea Low-ului lumânării, stop deasupra vârfului fitilului.",
              en: "The **shooting star** is the hammer's mirror, at the end of a rally: buyers push price up — often right through a resistance — but sellers take over and the candle closes low, leaving a long upper wick.\n\nThat wick is full of trapped buyers: they bought high, price closed below them, and their stops become fuel for the decline. The criteria are symmetric to the hammer's: upper wick ≥ 2x the body, small body in the lower third, after a rally, at a resistance zone. Execution: entry on the break of the candle's Low, stop above the tip of the wick.",
            },
            diagram: "m3-shooting-star",
          },
        ],
      },
      {
        id: "modele-cu-doua-lumanari",
        title: { ro: "Modele cu două lumânări", en: "Two-candle patterns" },
        minutes: 10,
        sections: [
          {
            body: {
              ro: "Modelele cu două lumânări arată un **transfer de control** de la o sesiune la alta. Cheia lecturii e mereu relația dintre CORPURI: cine a împins mai departe, cine a anulat munca celuilalt, cine nu a mai putut avansa.\n\nToate regulile din lecția anterioară rămân valabile: trend înainte, nivel sub/deasupra, close confirmat. Ce se schimbă e cantitatea de informație — două lumânări spun o poveste mai completă decât una singură, deci semnalele sunt, statistic, mai fiabile.",
              en: "Two-candle patterns show a **transfer of control** from one session to the next. The key to reading them is always the relationship between the BODIES: who pushed further, who erased the other side's work, who could no longer advance.\n\nEverything from the previous lesson still applies: a trend before, a level under/above, a confirmed close. What changes is the amount of information — two candles tell a more complete story than one, so the signals are statistically more reliable.",
            },
          },
          {
            heading: { ro: "Engulfing: preluarea ostilă", en: "Engulfing: the hostile takeover" },
            body: {
              ro: "**Bullish engulfing**: după o scădere, o lumânare verde al cărei corp ACOPERĂ COMPLET corpul lumânării roșii dinainte. Într-o singură sesiune, cumpărătorii au anulat tot ce au construit vânzătorii și au mai și avansat — o preluare ostilă a controlului. **Bearish engulfing** e exact oglinda, la capătul unei creșteri.\n\nCe transformă un engulfing bun într-unul excelent:\n\n- Apare după o mișcare EXTINSĂ, nu după trei lumânări de corecție.\n- Se formează la un nivel relevant (suport, rezistență, MA dinamică).\n- A doua lumânare închide în treimea ei extremă, departe de nivel — convingere, nu ezitare.\n- Corpul lumânării a doua e vizibil mai mare decât mediile recente.\n\nExecuția: intrare la close-ul lumânării de engulfing sau la retestul corpului ei, stop dincolo de extrema modelului (sub Low-ul engulfing-ului bullish).",
              en: "**Bullish engulfing**: after a decline, a green candle whose body COMPLETELY COVERS the body of the preceding red candle. In a single session, buyers erased everything sellers built and advanced on top of it — a hostile takeover of control. The **bearish engulfing** is the exact mirror, at the end of a rally.\n\nWhat turns a good engulfing into an excellent one:\n\n- It appears after an EXTENDED move, not after three candles of correction.\n- It forms at a relevant level (support, resistance, dynamic MA).\n- The second candle closes in its extreme third, far from the level — conviction, not hesitation.\n- The second candle's body is visibly larger than recent averages.\n\nExecution: entry at the engulfing candle's close or on the retest of its body, stop beyond the pattern's extreme (below the Low of a bullish engulfing).",
            },
            diagram: "m3-engulfing",
            tip: {
              ro: "Rulează un test simplu în backtesting-ul TradeGx: engulfing tranzacționat ORIUNDE apare vs. engulfing tranzacționat DOAR la niveluri marcate dinainte. Diferența de rezultat e cea mai convingătoare lecție despre context pe care o poți primi — pentru că vine din datele tale.",
              en: "Run a simple test in TradeGx backtesting: engulfings traded ANYWHERE they appear vs. engulfings traded ONLY at pre-marked levels. The difference in results is the most convincing lesson about context you'll ever get — because it comes from your own data.",
            },
          },
          {
            heading: { ro: "Harami: contracția", en: "Harami: the contraction" },
            body: {
              ro: "**Harami** („însărcinată” în japoneză) e inversul engulfing-ului: o lumânare cu corp mare urmată de una cu corp mic, aflat COMPLET în interiorul corpului precedent. După impuls, piața s-a oprit brusc — volatilitatea s-a contractat.\n\nHarami nu e un semnal de inversare în sine, ci un semnal de PIERDERE DE MOMENTUM: tabăra care domina nu a mai reușit să împingă. Ce urmează decide totul — o închidere peste High-ul lumânării-mamă activează scenariul bullish; o închidere sub Low reactivează scenariul dominant. Cu cât a doua lumânare e mai mică (varianta extremă: un doji — **harami cross**), cu atât contracția e mai semnificativă.\n\nTratează-l ca pe un arc comprimat: nu ghici direcția, așteaptă să se destindă și intră cu confirmarea.",
              en: "The **harami** ('pregnant' in Japanese) is the engulfing's inverse: a large-bodied candle followed by a small-bodied one sitting COMPLETELY inside the previous body. After the impulse, the market stopped abruptly — volatility contracted.\n\nA harami is not a reversal signal in itself, but a LOSS-OF-MOMENTUM signal: the dominant side failed to keep pushing. What follows decides everything — a close above the mother candle's High activates the bullish scenario; a close below its Low reactivates the dominant one. The smaller the second candle (the extreme version: a doji — the **harami cross**), the more significant the contraction.\n\nTreat it like a compressed spring: don't guess the direction, wait for the release and enter with the confirmation.",
            },
            diagram: "m3-harami",
          },
          {
            heading: { ro: "Tweezer top și tweezer bottom", en: "Tweezer top and tweezer bottom" },
            body: {
              ro: "**Tweezer bottom**: două lumânări consecutive cu Low-uri (aproape) identice — prima de regulă bearish, a doua bullish. Piața a testat același preț de două ori, la interval scurt, și a fost respinsă de ambele dăți din exact același loc. **Tweezer top** e simetricul, cu High-uri egale.\n\nDe ce contează: o respingere dublă, precisă, arată ordine ferme parcate la acel nivel — cineva apără prețul acela. Cu cât extremele egale coincid cu o zonă de suport/rezistență deja marcată și cu cât timeframe-ul e mai mare, cu atât semnalul e mai serios. Execuția e la fel ca la hammer: intrare la spargerea extremei opuse a modelului, stop dincolo de Low-urile/High-urile egale.",
              en: "**Tweezer bottom**: two consecutive candles with (nearly) identical Lows — the first usually bearish, the second bullish. The market tested the same price twice in short succession and got rejected from exactly the same spot both times. The **tweezer top** is the mirror, with equal Highs.\n\nWhy it matters: a precise double rejection reveals firm orders parked at that level — someone is defending that price. The more the equal extremes coincide with an already-marked support/resistance zone, and the higher the timeframe, the more serious the signal. Execution mirrors the hammer: entry on the break of the pattern's opposite extreme, stop beyond the equal Lows/Highs.",
            },
            diagram: "m3-tweezers",
            warning: {
              ro: "Pe timeframe-uri mici, extremele „egale” apar constant din simplu zgomot și din spread — nu înseamnă nimic. Tweezer-ul devine informație abia pe H4/D1 și abia când nivelul respins era vizibil ÎNAINTE să se formeze modelul.",
              en: "On low timeframes, 'equal' extremes appear constantly out of sheer noise and spread — they mean nothing. A tweezer only becomes information on H4/D1, and only when the rejected level was visible BEFORE the pattern formed.",
            },
          },
        ],
      },
      {
        id: "modele-cu-trei-lumanari",
        title: { ro: "Modele cu trei lumânări", en: "Three-candle patterns" },
        minutes: 9,
        sections: [
          {
            body: {
              ro: "Modelele cu trei lumânări spun povestea completă în trei acte: **impuls** (trendul curent lovește pentru ultima dată), **pauză** (echilibru, indecizie) și **rezoluție** (noua direcție preia controlul). Sunt cele mai lente modele — ai nevoie de trei close-uri ca să le confirmi — dar tocmai de aceea sunt și printre cele mai fiabile.\n\nRăbdarea e prețul de intrare: tentația de a anticipa actul al treilea înainte să se închidă e mare, iar piața pedepsește anticiparea exact când te-ai obișnuit să-ți iasă.",
              en: "Three-candle patterns tell the complete story in three acts: **impulse** (the current trend strikes one last time), **pause** (equilibrium, indecision) and **resolution** (the new direction takes control). They're the slowest patterns — you need three closes to confirm them — but that's precisely why they're among the most reliable.\n\nPatience is the entry fee: the temptation to anticipate the third act before it closes is strong, and the market punishes anticipation exactly when you've gotten used to getting away with it.",
            },
          },
          {
            heading: { ro: "Morning star și evening star", en: "Morning star and evening star" },
            body: {
              ro: "**Morning star** („steaua dimineții”) marchează răsăritul după un downtrend, în trei acte:\n\n- **Actul 1** — o lumânare bearish mare: vânzătorii încă domină.\n- **Actul 2** — o lumânare cu corp mic (steaua), ideal decuplată de corpul precedent: echilibrul s-a instalat. Poate fi doji (**morning doji star** — variantă mai puternică).\n- **Actul 3** — o lumânare bullish mare care închide PESTE JUMĂTATEA corpului primei lumânări: cumpărătorii au preluat controlul.\n\nCu cât a treia lumânare recuperează mai mult din prima, cu atât semnalul e mai puternic. **Evening star** e oglinda exactă la capătul unui uptrend. Gap-urile dintre corpuri (frecvente pe acțiuni, rare pe forex) întăresc modelul, dar absența lor pe piețele 24/5 nu îl invalidează.",
              en: "The **morning star** marks the sunrise after a downtrend, in three acts:\n\n- **Act 1** — a large bearish candle: sellers still dominate.\n- **Act 2** — a small-bodied candle (the star), ideally detached from the previous body: equilibrium has set in. It can be a doji (**morning doji star** — a stronger variant).\n- **Act 3** — a large bullish candle closing ABOVE THE MIDPOINT of the first candle's body: buyers have taken control.\n\nThe more of the first candle the third one recovers, the stronger the signal. The **evening star** is the exact mirror at the end of an uptrend. Gaps between the bodies (common on stocks, rare on forex) strengthen the pattern, but their absence on 24/5 markets doesn't invalidate it.",
            },
            diagram: "m3-morning-star",
          },
          {
            heading: { ro: "Three white soldiers și three black crows", en: "Three white soldiers and three black crows" },
            body: {
              ro: "**Three white soldiers**: trei lumânări bullish consecutive, cu corpuri pline, fiecare deschizând în interiorul corpului precedent și închizând aproape de High-ul propriu. E imaginea unei schimbări de regim: cerere constantă, absorbție a fiecărei corecții intra-lumânare, control total al cumpărătorilor. Apărut după un downtrend sau la ieșirea dintr-o acumulare, e unul dintre cele mai puternice semnale de inversare.\n\n**Three black crows** e echivalentul bearish: trei lumânări roșii pline, fiecare închizând lângă Low. Aceeași psihologie, direcția opusă.\n\nCapcana ambelor: până când al treilea „soldat” s-a închis, prețul a parcurs deja o distanță mare. Modelul îți spune că REGIMUL s-a schimbat — nu că trebuie să intri chiar acum.",
              en: "**Three white soldiers**: three consecutive bullish candles with full bodies, each opening inside the previous body and closing near its own High. It's the picture of a regime change: constant demand, absorption of every intra-candle dip, total buyer control. Appearing after a downtrend or out of an accumulation, it's one of the strongest reversal signals there is.\n\n**Three black crows** is the bearish equivalent: three full red candles, each closing near its Low. Same psychology, opposite direction.\n\nThe trap in both: by the time the third 'soldier' closes, price has already covered a lot of ground. The pattern tells you the REGIME has changed — not that you must enter right now.",
            },
            diagram: "m3-three-soldiers",
            warning: {
              ro: "Intrarea pe close-ul celui de-al treilea soldat are cel mai prost raport risc/recompensă din tot modelul: stop-ul tehnic e departe (sub începutul formației), iar prețul e întins. Așteaptă pullback-ul — primul retest al zonei de unde a pornit al doilea sau al treilea corp — și intră acolo, cu stop mult mai strâns.",
              en: "Entering on the third soldier's close carries the worst risk/reward of the whole pattern: the technical stop is far away (below the formation's origin) and price is stretched. Wait for the pullback — the first retest of where the second or third body launched — and enter there, with a much tighter stop.",
            },
            tip: {
              ro: "Fiabilitatea fiecărui model diferă de la instrument la instrument. Etichetează-ți tranzacțiile în jurnalul TradeGx cu numele modelului folosit (hammer, engulfing, morning star...) și, după 30–50 de tranzacții, filtrează statistica pe etichete: vei ști exact care modele fac bani pentru TINE.",
              en: "Every pattern's reliability differs from instrument to instrument. Tag your trades in the TradeGx journal with the pattern used (hammer, engulfing, morning star...) and after 30–50 trades filter your stats by tag: you'll know exactly which patterns make money for YOU.",
            },
          },
        ],
      },
      {
        id: "context-si-confluenta",
        title: { ro: "Context și confluență: când contează un pattern", en: "Context and confluence: when a pattern matters" },
        minutes: 8,
        sections: [
          {
            body: {
              ro: "Ia același hammer, perfect ca formă, și pune-l în trei locuri: la un suport major testat anterior, în mijlocul unui range și în cădere liberă, departe de orice nivel. Trei rezultate complet diferite — de la intrare excelentă la sinucidere financiară — cu ACEEAȘI lumânare.\n\nConcluzia întregului modul stă într-o singură frază: **modelul e declanșatorul, nivelul e motivul**. Locația bate forma, întotdeauna. Un pattern mediocru la o zonă excelentă bate un pattern perfect în gol. Traderii care pierd caută modele; traderii care câștigă așteaptă LOCURI și abia apoi cer piețelor un model.",
              en: "Take the same hammer, textbook-perfect in shape, and place it in three spots: at a previously tested major support, in the middle of a range, and in free fall far from any level. Three completely different outcomes — from excellent entry to financial suicide — with the SAME candle.\n\nThe conclusion of this entire module fits in one sentence: **the pattern is the trigger, the level is the reason**. Location beats shape, every time. A mediocre pattern at an excellent zone beats a perfect pattern in a vacuum. Losing traders hunt for patterns; winning traders wait for PLACES and only then ask the market for a pattern.",
            },
          },
          {
            heading: { ro: "Confluența: stivuirea probabilităților", en: "Confluence: stacking probabilities" },
            body: {
              ro: "**Confluența** înseamnă mai mulți factori independenți care indică aceeași decizie, în același loc. Fiecare factor adaugă probabilitate; niciunul nu e suficient singur:\n\n- **Direcția**: trendul pe timeframe-ul superior permite trade-ul?\n- **Locația**: o zonă marcată DINAINTE — suport/rezistență orizontală, trendline, MA dinamică — ideal testată deja în trecut.\n- **Declanșatorul**: un model de lumânare valid și ÎNCHIS, format chiar în zonă.\n- **Participarea**: volumul confirmă respingerea?\n- **Matematica**: stop-ul tehnic și ținta oferă minimum 1:2 risc/recompensă?\n\nÎn diagrama de mai jos vezi confluența la lucru: un suport testat anterior (dovadă că zona e reală), prețul revine, fitilul hammer-ului mătură zona (execută stop-urile de sub ea — lichiditate pentru cumpărătorii mari), iar close-ul revine sus. Intrare peste High-ul hammer-ului, stop sub fitil, țintă la maximul anterior.",
              en: "**Confluence** means several independent factors pointing to the same decision, in the same place. Each factor adds probability; none is sufficient alone:\n\n- **Direction**: does the higher-timeframe trend allow the trade?\n- **Location**: a zone marked IN ADVANCE — horizontal support/resistance, trendline, dynamic MA — ideally already tested in the past.\n- **Trigger**: a valid, CLOSED candlestick pattern formed right in the zone.\n- **Participation**: does volume confirm the rejection?\n- **The math**: do the technical stop and target offer at least 1:2 risk/reward?\n\nThe diagram below shows confluence at work: a previously tested support (proof the zone is real), price returns, the hammer's wick sweeps the zone (running the stops beneath it — liquidity for big buyers), and the close snaps back above. Entry above the hammer's High, stop below the wick, target at the prior high.",
            },
            diagram: "m3-confluenta",
          },
          {
            heading: { ro: "Checklist-ul pre-trade", en: "The pre-trade checklist" },
            body: {
              ro: "Transformă confluența dintr-o idee frumoasă într-un proces mecanic. Înainte de ORICE intrare bazată pe un model de lumânare, răspunde în scris:\n\n- Trendul pe timeframe-ul superior îmi permite această direcție?\n- Sunt la o zonă marcată DINAINTE (nu desenată acum, ca să-mi justific intrarea)?\n- Modelul e complet închis și respectă criteriile lecțiilor anterioare?\n- Volumul confirmă?\n- Am minimum 1:2 risc/recompensă cu stop TEHNIC (nu stop „cât îmi permit să pierd”)?\n- Riscul pe această tranzacție respectă planul meu (maximum 1% din cont)?\n\nȘase întrebări, treizeci de secunde. Majoritatea trade-urilor proaste nu trec de a doua întrebare.",
              en: "Turn confluence from a nice idea into a mechanical process. Before ANY entry based on a candlestick pattern, answer in writing:\n\n- Does the higher-timeframe trend allow this direction?\n- Am I at a zone marked IN ADVANCE (not drawn just now to justify my entry)?\n- Is the pattern fully closed and does it meet the criteria from the previous lessons?\n- Does volume confirm?\n- Do I have at least 1:2 risk/reward with a TECHNICAL stop (not a 'what I can afford to lose' stop)?\n- Does the risk on this trade respect my plan (1% of the account maximum)?\n\nSix questions, thirty seconds. Most bad trades don't survive the second question.",
            },
            tip: {
              ro: "Transpune lista de mai sus în Checklist-ul pre-trade din TradeGx și fă-ți o regulă nenegociabilă: nu apeși buy/sell până nu ai bifat tot. Disciplina nu se construiește din voință — se construiește din procese pe care nu le mai negociezi.",
              en: "Move the list above into the TradeGx pre-trade Checklist and make one non-negotiable rule: you don't press buy/sell until everything is ticked. Discipline isn't built from willpower — it's built from processes you no longer negotiate with.",
            },
          },
          {
            heading: { ro: "Antrenamentul ochiului", en: "Training your eye" },
            body: {
              ro: "Modelele se învață prin expunere, nu prin memorare. Planul de antrenament:\n\n- **Backtesting**: derulează istoricul lumânare cu lumânare în TradeGx și notează fiecare model găsit LA UN NIVEL, plus ce a urmat. 100 de exemple îți calibrează ochiul mai bine decât orice carte.\n- **Jurnal cu etichete**: fiecare trade primește numele modelului și contextul (la suport / la rezistență / fără nivel). Statistica pe etichete îți arată adevărul.\n- **Review săptămânal**: 15 minute în care te uiți DOAR la trade-urile pierzătoare și întrebi: era modelul la un nivel real, sau l-am vrut eu acolo?",
              en: "Patterns are learned through exposure, not memorization. The training plan:\n\n- **Backtesting**: scroll history candle by candle in TradeGx and log every pattern found AT A LEVEL, plus what followed. 100 examples calibrate your eye better than any book.\n- **Tagged journal**: every trade gets the pattern's name and its context (at support / at resistance / no level). The per-tag statistics show you the truth.\n- **Weekly review**: 15 minutes looking ONLY at losing trades, asking: was the pattern at a real level, or did I want it to be there?",
            },
            warning: {
              ro: "Creierul tău găsește pattern-uri oriunde — mai ales când VREA să intre în piață. Dacă te surprinzi micșorând timeframe-ul sau dând zoom ca să „găsești” un motiv de intrare, închide graficul. Setup-urile bune se văd în 5 secunde; tot ce necesită căutare insistentă e dorință, nu analiză.",
              en: "Your brain finds patterns everywhere — especially when it WANTS to be in the market. If you catch yourself dropping timeframes or zooming in to 'find' a reason to enter, close the chart. Good setups are visible in 5 seconds; anything that requires determined searching is desire, not analysis.",
            },
          },
        ],
      },
    ],
  },
  diagrams: {
    "m3-doji-variants": {
      candles: [
        { o: 50, h: 64, l: 38, c: 51 },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 78, l: 22, c: 49 },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 60, h: 62, l: 26, c: 61 },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 40, h: 74, l: 38, c: 39 },
      ],
      labels: [
        { x: 0, y: 90, text: "Doji", color: "#71717a" },
        { x: 2, y: 90, text: "Long-legged", color: "#71717a" },
        { x: 4, y: 90, text: "Dragonfly", color: "#10b981" },
        { x: 6, y: 90, text: "Gravestone", color: "#f43f5e" },
      ],
      caption: {
        ro: "Variantele de doji: corp minuscul, povești diferite. Dragonfly = respingere de jos (bias bullish), gravestone = respingere de sus (bias bearish).",
        en: "Doji variants: tiny body, different stories. Dragonfly = rejection from below (bullish bias), gravestone = rejection from above (bearish bias).",
      },
    },
    "m3-marubozu": {
      candles: [
        { o: 26, h: 78, l: 26, c: 78 },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 78, h: 78, l: 26, c: 26 },
      ],
      labels: [
        { x: 0, y: 88, text: "Marubozu bullish", color: "#10b981" },
        { x: 6, y: 88, text: "Marubozu bearish", color: "#f43f5e" },
      ],
      caption: {
        ro: "Marubozu: corp plin, fără fitile — o singură tabără a controlat piața de la Open la Close.",
        en: "Marubozu: a full body with no wicks — one side controlled the market from Open to Close.",
      },
    },
    "m3-hammer": {
      candles: [
        { o: 66, h: 70, l: 58, c: 60 },
        { o: 60, h: 63, l: 52, c: 54 },
        { o: 54, h: 57, l: 45, c: 47 },
        { o: 47, h: 50, l: 38, c: 40 },
        { o: 40, h: 43, l: 32, c: 34 },
        { o: 34, h: 36, l: 22, c: 35 },
        { o: 35, h: 44, l: 33, c: 42 },
        { o: 42, h: 50, l: 40, c: 48 },
        { o: 48, h: 55, l: 46, c: 53 },
        { o: 53, h: 60, l: 51, c: 58 },
        { o: 58, h: 66, l: 56, c: 63 },
      ],
      zones: [{ y1: 22, y2: 30, color: "#10b981", label: "Support" }],
      arrows: [{ x: 5, y: 16, dir: "up", color: "#10b981", label: "Hammer" }],
      caption: {
        ro: "Hammer la suport, după downtrend: fitilul lung intră în zonă (respingere), iar lumânările următoare confirmă inversarea.",
        en: "A hammer at support, after a downtrend: the long wick dips into the zone (rejection) and the following candles confirm the reversal.",
      },
    },
    "m3-shooting-star": {
      candles: [
        { o: 30, h: 36, l: 28, c: 34 },
        { o: 34, h: 41, l: 32, c: 39 },
        { o: 39, h: 46, l: 37, c: 44 },
        { o: 44, h: 52, l: 42, c: 50 },
        { o: 50, h: 58, l: 48, c: 56 },
        { o: 56, h: 63, l: 54, c: 61 },
        { o: 61, h: 76, l: 59, c: 60 },
        { o: 60, h: 62, l: 52, c: 54 },
        { o: 54, h: 56, l: 46, c: 48 },
        { o: 48, h: 51, l: 41, c: 43 },
        { o: 43, h: 45, l: 35, c: 38 },
      ],
      levels: [{ y: 74, label: "Resistance", color: "#f43f5e", dashed: true }],
      arrows: [{ x: 6, y: 82, dir: "down", color: "#f43f5e", label: "Shooting star" }],
      caption: {
        ro: "Shooting star la rezistență: fitilul lung superior străpunge nivelul, prinde cumpărătorii sus, iar close-ul jos anunță scăderea.",
        en: "A shooting star at resistance: the long upper wick pierces the level, traps buyers up high, and the low close announces the decline.",
      },
    },
    "m3-engulfing": {
      candles: [
        { o: 64, h: 68, l: 56, c: 58 },
        { o: 58, h: 61, l: 50, c: 52 },
        { o: 52, h: 55, l: 44, c: 46 },
        { o: 46, h: 49, l: 38, c: 40 },
        { o: 40, h: 42, l: 33, c: 35 },
        { o: 34, h: 46, l: 31, c: 44 },
        { o: 44, h: 52, l: 42, c: 50 },
        { o: 50, h: 57, l: 48, c: 55 },
        { o: 55, h: 62, l: 53, c: 60 },
        { o: 60, h: 65, l: 56, c: 58 },
        { o: 58, h: 68, l: 57, c: 66 },
      ],
      zones: [{ x1: 3.6, x2: 5.4, y1: 29, y2: 48, color: "#818cf8" }],
      arrows: [{ x: 5, y: 24, dir: "up", color: "#10b981", label: "Engulfing" }],
      caption: {
        ro: "Bullish engulfing după downtrend: corpul verde acoperă complet corpul roșu precedent, iar follow-through-ul confirmă preluarea controlului.",
        en: "A bullish engulfing after a downtrend: the green body fully covers the preceding red body, and the follow-through confirms the takeover.",
      },
    },
    "m3-harami": {
      candles: [
        { o: 74, h: 78, l: 68, c: 70 },
        { o: 70, h: 74, l: 62, c: 64 },
        { o: 64, h: 66, l: 56, c: 58 },
        { o: 58, h: 60, l: 48, c: 50 },
        { o: 50, h: 52, l: 38, c: 40 },
        { o: 43, h: 47, l: 41, c: 46 },
        { o: 46, h: 54, l: 44, c: 52 },
        { o: 52, h: 58, l: 50, c: 56 },
        { o: 56, h: 63, l: 54, c: 61 },
        { o: 61, h: 66, l: 58, c: 64 },
      ],
      zones: [{ x1: 3.6, x2: 5.4, y1: 36, y2: 54, color: "#818cf8" }],
      labels: [{ x: 4.5, y: 31, text: "Harami", color: "#818cf8" }],
      caption: {
        ro: "Harami bullish: după impulsul bearish, lumânarea mică stă complet în corpul lumânării-mamă — momentum pierdut, confirmat apoi de creștere.",
        en: "A bullish harami: after the bearish impulse, the small candle sits entirely inside the mother candle's body — momentum lost, then confirmed by the rally.",
      },
    },
    "m3-tweezers": {
      candles: [
        { o: 68, h: 72, l: 60, c: 62 },
        { o: 62, h: 65, l: 54, c: 56 },
        { o: 56, h: 59, l: 47, c: 49 },
        { o: 49, h: 52, l: 40, c: 42 },
        { o: 42, h: 44, l: 30, c: 34 },
        { o: 34, h: 42, l: 30, c: 40 },
        { o: 40, h: 48, l: 38, c: 46 },
        { o: 46, h: 53, l: 44, c: 51 },
        { o: 51, h: 58, l: 49, c: 56 },
        { o: 56, h: 62, l: 54, c: 60 },
      ],
      levels: [{ y: 30, label: "Equal lows", color: "#10b981", dashed: true }],
      arrows: [{ x: 4.5, y: 22, dir: "up", color: "#10b981", label: "Tweezer bottom" }],
      caption: {
        ro: "Tweezer bottom în downtrend: două Low-uri identice = respingere dublă din exact același preț — cineva apără nivelul.",
        en: "A tweezer bottom in a downtrend: two identical Lows = a double rejection from exactly the same price — someone is defending the level.",
      },
    },
    "m3-morning-star": {
      candles: [
        { o: 78, h: 82, l: 70, c: 72 },
        { o: 72, h: 76, l: 64, c: 66 },
        { o: 66, h: 69, l: 58, c: 60 },
        { o: 60, h: 63, l: 52, c: 54 },
        { o: 54, h: 56, l: 44, c: 46 },
        { o: 44, h: 47, l: 39, c: 42 },
        { o: 44, h: 58, l: 42, c: 56 },
        { o: 56, h: 62, l: 54, c: 60 },
        { o: 60, h: 66, l: 58, c: 64 },
        { o: 64, h: 70, l: 62, c: 68 },
      ],
      zones: [{ x1: 3.6, x2: 6.4, y1: 36, y2: 59, color: "#818cf8" }],
      labels: [{ x: 5, y: 31, text: "Morning Star", color: "#10b981" }],
      caption: {
        ro: "Morning star în trei acte: impuls bearish, steaua cu corp mic (echilibru), apoi lumânarea bullish care închide peste jumătatea primului corp.",
        en: "The morning star in three acts: a bearish impulse, the small-bodied star (equilibrium), then the bullish candle closing above the first body's midpoint.",
      },
    },
    "m3-three-soldiers": {
      candles: [
        { o: 46, h: 50, l: 40, c: 42 },
        { o: 42, h: 45, l: 36, c: 38 },
        { o: 38, h: 41, l: 32, c: 34 },
        { o: 34, h: 37, l: 29, c: 31 },
        { o: 31, h: 34, l: 27, c: 33 },
        { o: 32, h: 45, l: 30, c: 43 },
        { o: 40, h: 55, l: 38, c: 53 },
        { o: 50, h: 65, l: 48, c: 63 },
        { o: 63, h: 68, l: 59, c: 61 },
        { o: 61, h: 72, l: 60, c: 70 },
      ],
      arrows: [
        { x: 5, y: 25, dir: "up", color: "#10b981" },
        { x: 6, y: 33, dir: "up", color: "#10b981" },
        { x: 7, y: 43, dir: "up", color: "#10b981" },
      ],
      labels: [{ x: 6, y: 76, text: "3 White Soldiers", color: "#10b981" }],
      caption: {
        ro: "Three white soldiers după downtrend: trei corpuri pline consecutive, fiecare deschizând în corpul precedent și închizând lângă High — schimbare de regim.",
        en: "Three white soldiers after a downtrend: three consecutive full bodies, each opening inside the previous body and closing near its High — a regime change.",
      },
    },
    "m3-confluenta": {
      candles: [
        { o: 52, h: 55, l: 44, c: 46 },
        { o: 46, h: 49, l: 38, c: 40 },
        { o: 40, h: 43, l: 29, c: 33 },
        { o: 33, h: 45, l: 31, c: 43 },
        { o: 43, h: 52, l: 41, c: 50 },
        { o: 50, h: 57, l: 47, c: 55 },
        { o: 55, h: 58, l: 48, c: 50 },
        { o: 50, h: 52, l: 42, c: 44 },
        { o: 44, h: 46, l: 36, c: 38 },
        { o: 38, h: 40, l: 27, c: 39 },
        { o: 39, h: 47, l: 37, c: 45 },
        { o: 45, h: 53, l: 43, c: 51 },
        { o: 51, h: 60, l: 49, c: 57 },
      ],
      zones: [{ y1: 28, y2: 34, color: "#10b981", label: "Support zone" }],
      arrows: [
        { x: 2, y: 23, dir: "up", color: "#71717a", label: "Test 1" },
        { x: 9, y: 20, dir: "up", color: "#10b981", label: "Hammer" },
      ],
      caption: {
        ro: "Confluența la lucru: zona de suport testată anterior + hammer al cărui fitil mătură zona = locație + declanșator. Intrare peste High-ul hammer-ului, stop sub fitil.",
        en: "Confluence at work: a previously tested support zone + a hammer whose wick sweeps the zone = location + trigger. Entry above the hammer's High, stop below the wick.",
      },
    },
  },
};
