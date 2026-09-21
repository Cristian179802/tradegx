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
import { useAuth, EroareAuth } from "../src/lib/auth";
import { conecteazaCuGoogle } from "../src/lib/google";
import { Buton } from "../src/ui/Buton";
import { ButonGoogle } from "../src/ui/ButonGoogle";
import { Camp } from "../src/ui/Camp";
import { Reveal } from "../src/ui/Reveal";
import { T } from "../src/theme";

// ── Autentificare ────────────────────────────────────────────────────────────
//
// E PRIMUL ECRAN pe care-l vede cineva, uneori singurul dacă renunță. De aceea
// arată ca pagina de pe site, nu ca un formular implicit: cartonaș ridicat cu
// halou, fir de lumină pe muchia de sus, insignă de acces securizat, buton în
// degrade. Cine a văzut site-ul recunoaște produsul; cine n-a văzut nimic
// vede totuși că cineva s-a ocupat de el.
//
// TOATE TEXTELE AU `fontFamily` EXPLICIT. Pe Android, un stil de text fără
// familie moștenește fontul de SISTEM — iar pe telefoanele unde omul și-a pus
// un font caligrafic, tot ecranul devine caligrafic. Ecranul ăsta chiar pățise
// asta: cinci stiluri fără familie, exact titlul și subtitlul. Vezi
// `scripts/font-scan.mjs`, care nu mă mai lasă să repet greșeala.
//
// 2FA APARE DOAR CÂND E CERUT. Backend-ul răspunde cu `twoFARequired` la primul
// pas; până atunci câmpul nu există. Un câmp „cod 2FA (opțional)” arătat tuturor
// îi face pe cei fără 2FA să creadă că au uitat ceva.
//
// Eroarea stă sub formular, nu într-un dialog: dialogul te scoate din context
// exact când trebuie să corectezi ceva ce ai scris.

