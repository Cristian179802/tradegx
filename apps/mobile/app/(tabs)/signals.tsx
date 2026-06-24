import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { api } from "@/lib/api";
import { Card, Badge, Button, SectionTitle } from "@/ui";
import { colors, spacing, radius, font } from "@/theme";

type Signal = {
  id: string;
  symbol: string;
  direction: "BUY" | "SELL";
  timeframe: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  confidence: number;
  setupType: string | null;
  session: string | null;
  bias: string | null;
  rationale: string | null;
  status: string;
};
type Resp = { date: string; signals: Signal[]; needsGeneration: boolean };

function confTone(c: number): "bull" | "warn" | "neutral" {
  if (c >= 75) return "bull";
  if (c >= 60) return "warn";
  return "neutral";
}

export default function Signals() {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      setData((await api.signals.today()) as Resp);
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

  async function generate() {
    setGenerating(true);
    try {
      setData((await api.signals.generate()) as Resp);
    } catch {
      /* ignore */
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <View style={st.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const signals = data?.signals ?? [];

  return (
    <SafeAreaView style={st.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={st.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        <View style={st.header}>
          <View>
            <Text style={st.title}>Semnale HPS</Text>
            <Text style={st.sub}>High-Probability Setups · azi</Text>
          </View>
          <Ionicons name="pulse" size={26} color={colors.primary} />
        </View>

        {signals.length === 0 ? (
          <Card style={{ marginTop: spacing.xl, alignItems: "center", paddingVertical: spacing["2xl"] }}>
            <Ionicons name="sparkles-outline" size={40} color={colors.textMuted} />
            <Text style={st.emptyTitle}>Niciun semnal generat azi</Text>
            <Text style={st.emptySub}>Generează setup-urile AI de înaltă probabilitate pentru sesiunea de azi.</Text>
            <View style={{ marginTop: spacing.lg, width: "100%" }}>
              <Button label="Generează semnale" icon="sparkles" onPress={generate} loading={generating} />
            </View>
          </Card>
        ) : (
          signals.map((sig, i) => (
            <Animated.View key={sig.id} entering={FadeInDown.delay(i * 60).duration(400)}>
              <Card style={{ marginTop: spacing.md }}>
                {/* Header card */}
                <View style={st.cardHead}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <Text style={st.symbol}>{sig.symbol}</Text>
                    <Badge label={sig.direction === "BUY" ? "LONG" : "SHORT"} tone={sig.direction === "BUY" ? "bull" : "bear"} />
                    <Badge label={sig.timeframe} tone="neutral" />
                  </View>
                  <Badge label={`${sig.confidence}%`} tone={confTone(sig.confidence)} />
                </View>

                {(sig.setupType || sig.session) && (
                  <Text style={st.meta}>
                    {[sig.setupType, sig.session].filter(Boolean).join(" · ")}
                  </Text>
                )}

                {/* Niveluri */}
                <View style={st.levels}>
                  <Level label="Entry" value={sig.entryPrice} color={colors.text} />
                  <Level label="SL" value={sig.stopLoss} color={colors.bear} />
                  <Level label="TP" value={sig.takeProfit} color={colors.bull} />
                  <Level label="RR" value={sig.riskReward} color={colors.primary} suffix="R" />
                </View>

                {sig.rationale && <Text style={st.rationale}>{sig.rationale}</Text>}
              </Card>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Level({ label, value, color, suffix }: { label: string; value: number; color: string; suffix?: string }) {
  return (
    <View style={st.level}>
      <Text style={st.levelLabel}>{label}</Text>
      <Text style={[st.levelValue, { color }]}>
        {suffix ? value.toFixed(1) + suffix : value}
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  scroll: { padding: spacing.xl, paddingBottom: spacing["2xl"] * 2 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: colors.white, fontSize: font.size["2xl"], fontWeight: font.weight.heavy },
  sub: { color: colors.textMuted, fontSize: font.size.sm, marginTop: 2 },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  symbol: { color: colors.white, fontSize: font.size.lg, fontWeight: font.weight.heavy },
  meta: { color: colors.textMuted, fontSize: font.size.sm, marginTop: spacing.sm, textTransform: "capitalize" },
  levels: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.lg, backgroundColor: colors.bgElevated, borderRadius: radius.md, padding: spacing.md },
  level: { alignItems: "center", flex: 1 },
  levelLabel: { color: colors.textMuted, fontSize: font.size.xs, fontWeight: font.weight.semibold, marginBottom: 4 },
  levelValue: { fontSize: font.size.base, fontWeight: font.weight.bold },
  rationale: { color: colors.textMuted, fontSize: font.size.sm, lineHeight: 20, marginTop: spacing.md },
  emptyTitle: { color: colors.text, fontSize: font.size.lg, fontWeight: font.weight.bold, marginTop: spacing.md },
  emptySub: { color: colors.textMuted, fontSize: font.size.sm, textAlign: "center", marginTop: spacing.sm, paddingHorizontal: spacing.md, lineHeight: 20 },
});
