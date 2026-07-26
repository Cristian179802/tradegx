"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { RotateCcw, Move3d } from "lucide-react";
import type { PnlSpace, PnlCell } from "@/lib/pnl-space";

// ── Spațiul P&L — câmp volumetric orbitabil ──────────────────────────────────
//
// DE CE CSS 3D ȘI NU THREE.JS
// Prima încercare de 3D din acest proiect (terenul de lichiditate) a fost
// respinsă cu „nu se înțelege absolut nimic" — și pe bună dreptate. Cauza
// principală nu a fost 3D-ul în sine, ci că în WebGL textul nu e text: axele
// devin texturi sau sprite-uri, ies neclare, și rămâi cu o formă frumoasă fără
// nicio unitate de măsură.
//
// Aici fiecare etichetă e text DOM real: clar la orice zoom, selectabil,
// traductibil, citit de cititoarele de ecran. În plus dispare o dependență de
// ~150KB. Pentru un câmp de bare, CSS 3D nu e compromisul — e alegerea bună.
//
// Ce am adăugat față de vizualizarea respinsă:
//   · axe etichetate (zilele săptămânii × ora) care rămân MEREU drepte
//   · legendă explicită pentru culoare și înălțime
//   · valoare exactă la hover — 3D-ul dă forma, cifra dă adevărul
//   · tabel echivalent pentru cititoarele de ecran

const CELL = 26;         // px per celulă pe podea
const MAX_BAR = 148;     // înălțimea barei pentru |P&L| maxim
const HOURS = 24;
const DAYS = 7;

