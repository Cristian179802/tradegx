import type { ModuleBundle } from "../types";

// ── M1: Bazele Tradingului (Începător) ──────────────────────────────────────

export const M1_BUNDLE: ModuleBundle = {
  module: {
    id: "bazele-tradingului",
    level: "BEGINNER",
    icon: "book",
    title: { ro: "Bazele Tradingului", en: "Trading Basics" },
    description: {
      ro: "Piețe, grafice, lumânări, timeframe-uri, pips, lot, levier și tipuri de ordine — fundația pe care se construiește tot restul.",
      en: "Markets, charts, candlesticks, timeframes, pips, lots, leverage and order types — the foundation everything else is built on.",
    },
    lessons: [
      {
        id: "ce-este-tradingul",
        title: { ro: "Ce este tradingul și ce piețe există", en: "What trading is and which markets exist" },
        minutes: 8,
        sections: [
          {
            body: {
              ro: "Tradingul înseamnă cumpărarea și vânzarea de instrumente financiare cu scopul de a profita de pe urma variațiilor de preț. Spre deosebire de investiții (unde deții activul ani de zile), traderul caută mișcări pe termen scurt și mediu: minute, ore, zile sau săptămâni.\n\nProfitul vine din diferența dintre prețul de intrare și cel de ieșire. Poți profita atât din creșteri (poziție **long** / buy), cât și din scăderi (poziție **short** / sell) — asta e una dintre marile diferențe față de investițiile clasice.",
              en: "Trading means buying and selling financial instruments to profit from price changes. Unlike investing (where you hold an asset for years), a trader looks for short and medium-term moves: minutes, hours, days or weeks.\n\nProfit comes from the difference between your entry and exit price. You can profit both from rises (a **long** / buy position) and from falls (a **short** / sell position) — one of the big differences from classic investing.",
            },
          },
          {
            heading: { ro: "Piețele principale", en: "The main markets" },
            body: {
              ro: "- **Forex (FX)** — piața valutară, cea mai lichidă din lume (peste 7 trilioane $ tranzacționați zilnic). Tranzacționezi perechi: EURUSD, GBPUSD, USDJPY. Deschisă 24/5.\n- **Crypto** — Bitcoin, Ethereum și altcoins. Volatilitate mare, deschisă 24/7, fără pauze de weekend.\n- **Indici** — coșuri de acțiuni: S&P 500 (US500), Nasdaq (US100), DAX (GER40). Reflectă economia unei țări sau a unui sector.\n- **Acțiuni** — companii individuale: Apple, Tesla. Program limitat la orele bursei.\n- **Mărfuri** — aur (XAUUSD), argint, petrol. Aurul este preferat de mulți traderi pentru mișcările sale ample și tehnice.",
              en: "- **Forex (FX)** — the currency market, the most liquid in the world (over $7 trillion traded daily). You trade pairs: EURUSD, GBPUSD, USDJPY. Open 24/5.\n- **Crypto** — Bitcoin, Ethereum and altcoins. High volatility, open 24/7, no weekend breaks.\n- **Indices** — baskets of stocks: S&P 500 (US500), Nasdaq (US100), DAX (GER40). They reflect a country's or sector's economy.\n- **Stocks** — individual companies: Apple, Tesla. Limited to exchange hours.\n- **Commodities** — gold (XAUUSD), silver, oil. Gold is a favorite of many traders for its large, technical moves.",
            },
          },
          {
            heading: { ro: "Sesiunile de tranzacționare", en: "Trading sessions" },
            body: {
              ro: "Piața forex funcționează în 3 sesiuni majore care se suprapun parțial:\n\n- **Asia (Tokyo)** — 02:00–11:00 ora României. Volatilitate redusă, range-uri înguste.\n- **Londra** — 10:00–19:00. Cea mai lichidă sesiune; aici se formează adesea mișcarea zilei.\n- **New York** — 15:00–00:00. Suprapunerea Londra–NY (15:00–19:00) este intervalul cu cel mai mare volum.\n\nMajoritatea strategiilor intraday se concentrează pe sesiunile Londra și New York, unde lichiditatea și mișcările direcționale sunt cele mai mari.",
              en: "The forex market runs in 3 major, partially overlapping sessions:\n\n- **Asia (Tokyo)** — low volatility, narrow ranges.\n- **London** — the most liquid session; the day's main move often forms here.\n- **New York** — the London–NY overlap is the highest-volume window of the day.\n\nMost intraday strategies focus on the London and New York sessions, where liquidity and directional moves are largest.",
            },
            tip: {
              ro: "Ca începător, alege UN singur instrument (ex. EURUSD sau XAUUSD) și studiază-l câteva luni. Îi vei învăța „personalitatea”: cum reacționează la știri, cât se mișcă pe zi, la ce ore e activ.",
              en: "As a beginner, pick ONE instrument (e.g. EURUSD or XAUUSD) and study it for a few months. You'll learn its 'personality': how it reacts to news, its average daily range, its active hours.",
            },
          },
          {
            heading: { ro: "Cine participă în piață", en: "Who participates in the market" },
            body: {
              ro: "Piața nu e o luptă între tine și „grafic” — e un loc unde interacționează jucători cu putere foarte diferită:\n\n- **Băncile centrale** — mișcă piața prin dobânzi și politică monetară.\n- **Băncile comerciale și fondurile (smart money)** — volumele lor uriașe lasă urme vizibile pe grafic (le vei învăța la modulul Smart Money Concepts).\n- **Traderii retail** — noi, cu conturi mici. Nu putem mișca piața, dar putem învăța să ne aliniem cu cei care o mișcă.\n\nÎnțelegerea acestui dezechilibru e primul pas spre maturitate în trading: nu cauți să „bați” piața, cauți să te urci în direcția banilor mari.",
              en: "The market isn't a fight between you and 'the chart' — it's a place where players of very different sizes interact:\n\n- **Central banks** — move markets through interest rates and monetary policy.\n- **Commercial banks and funds (smart money)** — their huge volumes leave visible footprints on the chart (covered in the Smart Money Concepts module).\n- **Retail traders** — us, with small accounts. We can't move the market, but we can learn to align with those who do.\n\nUnderstanding this imbalance is the first step toward trading maturity: you don't try to 'beat' the market, you try to ride in the direction of big money.",
            },
            warning: {
              ro: "Tradingul NU este o schemă de îmbogățire rapidă. Statistic, majoritatea traderilor de retail pierd bani în primii ani. Diferența o fac educația, risk management-ul și disciplina — exact ce înveți în această academie.",
              en: "Trading is NOT a get-rich-quick scheme. Statistically, most retail traders lose money in their first years. Education, risk management and discipline make the difference — exactly what this academy teaches.",
            },
          },
        ],
      },
      {
        id: "graficul-si-lumanarile",
        title: { ro: "Graficul și anatomia lumânărilor", en: "The chart and candlestick anatomy" },
        minutes: 10,
        sections: [
          {
            body: {
              ro: "Graficul de preț este harta ta. Cel mai folosit tip de grafic în trading este graficul cu **lumânări japoneze** (candlestick), pentru că arată 4 informații dintr-o privire: prețul de deschidere (Open), maximul (High), minimul (Low) și prețul de închidere (Close) — pe scurt **OHLC**.\n\nFiecare lumânare acoperă un interval de timp fix (1 minut, 1 oră, 1 zi — în funcție de timeframe-ul ales).",
              en: "The price chart is your map. The most widely used chart type in trading is the **Japanese candlestick** chart, because it shows 4 pieces of information at a glance: the Open, the High, the Low and the Close — **OHLC** for short.\n\nEach candle covers a fixed time interval (1 minute, 1 hour, 1 day — depending on the timeframe you choose).",
            },
            diagram: "m1-candle-anatomy",
          },
          {
            heading: { ro: "Cum citești o lumânare", en: "How to read a candle" },
            body: {
              ro: "- **Corpul (body)** — distanța dintre Open și Close. Corp verde (bullish): prețul a închis MAI SUS decât a deschis. Corp roșu (bearish): a închis mai jos.\n- **Fitilele (wicks/umbre)** — extremele atinse în interiorul intervalului. Un fitil lung arată că prețul a fost împins într-o direcție dar RESPINS.\n- **Corp mare** = presiune puternică într-o direcție. **Corp mic + fitile lungi** = indecizie sau respingere.\n\nPsihologia e cheia: o lumânare cu fitil lung jos spune „vânzătorii au împins prețul în jos, dar cumpărătorii au preluat controlul și l-au adus înapoi sus”. Asta e informație despre FORȚA din piață, nu doar un desen.",
              en: "- **The body** — the distance between Open and Close. Green (bullish) body: price closed HIGHER than it opened. Red (bearish) body: it closed lower.\n- **The wicks (shadows)** — the extremes reached within the interval. A long wick shows price was pushed one way but REJECTED.\n- **Large body** = strong pressure in one direction. **Small body + long wicks** = indecision or rejection.\n\nPsychology is the key: a candle with a long lower wick says 'sellers pushed price down, but buyers took control and drove it back up'. That's information about FORCE in the market, not just a drawing.",
            },
          },
          {
            heading: { ro: "Trendul: primul lucru pe care îl cauți", en: "The trend: the first thing you look for" },
            body: {
              ro: "Prețul se mișcă în 3 moduri: **uptrend** (crește), **downtrend** (scade) sau **range** (lateral). Un uptrend sănătos face maxime din ce în ce mai sus (**HH — Higher High**) și minime din ce în ce mai sus (**HL — Higher Low**). Un downtrend face LH și LL.\n\nRegula de aur a începătorului: **tranzacționează în direcția trendului**. Statistic, continuarea trendului e mai probabilă decât inversarea lui — „the trend is your friend\".",
              en: "Price moves in 3 ways: **uptrend** (rising), **downtrend** (falling) or **range** (sideways). A healthy uptrend makes progressively higher highs (**HH**) and higher lows (**HL**). A downtrend makes LH and LL.\n\nThe beginner's golden rule: **trade in the direction of the trend**. Statistically, trend continuation is more likely than reversal — 'the trend is your friend'.",
            },
            diagram: "m1-trend",
            tip: {
              ro: "Deschide orice grafic și exersează: marchează HH-urile și HL-urile cu obiectele de desen. După 50 de grafice marcate, ochiul tău va vedea structura instant.",
              en: "Open any chart and practice: mark the HHs and HLs with drawing tools. After 50 marked charts, your eye will read structure instantly.",
            },
          },
        ],
      },
      {
        id: "timeframes",
        title: { ro: "Timeframe-uri și analiza top-down", en: "Timeframes and top-down analysis" },
        minutes: 7,
        sections: [
          {
            body: {
              ro: "Timeframe-ul (TF) e intervalul de timp acoperit de fiecare lumânare. Aceleași date, altă lupă:\n\n- **M1–M15** (1–15 minute) — scalping. Zgomot mare, decizii rapide.\n- **M30–H4** (30 min–4 ore) — day trading și intraday swing.\n- **D1** (zilnic) — swing trading pe zile–săptămâni.\n- **W1/MN** (săptămânal/lunar) — poziții pe termen lung și context macro.\n\nNu există timeframe „corect” — există timeframe potrivit stilului tău de viață. Dacă ai job, D1/H4 sunt mult mai realiste decât M5.",
              en: "The timeframe (TF) is the time interval each candle covers. Same data, different magnification:\n\n- **M1–M15** (1–15 minutes) — scalping. High noise, fast decisions.\n- **M30–H4** (30 min–4 hours) — day trading and intraday swing.\n- **D1** (daily) — swing trading over days–weeks.\n- **W1/MN** (weekly/monthly) — long-term positions and macro context.\n\nThere is no 'correct' timeframe — only the one that fits your lifestyle. If you have a job, D1/H4 are far more realistic than M5.",
            },
          },
          {
            heading: { ro: "Analiza top-down", en: "Top-down analysis" },
            body: {
              ro: "Profesioniștii citesc piața de sus în jos, în 3 pași:\n\n- **TF mare (D1/W1)** — stabilește DIRECȚIA: unde e trendul, unde sunt nivelurile majore?\n- **TF mediu (H4/H1)** — stabilește ZONA: unde aștept prețul ca să intru?\n- **TF mic (M15/M5)** — stabilește MOMENTUL: confirmarea și intrarea precisă.\n\nCea mai frecventă greșeală de începător: a lua decizia pe M5 fără să știi că pe D1 lupți contra unui trend puternic. TF-ul mare bate întotdeauna TF-ul mic.",
              en: "Professionals read the market top-down, in 3 steps:\n\n- **High TF (D1/W1)** — sets the DIRECTION: where is the trend, where are the major levels?\n- **Mid TF (H4/H1)** — sets the ZONE: where do I wait for price to enter?\n- **Low TF (M15/M5)** — sets the TIMING: confirmation and the precise entry.\n\nThe most common beginner mistake: deciding on M5 without knowing that on D1 you're fighting a strong trend. The higher TF always wins.",
            },
            tip: {
              ro: "Regulă practică: alege 3 timeframe-uri în raport de ~4–6x între ele (ex. D1 → H4 → M15) și folosește-le mereu în aceeași ordine.",
              en: "Practical rule: pick 3 timeframes roughly 4–6x apart (e.g. D1 → H4 → M15) and always use them in the same order.",
            },
          },
        ],
      },
      {
        id: "pip-lot-levier",
        title: { ro: "Pip, lot, levier și marjă", en: "Pip, lot, leverage and margin" },
        minutes: 9,
        sections: [
          {
            heading: { ro: "Pip și punct", en: "Pip and point" },
            body: {
              ro: "**Pip-ul** e unitatea standard de mișcare a prețului. La majoritatea perechilor forex, 1 pip = a 4-a zecimală (EURUSD de la 1.0850 la 1.0851 = 1 pip). La perechile cu JPY, 1 pip = a 2-a zecimală. La aur (XAUUSD), traderii numesc de regulă 1 pip = 0.10 $ din preț.\n\nBrokerii afișează adesea și a 5-a zecimală — acela e un **punct** (0.1 pips). Atenție să nu le confunzi când îți calculezi riscul.",
              en: "The **pip** is the standard unit of price movement. On most forex pairs, 1 pip = the 4th decimal (EURUSD from 1.0850 to 1.0851 = 1 pip). On JPY pairs, 1 pip = the 2nd decimal. On gold (XAUUSD), traders usually call 1 pip = $0.10 of price.\n\nBrokers often display a 5th decimal too — that's a **point** (0.1 pips). Don't confuse them when calculating risk.",
            },
          },
          {
            heading: { ro: "Loturi", en: "Lots" },
            body: {
              ro: "Lotul e mărimea poziției:\n\n- **1 lot standard** = 100.000 unități din moneda de bază → la EURUSD, 1 pip ≈ 10 $.\n- **0.1 lot (mini)** → 1 pip ≈ 1 $.\n- **0.01 lot (micro)** → 1 pip ≈ 0.10 $.\n\nExemplu: cumperi 0.10 loturi EURUSD și prețul urcă 50 pips → profit ≈ 50 $. Scade 30 pips → pierdere ≈ 30 $. Mărimea lotului este PRINCIPALA ta unealtă de control al riscului — o vei calcula matematic în modulul de Risk Management.",
              en: "The lot is your position size:\n\n- **1 standard lot** = 100,000 units of the base currency → on EURUSD, 1 pip ≈ $10.\n- **0.1 lot (mini)** → 1 pip ≈ $1.\n- **0.01 lot (micro)** → 1 pip ≈ $0.10.\n\nExample: you buy 0.10 lots of EURUSD and price rises 50 pips → profit ≈ $50. It drops 30 pips → loss ≈ $30. Lot size is your MAIN risk-control tool — you'll learn to calculate it mathematically in the Risk Management module.",
            },
          },
          {
            heading: { ro: "Levierul și marja", en: "Leverage and margin" },
            body: {
              ro: "**Levierul** îți permite să controlezi o poziție mai mare decât banii din cont. La levier 1:100, cu 1.000 $ poți deschide poziții de 100.000 $. **Marja** e garanția blocată de broker pentru poziția deschisă.\n\nLevierul NU îți mărește profitul „gratis” — amplifică în egală măsură și pierderile. Dacă pierderile flotante îți consumă marja, brokerul închide forțat pozițiile (**margin call / stop out**).\n\nLevierul e doar o unealtă de eficiență a capitalului. Riscul REAL îl decide mărimea lotului raportată la cont, nu cifra levierului.",
              en: "**Leverage** lets you control a position larger than your account balance. At 1:100 leverage, $1,000 can open $100,000 worth of positions. **Margin** is the collateral your broker locks for the open position.\n\nLeverage does NOT increase your profit 'for free' — it amplifies losses equally. If floating losses eat your margin, the broker force-closes your positions (**margin call / stop out**).\n\nLeverage is just a capital-efficiency tool. Your REAL risk is decided by lot size relative to your account, not by the leverage number.",
            },
            warning: {
              ro: "Levierul mare + loturi mari = cea mai rapidă metodă de a arde un cont. Nu mărimea levierului te distruge, ci lipsa calculului de poziție. Niciodată nu deschide o poziție fără să știi exact câți bani pierzi dacă ți se atinge stop loss-ul.",
              en: "High leverage + big lots = the fastest way to burn an account. It's not the leverage number that destroys you, it's the missing position calculation. Never open a trade without knowing exactly how much you lose if your stop loss is hit.",
            },
          },
        ],
      },
      {
        id: "tipuri-de-ordine",
        title: { ro: "Tipuri de ordine, spread și costuri", en: "Order types, spread and costs" },
        minutes: 9,
        sections: [
          {
            heading: { ro: "Ordinele de bază", en: "The basic orders" },
            body: {
              ro: "- **Market order** — execuție imediată la prețul curent. O folosești când confirmarea a apărut și vrei să intri ACUM.\n- **Limit order** — ordin în așteptare la un preț MAI BUN decât cel curent: Buy Limit sub preț, Sell Limit peste preț. Ideal pentru intrări la retest de zonă.\n- **Stop order** — ordin în așteptare la un preț MAI SLAB decât cel curent: Buy Stop peste preț, Sell Stop sub preț. Ideal pentru intrări pe breakout.\n\nOrdinele în așteptare (pending) au un avantaj psihologic uriaș: decizia o iei CALM, înainte, nu în panică, în timpul mișcării.",
              en: "- **Market order** — immediate execution at the current price. Use it when confirmation has appeared and you want in NOW.\n- **Limit order** — a pending order at a BETTER price than current: Buy Limit below price, Sell Limit above. Ideal for zone-retest entries.\n- **Stop order** — a pending order at a WORSE price than current: Buy Stop above price, Sell Stop below. Ideal for breakout entries.\n\nPending orders have a huge psychological advantage: you decide CALMLY, in advance — not in panic during the move.",
            },
          },
          {
            heading: { ro: "Stop Loss și Take Profit", en: "Stop Loss and Take Profit" },
            body: {
              ro: "**Stop Loss (SL)** = ordinul care îți închide automat poziția la o pierdere predefinită. **Take Profit (TP)** = ordinul care îți încasează automat profitul la ținta stabilită.\n\nSL-ul nu e opțional. E diferența dintre o pierdere mică, planificată, și o catastrofă. Se plasează într-un loc TEHNIC (dincolo de zona care îți invalidează ideea), nu la o distanță aleasă emoțional.",
              en: "**Stop Loss (SL)** = the order that automatically closes your position at a predefined loss. **Take Profit (TP)** = the order that automatically banks your profit at your target.\n\nThe SL is not optional. It's the difference between a small, planned loss and a catastrophe. Place it at a TECHNICAL spot (beyond the zone that invalidates your idea), not at an emotionally chosen distance.",
            },
            diagram: "m1-orders",
          },
          {
            heading: { ro: "Costurile reale ale tradingului", en: "The real costs of trading" },
            body: {
              ro: "- **Spread** — diferența dintre prețul de cumpărare (Ask) și cel de vânzare (Bid). E costul plătit instant la deschidere: orice poziție pornește ușor pe minus.\n- **Comision** — taxa fixă per lot, la conturile de tip ECN/Raw.\n- **Swap** — dobânda plătită/încasată pentru pozițiile ținute peste noapte. Miercurea se percepe de regulă triplu (acoperă weekendul).\n- **Slippage** — diferența dintre prețul cerut și cel executat, frecventă la știri și volatilitate mare.\n\nPe timeframe-uri mici costurile devin enorme procentual: la scalping pe M1, spread-ul poate consuma 30–50% din profitul-țintă. Încă un motiv pentru care începătorii au șanse mai bune pe timeframe-uri mari.",
              en: "- **Spread** — the difference between the buy price (Ask) and sell price (Bid). It's a cost paid instantly at open: every position starts slightly negative.\n- **Commission** — fixed fee per lot on ECN/Raw account types.\n- **Swap** — interest paid/earned for positions held overnight. Wednesday usually charges triple (covering the weekend).\n- **Slippage** — the difference between requested and executed price, common at news and high volatility.\n\nOn small timeframes costs become huge in percentage terms: scalping M1, the spread can eat 30–50% of your target profit. One more reason beginners do better on higher timeframes.",
            },
            tip: {
              ro: "Din acest moment, orice tranzacție pe care o faci — chiar și pe demo — trebuie să aibă SL și TP setate ÎNAINTE de intrare. Notează-le în jurnalul TradeGx: exact pentru asta există.",
              en: "From now on, every trade you take — even on demo — must have SL and TP set BEFORE entry. Log them in your TradeGx journal: that's exactly what it's for.",
            },
          },
        ],
      },
    ],
  },
  diagrams: {
    "m1-candle-anatomy": {
      candles: [
        { o: 38, h: 88, l: 22, c: 72 },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 50, h: 50, l: 50, c: 50, hidden: true },
        { o: 72, h: 86, l: 20, c: 36 },
      ],
      labels: [
        { x: 0, y: 95, text: "BULLISH", color: "#10b981" },
        { x: 1.4, y: 87, text: "High", color: "#71717a" },
        { x: 1.4, y: 71, text: "Close", color: "#10b981" },
        { x: 1.4, y: 37, text: "Open", color: "#71717a" },
        { x: 1.4, y: 21, text: "Low", color: "#71717a" },
        { x: 6, y: 95, text: "BEARISH", color: "#f43f5e" },
        { x: 4.6, y: 85, text: "High", color: "#71717a" },
        { x: 4.6, y: 71, text: "Open", color: "#71717a" },
        { x: 4.6, y: 35, text: "Close", color: "#f43f5e" },
        { x: 4.6, y: 19, text: "Low", color: "#71717a" },
      ],
      caption: {
        ro: "Anatomia lumânării: corpul = Open→Close, fitilele = extremele intervalului.",
        en: "Candle anatomy: the body = Open→Close, wicks = the interval's extremes.",
      },
    },
    "m1-trend": {
      candles: [
        { o: 20, h: 28, l: 16, c: 26 },
        { o: 26, h: 34, l: 24, c: 32 },
        { o: 32, h: 40, l: 30, c: 38 },
        { o: 38, h: 42, l: 32, c: 34 },
        { o: 34, h: 36, l: 28, c: 30 },
        { o: 30, h: 44, l: 29, c: 42 },
        { o: 42, h: 52, l: 40, c: 50 },
        { o: 50, h: 54, l: 44, c: 46 },
        { o: 46, h: 48, l: 40, c: 42 },
        { o: 42, h: 58, l: 41, c: 56 },
        { o: 56, h: 66, l: 54, c: 64 },
        { o: 64, h: 70, l: 60, c: 68 },
      ],
      trend: [{ x1: 0, y1: 12, x2: 11, y2: 52, color: "#818cf8" }],
      labels: [
        { x: 2, y: 46, text: "HH", color: "#10b981" },
        { x: 4, y: 22, text: "HL", color: "#818cf8" },
        { x: 6, y: 58, text: "HH", color: "#10b981" },
        { x: 8, y: 34, text: "HL", color: "#818cf8" },
        { x: 10, y: 72, text: "HH", color: "#10b981" },
      ],
      caption: {
        ro: "Uptrend sănătos: maxime tot mai sus (HH) și minime tot mai sus (HL), susținute de o trendline.",
        en: "Healthy uptrend: higher highs (HH) and higher lows (HL), supported by a trendline.",
      },
    },
    "m1-orders": {
      candles: [
        { o: 44, h: 48, l: 40, c: 46 },
        { o: 46, h: 50, l: 42, c: 44 },
        { o: 44, h: 47, l: 38, c: 45 },
        { o: 45, h: 49, l: 41, c: 43 },
        { o: 43, h: 46, l: 39, c: 45 },
        { o: 45, h: 52, l: 44, c: 50 },
        { o: 50, h: 58, l: 48, c: 56 },
        { o: 56, h: 64, l: 52, c: 62 },
        { o: 62, h: 70, l: 58, c: 68 },
        { o: 68, h: 78, l: 66, c: 74 },
      ],
      zones: [
        { y1: 45, y2: 75, color: "#10b981", label: "Profit 2R" },
        { y1: 30, y2: 45, color: "#f43f5e", label: "Risc 1R" },
      ],
      levels: [
        { y: 75, label: "Take Profit", color: "#10b981" },
        { y: 45, label: "Entry", color: "#818cf8", dashed: false },
        { y: 30, label: "Stop Loss", color: "#f43f5e" },
      ],
      caption: {
        ro: "Fiecare tranzacție are 3 prețuri decise ÎNAINTE: intrarea, stop loss-ul și take profit-ul.",
        en: "Every trade has 3 prices decided in ADVANCE: the entry, the stop loss and the take profit.",
      },
    },
  },
};
