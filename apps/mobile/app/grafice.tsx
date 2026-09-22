import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { tr } from "../src/lib/i18n";
import { Text } from "../src/ui/Text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { pipSize, positionSize, riskReward, stopPips } from "@tradegx/core";
import { api, ApiError } from "../src/lib/api";
import { useCerere } from "../src/lib/useCerere";
import { bani, numar } from "../src/lib/format";
import { Card } from "../src/ui/Card";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { useLatime } from "../src/ui/grafice";
import {
  GraficInteractiv,
  DESENE_GOALE,
  type Desene,
  type Lumanare,
  type Marcaj,
  type ModGrafic,
} from "../src/ui/GraficInteractiv";
import { Buton } from "../src/ui/Buton";
import { Gol, Insigna, Rand, Sectiune, Segmente } from "../src/ui/parti";
import { T, tonPnl, cifre } from "../src/theme";
import { umple } from "../src/lib/i18n";

// ── Grafice ──────────────────────────────────────────────────────────────────
//
// Lumânările se desenează NATIV, nu într-o pagină web ascunsă. Varianta cu
// browser ar fi fost mai puțin de scris, dar: pornește în două secunde, nu se
// mișcă la atingere ca restul aplicației, și e exact lucrul care face o
// aplicație să pară un site împachetat.
//
// TREI MODURI, nu o bară de unelte cu cincisprezece butoane:
//   · Mișcă — plimbi cu un deget, apropii cu două
//   · Linie — o atingere pune un suport/rezistență acolo unde ai atins
//   · Setup — trei atingeri: intrare, stop, țintă. Restul se calculează.
//
// DESENELE SE ȚIN MINTE, per simbol și interval. O linie trasă pe EURUSD H1 e
// acolo și mâine. Stau pe telefon, nu pe server: sunt notițe, nu date de cont,
// iar o cerere de rețea pentru fiecare linie trasă ar fi absurdă.
//
// SETUP-UL NU E DECOR. Odată ce ai cele trei prețuri, ecranul îți spune RR-ul
// și CÂTE LOTURI ies la riscul tău — cu aceeași funcție din `@tradegx/core`
// care stă în spatele calculatorului. Un grafic pe care desenezi frumos dar
// tot trebuie să deschizi calculatorul ca să afli lotul e jumătate de treabă.

const SIMBOLURI = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSD", "US30", "NAS100"];

const INTERVALE = [
  { v: "15", e: "M15" },
  { v: "60", e: "H1" },
  { v: "240", e: "H4" },
  { v: "D", e: "D1" },
  { v: "W", e: "W1" },
] as const;

const MODURI = [
  { v: "misca" as const, e: "Mișcă" },
  { v: "linie" as const, e: "Linie S/R" },
  { v: "setup" as const, e: "Setup" },
];

const RISCURI = [0.5, 1, 2];

/** Forma pe care o întoarce ruta de analiză. Câmpurile lipsă sunt normale. */
interface Analiza {
  bias?: string;
  confidence?: number;
  summary?: string;
  structure?: string;
  keyLevels?: (string | number)[];
  plan?: string;
  personalNote?: string;
}

interface RaspunsLumanari {
  ok: boolean;
  symbol: string;
  candles: (Lumanare & { v: number })[];
}

const cheieDesene = (simbol: string, interval: string) => `tradegx-desene-${simbol}-${interval}`;

