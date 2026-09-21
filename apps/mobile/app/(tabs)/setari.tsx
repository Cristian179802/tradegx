import * as React from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/lib/auth";
import { URL_API } from "../../src/lib/api";
import { Card } from "../../src/ui/Card";
import { Reveal } from "../../src/ui/Reveal";
import { T, ATINGERE_MIN } from "../../src/theme";

// ── Setări ───────────────────────────────────────────────────────────────────
//
// Ecranul ăsta e un INDEX, nu o a doua copie a setărilor. Conturile și
// regulile de risc au ecranele lor native, deci de aici se NAVIGHEAZĂ la ele —
// până azi erau linkuri spre web, adică al doilea drum spre același lucru,
// unul dintre ele afară din aplicație.
//
// Analytics, Backtesting și Academia au fost scoase de tot: sunt în meniul de
// jos, cu ecrane proprii. Un rând aici care le deschidea în browser era o
// urmă din vremea când aplicația n-avea decât șapte ecrane.
//
// Deconectarea CERE CONFIRMARE. E acțiunea care șterge sesiunea de pe telefon;
// un buton care o face din prima atingere, lângă altele, se apasă din greșeală.

export default function Setari() {
  const router = useRouter();
  const { utilizator, deconecteaza } = useAuth();
  const versiune = Constants.expoConfig?.version ?? "1.0.0";

  const deschide = React.useCallback(async (cale: string) => {
    Haptics.selectionAsync().catch(() => {});
    const url = `${URL_API}${cale}`;
    const poate = await Linking.canOpenURL(url);
    if (poate) Linking.openURL(url);
  }, []);

  const confirmaIesirea = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert(
      "Ieși din cont?",
      "Va trebui să te autentifici din nou pe telefonul ăsta.",
      [
        { text: "Rămân", style: "cancel" },
        { text: "Ieși", style: "destructive", onPress: () => void deconecteaza() },
      ],
    );
  }, [deconecteaza]);

  const initiale = (utilizator?.name ?? utilizator?.email ?? "?")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");

  return (
    <View style={st.radacina}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={st.continut} showsVerticalScrollIndicator={false}>
          <Text style={st.titlu}>Setări</Text>

          {/* ── Cine ești ── */}
          <Reveal intarziere={0}>
            <Card nivel={2}>
              <View style={st.randCont}>
                <View style={st.avatar}>
                  <Text style={st.initiale}>{initiale}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={st.nume} numberOfLines={1}>
                    {utilizator?.name || "Contul meu"}
                  </Text>
                  <Text style={st.email} numberOfLines={1}>{utilizator?.email}</Text>
                </View>
              </View>
            </Card>
          </Reveal>

          {/* ── Ce se face pe web ── */}
          <Text style={st.sectiune}>Administrare</Text>
          <Reveal intarziere={60}>
            <Card faraPadding>
              <Linie iconita="wallet-outline" text="Conturi de trading" onPress={() => router.push("/conturi")} nativ />
              <Separator />
              <Linie iconita="shield-checkmark-outline" text="Reguli și limite de risc" onPress={() => router.push("/risc")} nativ />
              <Separator />
              <Linie iconita="settings-outline" text="Toate setările" onPress={() => deschide("/settings")} />
              <Separator />
              <Linie iconita="card-outline" text="Abonament și facturare" onPress={() => deschide("/billing")} />
            </Card>
          </Reveal>

          {/* ── Legal, cerut și de Google Play ── */}
          <Text style={st.sectiune}>Informații</Text>
          <Reveal intarziere={180}>
            <Card faraPadding>
              <Linie iconita="lock-closed-outline" text="Politica de confidențialitate" onPress={() => deschide("/privacy")} />
              <Separator />
              <Linie iconita="document-text-outline" text="Termeni și condiții" onPress={() => deschide("/terms")} />
              <Separator />
              <Linie iconita="mail-outline" text="Contact" onPress={() => deschide("/contact")} />
            </Card>
          </Reveal>

          <Reveal intarziere={240} style={{ marginTop: T.spacing.xl }}>
            <Pressable onPress={confirmaIesirea} style={st.iesire} accessibilityRole="button">
              <Ionicons name="log-out-outline" size={19} color={T.pnl.loss} />
              <Text style={st.textIesire}>Ieși din cont</Text>
            </Pressable>
          </Reveal>

          <Text style={st.versiune}>TradeGx {versiune}</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Linie({
  iconita, text, onPress, nativ = false,
}: {
  iconita: React.ComponentProps<typeof Ionicons>["name"];
  text: string;
  onPress: () => void;
  /** Ecran în aplicație: săgeată de navigare, nu de ieșire în browser. */
  nativ?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [st.linie, pressed && st.linieApasata]}
      accessibilityRole={nativ ? "button" : "link"}
      accessibilityLabel={text}
    >
      <Ionicons name={iconita} size={19} color={nativ ? T.accent.base : T.ink.i3} />
      <Text style={st.textLinie}>{text}</Text>
      <Ionicons
        name={nativ ? "chevron-forward" : "open-outline"}
        size={15}
        color={T.ink.i4}
      />
    </Pressable>
  );
}

function Separator() {
  return <View style={st.separator} />;
}

const st = StyleSheet.create({
  radacina: { flex: 1, backgroundColor: T.surface.s0 },
  continut: { padding: T.spacing.lg, paddingBottom: 130 },
  titlu: {
    color: T.ink.i1, fontSize: T.fontSize.xl, fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.tight, marginBottom: T.spacing.lg,
  },
  randCont: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  avatar: {
    width: 46, height: 46, borderRadius: T.radius.full,
    alignItems: "center", justifyContent: "center",
    backgroundColor: T.accent.soft,
    borderWidth: StyleSheet.hairlineWidth, borderColor: T.accent.line,
  },
  initiale: { color: T.accent.base, fontSize: T.fontSize.base, fontWeight: "800" , fontFamily: "Inter_800ExtraBold" },
  nume: { color: T.ink.i1, fontSize: T.fontSize.base, fontWeight: "700" , fontFamily: "Inter_700Bold" },
  email: { color: T.ink.i4, fontSize: T.fontSize.xs, marginTop: 2 , fontFamily: "Inter_400Regular" },
  sectiune: {
    color: T.ink.i4, fontSize: T.fontSize.xs, fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
    textTransform: "uppercase", letterSpacing: T.tracking.wider,
    marginTop: T.spacing.xl, marginBottom: T.spacing.sm,
  },
  linie: {
    flexDirection: "row", alignItems: "center", gap: T.spacing.md,
    minHeight: ATINGERE_MIN,
    paddingHorizontal: T.spacing.lg,
  },
  linieApasata: { backgroundColor: T.surface.s3 },
  textLinie: { flex: 1, color: T.ink.i2, fontSize: T.fontSize.base , fontFamily: "Inter_400Regular" },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.line.l1,
    marginLeft: T.spacing.lg + 19 + T.spacing.md,
  },
  iesire: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: T.spacing.sm, minHeight: ATINGERE_MIN,
    borderRadius: T.radius.lg, borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(251,113,133,0.30)",
  },
  textIesire: { color: T.pnl.loss, fontSize: T.fontSize.base, fontWeight: "700" , fontFamily: "Inter_700Bold" },
  versiune: {
    color: T.ink.i4, fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    textAlign: "center", marginTop: T.spacing.xl,
  },
});
