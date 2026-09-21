import * as React from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  continutLocal,
  aduContinut,
  textul,
  type ContinutAcademie,
  type GlossaryEntry,
} from "../../src/lib/academia";
import { Card } from "../../src/ui/Card";
import { Reveal } from "../../src/ui/Reveal";
import { Schelet } from "../../src/ui/Schelet";
import { AntetEcran, SPATIU_BARA } from "../../src/ui/Ecran";
import { Gol, Insigna } from "../../src/ui/parti";
import { T, ATINGERE_MIN } from "../../src/theme";

// ── Glosar ───────────────────────────────────────────────────────────────────
//
// Un începător se blochează la primul cuvânt pe care nu-l știe și, de obicei,
// nu-l caută — închide aplicația. De aceea fiecare termen scris `[[așa]]` în
// lecții se poate apăsa și ajunge AICI, deschis.
//
// CĂUTAREA PRINDE ȘI SINONIMELE. Cineva care caută „SL” trebuie să găsească
// „Stop Loss”; un glosar care cere termenul exact e un dicționar pentru cine
// știe deja cuvântul.
//
// Termenul venit din lecție sare în capul listei și rămâne evidențiat, ca ochiul
// să-l găsească fără să citească toată pagina.

interface Rand extends GlossaryEntry {
  slug: string;
}

export default function Glosar() {
  const { termen } = useLocalSearchParams<{ termen?: string }>();
  const router = useRouter();

  const [continut, setContinut] = React.useState<ContinutAcademie | null>(null);
  const [incarca, setIncarca] = React.useState(true);
  const [cautare, setCautare] = React.useState("");

  React.useEffect(() => {
    let anulat = false;
    (async () => {
      const local = await continutLocal();
      if (!anulat && local) setContinut(local);
      if (!local) {
        try {
          const proaspat = await aduContinut();
          if (!anulat) setContinut(proaspat);
        } catch { /* ecranul o spune */ }
      }
      if (!anulat) setIncarca(false);
    })();
    return () => { anulat = true; };
  }, []);

  const toate = React.useMemo<Rand[]>(() => {
    const g = continut?.glossary ?? {};
    return Object.entries(g)
      .map(([slug, e]) => ({ slug, ...e }))
      .sort((a, b) => textul(a.term).localeCompare(textul(b.term), "ro"));
  }, [continut?.glossary]);

  const cautat = String(termen ?? "");

  const vizibile = React.useMemo(() => {
    const q = cautare.trim().toLowerCase();
    const filtrate = q
      ? toate.filter(
          (r) =>
            textul(r.term).toLowerCase().includes(q) ||
            textul(r.def).toLowerCase().includes(q) ||
            r.slug.includes(q) ||
            (r.aliases ?? []).some((a) => a.toLowerCase().includes(q)),
        )
      : toate;

    // Termenul cerut din lecție trece primul, ca să nu fie căutat cu ochiul.
    if (!cautat) return filtrate;
    const i = filtrate.findIndex((r) => r.slug === cautat);
    if (i <= 0) return filtrate;
    return [filtrate[i]!, ...filtrate.slice(0, i), ...filtrate.slice(i + 1)];
  }, [toate, cautare, cautat]);

  return (
    <View style={st.radacina}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <AntetEcran
          titlu="Glosar"
          subtitlu={toate.length > 0 ? `${toate.length} termeni` : "Cuvintele din lecții"}
        />

        <View style={st.cautare}>
          <Ionicons name="search" size={15} color={T.ink.i4} />
          <TextInput
            value={cautare}
            onChangeText={setCautare}
            placeholder="Caută un termen…"
            placeholderTextColor={T.ink.i4}
            selectionColor={T.accent.base}
            autoCapitalize="none"
            autoCorrect={false}
            style={st.camp}
          />
          {cautare ? (
            <Ionicons
              name="close-circle"
              size={16}
              color={T.ink.i4}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setCautare("");
              }}
            />
          ) : null}
        </View>

        {incarca && toate.length === 0 ? (
          <View style={st.continut}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Schelet key={i} inaltime={78} raza={T.radius.xl} style={{ marginBottom: T.spacing.sm }} />
            ))}
          </View>
        ) : (
          <FlatList
            data={vizibile}
            keyExtractor={(r) => r.slug}
            contentContainerStyle={st.continut}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Gol
                iconita="search-outline"
                titlu={cautare ? "Niciun termen găsit" : "Glosarul nu s-a încărcat"}
                text={
                  cautare
                    ? "Încearcă alt cuvânt, sau caută în definiții."
                    : "Prima deschidere are nevoie de semnal."
                }
              />
            }
            renderItem={({ item, index }) => {
              const evidentiat = item.slug === cautat;
              return (
                <Reveal
                  intarziere={index < 8 ? index * 40 : 0}
                  style={{ marginBottom: T.spacing.sm }}
                >
                  <Card
                    nivel={1}
                    culoareMuchie={evidentiat ? T.accent.line : "rgba(255,255,255,0.04)"}
                    onPress={
                      item.module
                        ? () => router.push(`/academia/${item.module}`)
                        : undefined
                    }
                    accesibilEticheta={`${textul(item.term)}. ${textul(item.def)}`}
                  >
                    <View style={st.randTermen}>
                      <Text style={[st.termen, evidentiat && { color: T.accent.base }]}>
                        {textul(item.term)}
                      </Text>
                      {item.module ? (
                        <View style={st.catreModul}>
                          <Text style={st.textCatreModul}>învață</Text>
                          <Ionicons name="chevron-forward" size={11} color={T.ink.i4} />
                        </View>
                      ) : null}
                    </View>
                    <Text style={st.definitie}>{textul(item.def)}</Text>
                    {item.aliases && item.aliases.length > 0 ? (
                      <View style={st.sinonime}>
                        {item.aliases.slice(0, 4).map((a) => (
                          <Insigna key={a} text={a} culoare={T.ink.i4} />
                        ))}
                      </View>
                    ) : null}
                  </Card>
                </Reveal>
              );
            }}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  radacina: { flex: 1, backgroundColor: T.surface.s0 },
  cautare: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.sm,
    marginHorizontal: T.spacing.lg,
    marginBottom: T.spacing.md,
    paddingHorizontal: T.spacing.md,
    minHeight: ATINGERE_MIN,
    borderRadius: T.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    backgroundColor: T.surface.s3,
  },
  camp: {
    flex: 1,
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    paddingVertical: T.spacing.sm,
  },
  continut: { paddingHorizontal: T.spacing.lg, paddingBottom: SPATIU_BARA },
  randTermen: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: T.spacing.sm,
  },
  termen: {
    flex: 1,
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.tight,
  },
  catreModul: { flexDirection: "row", alignItems: "center", gap: 2 },
  textCatreModul: {
    color: T.ink.i4,
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  definitie: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginTop: 5,
  },
  sinonime: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: T.spacing.sm },
});
