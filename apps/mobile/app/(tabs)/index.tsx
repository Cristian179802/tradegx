import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

interface Trade {
  id: string; symbol: string; direction: string;
  pnlMoney: number | null; lotSize: number | null;
}

function normalize(raw: unknown): Trade[] {
  if (Array.isArray(raw)) return raw as Trade[];
  if (raw && typeof raw === "object" && Array.isArray((raw as { trades?: unknown }).trades)) {
    return (raw as { trades: Trade[] }).trades;
  }
  return [];
}

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.trades.list();
      setTrades(normalize(data));
    } catch {
      /* păstrează datele existente */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const settled = trades.filter((t) => t.pnlMoney != null);
  const netPnl = settled.reduce((s, t) => s + Number(t.pnlMoney ?? 0), 0);
  const wins = settled.filter((t) => Number(t.pnlMoney) > 0).length;
  const winRate = settled.length > 0 ? (wins / settled.length) * 100 : 0;

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Bună dimineața" : h < 18 ? "Bună ziua" : "Bună seara";
  };

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#6366f1" />}
    >
      <Text className="text-muted text-sm">{greeting()},</Text>
      <Text className="text-white text-2xl font-black mb-5">{user?.name ?? "Trader"} 👋</Text>

      {loading ? (
        <ActivityIndicator color="#6366f1" className="mt-10" />
      ) : (
        <>
          {/* KPI */}
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1 bg-surface border border-border rounded-2xl p-4">
              <Text className="text-muted text-[10px] uppercase tracking-wider">Profit Net</Text>
              <Text className={`text-xl font-black mt-1 ${netPnl >= 0 ? "text-bull" : "text-bear"}`}>
                {netPnl >= 0 ? "+" : ""}{netPnl.toFixed(2)}
              </Text>
            </View>
            <View className="flex-1 bg-surface border border-border rounded-2xl p-4">
              <Text className="text-muted text-[10px] uppercase tracking-wider">Win Rate</Text>
              <Text className="text-xl font-black text-white mt-1">{winRate.toFixed(0)}%</Text>
            </View>
          </View>
          <View className="bg-surface border border-border rounded-2xl p-4 mb-5">
            <Text className="text-muted text-[10px] uppercase tracking-wider">Total tranzacții</Text>
            <Text className="text-xl font-black text-white mt-1">{trades.length}</Text>
          </View>

          {/* Recent */}
          <Text className="text-white font-bold mb-2">Tranzacții recente</Text>
          {settled.length === 0 ? (
            <Text className="text-muted text-sm py-6 text-center">Nicio tranzacție încă.</Text>
          ) : (
            <View className="gap-2">
              {settled.slice(0, 8).map((t) => {
                const pos = Number(t.pnlMoney) >= 0;
                return (
                  <View key={t.id} className="flex-row items-center bg-surface border border-border rounded-xl px-3 py-2.5">
                    <View className={`px-2 py-1 rounded-lg ${t.direction === "BUY" ? "bg-bull/10" : "bg-bear/10"}`}>
                      <Text className={`text-[10px] font-bold ${t.direction === "BUY" ? "text-bull" : "text-bear"}`}>{t.direction}</Text>
                    </View>
                    <Text className="text-white font-semibold ml-3 flex-1">{t.symbol}</Text>
                    <Text className={`font-bold ${pos ? "text-bull" : "text-bear"}`}>
                      {pos ? "+" : ""}{Number(t.pnlMoney).toFixed(2)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
