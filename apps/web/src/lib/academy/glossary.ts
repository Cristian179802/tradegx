import type { I18nText } from "./types";

// ── Glosarul Academiei ──────────────────────────────────────────────────────
//
// De ce există: un începător se blochează la primul cuvânt pe care nu-l știe,
// și de obicei nu-l caută — închide pagina. Fiecare termen de aici poate fi
// legat din textul unei lecții cu [[slug]] și apare într-un tooltip, pe loc.
//
// Definițiile sunt scurte (1–3 propoziții), în limbaj simplu, cu o cifră sau
// un exemplu concret unde ajută. Nu sunt definiții de dicționar — sunt ce i-ai
// spune unui prieten peste umăr.
//
// `module` = modulul în care termenul e predat pe larg (link „învață mai mult”).

export interface GlossaryEntry {
  term: I18nText;
  def: I18nText;
  module?: string;
  /** sinonime / forme alternative pentru căutare */
  aliases?: string[];
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  // ── Bazele ─────────────────────────────────────────────────────────────
  long: {
    term: { ro: "Long (Buy)", en: "Long (Buy)" },
    def: {
      ro: "Poziție care câștigă când prețul CREȘTE. Cumperi acum ca să vinzi mai scump mai târziu.",
      en: "A position that profits when price RISES. You buy now to sell higher later.",
    },
    module: "bazele-tradingului",
    aliases: ["buy", "cumparare"],
  },
  short: {
    term: { ro: "Short (Sell)", en: "Short (Sell)" },
    def: {
      ro: "Poziție care câștigă când prețul SCADE. Vinzi ceva ce nu deții, ca să răscumperi mai ieftin. Pe CFD-uri și forex e la fel de simplu ca un buy.",
      en: "A position that profits when price FALLS. You sell what you don't own, to buy back cheaper. On CFDs and forex it's as simple as a buy.",
    },
    module: "bazele-tradingului",
    aliases: ["sell", "vanzare"],
  },
  ohlc: {
    term: { ro: "OHLC", en: "OHLC" },
    def: {
      ro: "Open, High, Low, Close — cele patru prețuri ale unei lumânări: unde a deschis, cât de sus și cât de jos a ajuns, unde a închis.",
      en: "Open, High, Low, Close — the four prices of a candle: where it opened, how high and how low it went, where it closed.",
    },
    module: "bazele-tradingului",
  },
  timeframe: {
    term: { ro: "Timeframe (TF)", en: "Timeframe (TF)" },
    def: {
      ro: "Cât timp acoperă o lumânare: M5 = 5 minute, H1 = o oră, D1 = o zi. Aceleași date, altă lupă.",
      en: "How much time one candle covers: M5 = 5 minutes, H1 = one hour, D1 = one day. Same data, different magnification.",
    },
    module: "bazele-tradingului",
  },
  pip: {
    term: { ro: "Pip", en: "Pip" },
    def: {
      ro: "Unitatea standard de mișcare a prețului. La EURUSD, a 4-a zecimală: de la 1.0850 la 1.0851 e 1 pip. La perechile cu JPY, a 2-a zecimală.",
      en: "The standard unit of price movement. On EURUSD, the 4th decimal: 1.0850 to 1.0851 is 1 pip. On JPY pairs, the 2nd decimal.",
    },
    module: "bazele-tradingului",
  },
  lot: {
    term: { ro: "Lot", en: "Lot" },
    def: {
      ro: "Mărimea poziției. 1 lot standard = 100.000 unități → la EURUSD, 1 pip ≈ 10 $. 0.10 lot → 1 $/pip. 0.01 lot → 0.10 $/pip.",
      en: "Position size. 1 standard lot = 100,000 units → on EURUSD, 1 pip ≈ $10. 0.10 lot → $1/pip. 0.01 lot → $0.10/pip.",
    },
    module: "bazele-tradingului",
  },
  levier: {
    term: { ro: "Levier (Leverage)", en: "Leverage" },
    def: {
      ro: "Îți lasă să controlezi o poziție mai mare decât banii din cont: la 1:100, cu 1.000 $ deschizi 100.000 $. Amplifică ȘI pierderile — riscul real îl decide lotul, nu cifra levierului.",
      en: "Lets you control a position larger than your balance: at 1:100, $1,000 opens $100,000. It amplifies losses TOO — real risk is set by lot size, not the leverage number.",
    },
    module: "bazele-tradingului",
    aliases: ["leverage"],
  },
  marja: {
    term: { ro: "Marjă (Margin)", en: "Margin" },
    def: {
      ro: "Garanția pe care brokerul o blochează din cont pentru o poziție deschisă. Dacă pierderile o consumă, brokerul închide forțat pozițiile (stop out).",
      en: "The collateral your broker locks from your balance for an open position. If losses eat it, the broker force-closes positions (stop out).",
    },
    module: "bazele-tradingului",
    aliases: ["margin"],
  },
  spread: {
    term: { ro: "Spread", en: "Spread" },
    def: {
      ro: "Diferența dintre prețul de cumpărare (Ask) și cel de vânzare (Bid). E costul plătit instant la deschidere — orice poziție pornește ușor pe minus.",
      en: "The gap between the buy price (Ask) and sell price (Bid). It's the cost paid instantly at open — every position starts slightly negative.",
    },
    module: "bazele-tradingului",
  },
  swap: {
    term: { ro: "Swap", en: "Swap" },
    def: {
      ro: "Dobânda plătită sau încasată pentru o poziție ținută peste noapte. Miercurea se percepe de regulă triplu, ca să acopere weekendul.",
      en: "Interest paid or earned for a position held overnight. Wednesday usually charges triple, to cover the weekend.",
    },
    module: "bazele-tradingului",
  },
  slippage: {
    term: { ro: "Slippage", en: "Slippage" },
    def: {
      ro: "Diferența dintre prețul cerut și cel la care s-a executat ordinul. Apare la știri și volatilitate mare, când prețul sare peste nivelul tău.",
      en: "The gap between the price you asked for and the price you got. Happens at news and high volatility, when price jumps past your level.",
    },
    module: "bazele-tradingului",
  },
  "stop-loss": {
    term: { ro: "Stop Loss (SL)", en: "Stop Loss (SL)" },
    def: {
      ro: "Ordinul care îți închide automat poziția la o pierdere predefinită. Se pune într-un loc TEHNIC — dincolo de nivelul care îți invalidează ideea — nu la o distanță aleasă emoțional.",
      en: "The order that automatically closes your position at a predefined loss. Placed at a TECHNICAL spot — beyond the level that invalidates your idea — not at an emotionally chosen distance.",
    },
    module: "bazele-tradingului",
    aliases: ["sl", "stop"],
  },
  "take-profit": {
    term: { ro: "Take Profit (TP)", en: "Take Profit (TP)" },
    def: {
      ro: "Ordinul care îți încasează automat profitul la ținta stabilită dinainte. Decis ÎNAINTE de intrare, nu în timpul mișcării.",
      en: "The order that automatically banks your profit at the target you set. Decided BEFORE entry, not during the move.",
    },
    module: "bazele-tradingului",
    aliases: ["tp"],
  },
  "limit-order": {
    term: { ro: "Ordin Limit", en: "Limit order" },
    def: {
      ro: "Ordin în așteptare la un preț MAI BUN decât cel curent: Buy Limit sub preț, Sell Limit deasupra. Ideal pentru intrări la retestul unei zone.",
      en: "A pending order at a BETTER price than current: Buy Limit below price, Sell Limit above. Ideal for zone-retest entries.",
    },
    module: "bazele-tradingului",
  },
  "stop-order": {
    term: { ro: "Ordin Stop", en: "Stop order" },
    def: {
      ro: "Ordin în așteptare la un preț MAI SLAB decât cel curent: Buy Stop deasupra, Sell Stop sub. Ideal pentru intrări pe breakout.",
      en: "A pending order at a WORSE price than current: Buy Stop above, Sell Stop below. Ideal for breakout entries.",
    },
    module: "bazele-tradingului",
  },
  sesiune: {
    term: { ro: "Sesiune de tranzacționare", en: "Trading session" },
    def: {
      ro: "Fereastra de activitate a unei regiuni: Asia, Londra, New York. Suprapunerea Londra–New York (15:00–19:00 ora României) are cel mai mare volum al zilei.",
      en: "A region's activity window: Asia, London, New York. The London–New York overlap has the highest volume of the day.",
    },
    module: "bazele-tradingului",
  },

