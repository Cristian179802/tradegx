import * as React from "react";
import { InteractionManager, Pressable, StyleSheet, View } from "react-native";
import { Text } from "../src/ui/Text";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { riskOfRuin } from "@tradegx/core";
import { api } from "../src/lib/api";
import { useCerere } from "../src/lib/useCerere";
import { numar, procent } from "../src/lib/format";
import { Card } from "../src/ui/Card";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { RollingNumber } from "../src/ui/RollingNumber";
import { BaraProgres, Gol, Sectiune } from "../src/ui/parti";
import { T, tonPnl, cifre } from "../src/theme";
import { umple } from "../src/lib/i18n";

// ── Unelte ───────────────────────────────────────────────────────────────────
//
// Trei instrumente care răspund la întrebări de dinainte de intrare:
//   · Puterea valutelor — ce monedă e cumpărată azi și ce monedă e vândută
//   · Riscul de ruină   — cât rezistă contul cu regulile tale
//   · Corelații         — ce poziții sunt de fapt aceeași poziție
//
// CORELAȚIILE SUNT CEA MAI UTILĂ ȘI CEA MAI IGNORATĂ. Cine are long pe EURUSD
// și short pe USDCHF crede că are două poziții; are una, de mărime dublă. De
// aceea matricea nu e ascunsă sub un buton.
//
// RISCUL DE RUINĂ se calculează local, cu funcția din `@tradegx/core` — cinci
// mii de simulări, deci se rulează după ce se termină animația de apăsare, nu
// în mijlocul ei.

const PERECHI = ["EUR/USD", "GBP/USD", "AUD/USD", "NZD/USD", "USD/JPY", "USD/CHF", "USD/CAD"];
const MONEDE = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD"];

const RISCURI = [0.5, 1, 2, 3];
const RATE = [30, 40, 50, 60];
const RAPOARTE = [1, 1.5, 2, 3];

interface Cotatie {
  percent_change?: string;
}

interface Corelatii {
  symbols: string[];
  matrix: (number | null)[][] | null;
  days?: number;
}

export default function Unelte() {
  const c = useCerere<{ putere: { moneda: string; valoare: number }[]; corelatii: Corelatii | null }>(
    async () => {
      const [q, corelatii] = await Promise.all([
        (api.market.cotatii(PERECHI) as Promise<{ quotes: Record<string, Cotatie> }>)
          .then((r) => r.quotes ?? {})
          .catch(() => ({} as Record<string, Cotatie>)),
        (api.market.correlations() as Promise<Corelatii>).catch(() => null),
      ]);

      // Puterea unei monede = media variațiilor perechilor în care apare, cu
      // semn pozitiv dacă e monedă de bază și negativ dacă e de cotare.
      const suma: Record<string, number> = {};
      const cate: Record<string, number> = {};
      for (const p of PERECHI) {
        const pct = Number(q[p]?.percent_change);
        if (!Number.isFinite(pct)) continue;
        const [baza, cotata] = p.split("/");
        if (!baza || !cotata) continue;
        suma[baza] = (suma[baza] ?? 0) + pct; cate[baza] = (cate[baza] ?? 0) + 1;
        suma[cotata] = (suma[cotata] ?? 0) - pct; cate[cotata] = (cate[cotata] ?? 0) + 1;
      }
      const putere = MONEDE.map((m) => ({
        moneda: m,
        valoare: cate[m] ? (suma[m] ?? 0) / cate[m]! : 0,
      })).sort((a, b) => b.valoare - a.valoare);

      return { putere, corelatii };
    },
  );

  const putere = c.date?.putere ?? [];
  const arePutere = putere.some((p) => p.valoare !== 0);
  const corelatii = c.date?.corelatii ?? null;
  const maxPutere = Math.max(...putere.map((p) => Math.abs(p.valoare)), 0.01);

  return (
    <Ecran
      titlu="Unelte"
      subtitlu="Trei întrebări de dinainte de intrare"
      incarca={c.incarca && !c.date}
      scheletRanduri={3}
      reimprospateaza={c.reimprospateaza}
      onReia={c.reia}
      eroare={c.eroare}
    >
      <Sectiune titlu="Puterea valutelor" nota="Media variațiilor zilei, pe perechile majore." />

      {!arePutere ? (
        <Gol
          iconita="cloud-offline-outline"
          titlu="Cotațiile nu răspund"
          text="Fără variațiile zilei nu se poate calcula puterea. Trage în jos ca să reîncerci."
        />
      ) : (
        <Reveal>
          <Card>
            {putere.map((p, i) => (
              <View key={p.moneda} style={[st.randPutere, i > 0 && { marginTop: T.spacing.md }]}>
                <Text style={st.moneda}>{p.moneda}</Text>
                <View style={{ flex: 1 }}>
                  <BaraProgres
                    fractiune={Math.abs(p.valoare) / maxPutere}
                    culoare={p.valoare === 0 ? T.ink.i4 : tonPnl(p.valoare)}
                    inaltime={6}
                  />
                </View>
                <Text style={[st.valoarePutere, cifre, { color: tonPnl(p.valoare) }]}>
                  {p.valoare > 0 ? "+" : p.valoare < 0 ? "−" : ""}
                  {Math.abs(p.valoare).toFixed(2)}%
                </Text>
              </View>
            ))}
            <Text style={st.notaPutere}>
              Cea mai puternică vândută pe cea mai slabă e perechea cu cel mai clar
              sens azi — nu neapărat cea mai bună tranzacție.
            </Text>
          </Card>
        </Reveal>
      )}

      <Sectiune titlu="Risc de ruină" nota="Cât rezistă contul cu regulile tale, pe 200 de tranzacții." />
      <Reveal intarziere={60}>
        <RiscDeRuina />
      </Reveal>

      <Sectiune titlu="Corelații" nota={corelatii?.days ? umple("Pe ultimele {n} zile de tranzacționare.", { n: corelatii.days }) : undefined} />
      {corelatii?.matrix ? (
        <Reveal intarziere={120}>
          <Card faraPadding>
            <Matrice simboluri={corelatii.symbols} matrice={corelatii.matrix} />
          </Card>
          <Text style={st.legenda}>
            Aproape de +1 = se mișcă la fel; aproape de −1 = invers. Două poziții
            corelate peste 0,8 sunt, ca risc, o singură poziție de mărime dublă.
          </Text>
        </Reveal>
      ) : (
        <Gol
          iconita="grid-outline"
          titlu="Corelațiile nu sunt disponibile"
          text="Calculul are nevoie de istoric zilnic pentru toate perechile. Revino mai târziu."
        />
      )}
    </Ecran>
  );
}

