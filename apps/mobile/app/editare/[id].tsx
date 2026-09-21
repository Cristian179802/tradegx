import * as React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { riskReward } from "@tradegx/core";
import { api, ApiError } from "../../src/lib/api";
import { useCerere } from "../../src/lib/useCerere";
import { dataScurta, numar } from "../../src/lib/format";
import { Card } from "../../src/ui/Card";
import { Camp } from "../../src/ui/Camp";
import { Buton } from "../../src/ui/Buton";
import { Reveal } from "../../src/ui/Reveal";
import { Ecran } from "../../src/ui/Ecran";
import { Gol, Insigna, Rand, Sectiune } from "../../src/ui/parti";
import { T, tonPnl } from "../../src/theme";

// ── Corectarea unei tranzacții ───────────────────────────────────────────────
//
// Până acum jurnalul era imposibil de corectat: puteai adăuga, nu puteai
// repara. O cifră greșită la lot rămânea acolo și strica toate statisticile
// construite peste ea — rată de câștig, profit factor, drawdown.
//
// DE CE NU REFOLOSEȘTE FORMULARUL DE ADĂUGARE. Par același lucru, dar nu sunt:
// la adăugare momentul e ACUM și se subînțelege; aici e o dată din trecut care
// trebuie să rămână ce a fost. Iar aici se face și lucrul pentru care oamenii
// deschid ecranul cel mai des: ÎNCHIDEREA unei poziții rămase deschise.
//
// Un formular comun ar fi avut jumătate din câmpuri ascunse cu condiții, ceea
// ce e mai rău decât două formulare care spun fiecare ce face. Ce chiar e
// comun — clasificarea simbolului, parsarea numerelor — stă deja în
// `@tradegx/core`.
//
// ȘTERGEREA CERE O CONFIRMARE CARE SPUNE CE SE PIERDE, nu „ești sigur?”.
// Împreună cu tranzacția pleacă și nota din jurnal, iar asta merită scris.

const SETUPURI = [
  "ORDER_BLOCK", "FAIR_VALUE_GAP", "LIQUIDITY_SWEEP", "BOS", "CHOCH",
  "BREAKER", "MITIGATION", "REJECTION", "TREND_FOLLOW", "SCALP", "OTHER",
] as const;

const INTERVALE = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN1"] as const;

const ETICHETE_SETUP: Record<string, string> = {
  ORDER_BLOCK: "Order block",
  FAIR_VALUE_GAP: "FVG",
  LIQUIDITY_SWEEP: "Lichiditate",
  BOS: "BOS",
  CHOCH: "CHoCH",
  BREAKER: "Breaker",
  MITIGATION: "Mitigare",
  REJECTION: "Respingere",
  TREND_FOLLOW: "Pe trend",
  SCALP: "Scalp",
  OTHER: "Altul",
};

interface Tranzactie {
  id: string;
  symbol: string;
  direction: string;
  status: string;
  entryPrice: string | number;
  exitPrice: string | number | null;
  entryTime: string;
  exitTime: string | null;
  lotSize: string | number;
  stopLoss: string | number | null;
  takeProfit: string | number | null;
  commission: string | number | null;
  swap: string | number | null;
  setupType: string | null;
  timeframe: string | null;
  notes: string | null;
  pnlMoney: string | number | null;
  account?: { currency?: string } | null;
}

