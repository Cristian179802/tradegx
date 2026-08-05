import crypto from "node:crypto";
import type { ExchangeTrade } from "./bybit";

// ── Binance USDⓈ-M Futures REST (read-only) ──────────────────────────────────
//
// Semnare verificată în documentația oficială: antetul `X-MBX-APIKEY` duce
// cheia, iar `signature` din query e HMAC-SHA256 peste ÎNTREGUL query string.
//
// TREI CONSTRÂNGERI REALE, toate capabile să facă o implementare să pară că
// „nu găsește tranzacții":
//   1. `/fapi/v1/income` păstrează doar ULTIMELE 3 LUNI de istoric.
//   2. Fără startTime/endTime întoarce doar ultimele 7 zile.
//   3. `/fapi/v1/userTrades` cere OBLIGATORIU un `symbol` — nu există „dă-mi
//      toate execuțiile". Nu poți lista istoricul fără să știi ce s-a tranzacționat.
//
// De aici strategia în doi pași, care ocolește elegant constrângerea 3:
//   pasul 1 — `/fapi/v1/income?incomeType=REALIZED_PNL` NU cere symbol, deci ne
//             spune exact CE simboluri au fost tranzacționate și când
//   pasul 2 — pentru fiecare simbol descoperit, `/fapi/v1/userTrades` dă
//             execuțiile cu preț, cantitate și sens, pe care le împerechem FIFO
//             în tranzacții cu intrare ȘI ieșire
//
// Spot are aceeași limitare per-simbol la `/api/v3/myTrades`, fără echivalent
// de tip „income", deci aici acoperim Futures — ce jurnalizează efectiv un
// trader cu levier.

const FAPI = "https://fapi.binance.com";
const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;

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

interface IncomeRow { symbol?: string; incomeType?: string; income?: string; time?: number }
interface UserTrade {
  id?: number; orderId?: number; symbol?: string; side?: string;
  price?: string; qty?: string; realizedPnl?: string; commission?: string; time?: number;
}

/** Pasul 1: ce simboluri au fost tranzacționate (nu cere `symbol`). */
async function discoverSymbols(
  apiKey: string, apiSecret: string, startMs: number
): Promise<string[]> {
  const symbols = new Set<string>();
  const now = Date.now();
  // Ferestre de 7 zile ca să nu depindem de comportamentul implicit al API-ului.
  const WEEK = 7 * 24 * 60 * 60 * 1000;

  for (let start = startMs; start < now; start += WEEK) {
    const rows = await get<IncomeRow[]>(apiKey, apiSecret, "/fapi/v1/income", {
      incomeType: "REALIZED_PNL",
      startTime: start,
      endTime: Math.min(start + WEEK, now),
      limit: 1000,
    });
    for (const r of rows) if (r.symbol) symbols.add(r.symbol);
  }
  return [...symbols];
}

/** Pasul 2: execuțiile pe un simbol, împerecheate FIFO în tranzacții închise. */
async function tradesForSymbol(
  apiKey: string, apiSecret: string, symbol: string, startMs: number
): Promise<ExchangeTrade[]> {
  const fills = await get<UserTrade[]>(apiKey, apiSecret, "/fapi/v1/userTrades", {
    symbol,
    startTime: startMs,
    limit: 1000,
  });

  const sorted = [...fills].sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
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
      // Binance raportează realizedPnl pe execuția care închide — îl repartizăm
      // proporțional pe porțiunea împerecheată, deci nu îl estimăm noi.
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

export async function getClosedTrades(
  apiKey: string,
  apiSecret: string,
  sinceMs: number
): Promise<{ trades: ExchangeTrade[]; symbols: string[]; truncated: boolean }> {
  // Istoricul nu există mai vechi de 3 luni; cerem oricum de la limita reală,
  // ca să nu facem zeci de cereri pentru perioade goale.
  const floor = Date.now() - THREE_MONTHS_MS;
  const truncated = sinceMs < floor;
  const start = Math.max(sinceMs, floor);

  const symbols = await discoverSymbols(apiKey, apiSecret, start);
  const trades: ExchangeTrade[] = [];
  for (const s of symbols) {
    // Secvențial, intenționat: Binance are limite de greutate pe minut, iar
    // cererile paralele pe multe simboluri duc rapid la 418/429.
    trades.push(...(await tradesForSymbol(apiKey, apiSecret, s, start)));
  }
  return { trades, symbols, truncated };
}