export function PnlSpace3D({ space, currency }: { space: PnlSpace; currency: string }) {
  const t = useTranslations("analytics");
  const locale = useLocale();

  const [elev, setElev] = React.useState(-58);  // unghi de privire (rotateX)
  const [azim, setAzim] = React.useState(-26);  // rotire în jurul axei verticale
  const [hover, setHover] = React.useState<PnlCell | null>(null);
  const drag = React.useRef<{ x: number; y: number; e: number; a: number } | null>(null);

  const dayNames = React.useMemo(() => (t.raw("dayShort") as string[]) ?? [], [t]);

  const money = React.useCallback(
    (n: number) =>
      new Intl.NumberFormat(locale === "ro" ? "ro-RO" : "en-US", {
        style: "currency", currency, maximumFractionDigits: 0,
      }).format(n),
    [locale, currency]
  );

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, e: elev, a: azim };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    // Limitele împiedică privirea „de sub podea", unde scena devine ilizibilă.
    setElev(Math.max(-86, Math.min(-14, d.e - (e.clientY - d.y) * 0.35)));
    setAzim(d.a + (e.clientX - d.x) * 0.35);
  }
  function endDrag() { drag.current = null; }

  function reset() { setElev(-58); setAzim(-26); }

  const floorW = HOURS * CELL;
  const floorD = DAYS * CELL;

  if (space.cells.length === 0) {
    return (
      <div className="tg-surface rounded-2xl p-8 text-center">
        <p className="text-sm" style={{ color: "var(--ink-3)" }}>{t("spaceEmpty")}</p>
      </div>
    );
  }

  return (
    <div className="tg-surface tg-boot rounded-2xl overflow-hidden">
      {/* Antet + legendă */}
      <div className="px-5 py-3.5 flex items-start justify-between gap-4 flex-wrap"
        style={{ borderBottom: "1px solid var(--line-1)" }}>
        <div>
          <div className="flex items-center gap-2">
            <Move3d className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <h3 className="text-sm font-black" style={{ color: "var(--ink-1)" }}>{t("spaceTitle")}</h3>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-4)" }}>{t("spaceSub")}</p>
        </div>
        <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--ink-3)" }}>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--gain)" }} />{t("spaceProfit")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--loss)" }} />{t("spaceLoss")}
          </span>
          <span style={{ color: "var(--ink-4)" }}>{t("spaceHeight")}</span>
          <button onClick={reset} className="flex items-center gap-1 rounded-lg px-2 py-1 transition-colors hover:text-white"
            style={{ border: "1px solid var(--line-2)" }}>
            <RotateCcw className="w-3 h-3" />{t("spaceReset")}
          </button>
        </div>
      </div>

      {/* Scena */}
      <div
        className="relative select-none cursor-grab active:cursor-grabbing"
        style={{ height: 420, perspective: 1250, touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={() => { endDrag(); setHover(null); }}
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transformStyle: "preserve-3d",
            transform: `translate(-50%,-50%) rotateX(${elev}deg) rotateZ(${azim}deg)`,
            transition: drag.current ? "none" : "transform 420ms cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* Podeaua: grilă care arată TOATE ferestrele, inclusiv cele fără
              tranzacții — absența e și ea informație. */}
          <div
            className="absolute"
            style={{
              width: floorW, height: floorD,
              left: -floorW / 2, top: -floorD / 2,
              backgroundImage:
                `linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)`,
              backgroundSize: `${CELL}px ${CELL}px`,
              border: "1px solid rgba(255,255,255,0.09)",
              transformStyle: "preserve-3d",
            }}
          />

          {/* Barele */}
          {space.cells.map((c) => {
            const h = space.maxAbsPnl > 0 ? (Math.abs(c.pnl) / space.maxAbsPnl) * MAX_BAR : 0;
            const up = c.pnl >= 0;
            const col = up ? "52,211,153" : "251,92,114";
            const x = -floorW / 2 + c.hour * CELL + CELL / 2;
            const y = -floorD / 2 + c.day * CELL + CELL / 2;
            const w = CELL * 0.46;
            const active = hover?.day === c.day && hover?.hour === c.hour;

            // Două planuri verticale perpendiculare: din orice unghi de orbită
            // se vede volum, dar costă doar 2 noduri în loc de 6 (cub complet).
            const face = (extra: string): React.CSSProperties => ({
              position: "absolute",
              left: -w / 2, bottom: 0,
              width: w, height: Math.max(h, 1),
              transformOrigin: "bottom center",
              transform: `rotateX(90deg) ${extra}`,
              background: `linear-gradient(to top, rgba(${col},${active ? 0.5 : 0.28}), rgba(${col},${active ? 1 : 0.85}))`,
              boxShadow: active ? `0 0 16px rgba(${col},0.65)` : "none",
              pointerEvents: "none",
            });

            return (
              <div
                key={`${c.day}-${c.hour}`}
                className="absolute"
                style={{ left: x, top: y, width: 0, height: 0, transformStyle: "preserve-3d" }}
              >
                <div style={{ position: "relative", transformStyle: "preserve-3d" }}>
                  <div style={face("")} />
                  <div style={face("rotateY(90deg)")} />
                  {/* Capac: punctul luminos care marchează vârful */}
                  <div
                    style={{
                      position: "absolute",
                      left: -w / 2, top: -w / 2,
                      width: w, height: w,
                      transform: `translateZ(${Math.max(h, 1)}px)`,
                      background: `rgba(${col},${active ? 1 : 0.9})`,
                      boxShadow: `0 0 ${active ? 20 : 10}px rgba(${col},0.7)`,
                      borderRadius: 2,
                    }}
                  />
                  {/* Zonă de captare a mouse-ului: un pătrat pe podea, mult mai
                      ușor de nimerit decât o bară subțire înclinată. */}
                  <div
                    onMouseEnter={() => setHover(c)}
                    style={{
                      position: "absolute",
                      left: -CELL / 2, top: -CELL / 2,
                      width: CELL, height: CELL,
                      cursor: "pointer",
                    }}
                  />
                </div>
              </div>
            );
          })}

          {/* Etichete de axă — contra-rotite ca să rămână MEREU drepte.
              Asta e diferența dintre „ce reprezintă axa asta?" și un grafic
              care se citește din orice unghi. */}
          {Array.from({ length: DAYS }, (_, d) => (
            <div
              key={`d${d}`}
              className="absolute font-mono text-[9px] font-bold whitespace-nowrap"
              style={{
                left: -floorW / 2 - 30,
                top: -floorD / 2 + d * CELL + CELL / 2 - 6,
                color: "var(--ink-3)",
                transform: `rotateZ(${-azim}deg) rotateX(${-elev}deg)`,
                transformOrigin: "center",
              }}
            >
              {dayNames[d] ?? d}
            </div>
          ))}
          {Array.from({ length: HOURS }, (_, h) => (h % 3 === 0 ? h : null)).map((h) =>
            h === null ? null : (
              <div
                key={`h${h}`}
                className="absolute font-mono text-[9px] font-bold"
                style={{
                  left: -floorW / 2 + h * CELL + CELL / 2 - 8,
                  top: floorD / 2 + 10,
                  color: "var(--ink-4)",
                  transform: `rotateZ(${-azim}deg) rotateX(${-elev}deg)`,
                  transformOrigin: "center",
                }}
              >
                {String(h).padStart(2, "0")}
              </div>
            )
          )}
        </div>

        {/* Readout: 3D-ul dă forma, cifra dă adevărul. */}
        {hover && (
          <div className="absolute left-4 bottom-4 rounded-xl px-3.5 py-2.5 backdrop-blur-md pointer-events-none"
            style={{ background: "rgba(16,19,25,0.94)", border: "1px solid var(--line-2)", boxShadow: "var(--el-2)" }}>
            <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--ink-4)" }}>
              {dayNames[hover.day]} · {String(hover.hour).padStart(2, "0")}:00
            </p>
            <p className="text-lg font-black num leading-tight"
              style={{ color: hover.pnl >= 0 ? "var(--gain)" : "var(--loss)" }}>
              {hover.pnl >= 0 ? "+" : ""}{money(hover.pnl)}
            </p>
            <p className="text-[10px]" style={{ color: "var(--ink-3)" }}>
              {t("spaceCellMeta", { count: hover.count, wins: hover.wins })}
            </p>
          </div>
        )}

        <p className="absolute right-4 bottom-4 text-[10px] font-mono pointer-events-none"
          style={{ color: "var(--ink-4)" }}>{t("spaceDragHint")}</p>
      </div>

      {/* Echivalent textual: un grafic 3D e inaccesibil prin definiție, deci
          expunem aceleași date și ca tabel pentru cititoarele de ecran. */}
      <table className="sr-only">
        <caption>{t("spaceTitle")}</caption>
        <thead>
          <tr><th>{t("spaceAxisDay")}</th><th>{t("spaceAxisHour")}</th><th>P&amp;L</th><th>{t("spaceAxisTrades")}</th></tr>
        </thead>
        <tbody>
          {space.cells.map((c) => (
            <tr key={`sr-${c.day}-${c.hour}`}>
              <td>{dayNames[c.day]}</td><td>{c.hour}:00</td><td>{money(c.pnl)}</td><td>{c.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
