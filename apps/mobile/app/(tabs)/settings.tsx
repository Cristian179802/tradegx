import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { APP_VERSION } from "@tradegx/config";
import { useAuth } from "@/lib/auth";

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "TG";

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 24 }}>
      <Text className="text-white text-2xl font-black mb-5">Setări</Text>

      {/* Profil */}
      <View className="bg-surface border border-border rounded-2xl p-4 flex-row items-center mb-4">
        <View className="w-12 h-12 rounded-full bg-primary items-center justify-center">
          <Text className="text-white font-bold">{initials}</Text>
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-white font-semibold">{user?.name ?? "Trader"}</Text>
          <Text className="text-muted text-xs">{user?.email}</Text>
        </View>
      </View>

      {/* Info */}
      <View className="bg-surface border border-border rounded-2xl overflow-hidden mb-4">
        <Row icon="globe-outline" label="Platformă web" value="tradegx.com" />
        <View className="h-px bg-border" />
        <Row icon="information-circle-outline" label="Versiune" value={`v${APP_VERSION}`} />
      </View>

      {/* Logout */}
      <Pressable
        onPress={logout}
        className="bg-bear/10 border border-bear/25 rounded-2xl py-3.5 flex-row items-center justify-center active:opacity-80"
      >
        <Ionicons name="log-out-outline" color="#f43f5e" size={18} />
        <Text className="text-bear font-bold ml-2">Deconectare</Text>
      </Pressable>

      <Text className="text-muted text-[11px] text-center mt-6">
        TradeGx Mobile · sincronizat cu contul tău web
      </Text>
    </ScrollView>
  );
}

function Row({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View className="flex-row items-center px-4 py-3.5">
      <Ionicons name={icon} color="#71717a" size={18} />
      <Text className="text-white ml-3 flex-1">{label}</Text>
      <Text className="text-muted text-sm">{value}</Text>
    </View>
  );
}
