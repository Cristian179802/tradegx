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
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api, ApiError } from "../src/lib/api";
import { useAuth, EroareAuth } from "../src/lib/auth";
import { conecteazaCuGoogle } from "../src/lib/google";
import { Buton } from "../src/ui/Buton";
import { ButonGoogle } from "../src/ui/ButonGoogle";
import { Camp } from "../src/ui/Camp";
import { Reveal } from "../src/ui/Reveal";
import { T } from "../src/theme";

// ── Cont nou ─────────────────────────────────────────────────────────────────
//
// Ecranul ăsta lipsea, iar lipsa lui nu era o funcție în minus: cine instala
// aplicația din magazin și n-avea deja un cont nu putea face NIMIC. Inclusiv
// recenzentul Google, care trebuie să-și poată face cont ca să aprobe
// aplicația.
//
// REGULILE PAROLEI SE VĂD ÎN TIMP CE SCRII, nu după ce apeși. Serverul cere
// opt caractere, o literă mare și o cifră; dacă afli asta abia din eroarea de
// după trimitere, ai scris parola de două ori degeaba. Cele trei rânduri se
// bifează sub câmp pe măsură ce le îndeplinești.
//
// DUPĂ ÎNREGISTRARE INTRĂM DIRECT ÎN CONT. Ruta de autentificare a aplicației
// nu cere emailul verificat, deci a-l trimite pe om înapoi la ecranul de login,
// să-și scrie a doua oară aceleași date, ar fi fost un pas inventat. Emailul de
// verificare pleacă oricum, iar nota de sus i-o spune.

interface RaspunsInregistrare {
  success: boolean;
  message?: string;
  emailSent?: boolean;
  error?: string;
}

