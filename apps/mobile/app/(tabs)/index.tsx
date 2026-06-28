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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, Badge, SectionTitle, PressableScale } from "@/ui";
import { EquityChart } from "@/components/EquityChart";
import { colors, gradients, spacing, radius, font, shadow } from "@/theme";

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
type SetupPerf = { setup: string; winRate: number; total: number; pnl: number };
type Overview = {
  empty: boolean;
  currency?: string;
  summary?: Summary;
  equityCurve?: { balance: number }[];
  setupPerformance?: SetupPerf[];
};
type Trade = { id: string; symbol: string; direction: "BUY" | "SELL"; pnlMoney: number | null };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bună dimineața";
  if (h < 18) return "Bună ziua";
  return "Bună seara";
}
function money(v: number, ccy = "USD", sign = true) {
  const s = sign && v > 0 ? "+" : "";
  return `${s}${v.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${ccy}`;
}
const today = new Date().toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" });

const QUICK = [
  { icon: "pulse" as const, label: "Semnale", route: "/signals" as const, color: colors.primary },
  { icon: "book" as const, label: "Jurnal", route: "/journal" as const, color: colors.info },
  { icon: "notifications" as const, label: "Alerte", route: "/alerts" as const, color: colors.warn },
  { icon: "settings-sharp" as const, label: "Setări", route: "/settings" as const, color: colors.textMuted },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const router = useRouter();
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
      setTrades(tr.trades?.slice(0, 4) ?? []);
    } catch {
      /* păstrăm ce avem */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <View style={st.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const s = ov?.summary;
  const ccy = ov?.currency ?? "USD";
  const curve = ov?.equityCurve?.map((p) => p.balance) ?? [];
  const capital = curve.length ? curve[curve.length - 1] : 0;
  const pnlPositive = (s?.totalPnl ?? 0) >= 0;
  const avatarInitial = (user?.name ?? user?.email ?? "T").charAt(0).toUpperCase();

  return (
    <SafeAreaView style={st.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(500)} style={st.header}>
          <View style={{ flex: 1 }}>
            <Text style={st.greeting}>{greeting()},</Text>
            <Text style={st.name} numberOfLines={1}>{user?.name ?? "Trader"} 👋</Text>
            <Text style={st.date}>{today}</Text>
          </View>
          <PressableScale onPress={logout}>
            <LinearGradient colors={gradients.brand} style={st.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={st.avatarText}>{avatarInitial}</Text>
            </LinearGradient>
          </PressableScale>
        </Animated.View>

        {ov?.empty || !s ? (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Card style={st.emptyCard}>
              <Ionicons name="bar-chart-outline" size={44} color={colors.primary} />
              <Text style={st.emptyTitle}>Bun venit în TradeGx</Text>
              <Text style={st.emptySub}>Conectează-ți contul de broker sau adaugă o tranzacție ca să-ți vezi statisticile aici.</Text>
            </Card>
          </Animated.View>
        ) : (
          <>
            {/* HERO — capital + equity curve */}
            <Animated.View entering={FadeInDown.duration(450)}>
              <View style={[st.hero, shadow.card]}>
                <LinearGradient colors={["#1a1a2e", "#121215"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <View style={st.heroTop}>
                  <View>
                    <Text style={st.heroLabel}>CAPITAL TOTAL</Text>
                    <Text style={st.heroValue}>{money(capital, ccy, false)}</Text>
                  </View>
                  <View style={[st.changePill, { backgroundColor: pnlPositive ? colors.bullSoft : colors.bearSoft }]}>
                    <Ionicons name={pnlPositive ? "trending-up" : "trending-down"} size={14} color={pnlPositive ? colors.bull : colors.bear} />
                    <Text style={[st.changeText, { color: pnlPositive ? colors.bull : colors.bear }]}>{money(s.totalPnl, ccy)}</Text>
                  </View>
                </View>
                {curve.length >= 2 && (
                  <View style={st.heroChart}>
                    <EquityChart data={curve} width={width - spacing.xl * 2 - spacing.lg * 2} height={90} />
                  </View>
                )}
              </View>
            </Animated.View>

            {/* Quick actions */}
            <Animated.View entering={FadeInDown.delay(80).duration(450)} style={st.quickRow}>
              {QUICK.map((q) => (
                <PressableScale key={q.label} onPress={() => router.push(q.route)} style={st.quickItem}>
                  <View style={[st.quickIcon, { backgroundColor: q.color + "22" }]}>
                    <Ionicons name={q.icon} size={22} color={q.color} />
                  </View>
                  <Text style={st.quickLabel}>{q.label}</Text>
                </PressableScale>
              ))}
            </Animated.View>

            {/* KPI grid */}
            <Animated.View entering={FadeInDown.delay(160).duration(450)} style={st.kpiGrid}>
              <Kpi label="Win rate" value={`${s.winRate}%`} tone={s.winRate >= 50 ? "bull" : "neutral"} icon="trophy-outline" />
              <Kpi label="Profit factor" value={s.profitFactor != null ? s.profitFactor.toFixed(2) : "—"} tone={(s.profitFactor ?? 0) >= 1 ? "bull" : "bear"} icon="calculator-outline" />
              <Kpi label="RR mediu" value={`${s.avgRR}R`} tone="neutral" icon="swap-vertical-outline" />
              <Kpi label="Max drawdown" value={`${s.maxDrawdown}%`} tone={s.maxDrawdown > 15 ? "bear" : "neutral"} icon="trending-down" />
              <Kpi label="Cel mai bun" value={money(s.bestTrade, ccy)} tone="bull" icon="arrow-up-circle-outline" />
              <Kpi label="Tranzacții" value={`${s.totalTrades}`} tone="neutral" icon="layers-outline" />
            </Animated.View>

            {/* Top setups */}
            {ov.setupPerformance && ov.setupPerformance.length > 0 && (
              <Animated.View entering={FadeInDown.delay(240).duration(450)}>
                <SectionTitle>Top setup-uri</SectionTitle>
                <Card padded={false}>
                  {ov.setupPerformance.slice(0, 3).map((sp, i, arr) => (
                    <View key={sp.setup} style={[st.setupRow, i < arr.length - 1 && st.rowBorder]}>
                      <View style={{ flex: 1 }}>
                        <Text style={st.setupName}>{sp.setup}</Text>
                        <Text style={st.setupMeta}>{sp.total} tranzacții · {sp.winRate}% win</Text>
                      </View>
                      <Text style={[st.setupPnl, { color: sp.pnl >= 0 ? colors.bull : colors.bear }]}>{money(sp.pnl, ccy)}</Text>
                    </View>
                  ))}
                </Card>
              </Animated.View>
            )}

            {/* Recent trades */}
            <Animated.View entering={FadeInDown.delay(320).duration(450)}>
              <SectionTitle action={<Text style={st.seeAll} onPress={() => router.push("/journal")}>Vezi tot</Text>}>Tranzacții recente</SectionTitle>
              {trades.length === 0 ? (
                <Text style={st.emptySub}>Nicio tranzacție recentă.</Text>
              ) : (
                <Card padded={false}>
                  {trades.map((t, i) => (
                    <View key={t.id} style={[st.tradeRow, i < trades.length - 1 && st.rowBorder]}>
                      <View style={st.tradeLeft}>
                        <View style={[st.dot, { backgroundColor: t.direction === "BUY" ? colors.bull : colors.bear }]} />
                        <Text style={st.tradeSymbol}>{t.symbol}</Text>
                        <Badge label={t.direction === "BUY" ? "LONG" : "SHORT"} tone={t.direction === "BUY" ? "bull" : "bear"} />
                      </View>
                      <Text style={[st.tradePnl, { color: (t.pnlMoney ?? 0) >= 0 ? colors.bull : colors.bear }]}>
                        {t.pnlMoney != null ? money(t.pnlMoney, ccy) : "deschis"}
                      </Text>
                    </View>
                  ))}
                </Card>
              )}
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Kpi({ label, value, tone, icon }: { label: string; value: string; tone: "bull" | "bear" | "neutral"; icon: keyof typeof Ionicons.glyphMap }) {
  const c = tone === "bull" ? colors.bull : tone === "bear" ? colors.bear : colors.text;
  return (
    <View style={st.kpi}>
      <View style={st.kpiHead}>
        <Text style={st.kpiLabel}>{label.toUpperCase()}</Text>
        <Ionicons name={icon} size={15} color={colors.textMuted} />
      </View>
      <Text style={[st.kpiValue, { color: c }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  scroll: { padding: spacing.xl, paddingBottom: spacing["2xl"] * 2.5 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: spacing.xl },
  greeting: { color: colors.textMuted, fontSize: font.size.sm },
  name: { color: colors.white, fontSize: font.size["2xl"], fontWeight: font.weight.heavy, marginTop: 1 },
  date: { color: colors.textMuted, fontSize: font.size.xs, marginTop: 3, textTransform: "capitalize" },
  avatar: { width: 50, height: 50, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.white, fontSize: font.size.lg, fontWeight: font.weight.heavy },
  // Hero
  hero: { borderRadius: radius["2xl"], padding: spacing.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroLabel: { color: colors.textMuted, fontSize: font.size.xs, fontWeight: font.weight.semibold, letterSpacing: 1 },
  heroValue: { color: colors.white, fontSize: font.size["3xl"], fontWeight: font.weight.heavy, marginTop: 4 },
  changePill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radius.full },
  changeText: { fontSize: font.size.sm, fontWeight: font.weight.bold },
  heroChart: { marginTop: spacing.md, marginHorizontal: -spacing.xs },
  // Quick
  quickRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xl },
  quickItem: { alignItems: "center", gap: spacing.sm, flex: 1 },
  quickIcon: { width: 56, height: 56, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  quickLabel: { color: colors.textMuted, fontSize: font.size.xs, fontWeight: font.weight.medium },
  // KPI
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.xl },
  kpi: { width: "47%", flexGrow: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  kpiHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kpiLabel: { color: colors.textMuted, fontSize: font.size.xs, fontWeight: font.weight.semibold, letterSpacing: 0.3 },
  kpiValue: { fontSize: font.size.xl, fontWeight: font.weight.heavy, marginTop: spacing.sm },
  // Setups
  setupRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  setupName: { color: colors.text, fontSize: font.size.base, fontWeight: font.weight.bold, textTransform: "capitalize" },
  setupMeta: { color: colors.textMuted, fontSize: font.size.xs, marginTop: 3 },
  setupPnl: { fontSize: font.size.base, fontWeight: font.weight.bold },
  // Trades
  seeAll: { color: colors.primary, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  tradeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg },
  tradeLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dot: { width: 9, height: 9, borderRadius: 5 },
  tradeSymbol: { color: colors.text, fontSize: font.size.base, fontWeight: font.weight.bold },
  tradePnl: { fontSize: font.size.base, fontWeight: font.weight.bold },
  // Empty
  emptyCard: { alignItems: "center", paddingVertical: spacing["2xl"] },
  emptyTitle: { color: colors.text, fontSize: font.size.lg, fontWeight: font.weight.bold, marginTop: spacing.md },
  emptySub: { color: colors.textMuted, fontSize: font.size.sm, textAlign: "center", marginTop: spacing.sm, paddingHorizontal: spacing.lg, lineHeight: 20 },
});
