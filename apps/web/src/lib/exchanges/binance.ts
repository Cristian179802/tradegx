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

/** Validează cheile citind doar soldul contului de futures. */
export async function validateKeys(
  apiKey: string,
  apiSecret: string
): Promise<{ equity: number; currency: string }> {
  const acc = await get<Record<string, unknown>>(apiKey, apiSecret, "/fapi/v2/account");
  return {
    equity: Number(acc.totalWalletBalance ?? 0) || 0,
    currency: "USDT",
  };
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
