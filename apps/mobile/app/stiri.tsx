import * as React from "react";
import { FlatList, Linking, RefreshControl, StyleSheet, Text, View } from "react-native";
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

// ── Știri ────────────────────────────────────────────────────────────────────
//
// Fluxurile aduc douăzeci de titluri; dintre ele, două-trei mișcă piața.
// Impactul e calculat pe server, pe cuvinte-cheie macro, iar filtrul „doar
// impact mare" e de fapt singurul mod în care ecranul ăsta e util înainte de o
// intrare.
//
// ARTICOLUL SE DESCHIDE ÎN BROWSER, deliberat. Un cititor propriu ar fi
// însemnat să extrag textul din pagini care nu sunt ale noastre — se strică la
// fiecare redesign al sursei, și oricum omul vrea contextul complet, cu
// graficele și sursele lui.
//
// Titlurile rămân în engleză, cum vin din flux. Traducerea automată a unui
// titlu financiar strică exact termenii după care se recunoaște: „hawkish” nu
// are un echivalent scurt care să însemne același lucru.

interface Stire {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  description: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
}

const FILTRE = [
  { v: "toate" as const, e: "Toate" },
  { v: "mare" as const, e: "Impact mare" },
];

const CULOARE: Record<string, string> = {
  HIGH: T.pnl.loss,
  MEDIUM: T.state.warn,
  LOW: T.ink.i4,
};

const ETICHETA: Record<string, string> = {
  HIGH: "impact mare",
  MEDIUM: "impact mediu",
  LOW: "context",
};

export default function Stiri() {
  const [filtru, setFiltru] = React.useState<"toate" | "mare">("toate");

  const c = useCerere<{ items: Stire[]; cached: boolean }>(
    () => api.news() as Promise<{ items: Stire[]; cached: boolean }>,
  );

  const toate = c.date?.items ?? [];
  const vizibile = filtru === "mare" ? toate.filter((s) => s.impact === "HIGH") : toate;
  const mari = toate.filter((s) => s.impact === "HIGH").length;

  const deschide = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={st.radacina}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <AntetEcran
          titlu="Știri"
          subtitlu={toate.length > 0 ? `${toate.length} titluri · ${mari} cu impact mare` : "Ce se scrie acum"}
        />

        <View style={st.filtre}>
          <Segmente valori={FILTRE} valoare={filtru} onSchimba={setFiltru} eticheta="Filtru știri" />
        </View>

        {c.incarca && toate.length === 0 ? (
          <View style={st.continut}>
            {[0, 1, 2, 3].map((i) => (
              <Schelet key={i} inaltime={92} raza={T.radius.xl} style={{ marginBottom: T.spacing.sm }} />
            ))}
          </View>
        ) : (
          <FlatList
            data={vizibile}
            keyExtractor={(s, i) => `${s.link}-${i}`}
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
                iconita="newspaper-outline"
                titlu={filtru === "mare" ? "Nicio știre de impact mare" : "Niciun titlu"}
                text={
                  filtru === "mare"
                    ? "Nimic care să miște piața în ultimele ore."
                    : "Fluxurile de știri nu răspund acum. Trage în jos ca să reîncerci."
                }
              />
            }
            renderItem={({ item, index }) => (
              <Reveal intarziere={index < 8 ? index * 45 : 0} style={{ marginBottom: T.spacing.sm }}>
                <Card
                  onPress={() => deschide(item.link)}
                  culoareMuchie={item.impact === "HIGH" ? "rgba(251,113,133,0.30)" : "rgba(255,255,255,0.04)"}
                  accesibilEticheta={`${item.title}. ${ETICHETA[item.impact] ?? ""}. Se deschide în browser.`}
                >
                  <View style={st.antet}>
                    <View style={[st.pastilaImpact, { backgroundColor: `${CULOARE[item.impact] ?? T.ink.i4}1F` }]}>
                      <Text style={[st.textImpact, { color: CULOARE[item.impact] ?? T.ink.i4 }]}>
                        {ETICHETA[item.impact] ?? "context"}
                      </Text>
                    </View>
                    <Text style={st.sursa} numberOfLines={1}>{item.source}</Text>
                    <Text style={st.cand}>{candva(item.pubDate)}</Text>
                  </View>

                  <Text style={st.titlu} numberOfLines={3}>{item.title}</Text>

                  {item.description ? (
                    <Text style={st.descriere} numberOfLines={2}>{item.description}</Text>
                  ) : null}

                  <View style={st.jos}>
                    <Text style={st.citeste}>Citește pe {item.source}</Text>
                    <Ionicons name="open-outline" size={13} color={T.ink.i4} />
                  </View>
                </Card>
              </Reveal>
            )}
          />
        )}

        {c.eroare ? <Text style={st.eroare}>{c.eroare}</Text> : null}
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  radacina: { flex: 1, backgroundColor: T.surface.s0 },
  filtre: { paddingHorizontal: T.spacing.lg },
  continut: { paddingHorizontal: T.spacing.lg, paddingBottom: SPATIU_BARA },
  antet: { flexDirection: "row", alignItems: "center", gap: T.spacing.sm },
  pastilaImpact: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: T.radius.sm,
  },
  textImpact: {
    fontSize: 9,
    fontFamily: "Inter_800ExtraBold",
    textTransform: "uppercase",
    letterSpacing: T.tracking.wide,
  },
  sursa: {
    flex: 1,
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
  cand: {
    color: T.ink.i4,
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  titlu: {
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_700Bold",
    lineHeight: 20,
    marginTop: T.spacing.sm,
  },
  descriere: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: 5,
  },
  jos: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: T.spacing.md,
  },
  citeste: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_700Bold",
  },
  eroare: {
    color: T.pnl.loss,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    padding: T.spacing.lg,
  },
});