  // ── Structură ──────────────────────────────────────────────────────────
  suport: {
    term: { ro: "Suport", en: "Support" },
    def: {
      ro: "Zonă de preț unde scăderile s-au oprit repetat — cumpărătorii au intervenit. Nu e o linie, e o ZONĂ. Odată spartă, devine adesea rezistență.",
      en: "A price zone where declines have repeatedly stopped — buyers stepped in. Not a line, a ZONE. Once broken, it often becomes resistance.",
    },
    module: "structura-pietei",
    aliases: ["support"],
  },
  rezistenta: {
    term: { ro: "Rezistență", en: "Resistance" },
    def: {
      ro: "Zonă de preț unde creșterile s-au oprit repetat — vânzătorii au intervenit. Odată spartă, devine adesea suport.",
      en: "A price zone where rallies have repeatedly stopped — sellers stepped in. Once broken, it often becomes support.",
    },
    module: "structura-pietei",
    aliases: ["resistance"],
  },
  trend: {
    term: { ro: "Trend", en: "Trend" },
    def: {
      ro: "Direcția dominantă a prețului. Uptrend = maxime tot mai sus (HH) și minime tot mai sus (HL). Downtrend = LH și LL. Restul e range.",
      en: "Price's dominant direction. Uptrend = higher highs (HH) and higher lows (HL). Downtrend = LH and LL. Everything else is a range.",
    },
    module: "structura-pietei",
  },
  hh: {
    term: { ro: "HH / HL / LH / LL", en: "HH / HL / LH / LL" },
    def: {
      ro: "Higher High, Higher Low, Lower High, Lower Low — cele patru puncte cu care descrii structura. HH + HL = uptrend. LH + LL = downtrend.",
      en: "Higher High, Higher Low, Lower High, Lower Low — the four points that describe structure. HH + HL = uptrend. LH + LL = downtrend.",
    },
    module: "structura-pietei",
    aliases: ["higher high", "lower low", "hl", "lh", "ll"],
  },
  range: {
    term: { ro: "Range", en: "Range" },
    def: {
      ro: "Piață laterală: prețul oscilează între un suport și o rezistență fără să facă structură nouă. Se tranzacționează de la margini, nu din mijloc.",
      en: "A sideways market: price oscillates between a support and a resistance without making new structure. Traded from the edges, not the middle.",
    },
    module: "structura-pietei",
    aliases: ["consolidare", "lateral"],
  },
  breakout: {
    term: { ro: "Breakout", en: "Breakout" },
    def: {
      ro: "Ieșirea prețului dintr-un range sau printr-un nivel important, de regulă cu volum. Confirmarea e ÎNCHIDEREA dincolo de nivel, nu doar fitilul.",
      en: "Price leaving a range or breaking an important level, usually on volume. Confirmation is the CLOSE beyond the level, not just the wick.",
    },
    module: "structura-pietei",
  },
  "fake-breakout": {
    term: { ro: "Fake breakout (fakeout)", en: "Fake breakout (fakeout)" },
    def: {
      ro: "Spargere care eșuează imediat: prețul iese din nivel, adună stopurile de acolo, și se întoarce. Una dintre cele mai frecvente capcane pentru începători.",
      en: "A breakout that fails immediately: price pokes through a level, collects the stops there, and reverses. One of the most common beginner traps.",
    },
    module: "structura-pietei",
    aliases: ["fakeout", "false breakout"],
  },
  trendline: {
    term: { ro: "Trendline", en: "Trendline" },
    def: {
      ro: "Linie trasă prin două sau mai multe minime (în uptrend) sau maxime (în downtrend). E un ghid vizual al ritmului, nu un nivel magic.",
      en: "A line drawn through two or more lows (in an uptrend) or highs (in a downtrend). A visual guide to the rhythm, not a magic level.",
    },
    module: "structura-pietei",
  },
  "medie-mobila": {
    term: { ro: "Medie mobilă (MA)", en: "Moving average (MA)" },
    def: {
      ro: "Media prețurilor de închidere pe ultimele N lumânări, redesenată la fiecare lumânare. SMA = simplă; EMA = dă mai multă greutate prețurilor recente, deci reacționează mai repede.",
      en: "The average close of the last N candles, redrawn every candle. SMA = simple; EMA = weights recent prices more, so it reacts faster.",
    },
    module: "structura-pietei",
    aliases: ["sma", "ema", "moving average"],
  },
  volum: {
    term: { ro: "Volum", en: "Volume" },
    def: {
      ro: "Câte unități s-au tranzacționat într-o lumânare. O mișcare pe volum mare are convingere în spate; una pe volum mic e suspectă.",
      en: "How many units traded within a candle. A move on high volume has conviction behind it; one on low volume is suspect.",
    },
    module: "structura-pietei",
    aliases: ["volume"],
  },

