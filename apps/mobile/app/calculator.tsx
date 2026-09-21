import * as React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  pipSize,
  pipValue,
  positionSize,
  stopPips,
  riskReward,
  perecheDeConversie,
  clasificaSimbol,
  type Cursuri,
} from "@tradegx/core";
import { api, ApiError } from "../src/lib/api";
import { bani, numar } from "../src/lib/format";
import { Card } from "../src/ui/Card";
import { Camp } from "../src/ui/Camp";
import { Buton } from "../src/ui/Buton";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { RollingNumber } from "../src/ui/RollingNumber";
import { Insigna, Rand, Sectiune } from "../src/ui/parti";
import { T, tonPnl } from "../src/theme";

// ── Calculator de lot ────────────────────────────────────────────────────────
//
// Întrebarea e una singură: câte loturi, ca să risc exact atât cât am zis?
//
// TOATĂ MATEMATICA VINE DIN `@tradegx/core`. Aici nu se calculează nimic de
// mână — nici valoarea pipului, nici mărimea contractului. Exact acolo era
// greșeala de ~150× pe perechile cu JPY, în trei locuri diferite, fiindcă
// fiecare ecran își făcea socoteala lui.
//
// CÂND NU SE POATE ȘTI, NU SE INVENTEAZĂ. `pipValue` întoarce `null` dacă îi
// lipsește un curs (ex. EURGBP pe un cont în RON). Atunci ecranul CERE cursul —
// și îl aduce singur de la aceeași rută de cotații pe care o folosește graficul.
// Un „3.41 loturi” scos din burtă e mai periculos decât un câmp gol: omul îl
// trimite la broker.
//
// Prețul de intrare se prefilează cu cotația curentă, dar rămâne editabil: cine
// pregătește un ordin limită are alt preț în cap decât piața.

interface Cotatie {
  price: number;
  balance: number;
  currency: string;
  freshness?: string;
}

