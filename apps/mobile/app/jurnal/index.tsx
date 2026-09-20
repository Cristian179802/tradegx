import * as React from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/lib/api";
import { useCerere } from "../../src/lib/useCerere";
import { bani, baniScurt, candva, numar, procent } from "../../src/lib/format";
import { Card } from "../../src/ui/Card";
import { Reveal } from "../../src/ui/Reveal";
import { Schelet } from "../../src/ui/Schelet";
import { AntetEcran, SPATIU_BARA } from "../../src/ui/Ecran";
import { BaraProgres, Gol, Segmente, Statistica } from "../../src/ui/parti";
import { T, tonPnl, cifre } from "../../src/theme";

// ── Jurnal detaliat ──────────────────────────────────────────────────────────
//
// Pagina web arată tranzacțiile într-un tabel cu note lângă fiecare. Pe telefon
// tabelul nu încape, deci întrebarea se schimbă: nu „ce s-a întâmplat la toate
// deodată", ci „care tranzacție n-am notat-o încă".
//
// De aceea filtrul implicit e TOATE, dar acoperirea (câte au notă) stă sus, ca
// cifră, cu bară. Un jurnal pe jumătate completat nu e un jurnal — iar cifra
// asta e singurul lucru care te face să-l completezi.
//
// `FlatList`, nu `ScrollView`: ruta întoarce până la 200 de tranzacții, iar
// fiecare rând are stare proprie. Antetul intră ca `ListHeaderComponent`, deci
// se derulează odată cu lista, fără a doua zonă de derulare.

const CASCADA_MAX = 8;

interface Jurnal {
  preNotes: string | null;
  preEmotionalState: string | null;
  preConfidence: number | null;
  postNotes: string | null;
  postEmotionalState: string | null;
  postMistakeTypes: string[];
  postLessons: string | null;
  aiAnalysis: string | null;
  aiScore: number | null;
}

interface TranzactieJurnal {
  id: string;
  symbol: string;
  direction: "BUY" | "SELL";
  lotSize: number;
  pnlMoney: number | null;
  pnlPips: number | null;
  riskRewardRatio: number | null;
  setupType: string | null;
  exitTime: string | null;
  entryTime: string;
  journal: Jurnal | null;
}

interface Raspuns {
  trades: TranzactieJurnal[];
  stats: {
    totalTrades: number;
    journaled: number;
    wins: number;
    losses: number;
    netPnl: number;
    winRate: number | null;
    avgRR: number | null;
    currency: string;
  };
}

type Filtru = "toate" | "notate" | "nenotate";

const FILTRE = [
  { v: "toate" as const, e: "Toate" },
  { v: "nenotate" as const, e: "De notat" },
  { v: "notate" as const, e: "Notate" },
];

