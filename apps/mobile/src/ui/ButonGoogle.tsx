import * as React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { T, ATINGERE_MIN } from "../theme";

// ── Butonul „Continuă cu Google" ─────────────────────────────────────────────
//
// Sigla e cea oficială, în patru culori, desenată vectorial. Google cere ca
// marca să apară exact așa — nu monocrom, nu redesenată. E singurul loc din
// aplicație unde intră culori din afara paletei, și tocmai de aia butonul e
// neutru în rest: fundal de control, muchie subțire, fără accentul nostru.
//
// E aceeași formă ca pe site, ca să recunoști produsul când treci de pe un
// ecran pe altul.

function SiglaGoogle({ dimensiune = 17 }: { dimensiune?: number }) {
  return (
    <Svg width={dimensiune} height={dimensiune} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export function ButonGoogle({
  onPress,
  incarca = false,
  dezactivat = false,
  eticheta = "Continuă cu Google",
}: {
  onPress: () => void;
  incarca?: boolean;
  dezactivat?: boolean;
  eticheta?: string;
}) {
  const inactiv = dezactivat || incarca;

  return (
    <Pressable
      onPress={() => {
        if (inactiv) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      disabled={inactiv}
      style={({ pressed }) => [st.buton, pressed && st.apasat, inactiv && st.inactiv]}
      accessibilityRole="button"
      accessibilityLabel={eticheta}
      accessibilityState={{ disabled: inactiv, busy: incarca }}
    >
      <View style={st.continut}>
        {incarca ? <ActivityIndicator size="small" color={T.ink.i2} /> : <SiglaGoogle />}
        <Text style={st.text}>{incarca ? "Se deschide Google…" : eticheta}</Text>
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  buton: {
    minHeight: ATINGERE_MIN,
    borderRadius: T.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l2,
    backgroundColor: T.surface.s4,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: T.spacing.lg,
  },
  apasat: { backgroundColor: T.surface.s3, transform: [{ scale: 0.985 }] },
  inactiv: { opacity: 0.55 },
  continut: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  text: {
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontFamily: "Inter_700Bold",
  },
});
