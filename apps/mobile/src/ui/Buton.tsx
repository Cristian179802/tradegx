import * as React from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
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
        {/* Conținutul își păstrează locul; indicatorul se suprapune. */}
        <View style={[st.rand, incarca && st.invizibil]}>
          {iconita}
          <Text style={[st.text, v.text]} numberOfLines={1}>
            {eticheta}
          </Text>
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
    fontWeight: "700",
    letterSpacing: T.tracking.normal,
  },
  inert: { opacity: 0.45 },
  invizibil: { opacity: 0 },
  centru: { flex: 1, alignItems: "center", justifyContent: "center" },
});
