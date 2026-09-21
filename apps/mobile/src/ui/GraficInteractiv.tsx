import * as React from "react";
import { Animated, PanResponder, StyleSheet, View } from "react-native";
import { Text } from "./Text";
import Svg, { Line, Path, Rect, Text as SvgText } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { T } from "../theme";

// ── Graficul pe care poți pune mâna ──────────────────────────────────────────
//
// Trei lucruri, în ordinea în care le cere cineva care se uită la un grafic pe
// telefon: să-l apropie, să-l plimbe, și să tragă o linie pe el.
//
// DE CE NU RE-RANDĂM LA FIECARE DEGET MIȘCAT. O fereastră de 150 de lumânări
// înseamnă ~300 de noduri SVG. Redesenate de șaizeci de ori pe secundă, pe un
// telefon ieftin se simte ca o prezentare de diapozitive. Așa că în TIMPUL
// gestului mutăm și întindem imaginea deja desenată — o transformare, pe
// driverul nativ, deci nici măcar nu atinge firul de JavaScript. Abia când
// ridici degetul se recalculează fereastra și se redesenează exact.
//
// Compromisul e vizibil și asumat: cât ții degetul pe ecran, lumânările sunt
// ușor întinse. Alternativa era un grafic corect care se mișcă în salturi.
//
// GESTURILE SUNT PE `PanResponder`, nu pe o bibliotecă. Aplicația n-are
// Reanimated (cere New Architecture, care e oprită), iar fără el un detector
// de gesturi modern rulează oricum pe firul de JavaScript — adică exact ce
// face și `PanResponder`, doar cu un strat în plus între mine și degete.
// Distanța dintre două degete o calculez singur: e o rădăcină pătrată.

