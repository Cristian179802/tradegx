import * as React from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/lib/api";
import { useCerere } from "../../src/lib/useCerere";
import { useAuth } from "../../src/lib/auth";
import { bani, baniScurt, procent, numar, candva } from "../../src/lib/format";
import { Buton } from "../../src/ui/Buton";
import { Card } from "../../src/ui/Card";
import { RollingNumber } from "../../src/ui/RollingNumber";
import { Sparkline } from "../../src/ui/Sparkline";
import { Reveal } from "../../src/ui/Reveal";
import { Schelet } from "../../src/ui/Schelet";
import { SPATIU_BARA } from "../../src/ui/Ecran";
import { T, tonPnl, cifre } from "../../src/theme";

// ── Acasă ────────────────────────────────────────────────────────────────────
//
// Trei întrebări, în ordinea în care le are cineva care deschide aplicația:
//   1. cât am?            → soldul, cu curba lui
//   2. cum a mers azi?    → P&L-ul zilei
//   3. merge strategia?   → win rate, profit factor, câte tranzacții
//
// Sub ele, ultimele tranzacții — fiindcă „ce am făcut ultima dată” e
// întrebarea a patra, și mereu aceeași.
//
// DOUĂ CERERI, nu șase. `equitySpark` dă sold + curbă + rezultatul zilei
// dintr-o interogare; `analytics` dă restul. Pe o conexiune mobilă, fiecare
// cerere în plus se simte.

interface Spark {
  curba: number[];
  pnlAzi: number | null;
  sold: number | null;
  moneda: string;
}

interface Analiza {
  empty: boolean;
  currency: string;
  summary: {
    totalTrades: number;
    winRate: number;
    totalPnl: number;
    profitFactor: number | null;
    maxDrawdown: number;
  };
}

interface Tranzactie {
  id: string;
  symbol: string;
  direction: string;
  pnlMoney: number | string | null;
  exitTime: string | null;
  entryTime: string;
  status: string;
}