  // ── Lumânări ───────────────────────────────────────────────────────────
  fitil: {
    term: { ro: "Fitil (Wick)", en: "Wick (shadow)" },
    def: {
      ro: "Linia subțire de deasupra sau de sub corpul lumânării: până unde a fost împins prețul înainte să fie RESPINS. Fitil lung = respingere puternică.",
      en: "The thin line above or below the candle body: how far price was pushed before being REJECTED. Long wick = strong rejection.",
    },
    module: "candlestick-patterns",
    aliases: ["wick", "umbra"],
  },
  doji: {
    term: { ro: "Doji", en: "Doji" },
    def: {
      ro: "Lumânare cu corp aproape inexistent: a închis unde a deschis. Indecizie. Contează doar în context — la capătul unei mișcări, nu în mijlocul unui range.",
      en: "A candle with almost no body: it closed where it opened. Indecision. Only matters in context — at the end of a move, not mid-range.",
    },
    module: "candlestick-patterns",
  },
  "pin-bar": {
    term: { ro: "Pin bar / Hammer", en: "Pin bar / Hammer" },
    def: {
      ro: "Lumânare cu fitil lung într-o parte și corp mic în cealaltă: prețul a fost împins și adus înapoi cu forță. Semnal de respingere a unui nivel.",
      en: "A candle with a long wick on one side and a small body on the other: price was pushed and driven back hard. A rejection signal at a level.",
    },
    module: "candlestick-patterns",
    aliases: ["hammer", "shooting star", "pinbar"],
  },
  engulfing: {
    term: { ro: "Engulfing", en: "Engulfing" },
    def: {
      ro: "A doua lumânare „înghite” complet corpul primei, în direcția opusă. Bullish engulfing la un suport = cumpărătorii au preluat controlul brusc.",
      en: "The second candle fully 'swallows' the first candle's body, in the opposite direction. Bullish engulfing at support = buyers seized control abruptly.",
    },
    module: "candlestick-patterns",
  },
  confluenta: {
    term: { ro: "Confluență", en: "Confluence" },
    def: {
      ro: "Mai multe motive independente care indică același lucru în același loc: un pattern LA un suport, ÎN direcția trendului, CU volum. Un semnal singur e zgomot; trei împreună sunt un setup.",
      en: "Several independent reasons pointing the same way at the same spot: a pattern AT support, IN the trend's direction, WITH volume. One signal is noise; three together are a setup.",
    },
    module: "candlestick-patterns",
    aliases: ["confluence"],
  },

