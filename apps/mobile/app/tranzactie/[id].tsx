import * as React from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { riskReward, stopPips } from "@tradegx/core";
import { api } from "../../src/lib/api";
import { useCerere } from "../../src/lib/useCerere";
import { bani, numar, dataScurta } from "../../src/lib/format";
import { Card } from "../../src/ui/Card";
import { RollingNumber } from "../../src/ui/RollingNumber";
import { Reveal } from "../../src/ui/Reveal";
import { Schelet } from "../../src/ui/Schelet";
import { T, tonPnl, cifre, ATINGERE_MIN } from "../../src/theme";

// ── Detaliul unei tranzacții ─────────────────────────────────────────────────
//
// Cifra mare de sus e P&L-ul, fiindcă aia e întrebarea. Sub ea, în ordinea în
// care contează: cât ai riscat ca să-l obții, unde ai intrat și ieșit, ce setup,
// ce ai notat atunci.
//
// R:R și distanța până la stop se CALCULEAZĂ aici, din `@tradegx/core` —
// aceleași funcții ca web-ul. Nu se citesc dintr-un câmp care ar putea fi
// învechit față de prețuri.

interface Detaliu {
  id: string;
  symbol: string;
  direction: string;
  status: string;
  entryPrice: number | string;
  exitPrice: number | string | null;
  stopLoss: number | string | null;
  takeProfit: number | string | null;
  lotSize: number | string;
  pnlMoney: number | string | null;
  pnlPercent: number | string | null;
  riskMoney: number | string | null;
  entryTime: string;
  exitTime: string | null;
  setupType: string | null;
  timeframe: string | null;
  sessionType: string | null;
  notes: string | null;
  account?: { name?: string; currency?: string };
}

