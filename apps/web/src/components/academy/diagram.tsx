import type { DiagramDef, Lang } from "@/lib/academy/types";

// ── Motor de diagrame pentru Academie ───────────────────────────────────────
// Randează definiții pure de date (OHLC 0..100) în SVG responsive, pe tema
// site-ului. Verde/roșu = semantic (bullish/bearish), la fel ca P&L-ul.
// Grid, text și cadru vin din tokens — diagrama e o suprafață ca oricare alta.

const BULL = "#34d399"; // --gain
const BEAR = "#fb5c72"; // --loss
const GRID = "rgba(255,255,255,0.07)";
const TEXT = "#8b93a5"; // --ink-3

const H = 280; // înălțime plot
const PAD_X = 14;
const PAD_TOP = 16;
const PAD_BOTTOM = 16;
const STEP = 34; // lățime alocată per lumânare
const BODY_W = 18;

export function Diagram({ def, lang }: { def: DiagramDef; lang: Lang }) {
  const n = def.candles.length;
  const width = PAD_X * 2 + n * STEP;
  const plotH = H - PAD_TOP - PAD_BOTTOM;

  const x = (i: number) => PAD_X + i * STEP + STEP / 2;
  const y = (v: number) => PAD_TOP + ((100 - v) / 100) * plotH;

  return (
    <figure className="my-5">
      <div className="relative rounded-xl border border-[color:var(--line-1)] bg-[color:var(--s-0)] p-3 overflow-x-auto shadow-[inset_0_1px_0_var(--line-top)]">
        <svg
          viewBox={`0 0 ${width} ${H}`}
          className="w-full h-auto min-w-[320px]"
          style={{ maxWidth: Math.max(width, 420) }}
          role="img"
          aria-label={def.caption?.[lang] ?? "diagram"}
        >
          {/* Grid orizontal subtil */}
          {[0, 25, 50, 75, 100].map((g) => (
            <line
              key={g}
              x1={0}
              x2={width}
              y1={y(g)}
              y2={y(g)}
              stroke={GRID}
              strokeWidth={0.8}
              strokeDasharray="2 6"
            />
          ))}

          {/* Zone (ex: order block, zonă S/R) */}
          {def.zones?.map((z, i) => {
            const zx1 = z.x1 != null ? x(z.x1) - STEP / 2 : 0;
            const zx2 = z.x2 != null ? x(z.x2) + STEP / 2 : width;
            const top = y(Math.max(z.y1, z.y2));
            const bot = y(Math.min(z.y1, z.y2));
            const c = z.color ?? "#6d75f6";
            return (
              <g key={`z${i}`}>
                <rect
                  x={zx1}
                  y={top}
                  width={zx2 - zx1}
                  height={bot - top}
                  fill={c}
                  opacity={0.13}
                  stroke={c}
                  strokeOpacity={0.45}
                  strokeWidth={0.8}
                  rx={2}
                />
                {z.label && (
                  <text x={zx1 + 5} y={top + 13} fontSize={10.5} fill={c} fontWeight={700}>
                    {z.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Niveluri orizontale (S/R, limite) */}
          {(() => {
            if (!def.levels?.length) return null;

            // ── Etichetele nu se calcă una pe alta ──────────────────────────
            // Toate etichetele de nivel stau lipite de marginea dreaptă, deci
            // două niveluri apropiate le suprapun și devin ilizibile. Iar
            // uneori nivelurile TREBUIE să fie apropiate: în exercițiul de stop
            // loss, o variantă e „chiar peste intrare" — apropierea e chiar
            // ideea.
            //
            // Deci LINIA rămâne la locul ei, adevărată, iar doar TEXTUL se
            // împinge cât să încapă. Mergem de jos în sus (y crește în jos în
            // SVG) și ridicăm fiecare etichetă care s-ar lipi de precedenta.
            const MIN_GAP = 12;
            const ordered = def.levels
              .map((lv, i) => ({ lv, i, ly: y(lv.y) - 4 }))
              .sort((a, b) => b.ly - a.ly);
            for (let k = 1; k < ordered.length; k++) {
              const prev = ordered[k - 1]!;
              const cur = ordered[k]!;
              if (prev.ly - cur.ly < MIN_GAP) cur.ly = prev.ly - MIN_GAP;
            }
            const labelY = new Map(ordered.map((o) => [o.i, o.ly]));

            return def.levels.map((lv, i) => {
              const c = lv.color ?? TEXT;
              const ly = labelY.get(i)!;
              const trueY = y(lv.y) - 4;
              return (
                <g key={`l${i}`}>
                  <line
                    x1={0}
                    x2={width}
                    y1={y(lv.y)}
                    y2={y(lv.y)}
                    stroke={c}
                    strokeWidth={1.2}
                    strokeDasharray={lv.dashed === false ? undefined : "5 4"}
                  />
                  {lv.label && (
                    <>
                      {/* Eticheta împinsă mai mult de 2px își pierde legătura
                          cu linia ei; o cârjă subțire o leagă înapoi. */}
                      {Math.abs(ly - trueY) > 2 && (
                        <line
                          x1={width - 6}
                          x2={width - 6}
                          y1={ly + 1}
                          y2={trueY + 2}
                          stroke={c}
                          strokeWidth={0.8}
                          opacity={0.5}
                        />
                      )}
                      <text x={width - 10} y={ly} fontSize={10.5} fill={c} textAnchor="end" fontWeight={700}>
                        {lv.label}
                      </text>
                    </>
                  )}
                </g>
              );
            });
          })()}

          {/* Trendlines */}
          {def.trend?.map((t, i) => (
            <line
              key={`t${i}`}
              x1={x(t.x1)}
              y1={y(t.y1)}
              x2={x(t.x2)}
              y2={y(t.y2)}
              stroke={t.color ?? "#6d75f6"}
              strokeWidth={1.6}
              strokeDasharray={t.dashed ? "6 4" : undefined}
              strokeLinecap="round"
            />
          ))}

          {/* Lumânări */}
          {def.candles.map((cd, i) => {
            if (cd.hidden) return null;
            const bull = cd.c >= cd.o;
            const color = bull ? BULL : BEAR;
            const top = y(Math.max(cd.o, cd.c));
            const bot = y(Math.min(cd.o, cd.c));
            const bodyH = Math.max(bot - top, 1.5);
            // Fitilul cuprinde întotdeauna corpul, chiar dacă datele sunt imperfecte.
            const hi = Math.max(cd.h, cd.o, cd.c);
            const lo = Math.min(cd.l, cd.o, cd.c);
            return (
              <g key={`c${i}`}>
                <line x1={x(i)} x2={x(i)} y1={y(hi)} y2={y(lo)} stroke={color} strokeWidth={1.6} />
                <rect
                  x={x(i) - BODY_W / 2}
                  y={top}
                  width={BODY_W}
                  height={bodyH}
                  fill={color}
                  opacity={0.92}
                  rx={1.5}
                />
              </g>
            );
          })}

          {/* Overlay linie (ex: medie mobilă) */}
          {def.line && (
            <polyline
              fill="none"
              stroke="#fbbf24"
              strokeWidth={1.8}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={def.line
                .map((v, i) => (v == null ? null : `${x(i)},${y(v)}`))
                .filter(Boolean)
                .join(" ")}
            />
          )}

          {/* Săgeți */}
          {def.arrows?.map((a, i) => {
            const c = a.color ?? (a.dir === "up" ? BULL : BEAR);
            const ay = y(a.y);
            const pts =
              a.dir === "up"
                ? `${x(a.x)},${ay} ${x(a.x) - 6},${ay + 10} ${x(a.x) + 6},${ay + 10}`
                : `${x(a.x)},${ay} ${x(a.x) - 6},${ay - 10} ${x(a.x) + 6},${ay - 10}`;
            return (
              <g key={`a${i}`}>
                <polygon points={pts} fill={c} />
                {a.label && (
                  <text
                    x={x(a.x)}
                    y={a.dir === "up" ? ay + 24 : ay - 16}
                    fontSize={10.5}
                    fill={c}
                    textAnchor="middle"
                    fontWeight={700}
                  >
                    {a.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Etichete libere */}
          {def.labels?.map((lb, i) => (
            <text
              key={`lb${i}`}
              x={x(lb.x)}
              y={y(lb.y)}
              fontSize={11}
              fill={lb.color ?? TEXT}
              textAnchor="middle"
              fontWeight={700}
            >
              {lb.text}
            </text>
          ))}
        </svg>
      </div>
      {def.caption && (
        <figcaption className="mt-2.5 text-center text-[12px] leading-relaxed text-[color:var(--ink-4)]">
          {def.caption[lang]}
        </figcaption>
      )}
    </figure>
  );
}
