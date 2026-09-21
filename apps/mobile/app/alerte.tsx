import * as React from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api } from "../src/lib/api";
import { useCerere } from "../src/lib/useCerere";
import { candva } from "../src/lib/format";
import { Card } from "../src/ui/Card";
import { Reveal } from "../src/ui/Reveal";
import { Schelet } from "../src/ui/Schelet";
import { AntetEcran, SPATIU_BARA } from "../src/ui/Ecran";
import { Gol, Segmente } from "../src/ui/parti";
import { T } from "../src/theme";

// ── Alerte ───────────────────────────────────────────────────────────────────
//
// Ce a observat sistemul fără să-l întrebi: o limită atinsă, un preț la nivel,
// o regulă încălcată, un cont sincronizat.
//
// SEVERITATEA DĂ CULOAREA, nu tipul. Un preț atins și o limită depășită sunt
// tipuri diferite, dar ochiul are nevoie de un singur lucru: cât de urgent e.
//
// CITIREA E UN GEST, nu un buton. Apeși alerta, se marchează citită. Un buton
// „marchează citit” pe fiecare rând ar fi însemnat două ținte de atingere pe
// un rând de patru centimetri.
//
// Ștergerea cere apăsare LUNGĂ. Pe o listă în care degetul derulează repede, o
// ștergere la o atingere e o pierdere de date la fiecare a zecea derulare.

interface Alerta {
  id: string;
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const SEVERITATE: Record<string, { culoare: string; iconita: React.ComponentProps<typeof Ionicons>["name"] }> = {
  CRITICAL: { culoare: T.pnl.loss, iconita: "alert-circle" },
  HIGH: { culoare: T.state.warn, iconita: "warning" },
  MEDIUM: { culoare: T.accent.base, iconita: "information-circle" },
  LOW: { culoare: T.ink.i4, iconita: "ellipse-outline" },
};

const FILTRE = [
  { v: "toate" as const, e: "Toate" },
  { v: "necitite" as const, e: "Necitite" },
];

export default function Alerte() {
  const [filtru, setFiltru] = React.useState<"toate" | "necitite">("toate");

  const c = useCerere<{ alerts: Alerta[]; unreadCount: number }>(
    () => api.alerts.list() as Promise<{ alerts: Alerta[]; unreadCount: number }>,
  );

  // Starea de citit se ține și local: serverul răspunde într-o secundă, dar
  // bifa trebuie să apară în aceeași clipă în care degetul atinge rândul.
  const [cititeLocal, setCititeLocal] = React.useState<Set<string>>(new Set());
  const [sterseLocal, setSterseLocal] = React.useState<Set<string>>(new Set());

  const toate = (c.date?.alerts ?? []).filter((a) => !sterseLocal.has(a.id));
  const esteCitita = (a: Alerta) => a.isRead || cititeLocal.has(a.id);
  const necitite = toate.filter((a) => !esteCitita(a)).length;
  const vizibile = filtru === "necitite" ? toate.filter((a) => !esteCitita(a)) : toate;

  const citeste = (a: Alerta) => {
    if (esteCitita(a)) return;
    Haptics.selectionAsync().catch(() => {});
    setCititeLocal((p) => new Set(p).add(a.id));
    api.alerts.markRead(a.id).catch(() => {});
  };

  const sterge = (a: Alerta) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSterseLocal((p) => new Set(p).add(a.id));
    api.alerts.remove(a.id).catch(() => {
      // Ștergerea a eșuat: readucem rândul, ca lista să nu mintă.
      setSterseLocal((p) => {
        const n = new Set(p);
        n.delete(a.id);
        return n;
      });
    });
  };

