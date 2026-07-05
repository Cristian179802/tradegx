"use client";

import * as React from "react";

// ── Prețuri realtime crypto prin WebSocket Binance ─────────────────────────
// Un singur socket pentru toate simbolurile crypto din listă (miniTicker),
// reconectare automată cu backoff, curățare la unmount. Simbolurile non-crypto
// sunt ignorate (nu au stream Binance).

export interface LivePrice {
  price: number;
  /** variația % pe 24h */
  changePct: number;
  /** direcția ultimului tick: 1 = sus, -1 = jos, 0 = neschimbat */
  tick: 1 | -1 | 0;
}

// Simbolurile crypto suportate → stream-ul Binance corespunzător
const BINANCE_MAP: Record<string, string> = {
  BTCUSD: "btcusdt",
  ETHUSD: "ethusdt",
  BNBUSD: "bnbusdt",
  SOLUSD: "solusdt",
  XRPUSD: "xrpusdt",
};

export function useBinanceLive(symbols: string[]): Map<string, LivePrice> {
  const [prices, setPrices] = React.useState<Map<string, LivePrice>>(new Map());
  const wsRef = React.useRef<WebSocket | null>(null);
  const retryRef = React.useRef(0);
  const lastRef = React.useRef<Map<string, number>>(new Map());

  // Cheie stabilă pentru dependență (evită reconectări la fiecare render)
  const streamsKey = symbols
    .map((s) => BINANCE_MAP[s.toUpperCase()])
    .filter(Boolean)
    .sort()
    .join("/");

  React.useEffect(() => {
    if (!streamsKey) return;

    let closed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (closed) return;
      const streams = streamsKey
        .split("/")
        .map((s) => `${s}@miniTicker`)
        .join("/");
      const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
      wsRef.current = ws;

      ws.onopen = () => {
        retryRef.current = 0;
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string);
          const d = msg?.data;
          if (!d?.s || !d?.c) return;

          const binanceSymbol = String(d.s).toLowerCase(); // ex: btcusdt
          const ourSymbol = Object.keys(BINANCE_MAP).find(
            (k) => BINANCE_MAP[k] === binanceSymbol
          );
          if (!ourSymbol) return;

          const price = parseFloat(d.c);
          const open = parseFloat(d.o);
          if (!Number.isFinite(price)) return;

          const prev = lastRef.current.get(ourSymbol);
          const tick: 1 | -1 | 0 =
            prev == null || price === prev ? 0 : price > prev ? 1 : -1;
          lastRef.current.set(ourSymbol, price);

          setPrices((old) => {
            const next = new Map(old);
            next.set(ourSymbol, {
              price,
              changePct: Number.isFinite(open) && open > 0 ? ((price - open) / open) * 100 : 0,
              tick,
            });
            return next;
          });
        } catch {
          /* mesaj invalid — ignoră */
        }
      };

      ws.onclose = () => {
        if (closed) return;
        // Reconectare cu backoff: 1s, 2s, 4s... max 30s
        const delay = Math.min(30_000, 1000 * 2 ** retryRef.current);
        retryRef.current++;
        reconnectTimer = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [streamsKey]);

  return prices;
}