function RiscDeRuina() {
  const [risc, setRisc] = React.useState(1);
  const [rata, setRata] = React.useState(50);
  const [rr, setRr] = React.useState(2);
  const [drawdown] = React.useState(30);
  const [rezultat, setRezultat] = React.useState<number | null>(null);
  const [calculeaza, setCalculeaza] = React.useState(false);

  // Se recalculează la fiecare schimbare, dar după cadrul curent: cinci mii de
  // simulări pe firul de JavaScript ar îngheța pastila exact când o apeși.
  React.useEffect(() => {
    setCalculeaza(true);
    const t = InteractionManager.runAfterInteractions(() => {
      setRezultat(
        riskOfRuin({
          winRatePct: rata,
          riskPct: risc,
          rr,
          drawdownPct: drawdown,
          trades: 200,
        }),
      );
      setCalculeaza(false);
    });
    return () => t.cancel();
  }, [risc, rata, rr, drawdown]);

  const periculos = rezultat != null && rezultat >= 20;
  const atentie = rezultat != null && rezultat >= 5 && !periculos;
  const culoare = periculos ? T.pnl.loss : atentie ? T.state.warn : T.pnl.gain;

  return (
    <Card culoareMuchie={periculos ? "rgba(251,113,133,0.40)" : undefined}>
      <View style={st.rezultatRuina}>
        <View>
          <Text style={st.etichetaRuina}>ȘANSA SĂ PIERZI {drawdown}% DIN CONT</Text>
          {rezultat == null || calculeaza ? (
            <Text style={[st.valoareRuina, cifre, { color: T.ink.i4 }]}>…</Text>
          ) : (
            <RollingNumber
              value={procent(rezultat, 1)}
              size={T.fontSize["2xl"]}
              color={culoare}
            />
          )}
        </View>
        <Ionicons
          name={periculos ? "alert-circle" : atentie ? "warning-outline" : "shield-checkmark-outline"}
          size={26}
          color={culoare}
        />
      </View>

      <Text style={st.verdictRuina}>
        {rezultat == null
          ? " "
          : periculos
            ? "Prea mare. Scade riscul pe tranzacție sau crește raportul de câștig."
            : atentie
              ? "Se poate trăi cu ea, dar nu are marjă de eroare."
              : "Sănătos. Regulile astea rezistă la o serie proastă."}
      </Text>

      <Alegere eticheta="Risc pe tranzacție" valori={RISCURI} valoare={risc} onAlege={setRisc} sufix="%" />
      <Alegere eticheta="Rată de câștig" valori={RATE} valoare={rata} onAlege={setRata} sufix="%" />
      <Alegere eticheta="Raport risc/câștig" valori={RAPOARTE} valoare={rr} onAlege={setRr} prefix="1:" />
    </Card>
  );
}

