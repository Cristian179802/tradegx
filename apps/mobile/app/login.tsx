import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!email || !password) { setError("Completează email și parolă."); return; }
    setLoading(true); setError("");
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Autentificare eșuată");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-bg">
      <View className="flex-1 justify-center px-6">
        {/* Brand */}
        <View className="items-center mb-10">
          <View className="w-16 h-16 rounded-2xl bg-primary items-center justify-center mb-3">
            <Text className="text-white text-3xl font-black">T</Text>
          </View>
          <Text className="text-2xl font-black text-white">
            Trade<Text className="text-primary">Gx</Text>
          </Text>
          <Text className="text-muted text-xs mt-1">Pro Trading Journal</Text>
        </View>

        {/* Form */}
        <View className="gap-3">
          <View>
            <Text className="text-muted text-xs mb-1.5 ml-1">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="email@exemplu.com"
              placeholderTextColor="#52525b"
              autoCapitalize="none"
              keyboardType="email-address"
              className="bg-surface border border-border rounded-xl px-4 py-3 text-white"
            />
          </View>
          <View>
            <Text className="text-muted text-xs mb-1.5 ml-1">Parolă</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#52525b"
              secureTextEntry
              className="bg-surface border border-border rounded-xl px-4 py-3 text-white"
            />
          </View>

          {error ? <Text className="text-bear text-sm text-center">{error}</Text> : null}

          <Pressable
            onPress={onSubmit}
            disabled={loading}
            className="bg-primary rounded-xl py-3.5 items-center mt-2 active:opacity-80"
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white font-bold text-base">Conectează-te</Text>}
          </Pressable>
        </View>

        <Text className="text-muted text-xs text-center mt-8">
          Folosește contul tău TradeGx (același ca pe web).
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
