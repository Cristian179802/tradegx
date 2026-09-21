import * as React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { Text } from "../src/ui/Text";
import { api } from "../src/lib/api";
import { useRouter } from "expo-router";
import { useCerere } from "../src/lib/useCerere";
import { bani, baniScurt, numar, procent } from "../src/lib/format";
import { Card } from "../src/ui/Card";
import { Buton } from "../src/ui/Buton";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { Bare, Curba, useLatime } from "../src/ui/grafice";
import { Gol, GrilaStatistici, Rand, Sectiune, Statistica } from "../src/ui/parti";
import { T, tonPnl, cifre } from "../src/theme";

// ── Analytics ────────────────────────────────────────────────────────────────
//
// Pagina web pune totul pe un ecran lat: opt grafice, unul lângă altul. Pe
// telefon, aceeași informație pe verticală ar fi un sul de două minute, deci
// ordinea a fost aleasă după cât de des se pune întrebarea:
//
//   1. cât am făcut        — cifra pentru care deschide cineva aplicația
//   2. cum arată curba     — forma spune mai mult decât suma
//   3. ce lună             — unde s-a rupt
//   4. ce setup, ce oră    — de ce
//
// Statisticile de sus sunt SHOW, nu decor: fiecare are o pereche (medie
// câștig / medie pierdere, cel mai bun / cel mai slab), fiindcă niciuna nu
// înseamnă nimic singură.

interface Sumar {
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  profitFactor: number | null;
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
  avgRR: number;
  maxDrawdown: number;
}

interface Analitice {
  empty?: boolean;
  currency?: string;
  summary?: Sumar;
  equityCurve?: { date: string | null; balance: number; pnl: number }[];
  monthlyPnl?: { month: string; pnl: number }[];
  winRateByDay?: { day: string; winRate: number; total: number }[];
  winRateByInstrument?: { instrument: string; winRate: number; total: number; pnl: number }[];
  setupPerformance?: { setup: string; winRate: number; total: number; pnl: number; avgPnl: number }[];
}

interface PeOra {
  currency: string;
  trades: { time: string; pnl: number }[];
}

const LUNI = ["ian.", "feb.", "mar.", "apr.", "mai", "iun.", "iul.", "aug.", "sept.", "oct.", "nov.", "dec."];

