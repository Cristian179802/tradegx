import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { Card, Badge } from "@/ui";
import { colors, spacing, radius, font } from "@/theme";

type Trade = {
  id: string;
  symbol: string;
  direction: "BUY" | "SELL";
  pnlMoney: number | null;
  status: "OPEN" | "CLOSED" | "CANCELLED";
  entryTime: string;
  account?: { currency?: string };
};

function money(v: number, ccy = "USD") {
  return `${v > 0 ? "+" : ""}${v.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${ccy}`;
}

export default function Journal() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = (await api.trades.list()) as { trades: Trade[] };
      setTrades(r.trades ?? []);
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

  if (loading) {
    return (
      <View style={st.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={st.root} edges={["top"]}>
      <View style={st.header}>
        <Text style={st.title}>Jurnal</Text>
        <Text style={st.sub}>{trades.length} tranzacții</Text>
      </View>
      <FlatList
        data={trades}
        keyExtractor={(t) => t.id}
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        ListEmptyComponent={
          <Card style={{ marginTop: spacing.xl, alignItems: "center", paddingVertical: spacing["2xl"] }}>
            <Ionicons name="book-outline" size={40} color={colors.textMuted} />
            <Text style={st.emptyTitle}>Jurnal gol</Text>
            <Text style={st.emptySub}>Tranzacțiile tale vor apărea aici.</Text>
          </Card>
        }
        renderItem={({ item: t }) => {
          const ccy = t.account?.currency ?? "USD";
          const open = t.status === "OPEN";
          return (
            <Card style={{ marginBottom: spacing.md }}>
              <View style={st.row}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <View style={[st.dot, { backgroundColor: t.direction === "BUY" ? colors.bull : colors.bear }]} />
                  <View>
                    <Text style={st.symbol}>{t.symbol}</Text>
                    <Text style={st.date}>{new Date(t.entryTime).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" })}</Text>
                  </View>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={[st.pnl, { color: (t.pnlMoney ?? 0) >= 0 ? colors.bull : colors.bear }]}>
                    {t.pnlMoney != null ? money(t.pnlMoney, ccy) : "—"}
                  </Text>
                  <Badge label={open ? "DESCHIS" : t.direction === "BUY" ? "LONG" : "SHORT"} tone={open ? "info" : t.direction === "BUY" ? "bull" : "bear"} />
                </View>
              </View>
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
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md },
  title: { color: colors.white, fontSize: font.size["2xl"], fontWeight: font.weight.heavy },
  sub: { color: colors.textMuted, fontSize: font.size.sm, marginTop: 2 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing["2xl"] * 2 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  symbol: { color: colors.text, fontSize: font.size.base, fontWeight: font.weight.bold },
  date: { color: colors.textMuted, fontSize: font.size.xs, marginTop: 2 },
  pnl: { fontSize: font.size.base, fontWeight: font.weight.bold },
  emptyTitle: { color: colors.text, fontSize: font.size.lg, fontWeight: font.weight.bold, marginTop: spacing.md },
  emptySub: { color: colors.textMuted, fontSize: font.size.sm, textAlign: "center", marginTop: spacing.sm },
});