export default function Acasa() {
  const router = useRouter();
  const { utilizator } = useAuth();

  const spark = useCerere<Spark>(() => api.equitySpark() as Promise<Spark>);
  const analiza = useCerere<Analiza>(() => api.analytics.overview() as Promise<Analiza>);
  const lista = useCerere<{ trades: Tranzactie[] }>(
    () => api.trades.list() as Promise<{ trades: Tranzactie[] }>,
  );

  const seIncarca = spark.incarca || analiza.incarca;
  const moneda = spark.date?.moneda ?? analiza.date?.currency ?? "USD";
  const sold = spark.date?.sold ?? null;
  const pnlAzi = spark.date?.pnlAzi ?? null;
  const rezumat = analiza.date?.summary;

  const reiaTot = React.useCallback(() => {
    spark.reia();
    analiza.reia();
    lista.reia();
  }, [spark, analiza, lista]);

  const ultimele = (lista.date?.trades ?? []).slice(0, 4);

  // Ceasul din bula de lângă nume. Bate din secundă în secundă, ca pe site.
  // E ora TELEFONULUI, nu a serverului: omul o compară din reflex cu ceasul din
  // bara de sus, iar o diferență de câteva secunde ar părea o defecțiune.
  const [acum, setAcum] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setAcum(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const ora = acum.toLocaleTimeString("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Cineva care tocmai a instalat aplicația n-are niciun cont. Serverul trimite
  // `sold: null` fix pentru cazul ăsta, deci îl putem deosebi de un sold zero.
  const faraCont = !seIncarca && sold == null;

  return (
    <View style={st.radacina}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={st.continut}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={spark.reimprospateaza || analiza.reimprospateaza}
              onRefresh={reiaTot}
              tintColor={T.accent.base}
              colors={[T.accent.base]}
              progressBackgroundColor={T.surface.s2}
            />
          }
        >
          {/* ── Salut ── */}
          <Reveal intarziere={0}>
            <View style={st.randSalut}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={st.salut}>{salutDupaOra()}</Text>
                <Text style={st.nume} numberOfLines={1}>
                  {utilizator?.name || utilizator?.email || "Trader"}
                </Text>
              </View>

              <View style={st.bulaOra}>
                <Ionicons name="time-outline" size={12} color={T.ink.i3} />
                <Text style={st.textOra}>{ora}</Text>
              </View>
            </View>
          </Reveal>

          {/* ── Soldul ── */}
          <Reveal intarziere={70} style={st.spatiu}>
            <Card nivel={3}>
              <Text style={st.eticheta}>Balanță</Text>
              {seIncarca && sold == null ? (
                <Schelet inaltime={38} latime="70%" style={{ marginTop: 6 }} />
              ) : (
                <View style={st.randSold}>
                  <RollingNumber
                    value={sold == null ? "—" : bani(sold, moneda, false)}
                    size={T.fontSize["2xl"]}
                    color={T.ink.i1}
                  />
                </View>
              )}

              {faraCont ? (
                <>
                  <Text style={st.explicatie}>
                    Nu ai încă niciun cont de tranzacționare. Contul e locul unde
                    stau banii și de unde se calculează riscul pe fiecare intrare —
                    fără el, aplicația n-are de la ce să pornească.
                  </Text>
                  <Buton
                    eticheta="Adaugă primul cont"
                    onPress={() => router.push("/cont-nou")}
                    plin
                    iconita={<Ionicons name="add" size={16} color="#ffffff" />}
                    style={{ marginTop: T.spacing.lg }}
                  />
                </>
              ) : (
              <View style={st.randAzi}>
                <View style={{ flex: 1 }}>
                  <Text style={st.eticheta}>Azi</Text>
                  {pnlAzi == null ? (
                    <Text style={st.faraAzi}>Nicio tranzacție azi</Text>
                  ) : (
                    <RollingNumber
                      value={baniScurt(pnlAzi, moneda)}
                      size={T.fontSize.lg}
                      color={tonPnl(pnlAzi)}
                      intarziere={220}
                    />
                  )}
                </View>
                {spark.date && spark.date.curba.length > 1 && (
                  <Sparkline
                    data={spark.date.curba}
                    latime={104}
                    inaltime={36}
                    umplut
                    intarziere={320}
                    culoare={
                      spark.date.curba[spark.date.curba.length - 1]! >= spark.date.curba[0]!
                        ? T.pnl.gain
                        : T.pnl.loss
                    }
                  />
                )}
              </View>
              )}
            </Card>
          </Reveal>

          {/* ── Cum merge strategia ── */}
          <Text style={st.sectiune}>Performanță</Text>
          <View style={st.grila}>
            <Kpi
              intarziere={140}
              eticheta="Win rate"
              valoare={rezumat ? procent(rezumat.winRate) : null}
              ton={rezumat ? (rezumat.winRate >= 50 ? T.pnl.gain : T.pnl.loss) : T.ink.i1}
            />
            <Kpi
              intarziere={190}
              eticheta="Profit factor"
              valoare={rezumat ? numar(rezumat.profitFactor) : null}
              ton={
                rezumat?.profitFactor == null
                  ? T.ink.i1
                  : rezumat.profitFactor >= 1
                    ? T.pnl.gain
                    : T.pnl.loss
              }
            />
            <Kpi
              intarziere={240}
              eticheta="P&L total"
              valoare={rezumat ? baniScurt(rezumat.totalPnl, moneda) : null}
              ton={rezumat ? tonPnl(rezumat.totalPnl) : T.ink.i1}
            />
            <Kpi
              intarziere={290}
              eticheta="Tranzacții"
              valoare={rezumat ? String(rezumat.totalTrades) : null}
              ton={T.ink.i1}
            />
          </View>

          {/* ── Ultimele tranzacții ── */}
          <View style={st.antetSectiune}>
            <Text style={st.sectiune}>Ultimele tranzacții</Text>
            <Text style={st.vezi} onPress={() => router.push("/(tabs)/tranzactii")}>
              Vezi tot
            </Text>
          </View>

          {lista.incarca && ultimele.length === 0 ? (
            <View style={{ gap: T.spacing.sm }}>
              <Schelet inaltime={62} raza={T.radius.xl} />
              <Schelet inaltime={62} raza={T.radius.xl} />
            </View>
          ) : ultimele.length === 0 ? (
            <Card>
              <Text style={st.gol}>
                {faraCont
                  ? "Aici vor apărea ultimele tranzacții, după ce adaugi un cont și notezi prima."
                  : "Nicio tranzacție încă. Notează-ți intrările pe măsură ce le faci — din ele se calculează tot restul: rata de câștig, tiparele care merg și cele care te costă."}
              </Text>
              {faraCont ? null : (
                <Buton
                  eticheta="Notează prima tranzacție"
                  onPress={() => router.push("/(tabs)/adauga")}
                  plin
                  iconita={<Ionicons name="add" size={16} color="#ffffff" />}
                  style={{ marginTop: T.spacing.lg }}
                />
              )}
            </Card>
          ) : (
            ultimele.map((t, i) => (
              <Reveal key={t.id} intarziere={340 + i * 50} style={{ marginBottom: T.spacing.sm }}>
                <RandTranzactie
                  tranzactie={t}
                  moneda={moneda}
                  onPress={() => router.push(`/tranzactie/${t.id}`)}
                />
              </Reveal>
            ))
          )}

          {(spark.eroare || analiza.eroare) && (
            <Text style={st.eroare}>{spark.eroare ?? analiza.eroare}</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Kpi({
  eticheta, valoare, ton, intarziere,
}: {
  eticheta: string;
  valoare: string | null;
  ton: string;
  intarziere: number;
}) {
  return (
    <Reveal intarziere={intarziere} style={st.celulaKpi}>
      <Card nivel={1} style={st.kpi}>
        <Text style={st.eticheta}>{eticheta}</Text>
        {valoare == null ? (
          <Schelet inaltime={22} latime="60%" style={{ marginTop: 6 }} />
        ) : (
          <RollingNumber
            value={valoare}
            size={T.fontSize.lg}
            color={ton}
            intarziere={intarziere + 120}
          />
        )}
      </Card>
    </Reveal>
  );
}

function RandTranzactie({
  tranzactie, moneda, onPress,
}: {
  tranzactie: Tranzactie;
  moneda: string;
  onPress: () => void;
}) {
  const pnl = tranzactie.pnlMoney == null ? null : Number(tranzactie.pnlMoney);
  const deschisa = tranzactie.status === "OPEN";
  const cumparare = tranzactie.direction === "BUY";

  return (
    <Card onPress={onPress} accesibilEticheta={`${tranzactie.symbol}, ${cumparare ? "cumpărare" : "vânzare"}`}>
      <View style={st.randTranz}>
        <View style={[st.directie, { backgroundColor: cumparare ? "rgba(52,211,153,0.12)" : "rgba(251,113,133,0.12)" }]}>
          <Ionicons
            name={cumparare ? "trending-up" : "trending-down"}
            size={17}
            color={cumparare ? T.pnl.gain : T.pnl.loss}
          />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={st.simbol} numberOfLines={1}>{tranzactie.symbol}</Text>
          <Text style={st.meta}>
            {deschisa ? "Deschisă" : candva(tranzactie.exitTime ?? tranzactie.entryTime)}
          </Text>
        </View>

        {deschisa ? (
          <View style={st.insignaDeschisa}>
            <Text style={st.textDeschisa}>LIVE</Text>
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

function salutDupaOra(): string {
  const h = new Date().getHours();
  if (h < 5) return "Noapte bună";
  if (h < 12) return "Bună dimineața";
  if (h < 18) return "Bună ziua";
  return "Bună seara";
}

const st = StyleSheet.create({
  randSalut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: T.spacing.md,
  },
  bulaOra: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: T.spacing.md,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: T.surface.s2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
  },
  textOra: {
    color: T.ink.i2,
    fontSize: T.fontSize.xs,
    // Cifre monospațiate: fără ele, secundele fac bula să tresară la fiecare
    // tick, fiindcă „1" e mai îngust decât „8".
    fontFamily: "SpaceGrotesk_500Medium",
    fontVariant: ["tabular-nums"],
  },
  radacina: { flex: 1, backgroundColor: T.surface.s0 },
  continut: {
    padding: T.spacing.lg,
    paddingBottom: SPATIU_BARA,
  },
  salut: { color: T.ink.i3, fontSize: T.fontSize.sm , fontFamily: "Inter_400Regular" },
  nume: {
    color: T.ink.i1,
    fontSize: T.fontSize.xl,
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.tight,
    marginTop: 2,
  },
  spatiu: { marginTop: T.spacing.lg },
  eticheta: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: T.tracking.wider,
  },
  randSold: { marginTop: 6 },
  randAzi: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: T.spacing.lg,
    gap: T.spacing.md,
  },
  faraAzi: { color: T.ink.i3, fontSize: T.fontSize.sm, marginTop: 4 , fontFamily: "Inter_400Regular" },
  sectiune: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_800ExtraBold",
    textTransform: "uppercase",
    letterSpacing: T.tracking.wider,
    marginTop: T.spacing.xl,
    marginBottom: T.spacing.sm,
  },
  antetSectiune: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vezi: {
    color: T.accent.base,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_700Bold",
    marginTop: T.spacing.xl,
    marginBottom: T.spacing.sm,
  },
  grila: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: T.spacing.sm,
  },
  celulaKpi: { width: "48.4%" },
  kpi: { paddingVertical: T.spacing.md, paddingHorizontal: T.spacing.md },
  randTranz: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  directie: {
    width: 36, height: 36, borderRadius: T.radius.md,
    alignItems: "center", justifyContent: "center",
  },
  simbol: {
    color: T.ink.i1, fontSize: T.fontSize.base,
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.tight,
  },
  meta: { color: T.ink.i4, fontSize: T.fontSize.xs, marginTop: 2 , fontFamily: "Inter_400Regular" },
  pnl: { fontSize: T.fontSize.base, fontFamily: "Inter_800ExtraBold" },
  insignaDeschisa: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: T.radius.sm,
    backgroundColor: "rgba(109,117,246,0.16)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.accent.line,
  },
  textDeschisa: {
    color: T.accent.base, fontSize: 10,
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.wide,
  },
  explicatie: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    marginTop: T.spacing.md,
  },
  gol: { color: T.ink.i3, fontSize: T.fontSize.sm, lineHeight: 20 , fontFamily: "Inter_400Regular" },
  eroare: {
    color: T.pnl.loss, fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    marginTop: T.spacing.lg, textAlign: "center",
  },
});
