import * as React from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Line, Path, Rect, Stop } from "react-native-svg";
import { T, tonPnl } from "../theme";
import type { DiagramDef } from "../lib/academia";

const PathAnimat = Animated.createAnimatedComponent(Path);
const RectAnimat = Animated.createAnimatedComponent(Rect);

// ── Grafice ──────────────────────────────────────────────────────────────────
//
// Patru forme, atât: curbă, bare, con de probabilitate, histogramă. Sunt
// singurele de care are nevoie aplicația, iar a împacheta o bibliotecă de
// grafice pentru patru forme ar fi însemnat un megaoctet în plus și un strat
// de configurare între mine și pixeli.
//
// REGULA DE CULOARE, aceeași ca pe web: verde și roșu NUMAI pentru P&L. Un
// grafic de rată de câștig e pe accent, chiar dacă „ar merge" verde — altfel
// ochiul învață că verde înseamnă bine, apoi vede verde pe o pierdere și nu
// mai crede niciuna.
//
// TOATE ANIMAȚIILE AICI TREC PRIN FIRUL DE JAVASCRIPT. `strokeDashoffset`,
// `height` și `y` sunt proprietăți SVG, nu transformări — driverul nativ nu le
// poate atinge. De aceea graficele desenează O SINGURĂ DATĂ, la apariție, și
// nu se reanimează la fiecare reîmprospătare.

/* ── Curbă ────────────────────────────────────────────────────────────────── */

export function Curba({
  date,
  latime,
  inaltime = 150,
  culoare = T.accent.base,
  umplut = true,
  /** Linia de referință (ex. soldul inițial). */
  referinta,
  intarziere = 120,
}: {
  date: number[];
  latime: number;
  inaltime?: number;
  culoare?: string;
  umplut?: boolean;
  referinta?: number | null;
  intarziere?: number;
}) {
  const p = React.useRef(new Animated.Value(0)).current;
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");

  const { drum, arie, lungime, yRef } = React.useMemo(() => {
    if (date.length < 2 || latime <= 0) {
      return { drum: "", arie: "", lungime: 1, yRef: null as number | null };
    }
    const valori = referinta == null ? date : [...date, referinta];
    const min = Math.min(...valori);
    const max = Math.max(...valori);
    const interval = max - min || 1;
    const m = 3;
    const la = (v: number) => inaltime - ((v - min) / interval) * (inaltime - m * 2) - m;

    let d = "";
    let L = 0;
    let ax = 0;
    let ay = 0;
    date.forEach((v, i) => {
      const x = (i / (date.length - 1)) * latime;
      const y = la(v);
      d += `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)} `;
      if (i > 0) L += Math.hypot(x - ax, y - ay);
      ax = x; ay = y;
    });

    return {
      drum: d.trim(),
      arie: `${d}L ${latime} ${inaltime} L 0 ${inaltime} Z`,
      lungime: Math.max(1, Math.ceil(L)),
      yRef: referinta == null ? null : la(referinta),
    };
  }, [date, latime, inaltime, referinta]);

  React.useEffect(() => {
    p.setValue(0);
    const a = Animated.timing(p, {
      toValue: 1,
      duration: 900,
      delay: intarziere,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: false,
    });
    a.start();
    return () => a.stop();
  }, [drum, intarziere, p]);

  if (!drum) return <View style={{ width: Math.max(0, latime), height: inaltime }} />;

  const deplasare = p.interpolate({ inputRange: [0, 1], outputRange: [lungime, 0] });

  return (
    <Svg width={latime} height={inaltime}>
      {umplut ? (
        <>
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={culoare} stopOpacity={0.24} />
              <Stop offset="1" stopColor={culoare} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={arie} fill={`url(#${id})`} />
        </>
      ) : null}

      {yRef != null ? (
        <Line
          x1={0}
          y1={yRef}
          x2={latime}
          y2={yRef}
          stroke={T.line.l2}
          strokeWidth={1}
          strokeDasharray={[3, 4]}
        />
      ) : null}

      <PathAnimat
        d={drum}
        fill="none"
        stroke={culoare}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={[lungime, lungime]}
        strokeDashoffset={deplasare as unknown as number}
      />
    </Svg>
  );
}

