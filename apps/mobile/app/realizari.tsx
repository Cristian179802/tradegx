import * as React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "../src/ui/Text";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../src/lib/api";
import { useCerere } from "../src/lib/useCerere";
import { numar } from "../src/lib/format";
import { Card } from "../src/ui/Card";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { RollingNumber } from "../src/ui/RollingNumber";
import { BaraProgres, Sectiune } from "../src/ui/parti";
import { T } from "../src/theme";
import { umple } from "../src/lib/i18n";
import { tr } from "../src/lib/i18n";

// ── Realizări ────────────────────────────────────────────────────────────────
//
// Nu e un panou de trofee. Fiecare realizare măsoară un OBICEI — zile la rând
// cu jurnal completat, tranzacții cu stop, backteste rulate. Lucruri care se
// fac, nu bani care se câștigă.
//
// CELE BLOCATE ARATĂ PROGRESUL, nu un lacăt. „7 din 10” spune ce mai ai de
// făcut; un lacăt spune doar că n-ai. Prima e o instrucțiune, a doua o notă.
//
// SERIA E PRIMA ȘI E MARE, fiindcă e singura cifră din ecran care se poate
// pierde. Un trofeu odată deblocat rămâne; seria se rupe dacă sari o zi.

interface Realizare {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

interface Date_ {
  streak: { current: number; best: number };
  totalTrades: number;
  achievements: Realizare[];
}

export default function Realizari() {
  const c = useCerere<Date_>(() => api.gamification() as Promise<Date_>);
  const d = c.date;

  const deblocate = (d?.achievements ?? []).filter((a) => a.unlocked);
  const blocate = (d?.achievements ?? []).filter((a) => !a.unlocked);
  const total = d?.achievements.length ?? 0;

  return (
    <Ecran
      titlu="Realizări"
      subtitlu={total > 0 ? umple("{p1} din {p2} deblocate", { p1: deblocate.length, p2: total }) : "Obiceiurile tale, măsurate"}
      incarca={c.incarca && !d}
      scheletRanduri={4}
      reimprospateaza={c.reimprospateaza}
      onReia={c.reia}
      eroare={c.eroare}
    >
      {!d ? null : (
        <>
          <Reveal>
            <Card culoareMuchie={d.streak.current > 0 ? "rgba(251,191,36,0.40)" : undefined}>
              <View style={st.serie}>
                <View style={st.flacara}>
                  <Ionicons
                    name={d.streak.current > 0 ? "flame" : "flame-outline"}
                    size={24}
                    color={d.streak.current > 0 ? T.state.warn : T.ink.i4}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.etichetaSerie}>SERIE ACTIVĂ</Text>
                  <View style={st.randSerie}>
                    <RollingNumber
                      value={String(d.streak.current)}
                      size={T.fontSize["2xl"]}
                      color={d.streak.current > 0 ? T.state.warn : T.ink.i2}
                    />
                    <Text style={st.zile}>
                      {d.streak.current === 1 ? "zi" : "zile"}
                    </Text>
                  </View>
                  <Text style={st.recordSerie}>
                    {d.streak.current >= d.streak.best && d.streak.current > 0
                      ? "E cel mai lung șir al tău. Nu-l rupe azi."
                      : umple(d.streak.best === 1 ? "Recordul tău: {n} zi." : "Recordul tău: {n} zile.", { n: d.streak.best })}
                  </Text>
                </View>
              </View>

              <View style={st.linie} />

              <View style={st.randTotal}>
                <Text style={st.etichetaTotal}>TRANZACȚII ÎNCHISE</Text>
                <Text style={st.valoareTotal}>{numar(d.totalTrades, 0)}</Text>
              </View>
            </Card>
          </Reveal>

          {total > 0 ? (
            <Reveal intarziere={60} style={{ marginTop: T.spacing.md }}>
              <Card nivel={1}>
                <View style={st.randProgres}>
                  <Text style={st.etichetaProgres}>Progres general</Text>
                  <Text style={st.valoareProgres}>
                    {deblocate.length}/{total}
                  </Text>
                </View>
                <BaraProgres fractiune={deblocate.length / total} />
              </Card>
            </Reveal>
          ) : null}

          {blocate.length > 0 ? (
            <>
              <Sectiune titlu="Următoarele" nota="Ordonate după cât de aproape ești." />
              {[...blocate]
                .sort((a, b) => (b.progress / (b.target || 1)) - (a.progress / (a.target || 1)))
                .map((a, i) => (
                  <Reveal key={a.id} intarziere={i * 45} style={{ marginBottom: T.spacing.sm }}>
                    <CardRealizare a={a} />
                  </Reveal>
                ))}
            </>
          ) : null}

          {deblocate.length > 0 ? (
            <>
              <Sectiune titlu="Deblocate" />
              {deblocate.map((a, i) => (
                <Reveal key={a.id} intarziere={i * 45} style={{ marginBottom: T.spacing.sm }}>
                  <CardRealizare a={a} />
                </Reveal>
              ))}
            </>
          ) : null}
        </>
      )}
    </Ecran>
  );
}

