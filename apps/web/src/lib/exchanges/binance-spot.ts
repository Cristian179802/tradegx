import crypto from "node:crypto";
import type { ExchangeTrade } from "./bybit";

// ── Binance SPOT REST (read-only) ────────────────────────────────────────────
//
// Modul separat de `binance.ts` fiindcă e o bursă diferită sub aceeași marcă:
// alt host, alt wallet, alt format de execuție. Cine tranzacționează spot nu
// avea ce importa — `/fapi/v1/userTrades` întoarce STRICT futures, deci un cont
// pe care s-a cumpărat doar BTC pe spot se conecta cu succes și aducea 0 trade-uri.
//
// Trei diferențe care schimbă algoritmul, nu doar URL-ul:
//
//  1. ISTORIC. Futures taie la 6 luni („Only support querying trade in the past
//     6 months"). Spot nu documentează niciun plafon: mergem pe `fromId` de la 0
//     și primim tot ce ține bursa. De aceea plafonul de mai jos e generos — nu e
//     o limită a lor, e doar cât în urmă are rost să ne uităm.
//
//  2. P&L. Futures raportează `realizedPnl` pe execuția de închidere; spot NU
//     raportează nimic — trebuie calculat din perechea cumpărare/vânzare.
//
//  3. COMISION. Futures îl dă în moneda de decontare. Spot îl dă în
//     `commissionAsset`, care poate fi activul cumpărat, moneda de cotare sau
//     BNB (reducerea de 25%). Îl aducem în moneda de cotare, altfel adunăm BNB
//     cu dolari.
//
// Ce NU se poate: `/api/v3/myTrades` cere OBLIGATORIU `symbol`, ca la futures —
// nu există „toate execuțiile mele". Perechile trebuie ghicite; vezi discovery.

const SPOT = "https://api.binance.com";

// Cât în urmă ne uităm. Nu e o limită a bursei (spot ține tot), e limita
// noastră: un jurnal de trading nu are ce face cu execuții de acum opt ani.
export const BINANCE_SPOT_MAX_HISTORY_MS = 3 * 365 * 86_400_000;

// Monedele de cotare pe care le luăm în calcul când ghicim perechile. Lista
// completă a Binance are câteva zeci; astea acoperă practic tot ce tranzacționează
// cineva real, iar fiecare în plus înseamnă cereri irosite pe perechi inexistente.
const QUOTE_ASSETS = [
  "USDT", "FDUSD", "USDC", "BUSD", "TUSD", "DAI",
  "BTC", "ETH", "BNB",
  "EUR", "TRY", "BRL", "GBP", "RON",
];

function signed(secret: string, params: Record<string, string | number>): string {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString();
  const signature = crypto.createHmac("sha256", secret).update(qs).digest("hex");
  return `${qs}&signature=${signature}`;
}

async function priv<T>(
  apiKey: string,
  apiSecret: string,
  path: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const qs = signed(apiSecret, { ...params, timestamp: Date.now(), recvWindow: 60000 });
  const res = await fetch(`${SPOT}${path}?${qs}`, {
    headers: { "X-MBX-APIKEY": apiKey },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Binance Spot ${res.status}: ${body.slice(0, 180)}`);
  }
  return res.json() as Promise<T>;
}

async function pub<T>(path: string): Promise<T> {
  const res = await fetch(`${SPOT}${path}`, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Binance Spot ${res.status}: ${body.slice(0, 180)}`);
  }
  return res.json() as Promise<T>;
}

interface Balance { asset?: string; free?: string; locked?: string }
interface AccountInfo { balances?: Balance[]; permissions?: string[] }
interface SpotFill {
  id?: number; orderId?: number; symbol?: string;
  price?: string; qty?: string; quoteQty?: string;
  commission?: string; commissionAsset?: string;
  time?: number; isBuyer?: boolean;
}
interface SymbolInfo { symbol?: string; status?: string; baseAsset?: string; quoteAsset?: string }