export default function DetaliuTranzactie() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const cerere = useCerere<Detaliu | { trade: Detaliu }>(
    () => api.trades.get(String(id)) as Promise<Detaliu | { trade: Detaliu }>,
    [id],
  );

  const t: Detaliu | null =
    cerere.date == null
      ? null
      : "trade" in (cerere.date as object)
        ? (cerere.date as { trade: Detaliu }).trade
        : (cerere.date as Detaliu);

  const moneda = t?.account?.currency ?? "USD";
  const nr = (v: number | string | null | undefined) =>
    v == null ? null : Number(v);

  const pnl = nr(t?.pnlMoney);
  const intrare = nr(t?.entryPrice);
  const iesire = nr(t?.exitPrice);
  const stop = nr(t?.stopLoss);
  const tinta = nr(t?.takeProfit);
  const deschisa = t?.status === "OPEN";
  const cumparare = t?.direction === "BUY";

  const rr =
    intrare != null && stop != null && tinta != null
      ? riskReward(intrare, stop, tinta)
      : null;
  const pips =
    intrare != null && stop != null && t
      ? stopPips(intrare, stop, t.symbol)
      : null;

  return (
    <View style={st.radacina}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* ── Bara ── */}
        <View style={st.bara}>
          <Pressable
            onPress={() => { Haptics.selectionAsync().catch(() => {}); router.back(); }}
            style={st.inapoi}
            accessibilityRole="button"
            accessibilityLabel="Înapoi"
          >
            <Ionicons name="chevron-back" size={24} color={T.ink.i1} />
          </Pressable>
          <Text style={st.titluBara} numberOfLines={1}>{t?.symbol ?? "Tranzacție"}</Text>
          <View style={st.inapoi} />
        </View>

        <ScrollView
          contentContainerStyle={st.continut}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={cerere.reimprospateaza}
              onRefresh={cerere.reia}
              tintColor={T.accent.base}
              colors={[T.accent.base]}
              progressBackgroundColor={T.surface.s2}
            />
          }
        >
          {cerere.incarca && !t ? (
            <View style={{ gap: T.spacing.md }}>
              <Schelet inaltime={130} raza={T.radius.xl} />
              <Schelet inaltime={180} raza={T.radius.xl} />
            </View>
          ) : !t ? (
            <Card>
              <Text style={st.gol}>{cerere.eroare ?? "Nu am găsit tranzacția."}</Text>
            </Card>
          ) : (
            <>
              {/* ── Rezultatul ── */}
              <Reveal intarziere={0}>
                <Card
                  nivel={3}
                  culoareMuchie={
                    deschisa ? T.accent.line
                      : pnl != null && pnl < 0 ? "rgba(251,113,133,0.35)"
                      : "rgba(52,211,153,0.35)"
                  }
                >
                  <View style={st.randSus}>
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
                    <Text style={st.directieText}>
                      {cumparare ? "Cumpărare" : "Vânzare"} · {numar(Number(t.lotSize), 2)} loturi
                    </Text>
                    {deschisa && (
                      <View style={st.live}>
                        <View style={st.punct} />
                        <Text style={st.textLive}>LIVE</Text>
                      </View>
                    )}
                  </View>

                  <Text style={[st.eticheta, { marginTop: T.spacing.lg }]}>
                    {deschisa ? "Poziție deschisă" : "Rezultat"}
                  </Text>
                  {deschisa ? (
                    <Text style={st.inAsteptare}>Se închide din aplicația de trading</Text>
                  ) : (
                    <View style={{ marginTop: 4 }}>
                      <RollingNumber
                        value={pnl == null ? "—" : bani(pnl, moneda)}
                        size={T.fontSize["2xl"]}
                        color={tonPnl(pnl)}
                      />
                    </View>
                  )}
                </Card>
              </Reveal>

              {/* ── Prețurile ── */}
              <Reveal intarziere={70} style={st.spatiu}>
                <Card>
                  <Text style={st.eticheta}>Niveluri</Text>
                  <Rand nume="Intrare" valoare={intrare == null ? "—" : numar(intrare, 5)} />
                  <Rand
                    nume="Stop loss"
                    valoare={stop == null ? "—" : numar(stop, 5)}
                    ton={T.pnl.loss}
                    sub={pips != null ? `${numar(pips, 0)} pips` : undefined}
                  />
                  <Rand
                    nume="Take profit"
                    valoare={tinta == null ? "—" : numar(tinta, 5)}
                    ton={T.pnl.gain}
                    sub={rr != null ? `R:R 1:${numar(rr, 2)}` : undefined}
                  />
                  <Rand nume="Ieșire" valoare={iesire == null ? "—" : numar(iesire, 5)} />
                </Card>
              </Reveal>

              {/* ── Contextul ── */}
              <Reveal intarziere={140} style={st.spatiu}>
                <Card>
                  <Text style={st.eticheta}>Context</Text>
                  <Rand nume="Setup" valoare={eticheteSetup(t.setupType)} />
                  <Rand nume="Sesiune" valoare={t.sessionType ?? "—"} />
                  <Rand nume="Interval" valoare={t.timeframe ?? "—"} />
                  <Rand nume="Deschisă" valoare={dataScurta(t.entryTime)} />
                  {t.exitTime ? <Rand nume="Închisă" valoare={dataScurta(t.exitTime)} /> : null}
                  {t.account?.name ? <Rand nume="Cont" valoare={t.account.name} /> : null}
                </Card>
              </Reveal>

              {/* ── Ce ai gândit atunci ── */}
              {t.notes ? (
                <Reveal intarziere={210} style={st.spatiu}>
                  <Card>
                    <Text style={st.eticheta}>Notițe</Text>
                    <Text style={st.note}>{t.notes}</Text>
                  </Card>
                </Reveal>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Rand({
  nume, valoare, ton, sub,
}: {
  nume: string;
  valoare: string;
  ton?: string;
  sub?: string;
}) {
  return (
    <View style={st.randDate}>
      <Text style={st.numeRand}>{nume}</Text>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={[st.valoareRand, cifre, ton ? { color: ton } : null]}>{valoare}</Text>
        {sub ? <Text style={st.subRand}>{sub}</Text> : null}
      </View>
    </View>
  );
}

const ETICHETE: Record<string, string> = {
  ORDER_BLOCK: "Order Block",
  FAIR_VALUE_GAP: "Fair Value Gap",
  LIQUIDITY_SWEEP: "Liquidity Sweep",
  BOS: "Break of Structure",
  CHOCH: "Change of Character",
  BREAKER: "Breaker",
  MITIGATION: "Mitigation",
  REJECTION: "Rejection",
  TREND_FOLLOW: "Trend follow",
  SCALP: "Scalp",
  OTHER: "Altul",
};

function eticheteSetup(v: string | null): string {
  if (!v) return "—";
  return ETICHETE[v] ?? v;
}

const st = StyleSheet.create({
  radacina: { flex: 1, backgroundColor: T.surface.s0 },
  bara: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: T.spacing.sm, paddingBottom: T.spacing.sm,
  },
  inapoi: {
    width: ATINGERE_MIN, height: ATINGERE_MIN,
    alignItems: "center", justifyContent: "center",
  },
  titluBara: {
    flex: 1, textAlign: "center",
    color: T.ink.i1, fontSize: T.fontSize.base, fontWeight: "700",
    letterSpacing: T.tracking.tight,
  },
  continut: { padding: T.spacing.lg, paddingBottom: T.spacing["3xl"] },
  spatiu: { marginTop: T.spacing.md },
  randSus: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  directie: {
    width: 36, height: 36, borderRadius: T.radius.md,
    alignItems: "center", justifyContent: "center",
  },
  directieText: { flex: 1, color: T.ink.i2, fontSize: T.fontSize.sm, fontWeight: "600" },
  live: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: T.radius.sm, backgroundColor: "rgba(109,117,246,0.16)",
  },
  punct: { width: 5, height: 5, borderRadius: 3, backgroundColor: T.accent.base },
  textLive: { color: T.accent.base, fontSize: 10, fontWeight: "800", letterSpacing: T.tracking.wide },
  eticheta: {
    color: T.ink.i4, fontSize: T.fontSize.xs, fontWeight: "700",
    textTransform: "uppercase", letterSpacing: T.tracking.wider,
  },
  inAsteptare: { color: T.ink.i3, fontSize: T.fontSize.sm, marginTop: 6 },
  randDate: {
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
    paddingVertical: T.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.line.l1,
  },
  numeRand: { color: T.ink.i3, fontSize: T.fontSize.sm },
  valoareRand: { color: T.ink.i1, fontSize: T.fontSize.base, fontWeight: "700" },
  subRand: { color: T.ink.i4, fontSize: T.fontSize.xs, marginTop: 2 },
  note: { color: T.ink.i2, fontSize: T.fontSize.sm, lineHeight: 21, marginTop: T.spacing.sm },
  gol: { color: T.ink.i3, fontSize: T.fontSize.sm, lineHeight: 20 },
});
