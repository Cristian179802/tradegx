import * as React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api, ApiError } from "../src/lib/api";
import { useCerere } from "../src/lib/useCerere";
import { bani, procent } from "../src/lib/format";
import { Card } from "../src/ui/Card";
import { Buton } from "../src/ui/Buton";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { RollingNumber } from "../src/ui/RollingNumber";
import { BaraProgres, Gol, Insigna, Rand, Sectiune } from "../src/ui/parti";
import { T, tonPnl } from "../src/theme";

// ── Manager de risc ──────────────────────────────────────────────────────────
//
// Ecranul ăsta nu raportează, OPREȘTE. Răspunde la o singură întrebare, pusă
// înainte de următoarea intrare: mai am voie azi?
//
// De aceea starea zilei stă prima și ocupă tot cardul de sus, iar regulile —
// care se schimbă o dată pe lună — stau jos. Invers ar fi fost un formular cu
// o notă de subsol despre pierderea zilei.
//
// PRAGURILE SE CITESC DE PE CONT, nu din cap: `maxDailyLossPct` e al contului,
// pentru că o firmă de prop are limita ei, iar un cont personal alta.
//
// SALVAREA TRIMITE ȘI ORELE FĂRĂ TRANZACȚII, chiar dacă ecranul nu le
// editează: ruta le rescrie cu `null` când lipsesc din corp. Fără asta, o
// salvare de pe telefon ar șterge o setare făcută pe desktop.

interface Cont {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: string;
  initialBalance: string;
  maxDailyLossPct: string | null;
  maxDrawdownPct: string | null;
  isActive: boolean;
}

interface Date_ {
  accounts: Cont[];
  user: {
    defaultRiskPct: string;
    maxTradesPerDay: number;
    noTradeDays: number[];
    noTradeHoursStart: string | null;
    noTradeHoursEnd: string | null;
  };
  todayPnl: number;
  todayTradeCount: number;
  weekPnl: number;
}

const ZILE = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"];
const RISCURI = [0.25, 0.5, 1, 1.5, 2, 3];
const LIMITE = [3, 5, 8, 10, 15];

