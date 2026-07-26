"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";

// ── Câmpul P&L 3D — mod de vizualizare, nu panou separat ─────────────────────
//
// Prima variantă a fost un card de sine stătător, adăugat lângă heatmap-ul
// „Performanța pe oră și zi". Era duplicare: exact aceleași date, două panouri.
// Acum e un MOD al aceluiași panou — comuți 2D/3D, insight-urile rămân comune.
//
// DE CE CSS 3D ȘI NU THREE.JS
// Prima încercare de 3D din proiect (terenul de lichiditate) a fost respinsă cu
// „nu se înțelege absolut nimic". Cauza principală: în WebGL textul nu e text —
// axele devin texturi, ies neclare, și rămâi cu o formă fără unități de măsură.
// Aici fiecare etichetă e text DOM: clar, selectabil, traductibil. În plus,
// zero dependențe noi.
//
// Ce aduce 3D-ul peste heatmap: heatmap-ul codează mărimea prin intensitatea
// culorii, care e greu de comparat cu ochiul. Înălțimea se compară imediat.
// Ce pierde: ocluziune. De asta coexistă ca moduri, nu unul în locul altuia.

export interface FieldCell { day: number; hour: number; pnl: number; count: number; wins: number; }

const CELL = 25;
const MAX_BAR = 130;
const HOURS = 24;
const DAYS = 7;

