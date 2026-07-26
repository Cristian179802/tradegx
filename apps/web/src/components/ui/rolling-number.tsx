"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ── RollingNumber — odometru mecanic ─────────────────────────────────────────
//
// Fiecare cifră e o coloană verticală cu 0-9 care se rotește până la valoarea
// ei. E diferența dintre „un număr apare pe ecran" și „un aparat afișează o
// măsurătoare" — semnalul care face un terminal financiar să pară scump.
//
// Diferă de <CountUp/>: acolo se interpolează VALOAREA (1 → 2 → ... → 186),
// aici se rotesc CIFRELE independent, ca la un contor mecanic.
//
// Primește un string deja formatat ("+30.8k USD", "55,4%", "1.64"), pentru că
// formatarea (monedă, locale, prescurtări) e deja rezolvată în pagini. Doar
// caracterele 0-9 se animă; separatorii, moneda și semnele stau pe loc.
//
// Accesibilitate: coloanele sunt aria-hidden, iar valoarea reală e expusă o
// singură dată prin aria-label — altfel cititoarele de ecran ar citi toate cele
// 10 cifre din fiecare coloană.
//
// SSR: la primul render (server + prima pictură client) toate coloanele sunt pe
// 0. Abia după montare se aplică offset-urile, deci nu există mismatch de
// hidratare, iar efectul „urcă de la zero" vine gratis.

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

export function RollingNumber({
  value,
  className,
  duration = 1050,
  delay = 0,
  stagger = 55,
}: {
  /** Valoarea deja formatată, ex. "+30.8k USD" sau "55,4%". */
  value: string;
  className?: string;
  /** Durata rostogolirii, ms. */
  duration?: number;
  /** Întârziere înainte de start, ms — pentru cascada de inițializare. */
  delay?: number;
  /** Decalaj între cifre, ms. Dă senzația mecanică, nu de bloc. */
  stagger?: number;
}) {
  const reduced = useReducedMotion();
  const [armed, setArmed] = React.useState(false);
  const chars = React.useMemo(() => Array.from(value), [value]);

  React.useEffect(() => {
    if (reduced) { setArmed(true); return; }
    // rAF dublu: garantează că prima pictură are offset 0, deci tranziția
    // chiar rulează (fără el, browserul comasează cele două stări).
    let id2 = 0;
    const id1 = requestAnimationFrame(() => { id2 = requestAnimationFrame(() => setArmed(true)); });
    return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2); };
  }, [reduced]);

  // Numărăm cifrele de la dreapta: unitățile pornesc primele, ca la un contor.
  const totalDigits = chars.filter((c) => c >= "0" && c <= "9").length;
  let digitIndex = -1;

  return (
    <span
      className={cn("inline-flex items-baseline num tabular-nums", className)}
      aria-label={value}
      role="text"
    >
      {chars.map((ch, i) => {
        const isDigit = ch >= "0" && ch <= "9";
        if (!isDigit) {
          return (
            <span key={i} aria-hidden className="whitespace-pre">
              {ch}
            </span>
          );
        }
        digitIndex++;
        // dreapta → stânga: ultima cifră pleacă prima
        const fromRight = totalDigits - 1 - digitIndex;
        const d = Number(ch);
        return (
          <span
            key={i}
            aria-hidden
            className="inline-block overflow-hidden"
            style={{ height: "1em", lineHeight: 1 }}
          >
            <span
              className="flex flex-col"
              style={{
                transform: `translateY(${armed ? -d : 0}em)`,
                transition: reduced ? "none" : `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
                transitionDelay: reduced ? "0ms" : `${delay + fromRight * stagger}ms`,
                willChange: "transform",
              }}
            >
              {DIGITS.map((n) => (
                <span key={n} style={{ height: "1em", lineHeight: 1 }}>
                  {n}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