export default function ManagerRisc() {
  const c = useCerere<Date_>(() => api.riskManager() as Promise<Date_>);
  const d = c.date;

  const [risc, setRisc] = React.useState<number | null>(null);
  const [maxPeZi, setMaxPeZi] = React.useState<number | null>(null);
  const [zileOprite, setZileOprite] = React.useState<number[] | null>(null);
  const [salveaza, setSalveaza] = React.useState(false);
  const [salvat, setSalvat] = React.useState(false);
  const [eroare, setEroare] = React.useState<string | null>(null);

  // Starea formularului se ia o singură dată, la sosirea datelor.
  React.useEffect(() => {
    if (!d || risc != null) return;
    setRisc(Number(d.user.defaultRiskPct));
    setMaxPeZi(d.user.maxTradesPerDay);
    setZileOprite(d.user.noTradeDays);
  }, [d, risc]);

  const activ = d?.accounts.find((a) => a.isActive) ?? d?.accounts[0] ?? null;
  const moneda = activ?.currency ?? "USD";
  const sold = activ ? Number(activ.balance) : 0;
  const limitaPct = activ?.maxDailyLossPct ? Number(activ.maxDailyLossPct) : null;
  const limitaBani = limitaPct != null && sold > 0 ? (sold * limitaPct) / 100 : null;

  const pierdereAzi = d ? Math.max(0, -d.todayPnl) : 0;
  const folosit = limitaBani && limitaBani > 0 ? pierdereAzi / limitaBani : 0;
  const depasit = folosit >= 1;
  const aproape = folosit >= 0.7 && !depasit;

  const preaMulte = d != null && maxPeZi != null && d.todayTradeCount >= maxPeZi;
  const ziOprita = zileOprite?.includes(new Date().getDay()) ?? false;

  const potTranzactiona = !depasit && !preaMulte && !ziOprita;

  const salveazaReguli = async () => {
    if (!d || risc == null || maxPeZi == null || zileOprite == null) return;
    setSalveaza(true);
    setEroare(null);
    try {
      await api.tradingRules.update({
        defaultRiskPct: risc,
        maxTradesPerDay: maxPeZi,
        noTradeDays: zileOprite,
        noTradeHoursStart: d.user.noTradeHoursStart,
        noTradeHoursEnd: d.user.noTradeHoursEnd,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSalvat(true);
    } catch (e) {
      setEroare(e instanceof ApiError ? e.message : "Nu am putut salva regulile.");
    } finally {
      setSalveaza(false);
    }
  };

  const riscBani = risc != null && sold > 0 ? (sold * risc) / 100 : null;

  return (
    <Ecran
      titlu="Manager de risc"
      subtitlu={activ ? activ.name : "Limitele tale, azi"}
      incarca={c.incarca && !d}
      scheletRanduri={4}
      reimprospateaza={c.reimprospateaza}
      onReia={c.reia}
      eroare={eroare ?? c.eroare}
    >
      {!d ? null : d.accounts.length === 0 ? (
        <Gol
          iconita="shield-checkmark-outline"
          titlu="Niciun cont"
          text="Limitele se măsoară pe soldul unui cont. Adaugă unul de pe site."
        />
      ) : (
        <>
          <Reveal>
            <Card
              culoareMuchie={
                depasit ? "rgba(251,113,133,0.45)" : potTranzactiona ? "rgba(52,211,153,0.35)" : "rgba(251,191,36,0.35)"
              }
            >
              <View style={st.verdictRand}>
                <View
                  style={[
                    st.verdictIcon,
                    {
                      backgroundColor: depasit
                        ? "rgba(251,113,133,0.14)"
                        : potTranzactiona
                          ? "rgba(52,211,153,0.12)"
                          : "rgba(251,191,36,0.14)",
                    },
                  ]}
                >
                  <Ionicons
                    name={depasit ? "hand-left" : potTranzactiona ? "shield-checkmark" : "warning"}
                    size={20}
                    color={depasit ? T.pnl.loss : potTranzactiona ? T.pnl.gain : T.state.warn}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[
                      st.verdict,
                      { color: depasit ? T.pnl.loss : potTranzactiona ? T.pnl.gain : T.state.warn },
                    ]}
                  >
                    {depasit
                      ? "Stop pentru azi"
                      : ziOprita
                        ? "Azi nu tranzacționezi"
                        : preaMulte
                          ? "Ai atins numărul maxim"
                          : aproape
                            ? "Aproape de limită"
                            : "Poți tranzacționa"}
                  </Text>
                  <Text style={st.verdictNota}>
                    {depasit
                      ? "Limita zilnică de pierdere e atinsă. Mâine e altă zi."
                      : ziOprita
                        ? "E o zi pe care tu ai marcat-o ca liberă."
                        : preaMulte
                          ? `${d.todayTradeCount} din ${maxPeZi} tranzacții azi.`
                          : "Regulile tale sunt respectate."}
                  </Text>
                </View>
              </View>

              <View style={st.linie} />

              <View style={st.pnlAzi}>
                <View>
                  <Text style={st.etichetaMica}>REZULTATUL ZILEI</Text>
                  <RollingNumber
                    value={bani(d.todayPnl, moneda)}
                    size={T.fontSize.xl}
                    color={tonPnl(d.todayPnl)}
                  />
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={st.etichetaMica}>SĂPTĂMÂNA</Text>
                  <RollingNumber
                    value={bani(d.weekPnl, moneda)}
                    size={T.fontSize.base}
                    color={tonPnl(d.weekPnl)}
                    intarziere={90}
                  />
                </View>
              </View>

              {limitaBani != null ? (
                <>
                  <BaraProgres
                    fractiune={folosit}
                    culoare={depasit ? T.pnl.loss : aproape ? T.state.warn : T.accent.base}
                    style={{ marginTop: T.spacing.lg }}
                  />
                  <Text style={st.subBara}>
                    {bani(pierdereAzi, moneda, false)} din {bani(limitaBani, moneda, false)} ({procent(limitaPct, 1)} din sold)
                  </Text>
                </>
              ) : (
                <Text style={st.faraLimita}>
                  Contul n-are limită zilnică setată. Se pune de pe site, la cont.
                </Text>
              )}

              <View style={st.numarator}>
                <Text style={st.etichetaMica}>TRANZACȚII AZI</Text>
                <Text style={[st.numaratorText, preaMulte && { color: T.state.warn }]}>
                  {d.todayTradeCount} / {maxPeZi ?? "—"}
                </Text>
              </View>
            </Card>
          </Reveal>

          <Sectiune titlu="Regulile tale" nota="Se aplică pe toate conturile." />

          <Reveal intarziere={60}>
            <Card>
              <Text style={st.eticheta}>Risc implicit pe tranzacție</Text>
              <View style={st.optiuni}>
                {RISCURI.map((r) => (
                  <Optiune
                    key={r}
                    text={`${r}%`}
                    activ={risc === r}
                    onPress={() => { setSalvat(false); setRisc(r); }}
                  />
                ))}
              </View>
              {riscBani != null ? (
                <Text style={st.echivalent}>
                  ≈ {bani(riscBani, moneda, false)} pe tranzacție, la soldul de acum.
                </Text>
              ) : null}

              <Text style={[st.eticheta, { marginTop: T.spacing.lg }]}>
                Maxim de tranzacții pe zi
              </Text>
              <View style={st.optiuni}>
                {LIMITE.map((n) => (
                  <Optiune
                    key={n}
                    text={String(n)}
                    activ={maxPeZi === n}
                    onPress={() => { setSalvat(false); setMaxPeZi(n); }}
                  />
                ))}
              </View>

              <Text style={[st.eticheta, { marginTop: T.spacing.lg }]}>
                Zile în care nu tranzacționezi
              </Text>
              <View style={st.optiuni}>
                {ZILE.map((z, i) => (
                  <Optiune
                    key={z}
                    text={z}
                    activ={zileOprite?.includes(i) ?? false}
                    rosu
                    onPress={() => {
                      setSalvat(false);
                      setZileOprite((p) =>
                        (p ?? []).includes(i) ? (p ?? []).filter((x) => x !== i) : [...(p ?? []), i],
                      );
                    }}
                  />
                ))}
              </View>

              {d.user.noTradeHoursStart && d.user.noTradeHoursEnd ? (
                <Text style={st.echivalent}>
                  Ore fără tranzacții: {d.user.noTradeHoursStart}–{d.user.noTradeHoursEnd}. Se schimbă de pe site.
                </Text>
              ) : null}

              <Buton
                eticheta={salvat ? "Salvat" : "Salvează regulile"}
                onPress={salveazaReguli}
                incarca={salveaza}
                plin
                style={{ marginTop: T.spacing.lg }}
                iconita={
                  <Ionicons name={salvat ? "checkmark-circle" : "save-outline"} size={16} color="#ffffff" />
                }
              />
            </Card>
          </Reveal>

          <Sectiune titlu="Limitele conturilor" nota="Se pun pe fiecare cont, de pe site." />

          {d.accounts.map((a, i) => (
            <Reveal key={a.id} intarziere={90 + i * 50} style={{ marginBottom: T.spacing.md }}>
              <Card nivel={1} culoareMuchie={a.isActive ? T.accent.line : "rgba(255,255,255,0.04)"}>
                <View style={st.antetCont}>
                  <Text style={st.numeCont} numberOfLines={1}>{a.name}</Text>
                  {a.isActive ? <Insigna text="Selectat" /> : null}
                </View>
                <Rand cheie="Sold" valoare={bani(Number(a.balance), a.currency, false)} />
                <Rand
                  cheie="Pierdere zilnică maximă"
                  valoare={a.maxDailyLossPct ? procent(Number(a.maxDailyLossPct), 1) : "nesetată"}
                  culoare={a.maxDailyLossPct ? T.ink.i1 : T.ink.i4}
                />
                <Rand
                  cheie="Drawdown maxim"
                  valoare={a.maxDrawdownPct ? procent(Number(a.maxDrawdownPct), 1) : "nesetat"}
                  culoare={a.maxDrawdownPct ? T.ink.i1 : T.ink.i4}
                />
              </Card>
            </Reveal>
          ))}
        </>
      )}
    </Ecran>
  );
}

function Optiune({
  text, activ, onPress, rosu = false,
}: {
  text: string;
  activ: boolean;
  onPress: () => void;
  rosu?: boolean;
}) {
  const culoare = rosu ? T.pnl.loss : T.accent.base;
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={[
        st.optiune,
        activ && {
          backgroundColor: rosu ? "rgba(251,113,133,0.12)" : T.accent.soft,
          borderColor: rosu ? "rgba(251,113,133,0.30)" : T.accent.line,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: activ }}
    >
      <Text style={[st.textOptiune, activ && { color: culoare }]}>{text}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  verdictRand: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  verdictIcon: {
    width: 42,
    height: 42,
    borderRadius: T.radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  verdict: {
    fontSize: T.fontSize.base,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.tight,
  },
  verdictNota: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
    lineHeight: 16,
  },
  linie: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.line.l1,
    marginVertical: T.spacing.lg,
  },
  pnlAzi: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  etichetaMica: {
    color: T.ink.i4,
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.wider,
    marginBottom: 5,
  },
  subBara: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: T.spacing.sm,
  },
  faraLimita: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: T.spacing.lg,
    lineHeight: 17,
  },
  numarator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: T.spacing.lg,
  },
  numaratorText: {
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  eticheta: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: T.tracking.wider,
    marginBottom: T.spacing.sm,
  },
  optiuni: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  optiune: {
    minWidth: 52,
    minHeight: 36,
    paddingHorizontal: T.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: T.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    backgroundColor: T.surface.s3,
  },
  textOptiune: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  echivalent: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: T.spacing.sm,
  },
  antetCont: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: T.spacing.sm,
    marginBottom: T.spacing.sm,
  },
  numeCont: {
    flex: 1,
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