export default function JurnalDetaliat() {
  const router = useRouter();
  const [filtru, setFiltru] = React.useState<Filtru>("toate");

  const c = useCerere<Raspuns>(() => api.journal.list() as Promise<Raspuns>);

  const toate = c.date?.trades ?? [];
  const s = c.date?.stats;
  const moneda = s?.currency ?? "USD";

  const vizibile = React.useMemo(() => {
    if (filtru === "notate") return toate.filter((t) => t.journal);
    if (filtru === "nenotate") return toate.filter((t) => !t.journal);
    return toate;
  }, [toate, filtru]);

  const acoperire = s && s.totalTrades > 0 ? s.journaled / s.totalTrades : 0;

  return (
    <View style={st.radacina}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <AntetEcran
          titlu="Jurnal"
          subtitlu={s ? `${s.journaled} din ${s.totalTrades} tranzacții notate` : null}
        />

        {c.incarca && toate.length === 0 ? (
          <View style={st.continut}>
            <Schelet inaltime={150} raza={T.radius.xl} style={{ marginBottom: T.spacing.md }} />
            {[0, 1, 2, 3].map((i) => (
              <Schelet key={i} inaltime={76} raza={T.radius.xl} style={{ marginBottom: T.spacing.sm }} />
            ))}
          </View>
        ) : (
          <FlatList
            data={vizibile}
            keyExtractor={(t) => t.id}
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
            ListHeaderComponent={
              <View>
                {s ? (
                  <Reveal>
                    <Card>
                      <View style={st.grila}>
                        <Statistica
                          eticheta="Rezultat net"
                          valoare={baniScurt(s.netPnl, moneda)}
                          culoare={tonPnl(s.netPnl)}
                          marime={T.fontSize.xl}
                          style={st.celula}
                        />
                        <Statistica
                          eticheta="Rată de câștig"
                          valoare={procent(s.winRate)}
                          marime={T.fontSize.xl}
                          intarziere={80}
                          nota={`${s.wins}W / ${s.losses}L`}
                          style={st.celula}
                        />
                        <Statistica
                          eticheta="RR mediu"
                          valoare={s.avgRR == null ? "—" : numar(s.avgRR, 2)}
                          marime={T.fontSize.lg}
                          intarziere={160}
                          style={st.celula}
                        />
                        <Statistica
                          eticheta="Acoperire"
                          valoare={procent(acoperire * 100, 0)}
                          marime={T.fontSize.lg}
                          intarziere={240}
                          culoare={acoperire >= 0.8 ? T.pnl.gain : T.ink.i1}
                          style={st.celula}
                        />
                      </View>

                      <BaraProgres
                        fractiune={acoperire}
                        culoare={acoperire >= 0.8 ? T.pnl.gain : T.accent.base}
                        style={{ marginTop: T.spacing.lg }}
                      />
                      <Text style={st.notaAcoperire}>
                        {acoperire >= 0.999
                          ? "Toate tranzacțiile au notă. Asta e jurnalul complet."
                          : `Mai ai ${s.totalTrades - s.journaled} de notat.`}
                      </Text>
                    </Card>
                  </Reveal>
                ) : null}

                <Segmente valori={FILTRE} valoare={filtru} onSchimba={setFiltru} eticheta="Filtru jurnal" />
              </View>
            }
            ListEmptyComponent={
              <Gol
                iconita="create-outline"
                titlu={
                  filtru === "notate"
                    ? "Nicio tranzacție notată încă"
                    : filtru === "nenotate"
                      ? "Toate tranzacțiile au notă"
                      : "Nicio tranzacție închisă"
                }
                text={
                  filtru === "nenotate"
                    ? "Nu mai ai nimic de completat."
                    : "Notele se scriu după ce tranzacția s-a închis."
                }
              />
            }
            renderItem={({ item, index }) => (
              <Reveal
                intarziere={index < CASCADA_MAX ? index * 45 : 0}
                style={{ marginBottom: T.spacing.sm }}
              >
                <RandJurnal
                  t={item}
                  moneda={moneda}
                  onPress={() => router.push(`/jurnal/${item.id}`)}
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

function RandJurnal({
  t, moneda, onPress,
}: {
  t: TranzactieJurnal;
  moneda: string;
  onPress: () => void;
}) {
  const notat = Boolean(t.journal);
  const pnl = t.pnlMoney;
  const nota = t.journal?.postLessons || t.journal?.postNotes || t.journal?.preNotes || null;

  return (
    <Card
      onPress={onPress}
      culoareMuchie={notat ? T.accent.line : "rgba(255,255,255,0.05)"}
      accesibilEticheta={`${t.symbol}, ${notat ? "notată" : "fără notă"}, ${pnl == null ? "fără rezultat" : bani(pnl, moneda)}`}
    >
      <View style={st.rand}>
        <View style={[st.bifa, notat && st.bifaPlina]}>
          <Ionicons
            name={notat ? "checkmark" : "ellipsis-horizontal"}
            size={15}
            color={notat ? T.accent.base : T.ink.i4}
          />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={st.randSus}>
            <Text style={st.simbol} numberOfLines={1}>{t.symbol}</Text>
            <Text style={st.directie}>{t.direction === "BUY" ? "CUMPĂRARE" : "VÂNZARE"}</Text>
            {t.journal?.aiScore != null ? (
              <View style={st.scor}>
                <Ionicons name="sparkles" size={9} color={T.accent.base} />
                <Text style={st.textScor}>{t.journal.aiScore.toFixed(0)}</Text>
              </View>
            ) : null}
          </View>
          <Text style={st.meta} numberOfLines={1}>
            {nota ?? `${candva(t.exitTime ?? t.entryTime)} · ${t.lotSize.toFixed(2)} loturi`}
          </Text>
        </View>

        <Text style={[st.pnl, cifre, { color: tonPnl(pnl) }]}>
          {pnl == null ? "—" : bani(pnl, moneda)}
        </Text>
      </View>
    </Card>
  );
}

const st = StyleSheet.create({
  radacina: { flex: 1, backgroundColor: T.surface.s0 },
  continut: { paddingHorizontal: T.spacing.lg, paddingBottom: SPATIU_BARA },
  grila: { flexDirection: "row", flexWrap: "wrap", rowGap: T.spacing.lg },
  celula: { width: "50%" },
  notaAcoperire: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: T.spacing.sm,
  },
  rand: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  bifa: {
    width: 30,
    height: 30,
    borderRadius: T.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface.s4,
  },
  bifaPlina: {
    backgroundColor: T.accent.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.accent.line,
  },
  randSus: { flexDirection: "row", alignItems: "center", gap: T.spacing.sm },
  simbol: {
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.tight,
  },
  directie: {
    color: T.ink.i4,
    fontSize: 9,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.wide,
  },
  scor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: T.radius.sm,
    backgroundColor: T.accent.soft,
  },
  textScor: {
    color: T.accent.base,
    fontSize: 9,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
  },
  meta: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
  },
  pnl: {
    fontSize: T.fontSize.sm,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
  },
  eroare: {
    color: T.pnl.loss,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    padding: T.spacing.lg,
  },
});
