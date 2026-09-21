import * as React from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Text } from "./Text";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { T, cifre } from "../theme";
import { RollingNumber } from "./RollingNumber";
import { Card } from "./Card";

// ── Piese mici, folosite peste tot ───────────────────────────────────────────
//
// Fiecare dintre ele apare în cel puțin patru ecrane. Scrise local, ar fi patru
// variante care se depărtează una de alta la prima modificare.

/* ── Rând de pastile (filtre, intervale, perioade) ────────────────────────── */

export function Segmente<V extends string>({
  valori,
  valoare,
  onSchimba,
  eticheta,
  style,
}: {
  valori: readonly { v: V; e: string }[];
  valoare: V;
  onSchimba: (v: V) => void;
  eticheta?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[st.segmente, style]}
      accessibilityLabel={eticheta}
    >
      {valori.map((o) => {
        const activ = o.v === valoare;
        return (
          <Pressable
            key={o.v}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onSchimba(o.v);
            }}
            style={[st.pastila, activ && st.pastilaActiva]}
            accessibilityRole="button"
            accessibilityState={{ selected: activ }}
          >
            <Text style={[st.textPastila, activ && st.textPastilaActiv]}>{o.e}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/* ── Stare goală ──────────────────────────────────────────────────────────── */

export function Gol({
  iconita = "ellipse-outline",
  titlu,
  text,
  actiune,
}: {
  iconita?: React.ComponentProps<typeof Ionicons>["name"];
  titlu: string;
  text?: string;
  actiune?: React.ReactNode;
}) {
  return (
    <Card style={{ marginTop: T.spacing.md }}>
      <View style={st.gol}>
        <View style={st.golIcon}>
          <Ionicons name={iconita} size={22} color={T.ink.i4} />
        </View>
        <Text style={st.golTitlu}>{titlu}</Text>
        {text ? <Text style={st.golText}>{text}</Text> : null}
        {actiune ? <View style={{ marginTop: T.spacing.md }}>{actiune}</View> : null}
      </View>
    </Card>
  );
}

/* ── Bară de progres ──────────────────────────────────────────────────────── */

export function BaraProgres({
  fractiune,
  culoare = T.accent.base,
  inaltime = 8,
  style,
}: {
  /** 0–1. Valorile din afara intervalului sunt tăiate, nu ignorate. */
  fractiune: number;
  culoare?: string;
  inaltime?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const f = Math.max(0, Math.min(1, Number.isFinite(fractiune) ? fractiune : 0));
  const p = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Lățimea nu merge pe driverul nativ; bara e un singur element, deci
    // costul pe firul de JavaScript e neglijabil.
    const a = Animated.timing(p, {
      toValue: f,
      duration: 700,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: false,
    });
    a.start();
    return () => a.stop();
  }, [f, p]);

  return (
    <View style={[{ height: inaltime, borderRadius: inaltime / 2 }, st.sina, style]}>
      <Animated.View
        style={{
          height: "100%",
          borderRadius: inaltime / 2,
          backgroundColor: culoare,
          width: p.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
        }}
      />
    </View>
  );
}

/* ── Cifră cu etichetă ────────────────────────────────────────────────────── */

export function Statistica({
  eticheta,
  valoare,
  culoare = T.ink.i1,
  marime = T.fontSize.lg,
  intarziere = 0,
  nota,
  style,
}: {
  eticheta: string;
  /** Deja formatată — formatarea ține de monedă, nu de animație. */
  valoare: string;
  culoare?: string;
  marime?: number;
  intarziere?: number;
  nota?: string | null;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      <Text style={st.statEticheta} numberOfLines={1}>{eticheta}</Text>
      <RollingNumber value={valoare} size={marime} color={culoare} intarziere={intarziere} />
      {nota ? <Text style={st.statNota} numberOfLines={1}>{nota}</Text> : null}
    </View>
  );
}

/** Grilă de statistici — două pe rând, ca să încapă pe ecranul îngust. */
export function GrilaStatistici({ children }: { children: React.ReactNode }) {
  return <View style={st.grila}>{children}</View>;
}

/* ── Insignă ──────────────────────────────────────────────────────────────── */

export function Insigna({
  text,
  culoare = T.accent.base,
  fundal,
  style,
}: {
  text: string;
  culoare?: string;
  fundal?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[st.insigna, { backgroundColor: fundal ?? T.surface.s4 }, style]}>
      <Text style={[st.textInsigna, { color: culoare }]} numberOfLines={1}>{text}</Text>
    </View>
  );
}

/* ── Rând cheie–valoare ───────────────────────────────────────────────────── */

export function Rand({
  cheie,
  valoare,
  culoare = T.ink.i1,
  numeric = true,
  style,
}: {
  cheie: string;
  valoare: string;
  culoare?: string;
  numeric?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[st.rand, style]}>
      <Text style={st.randCheie} numberOfLines={1}>{cheie}</Text>
      <Text
        style={[st.randValoare, numeric ? cifre : null, { color: culoare } as TextStyle]}
        numberOfLines={1}
      >
        {valoare}
      </Text>
    </View>
  );
}

/** Titlu de secțiune, deasupra unui grup de carduri. */
export function Sectiune({ titlu, nota }: { titlu: string; nota?: string }) {
  return (
    <View style={st.sectiune}>
      <Text style={st.sectiuneTitlu}>{titlu}</Text>
      {nota ? <Text style={st.sectiuneNota}>{nota}</Text> : null}
    </View>
  );
}

const st = StyleSheet.create({
  segmente: {
    flexDirection: "row",
    gap: T.spacing.sm,
    paddingVertical: T.spacing.md,
    paddingRight: T.spacing.lg,
  },
  pastila: {
    minHeight: 34,
    paddingHorizontal: T.spacing.lg,
    justifyContent: "center",
    borderRadius: T.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    backgroundColor: T.surface.s2,
  },
  pastilaActiva: { backgroundColor: T.accent.soft, borderColor: T.accent.line },
  textPastila: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_700Bold",
  },
  textPastilaActiv: { color: T.accent.base },

  gol: { alignItems: "center", paddingVertical: T.spacing.lg },
  golIcon: {
    width: 44,
    height: 44,
    borderRadius: T.radius.lg,
    backgroundColor: T.surface.s4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: T.spacing.md,
  },
  golTitlu: {
    color: T.ink.i2,
    fontSize: T.fontSize.base,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  golText: {
    color: T.ink.i4,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },

  sina: { backgroundColor: T.surface.s4, overflow: "hidden" },

  statEticheta: {
    color: T.ink.i4,
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: T.tracking.wider,
    marginBottom: 6,
  },
  statNota: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  grila: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: T.spacing.lg,
  },

  insigna: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: T.radius.sm,
    alignSelf: "flex-start",
  },
  textInsigna: {
    fontSize: 10,
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.wide,
    textTransform: "uppercase",
  },

  rand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: T.spacing.md,
    minHeight: 34,
  },
  randCheie: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    flexShrink: 1,
  },
  randValoare: {
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_700Bold",
  },

  sectiune: { marginTop: T.spacing.xl, marginBottom: T.spacing.sm },
  sectiuneTitlu: {
    color: T.ink.i4,
    fontSize: 10,
    fontFamily: "Inter_800ExtraBold",
    textTransform: "uppercase",
    letterSpacing: T.tracking.wider,
  },
  sectiuneNota: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
});
