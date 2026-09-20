import * as React from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, View } from "react-native";
import { ProvizorAuth, useAuth } from "../src/lib/auth";
import { T } from "../src/theme";

// ── Rădăcina aplicației ──────────────────────────────────────────────────────
//
// Două responsabilități, deliberat separate:
//   1. `<ProvizorAuth>` — citește sesiunea din secure-store, o reîmprospătează
//   2. `<Poarta>` — decide unde stă omul: în aplicație sau pe ecranul de login
//
// Poarta e UN SINGUR loc. Alternativa — fiecare ecran verifică singur sesiunea
// și redirecționează — înseamnă că un ecran nou uitat e o scurgere de date:
// se vede conținut înainte să se decidă dacă are voie.
//
// TRANZIȚIILE. `animation: "slide_from_right"` pe stivă, ca pe Android nativ;
// ecranul de login intră cu estompare, fiindcă nu vine „de undeva" — e o
// schimbare de stare, nu o navigare.

function Poarta({ children }: { children: React.ReactNode }) {
  const { utilizator, pornit } = useAuth();
  const segmente = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (!pornit) return; // încă citim din secure-store

    const inAplicatie = segmente[0] === "(tabs)" || segmente[0] === "tranzactie";

    if (!utilizator && inAplicatie) router.replace("/login");
    else if (utilizator && !inAplicatie) router.replace("/(tabs)");
  }, [utilizator, pornit, segmente, router]);

  // Cât timp nu știm dacă e cineva conectat, nu arătăm NICIUN ecran. O clipire
  // de login pentru cineva conectat de trei săptămâni e o scăpare vizibilă.
  if (!pornit) {
    return (
      <View style={{ flex: 1, backgroundColor: T.surface.s0, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={T.accent.base} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ProvizorAuth>
          <Poarta>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: T.surface.s0 },
                animation: "slide_from_right",
                animationDuration: 260,
              }}
            >
              <Stack.Screen name="login" options={{ animation: "fade" }} />
              <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
              <Stack.Screen name="tranzactie/[id]" />
            </Stack>
          </Poarta>
        </ProvizorAuth>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
