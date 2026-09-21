import * as React from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api } from "../../src/lib/api";
import { useCerere } from "../../src/lib/useCerere";
import { bani, candva } from "../../src/lib/format";
import { Buton } from "../../src/ui/Buton";
import { Card } from "../../src/ui/Card";
import { Reveal } from "../../src/ui/Reveal";
import { Schelet } from "../../src/ui/Schelet";
import { SPATIU_BARA } from "../../src/ui/Ecran";
import { T, tonPnl, cifre, ATINGERE_MIN } from "../../src/theme";

// ── Tranzacții ───────────────────────────────────────────────────────────────
//
// `FlatList`, nu `ScrollView` cu `.map()`. La o sută de tranzacții diferența e
// între o listă care curge și una care se blochează la derulare: FlatList
// randează doar ce e pe ecran.
//
// Filtrele sunt TREI, nu un panou: tot, deschise, închise. Pe telefon, un
// formular de filtrare cu șase câmpuri e mai lent decât derulatul.
//
// Cascada de intrare merge doar pe primele elemente. Dacă fiecare rând din o
// sută ar avea întârziere, ultimul ar apărea după șapte secunde.

const CASCADA_MAX = 8;

interface Tranzactie {
  id: string;
  symbol: string;
  direction: string;
  lotSize: number | string;
  pnlMoney: number | string | null;
  entryTime: string;
  exitTime: string | null;
  status: string;
  setup?: string | null;
}

type Filtru = "toate" | "deschise" | "inchise";

export default function Tranzactii() {
  const router = useRouter();
  const [filtru, setFiltru] = React.useState<Filtru>("toate");

  const lista = useCerere<{ trades: Tranzactie[] }>(
    () => api.trades.list() as Promise<{ trades: Tranzactie[] }>,
  );

  const toate = lista.date?.trades ?? [];
  const vizibile = React.useMemo(() => {
    if (filtru === "deschise") return toate.filter((t) => t.status === "OPEN");
    if (filtru === "inchise") return toate.filter((t) => t.status !== "OPEN");
    return toate;
  }, [toate, filtru]);

  const moneda = "USD";

  return (
    <View style={st.radacina}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={st.antet}>
          <Text style={st.titlu}>Tranzacții</Text>
          <Text style={st.numar}>
            {vizibile.length} {vizibile.length === 1 ? "tranzacție" : "tranzacții"}
          </Text>
        </View>

        <View style={st.filtre}>
          {(["toate", "deschise", "inchise"] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setFiltru(f);
              }}
              style={[st.pastila, filtru === f && st.pastilaActiva]}
              accessibilityRole="button"
              accessibilityState={{ selected: filtru === f }}
            >
              <Text style={[st.textPastila, filtru === f && st.textPastilaActiv]}>
                {f === "toate" ? "Toate" : f === "deschise" ? "Deschise" : "Închise"}
              </Text>
            </Pressable>
          ))}
        </View>

        {lista.incarca && toate.length === 0 ? (
          <View style={st.continut}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Schelet key={i} inaltime={74} raza={T.radius.xl} style={{ marginBottom: T.spacing.sm }} />
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
                refreshing={lista.reimprospateaza}
                onRefresh={lista.reia}
                tintColor={T.accent.base}
                colors={[T.accent.base]}
                progressBackgroundColor={T.surface.s2}
              />
            }
            ListEmptyComponent={
              <Card style={{ marginTop: T.spacing.lg }}>
                <Text style={st.gol}>
                  {filtru === "deschise"
                    ? "Nicio poziție deschisă acum. Aici apar tranzacțiile cât timp sunt în piață, cu profitul care se mișcă."
                    : filtru === "inchise"
                      ? "Nicio tranzacție închisă încă. Aici ajung după ce le închizi, cu rezultatul final și nota ta."
                      : "Jurnalul tău de tranzacții. Notezi fiecare intrare — simbol, direcție, stop, rezultat — și din ele se calculează statisticile, tiparele și raportul lunar. Fără intrări notate, restul aplicației n-are ce analiza."}
                </Text>
                {toate.length === 0 ? (
                  <Buton
                    eticheta="Notează prima tranzacție"
                    onPress={() => router.push("/(tabs)/adauga")}
                    plin
                    iconita={<Ionicons name="add" size={16} color="#ffffff" />}
                    style={{ marginTop: T.spacing.lg }}
                  />
                ) : null}
              </Card>
            }
            renderItem={({ item, index }) => (
              <Reveal
                intarziere={index < CASCADA_MAX ? index * 45 : 0}
                style={{ marginBottom: T.spacing.sm }}
              >
                <Rand
                  t={item}
                  moneda={moneda}
                  onPress={() => router.push(`/tranzactie/${item.id}`)}
                />
              </Reveal>
            )}
          />
        )}

        {lista.eroare ? <Text style={st.eroare}>{lista.eroare}</Text> : null}
      </SafeAreaView>
    </View>
  );
}