// ── Prețurile, o singură dată ────────────────────────────────────────────────
//
// `/api/v3/ticker/price` fără parametri întoarce toate cele ~3700 de perechi în
// 153 KB. E sursa pentru DOUĂ lucruri: cursurile de care avem nevoie și lista
// perechilor care există (cheile).
//
// Alternativele sunt măsurat mai proaste. `exchangeInfo` complet: 6,3 MB și 1,2
// secunde din bugetul de 20 pentru aceeași informație. Iar varianta pe loturi,
// `?symbols=[...]`, e o capcană: dacă UN simbol din lot e invalid, Binance
// respinge tot lotul cu -1121 — verificat. Iar soldurile chiar conțin active
// fără pereche spot (tokenurile Simple Earn, „LDBTC" și rudele lor), deci lotul
// ar fi picat exact în cazul obișnuit, lăsând soldul pe zero fără explicație.
const PRICES_TTL_MS = 10 * 60_000;
let priceCache: { at: number; prices: Map<string, number> } | null = null;

async function loadPrices(): Promise<Map<string, number>> {
  if (priceCache && Date.now() - priceCache.at < PRICES_TTL_MS) return priceCache.prices;
  const rows = await pub<{ symbol?: string; price?: string }[]>("/api/v3/ticker/price");
  const prices = new Map<string, number>();
  for (const r of rows) if (r.symbol) prices.set(r.symbol, Number(r.price ?? 0));
  priceCache = { at: Date.now(), prices };
  return prices;
}

// Bază și cotare pentru un simbol. NU se poate deduce prin tăiere de șir: în
// „ETHBTC" ambele jumătăți sunt monede valide, iar activul poate el însuși să se
// termine cu numele unei monede de cotare. Doar bursa știe, așa că întrebăm — dar
// punctual, un simbol per cerere (~1 KB), și doar pentru perechile care au chiar
// execuții. Răspunsul se ține în memoria instanței.
const pairCache = new Map<string, { base: string; quote: string } | null>();

async function pairOf(symbol: string): Promise<{ base: string; quote: string } | null> {
  const cached = pairCache.get(symbol);
  if (cached !== undefined) return cached;
  let out: { base: string; quote: string } | null = null;
  try {
    const info = await pub<{ symbols?: SymbolInfo[] }>(`/api/v3/exchangeInfo?symbol=${symbol}`);
    const s = info.symbols?.[0];
    if (s?.baseAsset && s?.quoteAsset) out = { base: s.baseAsset, quote: s.quoteAsset };
  } catch {
    /* simbol delistat sau inexistent — rămâne necunoscut */
  }
  pairCache.set(symbol, out);
  return out;
}

/**
 * Soldul contului spot, evaluat în USDT.
 *
 * Folosit la validarea cheilor: o cheie fără permisiune de futures trece pe aici,
 * ca să se poată conecta și cine tranzacționează exclusiv spot.
 */
export async function spotEquityUsdt(
  apiKey: string,
  apiSecret: string
): Promise<{ equity: number; assets: string[] }> {
  const acc = await priv<AccountInfo>(apiKey, apiSecret, "/api/v3/account", {
    omitZeroBalances: "true",
  });

  const held: { asset: string; qty: number }[] = [];
  for (const b of acc.balances ?? []) {
    const qty = Number(b.free ?? 0) + Number(b.locked ?? 0);
    if (b.asset && qty > 0) held.push({ asset: b.asset, qty });
  }
  if (held.length === 0) return { equity: 0, assets: [] };

  const prices = await loadPrices();

  let equity = 0;
  for (const h of held) {
    if (h.asset === "USDT") { equity += h.qty; continue; }
    // Direct în USDT dacă pereche există; altfel prin BTC, care are pereche cu
    // aproape orice. Un activ fără nicio cale (tokenuri Earn, active delistate)
    // se evaluează la zero — mai bine lipsă din total decât inventat.
    const direct = prices.get(`${h.asset}USDT`);
    if (direct) { equity += h.qty * direct; continue; }
    const viaBtc = prices.get(`${h.asset}BTC`);
    const btc = prices.get("BTCUSDT");
    if (viaBtc && btc) equity += h.qty * viaBtc * btc;
  }

  return { equity, assets: held.map((h) => h.asset) };
}

