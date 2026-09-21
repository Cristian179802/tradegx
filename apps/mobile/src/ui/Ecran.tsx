import * as React from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Text } from "./Text";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { T, ATINGERE_MIN } from "../theme";
import { Schelet } from "./Schelet";

// ── Carcasa unui ecran ───────────────────────────────────────────────────────
//
// Douăzeci și unu de ecrane înseamnă douăzeci și unu de ocazii să iasă un
// antet cu 2px diferență, o altă culoare de eroare, alt spațiu sub bară. De
// aceea forma stă AICI, o singură dată.
//
// Ce rezolvă, concret:
//   · spațiul de jos — bara plutește peste conținut; ultimul rând dintr-o
//     listă trebuie să rămână atins, nu ascuns sub ea
//   · tragerea de reîmprospătare, cu aceleași culori peste tot
//   · eroarea — un rând discret SUB conținut, nu un dialog care acoperă
//     cifrele pe care omul tocmai le citea
//   · scheletul, ca ecranul să aibă aceeași formă înainte și după date
//
// `AntetEcran` e exportat separat pentru ecranele care folosesc `FlatList`:
// acolo derularea o ține lista, nu carcasa, și un `ScrollView` în jurul ei ar
// strica virtualizarea — adică exact ce face lista utilă.

/** Înălțimea barei fără marginea de siguranță a telefonului. */
export const INALTIME_BARA = 64;

/**
 * Spațiul de sub conținut. Marginea de siguranță se adună peste, unde se
 * poate măsura: pe telefoanele cu navigare prin gesturi, ea singură e 24–48px,
 * iar fără ea ultimul rând dintr-o listă rămâne sub bară.
 */
export const SPATIU_BARA = 128;

export function AntetEcran({
  titlu,
  subtitlu,
  actiune,
  fara_inapoi,
}: {
  titlu: string;
  subtitlu?: string | null;
  actiune?: React.ReactNode;
  fara_inapoi?: boolean;
}) {
  const router = useRouter();
  const poateInapoi = !fara_inapoi && router.canGoBack();

  return (
    <View style={st.antet}>
      {poateInapoi ? (
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            router.back();
          }}
          style={st.inapoi}
          accessibilityRole="button"
          accessibilityLabel="Înapoi"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={T.ink.i2} />
        </Pressable>
      ) : null}

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={st.titlu} numberOfLines={1}>{titlu}</Text>
        {subtitlu ? (
          <Text style={st.subtitlu} numberOfLines={1}>{subtitlu}</Text>
        ) : null}
      </View>

      {actiune}
    </View>
  );
}

export interface EcranProps {
  titlu: string;
  subtitlu?: string | null;
  actiune?: React.ReactNode;
  children: React.ReactNode;
  /** Prima încărcare: arată schelet în locul conținutului. */
  incarca?: boolean;
  /** Numărul de dreptunghiuri din schelet, potrivit formei ecranului. */
  scheletRanduri?: number;
  reimprospateaza?: boolean;
  onReia?: () => void;
  eroare?: string | null;
  style?: StyleProp<ViewStyle>;
  /** Conținut lipit de jos, peste derulare (butoane de acțiune). */
  subsol?: React.ReactNode;
}

export function Ecran({
  titlu,
  subtitlu,
  actiune,
  children,
  incarca = false,
  scheletRanduri = 4,
  reimprospateaza = false,
  onReia,
  eroare,
  style,
  subsol,
}: EcranProps) {
  const jos = useSafeAreaInsets().bottom;

  return (
    <View style={st.radacina}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <AntetEcran titlu={titlu} subtitlu={subtitlu} actiune={actiune} />

        {incarca ? (
          <View style={st.continut}>
            {Array.from({ length: scheletRanduri }).map((_, i) => (
              <Schelet
                key={i}
                inaltime={i === 0 ? 120 : 78}
                raza={T.radius.xl}
                style={{ marginBottom: T.spacing.md }}
              />
            ))}
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[st.continut, style]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              onReia ? (
                <RefreshControl
                  refreshing={reimprospateaza}
                  onRefresh={onReia}
                  tintColor={T.accent.base}
                  colors={[T.accent.base]}
                  progressBackgroundColor={T.surface.s2}
                />
              ) : undefined
            }
          >
            {children}
            {eroare ? <Text style={st.eroare}>{eroare}</Text> : null}
          </ScrollView>
        )}

        {subsol ? (
          <View style={[st.subsol, { bottom: INALTIME_BARA + jos + T.spacing.sm }]}>
            {subsol}
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  radacina: { flex: 1, backgroundColor: T.surface.s0 },
  antet: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.sm,
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.sm,
    paddingBottom: T.spacing.md,
    minHeight: ATINGERE_MIN,
  },
  inapoi: {
    width: 34,
    height: 34,
    marginLeft: -8,
    borderRadius: T.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titlu: {
    color: T.ink.i1,
    fontSize: T.fontSize.xl,
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.tight,
  },
  subtitlu: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  continut: {
    paddingHorizontal: T.spacing.lg,
    paddingBottom: SPATIU_BARA,
  },
  eroare: {
    color: T.pnl.loss,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: T.spacing.lg,
  },
  subsol: {
    position: "absolute",
    left: T.spacing.lg,
    right: T.spacing.lg,
  },
});
