import * as React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { api } from "../src/lib/api";
import { useRouter } from "expo-router";
import { useCerere } from "../src/lib/useCerere";
import { bani, baniScurt, numar, procent } from "../src/lib/format";
import { Card } from "../src/ui/Card";
import { Buton } from "../src/ui/Buton";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { Paywall } from "../src/ui/Paywall";
import { Curba, useLatime } from "../src/ui/grafice";
import { Gol, GrilaStatistici, Rand, Sectiune, Statistica } from "../src/ui/parti";
import { T, tonPnl, cifre } from "../src/theme";

// ── Vedere instituțională ────────────────────────────────────────────────────
//
// Aceleași cifre pe care le-ar cere cineva care alocă bani altcuiva: Sharpe,
// Sortino, Calmar, CAGR, drawdown maxim. Nu „cât ai făcut”, ci „cât ai riscat
// ca să faci atât".
//
// FIECARE RAPORT ARE O PROPOZIȚIE SUB EL. Sharpe 1.4 nu înseamnă nimic pentru
// cineva care nu lucrează în domeniu, iar un tablou de cifre fără explicații e
// decor scump. Explicația e scurtă și spune pragul, nu definiția.
//
// `null` se afișează ca „—”, nu ca 0. Un Sortino care nu se poate calcula
// (nicio zi în pierdere) e o informație; un 0 în locul lui ar fi o minciună.

interface Edge {
  totalTrades: number;
  winRatePct: number;
  profitFactor: number | null;
  payoff: number | null;
  expectancyMoney: number;
  expectancyR: number | null;
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
}

interface Portofoliu {
  initialBalance: number;
  finalBalance: number;
  netPnl: number;
  returnPct: number;
  cagrPct: number | null;
  sharpe: number | null;
  sortino: number | null;
  calmar: number | null;
  maxDrawdownPct: number;
  tradingDays: number;
  edge: Edge;
  equityCurve: { t: string; v: number }[];
}

interface Cont {
  id: string;
  name: string;
  currency: string;
  initialBalance: number;
  netPnl: number;
  returnPct: number;
  winRatePct: number;
  profitFactor: number | null;
  sharpe: number | null;
  maxDrawdownPct: number;
  totalTrades: number;
}

interface Institutional {
  empty: boolean;
  currency: string;
  portfolio: Portofoliu;
  accounts: Cont[];
}

/** Pragurile după care se citesc raporturile. Scurt, nu academic. */
const CITIRE = {
  sharpe: (v: number) =>
    v >= 2 ? "excelent" : v >= 1 ? "bun" : v >= 0 ? "slab" : "negativ",
  sortino: (v: number) =>
    v >= 2 ? "riscul de scădere e bine plătit" : v >= 1 ? "acceptabil" : "scăderile nu se plătesc",
  calmar: (v: number) =>
    v >= 3 ? "randament mare față de cea mai urâtă cădere" : v >= 1 ? "echilibrat" : "căderea e mai mare decât câștigul anual",
};