export default function Login() {
  const router = useRouter();
  const { autentifica, preiaSesiunea } = useAuth();
  const [email, setEmail] = React.useState("");
  const [parola, setParola] = React.useState("");
  const [cod, setCod] = React.useState("");
  const [cere2FA, setCere2FA] = React.useState(false);
  const [eroare, setEroare] = React.useState<string | null>(null);
  const [trimite, setTrimite] = React.useState(false);
  const [google, setGoogle] = React.useState(false);

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

  async function cuGoogle() {
    if (google || trimite) return;
    setGoogle(true);
    setEroare(null);
    const r = await conecteazaCuGoogle();
    // Anularea nu e o greșeală: omul s-a răzgândit. Un mesaj roșu pentru asta
    // arată ca o eroare de care ar trebui să-i pese.
    if (r.fel === "anulat") { setGoogle(false); return; }
    if (r.fel === "eroare") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setEroare(r.mesaj);
      setGoogle(false);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await preiaSesiunea(r);
    // Poarta din `_layout` duce mai departe; nu stingem `google` ca să nu
    // clipească butonul cât se schimbă ecranul.
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
                <Text style={st.numeMarca}>TradeGx</Text>
              </View>
            </Reveal>

            {/* ── Cartonașul ── */}
            <Reveal intarziere={120}>
              <View style={st.invelis}>
                {/* Haloul: aceeași diagonală indigo→violet ca pe site. */}
                <LinearGradient
                  colors={["rgba(109,117,246,0.22)", "rgba(109,117,246,0)", "rgba(167,139,250,0.16)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={st.halou}
                />

                <View style={st.card}>
                  {/* Firul de lumină de pe muchia de sus. */}
                  <LinearGradient
                    colors={["rgba(109,117,246,0)", "rgba(109,117,246,0.55)", "rgba(109,117,246,0)"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={st.fir}
                  />

                  <View style={st.insigna}>
                    <View style={st.patratLacat}>
                      <Ionicons name="lock-closed" size={13} color={T.accent.base} />
                    </View>
                    <Text style={st.textInsigna}>ACCES SECURIZAT</Text>
                  </View>

                  <Text style={st.titlu}>
                    {cere2FA ? "Verificare în doi pași" : "Bine ai revenit"}
                  </Text>
                  <Text style={st.subtitlu}>
                    {cere2FA
                      ? "Scrie codul din aplicația ta de autentificare."
                      : "Intră în contul tău și vezi cum ai tranzacționat."}
                  </Text>

                  <View style={st.formular}>
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
                        <Ionicons name="alert-circle" size={15} color={T.pnl.loss} />
                        <Text style={st.textEroare}>{eroare}</Text>
                      </View>
                    ) : null}

                    <Buton
                      eticheta={cere2FA ? "Confirmă codul" : "Intră în cont"}
                      onPress={intra}
                      incarca={trimite}
                      dezactivat={!poateTrimite}
                      plin
                      degrade
                      iconita={<Ionicons name="arrow-forward" size={16} color="#ffffff" />}
                      iconitaLaDreapta
                      style={{ marginTop: T.spacing.md }}
                    />

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
                  </View>

                  {/* ── Google ── */}
                  <View style={st.separator}>
                    <View style={st.linie} />
                    <Text style={st.sau}>SAU CONTINUĂ CU</Text>
                    <View style={st.linie} />
                  </View>

                  <ButonGoogle onPress={cuGoogle} incarca={google} dezactivat={trimite} />

                  {/* ── Dovezi de încredere, ca pe site ── */}
                  <View style={st.incredere}>
                    <View style={st.randIncredere}>
                      <Ionicons name="shield-checkmark" size={13} color={T.pnl.gain} />
                      <Text style={st.textIncredere}>SSL 256-bit</Text>
                    </View>
                    <View style={st.punct} />
                    <View style={st.randIncredere}>
                      <Ionicons name="lock-closed-outline" size={12} color={T.ink.i4} />
                      <Text style={st.textIncredere}>Parolele nu se stochează în clar</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Reveal>

            <Reveal intarziere={220}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  router.push("/inregistrare");
                }}
                style={st.legaturaJos}
                accessibilityRole="button"
              >
                <Text style={st.textLegaturaJos}>
                  N-ai cont? <Text style={st.accent}>Creează unul</Text>
                </Text>
              </Pressable>
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
    paddingHorizontal: T.spacing.lg,
    paddingVertical: T.spacing["2xl"],
  },

  marca: { alignItems: "center", marginBottom: T.spacing.xl, gap: T.spacing.md },
  logo: { width: 60, height: 60, borderRadius: 15 },
  numeMarca: {
    color: T.ink.i1,
    fontSize: T.fontSize.lg,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: T.tracking.tight,
  },

  invelis: { position: "relative" },
  halou: {
    position: "absolute",
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: T.radius.xl + 1,
  },
  card: {
    backgroundColor: T.surface.s2,
    borderRadius: T.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    padding: T.spacing.xl,
    overflow: "hidden",
  },
  fir: { position: "absolute", top: 0, left: 28, right: 28, height: 1 },

  insigna: { flexDirection: "row", alignItems: "center", gap: T.spacing.sm },
  patratLacat: {
    width: 28,
    height: 28,
    borderRadius: T.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.accent.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.accent.line,
  },
  textInsigna: {
    color: T.accent.base,
    fontSize: 10,
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.wider,
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
    marginTop: 5,
  },

  formular: { marginTop: T.spacing.lg, gap: 2 },
  ajutor: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    marginTop: -6,
    marginBottom: T.spacing.sm,
  },

  cutieEroare: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: T.spacing.sm,
    backgroundColor: "rgba(251,113,133,0.10)",
    borderColor: "rgba(251,113,133,0.30)",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: T.radius.md,
    padding: T.spacing.md,
    marginTop: T.spacing.sm,
  },
  textEroare: {
    flex: 1,
    color: T.pnl.loss,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },

  legatura: { alignItems: "center", paddingVertical: T.spacing.md },
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
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.wider,
  },

  incredere: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: T.spacing.md,
    marginTop: T.spacing.xl,
    paddingTop: T.spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.line.l1,
  },
  randIncredere: { flexDirection: "row", alignItems: "center", gap: 5 },
  textIncredere: {
    color: T.ink.i4,
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  punct: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: T.line.l2 },

  legaturaJos: { alignItems: "center", paddingVertical: T.spacing.lg },
  textLegaturaJos: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
  },
  accent: {
    color: T.accent.base,
    fontFamily: "Inter_700Bold",
  },
  nota: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 17,
  },
});
