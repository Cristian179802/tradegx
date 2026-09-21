import * as React from "react";
import { SectionList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../src/lib/api";
import { useCerere } from "../src/lib/useCerere";
import { Card } from "../src/ui/Card";
import { Reveal } from "../src/ui/Reveal";
import { Schelet } from "../src/ui/Schelet";
import { AntetEcran, SPATIU_BARA } from "../src/ui/Ecran";
import { Gol, Segmente } from "../src/ui/parti";
import { T, cifre } from "../src/theme";

// ── Calendar economic ────────────────────────────────────────────────────────
//
// Întrebarea de dimineață e „ce mă poate lovi azi”, nu „ce s-a anunțat
// săptămâna asta". De aceea lista e grupată pe ZILE, cu ziua de azi lipită sus
// cât derulezi — altfel, pe o săptămână cu optzeci de evenimente, nu mai știi
// unde ești.
//
// IMPACTUL E UN FILTRU, nu o culoare de fundal. Cine vine aici înainte de o
// intrare vrea doar evenimentele mari; restul sunt zgomot care îi acoperă
// exact ce caută.
//
// ORELE SUNT ALE TELEFONULUI. Ruta întoarce UTC; afișat ca atare, cineva din
// România ar fi ratat un NFP cu trei ore. Conversia se face la desenare.

interface Eveniment {
  id: string;
  title: string;
  currency: string;
  country: string;
  utcDate: string;
  impact: "High" | "Medium" | "Low" | "Holiday";
  forecast: string;
  previous: string;
  actual: string;
  isBetter: boolean;
  isWorse: boolean;
  allDay: boolean;
}

interface Raspuns {
  events: Eveniment[];
  count: number;
  high: number;
  medium: number;
  low: number;
}

const SAPTAMANI = [
  { v: "last" as const, e: "Trecută" },
  { v: "this" as const, e: "Săptămâna asta" },
  { v: "next" as const, e: "Următoarea" },
];

const IMPACTURI = [
  { v: "toate" as const, e: "Toate" },
  { v: "mare" as const, e: "Doar impact mare" },
];

const CULOARE_IMPACT: Record<string, string> = {
  High: T.pnl.loss,
  Medium: T.state.warn,
  Low: T.ink.i4,
  Holiday: T.accent.base,
};

const ZI = new Intl.DateTimeFormat("ro-RO", { weekday: "long", day: "numeric", month: "long" });
const ORA = new Intl.DateTimeFormat("ro-RO", { hour: "2-digit", minute: "2-digit" });

export default function Calendar() {
  const [saptamana, setSaptamana] = React.useState<"last" | "this" | "next">("this");
  const [impact, setImpact] = React.useState<"toate" | "mare">("toate");

  const c = useCerere<Raspuns>(
    () => api.calendar(saptamana) as Promise<Raspuns>,
    [saptamana],
  );

  const sectiuni = React.useMemo(() => {
    const toate = c.date?.events ?? [];
    const vizibile = impact === "mare" ? toate.filter((e) => e.impact === "High") : toate;

    const peZi = new Map<string, Eveniment[]>();
    for (const e of vizibile) {
      const d = new Date(e.utcDate);
      if (Number.isNaN(d.getTime())) continue;
      // Cheia e ziua LOCALĂ, nu cea UTC: un eveniment de la 23:30 UTC cade
      // mâine pentru cineva din România, și acolo trebuie să apară.
      const cheie = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const lista = peZi.get(cheie) ?? [];
      lista.push(e);
      peZi.set(cheie, lista);
    }

    const azi = new Date();
    const cheiaDeAzi = `${azi.getFullYear()}-${azi.getMonth()}-${azi.getDate()}`;

    return [...peZi.entries()].map(([cheie, date]) => ({
      cheie,
      titlu: ZI.format(new Date(date[0]!.utcDate)),
      esteAzi: cheie === cheiaDeAzi,
      data: date,
    }));
  }, [c.date?.events, impact]);

  return (
    <View style={st.radacina}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <AntetEcran
          titlu="Calendar"
          subtitlu={c.date ? `${c.date.count} evenimente · ${c.date.high} cu impact mare` : "Ce mișcă piața"}
        />

        <View style={st.filtre}>
          <Segmente valori={SAPTAMANI} valoare={saptamana} onSchimba={setSaptamana} eticheta="Săptămâna" />
          <Segmente valori={IMPACTURI} valoare={impact} onSchimba={setImpact} eticheta="Impact" />
        </View>

        {c.incarca && !c.date ? (
          <View style={st.continut}>
            {[0, 1, 2, 3].map((i) => (
              <Schelet key={i} inaltime={72} raza={T.radius.xl} style={{ marginBottom: T.spacing.sm }} />
            ))}
          </View>
        ) : (
          <SectionList
            sections={sectiuni}
            keyExtractor={(e) => e.id}
            stickySectionHeadersEnabled
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
                iconita="calendar-outline"
                titlu={impact === "mare" ? "Niciun eveniment mare" : "Niciun eveniment"}
                text={
                  impact === "mare"
                    ? "Săptămâna asta n-are anunțuri de impact mare. Zi liniștită."
                    : "Sursa de calendar nu a întors nimic pentru intervalul ăsta."
                }
              />
            }
            renderSectionHeader={({ section }) => (
              <View style={st.antetZi}>
                <Text style={[st.textZi, section.esteAzi && { color: T.accent.base }]}>
                  {section.esteAzi ? `Azi · ${section.titlu}` : section.titlu}
                </Text>
              </View>
            )}
            renderItem={({ item, index }) => (
              <Reveal intarziere={index < 6 ? index * 40 : 0} style={{ marginBottom: T.spacing.sm }}>
                <RandEveniment e={item} />
              </Reveal>
            )}
          />
        )}

        {c.eroare ? <Text style={st.eroare}>{c.eroare}</Text> : null}
      </SafeAreaView>
    </View>
  );
}

