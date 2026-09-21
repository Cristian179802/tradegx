import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "../src/ui/Text";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api, ApiError } from "../src/lib/api";
import { Card } from "../src/ui/Card";
import { Camp } from "../src/ui/Camp";
import { Buton } from "../src/ui/Buton";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { Insigna, Rand, Sectiune } from "../src/ui/parti";
import { T } from "../src/theme";

// ── Strategie nouă ───────────────────────────────────────────────────────────
//
// Ecranul ăsta lipsea, și lipsa lui făcea Backtestingul INUTIL pe telefon: cine
// n-avea deja o strategie salvată de pe calculator vedea o listă goală și un
// text care-i spunea să meargă în altă parte. Adică un ecran care nu servea la
// nimic pentru majoritatea oamenilor.
//
// A fost o decizie proastă a mea, luată ca să respect regula „fără linkuri
// spre web": am scos linkul, dar n-am pus nimic în loc.
//
// PATRU STRATEGII GATA FĂCUTE, nu un constructor. Fiecare are reguli cu valori
// implicite care funcționează, iar aici se ating doar cele două care chiar
// schimbă rezultatul: cât de departe stă stopul și ce raport ținești. Restul —
// perioade de indicatori, filtre, confirmări — rămân la valorile cunoscute.
//
// A cincea, CUSTOM, e un constructor cu condiții imbricate. Aceea rămâne pe
// site: pe un ecran de cinci țoli ar fi o promisiune pe care n-ar folosi-o
// nimeni de două ori. Dar acum nu mai e singura cale de a începe.

interface Tip {
  id: string;
  nume: string;
  descriere: string;
  cum: string;
  iconita: React.ComponentProps<typeof Ionicons>["name"];
  culoare: string;
  reguli: Record<string, unknown>;
}

const TIPURI: Tip[] = [
  {
    id: "EMA_CROSSOVER",
    nume: "Încrucișare de medii",
    descriere: "Intră când media rapidă taie media lentă, în direcția trendului mare.",
    cum: "EMA 9 taie EMA 21, cu EMA 200 ca filtru de trend.",
    iconita: "git-compare-outline",
    culoare: "#6d75f6",
    reguli: {
      fastPeriod: 9, slowPeriod: 21, trendPeriod: 200,
      atrPeriod: 14, slMultiplier: 1.5, rrRatio: 2.0,
      rsiFilter: 0, rsiPeriod: 14, macdConfirm: false, trailingStop: false,
    },
  },
  {
    id: "SESSION_BREAKOUT",
    nume: "Ieșire din sesiune",
    descriere: "Marchează intervalul unei sesiuni și intră când prețul iese din el.",
    cum: "Intervalul sesiunii Londra, spart în orice direcție.",
    iconita: "time-outline",
    culoare: "#34d399",
    reguli: {
      session: "LONDON", slMultiplier: 1.0, rrRatio: 2.0,
      atrPeriod: 14, minRangePips: 0, retestEntry: false, rsiFilter: 0,
    },
  },
  {
    id: "RSI_REVERSAL",
    nume: "Întoarcere din extreme",
    descriere: "Cumpără când RSI e jos și vinde când e sus, cu o medie ca filtru.",
    cum: "RSI 14 sub 30 sau peste 70, filtrat de EMA 50.",
    iconita: "swap-vertical-outline",
    culoare: "#fbbf24",
    reguli: {
      rsiPeriod: 14, oversold: 30, overbought: 70, emaFilter: 50,
      atrPeriod: 14, slMultiplier: 1.5, rrRatio: 2.0,
      stochConfirm: false, stochK: 14, stochD: 3, stochOversold: 20, stochOverbought: 80,
      bollFilter: false, bollPeriod: 20,
    },
  },
  {
    id: "TREND_FOLLOWING",
    nume: "Pe trend, la corecție",
    descriere: "Așteaptă o corecție într-un trend confirmat și intră în direcția lui.",
    cum: "EMA 50 ca direcție, ADX peste 25 ca putere, trei bare de corecție.",
    iconita: "trending-up-outline",
    culoare: "#fb7185",
    reguli: {
      emaPeriod: 50, emaSlow: 0, adxPeriod: 14, adxThreshold: 25, pullbackBars: 3,
      atrPeriod: 14, slMultiplier: 1.5, rrRatio: 2.0,
      requireDiCross: false, macdFilter: false, macdFast: 12, macdSlow: 26, macdSignal: 9,
    },
  },
];

/** Cât de departe stă stopul, ca multiplu de ATR. */
const STOPURI = [1.0, 1.5, 2.0, 2.5];

/** Ce raport se ținteste. Sub 1 nu are sens ca preset. */
const RAPOARTE = [1.5, 2.0, 3.0];

