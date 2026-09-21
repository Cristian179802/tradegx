import * as React from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Text } from "../src/ui/Text";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ApiError } from "../src/lib/api";
import { intreabaAsistentul, type MesajChat } from "../src/lib/asistent";
import { Card } from "../src/ui/Card";
import { Buton } from "../src/ui/Buton";
import { AntetEcran } from "../src/ui/Ecran";
import { Insigna } from "../src/ui/parti";
import { T, ATINGERE_MIN } from "../src/theme";
import { tr } from "../src/lib/i18n";

// ── Asistent AI ──────────────────────────────────────────────────────────────
//
// Asistentul are acces la statisticile contului, deci întrebările utile sunt
// despre TINE, nu despre piață. De aceea sugestiile de start sunt formulate la
// persoana întâi: cine deschide un chat gol scrie „salut” și închide.
//
// LISTA E INVERSATĂ (`inverted`), nu derulată la final cu un truc. Cu
// `inverted`, mesajul nou apare de jos fără niciun salt, iar derularea în sus
// prin istoric e naturală. Alternativa — `scrollToEnd` după fiecare răspuns —
// sare vizibil și se ceartă cu tastatura.
//
// LIMITELE SE EXPLICĂ, nu se ascund: 402 înseamnă „nu e în planul tău”, 429
// înseamnă „ai consumat cota”. Două lucruri complet diferite, pe care un text
// generic de eroare le-ar amesteca.
//
// Conversația NU se salvează. E o alegere: sesiunea ține cât ecranul. Un
// istoric permanent ar însemna să stochez pe server ce întreabă cineva despre
// pierderile lui, fără ca nimeni să fi cerut asta.

const SUGESTII = [
  "Care e cea mai costisitoare greșeală a mea?",
  "Pe ce simbol pierd cel mai des?",
  "La ce oră tranzacționez cel mai prost?",
  "Ce ar trebui să opresc luna asta?",
];

interface Rand {
  id: string;
  rol: "user" | "assistant";
  text: string;
}

