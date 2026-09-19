"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ── Matricea Setup × Sesiune, în relief ──────────────────────────────────────
//
// Aceleași date ca tabelul, citite altfel. Un tabel de procente cere să compari
// cifre una câte una; un relief se citește dintr-o privire: vezi unde e vârful
// și unde e groapa înainte să citești vreun număr.
//
// De ce un bloc separat și nu tabelul înclinat: `transform-style: preserve-3d`
// pe `<table>` e teren minat (celulele își pierd contextul 3D în mai multe
// motoare). Aici e o grilă de `div`-uri, iar tabelul rămâne intact pentru
// modul plat — care e și cel implicit, și cel accesibil.
//
// Înălțimea unei coloane e win rate-ul, NU numărul de tranzacții: altfel un
// setup jucat de o sută de ori ar domina vizual unul care chiar funcționează.
// Eșantioanele mici rămân scunde și transparente, ca ochiul să nu se agațe de
// o coloană construită pe trei tranzacții.

const INALTIME_MAX = 58;   // px, la 100% win rate
const PRAG_MIC = 10;

export interface CelulaRelief {
  setup: string;
  sesiune: string;
  winRate: number | null;
  tranzactii: number;
}

export function MatrixRelief({
  setupuri,
  sesiuni,
  celule,
  eticheteSesiuni,
  eticheteSetupuri,
  onAlege,
  selectat,
  notaEsantion,
}: {
  setupuri: string[];
  sesiuni: string[];
  celule: CelulaRelief[];
  eticheteSesiuni: Record<string, string>;
  eticheteSetupuri: Record<string, string>;
  onAlege: (setup: string, sesiune: string) => void;
  selectat: { setup: string; sesiune: string } | null;
  notaEsantion: string;
}) {
  const scena = React.useRef<HTMLDivElement>(null);

  // Înclinarea urmează cursorul, dar în jurul unui unghi de bază: relieful
  // trebuie să arate a relief și când nimeni nu-l atinge.
  React.useEffect(() => {
    const el = scena.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cadru = 0;
    let x = 0.5;
    let y = 0.5;

    const deseneaza = () => {
      cadru = 0;
      el.style.setProperty("--rx", `${(52 - y * 16).toFixed(2)}deg`);
      el.style.setProperty("--rz", `${((x - 0.5) * 24).toFixed(2)}deg`);
    };

    const laMiscare = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
      if (!cadru) cadru = requestAnimationFrame(deseneaza);
    };

    const laPlecare = () => {
      el.style.setProperty("--rx", "52deg");
      el.style.setProperty("--rz", "0deg");
    };

    el.addEventListener("pointermove", laMiscare, { passive: true });
    el.addEventListener("pointerleave", laPlecare);
    return () => {
      el.removeEventListener("pointermove", laMiscare);
      el.removeEventListener("pointerleave", laPlecare);
      if (cadru) cancelAnimationFrame(cadru);
    };
  }, []);

  const gaseste = (setup: string, sesiune: string) =>
    celule.find((c) => c.setup === setup && c.sesiune === sesiune);

  return (
    <div className="px-5 pb-5">
      <div
        ref={scena}
        className="relative mx-auto"
        style={{
          perspective: "1100px",
          perspectiveOrigin: "50% 42%",
          height: `${140 + setupuri.length * 46}px`,
          maxWidth: 560,
          // Unghiul de bază: destul cât să se vadă înălțimile, nu atât cât să
          // devină imposibil de citit ce scrie pe coloane.
          ["--rx" as string]: "52deg",
          ["--rz" as string]: "0deg",
        }}
      >
        <div
          className="absolute inset-x-0 top-8 grid gap-2"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(var(--rx)) rotateZ(var(--rz))",
            transition: "transform 320ms cubic-bezier(0.16, 1, 0.3, 1)",
            gridTemplateColumns: `72px repeat(${sesiuni.length}, minmax(0, 1fr))`,
          }}
        >
          {/* colț gol + capetele de coloană */}
          <div />
          {sesiuni.map((s) => (
            <div
              key={s}
              className="text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--ink-4)] text-center"
              style={{ transform: "rotateX(calc(var(--rx) * -1))" }}
            >
              {eticheteSesiuni[s] ?? s}
            </div>
          ))}

          {setupuri.map((setup) => (
            <React.Fragment key={setup}>
              <div
                className="text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--ink-4)] self-center truncate"
                style={{ transform: "rotateX(calc(var(--rx) * -1))" }}
              >
                {eticheteSetupuri[setup] ?? setup}
              </div>

              {sesiuni.map((sesiune) => {
                const c = gaseste(setup, sesiune);
                const n = c?.tranzactii ?? 0;
                const wr = c?.winRate ?? null;
                const mic = n > 0 && n < PRAG_MIC;
                const ales = selectat?.setup === setup && selectat?.sesiune === sesiune;

                // Zero tranzacții: o plăcuță plată, nu o coloană de înălțime 0
                // — golul trebuie să arate a gol, nu a rezultat prost.
                const h = wr == null || mic ? 0 : (wr / 100) * INALTIME_MAX;
                const delta = wr == null ? 0 : Math.max(-25, Math.min(25, wr - 50)) / 25;
                const rgb = delta >= 0 ? "52,211,153" : "251,92,114";
                const intensitate = wr == null ? 0 : 0.12 + Math.abs(delta) * 0.5;

                return (
                  <button
                    key={sesiune}
                    type="button"
                    disabled={n === 0}
                    onClick={() => n > 0 && onAlege(setup, sesiune)}
                    title={mic ? notaEsantion : undefined}
                    className={cn(
                      "relative h-9 rounded-md border text-center",
                      n === 0
                        ? "border-[color:var(--line-1)]/40 cursor-default"
                        : "cursor-pointer border-[color:var(--line-1)]",
                      ales && "border-[color:var(--accent)]",
                    )}
                    style={{
                      transform: `translateZ(${h.toFixed(1)}px)`,
                      transition: "transform 420ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 420ms ease",
                      background:
                        n === 0
                          ? "color-mix(in oklab, var(--s-3) 60%, transparent)"
                          : `rgba(${rgb},${intensitate.toFixed(3)})`,
                      // Peretele coloanei: o umbră solidă pe verticală, exact cât
                      // înălțimea. Mai ieftin decât șase fețe adevărate și, la
                      // unghiul ăsta, imposibil de deosebit.
                      boxShadow:
                        h > 0
                          ? `0 ${h.toFixed(0)}px 0 -1px rgba(${rgb},0.18), 0 ${(h + 10).toFixed(0)}px ${(h / 2).toFixed(0)}px rgba(0,0,0,0.45)`
                          : "none",
                      ...(mic
                        ? {
                            backgroundImage:
                              "repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(255,255,255,0.035) 4px, rgba(255,255,255,0.035) 8px)",
                          }
                        : {}),
                    }}
                  >
                    <span
                      className="absolute inset-0 grid place-items-center leading-none"
                      style={{ transform: "rotateX(calc(var(--rx) * -1))" }}
                    >
                      {n === 0 ? (
                        <span className="text-[11px] text-[color:var(--ink-4)] opacity-40">—</span>
                      ) : (
                        <span className="grid gap-px">
                          <span
                            className={cn(
                              "text-[12px] font-bold tabular-nums",
                              mic ? "text-[color:var(--ink-3)]" : "text-[color:var(--ink-1)]",
                            )}
                          >
                            {wr!.toFixed(0)}%
                          </span>
                          <span className="text-[9px] text-[color:var(--ink-4)] tabular-nums">{n}</span>
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