function RandEveniment({ e }: { e: Eveniment }) {
  const culoare = CULOARE_IMPACT[e.impact] ?? T.ink.i4;
  const d = new Date(e.utcDate);
  const trecut = d.getTime() < Date.now();

  return (
    <Card nivel={1} culoareMuchie={e.impact === "High" ? `${culoare}4D` : "rgba(255,255,255,0.04)"}>
      <View style={[st.rand, trecut && { opacity: 0.68 }]}>
        <View style={st.ora}>
          <Text style={[st.textOra, cifre]}>{e.allDay ? "—" : ORA.format(d)}</Text>
          <View style={st.puncte}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  st.punctImpact,
                  {
                    backgroundColor:
                      i < nivelImpact(e.impact) ? culoare : T.surface.s4,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={st.randTitlu}>
            <Text style={st.moneda}>{e.currency}</Text>
            <Text style={st.titlu} numberOfLines={2}>{e.title}</Text>
          </View>

          {e.actual || e.forecast || e.previous ? (
            <View style={st.cifre}>
              <Cifra eticheta="Real" valoare={e.actual} evidentiat culoareForte={
                e.isBetter ? T.pnl.gain : e.isWorse ? T.pnl.loss : undefined
              } />
              <Cifra eticheta="Estimat" valoare={e.forecast} />
              <Cifra eticheta="Anterior" valoare={e.previous} />
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

function Cifra({
  eticheta, valoare, evidentiat = false, culoareForte,
}: {
  eticheta: string;
  valoare: string;
  evidentiat?: boolean;
  culoareForte?: string;
}) {
  if (!valoare) return null;
  return (
    <View style={st.cifra}>
      <Text style={st.etichetaCifra}>{eticheta}</Text>
      <Text
        style={[
          st.valoareCifra,
          cifre,
          evidentiat && { color: T.ink.i1 },
          culoareForte ? { color: culoareForte } : null,
        ]}
        numberOfLines={1}
      >
        {valoare}
      </Text>
    </View>
  );
}

function nivelImpact(i: string): number {
  if (i === "High") return 3;
  if (i === "Medium") return 2;
  if (i === "Holiday") return 1;
  return 1;
}

const st = StyleSheet.create({
  radacina: { flex: 1, backgroundColor: T.surface.s0 },
  filtre: { paddingHorizontal: T.spacing.lg },
  continut: { paddingHorizontal: T.spacing.lg, paddingBottom: SPATIU_BARA },
  antetZi: {
    backgroundColor: T.surface.s0,
    paddingTop: T.spacing.lg,
    paddingBottom: T.spacing.sm,
  },
  textZi: {
    color: T.ink.i4,
    fontSize: 10,
    fontFamily: "Inter_800ExtraBold",
    textTransform: "uppercase",
    letterSpacing: T.tracking.wider,
  },
  rand: { flexDirection: "row", gap: T.spacing.md },
  ora: { width: 52, alignItems: "flex-start" },
  textOra: {
    color: T.ink.i2,
    fontSize: T.fontSize.xs,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  puncte: { flexDirection: "row", gap: 3, marginTop: 5 },
  punctImpact: { width: 5, height: 5, borderRadius: 3 },
  randTitlu: { flexDirection: "row", gap: T.spacing.sm, alignItems: "flex-start" },
  moneda: {
    color: T.ink.i4,
    fontSize: 10,
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.wide,
    marginTop: 2,
  },
  titlu: {
    flex: 1,
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  cifre: { flexDirection: "row", gap: T.spacing.lg, marginTop: T.spacing.sm },
  cifra: {},
  etichetaCifra: {
    color: T.ink.i4,
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.wide,
  },
  valoareCifra: {
    color: T.ink.i3,
    fontSize: T.fontSize.xs,
    fontFamily: "SpaceGrotesk_700Bold",
    marginTop: 2,
  },
  eroare: {
    color: T.pnl.loss,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    padding: T.spacing.lg,
  },
});
