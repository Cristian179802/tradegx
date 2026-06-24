import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, StatCard, Badge, SectionTitle, PressableScale } from "@/ui";
import { EquityChart } from "@/components/EquityChart";
import { colors, spacing, radius, font } from "@/theme";

type Summary = {
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  profitFactor: number | null;
  maxDrawdown: number;
  avgRR: number;
  bestTrade: number;
  worstTrade: number;
};
type Overview = {
  empty: boolean;
  currency?: string;
  summary?: Summary;
  equityCurve?: { date: string | null; balance: number }[];
};
type Trade = {
  id: string;
  symbol: string;
  direction: "BUY" | "SELL";
  pnlMoney: number | null;
  status: string;
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bună dimineața";
  if (h < 18) return "Bună ziua";
  return "Bună seara";
}

function money(v: number, ccy = "USD") {
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${ccy}`;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const [ov, setOv] = useState<Overview | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [overview, tr] = await Promise.all([
        api.analytics.overview() as Promise<Overview>,
        api.trades.list() as Promise<{ trades: Trade[] }>,
      ]);
      setOv(overview);
      setTrades(tr.trades?.slice(0, 5) ?? []);
    } catch {
      /* păstrăm ce avem */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={st.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const s = ov?.summary;
  const ccy = ov?.currency ?? "USD";
  const curve = ov?.equityCurve?.map((p) => p.balance) ?? [];
  const pnlTone = (s?.totalPnl ?? 0) >= 0 ? "bull" : "bear";

  return (
    <SafeAreaView style={st.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={st.header}>
          <View>
            <Text style={st.greeting}>{greeting()},</Text>
            <Text style={st.name}>{user?.name ?? "Trader"} 👋</Text>
          </View>
          <PressableScale onPress={logout} style={st.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color={colors.textMuted} />
          </PressableScale>
        </View>

        {ov?.empty || !s ? (
          <Card style={{ marginTop: spacing.xl, alignItems: "center", paddingVertical: spacing["2xl"] }}>
            <Ionicons name="bar-chart-outline" size={40} color={colors.textMuted} />
            <Text style={st.emptyTitle}>Încă nicio tranzacție</Text>
            <Text style={st.emptySub}>Conectează-ți contul de broker sau adaugă o tranzacție ca să vezi statisticile.</Text>
          </Card>
        ) : (
          <>
            {/* KPI grid */}
            <Animated.View entering={FadeInDown.duration(400)} style={st.kpiRow}>
              <StatCard label="Profit net" value={money(s.totalPnl, ccy)} tone={pnlTone} icon="trending-up" />
              <StatCard label="Win rate" value={`${s.winRate}%`} tone={s.winRate >= 50 ? "bull" : "neutral"} icon="trophy-outline" />
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(80).duration(400)} style={st.kpiRow}>
              <StatCard label="Profit factor" value={s.profitFactor != null ? s.profitFactor.toFixed(2) : "—"} tone={(s.profitFactor ?? 0) >= 1 ? "bull" : "bear"} icon="calculator-outline" />
              <StatCard label="Max drawdown" value={`${s.maxDrawdown}%`} tone={s.maxDrawdown > 15 ? "bear" : "neutral"} icon="trending-down" />
            </Animated.View>

            {/* Equity curve */}
            {curve.length >= 2 && (
              <Animated.View entering={FadeInDown.delay(160).duration(400)}>
                <SectionTitle>Evoluție capital</SectionTitle>
                <Card padded={false} style={{ overflow: "hidden", paddingTop: spacing.lg }}>
                  <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}>
                    <Text style={st.equityValue}>{money(curve[curve.length - 1], ccy).replace("+", "")}</Text>
                    <Text style={st.equityMeta}>{s.totalTrades} tranzacții · RR mediu {s.avgRR}</Text>
                  </View>
                  <EquityChart data={curve} width={width - spacing.xl * 2} />
                </Card>
              </Animated.View>
            )}

            {/* Recent trades */}
            <SectionTitle>Tranzacții recente</SectionTitle>
            {trades.length === 0 ? (
              <Text style={st.emptySub}>Nicio tranzacție recentă.</Text>
            ) : (
              <Card padded={false}>
                {trades.map((t, i) => (
                  <View key={t.id} style={[st.tradeRow, i < trades.length - 1 && st.tradeBorder]}>
                    <View style={st.tradeLeft}>
                      <View style={[st.dot, { backgroundColor: t.direction === "BUY" ? colors.bull : colors.bear }]} />
                      <View>
                        <Text style={st.tradeSymbol}>{t.symbol}</Text>
                        <Badge label={t.direction === "BUY" ? "LONG" : "SHORT"} tone={t.direction === "BUY" ? "bull" : "bear"} />
                      </View>
                    </View>
                    <Text style={[st.tradePnl, { color: (t.pnlMoney ?? 0) >= 0 ? colors.bull : colors.bear }]}>
                      {t.pnlMoney != null ? money(t.pnlMoney, ccy) : "deschis"}
                    </Text>
                  </View>
                ))}
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  scroll: { padding: spacing.xl, paddingBottom: spacing["2xl"] * 2 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  greeting: { color: colors.textMuted, fontSize: font.size.base },
  name: { color: colors.white, fontSize: font.size["2xl"], fontWeight: font.weight.heavy, marginTop: 2 },
  logoutBtn: { padding: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  kpiRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  equityValue: { color: colors.white, fontSize: font.size["2xl"], fontWeight: font.weight.heavy },
  equityMeta: { color: colors.textMuted, fontSize: font.size.sm, marginTop: 2 },
  tradeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg },
  tradeBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  tradeLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5 },
  tradeSymbol: { color: colors.text, fontSize: font.size.base, fontWeight: font.weight.bold, marginBottom: 4 },
  tradePnl: { fontSize: font.size.base, fontWeight: font.weight.bold },
  emptyTitle: { color: colors.text, fontSize: font.size.lg, fontWeight: font.weight.bold, marginTop: spacing.md },
  emptySub: { color: colors.textMuted, fontSize: font.size.sm, textAlign: "center", marginTop: spacing.sm, paddingHorizontal: spacing.lg, lineHeight: 20 },
});