/**
 * Ce perechi spot să interogăm.
 *
 * Spot nu are echivalentul lui `/fapi/v1/income`, deci nu există nicio listă de
 * „unde am tranzacționat". Le compunem din trei surse:
 *
 *   1. activele pe care le deții ACUM × monedele de cotare cu care există pereche
 *   2. perechile pe care le-am importat deja (le trimite ruta din baza noastră) —
 *      un simbol descoperit o dată rămâne urmărit pentru totdeauna, chiar dacă
 *      activul a fost vândut integral între timp
 *   3. — nimic altceva, deliberat.
 *
 * LIMITAREA, spusă pe față: un activ cumpărat și vândut integral ÎNAINTE de prima
 * conectare nu apare în niciuna din surse și nu poate fi descoperit. Binance are
 * un endpoint de instantanee zilnice care l-ar prinde (30 de zile în urmă), dar
 * costă 2400 de puncte din 6000 pe minut per IP — iar IP-ul e comun cu fluxul de
 * prețuri live al întregii aplicații. Un ban temporar de la Binance ar lăsa toți
 * utilizatorii fără prețuri, ca să recuperăm o pereche a unuia. Pentru cazul
 * acela: exportul CSV din Binance și importul CSV de aici.
 */
export async function discoverSpotSymbols(
  apiKey: string,
  apiSecret: string,
  knownSymbols: string[] = []
): Promise<string[]> {
  const { assets } = await spotEquityUsdt(apiKey, apiSecret);
  const prices = await loadPrices();
  const exists = (s: string) => prices.has(s);

  const out = new Set<string>();

  // Perechile deja cunoscute merg PRIMELE: sunt dovada că s-a tranzacționat acolo,
  // iar coada se procesează în ordine — ce e sigur se importă înainte să expire
  // bugetul de timp al invocării.
  //
  // Nu le filtrăm prin lista de perechi active: o pereche DELISTATĂ nu mai apare
  // în prețuri, dar execuțiile ei rămân în istoric și sunt exact ce ar pierde
  // utilizatorul. Filtrul e doar de formă, ca să nu ajungă aici simboluri venite
  // din importuri CSV („EUR/USD", „XAUUSD") care pe Binance nu există.
  for (const s of knownSymbols) {
    if (/^[A-Z0-9]{4,20}$/.test(s) && QUOTE_ASSETS.some((q) => s.endsWith(q) && s.length > q.length)) {
      out.add(s);
    }
  }

  for (const asset of assets) {
    // Un activ care e el însuși monedă de cotare (USDT, BTC) nu spune nimic despre
    // ce s-a tranzacționat — soldul lui e rezultatul, nu cauza.
    if (QUOTE_ASSETS.includes(asset)) continue;
    for (const quote of QUOTE_ASSETS) {
      if (exists(`${asset}${quote}`)) out.add(`${asset}${quote}`);
    }
  }

  return [...out];
}

/**
 * Toate execuțiile spot ale unei perechi, împerecheate FIFO în tranzacții închise.
 *
 * Regula de împerechere e cea a pieței spot, nu a celei de futures: pe spot nu
 * poți vinde ce nu ai, deci o tranzacție e întotdeauna CUMPĂRARE apoi VÂNZARE.
 * O vânzare fără cumpărare în urma ei înseamnă activ intrat altfel (depunere,
 * airdrop, staking) — costul lui de achiziție nu există în datele bursei, iar o
 * tranzacție cu preț de intrare inventat e mai rea decât una lipsă. Cantitatea
 * aceea se ignoră, tăcut și intenționat.
 *
 * Filtrarea pe `sinceMs` se aplică pe REZULTAT, nu pe execuții: o cumpărare de
 * anul trecut închisă luna asta e o tranzacție de luna asta. Tăiată la intrare,
 * vânzarea ar rămăsese orfană și tranzacția s-ar fi pierdut cu totul.
 */
