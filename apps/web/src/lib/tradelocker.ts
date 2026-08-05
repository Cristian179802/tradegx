// ── TradeLocker REST API ─────────────────────────────────────────────────────
//
// Endpoint-urile sunt verificate în documentația oficială (public-api.tradelocker.com),
// nu ghicite:
//   POST {base}/auth/jwt/token          { email, password, server } → accessToken
//   GET  {base}/auth/jwt/all-accounts   Bearer → conturi (aici se află `accNum`)
//   GET  {base}/trade/config            → numele coloanelor pentru ordersHistory
//   GET  {base}/trade/accounts/{id}/ordersHistory   Bearer + header accNum
//
// PARTICULARITATEA CARE STRICĂ ORICE IMPLEMENTARE GHICITĂ:
// `ordersHistory` NU întoarce obiecte. Întoarce rânduri de valori, iar ordinea
// coloanelor e definită separat în `/trade/config` → `ordersHistoryConfig`.
// Deci trebuie citit config-ul ÎNTÂI și construită maparea index → nume. Dacă
// presupui o ordine fixă, primești date corecte azi și complet aiurea mâine,
// când brokerul schimbă configurația.
//
// Parsarea e defensivă: API-ul împachetează unele răspunsuri în `{ s, d }`, iar
// forma variază între versiuni. `unwrap()` acceptă ambele variante.

export type TradeLockerEnv = "live" | "demo";

export function baseUrl(env: TradeLockerEnv): string {
  return env === "live"
    ? "https://live.tradelocker.com/backend-api"
    : "https://demo.tradelocker.com/backend-api";
}

/** Scoate învelișul `{ s: "ok", d: … }` dacă există. */
function unwrap<T = unknown>(json: unknown): T {
  if (json && typeof json === "object" && "d" in (json as Record<string, unknown>)) {
    return (json as Record<string, unknown>).d as T;
  }
  return json as T;
}