  // ── Chart patterns ─────────────────────────────────────────────────────
  "head-and-shoulders": {
    term: { ro: "Head & Shoulders", en: "Head & Shoulders" },
    def: {
      ro: "Formațiune de inversare: trei vârfuri, cel din mijloc mai înalt. Se confirmă la spargerea „liniei gâtului” (neckline) — până atunci e doar o poză.",
      en: "A reversal formation: three peaks, the middle one tallest. Confirmed on the neckline break — until then it's just a picture.",
    },
    module: "chart-patterns",
    aliases: ["cap si umeri", "hs"],
  },
  "double-top": {
    term: { ro: "Double Top / Bottom", en: "Double Top / Bottom" },
    def: {
      ro: "Două vârfuri (sau două minime) la aproximativ același nivel, cu o corecție între ele. Inversare confirmată la spargerea minimului (sau maximului) dintre ele.",
      en: "Two peaks (or two lows) at roughly the same level, with a pullback between. Reversal confirmed when the low (or high) between them breaks.",
    },
    module: "chart-patterns",
  },
  flag: {
    term: { ro: "Flag / Pennant", en: "Flag / Pennant" },
    def: {
      ro: "Pauză scurtă de consolidare după o mișcare impulsivă (catargul), înclinată contra mișcării. De regulă continuare — prețul „respiră” înainte să continue.",
      en: "A short consolidation pause after an impulsive move (the pole), sloping against the move. Usually continuation — price 'breathes' before continuing.",
    },
    module: "chart-patterns",
    aliases: ["steag", "pennant"],
  },
  triunghi: {
    term: { ro: "Triunghi", en: "Triangle" },
    def: {
      ro: "Range care se îngustează: maxime tot mai jos și/sau minime tot mai sus. Energia se comprimă; spargerea e adesea violentă. Direcția o dă spargerea, nu forma.",
      en: "A narrowing range: lower highs and/or higher lows. Energy compresses; the break is often violent. Direction comes from the break, not the shape.",
    },
    module: "chart-patterns",
    aliases: ["triangle", "wedge"],
  },

