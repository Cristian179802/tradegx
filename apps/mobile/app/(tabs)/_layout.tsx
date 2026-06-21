import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/lib/auth";

export default function TabsLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#818cf8",
        tabBarInactiveTintColor: "#52525b",
        tabBarStyle: {
          backgroundColor: "#0d0d12",
          borderTopColor: "#27272a",
          borderTopWidth: 1,
        } as never,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Acasă", tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="signals"
        options={{ title: "Semnale", tabBarIcon: ({ color, size }) => <Ionicons name="locate-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="journal"
        options={{ title: "Jurnal", tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "Setări", tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} /> }}
      />
    </Tabs>
  );
}
