"use client";

import * as React from "react";

/**
 * Datele vii din șina de navigație.
 *
 * Regulile de polling sunt aceleași care au salvat baza de date acum câteva zile,
 * și nu sunt negociabile:
 *
 *  · UN singur endpoint, nu unul per cifră.
 *  · Un minut între cereri, nu cinci secunde.
 *  · ZERO cereri cu tabul în fundal. Baza suspendă computul după cinci minute
 *    fără interogări; o buclă care merge într-un tab uitat deschis o ține trează
 *    non-stop și consumă alocația lunară fără ca nimeni să se uite la rezultat.
 *  · O cerere imediat la revenirea în tab — momentul în care cifra chiar contează.
 *
 * La eroare păstrăm ultima valoare bună în loc să golim șina. O cifră de acum un
 * minut e mai utilă decât un gol care arată a defect.
 */
export interface NavPulse {
  alerts: number;
  pnlToday: number;
  tradesToday: number;
  openPositions: number;
  balance: number;
}

const POLL_MS = 60_000;

export function useNavPulse(): NavPulse | null {
  const [pulse, setPulse] = React.useState<NavPulse | null>(null);
  const inFlight = React.useRef(false);

  React.useEffect(() => {
    let cancelled = false;
    let id: ReturnType<typeof setInterval> | null = null;

    const fetchOnce = async () => {
      if (inFlight.current || document.visibilityState !== "visible") return;
      inFlight.current = true;
      try {
        const res = await fetch("/api/nav/pulse", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const d = await res.json();
        if (d?.ok) {
          setPulse({
            alerts: d.alerts ?? 0,
            pnlToday: d.pnlToday ?? 0,
            tradesToday: d.tradesToday ?? 0,
            openPositions: d.openPositions ?? 0,
            balance: d.balance ?? 0,
          });
        }
      } catch {
        /* offline sau server indisponibil — rămâne ultima valoare bună */
      } finally {
        inFlight.current = false;
      }
    };

    const start = () => { if (!id) id = setInterval(fetchOnce, POLL_MS); };
    const stop = () => { if (id) { clearInterval(id); id = null; } };

    const onVisible = () => {
      if (document.visibilityState === "visible") { void fetchOnce(); start(); }
      else stop();
    };

    void fetchOnce();
    start();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return pulse;
}

/**
 * Formatare compactă pentru spațiile mici din șină: 12.4k, 1.3M.
 *
 * `plus` controlează DOAR semnul pozitiv. Minusul rămâne mereu — un P&L negativ
 * afișat fără semn ar fi o minciună, indiferent de context.
 *
 * Sub o mie păstrăm bănuții: la scara aia, „959.82" și „960" nu sunt același
 * lucru pentru cineva care își urmărește contul.
 */
export function compactMoney(v: number, opts?: { plus?: boolean }): string {
  const showPlus = opts?.plus ?? true;
  const a = Math.abs(v);
  const sign = v < 0 ? "-" : v > 0 && showPlus ? "+" : "";
  if (a >= 1_000_000) return `${sign}${(a / 1_000_000).toFixed(1)}M`;
  if (a >= 10_000) return `${sign}${(a / 1000).toFixed(1)}k`;
  if (a >= 1000) return `${sign}${(a / 1000).toFixed(2)}k`;
  return `${sign}${a.toFixed(2)}`;
}