  // ── Indicatori ─────────────────────────────────────────────────────────
  rsi: {
    term: { ro: "RSI", en: "RSI" },
    def: {
      ro: "Relative Strength Index, 0–100: măsoară viteza mișcării. Peste 70 „supracumpărat”, sub 30 „supravândut” — dar într-un trend puternic poate sta acolo mult. Divergențele sunt semnalul lui util.",
      en: "Relative Strength Index, 0–100: measures the speed of the move. Above 70 'overbought', below 30 'oversold' — but in a strong trend it can stay there a long time. Divergences are its useful signal.",
    },
    module: "indicatori",
  },
  divergenta: {
    term: { ro: "Divergență", en: "Divergence" },
    def: {
      ro: "Prețul face un maxim nou, dar indicatorul (RSI, MACD) nu — sau invers. Mișcarea pierde forță pe sub suprafață. Avertisment, nu semnal de intrare singur.",
      en: "Price makes a new high but the indicator (RSI, MACD) doesn't — or vice versa. The move is losing force beneath the surface. A warning, not an entry signal on its own.",
    },
    module: "indicatori",
    aliases: ["divergence"],
  },
  macd: {
    term: { ro: "MACD", en: "MACD" },
    def: {
      ro: "Diferența dintre două EMA (12 și 26) plus o linie de semnal (EMA 9 a diferenței). Arată trend și momentum. Histograma = distanța dintre cele două linii.",
      en: "The difference between two EMAs (12 and 26) plus a signal line (EMA 9 of that difference). Shows trend and momentum. The histogram = the gap between the two lines.",
    },
    module: "indicatori",
  },
  bollinger: {
    term: { ro: "Bollinger Bands", en: "Bollinger Bands" },
    def: {
      ro: "O medie mobilă (20) cu două benzi la ±2 deviații standard. Benzile se strâng când piața e calmă (squeeze) și se lărgesc când explodează. Prețul la bandă nu înseamnă automat inversare.",
      en: "A moving average (20) with two bands at ±2 standard deviations. Bands tighten when the market is calm (squeeze) and widen when it explodes. Price at a band doesn't automatically mean reversal.",
    },
    module: "indicatori",
  },
  atr: {
    term: { ro: "ATR", en: "ATR" },
    def: {
      ro: "Average True Range: cât se mișcă instrumentul, în medie, per lumânare. Cea mai bună unealtă pentru a dimensiona stop loss-ul — un SL de 1.5×ATR respiră cu piața în loc să fie ales din burtă.",
      en: "Average True Range: how much the instrument moves, on average, per candle. The best tool for sizing a stop loss — a 1.5×ATR stop breathes with the market instead of being guessed.",
    },
    module: "indicatori",
  },
  fibonacci: {
    term: { ro: "Fibonacci (retracement)", en: "Fibonacci (retracement)" },
    def: {
      ro: "Niveluri procentuale ale unei mișcări (38.2%, 50%, 61.8%) unde corecțiile se opresc adesea. Funcționează în mare parte pentru că mulți se uită la ele — folosește-le ca zone de confluență, nu ca adevăr.",
      en: "Percentage levels of a move (38.2%, 50%, 61.8%) where pullbacks often stop. Works largely because so many people watch them — use them as confluence zones, not as truth.",
    },
    module: "indicatori",
    aliases: ["fib"],
  },

