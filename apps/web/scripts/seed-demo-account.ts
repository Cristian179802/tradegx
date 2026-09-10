/**
 * Seed pentru contul demo folosit în materialele video.
 * Specificația: docs/VIDEO_SPEC.md, secțiunea 2.
 *
 * ── DE CE EXISTĂ ────────────────────────────────────────────────────────────
 * Publicul e SMC/ICT și miroase datele false instant. Un win rate de 68%, o
 * curbă de capital fără nicio cădere, setup-uri distribuite perfect egal —
 * fiecare dintre ele spune „generat", iar odată ce privitorul a gândit asta,
 * restul videoului nu mai contează.
 *
 * ── TREI REGULI ─────────────────────────────────────────────────────────────
 *
 * 1. DETERMINIST. Aceleași date la fiecare rulare, până la ultimul cent.
 *    Generatorul de numere e propriu și pornit dintr-o sămânță fixă —
 *    `Math.random()` ar face imposibilă filmarea aceleiași secvențe de două ori.
 *
 * 2. IDEMPOTENT. Rulat de zece ori, baza arată la fel ca după prima. Contul se
 *    găsește după un marcaj stabil, iar tranzacțiile lui se șterg înainte de a
 *    fi rescrise.
 *
 * 3. SE VERIFICĂ SINGUR. La final recalculează totul din datele generate și
 *    compară cu specul. Dacă nu se potrivește, ARUNCĂ — un seed care produce
 *    tăcut alte cifre decât cele promise e mai rău decât unul care nu rulează,
 *    fiindcă descoperi la montaj, nu acum.
 *
 * Verificarea folosește `edgeMetrics` și `maxDrawdown` din @tradegx/core —
 * exact funcțiile cu care aplicația își calculează statisticile. Dacă aș
 * rescrie formulele aici, seed-ul ar putea „trece" cu o matematică pe care
 * aplicația n-o folosește.
 *
 * ── ABATERI DE LA SPEC, ASUMATE ─────────────────────────────────────────────
 *
 * · „SMT Divergence" nu există în enum-ul SetupType. Înlocuit cu CHOCH —
 *   vocabular SMC la fel de recunoscut, fără migrare de schemă pe producție.
 *
 * · Sesiuni: specul cere London 45% / New York 40% / Asia 15%. Ies 45/37/18.
 *   Motivul: insight-ul plantat cere 13 tranzacții FVG în Asia, iar la 15%
 *   Asia are exact 13 — deci TOATE tranzacțiile din Asia ar fi FVG. Asta e
 *   chiar semnalul de „generat" pe care specul cere să-l evităm, și ar face
 *   statistica pe sesiune identică cu cea pe setup. Am adăugat 3 tranzacții
 *   non-FVG în Asia; insight-ul rămâne exact, distribuția alunecă cu 3 puncte.
 *
 * Rulare:  npm run db:seed:demo   (din apps/web)
 */

import { PrismaClient, type Prisma } from "@prisma/client";
import { edgeMetrics, maxDrawdown, type TradeStat } from "@tradegx/core";

const prisma = new PrismaClient();

// ── Parametrii specului ─────────────────────────────────────────────────────

const SPEC = {
  trades: 87,
  winRatePct: 47,
  avgWinR: 2.6,
  avgLossR: -1.0,
  expectancyR: 0.69,
  netReturnPct: 34,
  drawdownsPct: [12, 8],
  months: 4,
} as const;

/** Contul: 50.000 $ și 280 $ per R (0.56% risc) dau exact +34% la 60.6R net. */
const INITIAL_BALANCE = 50_000;
const R_MONEY = 280;

/** Marcajul după care regăsim contul la rulările următoare. */
const ACCOUNT_NAME = "Demo — TradeGX";
const DEMO_EMAIL = "demo@tradegx.com";

const SEED = 0x7ade6c;

// ── Generator determinist ───────────────────────────────────────────────────
// mulberry32: mic, rapid, fără dependințe, și — esențial aici — reproductibil
// bit cu bit între mașini și versiuni de Node.

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rand(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(SEED);
const randInt = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]!;

// ── Compoziția, ca DATE ─────────────────────────────────────────────────────
//
// Fiecare celulă spune: setup, sesiune, câte tranzacții, câte câștigătoare.
// Scrisă explicit, nu dedusă din procente, ca insight-ul plantat să fie
// verificabil dintr-o privire — și ca oricine schimbă o cifră să vadă imediat
// ce strică în rest.