/* ── Bare ─────────────────────────────────────────────────────────────────── */

export interface Bara {
  eticheta: string;
  valoare: number;
}

export function Bare({
  date,
  latime,
  inaltime = 130,
  /** Colorează după semn (P&L). Altfel, totul pe accent. */
  dupaSemn = false,
  culoare = T.accent.base,
  maxEtichete = 8,
}: {
  date: Bara[];
  latime: number;
  inaltime?: number;
  dupaSemn?: boolean;
  culoare?: string;
  maxEtichete?: number;
}) {
  const p = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    p.setValue(0);
    const a = Animated.timing(p, {
      toValue: 1,
      duration: 760,
      delay: 140,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: false,
    });
    a.start();
    return () => a.stop();
  }, [date, p]);

  if (date.length === 0 || latime <= 0) {
    return <View style={{ width: Math.max(0, latime), height: inaltime }} />;
  }

  const areNegative = date.some((d) => d.valoare < 0);
  const maxAbs = Math.max(...date.map((d) => Math.abs(d.valoare)), 1e-9);
  const pas = latime / date.length;
  const grosime = Math.max(3, Math.min(26, pas * 0.62));
  // Cu valori negative, zeroul stă la mijloc; fără ele, jos.
  const zero = areNegative ? inaltime / 2 : inaltime;
  const disponibil = areNegative ? inaltime / 2 - 2 : inaltime - 2;

  return (
    <View style={{ width: latime }}>
      <Svg width={latime} height={inaltime}>
        <Line x1={0} y1={zero} x2={latime} y2={zero} stroke={T.line.l1} strokeWidth={1} />
        {date.map((d, i) => {
          const h = (Math.abs(d.valoare) / maxAbs) * disponibil;
          const x = i * pas + (pas - grosime) / 2;
          const pozitiv = d.valoare >= 0;
          const c = dupaSemn ? (d.valoare === 0 ? T.ink.i4 : tonPnl(d.valoare)) : culoare;
          const inaltimeAnimata = p.interpolate({ inputRange: [0, 1], outputRange: [0, h] });
          const yAnimat = p.interpolate({
            inputRange: [0, 1],
            outputRange: [zero, pozitiv ? zero - h : zero],
          });
          return (
            <RectAnimat
              key={`${d.eticheta}-${i}`}
              x={x}
              y={yAnimat as unknown as number}
              width={grosime}
              height={inaltimeAnimata as unknown as number}
              rx={Math.min(3, grosime / 2)}
              fill={c}
              opacity={0.9}
            />
          );
        })}
      </Svg>

      {date.length <= maxEtichete ? (
        <View style={[st.etichete, { width: latime }]}>
          {date.map((d, i) => (
            <Text key={`${d.eticheta}-e-${i}`} style={[st.eticheta, { width: pas }]} numberOfLines={1}>
              {d.eticheta}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/* ── Conul Monte Carlo ────────────────────────────────────────────────────── */

export function Con({
  con,
  latime,
  inaltime = 170,
  /** Nivelul de start, pentru linia de referință (100 = echitate inițială). */
  start = 100,
}: {
  con: { p5: number[]; p25: number[]; p50: number[]; p75: number[]; p95: number[] };
  latime: number;
  inaltime?: number;
  start?: number;
}) {
  const p = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    p.setValue(0);
    const a = Animated.timing(p, {
      toValue: 1,
      duration: 820,
      delay: 100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    a.start();
    return () => a.stop();
  }, [con, p]);

  const forme = React.useMemo(() => {
    const n = con.p50.length;
    if (n < 2 || latime <= 0) return null;
    const toate = [...con.p5, ...con.p95, start];
    const min = Math.min(...toate);
    const max = Math.max(...toate);
    const interval = max - min || 1;
    const m = 4;
    const x = (i: number) => (i / (n - 1)) * latime;
    const y = (v: number) => inaltime - ((v - min) / interval) * (inaltime - m * 2) - m;

    const banda = (sus: number[], jos: number[]) => {
      let d = "";
      sus.forEach((v, i) => { d += `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)} `; });
      for (let i = jos.length - 1; i >= 0; i--) d += `L ${x(i).toFixed(1)} ${y(jos[i]!).toFixed(1)} `;
      return `${d}Z`;
    };

    let mediana = "";
    con.p50.forEach((v, i) => { mediana += `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)} `; });

    return {
      larga: banda(con.p95, con.p5),
      stramta: banda(con.p75, con.p25),
      mediana: mediana.trim(),
      yStart: y(start),
    };
  }, [con, latime, inaltime, start]);

  if (!forme) return <View style={{ width: Math.max(0, latime), height: inaltime }} />;

  return (
    <Animated.View style={{ opacity: p }}>
      <Svg width={latime} height={inaltime}>
        {/* Două benzi, nu cinci linii: ochiul citește „cât de larg e viitorul",
            nu cinci curbe pe care le-ar compara una cu alta. */}
        <Path d={forme.larga} fill={T.accent.base} opacity={0.1} />
        <Path d={forme.stramta} fill={T.accent.base} opacity={0.18} />
        <Line
          x1={0}
          y1={forme.yStart}
          x2={latime}
          y2={forme.yStart}
          stroke={T.line.l2}
          strokeWidth={1}
          strokeDasharray={[3, 4]}
        />
        <Path d={forme.mediana} fill="none" stroke={T.accent.base} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

/* ── Histogramă ───────────────────────────────────────────────────────────── */

export function Histograma({
  valori,
  latime,
  inaltime = 120,
  /** Pragul peste care coloanele se colorează ca profit. */
  prag = 100,
  cosuri = 24,
}: {
  valori: number[];
  latime: number;
  inaltime?: number;
  prag?: number;
  cosuri?: number;
}) {
  const forme = React.useMemo(() => {
    if (valori.length === 0 || latime <= 0) return null;
    const min = Math.min(...valori);
    const max = Math.max(...valori);
    const interval = (max - min) / cosuri || 1;
    const numar = new Array<number>(cosuri).fill(0);
    for (const v of valori) {
      const i = Math.min(cosuri - 1, Math.max(0, Math.floor((v - min) / interval)));
      numar[i] = (numar[i] ?? 0) + 1;
    }
    const varf = Math.max(...numar, 1);
    return { numar, min, interval, varf };
  }, [valori, latime, cosuri]);

  if (!forme) return <View style={{ width: Math.max(0, latime), height: inaltime }} />;

  const pas = latime / cosuri;

  return (
    <Svg width={latime} height={inaltime}>
      {forme.numar.map((n, i) => {
        const h = (n / forme.varf) * (inaltime - 2);
        const mijloc = forme.min + (i + 0.5) * forme.interval;
        return (
          <Rect
            key={i}
            x={i * pas + 0.5}
            y={inaltime - h}
            width={Math.max(1, pas - 1.5)}
            height={h}
            rx={1.5}
            fill={mijloc >= prag ? T.pnl.gain : T.pnl.loss}
            opacity={0.55}
          />
        );
      })}
    </Svg>
  );
}

/** Măsoară lățimea disponibilă — graficele au nevoie de pixeli, nu de procente. */
export function useLatime(): [number, (e: { nativeEvent: { layout: { width: number } } }) => void] {
  const [l, setL] = React.useState(0);
  const la = React.useCallback(
    (e: { nativeEvent: { layout: { width: number } } }) => {
      const w = Math.floor(e.nativeEvent.layout.width);
      setL((vechi) => (Math.abs(vechi - w) > 1 ? w : vechi));
    },
    [],
  );
  return [l, la];
}

const st = StyleSheet.create({
  etichete: { flexDirection: "row", marginTop: 6 },
  eticheta: {
    color: T.ink.i4,
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});

/* ── Diagrama unei lecții ─────────────────────────────────────────────────── */

/** Traseu SVG dintr-o serie cu pauze: fiecare pauză începe o bucată nouă. */
function construieste(
  serie: (number | null)[],
  x: (i: number) => number,
  y: (v: number) => number,
): string {
  let d = "";
  let rupt = true;
  serie.forEach((v, i) => {
    if (v == null) { rupt = true; return; }
    d += `${rupt ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)} `;
    rupt = false;
  });
  return d.trim();
}

/**
 * Diagramele Academiei sunt DATE, nu imagini: lumânări normalizate 0..100, cu
 * niveluri, zone, săgeți și etichete peste ele. Aceleași date desenează figura
 * pe site și aici — deci o corectură într-o lecție ajunge în amândouă locurile
 * fără să exporte nimeni un PNG.
 *
 * Axa verticală e inversată față de cum vine: în date, 0 e jos.
 */
export function Diagrama({
  def,
  latime,
  inaltime = 190,
}: {
  def: DiagramDef;
  latime: number;
  inaltime?: number;
}) {
  if (latime <= 0 || def.candles.length === 0) {
    return <View style={{ width: Math.max(0, latime), height: inaltime }} />;
  }

  const n = def.candles.length;
  const pas = latime / n;
  const corp = Math.max(2, Math.min(14, pas * 0.6));
  const m = 8;
  const y = (v: number) => inaltime - (v / 100) * (inaltime - m * 2) - m;
  const x = (i: number) => i * pas + pas / 2;

  return (
    <Svg width={latime} height={inaltime}>
      {(def.zones ?? []).map((z, i) => {
        const x1 = z.x1 != null ? x(z.x1) - pas / 2 : 0;
        const x2 = z.x2 != null ? x(z.x2) + pas / 2 : latime;
        const sus = y(Math.max(z.y1, z.y2));
        const jos = y(Math.min(z.y1, z.y2));
        return (
          <Rect
            key={`z${i}`}
            x={x1}
            y={sus}
            width={Math.max(1, x2 - x1)}
            height={Math.max(1, jos - sus)}
            fill={z.color ?? T.accent.base}
            opacity={0.14}
          />
        );
      })}

      {(def.levels ?? []).map((l, i) => (
        <Line
          key={`l${i}`}
          x1={0}
          y1={y(l.y)}
          x2={latime}
          y2={y(l.y)}
          stroke={l.color ?? T.line.l2}
          strokeWidth={1}
          strokeDasharray={l.dashed === false ? undefined : [3, 4]}
        />
      ))}

      {(def.trend ?? []).map((t, i) => (
        <Line
          key={`t${i}`}
          x1={x(t.x1)}
          y1={y(t.y1)}
          x2={x(t.x2)}
          y2={y(t.y2)}
          stroke={t.color ?? T.ink.i4}
          strokeWidth={1.4}
          strokeDasharray={t.dashed ? [4, 4] : undefined}
        />
      ))}

      {def.candles.map((c, i) => {
        if (c.hidden) return null;
        const urca = c.c >= c.o;
        const culoare = urca ? T.pnl.gain : T.pnl.loss;
        const cx = x(i);
        const sus = y(Math.max(c.o, c.c));
        const jos = y(Math.min(c.o, c.c));
        return (
          <React.Fragment key={`c${i}`}>
            <Line x1={cx} y1={y(c.h)} x2={cx} y2={y(c.l)} stroke={culoare} strokeWidth={1} opacity={0.8} />
            <Rect
              x={cx - corp / 2}
              y={sus}
              width={corp}
              height={Math.max(1.5, jos - sus)}
              rx={1.5}
              fill={culoare}
              opacity={0.92}
            />
          </React.Fragment>
        );
      })}

      {def.line ? (
        <Path
          // O pauză (`null`) RUPE traseul: punctul de după ea începe cu `M`,
          // nu cu `L`. Altfel s-ar trage o linie dreaptă peste zona în care
          // indicatorul încă n-are valoare — exact greșeala pe care o explică
          // lecția despre medii mobile.
          d={construieste(def.line, x, y)}
          fill="none"
          stroke={T.accent.base}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}

      {(def.arrows ?? []).map((a, i) => {
        const cx = x(a.x);
        const cy = y(a.y);
        const d = a.dir === "up" ? 1 : -1;
        const c = a.color ?? (a.dir === "up" ? T.pnl.gain : T.pnl.loss);
        return (
          <Path
            key={`a${i}`}
            d={`M ${cx} ${cy} L ${cx - 4} ${cy + d * 8} L ${cx + 4} ${cy + d * 8} Z`}
            fill={c}
          />
        );
      })}
    </Svg>
  );
}