export default function StrategieNoua() {
  const router = useRouter();

  const [tip, setTip] = React.useState<Tip>(TIPURI[0]!);
  const [nume, setNume] = React.useState("");
  const [stop, setStop] = React.useState(1.5);
  const [raport, setRaport] = React.useState(2.0);
  const [salveaza, setSalveaza] = React.useState(false);
  const [eroare, setEroare] = React.useState<string | null>(null);

  // Numele se completează singur din tipul ales, dar rămâne editabil: cine are
  // trei variante ale aceleiași strategii vrea să le deosebească.
  const numeFolosit = nume.trim() || tip.nume;

  const creeaza = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSalveaza(true);
    setEroare(null);
    try {
      const r = (await api.backtesting.creeazaStrategie({
        name: numeFolosit.slice(0, 80),
        description: tip.descriere,
        type: tip.id,
        color: tip.culoare,
        // Valorile implicite, cu cele două pe care le-a atins omul peste ele.
        rules: { ...tip.reguli, slMultiplier: stop, rrRatio: raport },
      })) as { id?: string };

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      // Înapoi în lista de backtesting, unde strategia nouă e gata de rulat.
      router.replace("/backtesting");
      void r;
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setEroare(e instanceof ApiError ? e.message : "Nu am putut salva strategia.");
    } finally {
      setSalveaza(false);
    }
  };

  return (
    <Ecran
      titlu="Strategie nouă"
      subtitlu="Alege un tipar, apoi rulează-l pe date reale"
      eroare={eroare}
      subsol={
        <Buton
          eticheta="Salvează strategia"
          onPress={creeaza}
          incarca={salveaza}
          plin
          iconita={<Ionicons name="flask-outline" size={17} color="#ffffff" />}
        />
      }
    >
      <Sectiune titlu="Ce tipar cauți" />

      {TIPURI.map((x, i) => {
        const ales = x.id === tip.id;
        return (
          <Reveal key={x.id} intarziere={i * 50} style={{ marginBottom: T.spacing.sm }}>
            <Card
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setTip(x);
                setStop(Number(x.reguli.slMultiplier ?? 1.5));
                setRaport(Number(x.reguli.rrRatio ?? 2));
              }}
              culoareMuchie={ales ? `${x.culoare}59` : "rgba(255,255,255,0.04)"}
              accesibilEticheta={`${x.nume}. ${x.descriere}`}
            >
              <View style={st.antet}>
                <View style={[st.iconita, { backgroundColor: `${x.culoare}1A` }]}>
                  <Ionicons name={x.iconita} size={18} color={x.culoare} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={st.nume}>{x.nume}</Text>
                  <Text style={st.descriere}>{x.descriere}</Text>
                </View>
                {ales ? (
                  <Ionicons name="checkmark-circle" size={20} color={x.culoare} />
                ) : null}
              </View>

              {ales ? (
                <View style={st.cum}>
                  <Ionicons name="information-circle-outline" size={13} color={T.ink.i4} />
                  <Text style={st.textCum}>{x.cum}</Text>
                </View>
              ) : null}
            </Card>
          </Reveal>
        );
      })}

      <Sectiune
        titlu="Cele două care contează"
        nota="Restul parametrilor rămân la valorile cunoscute. Se schimbă pe site, dacă vrei."
      />

      <Reveal>
        <Card>
          <Text style={st.eticheta}>Stopul, ca multiplu de ATR</Text>
          <View style={st.optiuni}>
            {STOPURI.map((v) => (
              <Optiune
                key={v}
                text={`${v.toFixed(1)}×`}
                activ={v === stop}
                onPress={() => setStop(v)}
              />
            ))}
          </View>
          <Text style={st.nota}>
            Mai mare = stop mai departe, mai puține ieșiri pe zgomot, dar pierderi mai
            mari când greșești.
          </Text>

          <Text style={[st.eticheta, { marginTop: T.spacing.lg }]}>Raport risc/câștig</Text>
          <View style={st.optiuni}>
            {RAPOARTE.map((v) => (
              <Optiune
                key={v}
                text={`1 : ${v.toFixed(1)}`}
                activ={v === raport}
                onPress={() => setRaport(v)}
              />
            ))}
          </View>
          <Text style={st.nota}>
            Mai mare = mai puține tranzacții câștigate, dar fiecare valorează mai mult.
          </Text>
        </Card>
      </Reveal>

      <Sectiune titlu="Numele" />
      <Reveal>
        <Card>
          <Camp
            eticheta="Cum o cheamă"
            valoare={nume}
            onChange={setNume}
            placeholder={tip.nume}
            autoCapitalize="sentences"
          />
          <Rand cheie="Se va salva ca" valoare={numeFolosit} numeric={false} />
        </Card>
      </Reveal>

      <Reveal style={{ marginTop: T.spacing.md }}>
        <Card nivel={1}>
          <Insigna text="constructor" culoare={T.ink.i3} />
          <Text style={[st.nota, { marginTop: T.spacing.sm }]}>
            Strategiile cu condiții proprii — „intră când RSI taie 50 ȘI prețul e peste
            EMA 200 ȘI e sesiunea Londrei" — se construiesc pe site. Sunt zeci de
            condiții imbricate; aici ar fi fost un formular pe care nu l-ar deschide
            nimeni de două ori.
          </Text>
        </Card>
      </Reveal>
    </Ecran>
  );
}

function Optiune({
  text, activ, onPress,
}: {
  text: string;
  activ: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={[st.optiune, activ && st.optiuneActiva]}
      accessibilityRole="button"
      accessibilityState={{ selected: activ }}
    >
      <Text style={[st.textOptiune, activ && { color: T.accent.base }]}>{text}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  antet: { flexDirection: "row", alignItems: "flex-start", gap: T.spacing.md },
  iconita: {
    width: 40,
    height: 40,
    borderRadius: T.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  nume: {
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.tight,
  },
  descriere: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: 3,
  },
  cum: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: T.spacing.md,
    paddingTop: T.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.line.l1,
  },
  textCum: {
    flex: 1,
    color: T.ink.i3,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  eticheta: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: T.tracking.wider,
    marginBottom: T.spacing.sm,
  },
  optiuni: { flexDirection: "row", gap: 6 },
  optiune: {
    flex: 1,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: T.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    backgroundColor: T.surface.s3,
  },
  optiuneActiva: { backgroundColor: T.accent.soft, borderColor: T.accent.line },
  textOptiune: {
    color: T.ink.i3,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_700Bold",
  },
  nota: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    marginTop: T.spacing.sm,
  },
});