export default function EditareTranzactie() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const c = useCerere<Tranzactie>(
    () => api.trades.get(String(id)) as Promise<Tranzactie>,
    [id],
  );
  const t = c.date;

  const [gata, setGata] = React.useState(false);
  const [simbol, setSimbol] = React.useState("");
  const [directie, setDirectie] = React.useState<"BUY" | "SELL">("BUY");
  const [intrare, setIntrare] = React.useState("");
  const [iesire, setIesire] = React.useState("");
  const [lot, setLot] = React.useState("");
  const [stop, setStop] = React.useState("");
  const [tinta, setTinta] = React.useState("");
  const [comision, setComision] = React.useState("");
  const [swap, setSwap] = React.useState("");
  const [setup, setSetup] = React.useState<string | null>(null);
  const [interval, setInterval_] = React.useState<string | null>(null);
  const [note, setNote] = React.useState("");

  const [salveaza, setSalveaza] = React.useState(false);
  const [sterge, setSterge] = React.useState(false);
  const [eroare, setEroare] = React.useState<string | null>(null);
  const [salvat, setSalvat] = React.useState(false);

  // Starea se ia O SINGURĂ DATĂ. Dacă s-ar sincroniza la fiecare randare, o
  // reîmprospătare ar șterge ce tocmai a tastat omul.
  React.useEffect(() => {
    if (gata || !t) return;
    const txt = (v: string | number | null | undefined) =>
      v == null ? "" : String(Number(v));
    setSimbol(t.symbol);
    setDirectie(t.direction === "SELL" ? "SELL" : "BUY");
    setIntrare(txt(t.entryPrice));
    setIesire(txt(t.exitPrice));
    setLot(txt(t.lotSize));
    setStop(txt(t.stopLoss));
    setTinta(txt(t.takeProfit));
    // Comisionul e stocat SEMNAT (negativ = cost); omul îl gândește pozitiv.
    setComision(t.commission == null ? "" : String(Math.abs(Number(t.commission))));
    setSwap(t.swap == null ? "" : String(Number(t.swap)));
    setSetup(t.setupType);
    setInterval_(t.timeframe);
    setNote(t.notes ?? "");
    setGata(true);
  }, [t, gata]);

  const nr = (v: string): number | null => {
    const x = Number(v.replace(",", "."));
    return Number.isFinite(x) && x > 0 ? x : null;
  };
  const nrSemnat = (v: string): number | null => {
    if (v.trim() === "") return null;
    const x = Number(v.replace(",", "."));
    return Number.isFinite(x) ? x : null;
  };

  const eraDeschisa = t?.status === "OPEN";
  const pIesire = nr(iesire);
  const seInchideAcum = eraDeschisa && pIesire != null;

  const rr =
    nr(intrare) != null && nr(stop) != null && nr(tinta) != null
      ? riskReward(nr(intrare)!, nr(stop)!, nr(tinta)!)
      : null;

  const valid = simbol.trim().length >= 2 && nr(intrare) != null && nr(lot) != null;

  const schimbat = () => setSalvat(false);

  async function salveazaAcum() {
    if (!valid || !t) return;
    setSalveaza(true);
    setEroare(null);
    try {
      await api.trades.update(String(id), {
        symbol: simbol.trim().toUpperCase(),
        direction: directie,
        entryPrice: nr(intrare),
        exitPrice: pIesire,
        lotSize: nr(lot),
        stopLoss: nr(stop),
        takeProfit: nr(tinta),
        commission: nrSemnat(comision) ?? 0,
        swap: nrSemnat(swap) ?? 0,
        setupType: setup,
        timeframe: interval,
        notes: note.trim() || null,
        // Ieșirea completată pe o poziție deschisă o ÎNCHIDE. Fără ora de
        // ieșire, statisticile pe zile ar rămâne fără reper.
        ...(seInchideAcum
          ? { status: "CLOSED", exitTime: new Date().toISOString() }
          : {}),
        ...(!eraDeschisa && pIesire == null ? { status: "OPEN", exitTime: null } : {}),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSalvat(true);
      c.reia();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setEroare(e instanceof ApiError ? e.message : "Nu am putut salva. Verifică internetul.");
    } finally {
      setSalveaza(false);
    }
  }

  function confirmaStergerea() {
    if (!t) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert(
      `Ștergi ${t.symbol}?`,
      "Dispare din jurnal împreună cu nota scrisă la ea, și iese din toate statisticile. Nu se poate anula.",
      [
        { text: "Păstrează", style: "cancel" },
        { text: "Șterge", style: "destructive", onPress: stergeAcum },
      ],
    );
  }

  async function stergeAcum() {
    setSterge(true);
    setEroare(null);
    try {
      await api.trades.remove(String(id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace("/(tabs)/tranzactii");
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setEroare(e instanceof ApiError ? e.message : "Nu am putut șterge.");
      setSterge(false);
    }
  }

  const moneda = t?.account?.currency ?? "USD";

  return (
    <Ecran
      titlu={t ? `Editează ${t.symbol}` : "Editează"}
      subtitlu={t ? `Deschisă ${dataScurta(t.entryTime)}` : null}
      incarca={c.incarca && !t}
      scheletRanduri={5}
      eroare={eroare ?? c.eroare}
      subsol={
        t ? (
          <Buton
            eticheta={salvat ? "Salvat" : "Salvează modificările"}
            onPress={salveazaAcum}
            incarca={salveaza}
            dezactivat={!valid}
            plin
            iconita={
              <Ionicons
                name={salvat ? "checkmark-circle" : "save-outline"}
                size={17}
                color="#ffffff"
              />
            }
          />
        ) : null
      }
    >
      {!t ? (
        !c.incarca ? (
          <Gol
            iconita="help-circle-outline"
            titlu="Tranzacția nu a fost găsită"
            text="Poate a fost ștearsă. Întoarce-te la listă."
          />
        ) : null
      ) : (
        <>
          {seInchideAcum ? (
            <Card culoareMuchie="rgba(52,211,153,0.35)" style={{ marginBottom: T.spacing.md }}>
              <View style={st.randInchide}>
                <Ionicons name="flag-outline" size={17} color={T.pnl.gain} />
                <Text style={st.textInchide}>
                  Ai pus un preț de ieșire — la salvare, poziția se închide cu ora de
                  acum, iar rezultatul intră în statistici.
                </Text>
              </View>
            </Card>
          ) : null}

          <Reveal>
            <Card>
              <Camp
                eticheta="Simbol"
                valoare={simbol}
                onChange={(v) => { schimbat(); setSimbol(v.toUpperCase()); }}
                autoCapitalize="characters"
                placeholder="EURUSD"
              />

              <Text style={st.eticheta}>Direcție</Text>
              <View style={st.doua}>
                {(["BUY", "SELL"] as const).map((d) => {
                  const activ = d === directie;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        schimbat();
                        setDirectie(d);
                      }}
                      style={[
                        st.pastilaMare,
                        activ && {
                          backgroundColor: d === "BUY" ? "rgba(52,211,153,0.12)" : "rgba(251,113,133,0.12)",
                          borderColor: d === "BUY" ? "rgba(52,211,153,0.35)" : "rgba(251,113,133,0.35)",
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: activ }}
                    >
                      <Ionicons
                        name={d === "BUY" ? "trending-up" : "trending-down"}
                        size={16}
                        color={activ ? (d === "BUY" ? T.pnl.gain : T.pnl.loss) : T.ink.i4}
                      />
                      <Text
                        style={[
                          st.textPastilaMare,
                          activ && { color: d === "BUY" ? T.pnl.gain : T.pnl.loss },
                        ]}
                      >
                        {d === "BUY" ? "Cumpărare" : "Vânzare"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={st.rand2}>
                <Camp
                  eticheta="Intrare"
                  valoare={intrare}
                  onChange={(v) => { schimbat(); setIntrare(v); }}
                  numeric
                  style={st.jum}
                />
                <Camp
                  eticheta={eraDeschisa ? "Ieșire (închide)" : "Ieșire"}
                  valoare={iesire}
                  onChange={(v) => { schimbat(); setIesire(v); }}
                  numeric
                  placeholder={eraDeschisa ? "gol = rămâne deschisă" : ""}
                  style={st.jum}
                />
              </View>

              <View style={st.rand2}>
                <Camp
                  eticheta="Lot"
                  valoare={lot}
                  onChange={(v) => { schimbat(); setLot(v); }}
                  numeric
                  style={st.jum}
                />
                <Camp
                  eticheta="Stop loss"
                  valoare={stop}
                  onChange={(v) => { schimbat(); setStop(v); }}
                  numeric
                  style={st.jum}
                />
              </View>

              <View style={st.rand2}>
                <Camp
                  eticheta="Take profit"
                  valoare={tinta}
                  onChange={(v) => { schimbat(); setTinta(v); }}
                  numeric
                  style={st.jum}
                />
                <Camp
                  eticheta="Comision"
                  valoare={comision}
                  onChange={(v) => { schimbat(); setComision(v); }}
                  numeric
                  sufix={moneda}
                  style={st.jum}
                />
              </View>

              {rr != null ? (
                <View style={st.rrCutie}>
                  <Text style={st.rrEticheta}>RAPORT RISC/CÂȘTIG</Text>
                  <Text
                    style={[
                      st.rrValoare,
                      { color: rr >= 2 ? T.pnl.gain : rr < 1 ? T.pnl.loss : T.ink.i1 },
                    ]}
                  >
                    1 : {numar(rr, 2)}
                  </Text>
                </View>
              ) : null}
            </Card>
          </Reveal>

          <Sectiune titlu="Context" nota="Ce a fost setup-ul. Din astea iese Edge Finder-ul." />

          <Reveal intarziere={60}>
            <Card>
              <Text style={st.eticheta}>Setup</Text>
              <View style={st.pastile}>
                {SETUPURI.map((x) => {
                  const activ = x === setup;
                  return (
                    <Pressable
                      key={x}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        schimbat();
                        setSetup(activ ? null : x);
                      }}
                      style={[st.pastila, activ && st.pastilaActiva]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: activ }}
                    >
                      <Text style={[st.textPastila, activ && { color: T.accent.base }]}>
                        {ETICHETE_SETUP[x] ?? x}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[st.eticheta, { marginTop: T.spacing.lg }]}>Interval</Text>
              <View style={st.pastile}>
                {INTERVALE.map((x) => {
                  const activ = x === interval;
                  return (
                    <Pressable
                      key={x}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        schimbat();
                        setInterval_(activ ? null : x);
                      }}
                      style={[st.pastila, activ && st.pastilaActiva]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: activ }}
                    >
                      <Text style={[st.textPastila, activ && { color: T.accent.base }]}>{x}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Camp
                eticheta="Notă"
                valoare={note}
                onChange={(v) => { schimbat(); setNote(v); }}
                multilinie
                randuri={3}
                autoCapitalize="sentences"
                placeholder="Ce merită ținut minte"
                style={{ marginTop: T.spacing.lg }}
              />
            </Card>
          </Reveal>

          <Sectiune titlu="Cum e acum" />
          <Reveal intarziere={120}>
            <Card nivel={1}>
              <Rand
                cheie="Stare"
                valoare={t.status === "OPEN" ? "deschisă" : "închisă"}
                numeric={false}
              />
              <Rand
                cheie="Rezultat salvat"
                valoare={t.pnlMoney == null ? "—" : `${Number(t.pnlMoney).toFixed(2)} ${moneda}`}
                culoare={tonPnl(t.pnlMoney == null ? null : Number(t.pnlMoney))}
              />
              {t.exitTime ? (
                <Rand cheie="Închisă la" valoare={dataScurta(t.exitTime)} numeric={false} />
              ) : null}
            </Card>
          </Reveal>

          <Sectiune titlu="Zonă periculoasă" />
          <Reveal intarziere={180}>
            <Card nivel={1} culoareMuchie="rgba(251,113,133,0.30)">
              <View style={st.randSterg}>
                <Insigna text="ireversibil" culoare={T.pnl.loss} fundal="rgba(251,113,133,0.12)" />
              </View>
              <Text style={st.textSterg}>
                Ștergerea scoate tranzacția din jurnal împreună cu nota scrisă la ea, și
                o elimină din toate statisticile.
              </Text>
              <Buton
                eticheta="Șterge tranzacția"
                varianta="distructiv"
                onPress={confirmaStergerea}
                incarca={sterge}
                plin
                style={{ marginTop: T.spacing.md }}
                iconita={<Ionicons name="trash-outline" size={16} color={T.pnl.loss} />}
              />
            </Card>
          </Reveal>
        </>
      )}
    </Ecran>
  );
}

const st = StyleSheet.create({
  randInchide: { flexDirection: "row", gap: T.spacing.md, alignItems: "flex-start" },
  textInchide: {
    flex: 1,
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  eticheta: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: T.tracking.wider,
    marginBottom: T.spacing.sm,
  },
  doua: { flexDirection: "row", gap: T.spacing.sm, marginBottom: T.spacing.lg },
  pastilaMare: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 44,
    borderRadius: T.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    backgroundColor: T.surface.s3,
  },
  textPastilaMare: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_700Bold",
  },
  rand2: { flexDirection: "row", gap: T.spacing.md },
  jum: { flex: 1 },
  pastile: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pastila: {
    minHeight: 32,
    paddingHorizontal: T.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: T.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    backgroundColor: T.surface.s3,
  },
  pastilaActiva: { backgroundColor: T.accent.soft, borderColor: T.accent.line },
  textPastila: {
    color: T.ink.i3,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_600SemiBold",
  },
  rrCutie: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: T.spacing.sm,
    paddingTop: T.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.line.l1,
  },
  rrEticheta: {
    color: T.ink.i4,
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.wider,
  },
  rrValoare: {
    fontSize: T.fontSize.base,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  randSterg: { marginBottom: T.spacing.sm },
  textSterg: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});
