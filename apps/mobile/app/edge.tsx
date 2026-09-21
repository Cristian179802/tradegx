import * as React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../src/lib/api";
import { useRouter } from "expo-router";
import { useCerere } from "../src/lib/useCerere";
import { bani, numar, procent } from "../src/lib/format";
import { Card } from "../src/ui/Card";
import { Buton } from "../src/ui/Buton";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { Paywall } from "../src/ui/Paywall";
import { BaraProgres, Gol, Insigna, Segmente, Sectiune } from "../src/ui/parti";
import { T, cifre, tonPnl } from "../src/theme";

// ── Edge Finder ──────────────────────────────────────────────────────────────
//
// Taie istoricul pe fiecare dimensiune (simbol, direcție, setup, sesiune, zi,
// oră, durată, tag) și arată unde CHIAR faci bani și unde pierzi constant.
//
// SCORUL, nu profitul, dă ordinea. Un setup cu +900 din șase tranzacții e
// zgomot; unul cu +400 din optzeci e un tipar. Scorul e expectancy ponderată cu
// mărimea eșantionului, exact ca pe web — de aceea prima linie din listă nu e
// mereu cea cu suma cea mai mare, și e bine că nu e.
//
// SCURGERILE stau la fel de sus ca avantajele. Un jurnal care arată doar ce
// merge bine e o felicitare, nu un instrument.

interface Statistica {
  dimension: string;
  dimensionLabel: string;
  value: string;
  n: number;
  wins: number;
  winRate: number;
  netPnl: number;
  avgPnl: number;
  profitFactor: number | null;
  score: number;
}

interface Raport {
  totalTrades: number;
  edges: Statistica[];
  leaks: Statistica[];
  byDimension: Record<string, Statistica[]>;
}

const PERIOADE = [
  { v: "90", e: "3 luni" },
  { v: "180", e: "6 luni" },
  { v: "365", e: "1 an" },
  { v: "3650", e: "Tot" },
] as const;

