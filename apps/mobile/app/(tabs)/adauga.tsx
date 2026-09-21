import * as React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "../../src/ui/Text";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { positionSize, pipValue, clasificaSimbol } from "@tradegx/core";
import { api, ApiError } from "../../src/lib/api";
import { useCerere } from "../../src/lib/useCerere";
import { Card } from "../../src/ui/Card";
import { Camp } from "../../src/ui/Camp";
import { Buton } from "../../src/ui/Buton";
import { Reveal } from "../../src/ui/Reveal";
import { RollingNumber } from "../../src/ui/RollingNumber";
import { T, cifre } from "../../src/theme";
import { numar } from "../../src/lib/format";

// ── Adaugă tranzacție ────────────────────────────────────────────────────────
//
// ECRANUL PENTRU CARE EXISTĂ APLICAȚIA. Cineva tocmai a închis o poziție și
// are treizeci de secunde de răbdare. Tot ce nu e obligatoriu stă ascuns.
//
// CALCULATORUL E ÎNĂUNTRU, nu pe alt ecran. Mărimea poziției se decide ÎNAINTE
// de intrare, din stop-loss — iar dacă pentru asta trebuie să ieși din
// formular, nu o mai face nimeni. Se calculează din `@tradegx/core`, aceeași
// funcție ca web-ul, cu aceeași regulă: dacă valoarea pipului nu se poate ști,
// nu inventăm o mărime, spunem că nu știm.
//
// DIRECȚIA E DOUĂ BUTOANE MARI, nu un selector. E prima decizie și cea mai
// ușor de greșit pe grabă.

const INSTRUMENTE = {
  FOREX: "FOREX", METAL: "METALS", INDICE: "INDICES", CRIPTO: "CRYPTO", MARFA: "COMMODITIES",
} as const;

interface Cont {
  id: string;
  name: string;
  currency: string;
  balance: number | string;
}