  // ── SMC ────────────────────────────────────────────────────────────────
  "smart-money": {
    term: { ro: "Smart money", en: "Smart money" },
    def: {
      ro: "Băncile, fondurile, market makerii — participanții cu volume atât de mari încât nu pot intra dintr-o dată. Lasă urme pe grafic. SMC = disciplina de a le citi.",
      en: "Banks, funds, market makers — participants with volumes so large they can't enter all at once. They leave footprints on the chart. SMC = the discipline of reading them.",
    },
    module: "smart-money-concepts",
    aliases: ["smc", "institutional"],
  },
  bos: {
    term: { ro: "BOS (Break of Structure)", en: "BOS (Break of Structure)" },
    def: {
      ro: "Prețul sparge ultimul maxim (în uptrend) sau minim (în downtrend) — trendul CONTINUĂ. Confirmarea structurii, nu inversarea ei.",
      en: "Price breaks the last high (in an uptrend) or low (in a downtrend) — the trend CONTINUES. Structure confirmation, not reversal.",
    },
    module: "smart-money-concepts",
    aliases: ["break of structure"],
  },
  choch: {
    term: { ro: "CHoCH (Change of Character)", en: "CHoCH (Change of Character)" },
    def: {
      ro: "Prima spargere ÎN CONTRA trendului: în uptrend, prețul sparge ultimul HL. Primul semn că cine controla piața a pierdut controlul. Nu e încă inversare — e avertismentul ei.",
      en: "The first break AGAINST the trend: in an uptrend, price breaks the last HL. The first sign that whoever controlled the market lost control. Not a reversal yet — its warning.",
    },
    module: "smart-money-concepts",
    aliases: ["change of character"],
  },
  lichiditate: {
    term: { ro: "Lichiditate", en: "Liquidity" },
    def: {
      ro: "În SMC: locurile unde stau grămezi de ordine — mai ales stop loss-urile de deasupra maximelor evidente și de sub minimele evidente. Prețul e atras acolo pentru că banii mari au nevoie de ordinele alea ca să-și umple pozițiile.",
      en: "In SMC: the places where piles of orders sit — especially stop losses above obvious highs and below obvious lows. Price is drawn there because big money needs those orders to fill its positions.",
    },
    module: "smart-money-concepts",
    aliases: ["liquidity"],
  },
  "liquidity-sweep": {
    term: { ro: "Liquidity sweep (grab)", en: "Liquidity sweep (grab)" },
    def: {
      ro: "Prețul trece scurt de un maxim/minim evident, declanșează stopurile de acolo, apoi se întoarce brusc. Ce pare un breakout e de fapt colectarea ordinelor. Fitilul lung e semnătura.",
      en: "Price briefly pushes past an obvious high/low, triggers the stops there, then snaps back. What looks like a breakout is actually order collection. The long wick is the signature.",
    },
    module: "smart-money-concepts",
    aliases: ["sweep", "stop hunt", "grab"],
  },
  "order-block": {
    term: { ro: "Order Block (OB)", en: "Order Block (OB)" },
    def: {
      ro: "Ultima lumânare contrară dinaintea unei mișcări impulsive: acolo instituțiile și-au pus ordinele. Când prețul revine în zonă, ordinele rămase neexecutate îl resping. Zonă, nu linie.",
      en: "The last opposing candle before an impulsive move: that's where institutions placed their orders. When price returns to the zone, the unfilled orders reject it. A zone, not a line.",
    },
    module: "smart-money-concepts",
    aliases: ["ob"],
  },
  fvg: {
    term: { ro: "FVG (Fair Value Gap)", en: "FVG (Fair Value Gap)" },
    def: {
      ro: "Gol între fitilul lumânării 1 și fitilul lumânării 3, lăsat de o lumânare 2 impulsivă: prețul a sărit fără să tranzacționeze acolo. Piața tinde să revină să „umple” golul.",
      en: "A gap between candle 1's wick and candle 3's wick, left by an impulsive candle 2: price jumped without trading there. Markets tend to come back to 'fill' the gap.",
    },
    module: "smart-money-concepts",
    aliases: ["imbalance", "fair value gap"],
  },
  "premium-discount": {
    term: { ro: "Premium / Discount", en: "Premium / Discount" },
    def: {
      ro: "Împarte un range în două la 50% (equilibrium). Deasupra = premium (scump — cauți vânzări). Dedesubt = discount (ieftin — cauți cumpărări). Nu cumperi scump.",
      en: "Split a range in half at 50% (equilibrium). Above = premium (expensive — look for sells). Below = discount (cheap — look for buys). You don't buy expensive.",
    },
    module: "smart-money-concepts",
    aliases: ["equilibrium"],
  },