export default function Institutional() {
  const router = useRouter();
  const [latime, laMasurare] = useLatime();
  const c = useCerere<Institutional>(() => api.institutional() as Promise<Institutional>);
  const d = c.date;

  const curba = React.useMemo(
    () => (d?.portfolio.equityCurve ?? []).map((x) => x.v),
    [d?.portfolio.equityCurve],
  );

  if (c.stare === 402) {
    return (
      <Ecran titlu="Instituțional" subtitlu="Cifrele pe care le cere un alocator">
        <Paywall
          functie="Vedere instituțională"
          descriere="Randamentul singur nu spune nimic despre cât a costat. Ecranul ăsta arată cât ai riscat ca să-l obții."
          puncte={[
            "Sharpe, Sortino și Calmar pe curba ta reală",
            "CAGR și drawdown maxim, pe portofoliu și pe fiecare cont",
            "Expectancy în bani și în R",
            "Defalcare pe conturi, comparabilă cap la cap",
          ]}
        />
      </Ecran>
    );
  }

  const p = d?.portfolio;
  const e = p?.edge;
  const moneda = d?.currency ?? "USD";

  return (
    <Ecran
      titlu="Instituțional"
      subtitlu={p ? `${p.tradingDays} zile de tranzacționare` : "Cifrele pe care le cere un alocator"}
      incarca={c.incarca && !d}
      scheletRanduri={4}
      reimprospateaza={c.reimprospateaza}
      onReia={c.reia}
      eroare={c.eroare}
    >
      <View onLayout={laMasurare} />

      {!d || d.empty || !p || !e ? (
        d ? (
          <Gol
            iconita="business-outline"
            titlu="Fără date suficiente"
            text="Sharpe, Sortino și Calmar se calculează pe o curbă de echitate — adică pe mai multe zile cu tranzacții închise, nu pe una singură."
            actiune={
              <Buton
                eticheta="Adaugă o tranzacție"
                onPress={() => router.push("/(tabs)/adauga")}
                iconita={<Ionicons name="add" size={16} color="#ffffff" />}
              />
            }
          />
        ) : null
      ) : (
        <>
          <Reveal>
            <Card>
              <GrilaStatistici>
                <Statistica
                  eticheta="Randament"
                  valoare={procent(p.returnPct, 2)}
                  culoare={tonPnl(p.returnPct)}
                  marime={T.fontSize.xl}
                  style={st.celula}
                />
                <Statistica
                  eticheta="Rezultat net"
                  valoare={baniScurt(p.netPnl, moneda)}
                  culoare={tonPnl(p.netPnl)}
                  marime={T.fontSize.xl}
                  intarziere={70}
                  style={st.celula}
                />
                <Statistica
                  eticheta="CAGR"
                  valoare={p.cagrPct == null ? "—" : procent(p.cagrPct, 1)}
                  marime={T.fontSize.lg}
                  intarziere={140}
                  nota={p.cagrPct == null ? "prea puțin istoric" : "anualizat"}
                  style={st.celula}
                />
                <Statistica
                  eticheta="Drawdown maxim"
                  valoare={procent(p.maxDrawdownPct, 2)}
                  culoare={p.maxDrawdownPct > 20 ? T.pnl.loss : T.ink.i1}
                  marime={T.fontSize.lg}
                  intarziere={210}
                  style={st.celula}
                />
              </GrilaStatistici>
            </Card>
          </Reveal>

          {curba.length > 1 ? (
            <Reveal intarziere={60} style={{ marginTop: T.spacing.md }}>
              <Card>
                <Curba
                  date={curba}
                  latime={latime}
                  inaltime={140}
                  culoare={p.netPnl >= 0 ? T.pnl.gain : T.pnl.loss}
                  referinta={p.initialBalance}
                />
                <View style={st.capete}>
                  <Text style={[st.capat, cifre]}>{bani(p.initialBalance, moneda, false)}</Text>
                  <Text style={[st.capat, cifre, { color: tonPnl(p.netPnl) }]}>
                    {bani(p.finalBalance, moneda, false)}
                  </Text>
                </View>
              </Card>
            </Reveal>
          ) : null}

          <Sectiune titlu="Raporturi de risc" nota="Cât randament pe unitatea de risc asumat." />

          <Reveal intarziere={90}>
            <Card>
              <Raport
                nume="Sharpe"
                valoare={p.sharpe}
                citire={p.sharpe == null ? "nu se poate calcula" : CITIRE.sharpe(p.sharpe)}
                explicatie="Randament peste volatilitatea totală. Peste 1 e bun, peste 2 e rar."
              />
              <Raport
                nume="Sortino"
                valoare={p.sortino}
                citire={p.sortino == null ? "nicio zi în pierdere" : CITIRE.sortino(p.sortino)}
                explicatie="Ca Sharpe, dar pedepsește doar scăderile. Urcările bruște nu sunt risc."
              />
              <Raport
                nume="Calmar"
                valoare={p.calmar}
                citire={p.calmar == null ? "nu se poate calcula" : CITIRE.calmar(p.calmar)}
                explicatie="Randament anual împărțit la cea mai urâtă cădere."
                ultim
              />
            </Card>
          </Reveal>

          <Sectiune titlu="Execuția" />

          <Reveal intarziere={120}>
            <Card>
              <Rand cheie="Tranzacții" valoare={numar(e.totalTrades, 0)} />
              <Rand cheie="Rată de câștig" valoare={procent(e.winRatePct)} />
              <Rand
                cheie="Profit factor"
                valoare={e.profitFactor == null ? "—" : numar(e.profitFactor, 2)}
                culoare={e.profitFactor != null && e.profitFactor < 1 ? T.pnl.loss : T.ink.i1}
              />
              <Rand cheie="Payoff (câștig / pierdere)" valoare={e.payoff == null ? "—" : numar(e.payoff, 2)} />
              <Rand
                cheie="Expectancy per tranzacție"
                valoare={bani(e.expectancyMoney, moneda)}
                culoare={tonPnl(e.expectancyMoney)}
              />
              <Rand
                cheie="Expectancy în R"
                valoare={e.expectancyR == null ? "—" : numar(e.expectancyR, 2)}
                culoare={e.expectancyR == null ? T.ink.i4 : tonPnl(e.expectancyR)}
              />
              <Rand cheie="Cea mai bună" valoare={bani(e.bestTrade, moneda)} culoare={T.pnl.gain} />
              <Rand cheie="Cea mai slabă" valoare={bani(e.worstTrade, moneda)} culoare={T.pnl.loss} />
            </Card>
          </Reveal>

          {d.accounts.length > 1 ? (
            <>
              <Sectiune titlu="Pe conturi" nota="Comparabile cap la cap, fiecare cu riscul lui." />
              {d.accounts.map((a, i) => (
                <Reveal key={a.id} intarziere={150 + i * 50} style={{ marginBottom: T.spacing.md }}>
                  <Card nivel={1}>
                    <View style={st.antetCont}>
                      <Text style={st.numeCont} numberOfLines={1}>{a.name}</Text>
                      <Text style={[st.randamentCont, { color: tonPnl(a.returnPct) }]}>
                        {procent(a.returnPct, 2)}
                      </Text>
                    </View>
                    <Rand cheie="Rezultat net" valoare={bani(a.netPnl, a.currency)} culoare={tonPnl(a.netPnl)} />
                    <Rand cheie="Sharpe" valoare={a.sharpe == null ? "—" : numar(a.sharpe, 2)} />
                    <Rand cheie="Drawdown maxim" valoare={procent(a.maxDrawdownPct, 2)} />
                    <Rand cheie="Rată de câștig" valoare={`${procent(a.winRatePct)} · ${a.totalTrades} tranz.`} />
                  </Card>
                </Reveal>
              ))}
            </>
          ) : null}
        </>
      )}
    </Ecran>
  );
}