export async function spotTradesForSymbol(
  apiKey: string,
  apiSecret: string,
  symbol: string,
  sinceMs: number
): Promise<ExchangeTrade[]> {
  const fills: SpotFill[] = [];
  let fromId = 0;

  for (let page = 0; page < 100; page++) {
    let rows: SpotFill[];
    try {
      rows = await priv<SpotFill[]>(apiKey, apiSecret, "/api/v3/myTrades", {
        symbol,
        fromId,
        limit: 1000,
      });
    } catch (err) {
      // -1121 „Invalid symbol": pereche care nu există (sau nu mai există) pe spot.
      // Coada de simboluri e compusă din candidați și din perechi cunoscute care
      // pot fi delistate — un candidat greșit nu are voie să oprească importul
      // celorlalte. Orice ALTĂ eroare (chei, semnătură, limită de cereri) se
      // propagă, fiindcă acolo reluarea trebuie să eșueze zgomotos.
      if (err instanceof Error && /-1121|Invalid symbol/i.test(err.message)) return [];
      throw err;
    }
    fills.push(...rows);
    if (rows.length < 1000) break;
    const lastId = rows[rows.length - 1]?.id;
    if (lastId === undefined) break;
    fromId = lastId + 1;
  }
  if (fills.length === 0) return [];

  const pair = await pairOf(symbol);
  const base = pair?.base ?? "";
  const quote = pair?.quote ?? "";

  // ── Comisionul, adus în moneda de cotare ──
  // Plătit în moneda de cotare → e deja bun. În activul cumpărat → înmulțit cu
  // prețul execuției. În orice altceva (de regulă BNB) → avem nevoie de un curs.
  const foreign = new Set<string>();
  for (const f of fills) {
    const a = f.commissionAsset;
    if (a && a !== base && a !== quote && Number(f.commission ?? 0) > 0) foreign.add(a);
  }
  //
  // Cursul folosit e cel de ACUM, nu cel de la data execuției. E o aproximare
  // asumată: comisionul e ~0,075% din valoare, deci eroarea de curs pe el e sub
  // zgomotul de rotunjire al P&L-ului. Alternativa — o cerere de preț istoric per
  // execuție — ar înmulți cererile cu zeci pentru a corecta a treia zecimală.
  let fx = new Map<string, number>();
  if (foreign.size > 0 && quote) {
    try {
      fx = await loadPrices();
    } catch {
      // Fără cursuri, comisionul în BNB rămâne necontabilizat pe execuțiile alea.
      // Restul tranzacției (prețuri, cantități, P&L) e neatins.
    }
  }

  const commissionInQuote = (f: SpotFill): number => {
    const c = Number(f.commission ?? 0);
    if (!(c > 0)) return 0;
    const a = f.commissionAsset;
    if (!a || a === quote) return c;
    if (a === base) return c * Number(f.price ?? 0);
    return c * (fx.get(`${a}${quote}`) ?? 0);
  };

  const sorted = [...fills].sort((a, b) => (a.time ?? 0) - (b.time ?? 0));

  // `qty0` = cantitatea iniţială a lotului. Fără ea, comisionul de intrare s-ar
  // repartiza pe cantitatea RĂMASĂ a lotului, iar un lot consumat de mai multe
  // vânzări ar încasa comisionul de intrare de mai multe ori.
  const book: {
    qty: number; qty0: number; price: number; time: Date; comm: number; id: string;
  }[] = [];
  const out: ExchangeTrade[] = [];

  for (const f of sorted) {
    const qty = Number(f.qty ?? 0);
    const price = Number(f.price ?? 0);
    const time = new Date(Number(f.time ?? 0));
    if (!(qty > 0) || !(price > 0) || Number.isNaN(time.getTime())) continue;
    const comm = commissionInQuote(f);
    const id = String(f.id ?? f.orderId ?? time.getTime());

    if (f.isBuyer) {
      book.push({ qty, qty0: qty, price, time, comm, id });
      continue;
    }

    let remaining = qty;
    while (remaining > 1e-12 && book.length > 0) {
      const lot = book[0];
      const matched = Math.min(remaining, lot.qty);
      const commEntry = lot.qty0 > 0 ? (lot.comm * matched) / lot.qty0 : 0;
      const commExit = (comm * matched) / qty;

      out.push({
        // Prefix `bncs_` (spot), distinct de `bnc_` (futures): aceeași pereche
        // poate fi tranzacționată pe ambele piețe, cu ID-uri de execuție care se
        // pot suprapune. Fără prefix, dedublarea ar șterge tranzacții reale.
        brokerTradeId: `bncs_${symbol}_${lot.id}_${id}`,
        symbol,
        // Pe spot nu există poziție scurtă. Întotdeauna cumpărare → vânzare.
        direction: "BUY",
        entryTime: lot.time,
        exitTime: time,
        entryPrice: lot.price,
        exitPrice: price,
        lotSize: matched,
        // Brut, ca la futures: comisionul stă în câmpul lui, aplicația le
        // combină unde trebuie. Adunat aici, s-ar scădea de două ori.
        pnlMoney: (price - lot.price) * matched,
        commission: commEntry + commExit,
      });

      lot.qty -= matched;
      remaining -= matched;
      if (lot.qty <= 1e-12) book.shift();
    }
    // `remaining` rămas = vândut fără cumpărare cunoscută. Se ignoră (vezi mai sus).
  }

  return out.filter((t) => t.exitTime.getTime() >= sinceMs);
}
