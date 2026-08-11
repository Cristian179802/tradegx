"use client";

// ── Prețul viu în browser ────────────────────────────────────────────────────
//
// Graficul încărca lumânările o dată și rămânea nemișcat. Aici vine partea care
// îl face să respire: ultima lumânare se actualizează în timp real.
//
// Două căi, după instrument:
//   cripto  → WebSocket Binance, tick cu tick, direct din browser. Fără cheie,
//             fără server la mijloc, deci fără nicio întârziere adăugată de noi.
//   restul  → interogăm /api/charts/quote la câteva secunde. Nu e tick, dar e
//             tot ce se poate face cu Yahoo, care oricum nu livrează flux.
//
// Fluxul Binance poate trimite zeci de tick-uri pe secundă. Fără limitare, ar
// declanșa la fel de multe re-randări React și ar încălzi telefonul degeaba —
// de aceea prețul urcă în stare cel mult de 5 ori pe secundă. Ochiul nu vede
// diferența, bateria da.

import * as React from "react";
import { binancePair, priceFreshness } from "@/lib/crypto-pairs";

const THROTTLE_MS = 200;
const POLL_MS = 5_000;

export type Freshness = "live" | "near" | "delayed";

export interface LivePrice {
  price: number | null;
  freshness: Freshness;
  /** true cât timp fluxul e conectat — pentru punctul care pulsează în interfață. */
  streaming: boolean;
}

export function useLivePrice(symbol: string, enabled = true): LivePrice {
  const [price, setPrice] = React.useState<number | null>(null);
  const [streaming, setStreaming] = React.useState(false);
  const freshness = React.useMemo(() => priceFreshness(symbol), [symbol]);

  React.useEffect(() => {
    if (!enabled || !symbol) return;

    setPrice(null);
    setStreaming(false);

    const pair = binancePair(symbol);

    // ── Cripto: flux WebSocket ──
    if (pair) {
      let ws: WebSocket | null = null;
      let closed = false;
      let lastPush = 0;
      let retry: ReturnType<typeof setTimeout> | null = null;
      let attempts = 0;

      const connect = () => {
        if (closed) return;
        ws = new WebSocket(`wss://stream.binance.com:9443/ws/${pair.toLowerCase()}@trade`);

        ws.onopen = () => { attempts = 0; setStreaming(true); };

        ws.onmessage = (ev) => {
          const now = Date.now();
          if (now - lastPush < THROTTLE_MS) return;
          try {
            const p = Number(JSON.parse(ev.data as string)?.p);
            if (Number.isFinite(p) && p > 0) { lastPush = now; setPrice(p); }
          } catch { /* mesaj neparsabil — ignorăm tick-ul, nu rupem fluxul */ }
        };

        ws.onclose = () => {
          setStreaming(false);
          if (closed) return;
          // Reconectare cu pas crescător, plafonat la 30s: rețeaua mobilă cade
          // des, iar un grafic care nu se mai mișcă după un tunel e mai rău
          // decât unul care încearcă din nou.
          attempts += 1;
          const wait = Math.min(1000 * 2 ** (attempts - 1), 30_000);
          retry = setTimeout(connect, wait);
        };

        ws.onerror = () => ws?.close();
      };

      connect();

      return () => {
        closed = true;
        if (retry) clearTimeout(retry);
        ws?.close();
      };
    }

    // ── Restul: interogare periodică ──
    let stopped = false;
    const tick = async () => {
      try {
        const res = await fetch(
          `/api/charts/quote?symbol=${encodeURIComponent(symbol)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;             // 422 = fără preț pentru simbol
        const data = await res.json();
        const p = Number(data?.price);
        if (!stopped && Number.isFinite(p) && p > 0) { setPrice(p); setStreaming(true); }
      } catch {
        // Offline sau cerere anulată. Nu stingem `streaming`: următoarea
        // încercare vine oricum, iar un indicator care clipește la fiecare
        // hopă de rețea e zgomot, nu informație.
      }
    };

    void tick();
    const id = setInterval(tick, POLL_MS);
    return () => { stopped = true; clearInterval(id); setStreaming(false); };
  }, [symbol, enabled]);

  return { price, freshness, streaming };
}
