import * as React from "react";
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { T } from "../theme";

// ── Schelet de încărcare ─────────────────────────────────────────────────────
//
// Ca pe web: nu pulsează, e MĂTURAT de o linie de lumină.
//
// Pulsul spune „mai așteaptă” — un semnal pasiv care după două secunde începe
// să semene cu ceva blocat. Linia care mătură spune „se măsoară”: are direcție,
// deci are progres.

export function Schelet({
  latime,
  inaltime,
  raza = T.radius.md,
  style,
}: {
  latime?: number | `${number}%`;
  inaltime: number;
  raza?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const p = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const bucla = Animated.loop(
      Animated.timing(p, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );
    bucla.start();
    return () => bucla.stop();
  }, [p]);

  return (
    <View
      style={[
        { width: latime ?? "100%", height: inaltime, borderRadius: raza },
        st.baza,
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          st.matura,
          {
            transform: [
              {
                translateX: p.interpolate({
                  inputRange: [0, 1],
                  // Pornește complet în afara cadrului și iese complet — altfel
                  // se vede cum apare și dispare, în loc să treacă.
                  outputRange: [-260, 260],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

const st = StyleSheet.create({
  baza: {
    backgroundColor: T.surface.s3,
    overflow: "hidden",
  },
  matura: {
    backgroundColor: T.accent.soft,
  },
});