export default function Asistent() {
  const router = useRouter();
  const jos = useSafeAreaInsets().bottom;
  const [mesaje, setMesaje] = React.useState<Rand[]>([]);
  const [text, setText] = React.useState("");
  const [asteapta, setAsteapta] = React.useState(false);
  const [eroare, setEroare] = React.useState<{ text: string; upgrade: boolean } | null>(null);

  const trimite = async (continut: string) => {
    const t = continut.trim();
    if (!t || asteapta) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    const alMeu: Rand = { id: `u${Date.now()}`, rol: "user", text: t };
    const istoric = [...mesaje, alMeu];
    setMesaje(istoric);
    setText("");
    setAsteapta(true);
    setEroare(null);

    try {
      const ciorna: MesajChat[] = istoric.map((m) => ({ role: m.rol, content: m.text }));
      const raspuns = await intreabaAsistentul(ciorna);
      setMesaje((p) => [...p, { id: `a${Date.now()}`, rol: "assistant", text: raspuns }]);
      Haptics.selectionAsync().catch(() => {});
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        setEroare({ text: "Asistentul e inclus în planul PRO.", upgrade: true });
      } else if (e instanceof ApiError && e.status === 429) {
        setEroare({ text: e.message, upgrade: false });
      } else {
        setEroare({
          text: e instanceof ApiError ? e.message : "Nu am primit răspuns. Verifică semnalul.",
          upgrade: false,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setAsteapta(false);
    }
  };

  // Inversată: cel mai nou primul, ca `inverted` să-l așeze jos.
  const pentruLista = React.useMemo(() => [...mesaje].reverse(), [mesaje]);

  return (
    <View style={st.radacina}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <AntetEcran
          titlu="Asistent AI"
          subtitlu="Vede statisticile contului tău"
          actiune={
            mesaje.length > 0 ? (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setMesaje([]);
                  setEroare(null);
                }}
                style={st.sterge}
                accessibilityRole="button"
                accessibilityLabel={tr("Golește conversația")}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={15} color={T.ink.i3} />
              </Pressable>
            ) : undefined
          }
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          {mesaje.length === 0 ? (
            <View style={st.start}>
              <View style={st.stea}>
                <Ionicons name="sparkles" size={22} color={T.accent.base} />
              </View>
              <Text style={st.titluStart}>Întreabă ceva despre cum tranzacționezi</Text>
              <Text style={st.textStart}>
                Asistentul citește statisticile contului tău, așa că întrebările despre
                TINE sunt cele care dau răspunsuri utile.
              </Text>

              <View style={st.sugestii}>
                {SUGESTII.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => trimite(s)}
                    style={({ pressed }) => [st.sugestie, pressed && { backgroundColor: T.surface.s4 }]}
                    accessibilityRole="button"
                  >
                    <Text style={st.textSugestie}>{s}</Text>
                    <Ionicons name="arrow-forward" size={13} color={T.ink.i4} />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <FlatList
              data={pentruLista}
              inverted
              keyExtractor={(m) => m.id}
              contentContainerStyle={st.lista}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                asteapta ? (
                  <View style={[st.bula, st.bulaAsistent, st.gandeste]}>
                    <ActivityIndicator size="small" color={T.accent.base} />
                    <Text style={st.textGandeste}>se uită prin tranzacțiile tale…</Text>
                  </View>
                ) : null
              }
              renderItem={({ item }) => (
                <View style={[st.bula, item.rol === "user" ? st.bulaMea : st.bulaAsistent]}>
                  <Text style={[st.textBula, item.rol === "user" && { color: "#ffffff" }]}>
                    {item.text}
                  </Text>
                </View>
              )}
            />
          )}

          {eroare ? (
            <Card style={st.cardEroare} culoareMuchie="rgba(251,191,36,0.35)" nivel={1}>
              <Text style={st.textEroare}>{eroare.text}</Text>
              {eroare.upgrade ? (
                <Buton
                  eticheta="Vezi planurile"
                  varianta="secundar"
                  onPress={() => router.push("/abonament")}
                  style={{ marginTop: T.spacing.sm }}
                  iconita={<Ionicons name="arrow-forward" size={15} color={T.ink.i1} />}
                />
              ) : null}
            </Card>
          ) : null}

          <View style={st.compunere}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Scrie o întrebare…"
              placeholderTextColor={T.ink.i4}
              selectionColor={T.accent.base}
              multiline
              style={st.camp}
              editable={!asteapta}
            />
            <Pressable
              onPress={() => trimite(text)}
              disabled={!text.trim() || asteapta}
              style={[st.trimite, (!text.trim() || asteapta) && st.trimiteInert]}
              accessibilityRole="button"
              accessibilityLabel="Trimite"
              accessibilityState={{ disabled: !text.trim() || asteapta }}
            >
              <Ionicons name="arrow-up" size={19} color="#ffffff" />
            </Pressable>
          </View>

          <View style={[st.subsol, { paddingBottom: 72 + jos }]}>
            <Insigna text="Poate greși" culoare={T.ink.i4} />
            <Text style={st.textSubsol}>Conversația nu se salvează.</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  radacina: { flex: 1, backgroundColor: T.surface.s0 },
  sterge: {
    width: 34,
    height: 34,
    borderRadius: T.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface.s3,
  },
  start: { flex: 1, paddingHorizontal: T.spacing.lg, justifyContent: "center" },
  stea: {
    width: 46,
    height: 46,
    borderRadius: T.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.accent.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.accent.line,
    marginBottom: T.spacing.lg,
  },
  titluStart: {
    color: T.ink.i1,
    fontSize: T.fontSize.lg,
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.tight,
  },
  textStart: {
    color: T.ink.i4,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginTop: 6,
  },
  sugestii: { marginTop: T.spacing.xl, gap: T.spacing.sm },
  sugestie: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.md,
    minHeight: ATINGERE_MIN,
    paddingHorizontal: T.spacing.lg,
    borderRadius: T.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    backgroundColor: T.surface.s2,
  },
  textSugestie: {
    flex: 1,
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
  },
  lista: { paddingHorizontal: T.spacing.lg, paddingVertical: T.spacing.md, gap: T.spacing.sm },
  bula: {
    maxWidth: "88%",
    paddingHorizontal: T.spacing.lg,
    paddingVertical: T.spacing.md,
    borderRadius: T.radius.lg,
  },
  bulaMea: {
    alignSelf: "flex-end",
    backgroundColor: T.accent.base,
    borderBottomRightRadius: T.radius.sm,
  },
  bulaAsistent: {
    alignSelf: "flex-start",
    backgroundColor: T.surface.s2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    borderBottomLeftRadius: T.radius.sm,
  },
  textBula: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  gandeste: { flexDirection: "row", alignItems: "center", gap: T.spacing.sm },
  textGandeste: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
  cardEroare: { marginHorizontal: T.spacing.lg, marginBottom: T.spacing.sm },
  textEroare: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  compunere: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: T.spacing.sm,
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.sm,
  },
  camp: {
    flex: 1,
    maxHeight: 120,
    minHeight: ATINGERE_MIN,
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    backgroundColor: T.surface.s3,
    borderRadius: T.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.md,
    paddingBottom: T.spacing.md,
  },
  trimite: {
    width: ATINGERE_MIN,
    height: ATINGERE_MIN,
    borderRadius: T.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.accent.base,
  },
  trimiteInert: { opacity: 0.35 },
  subsol: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.sm,
    paddingHorizontal: T.spacing.lg,
    paddingTop: 6,
  },
  textSubsol: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
});