export default function Inregistrare() {
  const router = useRouter();
  const { autentifica, preiaSesiunea } = useAuth();
  const [google, setGoogle] = React.useState(false);

  const [nume, setNume] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [parola, setParola] = React.useState("");
  const [trimite, setTrimite] = React.useState(false);
  const [eroare, setEroare] = React.useState<string | null>(null);
  const [nota, setNota] = React.useState<string | null>(null);

  // Cu Google nu există „înregistrare" separată: dacă adresa e nouă, NextAuth
  // face contul; dacă există, intri în el. De aceea butonul face exact același
  // lucru ca pe ecranul de login.
  async function cuGoogle() {
    if (google || trimite) return;
    setGoogle(true);
    setEroare(null);
    const r = await conecteazaCuGoogle();
    if (r.fel === "anulat") { setGoogle(false); return; }
    if (r.fel === "eroare") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setEroare(r.mesaj);
      setGoogle(false);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await preiaSesiunea(r);
  }


  // Exact regulile din `serverRegisterSchema`. Scrise aici ca omul să le vadă,
  // nu ca să înlocuiască verificarea serverului — aceea rămâne singura care
  // decide.
  const reguli = [
    { text: "Cel puțin 8 caractere", ok: parola.length >= 8 },
    { text: "O literă mare", ok: /[A-Z]/.test(parola) },
    { text: "O cifră", ok: /[0-9]/.test(parola) },
  ];

  const numeOk = nume.trim().length >= 2;
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  const parolaOk = reguli.every((r) => r.ok);
  const poateTrimite = numeOk && emailOk && parolaOk && !trimite;

  async function creeaza() {
    if (!poateTrimite) return;
    setTrimite(true);
    setEroare(null);
    setNota(null);

    try {
      const r = (await api.cont.inregistrare({
        name: nume.trim(),
        email: email.trim(),
        password: parola,
      })) as RaspunsInregistrare;

      if (!r.success) {
        setEroare(r.error ?? "Nu am putut crea contul.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      // Intrăm direct. Poarta din `_layout` duce mai departe.
      try {
        await autentifica(email.trim(), parola);
      } catch (e) {
        // Contul EXISTĂ — doar intrarea automată n-a mers. Nu e o eroare de
        // înregistrare, deci nu o prezentăm ca atare.
        setNota(
          e instanceof EroareAuth
            ? "Contul a fost creat. Intră cu emailul și parola pe care tocmai le-ai ales."
            : "Contul a fost creat. Verifică internetul și intră în cont.",
        );
        setTimeout(() => router.replace("/login"), 1800);
      }
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setEroare(
        e instanceof ApiError
          ? e.message
          : "Nu m-am putut conecta. Verifică internetul.",
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
                <Image source={require("../assets/icon.png")} style={st.logo} />
                <Text style={st.titlu}>Cont nou</Text>
                <Text style={st.subtitlu}>
                  Paisprezece zile de PRO, fără card
                </Text>
              </View>
            </Reveal>

            <Reveal intarziere={140} style={st.formular}>
              <Camp
                eticheta="Nume"
                valoare={nume}
                onChange={setNume}
                placeholder="Cum să-ți spunem"
                autoCapitalize="words"
                returnKeyType="next"
              />
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
                returnKeyType="go"
                onSubmit={creeaza}
              />

              <View style={st.reguli}>
                {reguli.map((r) => (
                  <View key={r.text} style={st.randRegula}>
                    <Ionicons
                      name={r.ok ? "checkmark-circle" : "ellipse-outline"}
                      size={14}
                      color={r.ok ? T.pnl.gain : T.ink.i4}
                    />
                    <Text style={[st.textRegula, r.ok && { color: T.ink.i3 }]}>{r.text}</Text>
                  </View>
                ))}
              </View>

              {eroare ? (
                <View style={st.cutieEroare}>
                  <Text style={st.textEroare}>{eroare}</Text>
                </View>
              ) : null}

              {nota ? (
                <View style={st.cutieNota}>
                  <Text style={st.textNota}>{nota}</Text>
                </View>
              ) : null}

              <Buton
                eticheta="Creează contul"
                onPress={creeaza}
                incarca={trimite}
                dezactivat={!poateTrimite}
                plin
                style={{ marginTop: T.spacing.sm }}
              />

              <View style={st.separator}>
                <View style={st.linie} />
                <Text style={st.sau}>SAU CONTINUĂ CU</Text>
                <View style={st.linie} />
              </View>

              <ButonGoogle
                onPress={cuGoogle}
                incarca={google}
                dezactivat={trimite}
                eticheta="Continuă cu Google"
              />

              <Text style={st.acord}>
                Creând contul accepți Termenii și Politica de confidențialitate.
                Îți trimitem un email de verificare — poți folosi aplicația și
                până îl confirmi.
              </Text>
            </Reveal>

            <Reveal intarziere={220}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  router.replace("/login");
                }}
                style={st.legatura}
                accessibilityRole="button"
              >
                <Text style={st.textLegatura}>
                  Ai deja cont? <Text style={st.accent}>Intră</Text>
                </Text>
              </Pressable>
            </Reveal>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  separator: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.md,
    marginTop: T.spacing.xl,
    marginBottom: T.spacing.lg,
  },
  linie: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: T.line.l1 },
  sau: {
    color: T.ink.i4,
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.wider,
  },
  radacina: { flex: 1, backgroundColor: T.surface.s0 },
  continut: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: T.spacing.xl,
    paddingVertical: T.spacing["2xl"],
  },
  marca: { alignItems: "center", marginBottom: T.spacing.xl },
  logo: { width: 64, height: 64, borderRadius: 16 },
  titlu: {
    color: T.ink.i1,
    fontSize: T.fontSize["2xl"],
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.tight,
    marginTop: T.spacing.lg,
  },
  subtitlu: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  formular: { gap: 2 },
  reguli: { gap: 5, marginTop: 2, marginBottom: T.spacing.md },
  randRegula: { flexDirection: "row", alignItems: "center", gap: 6 },
  textRegula: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
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
  cutieNota: {
    backgroundColor: "rgba(52,211,153,0.10)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(52,211,153,0.30)",
    borderRadius: T.radius.md,
    padding: T.spacing.md,
    marginBottom: T.spacing.sm,
  },
  textNota: {
    color: T.pnl.gain,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  acord: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    marginTop: T.spacing.md,
    textAlign: "center",
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