export default function Adauga() {
  const router = useRouter();

  const conturi = useCerere<Cont[] | { accounts: Cont[] }>(
    () => api.accounts.list() as Promise<Cont[] | { accounts: Cont[] }>,
  );
  const listaConturi: Cont[] = Array.isArray(conturi.date)
    ? conturi.date
    : (conturi.date?.accounts ?? []);

  const [contId, setContId] = React.useState<string | null>(null);
  const contAles = listaConturi.find((c) => c.id === contId) ?? listaConturi[0] ?? null;

  React.useEffect(() => {
    if (!contId && listaConturi[0]) setContId(listaConturi[0].id);
  }, [listaConturi, contId]);

  const [simbol, setSimbol] = React.useState("");
  const [directie, setDirectie] = React.useState<"BUY" | "SELL">("BUY");
  const [intrare, setIntrare] = React.useState("");
  const [stop, setStop] = React.useState("");
  const [lot, setLot] = React.useState("");
  const [iesire, setIesire] = React.useState("");
  const [risc, setRisc] = React.useState("1");
  const [note, setNote] = React.useState("");
  const [trimite, setTrimite] = React.useState(false);
  const [eroare, setEroare] = React.useState<string | null>(null);

  // ── Calculatorul ───────────────────────────────────────────────────────────
  const sugestie = React.useMemo(() => {
    const s = simbol.trim().toUpperCase();
    const pIntrare = Number(intrare.replace(",", "."));
    const pStop = Number(stop.replace(",", "."));
    const pct = Number(risc.replace(",", "."));
    const sold = contAles ? Number(contAles.balance) : 0;
    if (!s || !(pIntrare > 0) || !(pStop > 0) || !(pct > 0) || !(sold > 0)) return null;

    const moneda = contAles?.currency ?? "USD";
    const vp = pipValue({ symbol: s, price: pIntrare, accountCurrency: moneda });
    const loturi = positionSize({
      balance: sold,
      riskPct: pct,
      entryPrice: pIntrare,
      stopLoss: pStop,
      symbol: s,
      accountCurrency: moneda,
    });
    return { loturi, valoarePip: vp, riscBani: (sold * pct) / 100, moneda };
  }, [simbol, intrare, stop, risc, contAles]);

  const poateTrimite =
    Boolean(contAles) &&
    simbol.trim().length >= 2 &&
    Number(intrare.replace(",", ".")) > 0 &&
    Number(lot.replace(",", ".")) > 0 &&
    !trimite;

  async function salveaza() {
    if (!poateTrimite || !contAles) return;
    setTrimite(true);
    setEroare(null);

    const s = simbol.trim().toUpperCase();
    const nr = (v: string) => {
      const n = Number(v.replace(",", "."));
      return Number.isFinite(n) && n > 0 ? n : null;
    };
    const pIesire = nr(iesire);

    try {
      await api.trades.create({
        accountId: contAles.id,
        symbol: s,
        instrumentType: INSTRUMENTE[clasificaSimbol(s)],
        direction: directie,
        entryPrice: nr(intrare),
        entryTime: new Date().toISOString(),
        exitPrice: pIesire,
        exitTime: pIesire ? new Date().toISOString() : null,
        lotSize: nr(lot),
        stopLoss: nr(stop),
        // Fără preț de ieșire, poziția e deschisă — nu o închidem cu zero.
        status: pIesire ? "CLOSED" : "OPEN",
        notes: note.trim() || null,
        tags: [],
        commission: 0,
        swap: 0,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      goleste();
      router.replace("/(tabs)/tranzactii");
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setEroare(
        e instanceof ApiError ? e.message : "Nu am putut salva. Verifică internetul.",
      );
    } finally {
      setTrimite(false);
    }
  }

  function goleste() {
    setSimbol(""); setIntrare(""); setStop(""); setLot("");
    setIesire(""); setNote(""); setEroare(null);
  }

  return (
    <View style={st.radacina}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={8}
        >
          <ScrollView
            contentContainerStyle={st.continut}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={st.titlu}>Adaugă tranzacție</Text>

            {/* ── Contul ── */}
            {listaConturi.length > 1 && (
              <Reveal intarziere={0} style={st.bloc}>
                <Text style={st.eticheta}>Cont</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                  <View style={{ flexDirection: "row", gap: T.spacing.sm }}>
                    {listaConturi.map((c) => (
                      <Pressable
                        key={c.id}
                        onPress={() => { Haptics.selectionAsync().catch(() => {}); setContId(c.id); }}
                        style={[st.pastila, contAles?.id === c.id && st.pastilaActiva]}
                      >
                        <Text style={[st.textPastila, contAles?.id === c.id && st.textPastilaActiv]}>
                          {c.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </Reveal>
            )}

            {/* ── Direcția ── */}
            <Reveal intarziere={50} style={st.bloc}>
              <Text style={st.eticheta}>Direcție</Text>
              <View style={st.randDirectie}>
                {(["BUY", "SELL"] as const).map((d) => {
                  const activ = directie === d;
                  const cumparare = d === "BUY";
                  return (
                    <Pressable
                      key={d}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); setDirectie(d); }}
                      style={[
                        st.butonDirectie,
                        activ && {
                          backgroundColor: cumparare ? "rgba(52,211,153,0.14)" : "rgba(251,113,133,0.14)",
                          borderColor: cumparare ? T.pnl.gain : T.pnl.loss,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: activ }}
                    >
                      <Ionicons
                        name={cumparare ? "trending-up" : "trending-down"}
                        size={19}
                        color={activ ? (cumparare ? T.pnl.gain : T.pnl.loss) : T.ink.i4}
                      />
                      <Text
                        style={[
                          st.textDirectie,
                          { color: activ ? (cumparare ? T.pnl.gain : T.pnl.loss) : T.ink.i3 },
                        ]}
                      >
                        {cumparare ? "Cumpărare" : "Vânzare"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Reveal>

            {/* ── Datele ── */}
            <Reveal intarziere={100}>
              <Camp
                eticheta="Simbol"
                valoare={simbol}
                onChange={setSimbol}
                placeholder="EURUSD"
                autoCapitalize="characters"
              />
              <View style={st.doua}>
                <Camp eticheta="Intrare" valoare={intrare} onChange={setIntrare} placeholder="1.0850" numeric style={st.jumatate} />
                <Camp eticheta="Stop loss" valoare={stop} onChange={setStop} placeholder="1.0800" numeric style={st.jumatate} />
              </View>
            </Reveal>

            {/* ── Calculatorul ── */}
            <Reveal intarziere={150} style={st.bloc}>
              <Card nivel={1} culoareMuchie={T.accent.line}>
                <View style={st.randCalc}>
                  <Text style={st.eticheta}>Volum recomandat</Text>
                  <View style={st.riscMic}>
                    <Text style={st.riscEticheta}>risc</Text>
                    <Text style={[st.riscValoare, cifre]}>{risc}%</Text>
                  </View>
                </View>

                {sugestie?.loturi != null ? (
                  <>
                    <View style={{ marginTop: 6 }}>
                      <RollingNumber
                        value={numar(sugestie.loturi, 2)}
                        size={T.fontSize["2xl"]}
                        color={T.accent.base}
                      />
                    </View>
                    <Text style={st.explicatie}>
                      loturi · riști {numar(sugestie.riscBani, 2)} {sugestie.moneda}
                      {sugestie.valoarePip != null
                        ? ` · pip ${numar(sugestie.valoarePip, 2)} ${sugestie.moneda}`
                        : ""}
                    </Text>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                        setLot(sugestie.loturi!.toFixed(2));
                      }}
                      style={st.foloseste}
                    >
                      <Ionicons name="arrow-down" size={14} color={T.accent.base} />
                      <Text style={st.textFoloseste}>Folosește volumul</Text>
                    </Pressable>
                  </>
                ) : (
                  <Text style={st.explicatie}>
                    {sugestie && sugestie.loturi == null
                      ? "Nu pot calcula valoarea pipului pentru simbolul ăsta pe contul tău. Scrie volumul manual."
                      : "Completează simbol, intrare și stop loss ca să calculez volumul."}
                  </Text>
                )}

                <View style={st.randRisc}>
                  {["0.5", "1", "2"].map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => { Haptics.selectionAsync().catch(() => {}); setRisc(r); }}
                      style={[st.pastilaRisc, risc === r && st.pastilaActiva]}
                    >
                      <Text style={[st.textPastila, risc === r && st.textPastilaActiv]}>{r}%</Text>
                    </Pressable>
                  ))}
                </View>
              </Card>
            </Reveal>

            {/* ── Volum + ieșire ── */}
            <Reveal intarziere={200}>
              <View style={st.doua}>
                <Camp eticheta="Volum (loturi)" valoare={lot} onChange={setLot} placeholder="0.20" numeric style={st.jumatate} />
                <Camp
                  eticheta="Ieșire"
                  valoare={iesire}
                  onChange={setIesire}
                  placeholder="opțional"
                  numeric
                  style={st.jumatate}
                />
              </View>
              <Text style={st.notaIesire}>
                Fără preț de ieșire, tranzacția rămâne deschisă.
              </Text>

              <Camp
                eticheta="Notițe"
                valoare={note}
                onChange={setNote}
                placeholder="De ce ai intrat?"
                autoCapitalize="sentences"
              />
            </Reveal>

            {eroare ? (
              <View style={st.cutieEroare}>
                <Text style={st.textEroare}>{eroare}</Text>
              </View>
            ) : null}

            {listaConturi.length === 0 && !conturi.incarca ? (
              <Card>
                <Text style={st.gol}>
                  N-ai niciun cont de trading. Creează unul pe tradegx.com, apoi revino.
                </Text>
              </Card>
            ) : (
              <Buton
                eticheta="Salvează tranzacția"
                onPress={salveaza}
                incarca={trimite}
                dezactivat={!poateTrimite}
                plin
                style={{ marginTop: T.spacing.sm }}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  radacina: { flex: 1, backgroundColor: T.surface.s0 },
  continut: { padding: T.spacing.lg, paddingBottom: 130 },
  titlu: {
    color: T.ink.i1, fontSize: T.fontSize.xl,
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.tight, marginBottom: T.spacing.lg,
  },
  bloc: { marginBottom: T.spacing.lg },
  eticheta: {
    color: T.ink.i4, fontSize: T.fontSize.xs,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase", letterSpacing: T.tracking.wider,
  },
  randDirectie: { flexDirection: "row", gap: T.spacing.sm, marginTop: 6 },
  butonDirectie: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: T.spacing.sm, minHeight: 52,
    borderRadius: T.radius.lg, borderWidth: 1,
    borderColor: T.line.l1, backgroundColor: T.surface.s2,
  },
  textDirectie: { fontSize: T.fontSize.base, fontFamily: "Inter_700Bold" },
  doua: { flexDirection: "row", gap: T.spacing.md },
  jumatate: { flex: 1 },
  randCalc: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  riscMic: { flexDirection: "row", alignItems: "baseline", gap: 5 },
  riscEticheta: { color: T.ink.i4, fontSize: 10, textTransform: "uppercase", letterSpacing: T.tracking.wide , fontFamily: "Inter_400Regular" },
  riscValoare: { color: T.ink.i2, fontSize: T.fontSize.sm, fontFamily: "Inter_800ExtraBold" },
  explicatie: { color: T.ink.i3, fontSize: T.fontSize.xs, marginTop: 6, lineHeight: 17 , fontFamily: "Inter_400Regular" },
  foloseste: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    marginTop: T.spacing.md, minHeight: 40,
    borderRadius: T.radius.md, borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.accent.line, backgroundColor: T.accent.soft,
  },
  textFoloseste: { color: T.accent.base, fontSize: T.fontSize.sm, fontFamily: "Inter_700Bold" },
  randRisc: { flexDirection: "row", gap: T.spacing.sm, marginTop: T.spacing.md },
  pastila: {
    minHeight: 34, paddingHorizontal: T.spacing.lg, justifyContent: "center",
    borderRadius: T.radius.full, borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1, backgroundColor: T.surface.s2,
  },
  pastilaRisc: {
    flex: 1, minHeight: 36, alignItems: "center", justifyContent: "center",
    borderRadius: T.radius.md, borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1, backgroundColor: T.surface.s4,
  },
  pastilaActiva: { backgroundColor: T.accent.soft, borderColor: T.accent.line },
  textPastila: { color: T.ink.i3, fontSize: T.fontSize.sm, fontFamily: "Inter_700Bold" },
  textPastilaActiv: { color: T.accent.base },
  notaIesire: { color: T.ink.i4, fontSize: T.fontSize.xs, marginTop: -8, marginBottom: T.spacing.md , fontFamily: "Inter_400Regular" },
  cutieEroare: {
    backgroundColor: "rgba(251,113,133,0.10)",
    borderColor: "rgba(251,113,133,0.30)",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: T.radius.md, padding: T.spacing.md, marginBottom: T.spacing.sm,
  },
  textEroare: { color: T.pnl.loss, fontSize: T.fontSize.sm, lineHeight: 19 , fontFamily: "Inter_400Regular" },
  gol: { color: T.ink.i3, fontSize: T.fontSize.sm, lineHeight: 20 , fontFamily: "Inter_400Regular" },
});
