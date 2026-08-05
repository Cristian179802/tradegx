import crypto from "node:crypto";

// ── Bybit V5 REST (read-only) ────────────────────────────────────────────────
//
// Schema de semnare, verificată în documentația oficială:
//   antete: X-BAPI-API-KEY, X-BAPI-TIMESTAMP, X-BAPI-SIGN, X-BAPI-RECV-WINDOW
//   pentru GET se semnează:  timestamp + apiKey + recvWindow + queryString
//   HMAC-SHA256, rezultat hex minuscul
//
// CONSTRÂNGEREA CARE STRICĂ IMPLEMENTĂRILE NAIVE:
// `/v5/position/closed-pnl` acceptă maximum 7 ZILE între startTime și endTime.
// O singură cerere pentru „tot istoricul" nu întoarce eroare — întoarce puțin
// sau nimic. De aceea cerem în ferestre de 7 zile, cu paginare prin cursor.
//
// Bybit e cel mai bun caz pentru un jurnal: closed-pnl dă direct poziția
// închisă, cu preț mediu de intrare ȘI de ieșire, plus P&L realizat. Nu e nevoie
// de împerechere FIFO ca la brokerii care dau doar execuții.

const BASE = "https://api.bybit.com";
const RECV_WINDOW = "5000";
const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function sign(secret: string, timestamp: string, apiKey: string, queryString: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(timestamp + apiKey + RECV_WINDOW + queryString)
    .digest("hex");
}

async function get(
  apiKey: string,
  apiSecret: string,
  path: string,
  params: Record<string, string | number>
): Promise<Record<string, unknown>> {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString();
  const ts = Date.now().toString();

  const res = await fetch(`${BASE}${path}?${qs}`, {
    headers: {
      "X-BAPI-API-KEY": apiKey,
      "X-BAPI-TIMESTAMP": ts,
      "X-BAPI-SIGN": sign(apiSecret, ts, apiKey, qs),
      "X-BAPI-RECV-WINDOW": RECV_WINDOW,
    },
    cache: "no-store",
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  // Bybit întoarce 200 HTTP și semnalează erorile prin retCode ≠ 0.
  const retCode = Number(json.retCode ?? -1);
  if (!res.ok || retCode !== 0) {
    throw new Error(`Bybit ${retCode}: ${String(json.retMsg ?? res.statusText)}`);
  }
  return (json.result ?? {}) as Record<string, unknown>;
}

/** Validează cheile fără să modifice nimic — citește doar soldul. */
export async function validateKeys(apiKey: string, apiSecret: string): Promise<{ equity: number; currency: string }> {
  const result = await get(apiKey, apiSecret, "/v5/account/wallet-balance", {
    accountType: "UNIFIED",
  });
  const list = (result.list as Record<string, unknown>[] | undefined) ?? [];
  const acc = list[0] ?? {};
  return {
    equity: Number(acc.totalEquity ?? 0) || 0,
    currency: "USDT",
  };
}

export interface ExchangeTrade {
  brokerTradeId: string;
  symbol: string;
  direction: "BUY" | "SELL";
  entryTime: Date;
  exitTime: Date;
  entryPrice: number;
  exitPrice: number;
  lotSize: number;
  pnlMoney: number;
  commission: number;
}

// Adâncimea maximă documentată: titlul oficial al endpoint-ului e
// „Get Closed PnL (2 years)". Cerem tot ce ține bursa, nu o felie arbitrară.
export const BYBIT_MAX_HISTORY_MS = 2 * 365 * 86_400_000;
export { WINDOW_MS as BYBIT_WINDOW_MS };

// O SINGURĂ fereastră (≤7 zile, regula API-ului), cu paginare prin cursor.
// Bucla peste ferestre stă în ruta de sync, ca importul să poată fi RELUAT:
// 2 ani = ~104 ferestre, prea mult pentru o singură invocare serverless —
// serverul procesează cât încape în buget și clientul continuă de unde a rămas.
export async function getClosedTradesWindow(
  apiKey: string,
  apiSecret: string,
  startMs: number,
  endMs: number
): Promise<ExchangeTrade[]> {
  const out: ExchangeTrade[] = [];
  {
    const start = startMs;
    const end = Math.min(endMs, startMs + WINDOW_MS);
    let cursor = "";

    // Paginare în interiorul ferestrei.
    for (let page = 0; page < 50; page++) {
      const params: Record<string, string | number> = {
        category: "linear",
        startTime: start,
        endTime: end,
        limit: 100,
      };
      if (cursor) params.cursor = cursor;

      const result = await get(apiKey, apiSecret, "/v5/position/closed-pnl", params);
      const rows = (result.list as Record<string, unknown>[] | undefined) ?? [];

      for (const r of rows) {
        const entryPrice = Number(r.avgEntryPrice ?? 0);
        const exitPrice = Number(r.avgExitPrice ?? 0);
        const pnl = Number(r.closedPnl ?? 0);
        const qty = Number(r.closedSize ?? r.qty ?? 0);
        const createdMs = Number(r.createdTime ?? 0);
        const updatedMs = Number(r.updatedTime ?? createdMs);
        if (!(qty > 0) || !createdMs) continue;

        // Direcția poziției NU se ia din `side`: acolo apare sensul ordinului
        // care a ÎNCHIS poziția, deci e inversul direcției reale — o capcană
        // clasică. O deducem din semnul P&L raportat de bursă față de mișcarea
        // prețului, ceea ce e neambiguu:
        //   profit + ieșire peste intrare  → poziție long
        //   profit + ieșire sub intrare    → poziție short
        let direction: "BUY" | "SELL";
        if (Math.abs(pnl) > 1e-9 && Math.abs(exitPrice - entryPrice) > 1e-12) {
          const exitHigher = exitPrice > entryPrice;
          direction = pnl > 0 ? (exitHigher ? "BUY" : "SELL") : (exitHigher ? "SELL" : "BUY");
        } else {
          // P&L ~0 (rar): cădem pe `side`, inversat.
          direction = String(r.side ?? "").toLowerCase() === "sell" ? "BUY" : "SELL";
        }

        out.push({
          brokerTradeId: `bybit_${String(r.orderId ?? `${r.symbol}_${createdMs}`)}`,
          symbol: String(r.symbol ?? "").toUpperCase(),
          direction,
          entryTime: new Date(createdMs),
          exitTime: new Date(updatedMs),
          entryPrice,
          exitPrice,
          lotSize: qty,
          pnlMoney: pnl,
          commission: (Number(r.openFee ?? 0) || 0) + (Number(r.closeFee ?? 0) || 0),
        });
      }

      cursor = String(result.nextPageCursor ?? "");
      if (!cursor || rows.length === 0) break;
    }
  }

  return out;
}
