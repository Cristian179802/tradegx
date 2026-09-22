import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "../src/ui/Text";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api } from "../src/lib/api";
import { useCerere } from "../src/lib/useCerere";
import { dataScurta } from "../src/lib/format";
import { Card } from "../src/ui/Card";
import { Buton } from "../src/ui/Buton";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { Insigna, Sectiune } from "../src/ui/parti";
import { T, cifre } from "../src/theme";
import { umple } from "../src/lib/i18n";

// ── Abonament ────────────────────────────────────────────────────────────────
//
// Ecranul ăsta e scris pentru cineva care a instalat aplicația și N-A VĂZUT
// NICIODATĂ site-ul. Deci nu începe cu „alege un plan”, ci cu ce e TradeGX și
// ce primești — abia apoi prețurile, comparația completă și întrebările.
//
// TOT TEXTUL VINE DE LA SERVER (`/api/pricing`), din același dicționar ca
// pagina web, iar sumele din aceeași constantă ca Stripe. Copiate în aplicație,
// ar fi rămas în urmă la prima schimbare de preț — un tabel care promite
// altceva decât încasezi e cea mai scumpă greșeală de pe ecranul ăsta.
//
// COMPARAȚIA E PE COLOANE, nu tabel lat. Un tabel cu patru coloane pe un ecran
// de cinci țoli fie se taie, fie devine ilizibil. Aici alegi planul de sus și
// vezi ce include EL, cu o bifă sau o linie pe fiecare rând — aceleași rânduri,
// în aceeași ordine ca pe site.
//
// NU SE CUMPĂRĂ NIMIC DE AICI, și e o decizie, nu o scăpare.
//
// Google Play cere ca orice conținut digital cumpărat DIN aplicație să treacă
// prin Play Billing, și interzice explicit trimiterea omului în altă parte ca
// să plătească — „anti-steering". Un buton care deschidea Stripe într-o
// fereastră era primul lucru la care s-ar fi uitat la review, și motiv sigur
// de respingere.
//
// Deci ecranul spune ce e TradeGX, pe ce plan ești și ce include fiecare
// treaptă — fără prețuri, fără butoane de cumpărare, fără îndrumări spre
// site. Cine are PRO cumpărat în altă parte îl are și aici, fiindcă planul
// vine de la server odată cu contul.
//
// `lib/plata.ts` rămâne în cod, nefolosit: dacă într-o zi punem Play Billing,
// se schimbă funcția `cumpara()` și butoanele se întorc aici.

interface Plan {
  id: "free" | "pro" | "premium";
  nume: string;
  descriere: string;
  lunar: number;
  anual: number;
  anualPeLuna: number;
  nota: string;
  buton: string;
  popular?: boolean;
  eticheta?: string;
  puncte: string[];
}

interface Preturi {
  simbol: string;
  economiePct: number;
  titlu: string;
  subtitlu: string;
  etichetaLunar: string;
  etichetaAnual: string;
  etichetaEconomie: string;
  planuri: Plan[];
  comparatie: {
    titlu: string;
    capete: string[];
    randuri: { nume: string; free: boolean | string; pro: boolean | string; premium: boolean | string }[];
  };
  intrebari: { titlu: string; lista: { intrebare: string; raspuns: string }[] };
}

interface Stare {
  stripeConfigured: boolean;
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    trialEnd: string | null;
  } | null;
}

const NUME_STARE: Record<string, string> = {
  ACTIVE: "activ",
  TRIALING: "în perioada de probă",
  PAST_DUE: "plată restantă",
  CANCELED: "anulat",
  INCOMPLETE: "neterminat",
};

