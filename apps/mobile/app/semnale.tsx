import * as React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api, ApiError } from "../src/lib/api";
import { useCerere } from "../src/lib/useCerere";
import { numar } from "../src/lib/format";
import { Card } from "../src/ui/Card";
import { Buton } from "../src/ui/Buton";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { Paywall } from "../src/ui/Paywall";
import { BaraProgres, Gol, Insigna, Rand } from "../src/ui/parti";
import { T, cifre } from "../src/theme";

// ── Semnale AI ───────────────────────────────────────────────────────────────
//
// Sunt IDEI, nu ordine. De aceea fiecare card arată la fel de apăsat
// invalidarea ca intrarea: un semnal fără condiția care-l anulează e o
// încurajare, nu o analiză.
//
// ÎNCREDEREA E O BARĂ, nu o culoare. Verde pentru „85% încredere" ar folosi
// exact culoarea pe care tot restul aplicației o rezervă profitului realizat.
// Bara spune la fel de mult, fără să promită bani.
//
// Generarea durează 10–20 de secunde și se cere EXPLICIT. Dacă ar porni
// singură la deschiderea ecranului, fiecare intrare ar consuma din bugetul de
// AI al lunii — inclusiv cele în care omul voia doar să recitească semnalul de
// dimineață.

interface Semnal {
  id: string;
  symbol: string;
  instrumentType: string;
  direction: string;
  timeframe: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  takeProfit2: number | null;
  riskReward: number;
  confidence: number;
  setupType: string;
  bias: string;
  session: string;
  rationale: string;
  confirmation: string;
  invalidation: string;
  status: string;
}

interface Raspuns {
  date: string;
  signals: Semnal[];
  needsGeneration: boolean;
  available: boolean;
}

export default function Semnale() {
  const c = useCerere<Raspuns>(() => api.signals.today() as Promise<Raspuns>);
  const d = c.date;

  const [genereaza, setGenereaza] = React.useState(false);
  const [eroare, setEroare] = React.useState<string | null>(null);

  const genereazaAcum = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setGenereaza(true);
    setEroare(null);
    try {
      await api.signals.generate();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      c.reia();
    } catch (e) {
      setEroare(e instanceof ApiError ? e.message : "Generarea nu a pornit.");
    } finally {
      setGenereaza(false);
    }
  };

  if (c.stare === 402) {
    return (
      <Ecran titlu="Semnale" subtitlu="Ideile zilei, analizate de AI">
        <Paywall
          functie="Semnale AI"
          descriere="În fiecare dimineață, o analiză a instrumentelor principale: unde e structura, unde e lichiditatea, ce ar invalida ideea."
          puncte={[
            "Intrare, stop și două ținte pentru fiecare idee",
            "Condiția de confirmare și cea de invalidare, scrise explicit",
            "Nivelul de încredere și sesiunea potrivită",
            "Raport risc/câștig calculat, nu estimat",
          ]}
        />
      </Ecran>
    );
  }

  const semnale = d?.signals ?? [];

  return (
    <Ecran
      titlu="Semnale"
      subtitlu={d ? `${semnale.length} ${semnale.length === 1 ? "idee" : "idei"} pentru ${d.date}` : "Ideile zilei"}
      incarca={c.incarca && !d}
      scheletRanduri={3}
      reimprospateaza={c.reimprospateaza}
      onReia={c.reia}
      eroare={eroare ?? c.eroare}
    >
      {!d ? null : !d.available ? (
        <Gol
          iconita="cloud-offline-outline"
          titlu="Analiza AI nu e pornită"
          text="Serviciul de analiză nu e configurat momentan. Nu e ceva ce poți repara tu — revino mai târziu."
        />
      ) : semnale.length === 0 ? (
        <Gol
          iconita="flash-outline"
          titlu="Niciun semnal azi"
          text="Fie analiza n-a rulat încă, fie n-a găsit nimic care să merite. Poți cere o rulare acum."
          actiune={
            <Buton
              eticheta="Generează semnalele zilei"
              onPress={genereazaAcum}
              incarca={genereaza}
              iconita={<Ionicons name="sparkles-outline" size={15} color="#ffffff" />}
            />
          }
        />
      ) : (
        <>
          {semnale.map((s, i) => (
            <Reveal key={s.id} intarziere={i * 60} style={{ marginBottom: T.spacing.md }}>
              <CardSemnal s={s} />
            </Reveal>
          ))}

          <Text style={st.subsol}>
            Semnalele sunt idei de analiză, nu recomandări de investiție. Fiecare
            trece prin regulile tale de risc înainte să devină un ordin.
          </Text>
        </>
      )}
    </Ecran>
  );
}

