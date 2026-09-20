import * as React from "react";
import { Animated, View } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { T } from "../theme";

const PathAnimat = Animated.createAnimatedComponent(Path);

// ── Sparkline ────────────────────────────────────────────────────────────────
//
// Curbă mică, fără axe și fără etichete: forma contează, nu valorile.
//
// Se DESENEAZĂ de la stânga la dreapta la apariție, prin `strokeDashoffset` —
// diferența dintre un grafic lipit și un instrument care tocmai a măsurat ceva.
//
// Singurul loc din aplicație unde animația NU merge pe driverul nativ:
// `strokeDashoffset` e o proprietate SVG, nu una de layout sau de transformare.
// E o singură valoare, pe un singur element, deci costul e neglijabil — dar îl
// spun aici ca să nu pară scăpare.
//
// Lungimea drumului se APROXIMEAZĂ prin suma segmentelor, nu se măsoară:
// `getTotalLength` nu există în react-native-svg. Pentru o polilinie, suma
// segmentelor E lungimea exactă.

export interface SparklineProps {
  data: number[];
  latime?: number;
  inaltime?: number;
  culoare?: string;
  /** Umple aria de sub curbă cu un gradient care se stinge. */
  umplut?: boolean;
  /** Desenează linia la apariție. */
  traseaza?: boolean;
  intarziere?: number;
  grosime?: number;
}

export function Sparkline({
  data,
  latime = 96,
  inaltime = 32,
  culoare = T.accent.base,
  umplut = false,
  traseaza = true,
  intarziere = 0,
  grosime = 1.8,
}: SparklineProps) {
  const progres = React.useRef(new Animated.Value(traseaza ? 1 : 0)).current;

  const { drum, drumArie, lungime } = React.useMemo(() => {
    if (data.length < 2) return { drum: "", drumArie: "", lungime: 1 };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const interval = max - min || 1;
    const margine = grosime / 2 + 0.5;

    const puncte = data.map((v, i) => {
      const x = (i / (data.length - 1)) * latime;
      const y = inaltime - ((v - min) / interval) * (inaltime - margine * 2) - margine;
      return [x, y] as const;
    });

    let d = "";
    let L = 0;
    puncte.forEach((p, i) => {
      d += `${i === 0 ? "M" : "L"} ${p[0].toFixed(2)} ${p[1].toFixed(2)} `;
      if (i > 0) {
        const a = puncte[i - 1]!;
        L += Math.hypot(p[0] - a[0], p[1] - a[1]);
      }
    });

    return {
      drum: d.trim(),
      drumArie: `${d}L ${latime} ${inaltime} L 0 ${inaltime} Z`,
      lungime: Math.max(1, Math.ceil(L)),
    };
  }, [data, latime, inaltime, grosime]);

  React.useEffect(() => {
    if (!traseaza) return;
    progres.setValue(0);
    const a = Animated.timing(progres, {
      toValue: 1,
      duration: 820,
      delay: intarziere,
      useNativeDriver: false, // proprietate SVG — vezi nota de sus
    });
    a.start();
    return () => a.stop();
  }, [drum, traseaza, intarziere, progres]);

  if (data.length < 2) return <View style={{ width: latime, height: inaltime }} />;

  const deplasare = progres.interpolate({
    inputRange: [0, 1],
    outputRange: [lungime, 0],
  });

  // Id unic pe instanță: două curbe cu același id ar folosi amândouă primul
  // gradient definit.
  const idGrad = React.useId().replace(/[^a-zA-Z0-9]/g, "");

  return (
    <Svg width={latime} height={inaltime}>
      {umplut && (
        <>
          <Defs>
            <LinearGradient id={idGrad} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={culoare} stopOpacity={0.28} />
              <Stop offset="1" stopColor={culoare} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={drumArie} fill={`url(#${idGrad})`} />
        </>
      )}
      <PathAnimat
        d={drum}
        fill="none"
        stroke={culoare}
        strokeWidth={grosime}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={traseaza ? [lungime, lungime] : undefined}
        strokeDashoffset={traseaza ? (deplasare as unknown as number) : undefined}
      />
    </Svg>
  );
}
