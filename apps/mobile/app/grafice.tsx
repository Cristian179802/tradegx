import * as React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api } from "../src/lib/api";
import { useCerere } from "../src/lib/useCerere";
import { bani, numar } from "../src/lib/format";
import { Card } from "../src/ui/Card";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { Lumanari, useLatime, type Lumanare, type MarcajTranzactie } from "../src/ui/grafice";
import { Gol, Insigna, Rand, Sectiune, Segmente } from "../src/ui/parti";
import { T, tonPnl, cifre } from "../src/theme";

// ── Grafice ──────────────────────────────────────────────────────────────────
//
// Lumânările se desenează NATIV, nu într-o pagină web ascunsă. Varianta cu
// browser ar fi fost mai puțin de scris, dar: pornește în două secunde, nu se
// mișcă la atingere ca restul aplicației, și e exact lucrul care face o
// aplicație să pară un site împachetat. Trei sute de dreptunghiuri desenate
// direct sunt mai rapide decât un motor de randare întreg.
//
// TRANZACȚIILE TALE STAU PESTE LUMÂNĂRI. Asta e diferența dintre graficul
// ăsta și oricare altul de pe telefon: aici vezi unde AI INTRAT tu, nu doar
// unde a fost prețul.
//
// Simbolurile se aleg din listă, nu se tastează. Pe telefon, un câmp liber
// pentru simbol înseamnă „EURSUD" la a treia încercare; lista e scurtă și
// acoperă ce tranzacționează aproape toată lumea.

const SIMBOLURI = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSD", "US30", "NAS100"];

const INTERVALE = [
  { v: "15", e: "M15" },
  { v: "60", e: "H1" },
  { v: "240", e: "H4" },
  { v: "D", e: "D1" },
  { v: "W", e: "W1" },
] as const;

interface RaspunsLumanari {
  ok: boolean;
  symbol: string;
  candles: (Lumanare & { v: number })[];
}

