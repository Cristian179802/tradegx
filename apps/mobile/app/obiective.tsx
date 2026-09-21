import * as React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api, ApiError } from "../src/lib/api";
import { useCerere } from "../src/lib/useCerere";
import { bani, numar, procent } from "../src/lib/format";
import { Card } from "../src/ui/Card";
import { Camp } from "../src/ui/Camp";
import { Buton } from "../src/ui/Buton";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { RollingNumber } from "../src/ui/RollingNumber";
import { BaraProgres, Sectiune } from "../src/ui/parti";
import { T, tonPnl } from "../src/theme";

// ── Obiective lunare ─────────────────────────────────────────────────────────
//
// Trei ținte, nu zece: profit, număr de tranzacții, rată de câștig. Sunt exact
// cele care se pot măsura fără interpretare la final de lună.
//
// PROGRESUL SE VEDE ÎNAINTE DE ȚINTE. Cine deschide ecranul la mijlocul lunii
// vrea să știe unde e, nu să-și reciteasca obiectivele — pe acelea le-a scris o
// dată.
//
// O ȚINTĂ GOALĂ ÎNSEAMNĂ „nu mă interesează”, nu zero. De aceea câmpul gol se
// trimite ca `null`, iar cardul dispare din progres. Un obiectiv de 0% rată de
// câștig, atins mereu, ar fi o batjocură.
//
// Zilele rămase din lună sunt afișate lângă profit: „mai ai 1.200 de făcut” nu
// înseamnă nimic fără „în patru zile”.

interface Obiective {
  targets: {
    monthlyProfitTarget: number | null;
    monthlyTradeTarget: number | null;
    monthlyWinRateTarget: number | null;
  };
  progress: { pnl: number; trades: number; winRate: number };
  currency: string;
}

function zileRamase(): number {
  const acum = new Date();
  const ultima = new Date(acum.getFullYear(), acum.getMonth() + 1, 0).getDate();
  return Math.max(0, ultima - acum.getDate());
}

const LUNA = new Intl.DateTimeFormat("ro-RO", { month: "long", year: "numeric" });