export interface Lumanare {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface Marcaj {
  id: string;
  direction: string;
  entryTime: number;
  entryPrice: number;
  exitPrice: number | null;
  pnl: number | null;
}

export interface Setup {
  entry: number;
  sl: number | null;
  tp: number | null;
}

export interface Desene {
  /** Linii orizontale de suport/rezistență, ca prețuri. */
  linii: number[];
  setup: Setup | null;
}

export const DESENE_GOALE: Desene = { linii: [], setup: null };

export type ModGrafic = "misca" | "linie" | "setup";

/** Câte lumânări se văd la deschidere, și limitele apropierii. */
const IMPLICIT = 120;
const MIN_VIZIBILE = 15;

/** Sub atâția pixeli și atâtea milisecunde, gestul e o atingere, nu o mișcare. */
const PRAG_ATINGERE = 8;
const DURATA_ATINGERE = 300;

export function GraficInteractiv({
  date,
  latime,
  inaltime = 300,
  marcaje = [],
  zecimale = 5,
  mod,
  desene,
  onDesene,
}: {
  date: Lumanare[];
  latime: number;
  inaltime?: number;
  marcaje?: Marcaj[];
  zecimale?: number;
  mod: ModGrafic;
  desene: Desene;
  onDesene: (d: Desene) => void;
}) {
  const total = date.length;

  // Fereastra vizibilă, ca indici în seria completă.
  const [fereastra, setFereastra] = React.useState(() => ({
    start: Math.max(0, total - IMPLICIT),
    cate: Math.min(IMPLICIT, Math.max(MIN_VIZIBILE, total)),
  }));

  // Seria se schimbă (alt simbol, alt interval) → revenim la coada graficului.
  React.useEffect(() => {
    setFereastra({
      start: Math.max(0, total - IMPLICIT),
      cate: Math.min(IMPLICIT, Math.max(MIN_VIZIBILE, total)),
    });
  }, [total]);

  const deplasare = React.useRef(new Animated.Value(0)).current;
  const scara = React.useRef(new Animated.Value(1)).current;

  // Referințele sunt citite din interiorul `PanResponder`, care se creează o
  // singură dată — fără ele ar vedea mereu prima stare.
  const refFereastra = React.useRef(fereastra);
  refFereastra.current = fereastra;
  const refLatime = React.useRef(latime);
  refLatime.current = latime;
  const refMod = React.useRef(mod);
  refMod.current = mod;
  const refTotal = React.useRef(total);
  refTotal.current = total;

  // Ce e nevoie la finalul gestului, strâns în timpul lui.
  const gest = React.useRef({
    distantaInitiala: 0,
    raport: 1,
    dx: 0,
    pornitLa: 0,
    aFostPinch: false,
    x0: 0,
    y0: 0,
  });

  // Conversia atingere → preț se schimbă la fiecare redesenare; o ținem
  // într-un ref ca `PanResponder` (creat o dată) să folosească varianta curentă.
  const refLaPret = React.useRef<(y: number) => number>(() => 0);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        // În modul de desenat prindem gestul din prima atingere, fiindcă acolo
        // o atingere ÎNSEAMNĂ ceva. În modul de mișcat lăsăm atingerea să
        // treacă mai departe.
        onStartShouldSetPanResponder: () => refMod.current !== "misca",

        // Pe orizontală plimbăm graficul, cu două degete îl apropiem — dar o
        // tragere pe VERTICALĂ trebuie să ajungă la lista de dedesubt, altfel
        // pagina nu se mai poate derula cât timp degetul e pe grafic.
        onMoveShouldSetPanResponder: (_e, g) =>
          g.numberActiveTouches === 2 || Math.abs(g.dx) > Math.abs(g.dy) * 1.2,

        onPanResponderGrant: (e) => {
          gest.current.pornitLa = Date.now();
          gest.current.aFostPinch = false;
          gest.current.dx = 0;
          gest.current.raport = 1;
          gest.current.distantaInitiala = 0;
          gest.current.x0 = e.nativeEvent.locationX;
          gest.current.y0 = e.nativeEvent.locationY;
        },

        onPanResponderMove: (e, g) => {
          const atingeri = e.nativeEvent.touches;

          if (atingeri.length === 2) {
            const a = atingeri[0]!;
            const b = atingeri[1]!;
            const d = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
            if (gest.current.distantaInitiala === 0) {
              gest.current.distantaInitiala = d;
              gest.current.aFostPinch = true;
              // Pinch-ul anulează orice deplasare adunată până acum: degetele
              // s-au mutat ca să apropie, nu ca să plimbe.
              deplasare.setValue(0);
              gest.current.dx = 0;
            } else {
              const r = d / gest.current.distantaInitiala;
              gest.current.raport = r;
              scara.setValue(r);
            }
            return;
          }

          if (gest.current.aFostPinch) return; // un deget ridicat dintr-un pinch
          gest.current.dx = g.dx;
          deplasare.setValue(g.dx);
        },

        onPanResponderRelease: (e, g) => {
          const durata = Date.now() - gest.current.pornitLa;
          const miscat = Math.hypot(g.dx, g.dy);

          // ── Atingere scurtă: desenăm ──
          if (
            !gest.current.aFostPinch &&
            miscat < PRAG_ATINGERE &&
            durata < DURATA_ATINGERE &&
            refMod.current !== "misca"
          ) {
            const pret = refLaPret.current(e.nativeEvent.locationY);
            deplasare.setValue(0);
            scara.setValue(1);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            adaugaLaAtingere(pret);
            return;
          }

          const { start, cate } = refFereastra.current;
          const w = refLatime.current || 1;
          const n = refTotal.current;

          let nouCate = cate;
          let nouStart = start;

          if (gest.current.aFostPinch && gest.current.raport > 0) {
            // Degete depărtate (raport > 1) = mai puține lumânări, adică zoom in.
            nouCate = Math.round(cate / gest.current.raport);
            nouCate = Math.max(MIN_VIZIBILE, Math.min(n, nouCate));
            // Apropierea se face în jurul CENTRULUI ferestrei, nu al capătului:
            // altfel graficul fuge lateral în timp ce îl apropii.
            const centru = start + cate / 2;
            nouStart = Math.round(centru - nouCate / 2);
          } else {
            // Tragi spre dreapta = te uiți mai în urmă în timp.
            const lumanariPePixel = cate / w;
            nouStart = Math.round(start - gest.current.dx * lumanariPePixel);
          }

          nouStart = Math.max(0, Math.min(n - nouCate, nouStart));

          deplasare.setValue(0);
          scara.setValue(1);
          setFereastra({ start: nouStart, cate: nouCate });
        },

        onPanResponderTerminate: () => {
          deplasare.setValue(0);
          scara.setValue(1);
        },
      }),
    // Creat o singură dată: totul ce se schimbă se citește din referințe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /** Un preț atins devine linie sau punct din setup, după modul curent. */
  const adaugaLaAtingere = React.useCallback(
    (pret: number) => {
      const m = refMod.current;
      if (m === "linie") {
        onDeseneRef.current({ ...deseneRef.current, linii: [...deseneRef.current.linii, pret] });
        return;
      }
      if (m === "setup") {
        const s = deseneRef.current.setup;
        // Trei atingeri, în ordinea în care se gândește o tranzacție:
        // unde intru, unde recunosc că am greșit, unde iau profitul.
        if (!s) {
          onDeseneRef.current({ ...deseneRef.current, setup: { entry: pret, sl: null, tp: null } });
        } else if (s.sl == null) {
          onDeseneRef.current({ ...deseneRef.current, setup: { ...s, sl: pret } });
        } else if (s.tp == null) {
          onDeseneRef.current({ ...deseneRef.current, setup: { ...s, tp: pret } });
        } else {
          // Setup complet: o atingere nouă începe altul.
          onDeseneRef.current({ ...deseneRef.current, setup: { entry: pret, sl: null, tp: null } });
        }
      }
    },
    [],
  );

  const deseneRef = React.useRef(desene);
  deseneRef.current = desene;
  const onDeseneRef = React.useRef(onDesene);
  onDeseneRef.current = onDesene;

  /* ── Geometria ferestrei curente ──────────────────────────────────────── */

  const forme = React.useMemo(() => {
    if (latime <= 0 || total === 0) return null;

    const start = Math.max(0, Math.min(total - 1, fereastra.start));
    const cate = Math.max(1, Math.min(total - start, fereastra.cate));
    const vizibile = date.slice(start, start + cate);
    if (vizibile.length === 0) return null;

    let min = Math.min(...vizibile.map((c) => c.low));
    let max = Math.max(...vizibile.map((c) => c.high));

    // Desenele intră în scară, altfel o linie trasă sus iese din cadru la
    // prima apropiere și pare că a dispărut.
    const preturiDesenate = [
      ...desene.linii,
      ...(desene.setup
        ? [desene.setup.entry, desene.setup.sl, desene.setup.tp].filter(
            (x): x is number => x != null,
          )
        : []),
    ];
    for (const p of preturiDesenate) {
      if (p < min) min = p;
      if (p > max) max = p;
    }

    const interval = max - min || 1;
    const sus = 10;
    const jos = 18; // loc pentru axa de timp
    const util = inaltime - sus - jos;

    const y = (v: number) => sus + (1 - (v - min) / interval) * util;
    const laPret = (py: number) => min + (1 - (py - sus) / util) * interval;
    const pas = latime / cate;
    const corp = Math.max(1.5, Math.min(11, pas * 0.66));
    const x = (i: number) => i * pas + pas / 2;

    const laTimp = (t: number) => {
      let a = 0;
      let b = vizibile.length - 1;
      if (t <= vizibile[0]!.time) return x(0);
      if (t >= vizibile[b]!.time) return x(b);
      while (a < b) {
        const mij = (a + b) >> 1;
        if (vizibile[mij]!.time < t) a = mij + 1;
        else b = mij;
      }
      return x(a);
    };

    return { vizibile, min, max, y, laPret, x, pas, corp, laTimp, start, cate, sus, util };
  }, [date, total, fereastra, latime, inaltime, desene]);

  // Conversia se reîmprospătează la fiecare desenare; gestul o citește de aici.
  React.useEffect(() => {
    if (forme) refLaPret.current = forme.laPret;
  }, [forme]);

  if (!forme) {
    return <View style={{ width: Math.max(0, latime), height: inaltime }} />;
  }

  const ultima = forme.vizibile[forme.vizibile.length - 1]!;
  const yUltim = forme.y(ultima.close);

  const s = desene.setup;
  const yEntry = s ? forme.y(s.entry) : null;
  const ySl = s?.sl != null ? forme.y(s.sl) : null;
  const yTp = s?.tp != null ? forme.y(s.tp) : null;

  return (
    <View
      style={{ width: Math.max(0, latime), height: inaltime, overflow: "hidden" }}
      {...panResponder.panHandlers}
    >
      <Animated.View
        style={{
          transform: [{ translateX: deplasare }, { scaleX: scara }],
        }}
      >
        <Svg width={Math.max(0, latime)} height={inaltime}>
          {/* ── Zonele setup-ului, sub tot ── */}
          {s && yEntry != null && ySl != null ? (
            <Rect
              x={0}
              y={Math.min(yEntry, ySl)}
              width={latime}
              height={Math.abs(ySl - yEntry)}
              fill={T.pnl.loss}
              opacity={0.12}
            />
          ) : null}
          {s && yEntry != null && yTp != null ? (
            <Rect
              x={0}
              y={Math.min(yEntry, yTp)}
              width={latime}
              height={Math.abs(yTp - yEntry)}
              fill={T.pnl.gain}
              opacity={0.12}
            />
          ) : null}

          {/* ── Liniile de suport/rezistență ── */}
          {desene.linii.map((p, i) => (
            <React.Fragment key={`sr${i}`}>
              <Line
                x1={0}
                y1={forme.y(p)}
                x2={latime}
                y2={forme.y(p)}
                stroke={T.state.warn}
                strokeWidth={1.2}
                strokeDasharray={[6, 4]}
                opacity={0.85}
              />
              <SvgText
                x={4}
                y={forme.y(p) - 4}
                fill={T.state.warn}
                fontSize={9}
                fontFamily="SpaceGrotesk_500Medium"
              >
                {p.toFixed(zecimale)}
              </SvgText>
            </React.Fragment>
          ))}

          {/* ── Lumânările ── */}
          {forme.vizibile.map((c, i) => {
            const urca = c.close >= c.open;
            const culoare = urca ? T.pnl.gain : T.pnl.loss;
            const cx = forme.x(i);
            const susCorp = forme.y(Math.max(c.open, c.close));
            const josCorp = forme.y(Math.min(c.open, c.close));
            return (
              <React.Fragment key={`c${c.time}-${i}`}>
                <Line
                  x1={cx}
                  y1={forme.y(c.high)}
                  x2={cx}
                  y2={forme.y(c.low)}
                  stroke={culoare}
                  strokeWidth={1}
                  opacity={0.8}
                />
                <Rect
                  x={cx - forme.corp / 2}
                  y={susCorp}
                  width={forme.corp}
                  height={Math.max(1, josCorp - susCorp)}
                  fill={culoare}
                  opacity={0.95}
                />
              </React.Fragment>
            );
          })}

          {/* ── Tranzacțiile tale ── */}
          {marcaje.map((t) => {
            const cx = forme.laTimp(t.entryTime);
            const cy = forme.y(t.entryPrice);
            if (cy < 0 || cy > inaltime) return null;
            const cumparare = t.direction === "BUY";
            const c = cumparare ? T.pnl.gain : T.pnl.loss;
            return (
              <React.Fragment key={t.id}>
                <Line
                  x1={0}
                  y1={cy}
                  x2={latime}
                  y2={cy}
                  stroke={c}
                  strokeWidth={1}
                  strokeDasharray={[2, 5]}
                  opacity={0.4}
                />
                <Path
                  d={
                    cumparare
                      ? `M ${cx} ${cy - 5} L ${cx - 4} ${cy + 3} L ${cx + 4} ${cy + 3} Z`
                      : `M ${cx} ${cy + 5} L ${cx - 4} ${cy - 3} L ${cx + 4} ${cy - 3} Z`
                  }
                  fill={c}
                />
              </React.Fragment>
            );
          })}

          {/* ── Setup: cele trei linii, peste tot ── */}
          {s && yEntry != null ? (
            <LinieSetup y={yEntry} latime={latime} culoare={T.ink.i1} text={`ENTRY ${s.entry.toFixed(zecimale)}`} />
          ) : null}
          {ySl != null && s?.sl != null ? (
            <LinieSetup y={ySl} latime={latime} culoare={T.pnl.loss} text={`SL ${s.sl.toFixed(zecimale)}`} />
          ) : null}
          {yTp != null && s?.tp != null ? (
            <LinieSetup y={yTp} latime={latime} culoare={T.pnl.gain} text={`TP ${s.tp.toFixed(zecimale)}`} />
          ) : null}

          {/* ── Ultimul preț ── */}
          <Line
            x1={0}
            y1={yUltim}
            x2={latime}
            y2={yUltim}
            stroke={T.accent.base}
            strokeWidth={1}
            strokeDasharray={[1, 3]}
            opacity={0.55}
          />
        </Svg>
      </Animated.View>

      {/* Reperele de preț NU intră în transformare: dacă s-ar întinde odată cu
          graficul, cifrele ar deveni ilizibile exact când apropii. */}
      <View style={st.repere} pointerEvents="none">
        <Text style={st.reper}>{forme.max.toFixed(zecimale)}</Text>
        <Text style={st.reper}>{forme.min.toFixed(zecimale)}</Text>
      </View>
    </View>
  );
}

function LinieSetup({
  y, latime, culoare, text,
}: {
  y: number;
  latime: number;
  culoare: string;
  text: string;
}) {
  return (
    <>
      <Line x1={0} y1={y} x2={latime} y2={y} stroke={culoare} strokeWidth={1.4} />
      <SvgText
        x={latime - 4}
        y={y - 4}
        fill={culoare}
        fontSize={9}
        textAnchor="end"
        fontFamily="SpaceGrotesk_700Bold"
      >
        {text}
      </SvgText>
    </>
  );
}

const st = StyleSheet.create({
  repere: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    paddingVertical: 2,
    paddingLeft: 4,
  },
  reper: {
    color: T.ink.i4,
    fontSize: 9,
    fontFamily: "SpaceGrotesk_500Medium",
  },
});
