import { View, Text, ScrollView, StyleSheet, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useAuth } from "@/lib/auth";
import { API_URL } from "@/lib/api";
import { Card, Button, PressableScale } from "@/ui";
import { colors, spacing, radius, font } from "@/theme";

type Row = { icon: keyof typeof Ionicons.glyphMap; label: string; href?: string; color?: string };

const rows: Row[] = [
  { icon: "flag-outline", label: "Obiective", href: "/goals" },
  { icon: "wallet-outline", label: "Conturi broker", href: "/accounts" },
  { icon: "stats-chart-outline", label: "Analize complete", href: "/analytics" },
  { icon: "flask-outline", label: "Backtesting", href: "/backtesting" },
  { icon: "globe-outline", label: "Deschide pe web", href: "" },
];

export default function Settings() {
  const { user, logout } = useAuth();
  const initial = (user?.name ?? user?.email ?? "T").charAt(0).toUpperCase();

  return (
    <SafeAreaView style={st.root} edges={["top"]}>
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        <Text style={st.title}>Setări</Text>

        {/* Profil */}
        <Card style={st.profile}>
          <View style={st.avatar}>
            <Text style={st.avatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.name}>{user?.name ?? "Trader"}</Text>
            <Text style={st.email}>{user?.email}</Text>
          </View>
        </Card>

        {/* Opțiuni */}
        <Card padded={false} style={{ marginTop: spacing.lg }}>
          {rows.map((r, i) => (
            <PressableScale
              key={r.label}
              onPress={() => Linking.openURL(`${API_URL}${r.href ?? ""}`)}
              style={[st.row, i < rows.length - 1 && st.rowBorder]}
            >
              <View style={st.rowLeft}>
                <Ionicons name={r.icon} size={20} color={colors.textMuted} />
                <Text style={st.rowLabel}>{r.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </PressableScale>
          ))}
        </Card>

        <View style={{ marginTop: spacing.xl }}>
          <Button label="Deconectează-te" variant="secondary" icon="log-out-outline" onPress={logout} />
        </View>

        <Text style={st.version}>TradeGx v{Constants.expoConfig?.version ?? "1.0.0"}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, paddingBottom: spacing["2xl"] * 2 },
  title: { color: colors.white, fontSize: font.size["2xl"], fontWeight: font.weight.heavy, marginBottom: spacing.lg },
  profile: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  avatar: { width: 56, height: 56, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.white, fontSize: font.size.xl, fontWeight: font.weight.heavy },
  name: { color: colors.white, fontSize: font.size.lg, fontWeight: font.weight.bold },
  email: { color: colors.textMuted, fontSize: font.size.sm, marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  rowLabel: { color: colors.text, fontSize: font.size.base, fontWeight: font.weight.medium },
  version: { color: colors.textMuted, fontSize: font.size.xs, textAlign: "center", marginTop: spacing.xl },
});