export default function Calculator() {
  const [simbol, setSimbol] = React.useState("EURUSD");
  const [intrare, setIntrare] = React.useState("");
  const [stop, setStop] = React.useState("");
  const [tinta, setTinta] = React.useState("");
  const [risc, setRisc] = React.useState("1");
  const [sold, setSold] = React.useState("");
  const [moneda, setMoneda] = React.useState("USD");

  const [cursuri, setCursuri] = React.useState<Cursuri>({});
  const [aduce, setAduce] = React.useState(false);
  const [notita, setNotita] = React.useState<string | null>(null);

  // Prima încărcare: soldul contului activ și prețul simbolului implicit.
  React.useEffect(() => {
    let anulat = false;
    api.charts
      .quote("EURUSD", true)
      .then((q) => {
        if (anulat) return;
        const c = q as Cotatie;
        setSold(String(Math.round(c.balance)));
        setMoneda(c.currency);
        setIntrare(String(c.price));
      })
      .catch(() => {});
    return () => { anulat = true; };
  }, []);

  const aduPretul = async () => {
    const s = simbol.trim().toUpperCase();
    if (!s) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setAduce(true);
    setNotita(null);
    try {
      const q = (await api.charts.quote(s)) as Cotatie;
      setIntrare(String(q.price));
      // Dacă simbolul are nevoie de o conversie pe care n-o știm, o aducem tot
      // de aici. Altfel ar fi trebuit s-o tasteze omul, iar el n-are de unde.
      const nevoie = perecheDeConversie(s, moneda);
      if (nevoie) {
        try {
          const k = (await api.charts.quote(nevoie)) as Cotatie;
          setCursuri((p) => ({ ...p, [nevoie]: k.price }));
        } catch {
          setNotita(`Nu am găsit cursul ${nevoie}. Fără el nu pot calcula lotul corect.`);
        }
      }
    } catch (e) {
      setNotita(
        e instanceof ApiError && e.status === 422
          ? "Nu există cotație pentru simbolul ăsta."
          : "Nu am putut aduce prețul.",
      );
    } finally {
      setAduce(false);
    }
  };

  const n = (v: string) => {
    const x = Number(v.replace(",", "."));
    return Number.isFinite(x) ? x : null;
  };

  const s = simbol.trim().toUpperCase();
  const pIntrare = n(intrare);
  const pStop = n(stop);
  const pTinta = n(tinta);
  const pRisc = n(risc);
  const pSold = n(sold);

  const gata = pIntrare != null && pStop != null && pRisc != null && pSold != null && s.length >= 3;

  const rezultat = React.useMemo(() => {
    if (!gata) return null;
    const vp = pipValue({ symbol: s, price: pIntrare!, accountCurrency: moneda, rates: cursuri });
    const pips = stopPips(pIntrare!, pStop!, s);
    const loturi = positionSize({
      balance: pSold!,
      riskPct: pRisc!,
      entryPrice: pIntrare!,
      stopLoss: pStop!,
      symbol: s,
      accountCurrency: moneda,
      rates: cursuri,
    });
    const bani_ = (pSold! * pRisc!) / 100;
    const rr = pTinta != null ? riskReward(pIntrare!, pStop!, pTinta) : null;
    const castig = rr != null && loturi != null && vp != null ? pips * rr * vp * loturi : null;
    return { vp, pips, loturi, bani: bani_, rr, castig, nevoie: perecheDeConversie(s, moneda) };
  }, [gata, s, pIntrare, pStop, pTinta, pRisc, pSold, moneda, cursuri]);

  const lipsesteCurs = rezultat != null && rezultat.vp == null;

  return (
    <Ecran titlu="Calculator lot" subtitlu={`Risc în ${moneda}, pe ${s || "—"}`}>
      <Reveal>
        <Card>
          <View style={st.randSimbol}>
            <Camp
              eticheta="Simbol"
              valoare={simbol}
              onChange={(v) => setSimbol(v.toUpperCase())}
              placeholder="EURUSD"
              autoCapitalize="characters"
              style={{ flex: 1 }}
            />
            <Buton
              eticheta="Preț"
              varianta="secundar"
              onPress={aduPretul}
              incarca={aduce}
              style={st.butonPret}
              iconita={<Ionicons name="download-outline" size={15} color={T.ink.i1} />}
            />
          </View>

          <View style={st.doua}>
            <Camp
              eticheta="Intrare"
              valoare={intrare}
              onChange={setIntrare}
              numeric
              placeholder="1.0850"
              style={st.jumatate}
            />
            <Camp
              eticheta="Stop loss"
              valoare={stop}
              onChange={setStop}
              numeric
              placeholder="1.0820"
              style={st.jumatate}
            />
          </View>

          <View style={st.doua}>
            <Camp
              eticheta="Take profit"
              valoare={tinta}
              onChange={setTinta}
              numeric
              placeholder="opțional"
              style={st.jumatate}
            />
            <Camp
              eticheta="Risc"
              valoare={risc}
              onChange={setRisc}
              numeric
              sufix="%"
              style={st.jumatate}
            />
          </View>

          <Camp
            eticheta={`Sold cont (${moneda})`}
            valoare={sold}
            onChange={setSold}
            numeric
            placeholder="10000"
          />

          <View style={st.insigne}>
            <Insigna text={clasificaSimbol(s || "EURUSD")} culoare={T.ink.i3} />
            <Insigna text={`1 pip = ${pipSize(s || "EURUSD")}`} culoare={T.ink.i3} />
          </View>

          {notita ? <Text style={st.notita}>{notita}</Text> : null}
        </Card>
      </Reveal>

      <Sectiune titlu="Rezultatul" />

      <Reveal intarziere={60}>
        <Card culoareMuchie={lipsesteCurs ? "rgba(251,191,36,0.35)" : T.accent.line}>
          {!gata ? (
            <Text style={st.gol}>
              Completează simbolul, intrarea, stopul, riscul și soldul.
            </Text>
          ) : lipsesteCurs ? (
            <View style={st.avertisment}>
              <Ionicons name="warning-outline" size={18} color={T.state.warn} />
              <Text style={st.textAvertisment}>
                Nu pot afla valoarea pipului pentru {s} într-un cont în {moneda}
                {rezultat?.nevoie ? `, fiindcă îmi lipsește cursul ${rezultat.nevoie}` : ""}.
                {"\n\n"}
                Apasă „Preț” — îl aduc automat. Prefer să nu afișez nimic decât o
                cifră inventată pe care ai trimite-o la broker.
              </Text>
            </View>
          ) : (
            <>
              <View style={st.lot}>
                <Text style={st.etichetaLot}>MĂRIMEA POZIȚIEI</Text>
                <View style={st.randLot}>
                  <RollingNumber
                    value={rezultat!.loturi == null ? "—" : numar(rezultat!.loturi, 2)}
                    size={T.fontSize["3xl"]}
                    color={T.ink.i1}
                  />
                  <Text style={st.unitate}>loturi</Text>
                </View>
              </View>

              <View style={st.linie} />

              <Rand cheie="Risc" valoare={bani(-rezultat!.bani, moneda)} culoare={T.pnl.loss} />
              <Rand cheie="Distanța până la stop" valoare={`${numar(rezultat!.pips, 1)} pips`} />
              <Rand
                cheie={`Valoare pip / lot (${moneda})`}
                valoare={rezultat!.vp == null ? "—" : numar(rezultat!.vp, 2)}
              />
              {rezultat!.rr != null ? (
                <Rand
                  cheie="Raport risc/câștig"
                  valoare={`1 : ${numar(rezultat!.rr, 2)}`}
                  culoare={rezultat!.rr >= 2 ? T.pnl.gain : rezultat!.rr < 1 ? T.pnl.loss : T.ink.i1}
                />
              ) : null}
              {rezultat!.castig != null ? (
                <Rand
                  cheie="Câștig la take profit"
                  valoare={bani(rezultat!.castig, moneda)}
                  culoare={tonPnl(rezultat!.castig)}
                />
              ) : null}
            </>
          )}
        </Card>
      </Reveal>

      <Text style={st.subsol}>
        Mărimea contractului e cea standard. Dacă brokerul tău folosește alta —
        se întâmplă la metale, indici și cripto — cifra de aici va fi proporțional
        diferită.
      </Text>
    </Ecran>
  );
}

const st = StyleSheet.create({
  randSimbol: { flexDirection: "row", alignItems: "flex-start", gap: T.spacing.sm },
  butonPret: { marginTop: 21, paddingHorizontal: T.spacing.md },
  doua: { flexDirection: "row", gap: T.spacing.md },
  jumatate: { flex: 1 },
  insigne: { flexDirection: "row", gap: T.spacing.sm, marginTop: T.spacing.xs },
  notita: {
    color: T.state.warn,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: T.spacing.sm,
    lineHeight: 17,
  },
  gol: {
    color: T.ink.i4,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  avertisment: { flexDirection: "row", gap: T.spacing.md, alignItems: "flex-start" },
  textAvertisment: {
    flex: 1,
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  lot: { alignItems: "center", paddingVertical: T.spacing.sm },
  etichetaLot: {
    color: T.ink.i4,
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.wider,
    marginBottom: 6,
  },
  randLot: { flexDirection: "row", alignItems: "baseline", gap: T.spacing.sm },
  unitate: {
    color: T.ink.i3,
    fontSize: T.fontSize.base,
    fontFamily: "Inter_700Bold",
  },
  linie: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.line.l1,
    marginVertical: T.spacing.lg,
  },
  subsol: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: T.spacing.lg,
  },
});