type Setup = "FAIR_VALUE_GAP" | "ORDER_BLOCK" | "LIQUIDITY_SWEEP" | "CHOCH" | "BOS";
type Session = "LONDON" | "NEW_YORK" | "ASIAN";

interface Cell {
  setup: Setup;
  session: Session;
  trades: number;
  wins: number;
}

const COMPOSITION: Cell[] = [
  // ── Insight-ul plantat. Astea trei celule sunt motivul videoului. ────────
  { setup: "FAIR_VALUE_GAP", session: "LONDON", trades: 23, wins: 14 }, // 60.9%
  { setup: "FAIR_VALUE_GAP", session: "ASIAN", trades: 13, wins: 3 }, //  23.1%
  { setup: "FAIR_VALUE_GAP", session: "NEW_YORK", trades: 8, wins: 4 }, // 50.0%

  // ── Restul: un trader normal, nici strălucit, nici dezastruos ────────────
  { setup: "ORDER_BLOCK", session: "LONDON", trades: 9, wins: 5 },
  { setup: "ORDER_BLOCK", session: "NEW_YORK", trades: 8, wins: 4 },
  { setup: "LIQUIDITY_SWEEP", session: "LONDON", trades: 4, wins: 2 },
  { setup: "LIQUIDITY_SWEEP", session: "NEW_YORK", trades: 7, wins: 3 },
  { setup: "LIQUIDITY_SWEEP", session: "ASIAN", trades: 2, wins: 1 },
  { setup: "CHOCH", session: "LONDON", trades: 2, wins: 1 },
  { setup: "CHOCH", session: "NEW_YORK", trades: 5, wins: 2 },
  { setup: "CHOCH", session: "ASIAN", trades: 1, wins: 0 },
  { setup: "BOS", session: "LONDON", trades: 1, wins: 1 },
  { setup: "BOS", session: "NEW_YORK", trades: 4, wins: 1 },
];

const INSTRUMENTS = [
  { symbol: "EURUSD", type: "FOREX", digits: 5, pip: 0.0001, base: 1.0850 },
  { symbol: "GBPUSD", type: "FOREX", digits: 5, pip: 0.0001, base: 1.2680 },
  { symbol: "XAUUSD", type: "METALS", digits: 2, pip: 0.1, base: 2380 },
  { symbol: "US30", type: "INDICES", digits: 1, pip: 1, base: 38900 },
  { symbol: "NAS100", type: "INDICES", digits: 1, pip: 1, base: 18240 },
] as const;

/** Sesiunea → fereastra orară (UTC) în care se deschide tranzacția. */
const SESSION_HOURS: Record<Session, [number, number]> = {
  ASIAN: [0, 6],
  LONDON: [7, 12],
  NEW_YORK: [13, 20],
};

// ── R-multipli ──────────────────────────────────────────────────────────────
//
// Toți câștigătorii la exact +2.6R ar fi la fel de fals ca un win rate de 70%.
// Generăm o împrăștiere plauzibilă, apoi o SCALĂM ca media să pice exact pe
// ținta din spec. Scalarea păstrează forma distribuției și garantează cifra.

function spreadR(count: number, targetMean: number, lo: number, hi: number): number[] {
  if (count === 0) return [];
  const raw = Array.from({ length: count }, () => lo + rand() * (hi - lo));
  const mean = raw.reduce((s, v) => s + v, 0) / count;
  const scaled = raw.map((v) => (v * targetMean) / mean);
  // Corecție finală pe ultimul element: după rotunjirea la 2 zecimale, suma
  // poate aluneca cu câțiva bani. Aici o închidem exact.
  const rounded = scaled.map((v) => Math.round(v * 100) / 100);
  const drift = targetMean * count - rounded.reduce((s, v) => s + v, 0);
  rounded[rounded.length - 1] = Math.round((rounded[rounded.length - 1]! + drift) * 100) / 100;
  return rounded;
}

// ── Ordonarea: curba de capital ─────────────────────────────────────────────
//
// Aceleași tranzacții, altă ordine, altă curbă. Specul cere +34% net CU două
// căderi (-12% și -8%) — deci ordinea nu poate fi întâmplătoare: grupăm
// pierderile în două ferestre, restul se împrăștie.
//
// Fazele sunt exprimate în proporții de câștigătoare, nu în tranzacții fixe,
// ca să rămână corecte dacă cineva schimbă totalul din COMPOSITION.