function CardRealizare({ a }: { a: Realizare }) {
  const fractiune = a.target > 0 ? Math.min(1, a.progress / a.target) : 0;

  return (
    <Card
      nivel={1}
      culoareMuchie={a.unlocked ? "rgba(52,211,153,0.30)" : "rgba(255,255,255,0.04)"}
      accesibilEticheta={umple("{titlu}. {stare}", { titlu: a.title, stare: a.unlocked ? tr("Deblocată") : umple("{facut} din {total}", { facut: a.progress, total: a.target }) })}
    >
      <View style={st.rand}>
        <View style={[st.emoji, !a.unlocked && st.emojiBlocat]}>
          <Text style={st.textEmoji}>{a.emoji}</Text>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={st.randTitlu}>
            <Text style={[st.titlu, !a.unlocked && { color: T.ink.i3 }]} numberOfLines={1}>
              {a.title}
            </Text>
            {a.unlocked ? (
              <Ionicons name="checkmark-circle" size={16} color={T.pnl.gain} />
            ) : null}
          </View>
          <Text style={st.descriere} numberOfLines={2}>{a.description}</Text>

          {!a.unlocked && a.target > 0 ? (
            <>
              <BaraProgres
                fractiune={fractiune}
                culoare={T.accent.base}
                inaltime={4}
                style={{ marginTop: T.spacing.sm }}
              />
              <Text style={st.progres}>
                {numar(a.progress, 0)} din {numar(a.target, 0)}
              </Text>
            </>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const st = StyleSheet.create({
  serie: { flexDirection: "row", alignItems: "center", gap: T.spacing.lg },
  flacara: {
    width: 50,
    height: 50,
    borderRadius: T.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,191,36,0.10)",
  },
  etichetaSerie: {
    color: T.ink.i4,
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.wider,
    marginBottom: 4,
  },
  randSerie: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  zile: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_700Bold",
  },
  recordSerie: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  linie: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.line.l1,
    marginVertical: T.spacing.lg,
  },
  randTotal: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  etichetaTotal: {
    color: T.ink.i4,
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.wider,
  },
  valoareTotal: {
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  randProgres: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: T.spacing.sm,
  },
  etichetaProgres: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
  },
  valoareProgres: {
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  rand: { flexDirection: "row", gap: T.spacing.md, alignItems: "flex-start" },
  emoji: {
    width: 40,
    height: 40,
    borderRadius: T.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface.s4,
  },
  emojiBlocat: { opacity: 0.45 },
  textEmoji: { fontSize: 19 },
  randTitlu: { flexDirection: "row", alignItems: "center", gap: T.spacing.sm },
  titlu: {
    flex: 1,
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_700Bold",
  },
  descriere: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: 3,
  },
  progres: {
    color: T.ink.i4,
    fontSize: 10,
    fontFamily: "SpaceGrotesk_500Medium",
    marginTop: 5,
  },
});