export default function Obiective() {
  const c = useCerere<Obiective>(() => api.goals.get() as Promise<Obiective>);
  const d = c.date;

  const [profit, setProfit] = React.useState<string | null>(null);
  const [tranzactii, setTranzactii] = React.useState("");
  const [rata, setRata] = React.useState("");
  const [salveaza, setSalveaza] = React.useState(false);
  const [salvat, setSalvat] = React.useState(false);
  const [eroare, setEroare] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!d || profit != null) return;
    setProfit(d.targets.monthlyProfitTarget?.toString() ?? "");
    setTranzactii(d.targets.monthlyTradeTarget?.toString() ?? "");
    setRata(d.targets.monthlyWinRateTarget?.toString() ?? "");
  }, [d, profit]);

  const numarSauNul = (v: string): number | null => {
    const t = v.trim().replace(",", ".");
    if (t === "") return null;
    const x = Number(t);
    return Number.isFinite(x) ? x : null;
  };

  const salveazaTinte = async () => {
    setSalveaza(true);
    setEroare(null);
    try {
      const nrTranz = numarSauNul(tranzactii);
      const nrRata = numarSauNul(rata);
      await api.goals.update({
        monthlyProfitTarget: numarSauNul(profit ?? ""),
        monthlyTradeTarget: nrTranz == null ? null : Math.round(nrTranz),
        monthlyWinRateTarget: nrRata == null ? null : Math.round(nrRata),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSalvat(true);
      c.reia();
    } catch (e) {
      setEroare(e instanceof ApiError ? e.message : "Nu am putut salva obiectivele.");
    } finally {
      setSalveaza(false);
    }
  };

  const moneda = d?.currency ?? "USD";
  const p = d?.progress;
  const t = d?.targets;
  const ramase = zileRamase();

  return (
    <Ecran
      titlu="Obiective"
      subtitlu={LUNA.format(new Date())}
      incarca={c.incarca && !d}
      scheletRanduri={3}
      reimprospateaza={c.reimprospateaza}
      onReia={c.reia}
      eroare={eroare ?? c.eroare}
    >
      {!d || !p || !t ? null : (
        <>
          <Reveal>
            <Card>
              <View style={st.antetLuna}>
                <View>
                  <Text style={st.eticheta}>REZULTATUL LUNII</Text>
                  <RollingNumber
                    value={bani(p.pnl, moneda)}
                    size={T.fontSize["2xl"]}
                    color={tonPnl(p.pnl)}
                  />
                </View>
                <View style={st.zile}>
                  <Ionicons name="calendar-outline" size={13} color={T.ink.i4} />
                  <Text style={st.textZile}>
                    {ramase === 0 ? "ultima zi" : `${ramase} ${ramase === 1 ? "zi" : "zile"}`}
                  </Text>
                </View>
              </View>
            </Card>
          </Reveal>

          <Sectiune titlu="Unde ești" />

          {t.monthlyProfitTarget != null ? (
            <Reveal intarziere={50} style={{ marginBottom: T.spacing.md }}>
              <CardObiectiv
                iconita="trending-up-outline"
                titlu="Profit lunar"
                acum={bani(p.pnl, moneda, false)}
                tinta={bani(t.monthlyProfitTarget, moneda, false)}
                fractiune={t.monthlyProfitTarget > 0 ? p.pnl / t.monthlyProfitTarget : 0}
                ramas={
                  p.pnl >= t.monthlyProfitTarget
                    ? "Atins."
                    : `Mai ai ${bani(t.monthlyProfitTarget - p.pnl, moneda, false)}${ramase > 0 ? ` în ${ramase} zile` : ""}.`
                }
              />
            </Reveal>
          ) : null}

          {t.monthlyTradeTarget != null ? (
            <Reveal intarziere={100} style={{ marginBottom: T.spacing.md }}>
              <CardObiectiv
                iconita="list-outline"
                titlu="Tranzacții"
                acum={numar(p.trades, 0)}
                tinta={numar(t.monthlyTradeTarget, 0)}
                fractiune={t.monthlyTradeTarget > 0 ? p.trades / t.monthlyTradeTarget : 0}
                ramas={
                  p.trades >= t.monthlyTradeTarget
                    ? "Atins. Nu forța peste — numărul nu e scopul."
                    : `Mai ai ${t.monthlyTradeTarget - p.trades} de notat.`
                }
              />
            </Reveal>
          ) : null}

          {t.monthlyWinRateTarget != null ? (
            <Reveal intarziere={150} style={{ marginBottom: T.spacing.md }}>
              <CardObiectiv
                iconita="stats-chart-outline"
                titlu="Rată de câștig"
                acum={procent(p.winRate)}
                tinta={procent(t.monthlyWinRateTarget, 0)}
                fractiune={t.monthlyWinRateTarget > 0 ? p.winRate / t.monthlyWinRateTarget : 0}
                ramas={
                  p.winRate >= t.monthlyWinRateTarget
                    ? "Peste țintă."
                    : `${numar(t.monthlyWinRateTarget - p.winRate, 1)} puncte sub țintă.`
                }
              />
            </Reveal>
          ) : null}

          {t.monthlyProfitTarget == null && t.monthlyTradeTarget == null && t.monthlyWinRateTarget == null ? (
            <Card style={{ marginTop: T.spacing.sm }}>
              <Text style={st.faraTinte}>
                N-ai pus încă niciun obiectiv. Pune unul singur — cel pe care chiar
                îl urmărești. Trei obiective pe care nu le privești nu fac cât unul
                pe care îl verifici.
              </Text>
            </Card>
          ) : null}

          <Sectiune titlu="Țintele lunii" nota="Lasă gol ce nu te interesează." />

          <Reveal intarziere={200}>
            <Card>
              <Camp
                eticheta={`Profit lunar (${moneda})`}
                valoare={profit ?? ""}
                onChange={(v) => { setSalvat(false); setProfit(v); }}
                numeric
                placeholder="gol = fără țintă"
              />
              <Camp
                eticheta="Număr de tranzacții"
                valoare={tranzactii}
                onChange={(v) => { setSalvat(false); setTranzactii(v); }}
                numeric
                placeholder="gol = fără țintă"
              />
              <Camp
                eticheta="Rată de câștig"
                valoare={rata}
                onChange={(v) => { setSalvat(false); setRata(v); }}
                numeric
                sufix="%"
                placeholder="gol = fără țintă"
              />
              <Buton
                eticheta={salvat ? "Salvat" : "Salvează obiectivele"}
                onPress={salveazaTinte}
                incarca={salveaza}
                plin
                iconita={
                  <Ionicons name={salvat ? "checkmark-circle" : "save-outline"} size={16} color="#ffffff" />
                }
              />
            </Card>
          </Reveal>
        </>
      )}
    </Ecran>
  );
}

function CardObiectiv({
  iconita, titlu, acum, tinta, fractiune, ramas,
}: {
  iconita: React.ComponentProps<typeof Ionicons>["name"];
  titlu: string;
  acum: string;
  tinta: string;
  fractiune: number;
  ramas: string;
}) {
  const atins = fractiune >= 1;
  const culoare = atins ? T.pnl.gain : T.accent.base;
  return (
    <Card culoareMuchie={atins ? "rgba(52,211,153,0.35)" : undefined}>
      <View style={st.antetObiectiv}>
        <View style={[st.iconita, atins && { backgroundColor: "rgba(52,211,153,0.12)" }]}>
          <Ionicons name={atins ? "checkmark" : iconita} size={15} color={culoare} />
        </View>
        <Text style={st.titluObiectiv}>{titlu}</Text>
        <Text style={st.fractie}>
          <Text style={{ color: culoare }}>{acum}</Text>
          <Text style={{ color: T.ink.i4 }}> / {tinta}</Text>
        </Text>
      </View>
      <BaraProgres fractiune={fractiune} culoare={culoare} style={{ marginTop: T.spacing.md }} />
      <Text style={st.ramas}>{ramas}</Text>
    </Card>
  );
}

const st = StyleSheet.create({
  antetLuna: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  eticheta: {
    color: T.ink.i4,
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.wider,
    marginBottom: 6,
  },
  zile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: T.radius.sm,
    backgroundColor: T.surface.s4,
  },
  textZile: {
    color: T.ink.i3,
    fontSize: T.fontSize.xs,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  antetObiectiv: { flexDirection: "row", alignItems: "center", gap: T.spacing.sm },
  iconita: {
    width: 28,
    height: 28,
    borderRadius: T.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.accent.soft,
  },
  titluObiectiv: {
    flex: 1,
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  fractie: {
    fontSize: T.fontSize.sm,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  ramas: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: T.spacing.sm,
  },
  faraTinte: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
});