  const citesteTot = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setCititeLocal(new Set(toate.map((a) => a.id)));
    api.alerts.markAllRead().catch(() => {});
  };

  return (
    <View style={st.radacina}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <AntetEcran
          titlu="Alerte"
          subtitlu={necitite > 0 ? `${necitite} necitite` : "Toate citite"}
          actiune={
            necitite > 0 ? (
              <Pressable
                onPress={citesteTot}
                style={st.actiune}
                accessibilityRole="button"
                accessibilityLabel="Marchează toate ca citite"
                hitSlop={8}
              >
                <Ionicons name="checkmark-done" size={17} color={T.ink.i3} />
              </Pressable>
            ) : undefined
          }
        />

        <View style={st.filtre}>
          <Segmente valori={FILTRE} valoare={filtru} onSchimba={setFiltru} eticheta="Filtru alerte" />
        </View>

        {c.incarca && toate.length === 0 ? (
          <View style={st.continut}>
            {[0, 1, 2, 3].map((i) => (
              <Schelet key={i} inaltime={80} raza={T.radius.xl} style={{ marginBottom: T.spacing.sm }} />
            ))}
          </View>
        ) : (
          <FlatList
            data={vizibile}
            keyExtractor={(a) => a.id}
            contentContainerStyle={st.continut}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={c.reimprospateaza}
                onRefresh={c.reia}
                tintColor={T.accent.base}
                colors={[T.accent.base]}
                progressBackgroundColor={T.surface.s2}
              />
            }
            ListEmptyComponent={
              <Gol
                iconita="notifications-outline"
                titlu={filtru === "necitite" ? "Nimic necitit" : "Nicio alertă"}
                text={
                  filtru === "necitite"
                    ? "Ești la zi."
                    : "Alertele apar când o limită e atinsă, un preț ajunge la nivel sau un cont se sincronizează."
                }
              />
            }
            renderItem={({ item, index }) => (
              <Reveal
                intarziere={index < 8 ? index * 45 : 0}
                style={{ marginBottom: T.spacing.sm }}
              >
                <RandAlerta
                  a={item}
                  citita={esteCitita(item)}
                  onPress={() => citeste(item)}
                  onLongPress={() => sterge(item)}
                />
              </Reveal>
            )}
          />
        )}

        {c.eroare ? <Text style={st.eroare}>{c.eroare}</Text> : null}
      </SafeAreaView>
    </View>
  );
}

function RandAlerta({
  a, citita, onPress, onLongPress,
}: {
  a: Alerta;
  citita: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const s = SEVERITATE[a.severity] ?? SEVERITATE.LOW!;

  return (
    <Card
      onPress={onPress}
      onLongPress={onLongPress}
      culoareMuchie={citita ? "rgba(255,255,255,0.04)" : `${s.culoare}59`}
      accesibilEticheta={`${a.title}. ${citita ? "Citită" : "Necitită"}. Apasă lung ca să ștergi.`}
    >
      <View style={[st.rand, citita && st.citita]}>
        <View style={[st.iconita, { backgroundColor: `${s.culoare}1F` }]}>
          <Ionicons name={s.iconita} size={16} color={s.culoare} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={st.randSus}>
            <Text style={[st.titlu, citita && { color: T.ink.i3 }]} numberOfLines={1}>
              {a.title}
            </Text>
            {!citita ? <View style={[st.punct, { backgroundColor: s.culoare }]} /> : null}
          </View>
          <Text style={st.mesaj} numberOfLines={3}>{a.message}</Text>
          <Text style={st.cand}>{candva(a.createdAt)}</Text>
        </View>
      </View>
    </Card>
  );
}

const st = StyleSheet.create({
  radacina: { flex: 1, backgroundColor: T.surface.s0 },
  actiune: {
    width: 34,
    height: 34,
    borderRadius: T.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface.s3,
  },
  filtre: { paddingHorizontal: T.spacing.lg },
  continut: { paddingHorizontal: T.spacing.lg, paddingBottom: SPATIU_BARA },
  rand: { flexDirection: "row", gap: T.spacing.md, alignItems: "flex-start" },
  citita: { opacity: 0.62 },
  iconita: {
    width: 34,
    height: 34,
    borderRadius: T.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  randSus: { flexDirection: "row", alignItems: "center", gap: T.spacing.sm },
  titlu: {
    flex: 1,
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_700Bold",
  },
  punct: { width: 6, height: 6, borderRadius: 3 },
  mesaj: {
    color: T.ink.i3,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: 3,
  },
  cand: {
    color: T.ink.i4,
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 5,
  },
  eroare: {
    color: T.pnl.loss,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    padding: T.spacing.lg,
  },
});
