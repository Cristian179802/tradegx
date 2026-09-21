import * as React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/lib/api";
import { useCerere } from "../../src/lib/useCerere";
import { bani, baniScurt, dataScurta, numar, procent } from "../../src/lib/format";
import { Card } from "../../src/ui/Card";
import { Reveal } from "../../src/ui/Reveal";
import { Ecran } from "../../src/ui/Ecran";
import { Bare, Curba, useLatime } from "../../src/ui/grafice";
import { GrilaStatistici, Insigna, Rand, Sectiune, Statistica } from "../../src/ui/parti";
import { T, tonPnl, cifre } from "../../src/theme";

// ── Rezultatul unui backtest ─────────────────────────────────────────────────
//
// Cifrele sunt aceleași ca pe site, dar ordinea e alta: pe telefon, prima
// întrebare e „a mers sau nu”, nu „câte bare a parcurs”.
//
// TRANZACȚIILE SE ARATĂ ULTIMELE și doar primele cincizeci. Un backtest de doi
// ani are sute; derulate toate, ar îngropa rezumatul. Cine vrea lista completă
// o are pe site, unde încape un tabel.
//
// Un backtest EȘUAT își spune motivul, nu dispare. Cel mai des motiv e că
// furnizorul n-are lumânări pentru simbolul ăla pe intervalul cerut — util de
// știut, altfel omul încearcă la nesfârșit.

interface TranzactieBt {
  id: string;
  symbol: string;
  direction: string;
  entryTime: string;
  exitTime: string;
  entryPrice: string;
  exitPrice: string;
  pnl: string;
  lotSize: string;
  riskRewardRatio: string | null;
  exitReason?: string | null;
}

interface Backtest {
  id: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  status: string;
  errorMessage: string | null;
  totalTrades: number | null;
  totalBars: number | null;
  winRate: string | null;
  profitFactor: string | null;
  maxDrawdownPct: string | null;
  sharpeRatio: string | null;
  sortinoRatio: string | null;
  netPnl: string | null;
  expectancy: string | null;
  avgRR: string | null;
  initialBalance: string | null;
  finalBalance: string | null;
  riskPerTrade: string | null;
  equityCurve: { date: string; balance: number; pnl: number }[] | null;
  monthlyPnl: { month: string; pnl: number }[] | null;
  strategy: { id: string; name: string; type: string; color: string | null };
  trades: TranzactieBt[];
}

const LUNI = ["ian.", "feb.", "mar.", "apr.", "mai", "iun.", "iul.", "aug.", "sept.", "oct.", "nov.", "dec."];
const MAX_TRANZACTII = 50;