export default function Abonament() {
  const preturi = useCerere<Preturi>(() => api.pricing() as Promise<Preturi>);
  const stare = useCerere<Stare>(() => api.abonament.stare() as Promise<Stare>);

  const [ales, setAles] = React.useState<"free" | "pro" | "premium">("pro");
  const [mesaj, setMesaj] = React.useState<string | null>(null);

  const p = preturi.date;
  const s = stare.date?.subscription ?? null;
  const planCurent = (s?.plan ?? "FREE").toLowerCase();
  const areAbonament = planCurent === "pro" || planCurent === "premium";

  const zileTrial = React.useMemo(() => {
    if (!s?.trialEnd) return null;
    const ms = new Date(s.trialEnd).getTime() - Date.now();
    return ms > 0 ? Math.ceil(ms / 86_400_000) : 0;
  }, [s?.trialEnd]);

  const planAles = p?.planuri.find((x) => x.id === ales) ?? null;

  return (
    <Ecran
      titlu="Abonament"
      subtitlu={p?.subtitlu ?? "Ce primești și cât costă"}
      incarca={preturi.incarca && !p}
      scheletRanduri={4}
      reimprospateaza={preturi.reimprospateaza || stare.reimprospateaza}
      onReia={() => { preturi.reia(); stare.reia(); }}
      eroare={mesaj ?? preturi.eroare}
    >
      {!p ? null : (
        <>
          {/* ── Unde ești acum ── */}
          <Reveal>
            <Card culoareMuchie={areAbonament ? "rgba(52,211,153,0.35)" : T.accent.line}>
              <View style={st.antetStare}>
                <View style={[st.iconStare, areAbonament && { backgroundColor: "rgba(52,211,153,0.12)" }]}>
                  <Ionicons
                    name={areAbonament ? "shield-checkmark" : "person-outline"}
                    size={19}
                    color={areAbonament ? T.pnl.gain : T.accent.base}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={st.etichetaStare}>PLANUL TĂU</Text>
                  <Text style={st.numePlanCurent}>
                    {planCurent === "premium" ? "Premium" : planCurent === "pro" ? "PRO" : "Gratuit"}
                    {s?.status && NUME_STARE[s.status] ? ` · ${NUME_STARE[s.status]}` : ""}
                  </Text>
                </View>
                {zileTrial != null && zileTrial > 0 ? (
                  <Insigna
                    text={umple(zileTrial === 1 ? "{n} zi probă" : "{n} zile probă", { n: zileTrial })}
                    culoare={T.state.warn}
                    fundal="rgba(251,191,36,0.14)"
                  />
                ) : null}
              </View>

              {s?.currentPeriodEnd ? (
                <Text style={st.notaStare}>
                  {s.cancelAtPeriodEnd
                    ? umple("Se oprește pe {p1}. Până atunci ai tot.", { p1: dataScurta(s.currentPeriodEnd) })
                    : umple("Se reînnoiește pe {p1}.", { p1: dataScurta(s.currentPeriodEnd) })}
                </Text>
              ) : zileTrial != null && zileTrial > 0 ? (
                <Text style={st.notaStare}>
                  Proba se termină pe {dataScurta(s?.trialEnd)}. După aceea treci pe Gratuit,
                  fără să-ți ceară nimeni cardul.
                </Text>
              ) : null}

            </Card>
          </Reveal>

          {/* ── Ce e TradeGX ── */}
          <Sectiune titlu="Ce e TradeGX" />
          <Reveal intarziere={50}>
            <Card nivel={1}>
              <Text style={st.intro}>
                Un jurnal de trading care măsoară, nu unul în care doar notezi. Îți ia
                tranzacțiile de la broker sau din CSV, calculează ce funcționează și ce te
                costă, și te oprește înainte să-ți depășești limitele.
              </Text>
              <View style={st.puncteIntro}>
                {[
                  "Jurnal cu note înainte și după fiecare tranzacție",
                  "Analize: rată de câștig, profit factor, drawdown, Sharpe",
                  "Edge Finder — unde chiar ai avantaj și unde pierzi constant",
                  "Manager de risc care îți spune dacă mai ai voie azi",
                  "Academie completă: nouă module, lecții, quiz-uri, glosar",
                ].map((x) => (
                  <View key={x} style={st.randIntro}>
                    <Ionicons name="checkmark" size={14} color={T.accent.base} />
                    <Text style={st.textIntro}>{x}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </Reveal>

          {/* ── Cardurile de plan ── */}
          {p.planuri.map((plan, i) => {
            const esteCurent = plan.id === planCurent;
            return (
              <Reveal key={plan.id} intarziere={i * 60} style={{ marginBottom: T.spacing.md }}>
                <Card
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setAles(plan.id);
                  }}
                  culoareMuchie={
                    plan.id === ales ? T.accent.line : "rgba(255,255,255,0.04)"
                  }
                  accesibilEticheta={plan.nume}
                >
                  <View style={st.antetPlan}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={st.randNumePlan}>
                        <Text style={st.numePlan}>{plan.nume}</Text>
                        {plan.popular ? (
                          <Insigna text="Cel mai ales" culoare={T.accent.base} fundal={T.accent.soft} />
                        ) : null}
                        {plan.eticheta ? (
                          <Insigna text={plan.eticheta} culoare={T.state.warn} fundal="rgba(251,191,36,0.14)" />
                        ) : null}
                        {esteCurent ? (
                          <Insigna text="Ai deja" culoare={T.pnl.gain} fundal="rgba(52,211,153,0.12)" />
                        ) : null}
                      </View>
                      <Text style={st.descriere} numberOfLines={2}>{plan.descriere}</Text>
                    </View>
                    {plan.id === ales ? (
                      <Ionicons name="checkmark-circle" size={20} color={T.accent.base} />
                    ) : null}
                  </View>

                  <View style={st.punctePlan}>
                    {plan.puncte.map((x) => (
                      <View key={x} style={st.randPunct}>
                        <Ionicons name="checkmark" size={13} color={T.pnl.gain} />
                        <Text style={st.textPunct}>{x}</Text>
                      </View>
                    ))}
                  </View>

                </Card>
              </Reveal>
            );
          })}

          {/* ── Comparația ── */}
          <Sectiune
            titlu={p.comparatie.titlu}
            nota={umple("Ce include {plan}. Atinge un plan de mai sus ca să schimbi coloana.", { plan: planAles?.nume ?? "" })}
          />
          <Card faraPadding>
            {p.comparatie.randuri.map((r, i) => {
              const v = ales === "free" ? r.free : ales === "pro" ? r.pro : r.premium;
              return (
                <View key={`${r.nume}-${i}`} style={[st.randComp, i > 0 && st.cuLinie]}>
                  <Text style={[st.numeComp, v === false && { color: T.ink.i4 }]} numberOfLines={2}>
                    {r.nume}
                  </Text>
                  {v === true ? (
                    <Ionicons name="checkmark-circle" size={17} color={T.pnl.gain} />
                  ) : v === false ? (
                    <Ionicons name="remove" size={17} color={T.ink.i4} />
                  ) : (
                    <Text style={[st.valoareComp, cifre]}>{v}</Text>
                  )}
                </View>
              );
            })}
          </Card>

          <Text style={st.subsol}>
            Planul tău se vede aici imediat ce se schimbă. Funcțiile din PRO se
            deblochează singure, fără să reinstalezi nimic.
          </Text>
        </>
      )}
    </Ecran>
  );
}

function Intrebare({ q, a }: { q: string; a: string }) {
  const [deschis, setDeschis] = React.useState(false);
  return (
    <Card
      nivel={1}
      style={{ marginBottom: T.spacing.sm }}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        setDeschis((x) => !x);
      }}
    >
      <View style={st.randIntrebare}>
        <Text style={st.textIntrebare}>{q}</Text>
        <Ionicons name={deschis ? "chevron-up" : "chevron-down"} size={15} color={T.ink.i4} />
      </View>
      {deschis ? <Text style={st.raspuns}>{a}</Text> : null}
    </Card>
  );
}

