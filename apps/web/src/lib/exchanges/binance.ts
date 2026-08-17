import crypto from "node:crypto";
import type { ExchangeTrade } from "./bybit";

// ── Binance USDⓈ-M Futures REST (read-only) ──────────────────────────────────
//
// Semnare verificată în documentația oficială: antetul `X-MBX-APIKEY` duce
// cheia, iar `signature` din query e HMAC-SHA256 peste ÎNTREGUL query string.
//
// LIMITELE REALE, citate din documentație — cerem maximul, dar maximul e al lor:
//   · `/fapi/v1/userTrades`: „Only support querying trade in the past 6 months"
//     → ADÂNCIMEA MAXIMĂ ABSOLUTĂ prin API e 6 luni. Mai vechi există doar în
//     exportul CSV din interfața Binance (importul nostru CSV îl acceptă).
//   · `/fapi/v1/income`: păstrează doar ultimele 3 LUNI.
//   · `/fapi/v1/userTrades` cere OBLIGATORIU `symbol` — nu există „toate
//     execuțiile"; fără discovery nu știi ce să ceri.
//   · `fromId` NU se combină cu startTime/endTime — sunt moduri exclusive.
//
// STRATEGIA DE ADÂNCIME MAXIMĂ:
//   discovery = simbolurile din income (3 luni) ∪ pozițiile deschise acum.
//   Pentru fiecare simbol: MERS PE fromId de la 0 — întoarce tot ce ține bursa
//   (6 luni), în pagini de 1000, de obicei 1-3 cereri per simbol. E singura
//   cale către toate cele 6 luni: modul cu startTime/endTime e limitat la
//   ferestre de 7 zile (26 de cereri per simbol pentru același rezultat).
//
// LIMITARE ONESTĂ, nerezolvabilă prin API: un simbol tranzacționat ultima dată
// acum 3-6 luni nu apare nici în income (3 luni), nici în pozițiile curente —
// deci nu poate fi DESCOPERIT automat, deși execuțiile lui ar fi accesibile.
// Pentru acela: exportul CSV din Binance + importul nostru CSV.

const FAPI = "https://fapi.binance.com";
export const BINANCE_MAX_HISTORY_MS = 180 * 86_400_000; // 6 luni — plafonul userTrades
const INCOME_MAX_MS = 90 * 86_400_000;                  // 3 luni — plafonul income
const WEEK_MS = 7 * 86_400_000;

function signed(secret: string, params: Record<string, string | number>): string {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString();
  const signature = crypto.createHmac("sha256", secret).update(qs).digest("hex");
  return `${qs}&signature=${signature}`;
}

