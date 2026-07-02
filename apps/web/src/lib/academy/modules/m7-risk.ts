import type { ModuleBundle } from "../types";

// ── M7: Risk Management (Intermediar) ────────────────────────────────────────

export const M7_BUNDLE: ModuleBundle = {
  module: {
    id: "risk-management",
    level: "INTERMEDIATE",
    icon: "shield",
    title: { ro: "Risk Management", en: "Risk Management" },
    description: {
      ro: "Cel mai important modul din întreaga academie. Strategia îți dă avantajul, dar risk management-ul decide dacă supraviețuiești suficient de mult ca avantajul să conteze: mărimea poziției, R:R, drawdown, reguli de prop firm și expunere.",
      en: "The most important module in the entire academy. Strategy gives you an edge, but risk management decides whether you survive long enough for that edge to matter: position sizing, R:R, drawdown, prop-firm rules and exposure.",
    },
    lessons: [
      {
        id: "de-ce-risk-management",
        title: {
          ro: "De ce risk management-ul decide supraviețuirea",
          en: "Why risk management decides survival",
        },
        minutes: 8,
        sections: [
          {
            body: {
              ro: "Întreabă orice trader profitabil ce l-a ținut în piață și vei primi același răspuns: nu strategia, ci **controlul riscului**. Strategiile vin și pleacă, piețele se schimbă — dar un cont ars nu mai poate profita de nicio strategie.\n\nAici e paradoxul pe care începătorii îl ignoră: în trading nu pierzi pentru că ai avut dreptate prea rar, ci pentru că atunci când ai greșit, ai pierdut prea MULT. Risk management-ul nu e capitolul plictisitor de după strategie — e fundația care face orice strategie posibilă.",
              en: "Ask any profitable trader what kept them in the game and you'll hear the same answer: not the strategy, but **risk control**. Strategies come and go, markets change — but a blown account can't profit from any strategy.\n\nHere's the paradox beginners ignore: in trading you don't lose because you were right too rarely, but because when you were wrong, you lost too MUCH. Risk management isn't the boring chapter after strategy — it's the foundation that makes any strategy possible.",
            },
          },
          {
            heading: { ro: "Matematica nemiloasă a drawdown-ului", en: "The unforgiving math of drawdown" },
            body: {
              ro: "Pierderile și câștigurile NU sunt simetrice. Când pierzi un procent din cont, ai nevoie de un procent MAI MARE ca să revii la zero, pentru că recuperezi dintr-o bază mai mică:\n\n- **−10%** → ai nevoie de **+11%** ca să revii\n- **−20%** → ai nevoie de **+25%**\n- **−25%** → ai nevoie de **+33%**\n- **−50%** → ai nevoie de **+100%**\n- **−75%** → ai nevoie de **+300%**\n\nObservă cum curba explodează: o pierdere de 10% se repară ușor, dar la −50% trebuie să-ți DUBLEZI contul doar ca să fii înapoi la start. De aceea prima regulă a tradingului nu e „câștigă mult”, ci **„nu pierde mult”**.",
              en: "Losses and gains are NOT symmetrical. When you lose a percentage of your account, you need a LARGER percentage to get back to breakeven, because you're recovering from a smaller base:\n\n- **−10%** → you need **+11%** to recover\n- **−20%** → you need **+25%**\n- **−25%** → you need **+33%**\n- **−50%** → you need **+100%**\n- **−75%** → you need **+300%**\n\nNotice how the curve explodes: a 10% loss is easy to repair, but at −50% you must DOUBLE your account just to get back to the start. That's why the first rule of trading isn't 'win big' — it's **'don't lose big'**.",
            },
            diagram: "m7-drawdown-recovery",
          },
          {
            heading: { ro: "Risk of ruin: punctul fără întoarcere", en: "Risk of ruin: the point of no return" },
            body: {
              ro: "**Risk of ruin** este probabilitatea ca, printr-o serie de pierderi, contul tău să scadă atât de mult încât recuperarea devine practic imposibilă — matematic sau psihologic.\n\nSeriile de pierderi nu sunt accidente: sunt o certitudine statistică. Chiar și un sistem bun, cu 60% win rate, trece în mod normal prin serii de 4–6 pierderi consecutive. Diferența o face cât riști pe fiecare tranzacție:\n\n- risc **1%** per tranzacție → 10 pierderi consecutive = contul scade cu ≈ **9.6%**. Neplăcut, dar complet recuperabil.\n- risc **10%** per tranzacție → aceleași 10 pierderi = contul scade cu ≈ **65%**. Ai nevoie de aproape +200% doar ca să revii.\n\nAceeași strategie, același ghinion — dar un trader mai are cont, iar celălalt nu. Sizing-ul este singura variabilă care a diferit.",
              en: "**Risk of ruin** is the probability that a losing streak shrinks your account so much that recovery becomes practically impossible — mathematically or psychologically.\n\nLosing streaks aren't accidents: they're a statistical certainty. Even a good system with a 60% win rate routinely goes through streaks of 4–6 consecutive losses. What you risk per trade makes all the difference:\n\n- risk **1%** per trade → 10 consecutive losses = the account drops ≈ **9.6%**. Unpleasant, but fully recoverable.\n- risk **10%** per trade → the same 10 losses = the account drops ≈ **65%**. You'd need nearly +200% just to get back.\n\nSame strategy, same bad luck — but one trader still has an account and the other doesn't. Position size was the only variable that differed.",
            },
          },
          {
            heading: {
              ro: "Strategie excelentă + sizing prost = cont ars",
              en: "Great strategy + bad sizing = blown account",
            },
            body: {
              ro: "Imaginează-ți doi traderi cu EXACT aceeași strategie profitabilă. Primul riscă 1% pe tranzacție; al doilea riscă 15% pentru că „vrea să crească repede”. Vine inevitabila serie de 5 pierderi: primul e la −4.9% și își continuă planul netulburat. Al doilea e la −56%, intră în panică, dublează lotul ca să recupereze, și în două săptămâni contul e mort.\n\nStrategia nu l-a omorât. **Sizing-ul l-a omorât.** O strategie profitabilă pe hârtie devine ruinătoare în practică dacă mărimea pozițiilor nu-i permite să supraviețuiască propriilor serii de pierderi.\n\nRestul acestui modul îți dă uneltele exacte: formula de sizing, raportul risc:recompensă, limitele de drawdown și controlul expunerii.",
              en: "Picture two traders with EXACTLY the same profitable strategy. The first risks 1% per trade; the second risks 15% because he 'wants to grow fast'. The inevitable 5-loss streak arrives: the first is at −4.9% and calmly continues his plan. The second is at −56%, panics, doubles his lot size to recover, and within two weeks the account is dead.\n\nThe strategy didn't kill him. **The sizing killed him.** A strategy that's profitable on paper becomes ruinous in practice if position sizes don't let it survive its own losing streaks.\n\nThe rest of this module gives you the exact tools: the sizing formula, risk:reward, drawdown limits and exposure control.",
            },
            warning: {
              ro: "Nicio strategie — oricât de bună — nu poate compensa un risc per tranzacție prea mare. Matematica drawdown-ului nu iartă pe nimeni: la −50% ai nevoie de +100%, indiferent cât de talentat ești.",
              en: "No strategy — however good — can compensate for excessive risk per trade. Drawdown math forgives no one: at −50% you need +100%, no matter how talented you are.",
            },
            tip: {
              ro: "Notează-ți în jurnalul TradeGx riscul în bani și în procente pentru FIECARE tranzacție. Dacă nu poți spune instant cât pierzi la atingerea SL-ului, poziția e prea puțin planificată ca să fie deschisă.",
              en: "Log the risk in money and percentage for EVERY trade in your TradeGx journal. If you can't instantly say how much you lose when your SL is hit, the position isn't planned enough to be opened.",
            },
          },
        ],
      },
      {
        id: "position-sizing",
        title: { ro: "Position sizing: formula care îți salvează contul", en: "Position sizing: the formula that saves your account" },
        minutes: 10,
        sections: [
          {
            heading: { ro: "Regula 1–2%", en: "The 1–2% rule" },
            body: {
              ro: "Regula de aur a profesioniștilor: riscă **1–2% din cont** pe o singură tranzacție. Nu 5%, nu 10% — 1–2%.\n\nDe ce funcționează: la 1% risc, o serie de 10 pierderi consecutive te lasă cu peste 90% din cont — ești în joc, calm, iar strategia ta are timp să-și arate avantajul. La riscuri mari, aceeași serie te scoate din piață sau, mai rău, te împinge în decizii disperate.\n\n- **1%** — standardul recomandat, obligatoriu la conturi de prop firm.\n- **2%** — acceptabil pentru traderi cu experiență și istoric dovedit.\n- **0.5%** — înțelept când testezi o strategie nouă sau treci printr-un drawdown.",
              en: "The professionals' golden rule: risk **1–2% of your account** on any single trade. Not 5%, not 10% — 1–2%.\n\nWhy it works: at 1% risk, a streak of 10 consecutive losses leaves you with over 90% of your account — you're still in the game, calm, and your strategy has time to show its edge. At high risk, the same streak knocks you out of the market or, worse, pushes you into desperate decisions.\n\n- **1%** — the recommended standard, mandatory on prop-firm accounts.\n- **2%** — acceptable for experienced traders with a proven track record.\n- **0.5%** — wise when testing a new strategy or trading through a drawdown.",
            },
          },
          {
            heading: { ro: "Formula de sizing", en: "The sizing formula" },
            body: {
              ro: "Mărimea lotului NU se alege din instinct. Se calculează, în această ordine: întâi decizi unde e stop loss-ul (loc TEHNIC), abia apoi afli lotul:\n\n**lot = (cont × risc%) / (SL în pips × valoarea pipului per lot)**\n\nCei trei pași, de fiecare dată:\n\n- **Pasul 1** — calculează riscul în bani: cont × risc% (ex. 10.000 $ × 1% = 100 $).\n- **Pasul 2** — măsoară distanța până la SL, în pips, dictată de grafic.\n- **Pasul 3** — împarte riscul în bani la (SL × valoarea pipului per 1 lot).\n\nReține valorile standard: la EURUSD, 1 pip pentru 1 lot standard ≈ **10 $**. La XAUUSD (contract de 100 uncii), 1 pip = 0.10 $ pe preț, adică tot ≈ **10 $** per lot.",
              en: "Lot size is NOT chosen by instinct. It's calculated, in this order: first you decide where the stop loss goes (a TECHNICAL spot), and only then do you derive the lot:\n\n**lot = (account × risk%) / (SL in pips × pip value per lot)**\n\nThe three steps, every single time:\n\n- **Step 1** — compute your risk in money: account × risk% (e.g. $10,000 × 1% = $100).\n- **Step 2** — measure the distance to your SL, in pips, dictated by the chart.\n- **Step 3** — divide the money risk by (SL × pip value per 1 lot).\n\nRemember the standard values: on EURUSD, 1 pip for 1 standard lot ≈ **$10**. On XAUUSD (100 oz contract), 1 pip = $0.10 of price, which is also ≈ **$10** per lot.",
            },
          },
          {
            heading: { ro: "Exemple complet calculate", en: "Fully worked examples" },
            body: {
              ro: "**Exemplul 1 — EURUSD, cont 10.000 $, risc 1%:**\n\n- Risc în bani: 10.000 × 1% = **100 $**\n- SL tehnic: 25 pips; valoarea pipului: 10 $ per lot\n- lot = 100 / (25 × 10) = **0.40 loturi**\n- Verificare: 0.40 lot → 4 $/pip; 25 pips × 4 $ = 100 $ ✓\n\n**Exemplul 2 — EURUSD, cont 2.000 $, risc 2%:**\n\n- Risc în bani: 2.000 × 2% = **40 $**\n- SL: 40 pips → lot = 40 / (40 × 10) = **0.10 loturi**\n- Verificare: 0.10 lot → 1 $/pip; 40 pips × 1 $ = 40 $ ✓\n\n**Exemplul 3 — XAUUSD (aur), cont 5.000 $, risc 1%:**\n\n- Risc în bani: 5.000 × 1% = **50 $**\n- SL de 5.00 $ pe preț = 50 pips (1 pip = 0.10 $)\n- lot = 50 / (50 × 10) = **0.10 loturi** (adică 10 uncii)\n- Verificare: mișcare de 5 $ × 10 uncii = 50 $ ✓\n\nObservă efectul: SL mai larg → lot mai mic, SL mai strâns → lot mai mare, dar riscul în bani rămâne IDENTIC. Asta înseamnă control.",
              en: "**Example 1 — EURUSD, $10,000 account, 1% risk:**\n\n- Money risk: 10,000 × 1% = **$100**\n- Technical SL: 25 pips; pip value: $10 per lot\n- lot = 100 / (25 × 10) = **0.40 lots**\n- Check: 0.40 lots → $4/pip; 25 pips × $4 = $100 ✓\n\n**Example 2 — EURUSD, $2,000 account, 2% risk:**\n\n- Money risk: 2,000 × 2% = **$40**\n- SL: 40 pips → lot = 40 / (40 × 10) = **0.10 lots**\n- Check: 0.10 lots → $1/pip; 40 pips × $1 = $40 ✓\n\n**Example 3 — XAUUSD (gold), $5,000 account, 1% risk:**\n\n- Money risk: 5,000 × 1% = **$50**\n- SL of $5.00 in price = 50 pips (1 pip = $0.10)\n- lot = 50 / (50 × 10) = **0.10 lots** (i.e. 10 oz)\n- Check: a $5 move × 10 oz = $50 ✓\n\nNotice the effect: wider SL → smaller lot, tighter SL → bigger lot, but the money risk stays IDENTICAL. That is control.",
            },
            tip: {
              ro: "Fă calculul ÎNAINTE de fiecare intrare, nu după. Două minute de aritmetică îți garantează că nicio tranzacție nu poate face mai mult rău decât ai decis tu, cu capul limpede.",
              en: "Do the math BEFORE every entry, not after. Two minutes of arithmetic guarantee that no single trade can do more damage than you decided, with a clear head.",
            },
          },
          {
            heading: { ro: "Fixed fractional vs lot fix", en: "Fixed fractional vs fixed lot" },
            body: {
              ro: "Există două filozofii de sizing:\n\n- **Lot fix** — tranzacționezi mereu același lot (ex. 0.10), indiferent de cont. Simplu, dar periculos: în drawdown, aceeași pierdere în bani devine un procent tot mai mare dintr-un cont tot mai mic.\n- **Fixed fractional (risc procentual fix)** — recalculezi lotul la fiecare tranzacție, din soldul CURENT. Contul de 10.000 $ scade la 8.000 $? Riscul de 1% devine 80 $, iar lotul scade automat. Contul crește la 12.000 $? Riscul devine 120 $, iar lotul crește.\n\nFixed fractional are o proprietate superbă: **frânează în drawdown și accelerează în creștere**. Pierderile consecutive devin din ce în ce mai mici în bani, iar câștigurile se compun natural. Este metoda recomandată pentru aproape orice trader.",
              en: "There are two sizing philosophies:\n\n- **Fixed lot** — you always trade the same lot (e.g. 0.10) regardless of your account. Simple, but dangerous: in a drawdown, the same money loss becomes an ever larger percentage of an ever smaller account.\n- **Fixed fractional (fixed percentage risk)** — you recalculate the lot on every trade, from your CURRENT balance. The $10,000 account drops to $8,000? Your 1% risk becomes $80 and the lot shrinks automatically. The account grows to $12,000? Risk becomes $120 and the lot grows.\n\nFixed fractional has a beautiful property: **it brakes in drawdowns and accelerates in growth**. Consecutive losses get smaller and smaller in money terms, while gains compound naturally. It's the recommended method for almost every trader.",
            },
            warning: {
              ro: "Cea mai frecventă abatere: „doar de data asta risc 5%, sunt SIGUR pe setup”. Nu există setup sigur — există doar probabilități. În ziua în care faci o excepție de la sizing, regula ta a murit deja.",
              en: "The most common violation: 'just this once I'll risk 5%, I'm SURE about this setup'. There is no sure setup — only probabilities. The day you make one sizing exception, your rule is already dead.",
            },
          },
        ],
      },
      {
        id: "risk-reward-expectancy",
        title: { ro: "Risk:Reward și expectancy: matematica avantajului", en: "Risk:Reward and expectancy: the math of your edge" },
        minutes: 10,
        sections: [
          {
            heading: { ro: "Gândește în R, nu în bani", en: "Think in R, not in money" },
            body: {
              ro: "**R** este riscul tău pe o tranzacție — distanța de la intrare la stop loss, exprimată ca unitate. Dacă riști 100 $, atunci 1R = 100 $. Un profit de 300 $ = **+3R**; o pierdere la SL = **−1R**.\n\nDe ce contează: R-ul face tranzacțiile comparabile între ele, indiferent de instrument, lot sau mărimea contului. „Am făcut +2.5R săptămâna asta” e o afirmație profesionistă; „am făcut 400 $” nu spune nimic fără context.\n\n**Raportul risc:recompensă (R:R)** compară ce riști cu ce urmărești: intri cu SL la 10 pips și TP la 30 pips → R:R = 1:3. Din acest moment, gândește orice setup în acești termeni.",
              en: "**R** is your risk on one trade — the distance from entry to stop loss, expressed as a unit. If you risk $100, then 1R = $100. A $300 profit = **+3R**; a loss at SL = **−1R**.\n\nWhy it matters: R makes trades comparable to each other, regardless of instrument, lot or account size. 'I made +2.5R this week' is a professional statement; 'I made $400' says nothing without context.\n\nThe **risk:reward ratio (R:R)** compares what you risk against what you aim for: entry with a 10-pip SL and a 30-pip TP → R:R = 1:3. From now on, think about every setup in these terms.",
            },
            diagram: "m7-rr-3r",
          },
          {
            heading: { ro: "Win rate-ul de breakeven", en: "The breakeven win rate" },
            body: {
              ro: "Pentru fiecare R:R există un win rate minim la care ieși pe zero. Formula: **win rate breakeven = 1 / (1 + R:R)**.\n\n- R:R **1:1** → ai nevoie de peste **50%** tranzacții câștigătoare\n- R:R **1:1.5** → peste **40%**\n- R:R **1:2** → peste **33%**\n- R:R **1:3** → peste **25%**\n\nCitește tabelul invers și înțelegi puterea lui: la 1:3 poți GREȘI în trei tranzacții din patru și tot nu pierzi bani. R:R-ul bun îți cumpără dreptul de a greși des — un lux psihologic enorm.",
              en: "For every R:R there's a minimum win rate at which you break even. The formula: **breakeven win rate = 1 / (1 + R:R)**.\n\n- R:R **1:1** → you need over **50%** winning trades\n- R:R **1:1.5** → over **40%**\n- R:R **1:2** → over **33%**\n- R:R **1:3** → over **25%**\n\nRead the table backwards and you'll see its power: at 1:3 you can be WRONG on three trades out of four and still not lose money. A good R:R buys you the right to be wrong often — an enormous psychological luxury.",
            },
          },
          {
            heading: { ro: "Expectancy: cât valorează o tranzacție medie", en: "Expectancy: what your average trade is worth" },
            body: {
              ro: "**Expectancy** = câți R câștigi, în medie, per tranzacție, pe termen lung:\n\n**E = (win rate × câștig mediu în R) − (loss rate × pierdere medie în R)**\n\nExemplu concret — win rate 40%, R:R 1:2.5:\n\n- E = (0.40 × 2.5R) − (0.60 × 1R) = 1.0R − 0.6R = **+0.4R per tranzacție**\n- La risc de 1% per tranzacție, 100 de tranzacții ≈ **+40R**, adică aproximativ +40% pe cont.\n\nDa, ai citit bine: pierzi 60% din tranzacții și totuși contul crește constant. Acum inversul — win rate 55%, dar R:R 1:0.5 (riști 100 $ ca să câștigi 50 $):\n\n- E = (0.55 × 0.5R) − (0.45 × 1R) = 0.275R − 0.45R = **−0.175R per tranzacție**\n\nCâștigi mai mult de jumătate din tranzacții și totuși PIERZI bani, sistematic. Win rate-ul singur nu spune nimic — doar perechea win rate + R:R decide dacă ai un avantaj real.",
              en: "**Expectancy** = how many R you make, on average, per trade, over the long run:\n\n**E = (win rate × average win in R) − (loss rate × average loss in R)**\n\nA concrete example — 40% win rate, 1:2.5 R:R:\n\n- E = (0.40 × 2.5R) − (0.60 × 1R) = 1.0R − 0.6R = **+0.4R per trade**\n- At 1% risk per trade, 100 trades ≈ **+40R**, roughly +40% on the account.\n\nYes, you read that right: you lose 60% of your trades and the account still grows steadily. Now the reverse — 55% win rate but 1:0.5 R:R (risking $100 to make $50):\n\n- E = (0.55 × 0.5R) − (0.45 × 1R) = 0.275R − 0.45R = **−0.175R per trade**\n\nYou win more than half your trades and still LOSE money, systematically. Win rate alone tells you nothing — only the win rate + R:R pair decides whether you have a real edge.",
            },
            tip: {
              ro: "Filtru simplu și puternic: nu lua tranzacții sub R:R 1:2. Un singur criteriu, respectat mecanic, elimină majoritatea setup-urilor mediocre. Statistica de R:R și expectancy o găsești calculată automat în Analytics-ul TradeGx.",
              en: "A simple, powerful filter: skip trades below 1:2 R:R. One criterion, applied mechanically, eliminates most mediocre setups. Your R:R and expectancy stats are calculated automatically in TradeGx Analytics.",
            },
            warning: {
              ro: "Nu „repara” R:R-ul mutând take profit-ul mai departe pe un setup slab și nici lărgind stop loss-ul după intrare. R:R-ul se construiește din structura pieței, nu din dorința ta. Un TP nerealist e doar o pierdere cu întârziere.",
              en: "Don't 'fix' the R:R by pushing the take profit further on a weak setup, or by widening the stop loss after entry. R:R is built from market structure, not from your wishes. An unrealistic TP is just a delayed loss.",
            },
          },
        ],
      },
      {
        id: "drawdown-si-reguli-prop",
        title: { ro: "Drawdown, limite zilnice și regulile prop firm", en: "Drawdown, daily limits and prop-firm rules" },
        minutes: 9,
        sections: [
          {
            heading: { ro: "Cele două fețe ale drawdown-ului", en: "The two faces of drawdown" },
            body: {
              ro: "**Drawdown** = distanța dintre vârful contului tău și punctul curent, exprimată procentual. Două forme contează:\n\n- **Daily loss (pierderea zilnică)** — cât ai voie să pierzi într-o SINGURĂ zi. Este cea mai importantă limită, pentru că zilele-dezastru (nu tranzacțiile individuale) sunt cele care distrug conturi.\n- **Max drawdown** — pierderea maximă totală față de vârf, pragul dincolo de care contul e compromis.\n\nDe ce e critică limita zilnică: o pierdere mare într-o singură zi aproape niciodată nu vine din piață — vine din TINE. Primele 1–2 pierderi sunt normale; următoarele 5 sunt revenge trading. Limita zilnică e o barieră între traderul disciplinat de dimineață și cel frustrat de după-amiază.",
              en: "**Drawdown** = the distance between your account's peak and its current value, in percent. Two forms matter:\n\n- **Daily loss** — how much you're allowed to lose in a SINGLE day. It's the most important limit, because disaster days (not individual trades) are what destroy accounts.\n- **Max drawdown** — the maximum total loss from the peak, the threshold beyond which the account is compromised.\n\nWhy the daily limit is critical: a big single-day loss almost never comes from the market — it comes from YOU. The first 1–2 losses are normal; the next 5 are revenge trading. The daily limit is a barrier between the disciplined morning trader and the frustrated afternoon one.",
            },
          },
          {
            heading: { ro: "Regulile prop firm (stil FTMO)", en: "Prop-firm rules (FTMO style)" },
            body: {
              ro: "Firmele de finanțare (FTMO, FundedNext, The5ers etc.) îți dau capital în schimbul respectării unor limite stricte. Modelul clasic:\n\n- **Max daily loss: 5%** — pe un cont de 100.000 $, dacă pierzi 5.000 $ într-o zi (incluzând pozițiile deschise!), contul e pierdut definitiv.\n- **Max drawdown total: 10%** — echity-ul nu are voie să scadă sub 90.000 $, niciodată.\n- **Profit target: ~10%** în faza 1, **~5%** în faza 2 — observă asimetria: ținta de profit e comparabilă cu drawdown-ul permis, deci nu ai voie să „forțezi”.\n\nLecția e valabilă chiar dacă nu vrei cont finanțat: aceste limite există pentru că firmele au datele a sute de mii de traderi și ȘTIU statistic ce omoară conturile. Copiază-le pe contul tău personal: limită zilnică 3–5%, drawdown maxim 10%.",
              en: "Funding firms (FTMO, FundedNext, The5ers etc.) give you capital in exchange for strict limits. The classic model:\n\n- **Max daily loss: 5%** — on a $100,000 account, losing $5,000 in one day (open positions included!) means the account is permanently failed.\n- **Max total drawdown: 10%** — equity may never drop below $90,000.\n- **Profit target: ~10%** in phase 1, **~5%** in phase 2 — notice the asymmetry: the profit target is comparable to the allowed drawdown, so you can't 'force it'.\n\nThe lesson applies even if you never want a funded account: these limits exist because firms have data from hundreds of thousands of traders and KNOW statistically what kills accounts. Copy them on your personal account: 3–5% daily limit, 10% max drawdown.",
            },
          },
          {
            heading: { ro: "Ziua în care trebuie să te oprești", en: "The day you must stop" },
            body: {
              ro: "Așa arată o zi care ucide conturi: începe normal, vine o pierdere, apoi încă una, iar de acolo fiecare tranzacție nouă e mai grăbită și mai mare decât precedenta. Curba de equity nu coboară în linie dreaptă din cauza pieței — accelerează din cauza deciziilor tale.\n\nCând linia atinge limita zilnică, răspunsul corect nu e „încă o tranzacție ca să recuperez”. Este: platforma se închide, iar analiza se mută în jurnal. Mâine e o zi nouă, cu mintea limpede și cu 95% din cont intact.",
              en: "This is what an account-killing day looks like: it starts normally, a loss arrives, then another, and from there every new trade is more rushed and bigger than the last. The equity curve doesn't fall in a straight line because of the market — it accelerates because of your decisions.\n\nWhen the line touches the daily limit, the correct response is not 'one more trade to recover'. It is: the platform closes, and the analysis moves to your journal. Tomorrow is a new day, with a clear mind and 95% of your account intact.",
            },
            diagram: "m7-daily-limit",
            warning: {
              ro: "Limita zilnică funcționează DOAR dacă e decisă înainte și respectată mecanic. O limită „negociabilă” în timpul zilei nu e o limită — e o sugestie pe care creierul tău frustrat o va ignora exact atunci când contează.",
              en: "The daily limit works ONLY if it's decided in advance and enforced mechanically. A limit that's 'negotiable' during the day isn't a limit — it's a suggestion your frustrated brain will ignore exactly when it matters.",
            },
          },
          {
            heading: { ro: "TradeGx te păzește automat", en: "TradeGx watches these for you" },
            body: {
              ro: "Aici teoria se întâlnește cu aplicația: TradeGx monitorizează automat toate aceste limite pentru tine.\n\n- **Configurează-ți limitele pe cont** (pierdere zilnică maximă, drawdown maxim) în setările contului de trading.\n- Aplicația urmărește tranzacțiile din jurnal și declanșează **alerte de daily-loss și drawdown** când te apropii de prag — în aplicație și pe **Telegram**.\n- Primești alerte și pentru **overtrading** (prea multe tranzacții într-o zi) și **revenge trading** (tranzacții impulsive imediat după pierderi) — tiparele exact descrise mai sus.\n- În pagina **Obiective** ai un monitor dedicat de **prop firm**: îți urmărește progresul față de profit target, daily loss și max drawdown, ca și cum ai fi deja în challenge.\n\nDiferența dintre a ști regulile și a le respecta e un sistem care te atenționează la timp. Folosește-l.",
              en: "Here theory meets the app: TradeGx automatically monitors all these limits for you.\n\n- **Configure your limits per account** (max daily loss, max drawdown) in your trading account settings.\n- The app tracks your journaled trades and fires **daily-loss and drawdown alerts** as you approach the threshold — in-app and on **Telegram**.\n- You also get alerts for **overtrading** (too many trades in a day) and **revenge trading** (impulsive trades right after losses) — exactly the patterns described above.\n- On the **Goals (Obiective)** page there's a dedicated **prop-firm monitor**: it tracks your progress against profit target, daily loss and max drawdown, as if you were already in a challenge.\n\nThe difference between knowing the rules and following them is a system that warns you in time. Use it.",
            },
            tip: {
              ro: "Setează-ți limitele în TradeGx AZI, cât ești calm și rațional. Alertele te vor prinde exact în momentele în care nu mai ești — și acelea sunt momentele care decid cariera ta.",
              en: "Set your limits in TradeGx TODAY, while you're calm and rational. The alerts will catch you exactly in the moments when you're not — and those are the moments that decide your career.",
            },
          },
        ],
      },
      {
        id: "corelatii-si-expunere",
        title: { ro: "Corelații și expunere: riscul ascuns", en: "Correlation and exposure: the hidden risk" },
        minutes: 8,
        sections: [
          {
            heading: { ro: "Două tranzacții care sunt, de fapt, una", en: "Two trades that are actually one" },
            body: {
              ro: "**Corelația** măsoară cât de sincron se mișcă două instrumente. EURUSD și GBPUSD sunt puternic corelate pozitiv: ambele au dolarul pe partea a doua, deci în majoritatea zilelor urcă și coboară împreună.\n\nConsecința practică: dacă riști 1% pe un buy EURUSD și încă 1% pe un buy GBPUSD, NU ai două tranzacții a câte 1% — ai, în esență, **o singură idee (dolar slab) cu risc ~2%**. Dacă dolarul se întărește, ambele stopuri se ating împreună.\n\nAlte corelații de care să ții cont: XAUUSD tinde să se miște invers față de dolar; indicii americani (US500, US100) sunt puternic corelați între ei; perechile crypto majore cad de regulă împreună cu BTC.",
              en: "**Correlation** measures how synchronously two instruments move. EURUSD and GBPUSD are strongly positively correlated: both have the dollar on the second side, so on most days they rise and fall together.\n\nThe practical consequence: if you risk 1% on a EURUSD buy and another 1% on a GBPUSD buy, you do NOT have two 1% trades — you essentially have **one idea (weak dollar) with ~2% risk**. If the dollar strengthens, both stops get hit together.\n\nOther correlations to keep in mind: XAUUSD tends to move inversely to the dollar; US indices (US500, US100) are strongly correlated with each other; major crypto pairs usually fall together with BTC.",
            },
          },
          {
            heading: { ro: "DXY: busola dolarului", en: "DXY: the dollar's compass" },
            body: {
              ro: "**DXY (Dollar Index)** măsoară puterea dolarului față de un coș de valute majore, în care euro are ponderea dominantă. De aceea relația DXY–EURUSD este aproape perfect **inversă**: când DXY urcă, EURUSD coboară, și invers.\n\nCum îl folosești practic:\n\n- Vrei buy pe EURUSD? Verifică DXY: dacă indexul e într-un uptrend clar, tranzacția ta luptă contra dolarului — avantajul scade.\n- DXY respinge de la o rezistență majoră? Semnalele de cumpărare pe EURUSD, GBPUSD sau XAUUSD capătă context suplimentar.\n\nDXY nu e un semnal de intrare — e un filtru de context care îți spune dacă vântul bate din față sau din spate.",
              en: "The **DXY (Dollar Index)** measures the dollar's strength against a basket of major currencies, in which the euro carries the dominant weight. That's why the DXY–EURUSD relationship is almost perfectly **inverse**: when DXY rises, EURUSD falls, and vice versa.\n\nHow to use it practically:\n\n- Want to buy EURUSD? Check DXY: if the index is in a clear uptrend, your trade is fighting the dollar — your edge shrinks.\n- DXY rejecting a major resistance? Buy signals on EURUSD, GBPUSD or XAUUSD gain extra context.\n\nDXY is not an entry signal — it's a context filter that tells you whether the wind blows in your face or at your back.",
            },
            diagram: "m7-correlation",
          },
          {
            heading: { ro: "Expunerea agregată", en: "Aggregate exposure" },
            body: {
              ro: "Întrebarea corectă nu e „cât risc pe această tranzacție?”, ci „cât risc pe TOATE pozițiile deschise, dacă piața se întoarce împotriva mea simultan?”. Aceasta e **expunerea agregată**.\n\nReguli practice de expunere:\n\n- Maximum **2–3 poziții corelate** în aceeași direcție — și tratează-le ca pe O singură tranzacție la sizing.\n- Expunere totală simultană: maximum **3–4%** din cont, indiferent câte poziții ai.\n- Adaugi o poziție nouă pe aceeași idee (ex. încă un buy pe dolar slab)? Consideră întâi să reduci riscul pe cele existente — de exemplu mutând SL pe breakeven.\n\nTrei tranzacții „independente” de 1% pe EURUSD, GBPUSD și AUDUSD, toate long, înseamnă un singur pariu de 3% pe căderea dolarului. Recunoaște-l și dimensionează-l ca atare.",
              en: "The right question isn't 'how much am I risking on this trade?' but 'how much am I risking across ALL open positions if the market turns against me at once?'. That's your **aggregate exposure**.\n\nPractical exposure rules:\n\n- Maximum **2–3 correlated positions** in the same direction — and treat them as ONE trade when sizing.\n- Total simultaneous exposure: maximum **3–4%** of the account, no matter how many positions.\n- Adding a new position on the same idea (e.g. another weak-dollar buy)? First consider reducing risk on the existing ones — for instance by moving the SL to breakeven.\n\nThree 'independent' 1% trades on EURUSD, GBPUSD and AUDUSD, all long, are a single 3% bet on a falling dollar. Recognize it and size it accordingly.",
            },
            tip: {
              ro: "Înainte să deschizi a doua poziție, pune-ți o singură întrebare: „dacă prima idee e greșită, pierde și aceasta?”. Dacă răspunsul e da, nu e o diversificare — e o dublare.",
              en: "Before opening a second position, ask yourself one question: 'if the first idea is wrong, does this one lose too?'. If the answer is yes, it's not diversification — it's doubling down.",
            },
          },
          {
            heading: { ro: "Riscul de știri: NFP, CPI, FOMC", en: "News risk: NFP, CPI, FOMC" },
            body: {
              ro: "Câteva evenimente macro mișcă piața violent, în secunde:\n\n- **NFP (Non-Farm Payrolls)** — raportul locurilor de muncă din SUA, prima vineri a lunii.\n- **CPI** — inflația din SUA, lunar; dictează așteptările de dobândă.\n- **FOMC** — decizia de dobândă a Fed, de 8 ori pe an, plus conferința de presă.\n\nÎn timpul acestor evenimente, spread-urile se lărgesc de câteva ori, lichiditatea dispare, iar **slippage-ul** poate executa stop loss-ul mult mai jos decât l-ai pus. Sizing-ul tău, calculat pentru condiții normale, nu mai e valid.\n\nProtocolul profesionist e simplu: verifică-ți calendarul economic dimineața și, în jurul știrilor majore, **redu mărimea poziției sau stai deoparte complet**. A nu tranzacționa un eveniment binar nu e frică — e recunoașterea faptului că rezultatul e o monedă aruncată, iar tu nu tranzacționezi monede aruncate.",
              en: "A few macro events move the market violently, within seconds:\n\n- **NFP (Non-Farm Payrolls)** — the US jobs report, first Friday of the month.\n- **CPI** — US inflation, monthly; it drives interest-rate expectations.\n- **FOMC** — the Fed's rate decision, 8 times a year, plus the press conference.\n\nDuring these events, spreads widen several times over, liquidity vanishes, and **slippage** can execute your stop loss far below where you placed it. Your sizing, calculated for normal conditions, is no longer valid.\n\nThe professional protocol is simple: check the economic calendar every morning and, around major news, **reduce position size or stand aside entirely**. Skipping a binary event isn't fear — it's recognizing that the outcome is a coin flip, and you don't trade coin flips.",
            },
          },
          {
            heading: { ro: "Gap-urile de weekend: crypto vs forex", en: "Weekend gaps: crypto vs forex" },
            body: {
              ro: "Piața forex e închisă de vineri seara până duminică seara. Dacă în weekend apare o știre majoră, luni prețul se deschide cu **gap** — direct la un alt nivel. Stop loss-ul tău NU te protejează de gap: se execută la primul preț disponibil, care poate fi mult dincolo de nivelul setat.\n\nCrypto tranzacționează 24/7, deci pe exchange-uri nu există gap de weekend — dar lichiditatea de weekend e subțire, iar mișcările pot fi bruște și haotice. Atenție și la CFD-urile crypto de la brokerii forex: multe au program limitat și pot avea gap chiar dacă piața spot nu are.\n\nReguli practice:\n\n- Poziții forex ținute peste weekend = risc de gap acceptat conștient; redu lotul sau închide pozițiile vulnerabile vineri.\n- Nu ține peste weekend poziții cu SL strâns aproape de preț — gap-ul îl face inutil.\n- La crypto, tratează weekendul ca pe o sesiune cu lichiditate redusă: mișcările de sâmbătă noaptea mint des.",
              en: "The forex market is closed from Friday evening to Sunday evening. If major news breaks over the weekend, Monday's price opens with a **gap** — straight at a different level. Your stop loss does NOT protect you from a gap: it executes at the first available price, which can be far beyond your set level.\n\nCrypto trades 24/7, so on exchanges there's no weekend gap — but weekend liquidity is thin and moves can be sudden and chaotic. Also watch out for crypto CFDs at forex brokers: many have limited hours and can gap even though the spot market doesn't.\n\nPractical rules:\n\n- Forex positions held over the weekend = consciously accepted gap risk; reduce the lot or close vulnerable positions on Friday.\n- Don't hold positions with a tight SL close to price over the weekend — a gap makes it useless.\n- In crypto, treat the weekend as a low-liquidity session: Saturday-night moves often lie.",
            },
            warning: {
              ro: "Slippage-ul la știri și gap-urile de weekend sunt singurele situații în care poți pierde MAI MULT decât riscul calculat. Nu le poți elimina — le poți doar evita (stai deoparte) sau amortiza (loturi reduse). Ignorarea lor transformă regula de 1% într-o iluzie.",
              en: "News slippage and weekend gaps are the only situations where you can lose MORE than your calculated risk. You can't eliminate them — you can only avoid them (stand aside) or cushion them (smaller lots). Ignoring them turns the 1% rule into an illusion.",
            },
          },
        ],
      },
    ],
  },
  diagrams: {
    "m7-drawdown-recovery": {
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
      line: [60, 58, 55, 50, 44, 38, 32, 30, 31, 34, 38, 43, 48, 53, 57, 60],
      levels: [
        { y: 60, label: "100%", color: "#818cf8", dashed: true },
        { y: 30, label: "−50%", color: "#f43f5e" },
      ],
      arrows: [
        { x: 3, y: 60, dir: "down", color: "#f43f5e", label: "−50%" },
        { x: 11, y: 33, dir: "up", color: "#10b981", label: "+100% necesar" },
      ],
      caption: {
        ro: "Asimetria drawdown-ului: căderea de −50% e rapidă, dar drumul înapoi cere +100% — de două ori mai mult decât ai pierdut procentual.",
        en: "Drawdown asymmetry: the −50% fall is fast, but the road back requires +100% — twice what you lost in percentage terms.",
      },
    },
    "m7-rr-3r": {
      candles: [
        { o: 40, h: 44, l: 36, c: 42 },
        { o: 42, h: 45, l: 38, c: 39 },
        { o: 39, h: 43, l: 35, c: 41 },
        { o: 41, h: 44, l: 37, c: 40 },
        { o: 40, h: 42, l: 34, c: 38 },
        { o: 38, h: 46, l: 37, c: 44 },
        { o: 44, h: 52, l: 42, c: 50 },
        { o: 50, h: 60, l: 48, c: 58 },
        { o: 58, h: 66, l: 55, c: 63 },
        { o: 63, h: 73, l: 60, c: 71 },
      ],
      zones: [
        { y1: 40, y2: 70, color: "#10b981", label: "Reward 3R" },
        { y1: 30, y2: 40, color: "#f43f5e", label: "Risc 1R" },
      ],
      levels: [
        { y: 70, label: "Take Profit (+3R)", color: "#10b981" },
        { y: 40, label: "Entry", color: "#818cf8", dashed: false },
        { y: 30, label: "Stop Loss (−1R)", color: "#f43f5e" },
      ],
      caption: {
        ro: "Setup 1:3 — riști o unitate (1R) pentru o țintă de trei unități (3R). La acest raport, ești profitabil chiar și cu doar 25% tranzacții câștigătoare.",
        en: "A 1:3 setup — you risk one unit (1R) for a three-unit target (3R). At this ratio you're profitable even with only 25% winning trades.",
      },
    },
    "m7-daily-limit": {
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
      ],
      line: [62, 64, 66, 65, 62, 58, 54, 50, 46, 42, 39, 37, 35, 35],
      levels: [
        { y: 62, label: "Start zi", color: "#818cf8", dashed: true },
        { y: 35, label: "Daily limit −5%", color: "#f43f5e" },
      ],
      arrows: [{ x: 8, y: 54, dir: "down", color: "#f43f5e", label: "Revenge" }],
      labels: [{ x: 12.6, y: 28, text: "STOP", color: "#f43f5e" }],
      caption: {
        ro: "O zi care ucide conturi: după primele pierderi, tranzacțiile devin tot mai grăbite. La atingerea limitei zilnice, platforma se închide — TradeGx te alertează înainte să ajungi acolo.",
        en: "An account-killing day: after the first losses, trades get more and more rushed. When the daily limit is hit, the platform closes — TradeGx alerts you before you get there.",
      },
    },
    "m7-correlation": {
      candles: [
        { o: 30, h: 36, l: 28, c: 34 },
        { o: 34, h: 40, l: 32, c: 38 },
        { o: 38, h: 42, l: 34, c: 36 },
        { o: 36, h: 44, l: 35, c: 42 },
        { o: 42, h: 48, l: 40, c: 46 },
        { o: 46, h: 50, l: 42, c: 44 },
        { o: 44, h: 52, l: 43, c: 50 },
        { o: 50, h: 56, l: 48, c: 54 },
        { o: 54, h: 60, l: 52, c: 58 },
        { o: 58, h: 66, l: 56, c: 64 },
      ],
      line: [70, 66, 63, 60, 56, 54, 50, 46, 42, 38],
      labels: [
        { x: 1, y: 22, text: "EURUSD", color: "#10b981" },
        { x: 2, y: 76, text: "DXY", color: "#f59e0b" },
      ],
      caption: {
        ro: "Relația inversă DXY–EURUSD: când indexul dolarului (linia) coboară, EURUSD (lumânările) urcă. DXY e filtrul de context al oricărei tranzacții pe dolar.",
        en: "The inverse DXY–EURUSD relationship: when the dollar index (line) falls, EURUSD (candles) rises. DXY is the context filter for any dollar trade.",
      },
    },
  },
};
