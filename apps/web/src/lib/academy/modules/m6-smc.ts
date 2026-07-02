import type { ModuleBundle } from "../types";

// ── M6: Smart Money Concepts (Avansat) ──────────────────────────────────────

export const M6_BUNDLE: ModuleBundle = {
  module: {
    id: "smart-money-concepts",
    level: "ADVANCED",
    icon: "brain",
    title: { ro: "Smart Money Concepts (SMC)", en: "Smart Money Concepts (SMC)" },
    description: {
      ro: "Structură de piață avansată, lichiditate, Order Blocks, Fair Value Gaps și zone premium/discount — cum citești urmele lăsate de banii instituționali pe grafic, fără mistică.",
      en: "Advanced market structure, liquidity, Order Blocks, Fair Value Gaps and premium/discount zones — how to read the footprints institutional money leaves on the chart, without the mysticism.",
    },
    lessons: [
      {
        id: "structura-de-piata-pro",
        title: { ro: "Structură de piață pro: BOS și CHoCH", en: "Pro market structure: BOS and CHoCH" },
        minutes: 11,
        sections: [
          {
            body: {
              ro: "**Smart Money Concepts (SMC)** este un cadru de citire a graficului pornind de la o întrebare simplă: unde au acționat jucătorii mari? Băncile și fondurile nu pot intra într-o poziție de sute de milioane dintr-un singur click — își construiesc pozițiile în etape, iar procesul lasă urme vizibile: rupturi de structură, vânători de stopuri, zone de dezechilibru.\n\nSă fim clari de la început: SMC nu este magie și nu îți arată „ce fac instituțiile\" în timp real. Este un set de euristici despre AMPRENTELE pe care execuția ordinelor mari le lasă pe grafic. Tratat cu rigoare, îți dă un avantaj real de citire a contextului. Tratat ca o religie, devine o colecție de dreptunghiuri desenate peste tot.",
              en: "**Smart Money Concepts (SMC)** is a framework for reading the chart starting from one simple question: where did the big players act? Banks and funds can't enter a position worth hundreds of millions with a single click — they build positions in stages, and that process leaves visible traces: structure breaks, stop hunts, imbalance zones.\n\nLet's be clear from the start: SMC is not magic and it does not show you 'what institutions are doing' in real time. It is a set of heuristics about the FOOTPRINTS that large-order execution leaves on the chart. Treated with rigor, it gives you a real contextual edge. Treated as a religion, it becomes a collection of rectangles drawn everywhere.",
            },
          },
          {
            heading: { ro: "Swing points: scheletul structurii", en: "Swing points: the skeleton of structure" },
            body: {
              ro: "Înainte de BOS și CHoCH ai nevoie de definiții precise:\n\n- **Swing High** — o lumânare al cărei maxim este mai sus decât maximele lumânărilor din stânga și din dreapta ei. Un vârf local confirmat.\n- **Swing Low** — inversul: un minim local, cu minime mai ridicate de ambele părți.\n\nAceste puncte sunt scheletul structurii. Într-un uptrend, swing-urile formează HH și HL; într-un downtrend, LH și LL. Tot SMC-ul se construiește pe acest schelet: fără swing-uri marcate corect, BOS și CHoCH devin arbitrare.\n\nDiferențiază și **structura majoră** (swing-urile mari, vizibile pe H4/D1) de **structura internă** (oscilațiile mărunte dintre două swing-uri majore, vizibile pe M15). Confuzia dintre ele este sursa numărul unu de „CHoCH-uri\" false raportate de începători.",
              en: "Before BOS and CHoCH you need precise definitions:\n\n- **Swing High** — a candle whose high is higher than the highs of the candles to its left and right. A confirmed local top.\n- **Swing Low** — the mirror image: a local low with higher lows on both sides.\n\nThese points are the skeleton of structure. In an uptrend, swings print HH and HL; in a downtrend, LH and LL. All of SMC is built on this skeleton: without correctly marked swings, BOS and CHoCH become arbitrary.\n\nAlso separate **major structure** (the big swings, visible on H4/D1) from **internal structure** (the small oscillations between two major swings, visible on M15). Confusing the two is the number one source of false 'CHoCHs' reported by beginners.",
            },
            tip: {
              ro: "Alege o definiție a swing-ului (de exemplu: maxim/minim cu 2 lumânări mai slabe de fiecare parte) și n-o mai schimba. Consistența definiției bate perfecțiunea ei — doar așa poți compara setup-urile între ele în jurnal.",
              en: "Pick one swing definition (e.g. a high/low with 2 weaker candles on each side) and never change it. Consistency of the definition beats its perfection — it's the only way your journaled setups stay comparable.",
            },
          },
          {
            heading: { ro: "BOS — Break of Structure", en: "BOS — Break of Structure" },
            body: {
              ro: "**BOS (Break of Structure)** = prețul rupe ultimul swing în DIRECȚIA trendului existent. Într-un uptrend, un BOS înseamnă spargerea ultimului Swing High; într-un downtrend, spargerea ultimului Swing Low.\n\nMesajul unui BOS este continuarea: cumpărătorii (sau vânzătorii) încă domină, structura se extinde. După un BOS bullish, scenariul de bază devine: retragere → un nou HL → încă un impuls.\n\nUn detaliu care desparte amatorii de profesioniști: **ruptura prin închidere** (candle close dincolo de nivel) este mult mai credibilă decât o simplă înțepătură cu fitilul. Fitil prin nivel + închidere înapoi sub el nu este BOS — este, de multe ori, exact opusul: un sweep de lichiditate (lecția următoare).",
              en: "**BOS (Break of Structure)** = price breaks the most recent swing IN the direction of the existing trend. In an uptrend, a BOS means breaking the last Swing High; in a downtrend, breaking the last Swing Low.\n\nThe message of a BOS is continuation: buyers (or sellers) are still in control and the structure is extending. After a bullish BOS, the base case becomes: pullback → a new HL → another impulse.\n\nOne detail that separates amateurs from professionals: a **break by close** (a candle closing beyond the level) is far more credible than a mere wick poke. Wick through the level + close back below it is not a BOS — very often it's the exact opposite: a liquidity sweep (next lesson).",
            },
          },
          {
            heading: { ro: "CHoCH — Change of Character", en: "CHoCH — Change of Character" },
            body: {
              ro: "**CHoCH (Change of Character)** = prima ruptură ÎMPOTRIVA direcției curente. Într-un uptrend care face HH și HL, momentul în care prețul sparge ultimul Higher Low este CHoCH: caracterul pieței s-a schimbat, cumpărătorii au cedat pentru prima dată terenul.\n\nSecvența tipică de pe diagramă merită memorată:\n\n- uptrend sănătos: HL → BOS peste Swing High → HH\n- prețul încearcă un nou maxim, dar eșuează: **LH** (primul avertisment)\n- spargerea ultimului HL: **CHoCH** (confirmarea schimbării)\n\nCHoCH NU este un semnal de intrare în sine — este o schimbare de CONTEXT. După un CHoCH bearish nu mai cauți long-uri pe retrageri; începi să evaluezi short-uri pe retestarea zonelor de deasupra.",
              en: "**CHoCH (Change of Character)** = the first break AGAINST the current direction. In an uptrend printing HH and HL, the moment price breaks the last Higher Low is the CHoCH: the market's character has changed and buyers have given up ground for the first time.\n\nThe typical sequence on the diagram is worth memorizing:\n\n- healthy uptrend: HL → BOS above the Swing High → HH\n- price attempts a new high but fails: **LH** (the first warning)\n- the break of the last HL: **CHoCH** (the confirmation of change)\n\nA CHoCH is NOT an entry signal by itself — it is a change of CONTEXT. After a bearish CHoCH you stop hunting longs on pullbacks and start evaluating shorts on retests of the zones above.",
            },
            diagram: "m6-bos-choch",
            warning: {
              ro: "Pe timeframe-uri mici vei vedea zeci de „CHoCH-uri\" pe zi — majoritatea sunt zgomot din structura internă. Un CHoCH contează atât cât contează swing-ul rupt: unul pe H4 schimbă contextul zilei; unul pe M1 schimbă doar următoarele 15 minute.",
              en: "On small timeframes you'll see dozens of 'CHoCHs' per day — most are internal-structure noise. A CHoCH matters exactly as much as the swing it breaks: one on H4 changes the day's context; one on M1 changes only the next 15 minutes.",
            },
          },
        ],
      },
      {
        id: "lichiditatea",
        title: { ro: "Lichiditatea: unde stau stopurile", en: "Liquidity: where the stops live" },
        minutes: 12,
        sections: [
          {
            heading: { ro: "Ce este lichiditatea, de fapt", en: "What liquidity actually is" },
            body: {
              ro: "În SMC, **lichiditatea** are un sens precis: locurile din grafic unde stau aglomerate ORDINE — în special stop loss-uri și ordine pending de breakout. Nu e o metaforă: fiecare stop loss al unui long este un ordin de VÂNZARE care se execută automat; fiecare stop al unui short este un ordin de CUMPĂRARE.\n\nDe ce contează? Pentru că jucătorii mari au o problemă pe care tu nu o ai: dimensiunea. Ca să cumpere poziții uriașe fără să arunce prețul în aer, au nevoie de contrapartidă — de un val de ordine de vânzare în care să-și umple cumpărările. Iar cel mai previzibil val de vânzări din piață sunt stopurile long-urilor, adunate sub un nivel evident.\n\nDe aceea prețul pare atât de des „atras\" de nivelurile evidente: acolo este combustibilul.",
              en: "In SMC, **liquidity** has a precise meaning: the places on the chart where ORDERS cluster — especially stop losses and pending breakout orders. It's not a metaphor: every stop loss on a long position is a SELL order that executes automatically; every stop on a short is a BUY order.\n\nWhy does this matter? Because big players have a problem you don't: size. To buy huge positions without launching price into the air, they need a counterparty — a wave of sell orders to fill their buying into. And the most predictable wave of selling in the market is the longs' stops, clustered below an obvious level.\n\nThat's why price so often seems 'attracted' to obvious levels: that's where the fuel is.",
            },
          },
          {
            heading: { ro: "EQH / EQL — maxime și minime egale", en: "EQH / EQL — equal highs and lows" },
            body: {
              ro: "- **EQH (Equal Highs)** — două sau mai multe maxime la aproape același nivel. Retailul vede „rezistență dublă\"; deasupra ei stau stopurile short-urilor plus ordinele buy stop ale traderilor de breakout. Un bazin de cumpărări.\n- **EQL (Equal Lows)** — minime egale; „suport dublu\" sub care dorm stopurile long-urilor. Un bazin de vânzări.\n\nCu cât nivelul este mai curat și mai vizibil, cu atât mai multe stopuri se adună acolo — și cu atât mai probabil devine ca prețul să-l viziteze înainte de mișcarea reală. De aceea în SMC se spune că EQH/EQL „cheamă\" prețul: nivelurile perfecte rareori rezistă neatinse.",
              en: "- **EQH (Equal Highs)** — two or more highs at nearly the same level. Retail sees 'double resistance'; above it sit the shorts' stops plus the breakout traders' buy stops. A pool of buy orders.\n- **EQL (Equal Lows)** — equal lows; 'double support' below which the longs' stops sleep. A pool of sell orders.\n\nThe cleaner and more visible the level, the more stops accumulate there — and the more likely price becomes to visit it before the real move. That's why SMC says EQH/EQL 'call' price: perfect levels rarely survive untouched.",
            },
          },
          {
            heading: { ro: "Lichiditate pe trendline și pe extremele evidente", en: "Trendline liquidity and the obvious extremes" },
            body: {
              ro: "- **Trendline liquidity** — o trendline atinsă de 3-4 ori pare de neclintit, deci sute de traderi își pun stopurile chiar sub ea. O străpungere scurtă a liniei urmată de revenire este adesea doar recoltarea acelor stopuri, nu o schimbare de trend.\n- **Extremele evidente** — maximul zilei precedente (PDH), minimul săptămânii, maximul sesiunii Asia: toate sunt rafturi de stopuri ale pieței, vizitate cu o regularitate suspectă.\n\nExercițiu de gândire inversă: oriunde ai pune TU stopul „la adăpost\", acolo îl pun alte câteva mii de conturi. Adăpostul evident nu există — există doar lichiditate care așteaptă să fie luată.",
              en: "- **Trendline liquidity** — a trendline touched 3-4 times looks unbreakable, so hundreds of traders park their stops right below it. A brief pierce of the line followed by a recovery is often just the harvesting of those stops, not a trend change.\n- **The obvious extremes** — the previous day's high (PDH), the week's low, the Asia session high: all of them are the market's stop shelves, visited with suspicious regularity.\n\nA reverse-thinking exercise: wherever YOU would put your stop 'out of harm's way', a few thousand other accounts put theirs too. The obvious shelter doesn't exist — only liquidity waiting to be taken.",
            },
            tip: {
              ro: "Marchează în fiecare dimineață PDH/PDL și maximele/minimele sesiunilor pe instrumentul tău. Seara, verifică în jurnal câte dintre ele au fost „măturate\" înainte de mișcarea direcțională a zilei. Procentul te va surprinde.",
              en: "Every morning, mark the PDH/PDL and the session highs/lows on your instrument. In the evening, check in your journal how many were 'swept' before the day's directional move. The percentage will surprise you.",
            },
          },
          {
            heading: { ro: "Sweep-ul: recoltarea lichidității", en: "The sweep: harvesting liquidity" },
            body: {
              ro: "**Liquidity sweep** (stop hunt, raid) = o mișcare rapidă care străpunge nivelul cu stopuri, le execută și apoi se ÎNTOARCE. Pe grafic rămâne semnătura clasică: fitil lung prin nivel + închidere înapoi în interiorul range-ului.\n\nSecvența de pe diagramă este scenariul-manual: EQH vizibile → împingere prin ele (stopurile short-urilor se execută, traderii de breakout cumpără) → exact în acel val de cumpărări, jucătorii mari își vând pozițiile sau își deschid short-urile → inversare agresivă.\n\nDupă un sweep urmat de respingere clară, întrebarea corectă nu este „de ce a scăzut?\", ci „cine a rămas blocat pe partea greșită?\". Traderii de breakout prinși long deasupra EQH devin combustibilul scăderii: stopurile LOR se execută acum în jos.",
              en: "A **liquidity sweep** (stop hunt, raid) = a fast move that pierces the level holding the stops, executes them, and then TURNS BACK. The chart keeps the classic signature: a long wick through the level + a close back inside the range.\n\nThe sequence on the diagram is the textbook scenario: visible EQH → a push through them (shorts' stops execute, breakout traders buy) → into exactly that wave of buying, big players sell their positions or open their shorts → aggressive reversal.\n\nAfter a sweep followed by clear rejection, the right question is not 'why did it drop?' but 'who is now trapped on the wrong side?'. Breakout traders caught long above the EQH become the fuel of the decline: THEIR stops now execute downward.",
            },
            diagram: "m6-liquidity-sweep",
            warning: {
              ro: "Nu orice străpungere este sweep. Diferența este ACCEPTAREA: sweep = fitil prin nivel + închidere rapidă înapoi; breakout real = închidere dincolo de nivel, urmată de consolidare acolo. Dacă prețul stă confortabil peste EQH mai multe lumânări la rând, nu a fost vânătoare de stopuri — a fost expansiune.",
              en: "Not every break is a sweep. The difference is ACCEPTANCE: sweep = wick through the level + a quick close back inside; real breakout = a close beyond the level followed by consolidation there. If price sits comfortably above the EQH for several candles, it wasn't a stop hunt — it was expansion.",
            },
          },
        ],
      },
      {
        id: "order-blocks",
        title: { ro: "Order Blocks: amprenta ordinelor mari", en: "Order Blocks: the footprint of large orders" },
        minutes: 11,
        sections: [
          {
            body: {
              ro: "**Order Block (OB)** = ultima lumânare de sens OPUS dinaintea unei mișcări impulsive care rupe structura. Pentru un OB bullish: ultima lumânare bearish dinaintea unui impuls în sus. Pentru un OB bearish: ultima lumânare bullish dinaintea prăbușirii.\n\nLogica din spate, spusă fără mistică: acolo unde un jucător mare a început să-și execute cumpărările, ultimele vânzări dinaintea impulsului marchează zona lui de acumulare. Dacă nu și-a umplut toată poziția (de obicei nu poate dintr-o dată), interesul lui rămâne în acea zonă — iar la revenirea prețului, restul ordinelor pot apăra zona.\n\nEste o euristică plauzibilă, susținută de felul în care se execută ordinele mari — dar rămâne o euristică, nu o certitudine. Un OB este o ZONĂ DE INTERES în care aștepți reacție, nu un buton de cumpărat.",
              en: "An **Order Block (OB)** = the last OPPOSITE-direction candle before an impulsive move that breaks structure. For a bullish OB: the last bearish candle before an impulse up. For a bearish OB: the last bullish candle before the collapse.\n\nThe logic behind it, stated without mysticism: where a large player started executing their buying, the final selling before the impulse marks their accumulation zone. If they didn't fill their whole position (they usually can't in one go), their interest remains in that zone — and when price returns, the remaining orders can defend it.\n\nIt's a plausible heuristic, supported by how large orders get executed — but it remains a heuristic, not a certainty. An OB is a ZONE OF INTEREST where you wait for a reaction, not a buy button.",
            },
          },
          {
            heading: { ro: "Cum desenezi corect un OB", en: "How to draw an OB correctly" },
            body: {
              ro: "- Identifică impulsul: o mișcare puternică, direcțională, care rupe un swing (BOS sau CHoCH). Fără ruptură de structură nu ai un OB valid — ai doar o lumânare roșie oarecare.\n- Ia ultima lumânare opusă dinaintea impulsului și trasează zona pe TOATĂ amplitudinea ei (de la high la low). Varianta conservatoare folosește doar corpul (open→close); important este să alegi o convenție și să o păstrezi.\n- Pe timeframe-ul mic poți rafina: din OB-ul de pe H4 păstrezi doar porțiunea confirmată de structura de pe M15.\n\nCele mai valoroase OB-uri au trei calități: au produs **displacement** (impuls violent, nu o creștere leneșă), au rupt structură și, ideal, s-au format imediat după un **sweep de lichiditate** — combinația clasică „grab & go\".",
              en: "- Identify the impulse: a strong, directional move that breaks a swing (BOS or CHoCH). Without a structure break you don't have a valid OB — you just have some red candle.\n- Take the last opposite candle before the impulse and draw the zone over its FULL range (high to low). The conservative variant uses only the body (open→close); what matters is picking one convention and sticking to it.\n- On the lower timeframe you can refine: from the H4 OB you keep only the portion confirmed by M15 structure.\n\nThe most valuable OBs share three qualities: they produced **displacement** (a violent impulse, not a lazy drift), they broke structure and, ideally, they formed right after a **liquidity sweep** — the classic 'grab & go' combination.",
            },
          },
          {
            heading: { ro: "Mitigation: întoarcerea în zonă", en: "Mitigation: the return to the zone" },
            body: {
              ro: "**Mitigation** = revenirea prețului în zona OB după impulsul inițial. Aici se pot întâmpla două lucruri: ordinele rămase neexecutate se umplu, iar pozițiile prinse pe partea greșită se închid pe break-even — ambele generează exact reacția pe care o tranzacționezi.\n\nReguli practice:\n\n- **Prima atingere** este cea mai valoroasă: zona e „proaspătă\" (unmitigated), interesul e intact.\n- Cu fiecare re-testare, zona se consumă. Un OB traversat de 3 ori nu mai apără nimic.\n- Reacția vrei să o vezi RAPID: prețul intră în zonă și respinge decisiv. Dacă „mestecă\" zona lumânare după lumânare, ordinele care trebuia să o apere fie nu există, fie au fost deja consumate.",
              en: "**Mitigation** = price returning into the OB zone after the initial impulse. Two things can happen there: the remaining unfilled orders get filled, and positions trapped on the wrong side get closed at break-even — both generate exactly the reaction you're trading.\n\nPractical rules:\n\n- **The first touch** is the most valuable: the zone is 'fresh' (unmitigated), the interest intact.\n- Every retest consumes the zone. An OB traded through 3 times no longer defends anything.\n- You want to see the reaction FAST: price enters the zone and rejects decisively. If it 'chews' through the zone candle after candle, the orders that were supposed to defend it either don't exist or have already been consumed.",
            },
            diagram: "m6-order-block",
          },
          {
            heading: { ro: "Filtrul de calitate", en: "The quality filter" },
            body: {
              ro: "Pe orice grafic poți desena zeci de OB-uri — și exact aici eșuează majoritatea traderilor de SMC: tratează fiecare dreptunghi ca pe un semnal. Filtrează dur; un OB merită atenție doar dacă bifează:\n\n- **Displacement** real după el (impuls, FVG-uri lăsate în urmă)\n- **Ruptură de structură** produsă de impuls (BOS/CHoCH)\n- **Lichiditate luată** înainte (sweep al unui EQL sau al unui minim evident)\n- **Poziție corectă** în range: OB bullish în discount, OB bearish în premium (lecția 5)\n- **Zonă proaspătă**, nemitigată\n\nUn OB care bifează unul din cinci este zgomot. Unul care bifează toate cinci este un loc unde merită să riști 1R.",
              en: "On any chart you can draw dozens of OBs — and this is exactly where most SMC traders fail: they treat every rectangle as a signal. Filter hard; an OB deserves attention only if it ticks:\n\n- Real **displacement** after it (an impulse, FVGs left behind)\n- A **structure break** produced by the impulse (BOS/CHoCH)\n- **Liquidity taken** beforehand (a sweep of an EQL or an obvious low)\n- **Correct position** in the range: bullish OB in discount, bearish OB in premium (lesson 5)\n- A **fresh, unmitigated zone**\n\nAn OB ticking one of five is noise. One ticking all five is a place worth risking 1R.",
            },
            warning: {
              ro: "Cea mai scumpă greșeală: limit order orb pe fiecare OB, fără confirmare și fără context. În downtrend-urile puternice, OB-urile bullish sunt străpunse pe bandă rulantă. OB-ul îți dă ZONA; structura de pe timeframe-ul mic (un CHoCH minor în zonă) îți dă permisiunea.",
              en: "The most expensive mistake: a blind limit order on every OB, with no confirmation and no context. In strong downtrends, bullish OBs get run through one after another. The OB gives you the ZONE; lower-timeframe structure (a minor CHoCH inside the zone) gives you permission.",
            },
            tip: {
              ro: "Loghează în jurnalul TradeGx, pentru fiecare tranzacție pe OB, care dintre cele 5 criterii au fost bifate. După 30-50 de tranzacții vei ști exact ce combinație funcționează pe instrumentul tău — date, nu impresii.",
              en: "For every OB trade, log in your TradeGx journal which of the 5 criteria were ticked. After 30-50 trades you'll know exactly which combination works on your instrument — data, not impressions.",
            },
          },
        ],
      },
      {
        id: "fvg-imbalance",
        title: { ro: "Imbalance și Fair Value Gaps (FVG)", en: "Imbalance and Fair Value Gaps (FVG)" },
        minutes: 10,
        sections: [
          {
            body: {
              ro: "Piața este o licitație în două sensuri: în fiecare moment, cumpărători și vânzători negociază prețul. Când una dintre părți devine atât de agresivă încât cealaltă abia apucă să tranzacționeze, licitația devine unilaterală — prețul sare pur și simplu peste niveluri. Rezultatul se numește **imbalance** (dezechilibru): o porțiune de grafic parcursă atât de repede încât schimbul „corect\" nu a avut loc acolo.\n\nCea mai folosită metodă de a identifica un dezechilibru este **Fair Value Gap (FVG)** — un tipar de 3 lumânări.",
              en: "The market is a two-way auction: at every moment, buyers and sellers negotiate price. When one side becomes so aggressive that the other barely gets to trade, the auction turns one-sided — price simply jumps across levels. The result is called an **imbalance**: a stretch of the chart traversed so quickly that no 'fair' two-way exchange happened there.\n\nThe most widely used way to identify an imbalance is the **Fair Value Gap (FVG)** — a 3-candle pattern.",
            },
          },
          {
            heading: { ro: "Definiția pe 3 lumânări", en: "The 3-candle definition" },
            body: {
              ro: "Un **FVG bullish** apare când lumânarea din mijloc este atât de impulsivă încât:\n\n- maximul lumânării 1 și minimul lumânării 3 NU se suprapun\n- spațiul dintre ele — dintre high-ul lumânării 1 și low-ul lumânării 3 — este golul: FVG-ul\n\nÎn acel interval de preț a tranzacționat practic o singură parte a pieței (cumpărătorii, în cazul bullish). Pentru un **FVG bearish**, invers: golul se măsoară între minimul lumânării 1 și maximul lumânării 3.\n\nCu cât lumânarea din mijloc e mai mare și golul mai lat, cu atât dezechilibrul este mai semnificativ — FVG-ul este chiar definiția vizuală a displacement-ului despre care am vorbit la Order Blocks.",
              en: "A **bullish FVG** appears when the middle candle is so impulsive that:\n\n- the high of candle 1 and the low of candle 3 do NOT overlap\n- the space between them — between candle 1's high and candle 3's low — is the gap: the FVG\n\nWithin that price interval, essentially only one side of the market traded (buyers, in the bullish case). For a **bearish FVG**, the reverse: the gap is measured between candle 1's low and candle 3's high.\n\nThe bigger the middle candle and the wider the gap, the more significant the imbalance — the FVG is the visual definition of the displacement we discussed with Order Blocks.",
            },
            diagram: "m6-fvg",
          },
          {
            heading: { ro: "De ce se întoarce prețul în FVG", en: "Why price returns to fill FVGs" },
            body: {
              ro: "Explicația lucidă, fără povești:\n\n- **Licitația caută eficiență** — zonele parcurse fără schimb real rămân „nefinisate\"; când agresivitatea inițială se epuizează, prețul retestează frecvent zona pentru a găsi contrapartidă la prețuri mai bune.\n- **Ordine instituționale neterminate** — cine a împins prețul nu și-a umplut neapărat toată poziția; golul este chiar harta zonei lui de execuție.\n- **Profit taking** — retragerile naturale de după impuls se opresc des exact în gol, unde nu există niveluri tranzacționate care să le stea în cale.\n\nRealitatea statistică: multe FVG-uri se umplu, dar NU toate și NU imediat. În trendurile puternice, golurile rămân deschise săptămâni întregi — iar asta este chiar dovada forței trendului.",
              en: "The sober explanation, no storytelling:\n\n- **The auction seeks efficiency** — zones traversed without real two-way trade remain 'unfinished'; once the initial aggression is spent, price frequently retests the area to find counterparties at better prices.\n- **Unfinished institutional orders** — whoever pushed price didn't necessarily fill their whole position; the gap is literally the map of their execution zone.\n- **Profit taking** — the natural pullbacks after an impulse often stall exactly inside the gap, where no traded levels stand in the way.\n\nThe statistical reality: many FVGs get filled, but NOT all and NOT immediately. In strong trends, gaps stay open for weeks — and that is precisely the evidence of the trend's strength.",
            },
          },
          {
            heading: { ro: "Cum folosești FVG-urile", en: "How to use FVGs" },
            body: {
              ro: "- **Ca zonă de intrare** — în trend, retragerea în FVG-ul lăsat de impulsul anterior este un loc logic de reintrare în direcția trendului, mai ales când FVG-ul se suprapune cu un OB sau cu un nivel de structură.\n- **Ca țintă** — un FVG vechi, neumplut, de pe un timeframe superior este un magnet rezonabil pentru take profit.\n- **Ca barometru de forță** — impulsul care lasă FVG-uri în urmă este sănătos; când ultimele mișcări nu mai produc goluri, agresivitatea moare.\n\nMulți traderi folosesc și punctul de mijloc al golului — **Consequent Encroachment (CE)**, la 50% din FVG — ca reper mai fin: umplerea până la CE păstrează scenariul; umplerea completă plus traversarea golului îl slăbește serios.",
              en: "- **As an entry zone** — in a trend, the pullback into the FVG left by the previous impulse is a logical re-entry spot in the trend's direction, especially when the FVG overlaps an OB or a structural level.\n- **As a target** — an old, unfilled FVG on a higher timeframe is a reasonable magnet for your take profit.\n- **As a strength barometer** — an impulse that leaves FVGs behind is healthy; when the latest moves stop producing gaps, the aggression is dying.\n\nMany traders also use the gap's midpoint — **Consequent Encroachment (CE)**, at 50% of the FVG — as a finer reference: a fill down to CE keeps the scenario alive; a complete fill plus a traversal of the gap seriously weakens it.",
            },
            tip: {
              ro: "FVG + OB + discount în același loc valorează mai mult decât oricare dintre ele separat. Caută SUPRAPUNERI, nu semnale izolate — confluența este tot jocul în SMC.",
              en: "FVG + OB + discount in the same spot is worth more than any of them alone. Hunt for OVERLAPS, not isolated signals — confluence is the whole game in SMC.",
            },
            warning: {
              ro: "Nu tranzacționa FVG-uri „în gol\", contra trendului, doar pentru că există un dreptunghi pe grafic. Un FVG bearish într-un uptrend agresiv nu e semnal de short — cel mai probabil e doar o pauză de respirație înainte de continuare.",
              en: "Don't trade FVGs 'in a vacuum', against the trend, just because a rectangle exists on the chart. A bearish FVG inside an aggressive uptrend is not a short signal — most likely it's just a breather before continuation.",
            },
          },
        ],
      },
      {
        id: "premium-discount",
        title: { ro: "Premium, discount și setup-ul complet", en: "Premium, discount and the complete setup" },
        minutes: 13,
        sections: [
          {
            heading: { ro: "Equilibrium: unde e „scump\" și unde e „ieftin\"", en: "Equilibrium: where it's 'expensive' and where it's 'cheap'" },
            body: {
              ro: "Ia ultimul **dealing range** relevant — de la swing low-ul până la swing high-ul care definesc mișcarea curentă — și împarte-l în două la **50%**: acesta este **equilibrium**.\n\n- Deasupra lui: **premium** — prețuri „scumpe\" raportat la range. Zona în care cauți vânzări și în care îți încasezi profitul de pe long-uri.\n- Sub el: **discount** — prețuri „ieftine\". Zona în care cauți cumpărări.\n\nLogica este cea a oricărui comerciant: cumperi ieftin, vinzi scump — raportat la range-ul în care lucrezi. Jucătorii care mișcă volume mari gândesc în termeni de valoare, nu de FOMO: nu cumpără la maximul range-ului „pentru că urcă\", ci așteaptă prețul în jumătatea ieftină.\n\nRegula practică: într-un context bullish, setup-urile long din discount au sens; aceleași setup-uri luate în premium înseamnă să cumperi exact acolo unde profesioniștii încasează.",
              en: "Take the last relevant **dealing range** — from the swing low to the swing high defining the current move — and split it in half at **50%**: that is **equilibrium**.\n\n- Above it: **premium** — 'expensive' prices relative to the range. The zone where you look for sells and where you bank profits on longs.\n- Below it: **discount** — 'cheap' prices. The zone where you look for buys.\n\nThe logic is any merchant's logic: buy cheap, sell expensive — relative to the range you're working in. Players moving serious volume think in terms of value, not FOMO: they don't buy the top of the range 'because it's going up', they wait for price in the cheap half.\n\nThe practical rule: in a bullish context, long setups from discount make sense; the same setups taken in premium mean buying exactly where professionals are cashing out.",
            },
            diagram: "m6-premium-discount",
          },
          {
            heading: { ro: "Cum alegi range-ul corect", en: "How to pick the right range" },
            body: {
              ro: "Premium/discount este relativ la RANGE, deci un range greșit duce la concluzii greșite:\n\n- Folosește ultima mișcare impulsivă relevantă de pe timeframe-ul de execuție, plus un nivel deasupra (H4 pentru intraday, D1/W1 pentru swing).\n- Range-ul se redefinește când structura se schimbă: după un BOS bullish, noul dealing range devine ultimul swing low → noul maxim.\n- Pe timeframe-uri diferite, același preț poate fi simultan în discount (pe D1) și în premium (pe M15). Nu este o contradicție — este exact nuanța care îți spune: direcția o iei de pe TF-ul mare, execuția o faci pe TF-ul mic.",
              en: "Premium/discount is relative to the RANGE, so the wrong range produces the wrong conclusions:\n\n- Use the last relevant impulsive move on your execution timeframe, plus one level above it (H4 for intraday, D1/W1 for swing).\n- The range redefines itself when structure changes: after a bullish BOS, the new dealing range becomes the last swing low → the new high.\n- On different timeframes, the same price can be simultaneously in discount (on D1) and in premium (on M15). That's not a contradiction — it's exactly the nuance telling you: take direction from the higher TF, execute on the lower TF.",
            },
          },
          {
            heading: { ro: "Setup-ul complet: sweep → CHoCH → OB", en: "The complete setup: sweep → CHoCH → OB" },
            body: {
              ro: "Acum leagă tot modulul într-o singură narațiune — modelul clasic de long în stil SMC:\n\n- **Contextul** — prețul coboară într-o zonă de discount a range-ului mare; sub minimele egale (EQL) s-a adunat lichiditate.\n- **Sweep-ul** — o împingere rapidă sub EQL execută stopurile long-urilor și umple cumpărările jucătorilor mari. Fitil sub nivel, închidere înapoi deasupra.\n- **CHoCH-ul** — impulsul care urmează rupe primul Lower High: caracterul s-a schimbat și ai confirmarea că sweep-ul a fost acumulare, nu continuare.\n- **Intrarea** — retragerea în OB-ul format la sweep (adesea suprapus cu un FVG). Stop loss sub minimul sweep-ului: dacă prețul se întoarce acolo, ideea este invalidată. Take profit la următorul bazin de lichiditate de deasupra (EQH, maximul anterior).\n\nFiecare element are un rol precis: lichiditatea explică DE CE s-a mișcat prețul, CHoCH confirmă CINE controlează acum, OB-ul îți dă UNDE intri, iar premium/discount îți spune DACĂ tranzacția merită.",
              en: "Now tie the whole module into one narrative — the classic SMC-style long model:\n\n- **The context** — price drops into the discount zone of the larger range; liquidity has built up below equal lows (EQL).\n- **The sweep** — a fast push below the EQL executes the longs' stops and fills the big players' buying. Wick below the level, close back above.\n- **The CHoCH** — the impulse that follows breaks the first Lower High: the character has changed and you have confirmation the sweep was accumulation, not continuation.\n- **The entry** — the pullback into the OB formed at the sweep (often overlapping an FVG). Stop loss below the sweep low: if price returns there, the idea is invalidated. Take profit at the next liquidity pool above (EQH, the prior high).\n\nEvery element has a precise role: liquidity explains WHY price moved, the CHoCH confirms WHO is now in control, the OB gives you WHERE to enter, and premium/discount tells you WHETHER the trade is worth it.",
            },
            diagram: "m6-full-play",
          },
          {
            heading: { ro: "Checklist-ul și onestitatea statistică", en: "The checklist and statistical honesty" },
            body: {
              ro: "Înainte de orice tranzacție SMC, verifică:\n\n- **Context HTF** — în ce direcție e structura pe D1/H4? În ce jumătate a range-ului suntem?\n- **Lichiditate** — ce s-a luat deja? Ce bazin urmează?\n- **Confirmare** — există CHoCH pe TF-ul de execuție după sweep?\n- **Zonă** — OB/FVG proaspăt, format cu displacement?\n- **Risc** — SL tehnic (sub sweep) și R:R de minimum 1:2 până la prima lichiditate?\n\nDacă 2 din 5 lipsesc, nu ai un setup — ai o poveste frumoasă. Piața nu plătește povești.\n\nȘi ultima doză de luciditate: SMC descrie corect MECANICA multor mișcări, dar nu transformă tradingul în certitudine. Vei avea sweep-uri urmate de încă un sweep, CHoCH-uri anulate, OB-uri perforate. Avantajul vine din răbdarea de a aștepta confluența completă și din execuția disciplinată a unui plan cu risc fix — nu din dreptunghiuri.",
              en: "Before any SMC trade, check:\n\n- **HTF context** — which way is structure pointing on D1/H4? Which half of the range are we in?\n- **Liquidity** — what has already been taken? Which pool is next?\n- **Confirmation** — is there a CHoCH on the execution TF after the sweep?\n- **Zone** — a fresh OB/FVG, formed with displacement?\n- **Risk** — a technical SL (below the sweep) and at least 1:2 R:R to the first liquidity?\n\nIf 2 out of 5 are missing, you don't have a setup — you have a nice story. The market doesn't pay for stories.\n\nAnd one final dose of lucidity: SMC correctly describes the MECHANICS of many moves, but it doesn't turn trading into certainty. You will see sweeps followed by another sweep, cancelled CHoCHs, punctured OBs. The edge comes from the patience to wait for full confluence and from disciplined execution of a fixed-risk plan — not from rectangles.",
            },
            tip: {
              ro: "Construiește-ți checklist-ul în TradeGx și bifează-l înainte de fiecare intrare. După 50 de tranzacții, statistica îți va arăta alb pe negru dacă setup-ul tău SMC are expectancy pozitiv — exact subiectul modulului de Sisteme & Backtesting.",
              en: "Build your checklist in TradeGx and tick it before every entry. After 50 trades, the statistics will show you in black and white whether your SMC setup has positive expectancy — exactly the subject of the Systems & Backtesting module.",
            },
            warning: {
              ro: "Ferește-te de „SMC-ul de YouTube\": exemple perfecte alese retroactiv, în care fiecare sweep inversează și fiecare OB ține. Pe graficul live, jumătate din concepte se suprapun contradictoriu. Regula ta: fără confluență completă și fără invalidare clară, nu există tranzacție.",
              en: "Beware of 'YouTube SMC': perfect examples picked in hindsight, where every sweep reverses and every OB holds. On a live chart, half the concepts overlap and contradict each other. Your rule: no full confluence and no clear invalidation, no trade.",
            },
          },
        ],
      },
    ],
  },
  diagrams: {
    "m6-bos-choch": {
      candles: [
        { o: 20, h: 28, l: 16, c: 26 },
        { o: 26, h: 36, l: 24, c: 34 },
        { o: 34, h: 45, l: 32, c: 43 },
        { o: 43, h: 45, l: 35, c: 37 },
        { o: 37, h: 39, l: 29, c: 31 },
        { o: 31, h: 43, l: 30, c: 41 },
        { o: 41, h: 53, l: 39, c: 51 },
        { o: 51, h: 60, l: 49, c: 58 },
        { o: 58, h: 66, l: 56, c: 64 },
        { o: 64, h: 66, l: 56, c: 58 },
        { o: 58, h: 60, l: 52, c: 54 },
        { o: 54, h: 62, l: 53, c: 60 },
        { o: 60, h: 62, l: 50, c: 52 },
        { o: 52, h: 54, l: 44, c: 46 },
        { o: 46, h: 48, l: 36, c: 38 },
      ],
      levels: [
        { y: 45, label: "Swing High", color: "#10b981", dashed: true },
        { y: 52, label: "Higher Low", color: "#f43f5e", dashed: true },
      ],
      arrows: [
        { x: 6, y: 57, dir: "up", color: "#10b981", label: "BOS" },
        { x: 13, y: 40, dir: "down", color: "#f43f5e", label: "CHoCH" },
      ],
      labels: [
        { x: 4, y: 24, text: "HL", color: "#818cf8" },
        { x: 8, y: 71, text: "HH", color: "#10b981" },
        { x: 11, y: 67, text: "LH", color: "#f59e0b" },
        { x: 13.6, y: 31, text: "LL", color: "#f43f5e" },
      ],
      caption: {
        ro: "BOS peste Swing High = continuare a uptrendului. Eșecul de a face un nou HH (LH) urmat de spargerea ultimului HL = CHoCH, prima dovadă a schimbării de caracter.",
        en: "BOS above the Swing High = uptrend continuation. The failure to print a new HH (LH) followed by the break of the last HL = CHoCH, the first evidence of a change of character.",
      },
    },
    "m6-liquidity-sweep": {
      candles: [
        { o: 30, h: 36, l: 26, c: 34 },
        { o: 34, h: 42, l: 32, c: 40 },
        { o: 40, h: 50, l: 38, c: 48 },
        { o: 48, h: 62, l: 46, c: 58 },
        { o: 58, h: 60, l: 50, c: 52 },
        { o: 52, h: 62, l: 51, c: 59 },
        { o: 59, h: 61, l: 52, c: 54 },
        { o: 54, h: 68, l: 49, c: 50 },
        { o: 50, h: 52, l: 42, c: 44 },
        { o: 44, h: 46, l: 34, c: 36 },
        { o: 36, h: 38, l: 26, c: 28 },
        { o: 28, h: 32, l: 20, c: 23 },
      ],
      levels: [{ y: 62, label: "EQH", color: "#f59e0b", dashed: true }],
      zones: [{ y1: 62, y2: 70, x1: 2.5, x2: 8, color: "#f59e0b", label: "Buy stops" }],
      arrows: [{ x: 7, y: 73, dir: "down", color: "#f43f5e", label: "Sweep" }],
      labels: [{ x: 10, y: 45, text: "Reversal", color: "#f43f5e" }],
      caption: {
        ro: "Maxime egale (EQH) = bazin de stopuri deasupra nivelului. Fitilul care le străpunge și închide înapoi sub nivel este sweep-ul clasic: lichiditatea e luată, apoi prețul inversează.",
        en: "Equal highs (EQH) = a pool of stops above the level. The wick that pierces them and closes back below is the classic sweep: liquidity is taken, then price reverses.",
      },
    },
    "m6-order-block": {
      candles: [
        { o: 52, h: 56, l: 46, c: 48 },
        { o: 48, h: 50, l: 40, c: 42 },
        { o: 42, h: 44, l: 34, c: 36 },
        { o: 36, h: 52, l: 35, c: 50 },
        { o: 50, h: 64, l: 48, c: 62 },
        { o: 62, h: 72, l: 60, c: 70 },
        { o: 70, h: 72, l: 62, c: 64 },
        { o: 64, h: 66, l: 54, c: 56 },
        { o: 56, h: 58, l: 46, c: 48 },
        { o: 48, h: 50, l: 40, c: 43 },
        { o: 43, h: 54, l: 39, c: 52 },
        { o: 52, h: 66, l: 50, c: 64 },
        { o: 64, h: 78, l: 62, c: 76 },
      ],
      zones: [{ y1: 34, y2: 44, x1: 1.6, x2: 12.4, color: "#10b981", label: "Bullish OB" }],
      arrows: [{ x: 9.5, y: 36, dir: "up", color: "#10b981", label: "Mitigation" }],
      labels: [{ x: 4, y: 70, text: "Displacement", color: "#10b981" }],
      caption: {
        ro: "Ultima lumânare bearish dinaintea impulsului = Order Block-ul bullish. Prețul revine în zonă (mitigation), ordinele rămase o apără, iar trendul continuă.",
        en: "The last bearish candle before the impulse = the bullish Order Block. Price returns into the zone (mitigation), the remaining orders defend it, and the trend continues.",
      },
    },
    "m6-fvg": {
      candles: [
        { o: 40, h: 44, l: 36, c: 42 },
        { o: 42, h: 46, l: 38, c: 40 },
        { o: 40, h: 45, l: 37, c: 43 },
        { o: 43, h: 48, l: 41, c: 46 },
        { o: 46, h: 66, l: 45, c: 64 },
        { o: 64, h: 72, l: 56, c: 68 },
        { o: 68, h: 74, l: 64, c: 70 },
        { o: 70, h: 72, l: 62, c: 64 },
        { o: 64, h: 66, l: 54, c: 57 },
        { o: 57, h: 64, l: 53, c: 62 },
        { o: 62, h: 72, l: 60, c: 70 },
        { o: 70, h: 80, l: 68, c: 78 },
      ],
      zones: [{ y1: 48, y2: 56, x1: 2.6, x2: 11.4, color: "#818cf8", label: "FVG" }],
      arrows: [{ x: 8, y: 50, dir: "up", color: "#10b981", label: "Fill" }],
      labels: [
        { x: 3, y: 37, text: "1", color: "#71717a" },
        { x: 4, y: 70, text: "2", color: "#71717a" },
        { x: 5, y: 76, text: "3", color: "#71717a" },
      ],
      caption: {
        ro: "FVG bullish: maximul lumânării 1 și minimul lumânării 3 nu se ating — golul dintre ele e dezechilibrul. Retragerea îl umple parțial, apoi trendul continuă.",
        en: "Bullish FVG: candle 1's high and candle 3's low never touch — the gap between them is the imbalance. The pullback partially fills it, then the trend continues.",
      },
    },
    "m6-premium-discount": {
      candles: [
        { o: 24, h: 30, l: 20, c: 28 },
        { o: 28, h: 38, l: 26, c: 36 },
        { o: 36, h: 50, l: 34, c: 48 },
        { o: 48, h: 62, l: 46, c: 60 },
        { o: 60, h: 72, l: 58, c: 70 },
        { o: 70, h: 80, l: 68, c: 78 },
        { o: 78, h: 80, l: 66, c: 68 },
        { o: 68, h: 70, l: 56, c: 58 },
        { o: 58, h: 60, l: 46, c: 48 },
        { o: 48, h: 52, l: 38, c: 42 },
        { o: 42, h: 54, l: 40, c: 52 },
        { o: 52, h: 64, l: 50, c: 62 },
      ],
      zones: [
        { y1: 50, y2: 80, color: "#f43f5e", label: "Premium" },
        { y1: 20, y2: 50, color: "#10b981", label: "Discount" },
      ],
      levels: [{ y: 50, label: "Equilibrium 50%", color: "#818cf8", dashed: true }],
      arrows: [{ x: 9, y: 34, dir: "up", color: "#10b981", label: "Buy zone" }],
      caption: {
        ro: "Dealing range-ul (swing low → swing high) împărțit la 50%: cumpărările au sens în discount, vânzările și încasarea profitului — în premium.",
        en: "The dealing range (swing low → swing high) split at 50%: buys make sense in discount, sells and profit-taking in premium.",
      },
    },
    "m6-full-play": {
      candles: [
        { o: 64, h: 68, l: 56, c: 58 },
        { o: 58, h: 60, l: 48, c: 50 },
        { o: 50, h: 54, l: 40, c: 42 },
        { o: 42, h: 46, l: 30, c: 34 },
        { o: 34, h: 44, l: 32, c: 40 },
        { o: 40, h: 42, l: 30, c: 32 },
        { o: 32, h: 36, l: 24, c: 26 },
        { o: 26, h: 42, l: 24, c: 40 },
        { o: 40, h: 52, l: 38, c: 50 },
        { o: 50, h: 52, l: 42, c: 44 },
        { o: 44, h: 46, l: 34, c: 36 },
        { o: 36, h: 50, l: 33, c: 48 },
        { o: 48, h: 60, l: 46, c: 58 },
        { o: 58, h: 70, l: 56, c: 68 },
      ],
      levels: [
        { y: 30, label: "EQL", color: "#f59e0b", dashed: true },
        { y: 44, label: "LH", color: "#818cf8", dashed: true },
      ],
      zones: [{ y1: 24, y2: 36, x1: 5.6, x2: 11.4, color: "#10b981", label: "OB" }],
      arrows: [
        { x: 6, y: 19, dir: "down", color: "#f59e0b", label: "Sweep" },
        { x: 8, y: 56, dir: "up", color: "#10b981", label: "CHoCH" },
        { x: 10, y: 30, dir: "up", color: "#10b981", label: "Entry" },
      ],
      caption: {
        ro: "Setup-ul complet: sweep sub EQL (lichiditatea e luată) → impulsul rupe LH-ul = CHoCH → retragerea în OB-ul format la sweep = intrarea, cu SL sub minimul sweep-ului.",
        en: "The complete setup: sweep below the EQL (liquidity taken) → the impulse breaks the LH = CHoCH → the pullback into the OB formed at the sweep = the entry, SL below the sweep low.",
      },
    },
  },
};
