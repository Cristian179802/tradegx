import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { Card, PressableScale } from "@/ui";
import { colors, spacing, radius, font } from "@/theme";

type Alert = {
  id: string;
  type?: string;
  title?: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
};

// Mapează tipul alertei la icon + culoare
function alertVisual(type?: string): { icon: keyof typeof Ionicons.glyphMap; color: string } {
  const t = (type ?? "").toLowerCase();
  if (t.includes("loss") || t.includes("drawdown") || t.includes("risk")) return { icon: "warning", color: colors.bear };
  if (t.includes("signal") || t.includes("hps")) return { icon: "pulse", color: colors.primary };
  if (t.includes("goal") || t.includes("win") || t.includes("target")) return { icon: "trophy", color: colors.bull };
  if (t.includes("news") || t.includes("event")) return { icon: "newspaper", color: colors.info };
  return { icon: "notifications", color: colors.warn };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "acum";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}z`;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = (await api.alerts.list()) as { alerts: Alert[] };
      setAlerts(r.alerts ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markAll() {
    try {
      await api.alerts.markAllRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return (
      <View style={st.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const hasUnread = alerts.some((a) => !a.isRead);

  return (
    <SafeAreaView style={st.root} edges={["top"]}>
      <View style={st.header}>
        <Text style={st.title}>Alerte</Text>
        {hasUnread && (
          <PressableScale onPress={markAll}>
            <Text style={st.markAll}>Marchează citite</Text>
          </PressableScale>
        )}
      </View>
      <FlatList
        data={alerts}
        keyExtractor={(a) => a.id}
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        ListEmptyComponent={
          <Card style={{ marginTop: spacing.xl, alignItems: "center", paddingVertical: spacing["2xl"] }}>
            <Ionicons name="notifications-off-outline" size={40} color={colors.textMuted} />
            <Text style={st.emptyTitle}>Nicio alertă</Text>
            <Text style={st.emptySub}>Alertele despre semnale HPS, risc și obiective vor apărea aici.</Text>
          </Card>
        }
        renderItem={({ item: a }) => {
          const v = alertVisual(a.type);
          return (
            <Card style={[{ marginBottom: spacing.md, flexDirection: "row", gap: spacing.md, alignItems: "flex-start" }, !a.isRead && st.unread]}>
              <View style={[st.iconWrap, { backgroundColor: v.color + "22" }]}>
                <Ionicons name={v.icon} size={20} color={v.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={st.rowTop}>
                  <Text style={st.alertTitle}>{a.title ?? a.type ?? "Alertă"}</Text>
                  <Text style={st.time}>{timeAgo(a.createdAt)}</Text>
                </View>
                {a.message && <Text style={st.message}>{a.message}</Text>}
              </View>
              {!a.isRead && <View style={st.unreadDot} />}
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md },
  title: { color: colors.white, fontSize: font.size["2xl"], fontWeight: font.weight.heavy },
  markAll: { color: colors.primary, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing["2xl"] * 2 },
  unread: { borderColor: colors.primary + "55" },
  iconWrap: { width: 40, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  alertTitle: { color: colors.text, fontSize: font.size.base, fontWeight: font.weight.bold, flex: 1 },
  time: { color: colors.textMuted, fontSize: font.size.xs },
  message: { color: colors.textMuted, fontSize: font.size.sm, lineHeight: 19, marginTop: 3 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, position: "absolute", top: spacing.md, right: spacing.md },
  emptyTitle: { color: colors.text, fontSize: font.size.lg, fontWeight: font.weight.bold, marginTop: spacing.md },
  emptySub: { color: colors.textMuted, fontSize: font.size.sm, textAlign: "center", marginTop: spacing.sm, paddingHorizontal: spacing.md, lineHeight: 20 },
});