interface Faza {
  nume: string;
  pondere: number; // ce fracțiune din tranzacții intră aici
  rataCastig: number; // ce fracțiune dintre ele sunt câștigătoare
  buna: boolean; // fază de creștere (primește R-ii favorabili) sau de cădere
}

/**
 * DE CE R-II SE ATRIBUIE PE FAZE, nu la întâmplare.
 *
 * Cu R-ii împrăștiați uniform, cifrele specului nu pot coexista: +34% net vine
 * din 60.6R, iar o cădere de 12% cere ~26R pierduți dintr-un vârf. La media
 * globală (câștig +2.6R, pierdere −1R) asta ar însemna ~33 de pierderi contra
 * 3 câștiguri — 8% win rate pe 36 de tranzacții. Nimeni nu crede asta, și oricum
 * ar lăsa restul curbei cu un win rate imposibil de mare.
 *
 * Realitatea e alta, și e mai bună pentru noi: într-o perioadă proastă, același
 * trader taie câștigurile scurt („măcar atât") și lasă pierderile să treacă de
 * stop („se întoarce imediat"). Deci fazele de cădere primesc cele mai mici
 * câștiguri și cele mai mari pierderi, iar fazele bune invers.
 *
 * Mulțimea R-ilor rămâne NESCHIMBATĂ — mediile globale cerute de spec sunt
 * exacte. Se schimbă doar ordinea, adică forma curbei.
 */
// Ponderile nu sunt alese din ochi: am baleiat determinist spațiul lor și l-am
// păstrat pe cel care aduce ambele căderi cel mai aproape de țintă. Ies 11.4%
// și 7.9% față de 12% și 8% cerute — restul spațiului dă fie o singură cădere,
// fie una adâncă și una neglijabilă.
const FAZE: Faza[] = [
  { nume: "urcare initiala", pondere: 0.14, rataCastig: 0.75, buna: true },
  { nume: "drawdown 1", pondere: 0.28, rataCastig: 0.05, buna: false }, // ținta −12%
  { nume: "revenire", pondere: 0.20, rataCastig: 0.80, buna: true },
  { nume: "drawdown 2", pondere: 0.24, rataCastig: 0.10, buna: false }, // ținta −8%
  { nume: "final", pondere: 0.14, rataCastig: 0.72, buna: true },
];

// ── Construcția tranzacțiilor ───────────────────────────────────────────────

interface Planificata {
  setup: Setup;
  session: Session;
  castig: boolean;
  faza: string;
  bunaFaza: boolean;
  /** poziția în interiorul fazei, 0..1 — vezi atribuirea R-ilor */
  pozitieInFaza: number;
  r: number;
}

const shuffle = <T,>(xs: T[]): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};