export default function Grafice() {
  const [latime, laMasurare] = useLatime();
  const [simbol, setSimbol] = React.useState("EURUSD");
  const [interval, setInterval_] = React.useState<string>("60");
  const [mod, setMod] = React.useState<ModGrafic>("misca");
  const [risc, setRisc] = React.useState(1);

  // Analiza AI a graficului. Nu se cere automat la deschidere: costă din cota
  // lunară, iar cele mai multe deschideri ale ecranului sunt „arunc un ochi”.
  const [analiza, setAnaliza] = React.useState<Analiza | null>(null);
  const [analizeaza, setAnalizeaza] = React.useState(false);
  const [eroareAI, setEroareAI] = React.useState<string | null>(null);

  // Alt simbol sau alt interval = altă analiză. A lăsa una veche pe ecran ar
  // fi însemnat să citești despre EURUSD H1 uitându-te la aur pe zilnic.
  React.useEffect(() => { setAnaliza(null); setEroareAI(null); }, [simbol, interval]);

  const cereAnaliza = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setAnalizeaza(true);
    setEroareAI(null);
    try {
      const r = (await api.charts.analyze({ symbol: simbol, timeframe: interval })) as {
        analysis: Analiza;
      };
      setAnaliza(r.analysis);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      setEroareAI(
        e instanceof ApiError && e.status === 402
          ? "Analiza graficului e în planul PRO."
          : e instanceof ApiError && e.status === 429
            ? e.message
            : e instanceof ApiError ? e.message : "Analiza nu a pornit.",
      );
    } finally {
      setAnalizeaza(false);
    }
  };

  const c = useCerere<{ lumanari: RaspunsLumanari; marcaje: Marcaj[] }>(
    async () => {
      const lumanari = (await api.charts.candles(simbol, interval)) as RaspunsLumanari;
      const prima = lumanari.candles[0]?.time ?? 0;
      const ultima = lumanari.candles[lumanari.candles.length - 1]?.time ?? 0;
      // Marcajele sunt un bonus: dacă ruta lor cade, graficul rămâne.
      const marcaje = await (api.charts.trades(simbol, prima, ultima) as Promise<{
        trades: Marcaj[];
      }>)
        .then((r) => r.trades)
        .catch(() => [] as Marcaj[]);
      return { lumanari, marcaje };
    },
    [simbol, interval],
  );

  // Soldul contului, o dată — pentru mărimea poziției din setup.
  const cont = useCerere<{ balance: number; currency: string }>(
    () => api.charts.quote("EURUSD", true) as Promise<{ balance: number; currency: string }>,
  );

  /* ── Desenele, salvate per simbol + interval ──────────────────────────── */

  const [desene, setDesene] = React.useState<Desene>(DESENE_GOALE);

  React.useEffect(() => {
    let anulat = false;
    setDesene(DESENE_GOALE);
    AsyncStorage.getItem(cheieDesene(simbol, interval))
      .then((brut) => {
        if (anulat || !brut) return;
        const d = JSON.parse(brut) as Desene;
        setDesene({
          linii: Array.isArray(d?.linii) ? d.linii : [],
          setup: d?.setup ?? null,
        });
      })
      .catch(() => {});
    return () => { anulat = true; };
  }, [simbol, interval]);

  const schimbaDesene = React.useCallback(
    (d: Desene) => {
      setDesene(d);
      AsyncStorage.setItem(cheieDesene(simbol, interval), JSON.stringify(d)).catch(() => {});
    },
    [simbol, interval],
  );

  const stergeUltimul = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (desene.setup) return schimbaDesene({ ...desene, setup: null });
    if (desene.linii.length > 0) {
      return schimbaDesene({ ...desene, linii: desene.linii.slice(0, -1) });
    }
  };

  const stergeTot = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    schimbaDesene(DESENE_GOALE);
  };

  /* ── Date derivate ────────────────────────────────────────────────────── */

  const lumanari = c.date?.lumanari.candles ?? [];
  const marcaje = c.date?.marcaje ?? [];
  const ultima = lumanari[lumanari.length - 1];
  const zec = zecimale(simbol);
  const faraDate = c.stare === 422;
  const areDesene = desene.linii.length > 0 || desene.setup != null;

  const s = desene.setup;
  const rr = s && s.sl != null && s.tp != null ? riskReward(s.entry, s.sl, s.tp) : null;
  const directie = s && s.sl != null ? (s.sl < s.entry ? "BUY" : "SELL") : null;

  const sold = cont.date?.balance ?? null;
  const moneda = cont.date?.currency ?? "USD";

  const loturi =
    s && s.sl != null && sold != null
      ? positionSize({
          balance: sold,
          riskPct: risc,
          entryPrice: s.entry,
          stopLoss: s.sl,
          symbol: simbol,
          accountCurrency: moneda,
        })
      : null;

  const pipsStop = s && s.sl != null ? stopPips(s.entry, s.sl, simbol) : null;
  const riscBani = sold != null ? (sold * risc) / 100 : null;
  const castig = riscBani != null && rr != null ? riscBani * rr : null;

  return (
    <Ecran
      titlu="Grafice"
      subtitlu={ultima ? `${simbol} · ${numar(ultima.close, zec)}` : simbol}
      incarca={c.incarca && lumanari.length === 0 && !faraDate}
      scheletRanduri={3}
      reimprospateaza={c.reimprospateaza}
      onReia={c.reia}
      eroare={faraDate ? null : c.eroare}
    >
      <View onLayout={laMasurare} />

      <View style={st.simboluri}>
        {SIMBOLURI.map((x) => {
          const activ = x === simbol;
          return (
            <Pressable
              key={x}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setSimbol(x);
              }}
              style={[st.pastilaSimbol, activ && st.pastilaActiva]}
              accessibilityRole="button"
              accessibilityState={{ selected: activ }}
            >
              <Text style={[st.textSimbol, activ && { color: T.accent.base }]}>{x}</Text>
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
                <Text style={[st.pret, cifre]}>{numar(ultima!.close, zec)}</Text>
                {marcaje.length > 0 ? (
                  <Insigna
                    text={umple(marcaje.length === 1 ? "{n} tranzacție" : "{n} tranzacții", { n: marcaje.length })}
                    culoare={T.accent.base}
                    fundal={T.accent.soft}
                  />
                ) : null}
              </View>

              <View style={st.zonaGrafic}>
                <GraficInteractiv
                  date={lumanari}
                  latime={Math.max(0, latime - T.spacing.lg * 2)}
                  inaltime={300}
                  marcaje={marcaje}
                  zecimale={zec}
                  mod={mod}
                  desene={desene}
                  onDesene={schimbaDesene}
                />
              </View>

              <Text style={st.indiciu}>
                {mod === "misca"
                  ? "Trage cu un deget · apropie cu două"
                  : mod === "linie"
                    ? "Atinge graficul ca să pui o linie la prețul ăla"
                    : !s
                      ? "Atinge unde intri"
                      : s.sl == null
                        ? "Acum atinge unde pui stopul"
                        : s.tp == null
                          ? "Acum atinge ținta"
                          : "Setup complet. O atingere nouă începe altul."}
              </Text>
            </Card>
          </Reveal>

          {/* ── Uneltele ── */}
          <View style={st.unelte}>
            <Segmente valori={MODURI} valoare={mod} onSchimba={setMod} eticheta="Unealtă" style={st.segmenteUnelte} />
            {areDesene ? (
              <View style={st.butoaneSterg}>
                <Pressable onPress={stergeUltimul} style={st.butonSterg} accessibilityRole="button" accessibilityLabel={tr("Șterge ultimul desen")}>
                  <Ionicons name="arrow-undo-outline" size={15} color={T.ink.i3} />
                </Pressable>
                <Pressable onPress={stergeTot} style={st.butonSterg} accessibilityRole="button" accessibilityLabel={tr("Șterge toate desenele")}>
                  <Ionicons name="trash-outline" size={15} color={T.pnl.loss} />
                </Pressable>
              </View>
            ) : null}
          </View>

          {/* ── Ce vede AI-ul ── */}
          <Sectiune titlu="Analiza AI" nota="Citește structura de pe intervalul afișat." />
          <Reveal>
            <Card culoareMuchie={analiza ? T.accent.line : undefined}>
              {analiza ? (
                <>
                  <View style={st.antetAnaliza}>
                    {analiza.bias ? (
                      <Insigna
                        text={analiza.bias}
                        culoare={
                          analiza.bias === "BULLISH" ? T.pnl.gain
                          : analiza.bias === "BEARISH" ? T.pnl.loss
                          : T.ink.i3
                        }
                        fundal={
                          analiza.bias === "BULLISH" ? "rgba(52,211,153,0.12)"
                          : analiza.bias === "BEARISH" ? "rgba(251,113,133,0.12)"
                          : T.surface.s4
                        }
                      />
                    ) : null}
                    {analiza.confidence != null ? (
                      <Text style={[st.incredere, cifre]}>{analiza.confidence}% încredere</Text>
                    ) : null}
                  </View>

                  {analiza.summary ? <Text style={st.textAnaliza}>{analiza.summary}</Text> : null}
                  {analiza.structure ? (
                    <BlocAnaliza titlu="Structura" text={analiza.structure} />
                  ) : null}
                  {analiza.plan ? <BlocAnaliza titlu="Plan" text={analiza.plan} /> : null}
                  {analiza.personalNote ? (
                    <BlocAnaliza titlu="Despre tine" text={analiza.personalNote} />
                  ) : null}

                  {analiza.keyLevels && analiza.keyLevels.length > 0 ? (
                    <View style={st.niveluri}>
                      {analiza.keyLevels.slice(0, 6).map((n, i) => (
                        <Text key={i} style={[st.nivel, cifre]}>{String(n)}</Text>
                      ))}
                    </View>
                  ) : null}
                </>
              ) : (
                <Text style={st.faraAnaliza}>
                  Analiza citește structura, nivelurile și lichiditatea de pe intervalul
                  afișat, apoi o compară cu cum tranzacționezi TU.
                </Text>
              )}

              {eroareAI ? <Text style={st.eroareAI}>{eroareAI}</Text> : null}

              <Buton
                eticheta={analiza ? "Reanalizează" : "Analizează graficul"}
                varianta="secundar"
                onPress={cereAnaliza}
                incarca={analizeaza}
                plin
                style={{ marginTop: T.spacing.md }}
                iconita={<Ionicons name="sparkles-outline" size={15} color={T.ink.i1} />}
              />
            </Card>
          </Reveal>

          {/* ── Setup-ul, calculat ── */}
          {s ? (
            <Reveal>
              <Card
                culoareMuchie={
                  rr == null ? T.accent.line : rr >= 2 ? "rgba(52,211,153,0.35)" : rr < 1 ? "rgba(251,113,133,0.35)" : undefined
                }
              >
                <View style={st.antetSetup}>
                  <Text style={st.titluSetup}>Setup</Text>
                  {directie ? (
                    <Insigna
                      text={directie === "BUY" ? "Cumpărare" : "Vânzare"}
                      culoare={directie === "BUY" ? T.pnl.gain : T.pnl.loss}
                      fundal={directie === "BUY" ? "rgba(52,211,153,0.12)" : "rgba(251,113,133,0.12)"}
                    />
                  ) : null}
                  {rr != null ? (
                    <Text style={[st.rr, cifre, { color: rr >= 2 ? T.pnl.gain : rr < 1 ? T.pnl.loss : T.ink.i1 }]}>
                      1 : {numar(rr, 2)}
                    </Text>
                  ) : null}
                </View>

                <Rand cheie="Intrare" valoare={numar(s.entry, zec)} />
                <Rand
                  cheie="Stop loss"
                  valoare={s.sl == null ? "atinge graficul" : numar(s.sl, zec)}
                  culoare={s.sl == null ? T.ink.i4 : T.pnl.loss}
                />
                <Rand
                  cheie="Take profit"
                  valoare={s.tp == null ? "atinge graficul" : numar(s.tp, zec)}
                  culoare={s.tp == null ? T.ink.i4 : T.pnl.gain}
                />
                {pipsStop != null ? (
                  <Rand cheie="Distanța până la stop" valoare={`${numar(pipsStop, 1)} pips`} />
                ) : null}

                {s.sl != null ? (
                  <>
                    <View style={st.linie} />

                    <Text style={st.etichetaRisc}>RISC PE TRANZACȚIE</Text>
                    <View style={st.riscuri}>
                      {RISCURI.map((r) => {
                        const activ = r === risc;
                        return (
                          <Pressable
                            key={r}
                            onPress={() => {
                              Haptics.selectionAsync().catch(() => {});
                              setRisc(r);
                            }}
                            style={[st.pastilaRisc, activ && st.pastilaActiva]}
                            accessibilityRole="button"
                            accessibilityState={{ selected: activ }}
                          >
                            <Text style={[st.textRisc, activ && { color: T.accent.base }]}>{r}%</Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {sold == null ? (
                      <Text style={st.faraSold}>
                        N-am putut afla soldul contului, deci nu calculez lotul. Trage în jos
                        ca să reîncerc.
                      </Text>
                    ) : loturi == null ? (
                      <Text style={st.faraSold}>
                        Nu pot afla valoarea pipului pentru {simbol} într-un cont în {moneda}.
                        Prefer să nu arăt o cifră inventată — deschide Calculatorul, acolo
                        aduce singur cursul lipsă.
                      </Text>
                    ) : (
                      <>
                        <Rand
                          cheie="Mărimea poziției"
                          valoare={`${numar(loturi, 2)} loturi`}
                          culoare={T.ink.i1}
                        />
                        <Rand
                          cheie="Risc"
                          valoare={bani(-(riscBani ?? 0), moneda)}
                          culoare={T.pnl.loss}
                        />
                        {castig != null ? (
                          <Rand
                            cheie="Câștig la țintă"
                            valoare={bani(castig, moneda)}
                            culoare={tonPnl(castig)}
                          />
                        ) : null}
                      </>
                    )}
                  </>
                ) : null}
              </Card>
            </Reveal>
          ) : null}

          {desene.linii.length > 0 ? (
            <>
              <Sectiune titlu="Niveluri marcate" nota="Rămân aici și mâine, pe simbolul și intervalul ăsta." />
              <Card faraPadding>
                {[...desene.linii]
                  .map((p, i) => ({ p, i }))
                  .sort((a, b) => b.p - a.p)
                  .map(({ p, i }, k) => (
                    <View key={`${p}-${i}`} style={[st.randLinie, k > 0 && st.cuLinie]}>
                      <View style={st.punctLinie} />
                      <Text style={[st.pretLinie, cifre]}>{numar(p, zec)}</Text>
                      <Text style={st.distanta}>
                        {ultima
                          ? `${p > ultima.close ? "+" : "−"}${numar(Math.abs(p - ultima.close) / pipSize(simbol), 1)} pips`
                          : ""}
                      </Text>
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          schimbaDesene({
                            ...desene,
                            linii: desene.linii.filter((_, j) => j !== i),
                          });
                        }}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={umple("Șterge nivelul {p1}", { p1: numar(p, zec) })}
                      >
                        <Ionicons name="close" size={15} color={T.ink.i4} />
                      </Pressable>
                    </View>
                  ))}
              </Card>
            </>
          ) : null}

          <Reveal intarziere={60} style={{ marginTop: T.spacing.md }}>
            <Card>
              <Rand cheie="Maxim în fereastră" valoare={numar(Math.max(...lumanari.map((x) => x.high)), zec)} />
              <Rand cheie="Minim în fereastră" valoare={numar(Math.min(...lumanari.map((x) => x.low)), zec)} />
              <Rand cheie="Ultima cotație" valoare={numar(ultima!.close, zec)} />
              <Rand cheie="Lumânări încărcate" valoare={numar(lumanari.length, 0)} />
            </Card>
          </Reveal>
        </>
      )}
    </Ecran>
  );
}

function BlocAnaliza({ titlu, text }: { titlu: string; text: string }) {
  return (
    <View style={{ marginTop: T.spacing.md }}>
      <Text style={st.titluBloc}>{titlu.toUpperCase()}</Text>
      <Text style={st.textAnaliza}>{text}</Text>
    </View>
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
  simboluri: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingTop: T.spacing.sm },
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
    fontFamily: "Inter_700Bold",
  },
  antetGrafic: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.lg,
  },
  pret: {
    color: T.ink.i1,
    fontSize: T.fontSize.xl,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  zonaGrafic: { paddingHorizontal: T.spacing.lg, paddingTop: T.spacing.md },
  indiciu: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.sm,
    paddingBottom: T.spacing.lg,
  },
  unelte: { flexDirection: "row", alignItems: "center", gap: T.spacing.sm },
  segmenteUnelte: { paddingRight: 0, flexGrow: 1 },
  butoaneSterg: { flexDirection: "row", gap: 6 },
  butonSterg: {
    width: 34,
    height: 34,
    borderRadius: T.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface.s3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
  },
  antetSetup: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.sm,
    marginBottom: T.spacing.sm,
  },
  titluSetup: {
    flex: 1,
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.tight,
  },
  rr: {
    fontSize: T.fontSize.base,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  linie: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.line.l1,
    marginVertical: T.spacing.md,
  },
  etichetaRisc: {
    color: T.ink.i4,
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.wider,
    marginBottom: 6,
  },
  riscuri: { flexDirection: "row", gap: 6, marginBottom: T.spacing.md },
  pastilaRisc: {
    flex: 1,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: T.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    backgroundColor: T.surface.s3,
  },
  textRisc: {
    color: T.ink.i3,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_700Bold",
  },
  faraSold: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  randLinie: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.md,
    paddingHorizontal: T.spacing.lg,
    paddingVertical: T.spacing.md,
  },
  cuLinie: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: T.line.l1 },
  punctLinie: { width: 6, height: 6, borderRadius: 3, backgroundColor: T.state.warn },
  pretLinie: {
    flex: 1,
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  distanta: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
  antetAnaliza: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: T.spacing.sm,
  },
  incredere: {
    color: T.ink.i3,
    fontSize: T.fontSize.xs,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  titluBloc: {
    color: T.ink.i4,
    fontSize: 9,
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.wider,
    marginBottom: 3,
  },
  textAnaliza: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  faraAnaliza: {
    color: T.ink.i4,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  niveluri: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: T.spacing.md },
  nivel: {
    color: T.state.warn,
    fontSize: T.fontSize.xs,
    fontFamily: "SpaceGrotesk_500Medium",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: T.radius.sm,
    backgroundColor: "rgba(251,191,36,0.10)",
  },
  eroareAI: {
    color: T.state.warn,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    marginTop: T.spacing.md,
  },
});
