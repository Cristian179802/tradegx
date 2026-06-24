import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useAuth } from "@/lib/auth";
import { API_URL } from "@/lib/api";
import { Button } from "@/ui";
import { colors, gradients, radius, spacing, font } from "@/theme";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState<"email" | "pass" | null>(null);

  async function onSubmit() {
    if (!email || !password) {
      setError("Completează email și parolă.");
      return;
    }
    setError(null);
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (res.ok) router.replace("/");
    else setError(res.error ?? "Autentificare eșuată.");
  }

  return (
    <View style={st.root}>
      {/* Glow gradient sus */}
      <LinearGradient
        colors={gradients.glow}
        style={st.glow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            contentContainerStyle={st.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeIn.duration(600)} style={st.brand}>
              <Image source={require("../assets/icon.png")} style={st.logo} />
              <Text style={st.appName}>TradeGx</Text>
              <Text style={st.tagline}>Jurnal de trading la nivel instituțional</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(150).duration(600)} style={st.form}>
              <Text style={st.welcome}>Bun venit înapoi 👋</Text>
              <Text style={st.sub}>Conectează-te ca să continui</Text>

              {/* Email */}
              <View style={[st.field, focus === "email" && st.fieldFocus]}>
                <Ionicons name="mail-outline" size={20} color={focus === "email" ? colors.primary : colors.textMuted} />
                <TextInput
                  style={st.input}
                  placeholder="Email"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocus("email")}
                  onBlur={() => setFocus(null)}
                />
              </View>

              {/* Parolă */}
              <View style={[st.field, focus === "pass" && st.fieldFocus]}>
                <Ionicons name="lock-closed-outline" size={20} color={focus === "pass" ? colors.primary : colors.textMuted} />
                <TextInput
                  style={st.input}
                  placeholder="Parolă"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocus("pass")}
                  onBlur={() => setFocus(null)}
                  onSubmitEditing={onSubmit}
                />
                <Ionicons
                  name={showPass ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textMuted}
                  onPress={() => setShowPass((v) => !v)}
                />
              </View>

              {error && (
                <Animated.View entering={FadeIn} style={st.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={colors.bear} />
                  <Text style={st.errorText}>{error}</Text>
                </Animated.View>
              )}

              <View style={{ marginTop: spacing.lg }}>
                <Button label="Conectează-te" onPress={onSubmit} loading={loading} icon="arrow-forward" />
              </View>

              <Text style={st.footer} onPress={() => Linking.openURL(`${API_URL}/register`)}>
                Nu ai cont? <Text style={st.link}>Creează unul gratuit</Text>
              </Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  glow: { position: "absolute", top: 0, left: 0, right: 0, height: 360 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: spacing.xl },
  brand: { alignItems: "center", marginBottom: spacing["2xl"] },
  logo: { width: 88, height: 88, borderRadius: radius.xl, marginBottom: spacing.md },
  appName: { color: colors.white, fontSize: font.size["3xl"], fontWeight: font.weight.heavy, letterSpacing: -0.5 },
  tagline: { color: colors.textMuted, fontSize: font.size.sm, marginTop: 4 },
  form: { width: "100%" },
  welcome: { color: colors.white, fontSize: font.size.xl, fontWeight: font.weight.bold },
  sub: { color: colors.textMuted, fontSize: font.size.sm, marginTop: 4, marginBottom: spacing.xl },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    height: 56,
    marginBottom: spacing.md,
  },
  fieldFocus: { borderColor: colors.primary },
  input: { flex: 1, color: colors.text, fontSize: font.size.base, height: "100%" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bearSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  errorText: { color: colors.bear, fontSize: font.size.sm, flex: 1 },
  footer: { color: colors.textMuted, fontSize: font.size.sm, textAlign: "center", marginTop: spacing.xl },
  link: { color: colors.primary, fontWeight: font.weight.semibold },
});
