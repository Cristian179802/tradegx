import * as React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api, ApiError } from "../src/lib/api";
import { Card } from "../src/ui/Card";
import { Camp } from "../src/ui/Camp";
import { Buton } from "../src/ui/Buton";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { Paywall } from "../src/ui/Paywall";
import { Insigna, Rand, Sectiune } from "../src/ui/parti";
import { T } from "../src/theme";

// ── Cont de trading nou ──────────────────────────────────────────────────────
//
// Ecranul ăsta repară PATRU stări goale deodată. Conturi, Manager de risc,
// Prop firm și Import toate se terminau cu „adaugă un cont de pe site" — un
// drum închis, repetat de patru ori, pentru ceva ce ruta serverului accepta de
// la bun început.
//
// A fost aceeași greșeală ca la Backtesting și la Echipe: am aplicat regula
// „fără linkuri spre web" ștergând butonul, în loc să construiesc ce lipsea.
//
// TIPUL CONTULUI SCHIMBĂ FORMULARUL, nu doar o etichetă. Un cont de challenge
// are reguli care decid dacă îl pierzi — ținta de profit, pierderea zilnică
// maximă, drawdown-ul, zilele minime. Ascunse sub „opțional", nimeni nu le-ar
// completa, iar ecranul de Prop firm ar rămâne gol și după ce adaugi contul.
//
// Regulile se trimit SEPARAT, după creare: ruta de conturi nu le acceptă, le
// primește `/api/propfirm`. Dacă a doua cerere cade, contul rămâne creat — și
// ecranul o spune, în loc să pretindă că n-a mers nimic.

const TIPURI = [
  { v: "DEMO", e: "Demo", sub: "Bani virtuali, pentru exersat", i: "flask-outline" as const },
  { v: "CHALLENGE", e: "Challenge", sub: "Cont de prop firm, cu reguli", i: "ribbon-outline" as const },
  { v: "LIVE", e: "Real", sub: "Banii tăi, la un broker", i: "cash-outline" as const },
];

const MONEDE = ["USD", "EUR", "GBP", "RON", "CHF", "JPY"];
const LEVIERE = [30, 100, 200, 500];

/** Presetele celor mai întâlnite firme. Cifrele se pot schimba oricum după. */
const FIRME = [
  { nume: "FTMO", tinta: 10, zi: 5, dd: 10, zile: 4 },
  { nume: "The5ers", tinta: 8, zi: 4, dd: 6, zile: 3 },
  { nume: "FundedNext", tinta: 8, zi: 5, dd: 10, zile: 5 },
  { nume: "MyForexFunds", tinta: 8, zi: 5, dd: 12, zile: 5 },
  { nume: "Altă firmă", tinta: 10, zi: 5, dd: 10, zile: 0 },
];