export default function RezultatBacktest() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [latime, laMasurare] = useLatime();

  const c = useCerere<Backtest>(
    () => api.backtesting.get(String(id)) as Promise<Backtest>,
    [id],
  );
  const b = c.date;

  const numarSauNul = (v: string | null | undefined): number | null =>
    v == null ? null : Number(v);

  const curba = React.useMemo(
    () => (b?.equityCurve ?? []).map((x) => x.balance),
    [b?.equityCurve],
  );

  const lunar = React.useMemo(
    () =>
      (b?.monthlyPnl ?? []).map((x) => {
        const luna = Number(x.month.split("-")[1]) - 1;
        return { eticheta: LUNI[luna] ?? x.month, valoare: x.pnl };
      }),
    [b?.monthlyPnl],
  );

  const pnl = numarSauNul(b?.netPnl);
  const initial = numarSauNul(b?.initialBalance);
  const final = numarSauNul(b?.finalBalance);
  const randament = initial && initial > 0 && final != null ? ((final - initial) / initial) * 100 : null;

  return (
    <Ecran
      titlu={b?.strategy.name ?? "Backtest"}
      subtitlu={b ? `${b.symbol} · ${b.timeframe} · ${dataScurta(b.startDate)} → ${dataScurta(b.endDate)}` : null}
      incarca={c.incarca && !b}
      scheletRanduri={4}
      reimprospateaza={c.reimprospateaza}
      onReia={c.reia}
      eroare={c.eroare}
    >
      <View onLayout={laMasurare} />

      {!b ? null : b.status !== "COMPLETED" ? (
        <Card culoareMuchie="rgba(251,113,133,0.35)">
          <View style={st.esec}>
            <Ionicons name="alert-circle-outline" size={20} color={T.pnl.loss} />
            <View style={{ flex: 1 }}>
              <Text style={st.titluEsec}>
                {b.status === "FAILED" ? "Rularea a eșuat" : `Stare: ${b.status.toLowerCase()}`}
              </Text>
              <Text style={st.textEsec}>
                {b.errorMessage ??
                  "Fără detalii. Cel mai des, furnizorul n-are lumânări pentru simbolul ăsta pe intervalul cerut."}
              </Text>
            </View>
          </View>
        </Card>
      ) : (
        <>
          <Reveal>
            <Card culoareMuchie={pnl != null && pnl < 0 ? "rgba(251,113,133,0.30)" : "rgba(52,211,153,0.30)"}>
              <GrilaStatistici>
                <Statistica
                  eticheta="Rezultat net"
                  valoare={pnl == null ? "—" : baniScurt(pnl, "")}
                  culoare={tonPnl(pnl)}
                  marime={T.fontSize.xl}
                  nota={randament == null ? null : procent(randament, 2)}
                  style={st.celula}
                />
                <Statistica
                  eticheta="Rată de câștig"
                  valoare={b.winRate == null ? "—" : procent(Number(b.winRate))}
                  marime={T.fontSize.xl}
                  intarziere={70}
                  nota={b.totalTrades != null ? `${b.totalTrades} tranzacții` : null}
                  style={st.celula}
                />
                <Statistica
                  eticheta="Profit factor"
                  valoare={b.profitFactor == null ? "—" : numar(Number(b.profitFactor), 2)}
                  marime={T.fontSize.lg}
                  intarziere={140}
                  style={st.celula}
                />
                <Statistica
                  eticheta="Drawdown maxim"
                  valoare={b.maxDrawdownPct == null ? "—" : procent(Number(b.maxDrawdownPct), 2)}
                  culoare={
                    b.maxDrawdownPct != null && Number(b.maxDrawdownPct) > 20 ? T.pnl.loss : T.ink.i1
                  }
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
                  inaltime={150}
                  culoare={pnl != null && pnl >= 0 ? T.pnl.gain : T.pnl.loss}
                  referinta={initial}
                />
                <View style={st.capete}>
                  <Text style={[st.capat, cifre]}>{initial == null ? "—" : bani(initial, "", false)}</Text>
                  <Text style={[st.capat, cifre, { color: tonPnl(pnl) }]}>
                    {final == null ? "—" : bani(final, "", false)}
                  </Text>
                </View>
              </Card>
            </Reveal>
          ) : null}

          {lunar.length > 0 ? (
            <>
              <Sectiune titlu="Pe luni" />
              <Reveal intarziere={90}>
                <Card>
                  <Bare date={lunar} latime={latime} inaltime={120} dupaSemn />
                </Card>
              </Reveal>
            </>
          ) : null}

          <Sectiune titlu="Detalii" />
          <Reveal intarziere={120}>
            <Card>
              <Rand cheie="Sharpe" valoare={b.sharpeRatio == null ? "—" : numar(Number(b.sharpeRatio), 2)} />
              <Rand cheie="Sortino" valoare={b.sortinoRatio == null ? "—" : numar(Number(b.sortinoRatio), 2)} />
              <Rand cheie="RR mediu" valoare={b.avgRR == null ? "—" : numar(Number(b.avgRR), 2)} />
              <Rand
                cheie="Expectancy per tranzacție"
                valoare={b.expectancy == null ? "—" : bani(Number(b.expectancy), "")}
                culoare={tonPnl(numarSauNul(b.expectancy))}
              />
              <Rand cheie="Risc pe tranzacție" valoare={b.riskPerTrade == null ? "—" : procent(Number(b.riskPerTrade), 1)} />
              <Rand cheie="Lumânări parcurse" valoare={b.totalBars == null ? "—" : numar(b.totalBars, 0)} />
            </Card>
          </Reveal>

          {b.trades.length > 0 ? (
            <>
              <Sectiune
                titlu="Tranzacții"
                nota={
                  b.trades.length > MAX_TRANZACTII
                    ? `Primele ${MAX_TRANZACTII} din ${b.trades.length}. Lista completă e pe site.`
                    : undefined
                }
              />
              <Card faraPadding>
                {b.trades.slice(0, MAX_TRANZACTII).map((t, i) => {
                  const p = Number(t.pnl);
                  return (
                    <View key={t.id} style={[st.rand, i > 0 && st.cuLinie]}>
                      <Ionicons
                        name={t.direction === "BUY" ? "arrow-up" : "arrow-down"}
                        size={13}
                        color={t.direction === "BUY" ? T.pnl.gain : T.pnl.loss}
                      />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={st.dataTranz} numberOfLines={1}>
                          {dataScurta(t.entryTime)}
                        </Text>
                        <Text style={st.metaTranz} numberOfLines={1}>
                          {Number(t.lotSize).toFixed(2)} lot
                          {t.riskRewardRatio ? ` · RR ${numar(Number(t.riskRewardRatio), 2)}` : ""}
                          {t.exitReason ? ` · ${t.exitReason}` : ""}
                        </Text>
                      </View>
                      <Text style={[st.pnlTranz, cifre, { color: tonPnl(p) }]}>{bani(p, "")}</Text>
                    </View>
                  );
                })}
              </Card>
            </>
          ) : (
            <Card style={{ marginTop: T.spacing.md }}>
              <View style={st.faraTranzactii}>
                <Insigna text="0 tranzacții" culoare={T.ink.i3} />
                <Text style={st.textFara}>
                  Strategia n-a găsit nicio intrare pe perioada asta. De cele mai multe ori
                  înseamnă condiții prea strânse, nu o eroare.
                </Text>
              </View>
            </Card>
          )}
        </>
      )}
    </Ecran>
  );
}

const st = StyleSheet.create({
  celula: { width: "50%" },
  esec: { flexDirection: "row", gap: T.spacing.md, alignItems: "flex-start" },
  titluEsec: {
    color: T.pnl.loss,
    fontSize: T.fontSize.base,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  textEsec: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginTop: 4,
  },
  capete: { flexDirection: "row", justifyContent: "space-between", marginTop: T.spacing.sm },
  capat: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  rand: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.md,
    paddingHorizontal: T.spacing.lg,
    paddingVertical: T.spacing.md,
  },
  cuLinie: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: T.line.l1 },
  dataTranz: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
  },
  metaTranz: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  pnlTranz: {
    fontSize: T.fontSize.sm,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  faraTranzactii: { gap: T.spacing.sm },
  textFara: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});
