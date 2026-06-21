import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/lib/auth";

// Gateway: redirecționează în funcție de starea de autentificare.
export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  return <Redirect href={user ? "/(tabs)" : "/login"} />;
}