  // ── Risc ───────────────────────────────────────────────────────────────
  "position-sizing": {
    term: { ro: "Position sizing", en: "Position sizing" },
    def: {
      ro: "Calculul lotului pornind de la cât ești dispus să pierzi: lot = (cont × risc%) ÷ (distanța SL în pips × valoarea pipului). Întâi SL-ul tehnic, ABIA APOI lotul — niciodată invers.",
      en: "Calculating lot size from how much you're willing to lose: lot = (balance × risk%) ÷ (SL distance in pips × pip value). Technical SL first, THEN the lot — never the other way round.",
    },
    module: "risk-management",
    aliases: ["sizing", "marimea pozitiei"],
  },
  "risk-reward": {
    term: { ro: "Risk:Reward (R:R)", en: "Risk:Reward (R:R)" },
    def: {
      ro: "Cât câștigi față de cât riști. R:R 1:2 = riști 1 ca să câștigi 2. Cu 1:2, ai nevoie de doar 34% win rate ca să fii pe zero; restul e profit.",
      en: "How much you gain versus how much you risk. R:R 1:2 = risk 1 to make 2. At 1:2, you need only a 34% win rate to break even; the rest is profit.",
    },
    module: "risk-management",
    aliases: ["rr", "risc recompensa"],
  },
  r: {
    term: { ro: "R (unitatea de risc)", en: "R (the risk unit)" },
    def: {
      ro: "Riscul unei tranzacții, luat ca unitate. O tranzacție de +2R a câștigat de două ori cât a riscat. Măsurând în R în loc de bani, compari tranzacții indiferent de mărimea lor.",
      en: "One trade's risk, taken as a unit. A +2R trade made twice what it risked. Measuring in R instead of money lets you compare trades regardless of size.",
    },
    module: "risk-management",
    aliases: ["r-multiple"],
  },
  expectanta: {
    term: { ro: "Expectanță", en: "Expectancy" },
    def: {
      ro: "Cât câștigi, în medie, per tranzacție, pe termen lung: (win rate × câștig mediu) − (loss rate × pierdere medie). Pozitivă = ai avantaj. Singura cifră care spune dacă un sistem merită tranzacționat.",
      en: "What you earn, on average, per trade over the long run: (win rate × avg win) − (loss rate × avg loss). Positive = you have an edge. The one number that says whether a system is worth trading.",
    },
    module: "risk-management",
    aliases: ["expectancy", "edge"],
  },
  drawdown: {
    term: { ro: "Drawdown", en: "Drawdown" },
    def: {
      ro: "Scăderea contului de la ultimul vârf. Nu e simetric: la −20% ai nevoie de +25% ca să revii; la −50% de +100%. De aceea regula nr. 1 e „nu pierde mult”, nu „câștigă mult”.",
      en: "The drop from your account's last peak. It's not symmetric: at −20% you need +25% to recover; at −50% you need +100%. That's why rule #1 is 'don't lose big', not 'win big'.",
    },
    module: "risk-management",
  },
  "risk-of-ruin": {
    term: { ro: "Risc de ruină", en: "Risk of ruin" },
    def: {
      ro: "Probabilitatea ca o serie de pierderi să-ți ducă contul sub pragul de la care nu mai poți reveni. Depinde aproape exclusiv de cât riști per tranzacție: la 1% e aproape zero; la 10% e aproape sigur.",
      en: "The probability that a losing streak takes your account below the point of no return. Depends almost entirely on risk per trade: at 1% it's near zero; at 10% it's near certain.",
    },
    module: "risk-management",
  },
  "prop-firm": {
    term: { ro: "Prop firm", en: "Prop firm" },
    def: {
      ro: "Firmă care îți dă capital de tranzacționat după ce treci un test (challenge) cu reguli stricte: pierdere zilnică maximă, drawdown maxim, țintă de profit. Tu iei o parte din profit; ei pun banii.",
      en: "A firm that gives you capital to trade after you pass a test (challenge) with strict rules: max daily loss, max drawdown, profit target. You keep a share of profits; they put up the money.",
    },
    module: "risk-management",
    aliases: ["challenge", "funded"],
  },
  corelatie: {
    term: { ro: "Corelație", en: "Correlation" },
    def: {
      ro: "Cât de mult se mișcă două instrumente împreună. EURUSD și GBPUSD sunt puternic corelate: un long pe amândouă nu sunt două tranzacții, e UNA cu risc dublu.",
      en: "How much two instruments move together. EURUSD and GBPUSD are strongly correlated: a long on both isn't two trades, it's ONE with double the risk.",
    },
    module: "risk-management",
    aliases: ["correlation"],
  },

  // ── Psihologie ─────────────────────────────────────────────────────────
  "revenge-trading": {
    term: { ro: "Revenge trading", en: "Revenge trading" },
    def: {
      ro: "Intrarea imediat după o pierdere, ca s-o „recuperezi” — de obicei cu lot mai mare și fără setup. Cea mai scumpă emoție din trading. Antidotul: o regulă scrisă de oprire după X pierderi.",
      en: "Entering right after a loss to 'win it back' — usually with a bigger lot and no setup. The most expensive emotion in trading. The antidote: a written stop rule after X losses.",
    },
    module: "psihologia-tradingului",
  },
  overtrading: {
    term: { ro: "Overtrading", en: "Overtrading" },
    def: {
      ro: "Prea multe tranzacții, de regulă din plictiseală sau din nevoia de acțiune. Fiecare intrare fără setup e o taxă plătită pieței. Un trader bun așteaptă mai mult decât tranzacționează.",
      en: "Too many trades, usually from boredom or the need for action. Every entry without a setup is a tax paid to the market. A good trader waits more than they trade.",
    },
    module: "psihologia-tradingului",
  },
  fomo: {
    term: { ro: "FOMO", en: "FOMO" },
    def: {
      ro: "Fear Of Missing Out: intri târziu într-o mișcare deja făcută, de frică să n-o ratezi. Exact când tu intri, cei care au intrat la timp încasează. Piața oferă altă ocazie mâine.",
      en: "Fear Of Missing Out: entering late into a move that already happened, afraid to miss it. Right when you enter, those who entered on time are cashing out. The market offers another chance tomorrow.",
    },
    module: "psihologia-tradingului",
  },
  jurnal: {
    term: { ro: "Jurnal de trading", en: "Trading journal" },
    def: {
      ro: "Evidența fiecărei tranzacții: setup, motiv, risc, rezultat, emoție. Singura oglindă care nu minte — fără el, greșelile se repetă la nesfârșit. Exact pentru asta există TradeGx.",
      en: "A record of every trade: setup, reason, risk, outcome, emotion. The only mirror that doesn't lie — without it, mistakes repeat forever. That's exactly what TradeGx is for.",
    },
    module: "psihologia-tradingului",
    aliases: ["journal"],
  },