export default function ContNou() {
  const router = useRouter();

  const [tip, setTip] = React.useState("DEMO");
  const [nume, setNume] = React.useState("");
  const [broker, setBroker] = React.useState("");
  const [moneda, setMoneda] = React.useState("USD");
  const [sold, setSold] = React.useState("10000");
  const [levier, setLevier] = React.useState(100);

  // Numai pentru challenge.
  const [firma, setFirma] = React.useState<string | null>(null);
  const [tinta, setTinta] = React.useState("10");
  const [pierdereZi, setPierdereZi] = React.useState("5");
  const [drawdown, setDrawdown] = React.useState("10");
  const [zileMinime, setZileMinime] = React.useState("4");

  const [salveaza, setSalveaza] = React.useState(false);
  const [eroare, setEroare] = React.useState<string | null>(null);
  const [proCerut, setProCerut] = React.useState(false);

  const esteChallenge = tip === "CHALLENGE";

  const nr = (v: string): number | null => {
    const x = Number(v.replace(",", "."));
    return Number.isFinite(x) && x > 0 ? x : null;
  };

  const numeFolosit =
    nume.trim() ||
    (esteChallenge && firma ? `${firma} ${moneda}` : `Cont ${TIPURI.find((t) => t.v === tip)?.e ?? ""}`);

  const valid = nr(sold) != null && numeFolosit.length >= 1;

  const alegeFirma = (f: (typeof FIRME)[number]) => {
    Haptics.selectionAsync().catch(() => {});
    setFirma(f.nume);
    setTinta(String(f.tinta));
    setPierdereZi(String(f.zi));
    setDrawdown(String(f.dd));
    setZileMinime(String(f.zile));
  };

  const creeaza = async () => {
    if (!valid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSalveaza(true);
    setEroare(null);

    try {
      const cont = (await api.accounts.creeaza({
        name: numeFolosit.slice(0, 50),
        type: tip,
        broker: broker.trim() || undefined,
        currency: moneda,
        balance: nr(sold),
        leverage: levier,
        ...(esteChallenge
          ? {
              maxDailyLossPct: nr(pierdereZi) ?? undefined,
              maxDrawdownPct: nr(drawdown) ?? undefined,
            }
          : {}),
      })) as { id?: string };

      // Ținta, firma și zilele minime nu intră în ruta de conturi — le primește
      // cea de prop firm. A doua cerere, deci o tratăm separat: dacă ea cade,
      // contul TOT e creat.
      if (esteChallenge && cont.id) {
        try {
          await api.propfirm.update({
            accountId: cont.id,
            propFirm: firma,
            profitTarget: nr(tinta),
            maxDailyLossPct: nr(pierdereZi),
            maxDrawdownPct: nr(drawdown),
            minTradingDays: nr(zileMinime) ?? 0,
          });
        } catch {
          setEroare(
            "Contul e creat, dar regulile firmei n-au ajuns. Le poți pune din ecranul Prop firm.",
          );
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace("/conturi");
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      if (e instanceof ApiError && e.status === 402) {
        setProCerut(true);
      } else {
        setEroare(e instanceof ApiError ? e.message : "Nu am putut crea contul.");
      }
    } finally {
      setSalveaza(false);
    }
  };

  if (proCerut) {
    return (
      <Ecran titlu="Cont nou" subtitlu="Un al doilea cont cere PRO">
        <Paywall
          functie="Conturi nelimitate"
          descriere="Planul gratuit include un singur cont de trading. Cu PRO poți urmări câte vrei, fiecare cu statisticile lui."
          puncte={[
            "Conturi nelimitate, separate în statistici",
            "Comutare între ele dintr-o atingere",
            "Vedere agregată pe toate, când o vrei",
            "Reguli de prop firm urmărite separat pe fiecare",
          ]}
        />
      </Ecran>
    );
  }

  return (
    <Ecran
      titlu="Cont nou"
      subtitlu="Contul pe care îl urmărește aplicația"
      eroare={eroare}
      subsol={
        <Buton
          eticheta="Creează contul"
          onPress={creeaza}
          incarca={salveaza}
          dezactivat={!valid}
          plin
          iconita={<Ionicons name="wallet-outline" size={17} color="#ffffff" />}
        />
      }
    >
      <Sectiune titlu="Ce fel de cont" />

      {TIPURI.map((x, i) => {
        const ales = x.v === tip;
        return (
          <Reveal key={x.v} intarziere={i * 45} style={{ marginBottom: T.spacing.sm }}>
            <Card
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setTip(x.v);
              }}
              culoareMuchie={ales ? T.accent.line : "rgba(255,255,255,0.04)"}
              accesibilEticheta={`${x.e}. ${x.sub}`}
            >
              <View style={st.rand}>
                <View style={[st.iconita, ales && { backgroundColor: T.accent.soft }]}>
                  <Ionicons name={x.i} size={17} color={ales ? T.accent.base : T.ink.i3} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={st.numeTip}>{x.e}</Text>
                  <Text style={st.subTip}>{x.sub}</Text>
                </View>
                {ales ? <Ionicons name="checkmark-circle" size={19} color={T.accent.base} /> : null}
              </View>
            </Card>
          </Reveal>
        );
      })}

      {esteChallenge ? (
        <>
          <Sectiune titlu="Firma" nota="Presetul umple regulile; le poți schimba după." />
          <Reveal>
            <Card>
              <View style={st.firme}>
                {FIRME.map((f) => {
                  const ales = f.nume === firma;
                  return (
                    <Pressable
                      key={f.nume}
                      onPress={() => alegeFirma(f)}
                      style={[st.pastila, ales && st.pastilaActiva]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: ales }}
                    >
                      <Text style={[st.textPastila, ales && { color: T.accent.base }]}>
                        {f.nume}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={st.doua}>
                <Camp
                  eticheta="Ținta de profit"
                  valoare={tinta}
                  onChange={setTinta}
                  numeric
                  sufix="%"
                  style={st.jum}
                />
                <Camp
                  eticheta="Pierdere zilnică max."
                  valoare={pierdereZi}
                  onChange={setPierdereZi}
                  numeric
                  sufix="%"
                  style={st.jum}
                />
              </View>
              <View style={st.doua}>
                <Camp
                  eticheta="Drawdown maxim"
                  valoare={drawdown}
                  onChange={setDrawdown}
                  numeric
                  sufix="%"
                  style={st.jum}
                />
                <Camp
                  eticheta="Zile minime"
                  valoare={zileMinime}
                  onChange={setZileMinime}
                  numeric
                  style={st.jum}
                />
              </View>

              <Text style={st.nota}>
                Din cifrele astea iese ecranul Prop firm: cât ai consumat din pierderea
                zilnică, cât drawdown mai ai până la eliminare.
              </Text>
            </Card>
          </Reveal>
        </>
      ) : null}

      <Sectiune titlu="Contul" />
      <Reveal>
        <Card>
          <Camp
            eticheta="Nume"
            valoare={nume}
            onChange={setNume}
            placeholder={numeFolosit}
            autoCapitalize="words"
          />
          <Camp
            eticheta="Broker (opțional)"
            valoare={broker}
            onChange={setBroker}
            placeholder="IC Markets, Binance…"
            autoCapitalize="words"
          />

          <Text style={st.eticheta}>Moneda</Text>
          <View style={st.optiuni}>
            {MONEDE.map((m) => (
              <Pressable
                key={m}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setMoneda(m);
                }}
                style={[st.pastila, m === moneda && st.pastilaActiva]}
                accessibilityRole="button"
                accessibilityState={{ selected: m === moneda }}
              >
                <Text style={[st.textPastila, m === moneda && { color: T.accent.base }]}>{m}</Text>
              </Pressable>
            ))}
          </View>

          <Camp
            eticheta={`Sold inițial (${moneda})`}
            valoare={sold}
            onChange={setSold}
            numeric
            style={{ marginTop: T.spacing.lg }}
          />

          <Text style={st.eticheta}>Levier</Text>
          <View style={st.optiuni}>
            {LEVIERE.map((l) => (
              <Pressable
                key={l}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setLevier(l);
                }}
                style={[st.pastila, l === levier && st.pastilaActiva]}
                accessibilityRole="button"
                accessibilityState={{ selected: l === levier }}
              >
                <Text style={[st.textPastila, l === levier && { color: T.accent.base }]}>
                  1:{l}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>
      </Reveal>

      <Reveal style={{ marginTop: T.spacing.md }}>
        <Card nivel={1}>
          <Rand cheie="Se va crea" valoare={numeFolosit} numeric={false} />
          <Rand cheie="Sold" valoare={`${sold} ${moneda}`} numeric={false} />
          {esteChallenge && firma ? <Rand cheie="Firmă" valoare={firma} numeric={false} /> : null}
        </Card>
      </Reveal>

      <Reveal style={{ marginTop: T.spacing.md }}>
        <Card nivel={1}>
          <Insigna text="sincronizare" culoare={T.ink.i3} />
          <Text style={[st.nota, { marginTop: T.spacing.sm }]}>
            Contul creat aici se completează manual sau prin import CSV. Sincronizarea
            automată cu brokerul — MetaAPI, TradeLocker, Binance — se leagă de pe
            calculator: cere chei de API pe care nu le tastezi cu degetul mare.
          </Text>
        </Card>
      </Reveal>
    </Ecran>
  );
}

const st = StyleSheet.create({
  rand: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  iconita: {
    width: 38,
    height: 38,
    borderRadius: T.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface.s4,
  },
  numeTip: {
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  subTip: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  firme: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: T.spacing.lg },
  eticheta: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: T.tracking.wider,
    marginTop: T.spacing.md,
    marginBottom: T.spacing.sm,
  },
  optiuni: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pastila: {
    minHeight: 34,
    paddingHorizontal: T.spacing.md,
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
  doua: { flexDirection: "row", gap: T.spacing.md },
  jum: { flex: 1 },
  nota: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
