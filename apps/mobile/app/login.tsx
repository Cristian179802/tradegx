import * as React from "react";
import {
  Image,
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
import * as Haptics from "expo-haptics";
import { useAuth, EroareAuth } from "../src/lib/auth";
import { Buton } from "../src/ui/Buton";
import { Camp } from "../src/ui/Camp";
import { Reveal } from "../src/ui/Reveal";
import { T } from "../src/theme";

// ── Autentificare ────────────────────────────────────────────────────────────
//
// 2FA APARE DOAR CÂND E CERUT. Backend-ul răspunde cu `twoFARequired` la primul
// pas; până atunci câmpul nu există. Un câmp „cod 2FA (opțional)” arătat tuturor
// îi face pe cei fără 2FA să creadă că au uitat ceva.
//
// Eroarea stă sub formular, nu într-un dialog: dialogul te scoate din context
// exact când trebuie să corectezi ceva ce ai scris.

export default function Login() {
  const router = useRouter();
  const { autentifica } = useAuth();
  const [email, setEmail] = React.useState("");
  const [parola, setParola] = React.useState("");
  const [cod, setCod] = React.useState("");
  const [cere2FA, setCere2FA] = React.useState(false);
  const [eroare, setEroare] = React.useState<string | null>(null);
  const [trimite, setTrimite] = React.useState(false);

  const poateTrimite = email.trim().length > 3 && parola.length > 0 && !trimite;

  async function intra() {
    if (!poateTrimite) return;
    setTrimite(true);
    setEroare(null);
    try {
      await autentifica(email.trim(), parola, cere2FA ? cod.trim() : undefined);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      // Navigarea o face poarta din `_layout`, nu ecranul ăsta.
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      if (e instanceof EroareAuth) {
        if (e.cere2FA) {
          setCere2FA(true);
          // Dacă abia acum cerem codul, mesajul „Cod 2FA necesar” nu e o eroare
          // a omului — e următorul pas. Îl arătăm ca eroare doar dacă a încercat
          // deja un cod.
          setEroare(cod.trim() ? e.message : null);
        } else {
          setEroare(e.message);
        }
      } else {
        setEroare("Nu m-am putut conecta. Verifică internetul.");
      }
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
                <Image source={require("../assets/icon.png")} style={st.logo} />
                <Text style={st.titlu}>TradeGx</Text>
                <Text style={st.subtitlu}>Jurnalul tău de trading</Text>
              </View>
            </Reveal>

            <Reveal intarziere={140} style={st.formular}>
              <Camp
                eticheta="Email"
                valoare={email}
                onChange={setEmail}
                placeholder="tu@exemplu.com"
                tastatura="email-address"
                returnKeyType="next"
              />
              <Camp
                eticheta="Parolă"
                valoare={parola}
                onChange={setParola}
                placeholder="••••••••"
                secret
                returnKeyType={cere2FA ? "next" : "go"}
                onSubmit={cere2FA ? undefined : intra}
              />

              {cere2FA && (
                <Reveal intarziere={0}>
                  <Camp
                    eticheta="Cod din aplicația de autentificare"
                    valoare={cod}
                    onChange={setCod}
                    placeholder="123456"
                    tastatura="number-pad"
                    numeric
                    autoFocus
                    returnKeyType="go"
                    onSubmit={intra}
                  />
                  <Text style={st.ajutor}>
                    Merge și un cod de rezervă, dacă nu ai telefonul cu aplicația.
                  </Text>
                </Reveal>
              )}

              {eroare ? (
                <View style={st.cutieEroare}>
                  <Text style={st.textEroare}>{eroare}</Text>
                </View>
              ) : null}

              <Buton
                eticheta={cere2FA ? "Confirmă codul" : "Intră în cont"}
                onPress={intra}
                incarca={trimite}
                dezactivat={!poateTrimite}
                plin
                style={{ marginTop: T.spacing.sm }}
              />
            </Reveal>

            <Reveal intarziere={200}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  router.push("/parola-uitata");
                }}
                style={st.legatura}
                accessibilityRole="button"
              >
                <Text style={st.textLegatura}>Ai uitat parola?</Text>
              </Pressable>
            </Reveal>

            <Reveal intarziere={260}>
              <View style={st.separator}>
                <View style={st.linie} />
                <Text style={st.sau}>sau</Text>
                <View style={st.linie} />
              </View>

              <Buton
                eticheta="Creează un cont"
                varianta="secundar"
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  router.push("/inregistrare");
                }}
                plin
              />
              <Text style={st.nota}>
                Paisprezece zile de PRO, fără card. Același cont merge și pe tradegx.com.
              </Text>
            </Reveal>
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
  marca: { alignItems: "center", marginBottom: T.spacing["2xl"] },
  logo: { width: 76, height: 76, borderRadius: 18 },
  titlu: {
    color: T.ink.i1,
    fontSize: T.fontSize["2xl"],
    fontWeight: "800",
    letterSpacing: T.tracking.tight,
    marginTop: T.spacing.lg,
  },
  subtitlu: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    marginTop: 4,
  },
  formular: { gap: 2 },
  legatura: { alignItems: "center", paddingVertical: T.spacing.lg },
  textLegatura: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.md,
    marginBottom: T.spacing.lg,
  },
  linie: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: T.line.l1 },
  sau: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
  ajutor: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    marginTop: -8,
    marginBottom: T.spacing.sm,
  },
  cutieEroare: {
    backgroundColor: "rgba(251,113,133,0.10)",
    borderColor: "rgba(251,113,133,0.30)",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: T.radius.md,
    padding: T.spacing.md,
    marginBottom: T.spacing.sm,
  },
  textEroare: { color: T.pnl.loss, fontSize: T.fontSize.sm, lineHeight: 19 },
  nota: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    textAlign: "center",
    marginTop: T.spacing["2xl"],
    lineHeight: 17,
  },
});