function CardSemnal({ s }: { s: Semnal }) {
  const [desfasurat, setDesfasurat] = React.useState(false);
  const cumparare = s.direction === "BUY";
  const culoare = cumparare ? T.pnl.gain : T.pnl.loss;

  return (
    <Card
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        setDesfasurat((p) => !p);
      }}
      culoareMuchie={cumparare ? "rgba(52,211,153,0.30)" : "rgba(251,113,133,0.30)"}
      accesibilEticheta={`${s.symbol}, ${cumparare ? "cumpărare" : "vânzare"}, încredere ${s.confidence}%`}
    >
      <View style={st.antet}>
        <View style={[st.directie, { backgroundColor: `${culoare}1F` }]}>
          <Ionicons name={cumparare ? "trending-up" : "trending-down"} size={17} color={culoare} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={st.randSimbol}>
            <Text style={st.simbol} numberOfLines={1}>{s.symbol}</Text>
            <Insigna text={s.timeframe} culoare={T.ink.i3} />
          </View>
          <Text style={st.setup} numberOfLines={1}>
            {s.setupType} · {s.session}
          </Text>
        </View>
        <Text style={[st.rr, cifre]}>RR {numar(s.riskReward, 1)}</Text>
      </View>

      <View style={st.incredere}>
        <View style={st.randIncredere}>
          <Text style={st.etichetaIncredere}>ÎNCREDERE</Text>
          <Text style={[st.valoareIncredere, cifre]}>{s.confidence}%</Text>
        </View>
        <BaraProgres fractiune={s.confidence / 100} inaltime={4} />
      </View>

      <View style={st.niveluri}>
        <Nivel eticheta="INTRARE" valoare={s.entryPrice} culoare={T.ink.i1} />
        <Nivel eticheta="STOP" valoare={s.stopLoss} culoare={T.pnl.loss} />
        <Nivel eticheta="ȚINTĂ" valoare={s.takeProfit} culoare={T.pnl.gain} />
        {s.takeProfit2 != null ? (
          <Nivel eticheta="ȚINTĂ 2" valoare={s.takeProfit2} culoare={T.pnl.gain} />
        ) : null}
      </View>

      {desfasurat ? (
        <View style={st.detalii}>
          <Bloc titlu="De ce" text={s.rationale} />
          <Bloc titlu="Confirmare" text={s.confirmation} iconita="checkmark-circle-outline" />
          <Bloc titlu="Invalidare" text={s.invalidation} iconita="close-circle-outline" rosu />
          <Rand cheie="Bias" valoare={s.bias} numeric={false} />
          <Rand cheie="Instrument" valoare={s.instrumentType} numeric={false} />
        </View>
      ) : (
        <View style={st.maiMult}>
          <Text style={st.textMaiMult}>Apasă pentru raționament și invalidare</Text>
          <Ionicons name="chevron-down" size={13} color={T.ink.i4} />
        </View>
      )}
    </Card>
  );
}

function Nivel({ eticheta, valoare, culoare }: { eticheta: string; valoare: number; culoare: string }) {
  return (
    <View style={st.nivel}>
      <Text style={st.etichetaNivel}>{eticheta}</Text>
      <Text style={[st.valoareNivel, cifre, { color: culoare }]}>{valoare}</Text>
    </View>
  );
}

function Bloc({
  titlu, text, iconita, rosu = false,
}: {
  titlu: string;
  text: string;
  iconita?: React.ComponentProps<typeof Ionicons>["name"];
  rosu?: boolean;
}) {
  if (!text) return null;
  return (
    <View style={{ marginBottom: T.spacing.md }}>
      <View style={st.randBloc}>
        {iconita ? (
          <Ionicons name={iconita} size={13} color={rosu ? T.pnl.loss : T.ink.i4} />
        ) : null}
        <Text style={[st.titluBloc, rosu && { color: T.pnl.loss }]}>{titlu}</Text>
      </View>
      <Text style={st.textBloc}>{text}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  antet: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  directie: {
    width: 38,
    height: 38,
    borderRadius: T.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  randSimbol: { flexDirection: "row", alignItems: "center", gap: T.spacing.sm },
  simbol: {
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.tight,
  },
  setup: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  rr: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  incredere: { marginTop: T.spacing.lg },
  randIncredere: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  etichetaIncredere: {
    color: T.ink.i4,
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.wider,
  },
  valoareIncredere: {
    color: T.ink.i2,
    fontSize: T.fontSize.xs,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  niveluri: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: T.spacing.md,
    marginTop: T.spacing.lg,
  },
  nivel: { width: "50%" },
  etichetaNivel: {
    color: T.ink.i4,
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.wider,
  },
  valoareNivel: {
    fontSize: T.fontSize.sm,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
    marginTop: 3,
  },
  detalii: {
    marginTop: T.spacing.lg,
    paddingTop: T.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.line.l1,
  },
  randBloc: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
  titluBloc: {
    color: T.ink.i4,
    fontSize: 9,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
    textTransform: "uppercase",
    letterSpacing: T.tracking.wider,
  },
  textBloc: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  maiMult: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: T.spacing.md,
  },
  textMaiMult: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
  subsol: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: T.spacing.sm,
  },
});
