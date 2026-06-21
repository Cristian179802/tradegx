import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/lib/api";

interface Signal {
  id: string; symbol: string; direction: "BUY" | "SELL"; timeframe: string;
  entryPrice: number; stopLoss: number; takeProfit: number;
  riskReward: number; confidence: number; setupType: string | null;
  rationale: string; confirmation: string;
}

export default function Signals() {
  const insets = useSafeAreaInsets();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (generate = false) => {
    try {
      const data = (generate
        ? await api.signals.generate()
        : await api.signals.today()) as { signals?: Signal[]; needsGeneration?: boolean };
      if (!generate && data.needsGeneration) {
        // Generează la prima accesare a zilei
        const gen = await api.signals.generate() as { signals?: Signal[] };
        setSignals(gen.signals ?? []);
      } else {
        setSignals(data.signals ?? []);
      }
    } catch {
      /* ignoră */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#6366f1" />}
    >
      <Text className="text-white text-2xl font-black mb-1">Semnale AI</Text>
      <Text className="text-muted text-sm mb-4">Maxim 3 setup-uri de înaltă probabilitate</Text>

      {/* Disclaimer */}
      <View className="bg-warn/5 border border-warn/20 rounded-xl p-3 mb-4">
        <Text className="text-warn text-xs font-bold mb-1">⚠️ Nu sunt sfaturi financiare</Text>
        <Text className="text-muted text-[11px] leading-4">
          Generate de AI, caracter educativ. Tranzacționarea implică risc ridicat. Niciun semnal nu e 100% sigur.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#6366f1" className="mt-10" />
      ) : signals.length === 0 ? (
        <Text className="text-muted text-sm py-10 text-center">Niciun setup astăzi. Trage în jos pentru reîmprospătare.</Text>
      ) : (
        <View className="gap-3">
          {signals.map((s) => {
            const isBuy = s.direction === "BUY";
            return (
              <View key={s.id} className={`bg-surface border rounded-2xl p-4 ${isBuy ? "border-bull/25" : "border-bear/25"}`}>
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <View className={`px-2 py-1 rounded-lg ${isBuy ? "bg-bull/10" : "bg-bear/10"}`}>
                      <Text className={`text-[10px] font-black ${isBuy ? "text-bull" : "text-bear"}`}>{s.direction}</Text>
                    </View>
                    <Text className="text-white text-lg font-black">{s.symbol}</Text>
                    <Text className="text-muted text-[10px]">{s.timeframe}</Text>
                  </View>
                  <Text className="text-info text-xs font-bold">{s.confidence}%</Text>
                </View>

                <View className="flex-row gap-2 mb-3">
                  <Level label="Entry" value={s.entryPrice} color="text-info" />
                  <Level label="SL" value={s.stopLoss} color="text-bear" />
                  <Level label="TP" value={s.takeProfit} color="text-bull" />
                </View>
                <Text className="text-muted text-xs mb-2">R:R 1:{s.riskReward}{s.setupType ? ` · ${s.setupType}` : ""}</Text>
                <Text className="text-white/80 text-xs leading-5">{s.rationale}</Text>
                {s.confirmation ? (
                  <Text className="text-muted text-xs leading-5 mt-2">
                    <Text className="text-bull font-semibold">Confirmare: </Text>{s.confirmation}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function Level({ label, value, color }: { label: string; value: number; color: string }) {
  const fmt = value >= 1000 ? value.toLocaleString("en-US", { maximumFractionDigits: 2 }) : value.toFixed(value < 10 ? 5 : 3);
  return (
    <View className="flex-1 bg-bg border border-border rounded-xl px-2 py-1.5">
      <Text className="text-muted text-[9px] uppercase">{label}</Text>
      <Text className={`text-xs font-bold ${color}`}>{fmt}</Text>
    </View>
  );
}