async function req(
  env: TradeLockerEnv,
  path: string,
  init: RequestInit & { accNum?: number | string } = {}
): Promise<unknown> {
  const { accNum, ...rest } = init;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(rest.headers as Record<string, string> | undefined),
  };
  if (accNum !== undefined) headers["accNum"] = String(accNum);

  const res = await fetch(`${baseUrl(env)}${path}`, {
    ...rest,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`TradeLocker ${res.status} ${path}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

// ─── Autentificare ───────────────────────────────────────────────────────────

export interface TlAuth { accessToken: string; refreshToken?: string }

export async function authenticate(
  env: TradeLockerEnv,
  email: string,
  password: string,
  server: string
): Promise<TlAuth> {
  const raw = await req(env, "/auth/jwt/token", {
    method: "POST",
    body: JSON.stringify({ email, password, server }),
  });
  const d = unwrap<Record<string, unknown>>(raw);
  const accessToken = (d?.accessToken ?? (raw as Record<string, unknown>)?.accessToken) as string | undefined;
  if (!accessToken) throw new Error("TradeLocker: răspuns fără accessToken");
  return {
    accessToken,
    refreshToken: (d?.refreshToken ?? undefined) as string | undefined,
  };
}

// ─── Conturi ─────────────────────────────────────────────────────────────────

export interface TlAccount {
  id: string;
  accNum: number;
  name?: string;
  currency?: string;
  accountBalance?: number;
  status?: string;
}

export async function listAccounts(env: TradeLockerEnv, token: string): Promise<TlAccount[]> {
  const raw = await req(env, "/auth/jwt/all-accounts", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const d = unwrap<Record<string, unknown>>(raw);
  const arr = (Array.isArray(d) ? d : (d?.accounts as unknown[])) ?? [];
  return (arr as Record<string, unknown>[]).map((a) => ({
    id: String(a.id ?? a.accountId ?? ""),
    accNum: Number(a.accNum ?? a.accountNumber ?? 0),
    name: (a.name ?? a.accountName) as string | undefined,
    currency: (a.currency ?? a.accountCurrency) as string | undefined,
    accountBalance: a.accountBalance !== undefined ? Number(a.accountBalance) : undefined,
    status: a.status as string | undefined,
  })).filter((a) => a.id && Number.isFinite(a.accNum));
}

// ─── Config: maparea index → nume de coloană ──────────────────────────────────

export async function ordersHistoryColumns(
  env: TradeLockerEnv,
  token: string,
  accNum: number
): Promise<string[]> {
  const raw = await req(env, "/trade/config", {
    headers: { Authorization: `Bearer ${token}` },
    accNum,
  });
  const d = unwrap<Record<string, unknown>>(raw);
  const cfg = (d?.ordersHistoryConfig ?? {}) as Record<string, unknown>;
  const cols = (cfg.columns ?? cfg) as unknown;
  if (!Array.isArray(cols)) return [];
  // Coloanele pot veni ca string-uri simple sau ca obiecte { id }.
  return cols.map((c) =>
    typeof c === "string" ? c : String((c as Record<string, unknown>)?.id ?? "")
  );
}

// ─── Istoric ordine → fill-uri ───────────────────────────────────────────────

export interface TlFill {
  orderId: string;
  symbol: string;
  side: "BUY" | "SELL";
  qty: number;
  price: number;
  time: Date;
  commission: number;
}

/** Transformă rândurile brute în obiecte, folosind maparea din config. */
export function rowsToFills(rows: unknown[], columns: string[]): TlFill[] {
  const idx = (names: string[]) => {
    for (const n of names) {
      const i = columns.findIndex((c) => c.toLowerCase() === n.toLowerCase());
      if (i >= 0) return i;
    }
    for (const n of names) {
      const i = columns.findIndex((c) => c.toLowerCase().includes(n.toLowerCase()));
      if (i >= 0) return i;
    }
    return -1;
  };

  const iId = idx(["id", "orderId"]);
  const iSym = idx(["tradableInstrumentId", "symbol", "instrument"]);
  const iSide = idx(["side"]);
  const iQty = idx(["filledQty", "quantity", "qty", "lots"]);
  const iPrice = idx(["avgPrice", "filledPrice", "price"]);
  const iTime = idx(["lastModified", "createdDate", "filledTime", "date"]);
  const iStatus = idx(["status"]);
  const iComm = idx(["commission", "fee"]);

  const out: TlFill[] = [];
  for (const r of rows) {
    if (!Array.isArray(r)) continue;
    const get = (i: number) => (i >= 0 ? r[i] : undefined);

    // Doar ordinele executate devin tranzacții.
    const status = String(get(iStatus) ?? "").toLowerCase();
    if (status && !status.includes("fill")) continue;

    const sideRaw = String(get(iSide) ?? "").toLowerCase();
    const side = sideRaw.includes("buy") ? "BUY" : sideRaw.includes("sell") ? "SELL" : null;
    const qty = Number(get(iQty) ?? 0);
    const price = Number(get(iPrice) ?? 0);
    const tRaw = get(iTime);
    const time = tRaw !== undefined ? new Date(Number(tRaw) || String(tRaw)) : null;

    if (!side || !(qty > 0) || !time || Number.isNaN(time.getTime())) continue;

    out.push({
      orderId: String(get(iId) ?? `${out.length}`),
      symbol: String(get(iSym) ?? "").toUpperCase(),
      side,
      qty,
      price,
      time,
      commission: Number(get(iComm) ?? 0) || 0,
    });
  }
  return out;
}

// Adâncimea primei sincronizări: TradeLocker nu documentează o limită de
// retenție, dar platforma există din ~2022 — 3 ani acoperă practic orice cont.
export const TRADELOCKER_MAX_HISTORY_MS = 3 * 365 * 86_400_000;
// Fereastra per cerere: documentația menționează un plafon de RÂNDURI per
// răspuns (fără cursor de paginare!) — o cerere „tot istoricul" ar fi trunchiată
// SILENȚIOS. 14 zile țin și un scalper activ sub plafon.
export const TRADELOCKER_WINDOW_MS = 14 * 86_400_000;

// O singură fereastră. `columns` vine din exterior ca /trade/config să fie
// citit O DATĂ per sincronizare, nu la fiecare din zecile de ferestre.
export async function getOrdersHistoryWindow(
  env: TradeLockerEnv,
  token: string,
  accountId: string,
  accNum: number,
  columns: string[],
  fromMs: number,
  toMs: number
): Promise<TlFill[]> {
  const raw = await req(env, `/trade/accounts/${accountId}/ordersHistory?from=${fromMs}&to=${toMs}`, {
    headers: { Authorization: `Bearer ${token}` },
    accNum,
  });
  const d = unwrap<Record<string, unknown>>(raw);
  const rows = (Array.isArray(d) ? d : (d?.ordersHistory as unknown[])) ?? [];
  return rowsToFills(rows as unknown[], columns);
}

// ─── Împerechere FIFO în tranzacții round-trip ────────────────────────────────
//
// Același principiu ca la importul CSV de blotter (vezi lib/parsers): un fill
// închide loturile deschise de sens opus, în ordinea în care au fost deschise.
// TradeLocker dă ordine individuale, nu poziții închise, deci împerecherea e
// obligatorie ca să obținem tranzacții cu intrare ȘI ieșire.

export interface TlTrade {
  brokerTradeId: string;
  symbol: string;
  direction: "BUY" | "SELL";
  entryTime: Date;
  exitTime: Date;
  entryPrice: number;
  exitPrice: number;
  lotSize: number;
  commission: number;
}

export function pairFills(fills: TlFill[]): { trades: TlTrade[]; openLots: number } {
  const sorted = [...fills].sort((a, b) => a.time.getTime() - b.time.getTime());
  const books = new Map<string, { side: "BUY" | "SELL"; qty: number; price: number; time: Date; comm: number; id: string }[]>();
  const trades: TlTrade[] = [];

  for (const f of sorted) {
    const book = books.get(f.symbol) ?? [];
    let remaining = f.qty;

    while (remaining > 0 && book.length > 0 && book[0].side !== f.side) {
      const lot = book[0];
      const matched = Math.min(remaining, lot.qty);
      const commEntry = lot.qty > 0 ? (lot.comm * matched) / lot.qty : 0;
      const commExit = f.qty > 0 ? (f.commission * matched) / f.qty : 0;

      trades.push({
        brokerTradeId: `tl_${f.symbol}_${lot.id}_${f.orderId}`,
        symbol: f.symbol,
        direction: lot.side,           // direcția poziției = sensul deschiderii
        entryTime: lot.time,
        exitTime: f.time,
        entryPrice: lot.price,
        exitPrice: f.price,
        lotSize: matched,
        commission: commEntry + commExit,
      });

      lot.qty -= matched;
      remaining -= matched;
      if (lot.qty <= 1e-9) book.shift();
    }

    if (remaining > 1e-9) {
      book.push({ side: f.side, qty: remaining, price: f.price, time: f.time, comm: f.commission, id: f.orderId });
    }
    books.set(f.symbol, book);
  }

  const openLots = [...books.values()].reduce((n, b) => n + b.length, 0);
  return { trades, openLots };
}