export default function EdgeFinder() {
  const router = useRouter();
  const [zile, setZile] = React.useState<(typeof PERIOADE)[number]["v"]>("365");
  const [dimensiune, setDimensiune] = React.useState<string | null>(null);

  const c = useCerere<Raport>(
    () => api.analytics.edge(Number(zile)) as Promise<Raport>,
    [zile],
  );
  const r = c.date;

  const dimensiuni = React.useMemo(() => {
    const d = r?.byDimension ?? {};
    return Object.keys(d).filter((k) => (d[k]?.length ?? 0) > 0);
  }, [r?.byDimension]);

  // Prima dimensiune devine implicită de îndată ce știm care sunt.
  React.useEffect(() => {
    if (dimensiune == null && dimensiuni.length > 0) setDimensiune(dimensiuni[0]!);
  }, [dimensiuni, dimensiune]);

  const alese = dimensiune ? (r?.byDimension?.[dimensiune] ?? []) : [];
  const eticheteDimensiuni = React.useMemo(
    () =>
      dimensiuni.map((k) => ({
        v: k,
        e: r?.byDimension?.[k]?.[0]?.dimensionLabel ?? k,
      })),
    [dimensiuni, r?.byDimension],
  );

  if (c.stare === 402) {
    return (
      <Ecran titlu="Edge Finder" subtitlu="Unde ai avantaj, unde pierzi">
        <Paywall
          functie="Edge Finder"
          descriere="Îți taie istoricul pe opt dimensiuni și îți spune care combinații chiar produc bani — și care îi scurg."
          puncte={[
            "Avantajele tale, ordonate după robustețe, nu după noroc",
            "Scurgerile — tiparele care te costă constant",
            "Defalcare pe simbol, setup, sesiune, zi, oră și durată",
            "Eșantion minim de 5 tranzacții, ca să nu tragi concluzii din trei",
          ]}
        />
      </Ecran>
    );
  }

  return (
    <Ecran
      titlu="Edge Finder"
      subtitlu={r ? `${r.totalTrades} tranzacții analizate` : "Unde ai avantaj, unde pierzi"}
      incarca={c.incarca && !r}
      scheletRanduri={4}
      reimprospateaza={c.reimprospateaza}
      onReia={c.reia}
      eroare={c.eroare}
    >
      <Segmente valori={PERIOADE} valoare={zile} onSchimba={setZile} eticheta="Perioadă" />

      {r && r.edges.length === 0 && r.leaks.length === 0 ? (
        <Gol
          iconita="locate-outline"
          titlu="Prea puține date"
          text="Ca să spun „pierzi constant pe EURUSD dimineața”, am nevoie de cel puțin cinci tranzacții pe fiecare tipar. Sub atât aș descrie norocul, nu metoda."
          actiune={
            <Buton
              eticheta="Adaugă o tranzacție"
              onPress={() => router.push("/(tabs)/adauga")}
              iconita={<Ionicons name="add" size={16} color="#ffffff" />}
            />
          }
        />
      ) : null}

      {r && r.edges.length > 0 ? (
        <>
          <Sectiune titlu="Avantajele tale" nota="Ordonate după robustețe, nu după suma cea mai mare." />
          {r.edges.map((x, i) => (
            <Reveal key={`e-${x.dimension}-${x.value}`} intarziere={i * 50} style={{ marginBottom: T.spacing.sm }}>
              <CardTipar s={x} bun />
            </Reveal>
          ))}
        </>
      ) : null}

      {r && r.leaks.length > 0 ? (
        <>
          <Sectiune titlu="Scurgeri" nota="Tiparele care te costă. Astea se opresc, nu se optimizează." />
          {r.leaks.map((x, i) => (
            <Reveal key={`l-${x.dimension}-${x.value}`} intarziere={i * 50} style={{ marginBottom: T.spacing.sm }}>
              <CardTipar s={x} bun={false} />
            </Reveal>
          ))}
        </>
      ) : null}

      {eticheteDimensiuni.length > 0 && dimensiune ? (
        <>
          <Sectiune titlu="Toate defalcările" />
          <Segmente
            valori={eticheteDimensiuni}
            valoare={dimensiune}
            onSchimba={setDimensiune}
            eticheta="Dimensiune"
          />
          <Card faraPadding>
            {alese.map((x, i) => (
              <View key={`${x.dimension}-${x.value}`} style={[st.rand, i > 0 && st.cuLinie]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={st.valoare} numberOfLines={1}>{x.value}</Text>
                  <Text style={st.meta}>
                    {x.n} tranz. · {procent(x.winRate)} · PF{" "}
                    {x.profitFactor == null ? "∞" : numar(x.profitFactor, 2)}
                  </Text>
                </View>
                <Text style={[st.pnl, cifre, { color: tonPnl(x.netPnl) }]}>
                  {bani(x.netPnl, "")}
                </Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </Ecran>
  );
}

function CardTipar({ s, bun }: { s: Statistica; bun: boolean }) {
  const culoare = bun ? T.pnl.gain : T.pnl.loss;
  return (
    <Card culoareMuchie={bun ? "rgba(52,211,153,0.30)" : "rgba(251,113,133,0.30)"}>
      <View style={st.antet}>
        <Ionicons
          name={bun ? "trending-up" : "trending-down"}
          size={16}
          color={culoare}
        />
        <Text style={st.valoare} numberOfLines={1}>{s.value}</Text>
        <Insigna text={s.dimensionLabel} culoare={T.ink.i3} />
      </View>

      <View style={st.cifre}>
        <View style={st.cifra}>
          <Text style={st.etichetaCifra}>NET</Text>
          <Text style={[st.valoareCifra, cifre, { color: tonPnl(s.netPnl) }]}>
            {bani(s.netPnl, "")}
          </Text>
        </View>
        <View style={st.cifra}>
          <Text style={st.etichetaCifra}>PER TRANZ.</Text>
          <Text style={[st.valoareCifra, cifre, { color: tonPnl(s.avgPnl) }]}>
            {bani(s.avgPnl, "")}
          </Text>
        </View>
        <View style={st.cifra}>
          <Text style={st.etichetaCifra}>RATĂ</Text>
          <Text style={[st.valoareCifra, cifre]}>{procent(s.winRate, 0)}</Text>
        </View>
        <View style={st.cifra}>
          <Text style={st.etichetaCifra}>EȘANTION</Text>
          <Text style={[st.valoareCifra, cifre]}>{s.n}</Text>
        </View>
      </View>

      <BaraProgres
        fractiune={Math.min(1, s.winRate / 100)}
        culoare={culoare}
        inaltime={4}
        style={{ marginTop: T.spacing.md }}
      />
    </Card>
  );
}

const st = StyleSheet.create({
  antet: { flexDirection: "row", alignItems: "center", gap: T.spacing.sm },
  valoare: {
    flex: 1,
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.tight,
  },
  cifre: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: T.spacing.md,
    marginTop: T.spacing.lg,
  },
  cifra: { width: "50%" },
  etichetaCifra: {
    color: T.ink.i4,
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.wider,
  },
  valoareCifra: {
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontFamily: "SpaceGrotesk_700Bold",
    marginTop: 3,
  },
  rand: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.md,
    paddingHorizontal: T.spacing.lg,
    paddingVertical: T.spacing.md,
  },
  cuLinie: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.line.l1,
  },
  meta: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
  },
  pnl: {
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_800ExtraBold",
  },
});