function construiestePlan(): Planificata[] {
  const castigatoare: Planificata[] = [];
  const pierzatoare: Planificata[] = [];

  for (const c of COMPOSITION) {
    for (let i = 0; i < c.trades; i++) {
      const castig = i < c.wins;
      (castig ? castigatoare : pierzatoare).push({
        setup: c.setup,
        session: c.session,
        castig,
        faza: "",
        bunaFaza: true,
        pozitieInFaza: 0,
        r: 0,
      });
    }
  }

  const wPool = shuffle(castigatoare);
  const lPool = shuffle(pierzatoare);

  // ── Pasul 1: ordinea pe faze (cine, când) ──
  const total = wPool.length + lPool.length;
  const ordonate: Planificata[] = [];
  let wi = 0;
  let li = 0;

  FAZE.forEach((faza, idx) => {
    const nFaza =
      idx === FAZE.length - 1 ? total - ordonate.length : Math.round(total * faza.pondere);
    const nCastig = Math.min(Math.round(nFaza * faza.rataCastig), wPool.length - wi);
    const bucata: Planificata[] = [];
    for (let i = 0; i < nCastig; i++) bucata.push(wPool[wi++]!);
    for (let i = 0; i < nFaza - nCastig; i++) {
      if (li < lPool.length) bucata.push(lPool[li++]!);
      else if (wi < wPool.length) bucata.push(wPool[wi++]!);
    }
    // Fazele bune se amestecă. Fazele de cădere NU: câștigurile puține stau la
    // început („e doar o pauză"), apoi urmează șirul de pierderi.
    //
    // Nu e o scurtătură ca să iasă cifra — așa arată un drawdown adevărat. Cu
    // amestec, pierderile se împrăștiau printre câștiguri și căderea ieșea de
    // 9% în loc de 12%: matematic corect, dar nu seamănă cu nimic din ce a
    // trăit un trader.
    const amestecata = faza.buna ? shuffle(bucata) : bucata;
    amestecata.forEach((t, k) => {
      t.faza = faza.nume;
      t.bunaFaza = faza.buna;
      t.pozitieInFaza = amestecata.length > 1 ? k / (amestecata.length - 1) : 0;
    });
    ordonate.push(...amestecata);
  });

  const laCoada = (t: Planificata) => {
    t.faza = "final";
    t.bunaFaza = true;
    t.pozitieInFaza = 0.9;
    ordonate.push(t);
  };
  while (wi < wPool.length) laCoada(wPool[wi++]!);
  while (li < lPool.length) laCoada(lPool[li++]!);

  // ── Pasul 2: R-ii, atribuiți după favorabilitate ──
  // Mulțimea valorilor e fixată de spec (mediile trebuie să iasă exact);
  // alegem doar CINE primește ce. Fazele bune iau câștigurile mari și
  // pierderile mici; fazele de cădere, invers.
  const rCastig = spreadR(wPool.length, SPEC.avgWinR, 1.1, 5.4).sort((a, b) => b - a);
  const rPierdere = spreadR(lPool.length, SPEC.avgLossR, -1.35, -0.45).sort((a, b) => a - b);

  // ── Pasul 3: cele mai mari pierderi se ÎMPART între ambele căderi ────────
  //
  // Prima încercare le dădea în ordinea cronologică, deci prima cădere consuma
  // toate pierderile mari și a doua ieșea de 1.8% — sub prag, invizibilă, iar
  // curba avea o singură cădere în loc de două.
  //
  // Sortarea după poziția RELATIVĂ în fază face ca „începutul căderii 1" și
  // „începutul căderii 2" să vină unul după altul în coadă, deci amândouă
  // primesc pierderi de aceeași mărime. Cu asta ies 11.2% și 7.5%.
  const dupaPozitie = (a: Planificata, b: Planificata) => a.pozitieInFaza - b.pozitieInFaza;

  const castiguri = ordonate.filter((t) => t.castig);
  const pierderi = ordonate.filter((t) => !t.castig);

  [
    ...castiguri.filter((t) => t.bunaFaza),
    ...castiguri.filter((t) => !t.bunaFaza).sort(dupaPozitie),
  ].forEach((t, i) => (t.r = rCastig[i]!));

  [
    ...pierderi.filter((t) => !t.bunaFaza).sort(dupaPozitie),
    ...pierderi.filter((t) => t.bunaFaza),
  ].forEach((t, i) => (t.r = rPierdere[i]!));

  return ordonate;
}

/** Datele calendaristice: 4 luni, doar în zilele lucrătoare, ordonate. */
function genereazaDate(n: number): Date[] {
  const sfarsit = new Date(Date.UTC(2026, 8, 5, 0, 0, 0)); // 5 sept 2026
  const start = new Date(sfarsit);
  start.setUTCMonth(start.getUTCMonth() - SPEC.months);

  const zileLucratoare: Date[] = [];
  for (let d = new Date(start); d <= sfarsit; d.setUTCDate(d.getUTCDate() + 1)) {
    const zi = d.getUTCDay();
    if (zi !== 0 && zi !== 6) zileLucratoare.push(new Date(d));
  }

  // Împrăștiem tranzacțiile peste zilele lucrătoare, păstrând ordinea.
  const pas = zileLucratoare.length / n;
  return Array.from({ length: n }, (_, i) => zileLucratoare[Math.floor(i * pas)]!);
}

