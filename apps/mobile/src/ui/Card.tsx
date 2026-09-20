import * as React from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { T, umbra } from "../theme";

// ── Cardul ───────────────────────────────────────────────────────────────────
//
// Echivalentul nativ al cardului din web: aceeași suprafață, aceeași muchie
// luminată sus, aceeași lumină de accent — doar că aici o aprinde ATINGEREA, nu
// cursorul. Pe telefon nu există hover; sistemul de pe web se oprea la
// `(hover: none)` exact din motivul ăsta.
//
// TREI LUCRURI DEODATĂ la apăsare, toate pe driverul nativ (deci pe firul de
// UI, nu pe cel de JavaScript — nu tremură nici când lista se reîncarcă):
//   1. suprafața se ridică ușor și se strânge cu 1%
//   2. lumina de accent apare de sub deget
//   3. muchia de sus se aprinde
//
// Plus o bătaie haptică foarte scurtă. Detaliul ăsta e ce separă o aplicație
// care „răspunde" de una care se simte moartă în mână.
//
// Fără `onPress`, cardul e doar suprafață: nu se apasă, nu vibrează, nu
// pretinde că e buton. Un card care arată apăsabil fără să facă nimic e o
// minciună de interfață.

const DURATA_APASARE = 90;
const DURATA_ELIBERARE = 260;

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Fără spațiu interior — pentru carduri care își gestionează singure marginile. */
  faraPadding?: boolean;
  /** Nivelul de umbră. 2 e implicit pentru un card pe fundalul paginii. */
  nivel?: 1 | 2 | 3;
  /** Culoarea muchiei de sus. Implicit accentul; P&L o poate schimba. */
  culoareMuchie?: string;
  accesibilEticheta?: string;
}

export function Card({
  children,
  onPress,
  onLongPress,
  style,
  faraPadding = false,
  nivel = 2,
  culoareMuchie,
  accesibilEticheta,
}: CardProps) {
  // Un singur `Animated.Value` conduce tot: scară, ridicare, lumină, muchie.
  // Alternativa — patru valori separate — ar însemna patru animații care pot
  // ieși din pas.
  const apasat = React.useRef(new Animated.Value(0)).current;

  const catre = React.useCallback(
    (valoare: number, durata: number) => {
      Animated.timing(apasat, {
        toValue: valoare,
        duration: durata,
        easing: valoare === 1 ? Easing.out(Easing.quad) : Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }).start();
    },
    [apasat],
  );

  const interactiv = Boolean(onPress || onLongPress);

  const scara = apasat.interpolate({ inputRange: [0, 1], outputRange: [1, 0.99] });
  const ridicare = apasat.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const opacLumina = apasat.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const opacMuchie = apasat.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  const continut = (
    <Animated.View
      style={[
        st.card,
        umbra(nivel),
        !faraPadding && st.padding,
        { transform: [{ scale: scara }, { translateY: ridicare }] },
        style,
      ]}
    >
      {/* Lumina de accent — sub conținut, peste fundal. */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, st.lumina, { opacity: opacLumina }]}
      />

      {/* Muchia de sus: linia care face suprafața să pară luminată, nu desenată. */}
      <Animated.View
        pointerEvents="none"
        style={[
          st.muchie,
          { opacity: opacMuchie, backgroundColor: culoareMuchie ?? T.accent.line },
        ]}
      />

      <View style={st.continut}>{children}</View>
    </Animated.View>
  );

  if (!interactiv) return continut;

  return (
    <Pressable
      onPressIn={() => {
        catre(1, DURATA_APASARE);
        // `Soft` e cel mai discret impact. `Medium` pe fiecare card ar obosi
        // mâna după zece atingeri.
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
      }}
      onPressOut={() => catre(0, DURATA_ELIBERARE)}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={accesibilEticheta}
    >
      {continut}
    </Pressable>
  );
}

const st = StyleSheet.create({
  card: {
    backgroundColor: T.surface.s2,
    borderRadius: T.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    overflow: "hidden",
  },
  padding: {
    padding: T.spacing.lg,
  },
  lumina: {
    backgroundColor: T.accent.soft,
  },
  muchie: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth * 2,
  },
  continut: {
    // Conținutul stă peste lumină fără să avem nevoie de reguli pe copii.
    zIndex: 1,
  },
});
