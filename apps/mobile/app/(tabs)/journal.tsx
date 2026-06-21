import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/lib/api";

interface Trade {
  id: string; symbol: string; direction: string;
  pnlMoney: number | null; lotSize: number | null;
  entryTime: string; setupType?: string | null;
}

function normalize(raw: unknown): Trade[] {
  if (Array.isArray(raw)) return raw as Trade[];
  if (raw && typeof raw === "object" && Array.isArray((raw as { trades?: unknown }).trades)) {
    return (raw as { trades: Trade[] }).trades;
  }
  return [];
}

export default function Journal() {
  const insets = useSafeAreaInsets();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setTrades(normalize(await api.trades.list()));
    } catch { /* ignoră */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top + 12 }}>
      <Text className="text-white text-2xl font-black px-4 mb-3">Jurnal</Text>
      {loading ? (
        <ActivityIndicator color="#6366f1" className="mt-10" />
      ) : (
        <FlatList
          data={trades}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#6366f1" />}
          ListEmptyComponent={<Text className="text-muted text-sm text-center py-10">Nicio tranzacție înregistrată.</Text>}
          renderItem={({ item: t }) => {
            const pos = Number(t.pnlMoney ?? 0) >= 0;
            const date = new Date(t.entryTime).toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
            return (
              <View className="bg-surface border border-border rounded-xl px-3 py-3">
                <View className="flex-row items-center">
                  <View className={`px-2 py-1 rounded-lg ${t.direction === "BUY" ? "bg-bull/10" : "bg-bear/10"}`}>
                    <Text className={`text-[10px] font-bold ${t.direction === "BUY" ? "text-bull" : "text-bear"}`}>{t.direction}</Text>
                  </View>
                  <Text className="text-white font-semibold ml-3 flex-1">{t.symbol}</Text>
                  {t.pnlMoney != null && (
                    <Text className={`font-bold ${pos ? "text-bull" : "text-bear"}`}>
                      {pos ? "+" : ""}{Number(t.pnlMoney).toFixed(2)}
                    </Text>
                  )}
                </View>
                <View className="flex-row items-center gap-3 mt-1.5">
                  <Text className="text-muted text-[11px]">{date}</Text>
                  {t.lotSize != null && <Text className="text-muted text-[11px]">{Number(t.lotSize).toFixed(2)} lot</Text>}
                  {t.setupType ? <Text className="text-info/70 text-[11px]">{t.setupType}</Text> : null}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