const st = StyleSheet.create({
  antetStare: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  iconStare: {
    width: 40,
    height: 40,
    borderRadius: T.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.accent.soft,
  },
  etichetaStare: {
    color: T.ink.i4,
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.wider,
  },
  numePlanCurent: {
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontFamily: "Inter_800ExtraBold",
    marginTop: 3,
  },
  notaStare: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: T.spacing.md,
  },
  intro: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  puncteIntro: { marginTop: T.spacing.md, gap: 7 },
  randIntro: { flexDirection: "row", alignItems: "flex-start", gap: T.spacing.sm },
  textIntro: {
    flex: 1,
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  perioade: { flexDirection: "row", gap: 6, marginBottom: T.spacing.md },
  pastilaPerioada: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    minHeight: 40,
    borderRadius: T.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    backgroundColor: T.surface.s3,
  },
  pastilaActiva: { backgroundColor: T.accent.soft, borderColor: T.accent.line },
  textPerioada: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_700Bold",
  },
  economie: {
    color: T.pnl.gain,
    fontSize: 10,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  antetPlan: { flexDirection: "row", alignItems: "flex-start", gap: T.spacing.sm },
  randNumePlan: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  numePlan: {
    color: T.ink.i1,
    fontSize: T.fontSize.lg,
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.tight,
  },
  descriere: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    marginTop: 4,
  },
  randPret: { flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: T.spacing.lg },
  pret: {
    color: T.ink.i1,
    fontSize: T.fontSize["3xl"],
    fontFamily: "SpaceGrotesk_700Bold",
  },
  simbol: {
    color: T.ink.i2,
    fontSize: T.fontSize.lg,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  peLuna: {
    color: T.ink.i4,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
  },
  notaPret: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  punctePlan: { marginTop: T.spacing.lg, gap: 7 },
  randPunct: { flexDirection: "row", alignItems: "flex-start", gap: T.spacing.sm },
  textPunct: {
    flex: 1,
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  randComp: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: T.spacing.md,
    paddingHorizontal: T.spacing.lg,
    paddingVertical: T.spacing.md,
  },
  cuLinie: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: T.line.l1 },
  numeComp: {
    flex: 1,
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  valoareComp: {
    color: T.ink.i1,
    fontSize: T.fontSize.xs,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  randIntrebare: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: T.spacing.md,
  },
  textIntrebare: {
    flex: 1,
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_700Bold",
    lineHeight: 19,
  },
  raspuns: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    marginTop: T.spacing.sm,
  },
  subsol: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: T.spacing.lg,
    textAlign: "center",
  },
});