export function PnlField3D({
  cells,
  dayLabels,
  money,
}: {
  cells: FieldCell[];
  dayLabels: string[];
  money: (n: number) => string;
}) {
  const t = useTranslations("analytics");
  const [elev, setElev] = React.useState(-56);
  const [azim, setAzim] = React.useState(-24);
  const [hover, setHover] = React.useState<FieldCell | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const drag = React.useRef<{ x: number; y: number; e: number; a: number } | null>(null);

  const maxAbs = React.useMemo(
    () => cells.reduce((m, c) => Math.max(m, Math.abs(c.pnl)), 0),
    [cells]
  );

  function onPointerDown(e: React.PointerEvent) {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, e: elev, a: azim };
    setDragging(true);
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    // Limitele împiedică privirea „de sub podea", unde scena devine ilizibilă.
    setElev(Math.max(-84, Math.min(-16, d.e - (e.clientY - d.y) * 0.35)));
    setAzim(d.a + (e.clientX - d.x) * 0.35);
  }
  function endDrag() { drag.current = null; setDragging(false); }

  const floorW = HOURS * CELL;
  const floorD = DAYS * CELL;

  return (
    <div className="relative">
      <div
        className="relative select-none cursor-grab active:cursor-grabbing overflow-hidden rounded-xl"
        style={{ height: 380, perspective: 1300, touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={() => { endDrag(); setHover(null); }}
      >
        {/* Nudge pe verticală în spațiul ECRANULUI: barele cresc în sus, deci
            centrul optic al compoziției e deasupra centrului podelei. Fără el,
            podeaua și etichetele ies din cadru jos. */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{ transformStyle: "preserve-3d", transform: "translate(-50%,-50%) translateY(34px)" }}
        >
          <div
            style={{
              transformStyle: "preserve-3d",
              transform: `rotateX(${elev}deg) rotateZ(${azim}deg)`,
              transition: dragging ? "none" : "transform 420ms cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            {/* Podeaua arată TOATE ferestrele, inclusiv cele fără tranzacții:
                absența e și ea informație. */}
            <div
              className="absolute"
              style={{
                width: floorW, height: floorD,
                left: -floorW / 2, top: -floorD / 2,
                backgroundImage:
                  `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                backgroundSize: `${CELL}px ${CELL}px`,
                border: "1px solid rgba(255,255,255,0.085)",
                transformStyle: "preserve-3d",
              }}
            />

            {cells.map((c) => {
              const h = maxAbs > 0 ? (Math.abs(c.pnl) / maxAbs) * MAX_BAR : 0;
              const col = c.pnl >= 0 ? "52,211,153" : "251,92,114";
              const x = -floorW / 2 + c.hour * CELL + CELL / 2;
              const y = -floorD / 2 + c.day * CELL + CELL / 2;
              const w = CELL * 0.44;
              const on = hover?.day === c.day && hover?.hour === c.hour;

              // Două planuri perpendiculare: volum din orice unghi, la 2 noduri
              // în loc de 6 (cub complet).
              const face = (extra: string): React.CSSProperties => ({
                position: "absolute",
                left: -w / 2, bottom: 0,
                width: w, height: Math.max(h, 1),
                transformOrigin: "bottom center",
                transform: `rotateX(90deg) ${extra}`,
                background: `linear-gradient(to top, rgba(${col},${on ? 0.55 : 0.3}), rgba(${col},${on ? 1 : 0.88}))`,
                boxShadow: on ? `0 0 18px rgba(${col},0.7)` : "none",
                pointerEvents: "none",
              });

              return (
                <div key={`${c.day}-${c.hour}`} className="absolute"
                  style={{ left: x, top: y, width: 0, height: 0, transformStyle: "preserve-3d" }}>
                  <div style={{ position: "relative", transformStyle: "preserve-3d" }}>
                    <div style={face("")} />
                    <div style={face("rotateY(90deg)")} />
                    <div style={{
                      position: "absolute",
                      left: -w / 2, top: -w / 2, width: w, height: w,
                      transform: `translateZ(${Math.max(h, 1)}px)`,
                      background: `rgba(${col},${on ? 1 : 0.92})`,
                      boxShadow: `0 0 ${on ? 22 : 10}px rgba(${col},0.75)`,
                      borderRadius: 2,
                    }} />
                    {/* Țintă de hover pe podea: mult mai ușor de nimerit decât
                        o bară subțire înclinată în perspectivă. */}
                    <div
                      onMouseEnter={() => setHover(c)}
                      style={{ position: "absolute", left: -CELL / 2, top: -CELL / 2, width: CELL, height: CELL, cursor: "pointer" }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Etichetele sunt CONTRA-ROTITE, deci rămân drepte din orice unghi
                de orbită. Fără asta, axele devin ilizibile la rotire — exact
                problema care a ucis vizualizarea 3D anterioară. */}
            {dayLabels.slice(0, DAYS).map((lbl, d) => (
              <div key={`d${d}`} className="absolute font-mono text-[9px] font-bold whitespace-nowrap"
                style={{
                  left: -floorW / 2 - 26,
                  top: -floorD / 2 + d * CELL + CELL / 2 - 6,
                  color: "var(--ink-3)",
                  transform: `rotateZ(${-azim}deg) rotateX(${-elev}deg)`,
                }}>
                {lbl}
              </div>
            ))}
            {Array.from({ length: HOURS }, (_, h) => h).filter((h) => h % 3 === 0).map((h) => (
              <div key={`h${h}`} className="absolute font-mono text-[9px] font-bold"
                style={{
                  left: -floorW / 2 + h * CELL + CELL / 2 - 7,
                  top: floorD / 2 + 9,
                  color: "var(--ink-4)",
                  transform: `rotateZ(${-azim}deg) rotateX(${-elev}deg)`,
                }}>
                {String(h).padStart(2, "0")}
              </div>
            ))}
          </div>
        </div>

        {/* 3D-ul dă forma, cifra dă adevărul. */}
        {hover && (
          <div className="absolute left-3 bottom-3 rounded-xl px-3 py-2 backdrop-blur-md pointer-events-none"
            style={{ background: "rgba(16,19,25,0.94)", border: "1px solid var(--line-2)", boxShadow: "var(--el-2)" }}>
            <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--ink-4)" }}>
              {dayLabels[hover.day]} · {String(hover.hour).padStart(2, "0")}:00
            </p>
            <p className="text-base font-black num leading-tight"
              style={{ color: hover.pnl >= 0 ? "var(--gain)" : "var(--loss)" }}>
              {hover.pnl >= 0 ? "+" : ""}{money(hover.pnl)}
            </p>
            <p className="text-[10px]" style={{ color: "var(--ink-3)" }}>
              {t("spaceCellMeta", { count: hover.count, wins: hover.wins })}
            </p>
          </div>
        )}

        <button
          onClick={() => { setElev(-56); setAzim(-24); }}
          className="absolute right-3 top-3 flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] transition-colors hover:text-white"
          style={{ border: "1px solid var(--line-2)", color: "var(--ink-3)", background: "rgba(16,19,25,0.8)" }}
        >
          <RotateCcw className="w-3 h-3" />{t("spaceReset")}
        </button>
        <p className="absolute right-3 bottom-3 text-[10px] font-mono pointer-events-none" style={{ color: "var(--ink-4)" }}>
          {t("spaceDragHint")}
        </p>
      </div>

      {/* Echivalent textual — un câmp 3D e inaccesibil prin definiție. */}
      <table className="sr-only">
        <caption>{t("spaceTitle")}</caption>
        <thead><tr><th>{t("spaceAxisDay")}</th><th>{t("spaceAxisHour")}</th><th>P&amp;L</th><th>{t("spaceAxisTrades")}</th></tr></thead>
        <tbody>
          {cells.map((c) => (
            <tr key={`sr-${c.day}-${c.hour}`}>
              <td>{dayLabels[c.day]}</td><td>{c.hour}:00</td><td>{money(c.pnl)}</td><td>{c.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