function construiesteTranzactii(
  accountId: string
): Prisma.TradeCreateManyInput[] {
  const plan = construiestePlan();
  const zile = genereazaDate(plan.length);

  return plan.map((t, i) => {
    const instr = pick(INSTRUMENTS);
    const [h0, h1] = SESSION_HOURS[t.session];
    const entryTime = new Date(zile[i]!);
    entryTime.setUTCHours(randInt(h0, h1), randInt(0, 59), 0, 0);

    const durata = randInt(18, 260);
    const exitTime = new Date(entryTime.getTime() + durata * 60_000);

    const directie = rand() < 0.54 ? "BUY" : "SELL";
    const semn = directie === "BUY" ? 1 : -1;

    // Prețurile se construiesc ÎNAPOI din R: distanța până la stop e riscul,
    // iar ieșirea e la r × distanța aia. Așa prețurile și R-ul spun aceeași
    // poveste — dacă le-aș genera separat, un trader ar vedea imediat că
    // R-ul afișat nu se potrivește cu graficul.
    const drift = (rand() - 0.5) * instr.base * 0.02;
    const entry = instr.base + drift;
    const stopDist = instr.pip * randInt(instr.symbol === "XAUUSD" ? 90 : 120, instr.symbol === "XAUUSD" ? 260 : 340);
    const stopLoss = entry - semn * stopDist;
    const exitPrice = entry + semn * stopDist * t.r;
    const takeProfit = entry + semn * stopDist * (t.castig ? Math.max(t.r, 1.5) : randInt(15, 30) / 10);

    const round = (v: number) => Number(v.toFixed(instr.digits));
    const pnlMoney = Number((t.r * R_MONEY).toFixed(2));

    return {
      accountId,
      symbol: instr.symbol,
      instrumentType: instr.type,
      direction: directie,
      entryPrice: round(entry),
      entryTime,
      exitPrice: round(exitPrice),
      exitTime,
      lotSize: Number((0.2 + rand() * 1.3).toFixed(2)),
      stopLoss: round(stopLoss),
      takeProfit: round(takeProfit),
      pnlMoney,
      riskMoney: R_MONEY,
      riskPercent: Number(((R_MONEY / INITIAL_BALANCE) * 100).toFixed(2)),
      riskRewardRatio: Number(Math.abs(t.r).toFixed(2)),
      setupType: t.setup,
      sessionType: t.session,
      killzone: t.session,
      timeframe: pick(["M15", "H1", "H4"] as const),
      status: "CLOSED",
      brokerSource: "MANUAL",
      tags: [],
      durationMinutes: durata,
    } satisfies Prisma.TradeCreateManyInput;
  });
}

// ── Verificarea ─────────────────────────────────────────────────────────────

interface Abatere {
  ce: string;
  cerut: string;
  obtinut: string;
  ok: boolean;
}

function verifica(tranzactii: Prisma.TradeCreateManyInput[]): Abatere[] {
  const stats: TradeStat[] = tranzactii.map((t) => ({
    pnl: Number(t.pnlMoney),
    rMultiple: Number(t.pnlMoney) / R_MONEY,
  }));
  const m = edgeMetrics(stats);

  // Curba de capital, în ordinea cronologică a tranzacțiilor.
  let sold = INITIAL_BALANCE;
  const equity = [sold];
  for (const t of tranzactii) equity.push((sold += Number(t.pnlMoney)));
  const dd = maxDrawdown(equity);
  const caderi = caderiDistincte(equity, 3.5);
  const randament = ((sold - INITIAL_BALANCE) / INITIAL_BALANCE) * 100;

  const aproape = (a: number, b: number, toleranta: number) => Math.abs(a - b) <= toleranta;
  const f = (v: number, z = 1) => v.toFixed(z);

  return [
    { ce: "tranzacții", cerut: String(SPEC.trades), obtinut: String(m.totalTrades), ok: m.totalTrades === SPEC.trades },
    { ce: "win rate", cerut: `${SPEC.winRatePct}%`, obtinut: `${f(m.winRatePct)}%`, ok: aproape(m.winRatePct, SPEC.winRatePct, 1.2) },
    { ce: "avg win", cerut: `+${SPEC.avgWinR}R`, obtinut: `+${f(m.avgWin / R_MONEY, 2)}R`, ok: aproape(m.avgWin / R_MONEY, SPEC.avgWinR, 0.1) },
    { ce: "avg loss", cerut: `${SPEC.avgLossR}R`, obtinut: `${f(-m.avgLoss / R_MONEY, 2)}R`, ok: aproape(-m.avgLoss / R_MONEY, SPEC.avgLossR, 0.1) },
    { ce: "expectancy", cerut: `~+${SPEC.expectancyR}R`, obtinut: `+${f(m.expectancyR ?? 0, 2)}R`, ok: aproape(m.expectancyR ?? 0, SPEC.expectancyR, 0.08) },
    { ce: "randament net", cerut: `+${SPEC.netReturnPct}%`, obtinut: `+${f(randament)}%`, ok: aproape(randament, SPEC.netReturnPct, 3) },
    { ce: "drawdown maxim", cerut: `~${SPEC.drawdownsPct[0]}%`, obtinut: `${f(dd.maxDrawdownPct * 100)}%`, ok: aproape(dd.maxDrawdownPct * 100, SPEC.drawdownsPct[0]!, 2) },
    { ce: "a doua cădere", cerut: `~${SPEC.drawdownsPct[1]}%`, obtinut: `${f(caderi[1] ?? 0)}%`, ok: aproape(caderi[1] ?? 0, SPEC.drawdownsPct[1]!, 2) },
    { ce: "curbă nemonotonă", cerut: "≥2 căderi ≥3.5%", obtinut: `${caderi.length}: ${caderi.map((c) => f(c) + "%").join(" · ")}`, ok: caderi.length >= 2 },
  ];
}

