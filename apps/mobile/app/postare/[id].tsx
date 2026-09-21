import * as React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api, ApiError } from "../../src/lib/api";
import { useCerere } from "../../src/lib/useCerere";
import { candva } from "../../src/lib/format";
import { Card } from "../../src/ui/Card";
import { Reveal } from "../../src/ui/Reveal";
import { Ecran } from "../../src/ui/Ecran";
import { Gol, Insigna } from "../../src/ui/parti";
import { T, ATINGERE_MIN } from "../../src/theme";

// ── Firul unei postări ───────────────────────────────────────────────────────
//
// Ecranul ăsta a scos la iveală ceva: ruta care CREEAZĂ un comentariu nu
// exista. Modelul era acolo de la început, pagina web le afișa, numărul lor
// apărea pe card — dar nu exista niciun drum prin care să apară vreunul. Un
// fir de discuție în care nimeni nu putea scrie.
//
// Am adăugat ruta, deci comentariile merg acum și pe site.
//
// COMENTARIUL APARE INSTANT, înainte de răspunsul serverului. Pe o conexiune
// mobilă, o secundă între „Trimite” și textul tău pe ecran e suficient cât să
// apeși a doua oară. Dacă cererea eșuează, rândul dispare și textul se întoarce
// în câmp — nimic nu se pierde.

interface Comentariu {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string | null };
}

interface Reactie {
  emoji: string;
  count: number;
  reacted: boolean;
}

interface Postare {
  id: string;
  title: string | null;
  content: string;
  symbol: string | null;
  tags: string[];
  createdAt: string;
  user: { id: string; name: string | null };
  comments: Comentariu[];
  reactions?: Reactie[];
}