function Alegere({
  eticheta, valori, valoare, onAlege, sufix = "", prefix = "",
}: {
  eticheta: string;
  valori: number[];
  valoare: number;
  onAlege: (v: number) => void;
  sufix?: string;
  prefix?: string;
}) {
  return (
    <View style={{ marginTop: T.spacing.lg }}>
      <Text style={st.etichetaAlegere}>{eticheta}</Text>
      <View style={st.optiuni}>
        {valori.map((v) => {
          const activ = v === valoare;
          return (
            <Pressable
              key={v}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onAlege(v);
              }}
              style={[st.optiune, activ && st.optiuneActiva]}
              accessibilityRole="button"
              accessibilityState={{ selected: activ }}
            >
              <Text style={[st.textOptiune, activ && { color: T.accent.base }]}>
                {prefix}{numar(v, v % 1 === 0 ? 0 : 1)}{sufix}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Matricea de corelație. Culoarea dă semnul, opacitatea dă tăria. */
function Matrice({ simboluri, matrice }: { simboluri: string[]; matrice: (number | null)[][] }) {
  const scurt = (s: string) => s.replace("USD", "").slice(0, 3) || "USD";

  return (
    <View style={st.matrice}>
      <View style={st.randMatrice}>
        <View style={st.celulaEticheta} />
        {simboluri.map((s) => (
          <View key={s} style={st.celula}>
            <Text style={st.textCap}>{scurt(s)}</Text>
          </View>
        ))}
      </View>

      {simboluri.map((linie, i) => (
        <View key={linie} style={st.randMatrice}>
          <View style={st.celulaEticheta}>
            <Text style={st.textCap}>{scurt(linie)}</Text>
          </View>
          {simboluri.map((coloana, j) => {
            const v = matrice[i]?.[j] ?? null;
            const tare = v == null ? 0 : Math.abs(v);
            return (
              <View
                key={coloana}
                style={[
                  st.celula,
                  v != null && {
                    backgroundColor:
                      v >= 0
                        ? `rgba(52,211,153,${(tare * 0.55).toFixed(2)})`
                        : `rgba(251,113,133,${(tare * 0.55).toFixed(2)})`,
                  },
                ]}
              >
                <Text style={[st.textCelula, cifre, i === j && { color: T.ink.i4 }]}>
                  {v == null ? "—" : v.toFixed(2).replace("0.", ".")}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  randPutere: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  moneda: {
    width: 36,
    color: T.ink.i2,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_800ExtraBold",
  },
  valoarePutere: {
    width: 58,
    textAlign: "right",
    fontSize: T.fontSize.xs,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  notaPutere: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    marginTop: T.spacing.lg,
  },
  rezultatRuina: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  etichetaRuina: {
    color: T.ink.i4,
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.wider,
    marginBottom: 6,
  },
  valoareRuina: {
    fontSize: T.fontSize["2xl"],
    fontFamily: "SpaceGrotesk_700Bold",
  },
  verdictRuina: {
    color: T.ink.i3,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: T.spacing.sm,
    minHeight: 18,
  },
  etichetaAlegere: {
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
    minHeight: 36,
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
  matrice: { padding: T.spacing.sm },
  randMatrice: { flexDirection: "row" },
  celulaEticheta: { width: 34, alignItems: "center", justifyContent: "center" },
  celula: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    margin: 0.5,
    borderRadius: 3,
  },
  textCap: {
    color: T.ink.i4,
    fontSize: 8,
    fontFamily: "Inter_800ExtraBold",
  },
  textCelula: {
    color: T.ink.i2,
    fontSize: 8,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  legenda: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    marginTop: T.spacing.md,
  },
});
