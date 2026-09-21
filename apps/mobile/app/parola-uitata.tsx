import * as React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api, ApiError } from "../src/lib/api";
import { Buton } from "../src/ui/Buton";
import { Camp } from "../src/ui/Camp";
import { Reveal } from "../src/ui/Reveal";
import { T } from "../src/theme";

// ── Parolă uitată ────────────────────────────────────────────────────────────
//
// RĂSPUNSUL E ACELAȘI indiferent dacă adresa există sau nu — așa răspunde și
// serverul, deliberat. Un mesaj care ar spune „adresa asta nu există” ar
// transforma formularul într-un instrument de verificat cine are cont aici.
//
// De aceea ecranul nu pretinde că a trimis ceva: spune „dacă adresa există”.
// Formularea pare fricoasă, dar e singura onestă — noi chiar nu știm, și nici
// n-ar trebui să afle cineva de aici.
//
// RESETAREA SE TERMINĂ ÎN EMAIL, nu aici. Linkul din email deschide pagina de
// pe site, unde se scrie parola nouă. Un ecran de resetare în aplicație ar fi
// cerut ca tokenul din email să ajungă înapoi în aplicație printr-un link
// adânc — o piesă în plus care se poate strica, pentru un drum pe care omul îl
// face o dată la doi ani.

export default function ParolaUitata() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [trimite, setTrimite] = React.useState(false);
  const [gata, setGata] = React.useState(false);
  const [eroare, setEroare] = React.useState<string | null>(null);

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  async function cere() {
    if (!emailOk || trimite) return;
    setTrimite(true);
    setEroare(null);
    try {
      await api.cont.parolaUitata(email.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setGata(true);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setEroare(
        e instanceof ApiError ? e.message : "Nu m-am putut conecta. Verifică internetul.",
      );
    } finally {
      setTrimite(false);
    }
  }

  return (
    <View style={st.radacina}>
      <LinearGradient
        colors={[T.surface.s1, T.surface.s0]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.7 }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={st.continut}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Reveal intarziere={60}>
              <View style={st.marca}>
                <View style={st.cerc}>
                  <Ionicons
                    name={gata ? "mail-open-outline" : "key-outline"}
                    size={26}
                    color={gata ? T.pnl.gain : T.accent.base}
                  />
                </View>
                <Text style={st.titlu}>
                  {gata ? "Verifică emailul" : "Parolă uitată"}
                </Text>
                <Text style={st.subtitlu}>
                  {gata
                    ? "Dacă adresa există la noi, ai primit un link de resetare. Expiră într-o oră."
                    : "Îți trimitem un link pe email. Îl deschizi și alegi o parolă nouă."}
                </Text>
              </View>
            </Reveal>

            {gata ? (
              <Reveal intarziere={140}>
                <View style={st.pasi}>
                  {[
                    "Deschide emailul de la TradeGX",
                    "Apasă pe linkul de resetare",
                    "Alege parola nouă",
                    "Întoarce-te aici și intră în cont",
                  ].map((p, i) => (
                    <View key={p} style={st.randPas}>
                      <View style={st.numar}>
                        <Text style={st.textNumar}>{i + 1}</Text>
                      </View>
                      <Text style={st.textPas}>{p}</Text>
                    </View>
                  ))}
                </View>

                <Buton
                  eticheta="Înapoi la autentificare"
                  onPress={() => router.replace("/login")}
                  plin
                  style={{ marginTop: T.spacing.xl }}
                />

                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setGata(false);
                  }}
                  style={st.legatura}
                  accessibilityRole="button"
                >
                  <Text style={st.textLegatura}>
                    N-a ajuns nimic? <Text style={st.accent}>Încearcă altă adresă</Text>
                  </Text>
                </Pressable>
              </Reveal>
            ) : (
              <Reveal intarziere={140} style={st.formular}>
                <Camp
                  eticheta="Email"
                  valoare={email}
                  onChange={setEmail}
                  placeholder="tu@exemplu.com"
                  tastatura="email-address"
                  returnKeyType="go"
                  onSubmit={cere}
                  autoFocus
                />

                {eroare ? (
                  <View style={st.cutieEroare}>
                    <Text style={st.textEroare}>{eroare}</Text>
                  </View>
                ) : null}

                <Buton
                  eticheta="Trimite linkul"
                  onPress={cere}
                  incarca={trimite}
                  dezactivat={!emailOk || trimite}
                  plin
                  style={{ marginTop: T.spacing.sm }}
                />

                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    router.replace("/login");
                  }}
                  style={st.legatura}
                  accessibilityRole="button"
                >
                  <Text style={st.textLegatura}>
                    Mi-am amintit. <Text style={st.accent}>Înapoi la autentificare</Text>
                  </Text>
                </Pressable>
              </Reveal>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  radacina: { flex: 1, backgroundColor: T.surface.s0 },
  continut: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: T.spacing.xl,
    paddingVertical: T.spacing["2xl"],
  },
  marca: { alignItems: "center", marginBottom: T.spacing.xl },
  cerc: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface.s3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l2,
  },
  titlu: {
    color: T.ink.i1,
    fontSize: T.fontSize.xl,
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.tight,
    marginTop: T.spacing.lg,
  },
  subtitlu: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
  formular: { gap: 2 },
  pasi: { gap: T.spacing.md },
  randPas: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  numar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.accent.soft,
  },
  textNumar: {
    color: T.accent.base,
    fontSize: T.fontSize.xs,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  textPas: {
    flex: 1,
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
  },
  cutieEroare: {
    backgroundColor: "rgba(251,113,133,0.10)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(251,113,133,0.30)",
    borderRadius: T.radius.md,
    padding: T.spacing.md,
    marginBottom: T.spacing.sm,
  },
  textEroare: {
    color: T.pnl.loss,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  legatura: { alignItems: "center", paddingVertical: T.spacing.xl },
  textLegatura: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
  },
  accent: {
    color: T.accent.base,
    fontFamily: "Inter_700Bold",
  },
});