export default function Grafice() {
  const [latime, laMasurare] = useLatime();
  const [simbol, setSimbol] = React.useState("EURUSD");
  const [interval, setInterval_] = React.useState<string>("60");

  const c = useCerere<{ lumanari: RaspunsLumanari; marcaje: MarcajTranzactie[] }>(
    async () => {
      const lumanari = (await api.charts.candles(simbol, interval)) as RaspunsLumanari;
      const prima = lumanari.candles[0]?.time ?? 0;
      const ultima = lumanari.candles[lumanari.candles.length - 1]?.time ?? 0;
      // Marcajele sunt un bonus: dacă ruta lor cade, graficul rămâne.
      const marcaje = await (api.charts.trades(simbol, prima, ultima) as Promise<{
        trades: MarcajTranzactie[];
      }>)
        .then((r) => r.trades)
        .catch(() => [] as MarcajTranzactie[]);
      return { lumanari, marcaje };
    },
    [simbol, interval],
  );

  const lumanari = c.date?.lumanari.candles ?? [];
  const marcaje = c.date?.marcaje ?? [];

  const ultima = lumanari[lumanari.length - 1];
  const prima = lumanari[0];
  const variatie =
    ultima && prima && prima.open > 0 ? ((ultima.close - prima.open) / prima.open) * 100 : null;

  const faraDate = c.stare === 422;

  return (
    <Ecran
      titlu="Grafice"
      subtitlu={ultima ? `${simbol} · ${numar(ultima.close, zecimale(simbol))}` : simbol}
      incarca={c.incarca && lumanari.length === 0 && !faraDate}
      scheletRanduri={3}
      reimprospateaza={c.reimprospateaza}
      onReia={c.reia}
      eroare={faraDate ? null : c.eroare}
    >
      <View onLayout={laMasurare} />

      <View style={st.simboluri}>
        {SIMBOLURI.map((s) => {
          const activ = s === simbol;
          return (
            <Pressable
              key={s}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setSimbol(s);
              }}
              style={[st.pastilaSimbol, activ && st.pastilaActiva]}
              accessibilityRole="button"
              accessibilityState={{ selected: activ }}
            >
              <Text style={[st.textSimbol, activ && { color: T.accent.base }]}>{s}</Text>
            </Pressable>
          );
        })}
      </View>

      <Segmente valori={INTERVALE} valoare={interval} onSchimba={setInterval_} eticheta="Interval" />

      {faraDate ? (
        <Gol
          iconita="cloud-offline-outline"
          titlu="Fără date pentru simbolul ăsta"
          text="Furnizorul de cotații n-are istoric pentru combinația asta de simbol și interval. Încearcă alt interval."
        />
      ) : lumanari.length === 0 ? null : (
        <>
          <Reveal>
            <Card faraPadding>
              <View style={st.antetGrafic}>
                <View>
                  <Text style={[st.pret, cifre]}>{numar(ultima!.close, zecimale(simbol))}</Text>
                  {variatie != null ? (
                    <Text style={[st.variatie, { color: tonPnl(variatie) }]}>
                      {variatie > 0 ? "+" : variatie < 0 ? "−" : ""}
                      {Math.abs(variatie).toFixed(2)}% pe fereastra afișată
                    </Text>
                  ) : null}
                </View>
                {marcaje.length > 0 ? (
                  <Insigna
                    text={`${marcaje.length} ${marcaje.length === 1 ? "tranzacție" : "tranzacții"}`}
                    culoare={T.accent.base}
                    fundal={T.accent.soft}
                  />
                ) : null}
              </View>

              <View style={st.zonaGrafic}>
                <Lumanari
                  date={lumanari}
                  latime={latime - T.spacing.lg * 2}
                  inaltime={280}
                  marcaje={marcaje}
                />
              </View>

              <View style={st.subGrafic}>
                <Text style={st.capat}>{lumanari.length} lumânări</Text>
                <Text style={st.capat}>
                  {new Date((prima?.time ?? 0) * 1000).toLocaleDateString("ro-RO", {
                    day: "numeric",
                    month: "short",
                  })}
                  {" → "}
                  {new Date((ultima?.time ?? 0) * 1000).toLocaleDateString("ro-RO", {
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
              </View>
            </Card>
          </Reveal>

          <Reveal intarziere={60} style={{ marginTop: T.spacing.md }}>
            <Card>
              <Rand cheie="Deschidere fereastră" valoare={numar(prima!.open, zecimale(simbol))} />
              <Rand cheie="Maxim" valoare={numar(Math.max(...lumanari.map((x) => x.high)), zecimale(simbol))} />
              <Rand cheie="Minim" valoare={numar(Math.min(...lumanari.map((x) => x.low)), zecimale(simbol))} />
              <Rand cheie="Ultima cotație" valoare={numar(ultima!.close, zecimale(simbol))} />
            </Card>
          </Reveal>

          {marcaje.length > 0 ? (
            <>
              <Sectiune titlu="Tranzacțiile tale aici" nota="Liniile punctate de pe grafic sunt intrările." />
              <Card faraPadding>
                {marcaje.slice(0, 20).map((t, i) => (
                  <View key={t.id} style={[st.randTranz, i > 0 && st.cuLinie]}>
                    <Ionicons
                      name={t.direction === "BUY" ? "arrow-up" : "arrow-down"}
                      size={13}
                      color={t.direction === "BUY" ? T.pnl.gain : T.pnl.loss}
                    />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={st.dataTranz}>
                        {new Date(t.entryTime * 1000).toLocaleString("ro-RO", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      <Text style={st.metaTranz}>
                        intrare {numar(t.entryPrice, zecimale(simbol))}
                        {t.exitPrice != null ? ` → ${numar(t.exitPrice, zecimale(simbol))}` : " · deschisă"}
                      </Text>
                    </View>
                    <Text style={[st.pnlTranz, cifre, { color: tonPnl(t.pnl) }]}>
                      {t.pnl == null ? "—" : bani(t.pnl, "")}
                    </Text>
                  </View>
                ))}
              </Card>
            </>
          ) : null}
        </>
      )}
    </Ecran>
  );
}

/** Câte zecimale are sens să arătăm pentru simbolul ăsta. */
function zecimale(simbol: string): number {
  const s = simbol.toUpperCase();
  if (s.includes("JPY")) return 3;
  if (s.startsWith("XAU") || s.startsWith("BTC") || s.startsWith("ETH")) return 2;
  if (/^(US30|NAS100|SP500|US500|GER40|UK100)/.test(s)) return 1;
  return 5;
}

const st = StyleSheet.create({
  simboluri: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: T.spacing.sm,
  },
  pastilaSimbol: {
    minHeight: 32,
    paddingHorizontal: T.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: T.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    backgroundColor: T.surface.s2,
  },
  pastilaActiva: { backgroundColor: T.accent.soft, borderColor: T.accent.line },
  textSimbol: {
    color: T.ink.i3,
    fontSize: T.fontSize.xs,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  antetGrafic: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.lg,
  },
  pret: {
    color: T.ink.i1,
    fontSize: T.fontSize.xl,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  variatie: {
    fontSize: T.fontSize.xs,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginTop: 3,
  },
  zonaGrafic: { paddingHorizontal: T.spacing.lg, paddingTop: T.spacing.md },
  subGrafic: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: T.spacing.lg,
    paddingBottom: T.spacing.lg,
    paddingTop: T.spacing.sm,
  },
  capat: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
  randTranz: {
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
});
