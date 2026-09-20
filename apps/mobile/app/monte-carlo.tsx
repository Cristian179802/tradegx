import * as React from "react";
import { InteractionManager, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { monteCarlo, type RezultatMonteCarlo } from "@tradegx/core";
import { api } from "../src/lib/api";
import { useCerere } from "../src/lib/useCerere";
import { numar, procent } from "../src/lib/format";
import { Card } from "../src/ui/Card";
import { Buton } from "../src/ui/Buton";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { Paywall } from "../src/ui/Paywall";
import { Con, Histograma, useLatime } from "../src/ui/grafice";
import { BaraProgres, Gol, Rand, Sectiune } from "../src/ui/parti";
import { RollingNumber } from "../src/ui/RollingNumber";
import { T, cifre, tonPnl } from "../src/theme";

// ── Monte Carlo ──────────────────────────────────────────────────────────────
//
// Reeșantionează randamentele TALE, cu înlocuire, de câteva mii de ori. Nu
// prezice nimic: arată câte dintre viețile alternative ale acelorași tranzacții
// ajung la țintă și câte ard contul înainte.
//
// Bucla stă în `@tradegx/core`, aceeași ca pe web. Cifra „12% șanse de ruină"
// trebuie să fie identică pe telefon și pe desktop; două implementări s-ar fi
// depărtat la prima corectură.
//
// 4000 DE SIMULĂRI, nu 10.000 ca pe web. Diferența dintre ele pe marginile
// afișate e sub o zecime de procent, iar pe un telefon ieftin 10.000 înseamnă
// aproape o secundă de fir de JavaScript blocat — adică animațiile se opresc
// exact când omul apasă butonul.
//
// Calculul pornește DUPĂ ce se termină animația de apăsare
// (`InteractionManager`), altfel butonul se blochează la jumătatea apăsării și
// pare stricat.

const SIMULARI = 4000;

const TRANZACTII = [
  { v: "20", e: "20 tranz." },
  { v: "40", e: "40" },
  { v: "100", e: "100" },
  { v: "250", e: "250" },
] as const;

const TINTE = [
  { v: "5", e: "+5%" },
  { v: "10", e: "+10%" },
  { v: "20", e: "+20%" },
  { v: "50", e: "+50%" },
] as const;

const PIERDERI = [
  { v: "5", e: "−5%" },
  { v: "10", e: "−10%" },
  { v: "20", e: "−20%" },
] as const;

export default function MonteCarlo() {
  const [latime, laMasurare] = useLatime();
  const [tranzactii, setTranzactii] = React.useState<string>("40");
  const [tinta, setTinta] = React.useState<string>("10");
  const [pierdere, setPierdere] = React.useState<string>("10");

  const c = useCerere<{ returns: number[]; count: number }>(
    () => api.analytics.monteCarlo(3650) as Promise<{ returns: number[]; count: number }>,
  );

  const [rezultat, setRezultat] = React.useState<RezultatMonteCarlo | null>(null);
  const [ruleaza, setRuleaza] = React.useState(false);

  const randamente = c.date?.returns ?? [];
  const destule = randamente.length >= 10;

  const ruleazaAcum = React.useCallback(() => {
    if (!destule) return;
    setRuleaza(true);
    // Lăsăm cadrul curent să se deseneze; altfel apăsarea pare înghețată.
    InteractionManager.runAfterInteractions(() => {
      const r = monteCarlo({
        randamente,
        tranzactii: Number(tranzactii),
        simulari: SIMULARI,
        tintaPct: Number(tinta),
        drawdownPct: Number(pierdere),
      });
      setRezultat(r);
      setRuleaza(false);
    });
  }, [destule, randamente, tranzactii, tinta, pierdere]);

  // Parametrii schimbați invalidează rezultatul: cifrele de pe ecran trebuie să
  // corespundă butoanelor apăsate, nu unei rulări de acum două setări.
  React.useEffect(() => { setRezultat(null); }, [tranzactii, tinta, pierdere]);

  if (c.stare === 402) {
    return (
      <Ecran titlu="Monte Carlo" subtitlu="Mii de vieți alternative ale contului">
        <Paywall
          functie="Monte Carlo"
          descriere="Rulează mii de variante ale acelorași tranzacții, în altă ordine, și îți arată în câte dintre ele contul ajunge la țintă — și în câte arde."
          puncte={[
            "Probabilitatea de a atinge ținta și cea de ruină",
            "Conul de echitate: cât de larg e intervalul realist",
            "Drawdown-ul mediu al simulărilor",
            "Pe randamentele tale reale, fără ipoteze despre distribuție",
          ]}
        />
      </Ecran>
    );
  }

  return (
    <Ecran
      titlu="Monte Carlo"
      subtitlu={destule ? `Pe ${randamente.length} randamente reale` : "Mii de vieți alternative"}
      incarca={c.incarca && !c.date}
      scheletRanduri={3}
      reimprospateaza={c.reimprospateaza}
      onReia={c.reia}
      eroare={c.eroare}
    >
      <View onLayout={laMasurare} />

      {!destule ? (
        <Gol
          iconita="dice-outline"
          titlu="Prea puține tranzacții"
          text="Simularea are nevoie de cel puțin zece tranzacții închise. Sub atât, rezultatul ar descrie mai mult norocul decât metoda."
        />
      ) : (
        <>
          <Reveal>
            <Card>
              <Text style={st.eticheta}>Câte tranzacții simulăm</Text>
              <Segment valori={TRANZACTII} valoare={tranzactii} onSchimba={setTranzactii} />

              <Text style={[st.eticheta, st.spatiu]}>Ținta de profit</Text>
              <Segment valori={TINTE} valoare={tinta} onSchimba={setTinta} />

              <Text style={[st.eticheta, st.spatiu]}>Pragul de ruină (drawdown)</Text>
              <Segment valori={PIERDERI} valoare={pierdere} onSchimba={setPierdere} />

              <Buton
                eticheta={rezultat ? "Rulează din nou" : `Rulează ${SIMULARI.toLocaleString("ro-RO")} simulări`}
                onPress={ruleazaAcum}
                incarca={ruleaza}
                plin
                style={{ marginTop: T.spacing.lg }}
                iconita={<Ionicons name="play" size={15} color="#ffffff" />}
              />
            </Card>
          </Reveal>

          {rezultat ? (
            <>
              <Sectiune titlu="Rezultatul" nota={`Din ${SIMULARI.toLocaleString("ro-RO")} vieți alternative ale acelorași tranzacții.`} />

              <Reveal>
                <Card>
                  <Probabilitate
                    eticheta={`Atinge +${tinta}%`}
                    valoare={rezultat.pTinta}
                    culoare={T.pnl.gain}
                  />
                  <Probabilitate
                    eticheta={`Arde −${pierdere}%`}
                    valoare={rezultat.pRuina}
                    culoare={T.pnl.loss}
                    intarziere={90}
                  />
                  <Probabilitate
                    eticheta="Niciuna, nici alta"
                    valoare={rezultat.pNiciuna}
                    culoare={T.ink.i3}
                    intarziere={180}
                  />

                  <View style={st.linie} />
                  <Rand
                    cheie="Drawdown mediu al simulărilor"
                    valoare={procent(rezultat.ddMediu, 1)}
                    culoare={rezultat.ddMediu > Number(pierdere) ? T.pnl.loss : T.ink.i1}
                  />
                </Card>
              </Reveal>

              <Sectiune titlu="Conul" nota="Banda largă = 90% din simulări. Linia = mediana." />
              <Reveal intarziere={60}>
                <Card>
                  <Con con={rezultat.con} latime={latime} inaltime={175} />
                  <View style={st.capete}>
                    <Text style={[st.capat, cifre]}>start 100</Text>
                    <Text style={[st.capat, cifre]}>
                      după {tranzactii} tranz.
                    </Text>
                  </View>
                </Card>
              </Reveal>

              <Sectiune titlu="Unde ajunge contul" nota="Echitate finală, 100 = punctul de plecare." />
              <Reveal intarziere={120}>
                <Card>
                  <Histograma valori={rezultat.finale} latime={latime} inaltime={120} prag={100} />
                  <View style={st.percentile}>
                    {([
                      ["Ghinion (P5)", rezultat.percentile.p5],
                      ["P25", rezultat.percentile.p25],
                      ["Mediana", rezultat.percentile.p50],
                      ["P75", rezultat.percentile.p75],
                      ["Noroc (P95)", rezultat.percentile.p95],
                    ] as const).map(([e, v]) => (
                      <Rand
                        key={e}
                        cheie={e}
                        valoare={`${numar(v - 100, 1)}%`}
                        culoare={tonPnl(v - 100)}
                      />
                    ))}
                  </View>
                </Card>
              </Reveal>

              <Text style={st.avertisment}>
                Simularea presupune că tranzacțiile viitoare seamănă cu cele trecute. E
                deja o ipoteză tare — citește cifrele ca ordine de mărime, nu ca promisiuni.
              </Text>
            </>
          ) : null}
        </>
      )}
    </Ecran>
  );
}

function Probabilitate({
  eticheta, valoare, culoare, intarziere = 0,
}: {
  eticheta: string;
  valoare: number;
  culoare: string;
  intarziere?: number;
}) {
  return (
    <View style={st.prob}>
      <View style={st.probSus}>
        <Text style={st.probEticheta}>{eticheta}</Text>
        <RollingNumber
          value={procent(valoare, 1)}
          size={T.fontSize.lg}
          color={culoare}
          intarziere={intarziere}
        />
      </View>
      <BaraProgres fractiune={valoare / 100} culoare={culoare} inaltime={5} />
    </View>
  );
}

/** Pastile pe un singur rând, fără derulare — sunt cel mult patru. */
function Segment({
  valori, valoare, onSchimba,
}: {
  valori: readonly { v: string; e: string }[];
  valoare: string;
  onSchimba: (v: string) => void;
}) {
  return (
    <View style={st.segment}>
      {valori.map((o) => {
        const activ = o.v === valoare;
        return (
          <Pressable
            key={o.v}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onSchimba(o.v);
            }}
            style={[st.pastila, activ && st.pastilaActiva]}
            accessibilityRole="button"
            accessibilityState={{ selected: activ }}
          >
            <Text style={[st.textPastila, activ && { color: T.accent.base }]} numberOfLines={1}>
              {o.e}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  eticheta: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: T.tracking.wider,
    marginBottom: T.spacing.sm,
  },
  spatiu: { marginTop: T.spacing.lg },
  segment: { flexDirection: "row", gap: 6 },
  pastila: {
    flex: 1,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: T.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    backgroundColor: T.surface.s3,
  },
  pastilaActiva: { backgroundColor: T.accent.soft, borderColor: T.accent.line },
  textPastila: {
    color: T.ink.i3,
    fontSize: T.fontSize.xs,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  prob: { marginBottom: T.spacing.lg },
  probSus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  probEticheta: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
  },
  linie: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.line.l1,
    marginBottom: T.spacing.sm,
  },
  capete: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: T.spacing.sm,
  },
  capat: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  percentile: { marginTop: T.spacing.md },
  avertisment: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: T.spacing.lg,
  },
});
