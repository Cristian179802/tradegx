import * as React from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Text } from "./Text";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { T, ATINGERE_MIN, umbra } from "../theme";

// ── Buton ────────────────────────────────────────────────────────────────────
//
// Trei variante, nu opt. Fiecare variantă în plus e o decizie pe care o mută pe
// cel care scrie ecranul; trei acoperă tot: acțiunea principală, una secundară,
// una distructivă.
//
// Înălțimea minimă e 48 — maximul dintre pragul Apple (44) și cel Material (48).
// Un buton pe care nu-l nimerești din prima e un defect.
//
// În starea de încărcare butonul își PĂSTREAZĂ lățimea: dacă s-ar strânge în
// jurul indicatorului, tot ecranul ar sări la fiecare apăsare.

type Varianta = "principal" | "secundar" | "distructiv";

export interface ButonProps {
  eticheta: string;
  onPress?: () => void;
  varianta?: Varianta;
  incarca?: boolean;
  dezactivat?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Ocupă toată lățimea disponibilă. */
  plin?: boolean;
  iconita?: React.ReactNode;
  /** Iconița după etichetă (săgeată de „mergi mai departe"), nu înaintea ei. */
  iconitaLaDreapta?: boolean;
  /**
   * Degrade indigo→violet, ca butonul principal de pe site. Doar pentru
   * acțiunea cea mai importantă de pe ecran — dacă apar două pe același ecran,
   * niciunul nu mai e cel important.
   */
  degrade?: boolean;
}

export function Buton({
  eticheta,
  onPress,
  varianta = "principal",
  incarca = false,
  dezactivat = false,
  style,
  plin = false,
  iconita,
  iconitaLaDreapta = false,
  degrade = false,
}: ButonProps) {
  const p = React.useRef(new Animated.Value(0)).current;
  const inert = dezactivat || incarca;

  const catre = (v: number) =>
    Animated.timing(p, {
      toValue: v,
      duration: v === 1 ? 80 : 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

  const v = VARIANTE[varianta];

  return (
    <Pressable
      onPressIn={() => {
        if (inert) return;
        catre(1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }}
      onPressOut={() => catre(0)}
      onPress={inert ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={eticheta}
      accessibilityState={{ disabled: inert, busy: incarca }}
      style={plin ? { width: "100%" } : undefined}
    >
      <Animated.View
        style={[
          st.baza,
          v.container,
          degrade && st.faraFundal,
          varianta === "principal" && umbra(1),
          inert && st.inert,
          {
            transform: [
              { scale: p.interpolate({ inputRange: [0, 1], outputRange: [1, 0.975] }) },
            ],
          },
          style,
        ]}
      >
        {degrade ? (
          <LinearGradient
            colors={["#6d75f6", "#8b5cf6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}

        {/* Conținutul își păstrează locul; indicatorul se suprapune. */}
        <View style={[st.rand, incarca && st.invizibil]}>
          {iconitaLaDreapta ? null : iconita}
          <Text style={[st.text, v.text]} numberOfLines={1}>
            {eticheta}
          </Text>
          {iconitaLaDreapta ? iconita : null}
        </View>
        {incarca && (
          <View style={StyleSheet.absoluteFill}>
            <View style={st.centru}>
              <ActivityIndicator size="small" color={v.text.color} />
            </View>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const VARIANTE: Record<Varianta, { container: ViewStyle; text: { color: string } }> = {
  principal: {
    container: { backgroundColor: T.accent.base, borderColor: T.accent.base },
    text: { color: "#ffffff" },
  },
  secundar: {
    container: { backgroundColor: T.surface.s3, borderColor: T.line.l2 },
    text: { color: T.ink.i1 },
  },
  distructiv: {
    container: { backgroundColor: "transparent", borderColor: T.pnl.loss },
    text: { color: T.pnl.loss },
  },
};

const st = StyleSheet.create({
  // Degradeul e un strat dedesubt; fundalul variantei ar acoperi o parte din el.
  faraFundal: { backgroundColor: "transparent", borderColor: "transparent", overflow: "hidden" },
  baza: {
    minHeight: ATINGERE_MIN,
    paddingHorizontal: T.spacing.xl,
    borderRadius: T.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  rand: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.sm,
  },
  text: {
    fontSize: T.fontSize.base,
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.normal,
  },
  inert: { opacity: 0.45 },
  invizibil: { opacity: 0 },
  centru: { flex: 1, alignItems: "center", justifyContent: "center" },
});