function Raport({
  nume, valoare, citire, explicatie, ultim = false,
}: {
  nume: string;
  valoare: number | null;
  citire: string;
  explicatie: string;
  ultim?: boolean;
}) {
  const culoare =
    valoare == null ? T.ink.i4 : valoare >= 1 ? T.pnl.gain : valoare >= 0 ? T.ink.i1 : T.pnl.loss;
  return (
    <View style={[st.raport, !ultim && st.cuLinie]}>
      <View style={st.randRaport}>
        <Text style={st.numeRaport}>{nume}</Text>
        <Text style={[st.valoareRaport, cifre, { color: culoare }]}>
          {valoare == null ? "—" : numar(valoare, 2)}
        </Text>
      </View>
      <Text style={[st.citire, { color: culoare }]}>{citire}</Text>
      <Text style={st.explicatie}>{explicatie}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  celula: { width: "50%" },
  capete: { flexDirection: "row", justifyContent: "space-between", marginTop: T.spacing.sm },
  capat: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  raport: { paddingVertical: T.spacing.md },
  cuLinie: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.line.l1,
  },
  randRaport: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  numeRaport: {
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  valoareRaport: {
    fontSize: T.fontSize.lg,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  citire: {
    fontSize: T.fontSize.xs,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginTop: 3,
  },
  explicatie: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    marginTop: 4,
  },
  antetCont: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: T.spacing.sm,
    marginBottom: T.spacing.sm,
  },
  numeCont: {
    flex: 1,
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  randamentCont: {
    fontSize: T.fontSize.base,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
  },
});
