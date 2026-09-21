import * as React from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, View } from "react-native";
import { ProvizorAuth, useAuth } from "../src/lib/auth";
import { BaraFile } from "../src/ui/BaraFile";
import { T } from "../src/theme";
import { useFonturi } from "../src/lib/fonturi";

// ── Rădăcina aplicației ──────────────────────────────────────────────────────
//
// Trei responsabilități, deliberat separate:
//   1. `<ProvizorAuth>` — citește sesiunea din secure-store, o reîmprospătează
//   2. `<Poarta>` — decide unde stă omul: în aplicație sau pe ecranul de login
//   3. `<BaraFile>` — bara de jos, desenată O SINGURĂ DATĂ, peste toată stiva
//
// DE CE E BARA AICI și nu în `(tabs)`: aplicația are acum peste douăzeci de
// ecrane, iar cele mai multe nu sunt file — sunt ecrane deschise din bulele
// meniului. Dacă bara ar trăi în navigatorul de file, ar dispărea exact când
// omul e cel mai adânc în aplicație și are cea mai mare nevoie să sară în altă
// parte. Bara e deja `position: absolute`, deci plutește peste orice ecran;
// ecranele lasă loc dedesubt prin `SPATIU_BARA`.
//
// POARTA E INTERZISĂ IMPLICIT. Varianta veche enumera rutele DIN aplicație
// („(tabs)" sau „tranzactie"); fiecare ecran nou uitat pe listă era o scurgere:
// conținut desenat înainte să se decidă dacă are voie. Acum se enumeră doar
// ecranele publice — un ecran nou e protejat fără să facă nimeni nimic.
//
// TRANZIȚIILE. `animation: "slide_from_right"` pe stivă, ca pe Android nativ;
// ecranul de login intră cu estompare, fiindcă nu vine „de undeva" — e o
// schimbare de stare, nu o navigare.

/**
 * Rutele vizibile fără sesiune. Toate trei sunt lucruri pe care le face cineva
 * care N-ARE încă un cont — dacă poarta le-ar trimite la login, „Creează cont"
 * ar duce înapoi la login, adică nicăieri.
 */
const PUBLICE = ["login", "inregistrare", "parola-uitata"];

function Poarta({ children }: { children: React.ReactNode }) {
  const { utilizator, pornit } = useAuth();
  // Fonturile de brand se încarcă din pachet. Până sunt gata NU desenăm text:
  // altfel primul cadru apare cu fontul telefonului și sare vizibil la schimb.
  const fonturiGata = useFonturi();
  const segmente = useSegments();
  const router = useRouter();

  const public_ = PUBLICE.includes(segmente[0] ?? "");

  React.useEffect(() => {
    if (!pornit) return; // încă citim din secure-store

    if (!utilizator && !public_) router.replace("/login");
    else if (utilizator && public_) router.replace("/(tabs)");
  }, [utilizator, pornit, public_, router]);

  // Cât timp nu știm dacă e cineva conectat, nu arătăm NICIUN ecran. O clipire
  // de login pentru cineva conectat de trei săptămâni e o scăpare vizibilă.
  if (!pornit || !fonturiGata) {
    return (
      <View style={{ flex: 1, backgroundColor: T.surface.s0, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={T.accent.base} />
      </View>
    );
  }

  return (
    <>
      {children}
      {utilizator && !public_ ? <BaraFile /> : null}
    </>
  );
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
              <Stack.Screen name="inregistrare" options={{ animation: "fade" }} />
              <Stack.Screen name="parola-uitata" options={{ animation: "fade" }} />
              <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
            </Stack>
          </Poarta>
        </ProvizorAuth>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