function Rand({
  t, moneda, onPress,
}: {
  t: Tranzactie;
  moneda: string;
  onPress: () => void;
}) {
  const pnl = t.pnlMoney == null ? null : Number(t.pnlMoney);
  const deschisa = t.status === "OPEN";
  const cumparare = t.direction === "BUY";

  return (
    <Card
      onPress={onPress}
      culoareMuchie={deschisa ? T.accent.line : pnl != null && pnl < 0 ? "rgba(251,113,133,0.30)" : "rgba(52,211,153,0.30)"}
      accesibilEticheta={`${t.symbol}, ${cumparare ? "cumpărare" : "vânzare"}, ${pnl == null ? "în desfășurare" : bani(pnl, moneda)}`}
    >
      <View style={st.rand}>
        <View
          style={[
            st.directie,
            { backgroundColor: cumparare ? "rgba(52,211,153,0.12)" : "rgba(251,113,133,0.12)" },
          ]}
        >
          <Ionicons
            name={cumparare ? "trending-up" : "trending-down"}
            size={18}
            color={cumparare ? T.pnl.gain : T.pnl.loss}
          />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={st.randSimbol}>
            <Text style={st.simbol} numberOfLines={1}>{t.symbol}</Text>
            {t.setup ? <Text style={st.setup} numberOfLines={1}>{t.setup}</Text> : null}
          </View>
          <Text style={st.meta}>
            {Number(t.lotSize).toFixed(2)} loturi · {deschisa ? "deschisă" : candva(t.exitTime ?? t.entryTime)}
          </Text>
        </View>

        {deschisa ? (
          <View style={st.live}>
            <View style={st.punct} />
            <Text style={st.textLive}>LIVE</Text>
          </View>
        ) : (
          <Text style={[st.pnl, cifre, { color: tonPnl(pnl) }]}>
            {pnl == null ? "—" : bani(pnl, moneda)}
          </Text>
        )}
      </View>
    </Card>
  );
}

const st = StyleSheet.create({
  radacina: { flex: 1, backgroundColor: T.surface.s0 },
  antet: {
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.sm,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  titlu: {
    color: T.ink.i1, fontSize: T.fontSize.xl, fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.tight,
  },
  numar: { color: T.ink.i4, fontSize: T.fontSize.xs , fontFamily: "Inter_400Regular" },
  filtre: {
    flexDirection: "row",
    gap: T.spacing.sm,
    paddingHorizontal: T.spacing.lg,
    paddingVertical: T.spacing.md,
  },
  pastila: {
    minHeight: 34,
    paddingHorizontal: T.spacing.lg,
    justifyContent: "center",
    borderRadius: T.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    backgroundColor: T.surface.s2,
  },
  pastilaActiva: {
    backgroundColor: T.accent.soft,
    borderColor: T.accent.line,
  },
  textPastila: { color: T.ink.i3, fontSize: T.fontSize.sm, fontWeight: "700" , fontFamily: "Inter_700Bold" },
  textPastilaActiv: { color: T.accent.base },
  continut: {
    paddingHorizontal: T.spacing.lg,
    paddingBottom: SPATIU_BARA,
  },
  rand: { flexDirection: "row", alignItems: "center", gap: T.spacing.md, minHeight: ATINGERE_MIN - 10 },
  directie: {
    width: 38, height: 38, borderRadius: T.radius.md,
    alignItems: "center", justifyContent: "center",
  },
  randSimbol: { flexDirection: "row", alignItems: "center", gap: T.spacing.sm },
  simbol: {
    color: T.ink.i1, fontSize: T.fontSize.base, fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.tight,
  },
  setup: {
    color: T.ink.i4, fontSize: 10, fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase", letterSpacing: T.tracking.wide,
  },
  meta: { color: T.ink.i4, fontSize: T.fontSize.xs, marginTop: 3 , fontFamily: "Inter_400Regular" },
  pnl: { fontSize: T.fontSize.base, fontWeight: "800" , fontFamily: "Inter_800ExtraBold" },
  live: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: T.radius.sm,
    backgroundColor: "rgba(109,117,246,0.16)",
  },
  punct: { width: 5, height: 5, borderRadius: 3, backgroundColor: T.accent.base },
  textLive: {
    color: T.accent.base, fontSize: 10, fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.wide,
  },
  gol: { color: T.ink.i3, fontSize: T.fontSize.sm, lineHeight: 20 , fontFamily: "Inter_400Regular" },
  eroare: {
    color: T.pnl.loss, fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    textAlign: "center", padding: T.spacing.lg,
  },
});