export default function FirPostare() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const c = useCerere<Postare>(
    () => api.community.postare(String(id)) as Promise<Postare>,
    [id],
  );
  const p = c.date;

  const [text, setText] = React.useState("");
  const [trimite, setTrimite] = React.useState(false);
  const [locale, setLocale] = React.useState<Comentariu[]>([]);
  const [mesaj, setMesaj] = React.useState<string | null>(null);

  // Ce vine de la server plus ce tocmai am scris și încă n-a ajuns.
  const comentarii = React.useMemo(
    () => [...(p?.comments ?? []), ...locale],
    [p?.comments, locale],
  );

  const comenteaza = async () => {
    const t = text.trim();
    if (t.length < 2 || trimite) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    const provizoriu: Comentariu = {
      id: `local-${Date.now()}`,
      content: t,
      createdAt: new Date().toISOString(),
      user: { id: "eu", name: "Tu" },
    };
    setLocale((x) => [...x, provizoriu]);
    setText("");
    setTrimite(true);
    setMesaj(null);

    try {
      await api.community.comenteaza(String(id), t);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setLocale([]);
      c.reia();
    } catch (e) {
      // Rândul dispare, textul se întoarce în câmp — nimic nu se pierde.
      setLocale((x) => x.filter((y) => y.id !== provizoriu.id));
      setText(t);
      setMesaj(e instanceof ApiError ? e.message : "Comentariul n-a ajuns. Verifică semnalul.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setTrimite(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Ecran
        titlu={p?.title ?? "Postare"}
        subtitlu={p ? `${p.user.name ?? "Anonim"} · ${candva(p.createdAt)}` : null}
        incarca={c.incarca && !p}
        scheletRanduri={3}
        reimprospateaza={c.reimprospateaza}
        onReia={c.reia}
        eroare={mesaj ?? c.eroare}
        subsol={
          p ? (
            <View style={st.compunere}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Scrie un comentariu…"
                placeholderTextColor={T.ink.i4}
                selectionColor={T.accent.base}
                multiline
                style={st.camp}
              />
              <Pressable
                onPress={comenteaza}
                disabled={text.trim().length < 2 || trimite}
                style={[st.trimite, (text.trim().length < 2 || trimite) && st.inert]}
                accessibilityRole="button"
                accessibilityLabel="Trimite comentariul"
              >
                <Ionicons name="arrow-up" size={18} color="#ffffff" />
              </Pressable>
            </View>
          ) : null
        }
      >
        {!p ? (
          !c.incarca ? (
            <Gol
              iconita="chatbubble-outline"
              titlu="Postarea nu a fost găsită"
              text="Poate a fost ștearsă. Întoarce-te la listă."
            />
          ) : null
        ) : (
          <>
            <Reveal>
              <Card>
                <View style={st.antet}>
                  <View style={st.avatar}>
                    <Text style={st.initiala}>
                      {(p.user.name ?? "?").trim().charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={st.autor} numberOfLines={1}>{p.user.name ?? "Anonim"}</Text>
                    <Text style={st.cand}>{candva(p.createdAt)}</Text>
                  </View>
                  {p.symbol ? (
                    <Insigna text={p.symbol} culoare={T.accent.base} fundal={T.accent.soft} />
                  ) : null}
                </View>

                {p.title ? <Text style={st.titlu}>{p.title}</Text> : null}
                <Text style={st.continut}>{p.content}</Text>

                {p.tags.length > 0 ? (
                  <View style={st.etichete}>
                    {p.tags.map((x) => (
                      <Text key={x} style={st.eticheta}>#{x}</Text>
                    ))}
                  </View>
                ) : null}
              </Card>
            </Reveal>

            <View style={st.titluFir}>
              <Text style={st.textTitluFir}>
                {comentarii.length === 0
                  ? "NICIUN COMENTARIU"
                  : `${comentarii.length} ${comentarii.length === 1 ? "COMENTARIU" : "COMENTARII"}`}
              </Text>
            </View>

            {comentarii.length === 0 ? (
              <Text style={st.gol}>
                Fii primul care răspunde. O întrebare bună ajută mai mult decât un
                „de acord”.
              </Text>
            ) : (
              comentarii.map((x, i) => {
                const provizoriu = x.id.startsWith("local-");
                return (
                  <Reveal key={x.id} intarziere={i < 8 ? i * 40 : 0} style={{ marginBottom: T.spacing.sm }}>
                    <Card nivel={1} style={provizoriu ? { opacity: 0.6 } : undefined}>
                      <View style={st.antetComentariu}>
                        <View style={st.avatarMic}>
                          <Text style={st.initialaMica}>
                            {(x.user.name ?? "?").trim().charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={st.autorComentariu} numberOfLines={1}>
                          {x.user.name ?? "Anonim"}
                        </Text>
                        <Text style={st.candComentariu}>
                          {provizoriu ? "se trimite…" : candva(x.createdAt)}
                        </Text>
                      </View>
                      <Text style={st.textComentariu}>{x.content}</Text>
                    </Card>
                  </Reveal>
                );
              })
            )}
          </>
        )}
      </Ecran>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  antet: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface.s4,
  },
  initiala: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
  },
  autor: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  cand: {
    color: T.ink.i4,
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  titlu: {
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    lineHeight: 21,
    marginTop: T.spacing.md,
  },
  continut: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    marginTop: 6,
  },
  etichete: { flexDirection: "row", flexWrap: "wrap", gap: T.spacing.sm, marginTop: T.spacing.sm },
  eticheta: {
    color: T.accent.base,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
  titluFir: { marginTop: T.spacing.xl, marginBottom: T.spacing.sm },
  textTitluFir: {
    color: T.ink.i4,
    fontSize: 10,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.wider,
  },
  gol: {
    color: T.ink.i4,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  antetComentariu: { flexDirection: "row", alignItems: "center", gap: T.spacing.sm },
  avatarMic: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface.s4,
  },
  initialaMica: {
    color: T.ink.i3,
    fontSize: 10,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
  },
  autorComentariu: {
    flex: 1,
    color: T.ink.i3,
    fontSize: T.fontSize.xs,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  candComentariu: {
    color: T.ink.i4,
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  textComentariu: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginTop: 6,
  },
  compunere: { flexDirection: "row", alignItems: "flex-end", gap: T.spacing.sm },
  camp: {
    flex: 1,
    maxHeight: 110,
    minHeight: ATINGERE_MIN,
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    backgroundColor: T.surface.s2,
    borderRadius: T.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l2,
    paddingHorizontal: T.spacing.lg,
    paddingVertical: T.spacing.md,
  },
  trimite: {
    width: ATINGERE_MIN,
    height: ATINGERE_MIN,
    borderRadius: T.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.accent.base,
  },
  inert: { opacity: 0.35 },
});