  // ── Sisteme ────────────────────────────────────────────────────────────
  backtesting: {
    term: { ro: "Backtesting", en: "Backtesting" },
    def: {
      ro: "Testarea unei strategii pe date istorice, tranzacție cu tranzacție, ca să afli dacă are avantaj ÎNAINTE să riști bani. Minimum 100 de tranzacții ca cifrele să însemne ceva.",
      en: "Testing a strategy on historical data, trade by trade, to learn whether it has an edge BEFORE risking money. At least 100 trades for the numbers to mean anything.",
    },
    module: "sisteme-de-trading",
  },
  "win-rate": {
    term: { ro: "Win rate", en: "Win rate" },
    def: {
      ro: "Procentul tranzacțiilor câștigătoare. Singur nu spune nimic: 90% win rate cu R:R 1:10 pierde bani. Citește-l mereu împreună cu R:R.",
      en: "The percentage of winning trades. On its own it says nothing: a 90% win rate at 1:10 R:R loses money. Always read it together with R:R.",
    },
    module: "sisteme-de-trading",
  },
  "profit-factor": {
    term: { ro: "Profit factor", en: "Profit factor" },
    def: {
      ro: "Suma câștigurilor ÷ suma pierderilor. Sub 1 = pierzi. 1.5 = decent. Peste 2 = foarte bun (sau prea puține tranzacții ca să crezi cifra).",
      en: "Total wins ÷ total losses. Below 1 = losing. 1.5 = decent. Above 2 = very good (or too few trades to trust the number).",
    },
    module: "sisteme-de-trading",
  },
  "sample-size": {
    term: { ro: "Mărimea eșantionului", en: "Sample size" },
    def: {
      ro: "Câte tranzacții stau în spatele unei statistici. 10 tranzacții cu 80% win rate nu înseamnă nimic — e noroc. 200 de tranzacții cu 55% înseamnă ceva.",
      en: "How many trades sit behind a statistic. 10 trades at 80% win rate mean nothing — it's luck. 200 trades at 55% mean something.",
    },
    module: "sisteme-de-trading",
  },
};

export type GlossarySlug = keyof typeof GLOSSARY;

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    // \u0300-\u036f = diacriticele combinante pe care le lasa NFD in urma.
    // Scrise ca scapari, nu ca semne brute: brute sunt invizibile in editor si
    // orice conversie de codare le-ar putea rupe fara sa se vada in diff.
    .replace(/[\u0300-\u036f]/g, "");

/** Caută în termeni, sinonime și definiții. Fără diacritice, fără majuscule. */
export function searchGlossary(query: string, lang: "ro" | "en"): [string, GlossaryEntry][] {
  const q = norm(query.trim());
  const all = Object.entries(GLOSSARY);
  if (!q) return all.sort((a, b) => a[1].term[lang].localeCompare(b[1].term[lang]));
  return all
    .filter(
      ([slug, e]) =>
        norm(slug).includes(q) ||
        norm(e.term[lang]).includes(q) ||
        e.aliases?.some((a) => norm(a).includes(q)) ||
        norm(e.def[lang]).includes(q)
    )
    .sort((a, b) => a[1].term[lang].localeCompare(b[1].term[lang]));
}

/** Toate slug-urile [[...]] referite într-un text. Pentru verificări. */
export function glossaryRefs(text: string): string[] {
  return [...text.matchAll(/\[\[([a-z0-9-]+)(?:\|[^\]]+)?\]\]/g)].map((m) => m[1]!);
}