/**
 * Adâncimea fiecărei căderi distincte, în ordine descrescătoare.
 *
 * O cădere se închide când curba face un vârf NOU — altfel două perioade
 * proaste despărțite de o revenire parțială s-ar citi ca una singură, iar
 * specul cere explicit două.
 */
function caderiDistincte(equity: number[], pragPct: number): number[] {
  let peak = equity[0]!;
  let curenta = 0;
  const out: number[] = [];
  for (const v of equity) {
    if (v > peak) {
      if (curenta >= pragPct) out.push(curenta);
      curenta = 0;
      peak = v;
    }
    curenta = Math.max(curenta, ((peak - v) / peak) * 100);
  }
  if (curenta >= pragPct) out.push(curenta);
  return out.sort((a, b) => b - a);
}

// ── Rularea ─────────────────────────────────────────────────────────────────

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true, role: true },
  });
  if (!user) throw new Error(`Utilizatorul ${DEMO_EMAIL} nu există. Seed-ul nu creează conturi de utilizator.`);

  // Contul se regăsește după nume, nu se creează unul nou la fiecare rulare.
  // Restul conturilor utilizatorului demo rămân NEATINSE.
  const existent = await prisma.tradingAccount.findFirst({
    where: { userId: user.id, name: ACCOUNT_NAME },
    select: { id: true },
  });

  const account = existent
    ? await prisma.tradingAccount.update({
        where: { id: existent.id },
        data: { balance: INITIAL_BALANCE, initialBalance: INITIAL_BALANCE },
        select: { id: true },
      })
    : await prisma.tradingAccount.create({
        data: {
          userId: user.id,
          name: ACCOUNT_NAME,
          type: "LIVE",
          currency: "USD",
          balance: INITIAL_BALANCE,
          initialBalance: INITIAL_BALANCE,
          leverage: 100,
          broker: "TradeGX Demo",
          brokerSource: "MANUAL",
          isActive: true,
        },
        select: { id: true },
      });

  // Idempotența: ștergem tranzacțiile CONTULUI ĂSTA, nu ale utilizatorului.
  // Însemnările de jurnal atârnă de tranzacții cu onDelete: Cascade, deci
  // pleacă odată cu ele — nu rămân orfane.
  const sterse = await prisma.trade.deleteMany({ where: { accountId: account.id } });

  const tranzactii = construiesteTranzactii(account.id);

  const abateri = verifica(tranzactii);
  const gresite = abateri.filter((a) => !a.ok);

  console.log(`\n  cont: ${ACCOUNT_NAME}  (${account.id})`);
  console.log(`  șterse: ${sterse.count} tranzacții vechi ale acestui cont\n`);
  console.log("  ── verificare față de spec ──");
  for (const a of abateri) {
    console.log(`  ${a.ok ? "✓" : "✗"} ${a.ce.padEnd(18)} cerut ${a.cerut.padEnd(10)} obținut ${a.obtinut}`);
  }

  if (gresite.length > 0) {
    console.error(`\n  ${gresite.length} abateri de la spec. NU scriu în bază.`);
    throw new Error("datele generate nu respectă specul");
  }

  await prisma.trade.createMany({ data: tranzactii });

  const sold = INITIAL_BALANCE + tranzactii.reduce((s, t) => s + Number(t.pnlMoney), 0);
  await prisma.tradingAccount.update({
    where: { id: account.id },
    data: { balance: Number(sold.toFixed(2)) },
  });

  console.log(`\n  scrise: ${tranzactii.length} tranzacții`);
  console.log(`  sold:   ${INITIAL_BALANCE} → ${sold.toFixed(2)} USD`);
}

main()
  .catch((e) => {
    console.error("\n  EROARE:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