async function get<T>(
  apiKey: string,
  apiSecret: string,
  path: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const qs = signed(apiSecret, { ...params, timestamp: Date.now(), recvWindow: 60000 });
  const res = await fetch(`${FAPI}${path}?${qs}`, {
    headers: { "X-MBX-APIKEY": apiKey },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Binance ${res.status}: ${body.slice(0, 180)}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Validează cheile citind doar soldurile — spot ȘI futures, însumate.
 *
 * Aici cădea conectarea pentru cine tranzacționează doar spot: verificam
 * exclusiv `/fapi/v2/account`, iar o cheie fără permisiunea de futures primește
 * eroare de la Binance. Cheia era bună, contul era bun, dar conectarea eșua.
 *
 * Acum e destul ca UNA din cele două piețe să răspundă. Amândouă mute înseamnă
 * că problema e chiar la chei, și atunci eroarea se propagă — cea de la spot,
 * fiindcă e piața pe care o are toată lumea.
 */
export async function validateKeys(
  apiKey: string,
  apiSecret: string
): Promise<{ equity: number; currency: string; markets: string[] }> {
  const { totalEquityUsdt, spotEquityUsdt } = await import("./binance-spot");

  // Întâi totalul pe toate portofelele — e singurul care se potrivește cu cifra
  // pe care o vezi în aplicația Binance. Adunarea spot + futures rata tot ce e în
  // Earn, Funding sau Alpha.
  try {
    const { equity, wallets } = await totalEquityUsdt(apiKey, apiSecret);
    return { equity, currency: "USDT", markets: wallets };
  } catch {
    // Cheia nu are permisiunea de citire a portofelelor. Cădem pe ce se poate
    // citi, ca să nu blocăm conectarea — soldul va fi parțial, dar cheia e bună.
  }

  const [spot, futures] = await Promise.allSettled([
    spotEquityUsdt(apiKey, apiSecret),
    get<Record<string, unknown>>(apiKey, apiSecret, "/fapi/v2/account"),
  ]);

  const markets: string[] = [];
  let equity = 0;

  if (spot.status === "fulfilled") {
    markets.push("Spot");
    equity += spot.value.equity;
  }
  if (futures.status === "fulfilled") {
    markets.push("Futures");
    equity += Number(futures.value.totalWalletBalance ?? 0) || 0;
  }

  if (markets.length === 0) {
    throw spot.status === "rejected" ? spot.reason : new Error("Binance: cont inaccesibil");
  }

  return { equity, currency: "USDT", markets };
}

/**
 * S-a întâmplat ceva în cont de la ultima verificare?
 *
 * Amprentă peste cantitățile din spot și starea portofelului de futures. ~25 de
 * puncte de cerere, față de ~485 pentru un import complet — diferența dintre o
 * sincronizare la 5 minute care se poate susține și una care ne aduce un ban de la
 * Binance pe IP-ul comun cu prețurile live.
 *
 * Ambele piețe sunt opționale: o cheie fără permisiune pe una din ele dă o
 * amprentă parțială, dar tot stabilă — exact ce ne trebuie de la o amprentă.
 */
export async function activityFingerprint(
  apiKey: string,
  apiSecret: string
): Promise<string> {
  const { spotBalanceFingerprint } = await import("./binance-spot");

  const [spot, futures] = await Promise.allSettled([
    spotBalanceFingerprint(apiKey, apiSecret),
    get<{ totalWalletBalance?: string; positions?: AccountPosition[] }>(
      apiKey, apiSecret, "/fapi/v2/account"
    ),
  ]);

  const parts: string[] = [];
  if (spot.status === "fulfilled") parts.push(`S=${spot.value}`);
  if (futures.status === "fulfilled") {
    const open = (futures.value.positions ?? [])
      .filter((p) => Math.abs(Number(p.positionAmt ?? 0)) > 0)
      .map((p) => `${p.symbol}:${p.positionAmt}:${p.entryPrice}`)
      .sort()
      .join(",");
    parts.push(`F=${futures.value.totalWalletBalance ?? ""}#${open}`);
  }
  if (parts.length === 0) throw new Error("Binance: cont inaccesibil");

  return crypto.createHash("sha256").update(parts.join("||")).digest("hex").slice(0, 32);
}

interface IncomeRow { symbol?: string; time?: number }
interface UserTrade {
  id?: number; orderId?: number; symbol?: string; side?: string;
  price?: string; qty?: string; realizedPnl?: string; commission?: string; time?: number;
}
interface AccountPosition { symbol?: string; entryPrice?: string; positionAmt?: string }

/**
 * Ce simboluri au fost tranzacționate: income (max 3 luni — plafonul lui) plus
 * pozițiile deschise acum (prind simboluri active fără P&L realizat recent).
 */
export async function discoverSymbols(apiKey: string, apiSecret: string): Promise<string[]> {
  const symbols = new Set<string>();
  const now = Date.now();

  for (let start = now - INCOME_MAX_MS; start < now; start += WEEK_MS) {
    const rows = await get<IncomeRow[]>(apiKey, apiSecret, "/fapi/v1/income", {
      incomeType: "REALIZED_PNL",
      startTime: start,
      endTime: Math.min(start + WEEK_MS, now),
      limit: 1000,
    });
    for (const r of rows) if (r.symbol) symbols.add(r.symbol);
  }

  // Pozițiile deschise: simboluri în lucru chiar acum.
  const acc = await get<{ positions?: AccountPosition[] }>(apiKey, apiSecret, "/fapi/v2/account");
  for (const p of acc.positions ?? []) {
    if (p.symbol && Math.abs(Number(p.positionAmt ?? 0)) > 0) symbols.add(p.symbol);
  }

  return [...symbols];
}

/**
 * Toate execuțiile disponibile pentru un simbol (mers pe fromId, de la cea mai
 * veche păstrată de bursă), împerecheate FIFO în tranzacții închise.
 *
 * Un simbol se procesează ATOMIC (toate execuțiile lui într-o singură trecere):
 * împerecherea FIFO ruptă în bucăți ar produce perechi greșite. De aceea
 * cursorul de reluare al sync-ului e LA NIVEL DE SIMBOL, nu de timp.
 */
export async function tradesForSymbol(
  apiKey: string,
  apiSecret: string,
  symbol: string,
  sinceMs: number
): Promise<ExchangeTrade[]> {
  const fills: UserTrade[] = [];
  let fromId = 0;

  for (let page = 0; page < 100; page++) {
    const rows = await get<UserTrade[]>(apiKey, apiSecret, "/fapi/v1/userTrades", {
      symbol,
      fromId,
      limit: 1000,
    });
    fills.push(...rows);
    if (rows.length < 1000) break;
    const lastId = rows[rows.length - 1]?.id;
    if (lastId === undefined) break;
    fromId = lastId + 1;
  }

  const sorted = fills
    .filter((f) => Number(f.time ?? 0) >= sinceMs)
    .sort((a, b) => (a.time ?? 0) - (b.time ?? 0));

  const book: { side: "BUY" | "SELL"; qty: number; price: number; time: Date; comm: number; id: string }[] = [];
  const out: ExchangeTrade[] = [];

  for (const f of sorted) {
    const side = String(f.side ?? "").toUpperCase() === "BUY" ? "BUY" : "SELL";
    const qty = Number(f.qty ?? 0);
    const price = Number(f.price ?? 0);
    const time = new Date(Number(f.time ?? 0));
    const comm = Number(f.commission ?? 0) || 0;
    const realized = Number(f.realizedPnl ?? 0) || 0;
    if (!(qty > 0) || Number.isNaN(time.getTime())) continue;

    let remaining = qty;
    while (remaining > 0 && book.length > 0 && book[0].side !== side) {
      const lot = book[0];
      const matched = Math.min(remaining, lot.qty);
      const commEntry = lot.qty > 0 ? (lot.comm * matched) / lot.qty : 0;
      const commExit = qty > 0 ? (comm * matched) / qty : 0;
      // P&L raportat de bursă pe execuția de închidere, repartizat proporțional
      // pe porțiunea împerecheată — nu îl estimăm noi (funding + taxe l-ar strica).
      const pnl = qty > 0 ? (realized * matched) / qty : realized;

      out.push({
        brokerTradeId: `bnc_${symbol}_${lot.id}_${f.id ?? f.orderId ?? time.getTime()}`,
        symbol,
        direction: lot.side,
        entryTime: lot.time,
        exitTime: time,
        entryPrice: lot.price,
        exitPrice: price,
        lotSize: matched,
        pnlMoney: pnl,
        commission: commEntry + commExit,
      });

      lot.qty -= matched;
      remaining -= matched;
      if (lot.qty <= 1e-12) book.shift();
    }

    if (remaining > 1e-12) {
      book.push({
        side, qty: remaining, price, time, comm,
        id: String(f.id ?? f.orderId ?? time.getTime()),
      });
    }
  }

  return out;
}