export default function Analitice() {
  const router = useRouter();
  const [latime, laMasurare] = useLatime();

  const c = useCerere<{ a: Analitice; ore: PeOra | null }>(async () => {
    const [a, ore] = await Promise.all([
      api.analytics.overview() as Promise<Analitice>,
      // Orele sunt un bonus: dacă ruta lor cade, restul ecranului rămâne.
      (api.analytics.timePerformance() as Promise<PeOra>).catch(() => null),
    ]);
    return { a, ore };
  });

  const a = c.date?.a;
  const s = a?.summary;
  const moneda = a?.currency ?? "USD";
  const gol = Boolean(a?.empty) || !s;

  const curba = React.useMemo(
    () => (a?.equityCurve ?? []).map((x) => x.balance),
    [a?.equityCurve],
  );

  const lunar = React.useMemo(
    () =>
      (a?.monthlyPnl ?? []).slice(-8).map((x) => {
        const [an, luna] = x.month.split("-");
        const i = Number(luna) - 1;
        return { eticheta: `${LUNI[i] ?? luna}`, valoare: x.pnl, an };
      }),
    [a?.monthlyPnl],
  );

  const peZi = React.useMemo(
    () =>
      (a?.winRateByDay ?? [])
        .filter((x) => x.total > 0)
        .map((x) => ({ eticheta: x.day, valoare: x.winRate })),
    [a?.winRateByDay],
  );

  // Orele se grupează aici, nu pe server: ruta întoarce tranzacțiile brute, iar
  // gruparea depinde de FUSUL TELEFONULUI. Cineva care tranzacționează din
  // România trebuie să vadă ora lui, nu UTC-ul serverului.
  const peOra = React.useMemo(() => {
    const t = c.date?.ore?.trades ?? [];
    if (t.length === 0) return [];
    const cos = new Array<number>(24).fill(0);
    const cate = new Array<number>(24).fill(0);
    for (const x of t) {
      const h = new Date(x.time).getHours();
      if (Number.isNaN(h)) continue;
      cos[h] = (cos[h] ?? 0) + x.pnl;
      cate[h] = (cate[h] ?? 0) + 1;
    }
    return cos
      .map((v, h) => ({ eticheta: `${h}`, valoare: v, cate: cate[h] ?? 0 }))
      .filter((x) => x.cate > 0);
  }, [c.date?.ore]);

  return (
    <Ecran
      titlu="Analytics"
      subtitlu={s ? `${s.totalTrades} tranzacții închise` : null}
      incarca={c.incarca && !a}
      scheletRanduri={4}
      reimprospateaza={c.reimprospateaza}
      onReia={c.reia}
      eroare={c.eroare}
    >
      <View onLayout={laMasurare} />

      {gol ? (
        <Gol
          iconita="bar-chart-outline"
          titlu="Încă nu e ce analiza"
          text="Rată de câștig, profit factor, drawdown, curba contului — toate se calculează din tranzacții închise. Notează prima și ecranul prinde viață."
          actiune={
            <Buton
              eticheta="Adaugă o tranzacție"
              onPress={() => router.push("/(tabs)/adauga")}
              iconita={<Ionicons name="add" size={16} color="#ffffff" />}
            />
          }
        />
      ) : (
        <>
          <Reveal>
            <Card>
              <GrilaStatistici>
                <Statistica
                  eticheta="Rezultat net"
                  valoare={baniScurt(s!.totalPnl, moneda)}
                  culoare={tonPnl(s!.totalPnl)}
                  marime={T.fontSize.xl}
                  style={st.celula}
                />
                <Statistica
                  eticheta="Rată de câștig"
                  valoare={procent(s!.winRate)}
                  marime={T.fontSize.xl}
                  intarziere={70}
                  style={st.celula}
                />
                <Statistica
                  eticheta="Profit factor"
                  valoare={s!.profitFactor == null ? "—" : numar(s!.profitFactor, 2)}
                  marime={T.fontSize.lg}
                  intarziere={140}
                  nota={s!.profitFactor != null && s!.profitFactor < 1 ? "sub 1 = în pierdere" : null}
                  style={st.celula}
                />
                <Statistica
                  eticheta="RR mediu"
                  valoare={numar(s!.avgRR, 2)}
                  marime={T.fontSize.lg}
                  intarziere={210}
                  style={st.celula}
                />
              </GrilaStatistici>

              <View style={st.linie} />

              <Rand cheie="Câștig mediu" valoare={bani(s!.avgWin, moneda)} culoare={T.pnl.gain} />
              <Rand cheie="Pierdere medie" valoare={bani(-Math.abs(s!.avgLoss), moneda)} culoare={T.pnl.loss} />
              <Rand cheie="Cea mai bună" valoare={bani(s!.bestTrade, moneda)} culoare={tonPnl(s!.bestTrade)} />
              <Rand cheie="Cea mai slabă" valoare={bani(s!.worstTrade, moneda)} culoare={tonPnl(s!.worstTrade)} />
              <Rand
                cheie="Drawdown maxim"
                valoare={procent(s!.maxDrawdown, 2)}
                culoare={s!.maxDrawdown > 20 ? T.pnl.loss : T.ink.i1}
              />
            </Card>
          </Reveal>

          {curba.length > 1 ? (
            <>
              <Sectiune titlu="Curba contului" nota="Forma, nu suma. Un salt brusc e la fel de suspect ca o cădere." />
              <Reveal intarziere={60}>
                <Card>
                  <Curba
                    date={curba}
                    latime={latime}
                    inaltime={160}
                    culoare={s!.totalPnl >= 0 ? T.pnl.gain : T.pnl.loss}
                    referinta={curba[0]}
                  />
                  <View style={st.subGrafic}>
                    <Text style={[st.capat, cifre]}>{bani(curba[0] ?? 0, moneda, false)}</Text>
                    <Text style={[st.capat, cifre, { color: tonPnl(s!.totalPnl) }]}>
                      {bani(curba[curba.length - 1] ?? 0, moneda, false)}
                    </Text>
                  </View>
                </Card>
              </Reveal>
            </>
          ) : null}

          {lunar.length > 0 ? (
            <>
              <Sectiune titlu="Pe luni" />
              <Reveal intarziere={90}>
                <Card>
                  <Bare date={lunar} latime={latime} inaltime={130} dupaSemn />
                </Card>
              </Reveal>
            </>
          ) : null}

          {peZi.length > 0 ? (
            <>
              <Sectiune titlu="Rată de câștig pe zile" nota="Barele sunt pe accent: nu e P&L, e frecvență." />
              <Reveal intarziere={120}>
                <Card>
                  <Bare date={peZi} latime={latime} inaltime={110} />
                </Card>
              </Reveal>
            </>
          ) : null}

          {peOra.length > 0 ? (
            <>
              <Sectiune titlu="Pe ora intrării" nota="În fusul telefonului tău." />
              <Reveal intarziere={150}>
                <Card>
                  <Bare date={peOra} latime={latime} inaltime={110} dupaSemn maxEtichete={0} />
                  <Text style={st.notaOre}>
                    {(() => {
                      const cea = [...peOra].sort((x, y) => y.valoare - x.valoare)[0];
                      const rea = [...peOra].sort((x, y) => x.valoare - y.valoare)[0];
                      if (!cea || !rea) return "";
                      return `Cel mai bine la ora ${cea.eticheta}, cel mai prost la ${rea.eticheta}.`;
                    })()}
                  </Text>
                </Card>
              </Reveal>
            </>
          ) : null}

          {(a?.setupPerformance ?? []).length > 0 ? (
            <>
              <Sectiune titlu="Pe setup" />
              <Reveal intarziere={180}>
                <Card>
                  {(a!.setupPerformance ?? []).slice(0, 8).map((x, i) => (
                    <RandDefalcare
                      key={x.setup}
                      nume={x.setup}
                      sub={`${x.total} tranz. · ${procent(x.winRate)}`}
                      valoare={bani(x.pnl, moneda)}
                      primul={i === 0}
                    />
                  ))}
                </Card>
              </Reveal>
            </>
          ) : null}

          {(a?.winRateByInstrument ?? []).length > 0 ? (
            <>
              <Sectiune titlu="Pe instrument" />
              <Reveal intarziere={210}>
                <Card>
                  {(a!.winRateByInstrument ?? []).map((x, i) => (
                    <RandDefalcare
                      key={x.instrument}
                      nume={x.instrument}
                      sub={`${x.total} tranz. · ${procent(x.winRate)}`}
                      valoare={bani(x.pnl, moneda)}
                      primul={i === 0}
                    />
                  ))}
                </Card>
              </Reveal>
            </>
          ) : null}
        </>
      )}
    </Ecran>
  );
}

function RandDefalcare({
  nume, sub, valoare, primul,
}: {
  nume: string;
  sub: string;
  valoare: string;
  primul: boolean;
}) {
  const negativ = valoare.startsWith("−");
  return (
    <View style={[st.defalcare, !primul && st.cuLinie]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={st.numeDefalcare} numberOfLines={1}>{nume}</Text>
        <Text style={st.subDefalcare} numberOfLines={1}>{sub}</Text>
      </View>
      <Text style={[st.valoareDefalcare, cifre, { color: negativ ? T.pnl.loss : T.pnl.gain }]}>
        {valoare}
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  celula: { width: "50%" },
  linie: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.line.l1,
    marginVertical: T.spacing.lg,
  },
  subGrafic: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: T.spacing.sm,
  },
  capat: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  notaOre: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: T.spacing.sm,
  },
  defalcare: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.md,
    paddingVertical: T.spacing.sm,
  },
  cuLinie: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.line.l1,
  },
  numeDefalcare: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_600SemiBold",
  },
  subDefalcare: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  valoareDefalcare: {
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_800ExtraBold",
  },
});
