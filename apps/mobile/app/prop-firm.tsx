import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { tr } from "../src/lib/i18n";
import { Text } from "../src/ui/Text";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api, ApiError } from "../src/lib/api";
import { useRouter } from "expo-router";
import { useCerere } from "../src/lib/useCerere";
import { bani, numar, procent } from "../src/lib/format";
import { Camp } from "../src/ui/Camp";
import { Card } from "../src/ui/Card";
import { Buton } from "../src/ui/Buton";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { RollingNumber } from "../src/ui/RollingNumber";
import { BaraProgres, Gol, Insigna } from "../src/ui/parti";
import { T, tonPnl } from "../src/theme";
import { umple } from "../src/lib/i18n";

// ── Prop firm ────────────────────────────────────────────────────────────────
//
// Un challenge se pierde din două motive, nu din unul: pierderea zilei și
// drawdown-ul total. De aceea ecranul are TREI bare, nu una — ținta de profit
// plus cele două limite. O singură bară de progres ar fi spus „ești la 60%”
// exact în ziua în care contul e la un pas de a fi pierdut.
//
// LIMITELE SE DESENEAZĂ CA UMPLERE, nu ca distanță rămasă. „Ai consumat 78%
// din pierderea zilnică permisă" se citește ca pericol; „mai ai 22%” se
// citește ca permisiune.
//
// REGULILE SE PUN TOT DE AICI. Cifrele vin de la firmă, dar cineva trebuie să
// le scrie undeva, iar `PATCH /api/propfirm` le acceptă de oriunde. Înainte,
// un cont fără reguli spunea „se completează pe site" — adică ecranul care
// există ca să te avertizeze că pierzi challenge-ul te trimitea în browser
// exact când voia să te ajute.

interface Cont {
  id: string;
  name: string;
  type: string;
  currency: string;
  initialBalance: number;
  balance: number;
  rules: {
    propFirm: string | null;
    profitTarget: number | null;
    maxDailyLossPct: number | null;
    maxDrawdownPct: number | null;
    minTradingDays: number | null;
  };
  progress: {
    netPnl: number;
    profitPct: number;
    dailyLossPct: number;
    maxDrawdownPct: number;
    tradingDays: number;
  };
  status: "PASSED" | "FAILED" | "IN_PROGRESS" | "NO_RULES";
}

const STARE: Record<Cont["status"], { text: string; culoare: string; iconita: React.ComponentProps<typeof Ionicons>["name"] }> = {
  PASSED: { text: "Trecut", culoare: T.pnl.gain, iconita: "trophy" },
  FAILED: { text: "Pierdut", culoare: T.pnl.loss, iconita: "close-circle" },
  IN_PROGRESS: { text: "În desfășurare", culoare: T.accent.base, iconita: "hourglass" },
  NO_RULES: { text: "Fără reguli", culoare: T.ink.i4, iconita: "help-circle-outline" },
};

export default function PropFirm() {
  const router = useRouter();
  const c = useCerere<{ accounts: Cont[] }>(
    () => api.propfirm.list() as Promise<{ accounts: Cont[] }>,
  );
  const conturi = c.date?.accounts ?? [];

  return (
    <Ecran
      titlu="Prop firm"
      subtitlu={conturi.length > 0 ? `${conturi.length} ${conturi.length === 1 ? "cont" : "conturi"}` : "Regulile challenge-ului"}
      incarca={c.incarca && conturi.length === 0}
      scheletRanduri={3}
      reimprospateaza={c.reimprospateaza}
      onReia={c.reia}
      eroare={c.eroare}
    >
      {conturi.length === 0 ? (
        <Gol
          iconita="ribbon-outline"
          titlu="Niciun cont de challenge"
          text="Ecranul urmărește cele două limite care te pot elimina — pierderea zilei și drawdown-ul — plus ținta de profit. Are nevoie de un cont cu regulile firmei puse pe el."
          actiune={
            <Buton
              eticheta="Adaugă un cont de challenge"
              onPress={() => router.push("/cont-nou")}
              iconita={<Ionicons name="add" size={16} color="#ffffff" />}
            />
          }
        />
      ) : (
        conturi.map((x, i) => (
          <Reveal key={x.id} intarziere={i * 70} style={{ marginBottom: T.spacing.md }}>
            <CardChallenge cont={x} onSchimbat={c.reia} />
          </Reveal>
        ))
      )}
    </Ecran>
  );
}

/** Aceleași cifre ca la crearea contului. O singură listă, ca să nu apară
 *  două seturi de presetări care se contrazic. */
const FIRME = [
  { nume: "FTMO", tinta: 10, zi: 5, dd: 10, zile: 4 },
  { nume: "The5ers", tinta: 8, zi: 4, dd: 6, zile: 3 },
  { nume: "FundedNext", tinta: 8, zi: 5, dd: 10, zile: 5 },
  { nume: "MyForexFunds", tinta: 8, zi: 5, dd: 12, zile: 5 },
];

function CardChallenge({ cont, onSchimbat }: { cont: Cont; onSchimbat: () => void }) {
  const s = STARE[cont.status];
  const r = cont.rules;
  const p = cont.progress;

  const [editeaza, setEditeaza] = React.useState(false);
  const [firma, setFirma] = React.useState(r.propFirm ?? "");
  const [tinta, setTinta] = React.useState(r.profitTarget != null ? String(r.profitTarget) : "");
  const [zi, setZi] = React.useState(r.maxDailyLossPct != null ? String(r.maxDailyLossPct) : "");
  const [dd, setDd] = React.useState(r.maxDrawdownPct != null ? String(r.maxDrawdownPct) : "");
  const [zileMin, setZileMin] = React.useState(r.minTradingDays != null ? String(r.minTradingDays) : "");
  const [salveaza, setSalveaza] = React.useState(false);
  const [eroare, setEroare] = React.useState<string | null>(null);

  const aplicaPreset = (p_: (typeof FIRME)[number]) => {
    Haptics.selectionAsync().catch(() => {});
    setFirma(p_.nume);
    setTinta(String(p_.tinta));
    setZi(String(p_.zi));
    setDd(String(p_.dd));
    setZileMin(String(p_.zile));
  };

  const salveazaReguli = async () => {
    // Un câmp gol înseamnă „nu am regula asta", nu zero: ruta acceptă `null`,
    // deci se poate și șterge un prag pus greșit.
    const nr = (v: string) => {
      const t = v.trim().replace(",", ".");
      if (t === "") return null;
      const n = Number(t);
      return Number.isFinite(n) ? n : NaN;
    };
    const valori = { profitTarget: nr(tinta), maxDailyLossPct: nr(zi), maxDrawdownPct: nr(dd), minTradingDays: nr(zileMin) };
    if (Object.values(valori).some((v) => Number.isNaN(v))) {
      setEroare("Toate pragurile se scriu în cifre.");
      return;
    }
    setSalveaza(true);
    setEroare(null);
    try {
      await api.propfirm.update({
        accountId: cont.id,
        propFirm: firma.trim() === "" ? null : firma.trim(),
        ...valori,
        minTradingDays: valori.minTradingDays == null ? null : Math.round(valori.minTradingDays),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setEditeaza(false);
      onSchimbat();
    } catch (e) {
      setEroare(e instanceof ApiError ? e.message : "Nu am putut salva regulile.");
    } finally {
      setSalveaza(false);
    }
  };

  const consumatZi = r.maxDailyLossPct ? p.dailyLossPct / r.maxDailyLossPct : 0;
  const consumatDd = r.maxDrawdownPct ? p.maxDrawdownPct / r.maxDrawdownPct : 0;
  const spreTinta = r.profitTarget ? p.profitPct / r.profitTarget : 0;

  return (
    <Card
      culoareMuchie={
        cont.status === "FAILED"
          ? "rgba(251,113,133,0.40)"
          : cont.status === "PASSED"
            ? "rgba(52,211,153,0.40)"
            : T.accent.line
      }
    >
      <View style={st.antet}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={st.nume} numberOfLines={1}>{cont.name}</Text>
          <Text style={st.sub} numberOfLines={1}>
            {[r.propFirm, bani(cont.initialBalance, cont.currency, false)].filter(Boolean).join(" · ")}
          </Text>
        </View>
        <View style={[st.stare, { backgroundColor: `${s.culoare}1F` }]}>
          <Ionicons name={s.iconita} size={12} color={s.culoare} />
          <Text style={[st.textStare, { color: s.culoare }]}>{s.text}</Text>
        </View>
      </View>

      <View style={st.sold}>
        <RollingNumber
          value={bani(cont.balance, cont.currency, false)}
          size={T.fontSize.xl}
          color={T.ink.i1}
        />
        <Text style={[st.delta, { color: tonPnl(p.netPnl) }]}>
          {bani(p.netPnl, cont.currency)} · {procent(p.profitPct, 2)}
        </Text>
      </View>

      {cont.status === "NO_RULES" && !editeaza ? (
        <>
          <Text style={st.faraReguli}>
            Contul n-are regulile firmei puse. Fără ele nu pot spune dacă
            challenge-ul e pe drumul bun — sunt trei cifre din contractul firmei:
            ținta de profit, pierderea zilnică maximă și drawdown-ul.
          </Text>
          <Buton
            eticheta="Pune regulile firmei"
            onPress={() => { Haptics.selectionAsync().catch(() => {}); setEditeaza(true); }}
            plin
            style={{ marginTop: T.spacing.lg }}
            iconita={<Ionicons name="options-outline" size={16} color="#ffffff" />}
          />
        </>
      ) : editeaza ? null : (
        <View style={st.bare}>
          {r.profitTarget != null ? (
            <Masura
              eticheta="Ținta de profit"
              valoare={umple("{p1} din {p2}", { p1: procent(p.profitPct, 2), p2: procent(r.profitTarget, 0) })}
              fractiune={spreTinta}
              culoare={spreTinta >= 1 ? T.pnl.gain : T.accent.base}
            />
          ) : null}

          {r.maxDailyLossPct != null ? (
            <Masura
              eticheta="Pierderea zilei, consumată"
              valoare={umple("{p1} din {p2}", { p1: procent(p.dailyLossPct, 2), p2: procent(r.maxDailyLossPct, 0) })}
              fractiune={consumatZi}
              culoare={consumatZi >= 1 ? T.pnl.loss : consumatZi >= 0.7 ? T.state.warn : T.ink.i3}
              pericol
            />
          ) : null}

          {r.maxDrawdownPct != null ? (
            <Masura
              eticheta="Drawdown, consumat"
              valoare={umple("{p1} din {p2}", { p1: procent(p.maxDrawdownPct, 2), p2: procent(r.maxDrawdownPct, 0) })}
              fractiune={consumatDd}
              culoare={consumatDd >= 1 ? T.pnl.loss : consumatDd >= 0.7 ? T.state.warn : T.ink.i3}
              pericol
            />
          ) : null}

          {r.minTradingDays != null ? (
            <Masura
              eticheta="Zile de tranzacționare"
              valoare={umple("{p1} din {p2}", { p1: numar(p.tradingDays, 0), p2: numar(r.minTradingDays, 0) })}
              fractiune={p.tradingDays / r.minTradingDays}
              culoare={p.tradingDays >= r.minTradingDays ? T.pnl.gain : T.accent.base}
            />
          ) : null}
        </View>
      )}

      {editeaza ? (
        <View style={st.formular}>
          <Text style={st.ajutorFormular}>
            Cifrele sunt în contractul firmei. Alege firma dacă e în listă, sau
            scrie-le tu. Lasă gol ce firma ta nu cere.
          </Text>

          <View style={st.presetari}>
            {FIRME.map((x) => (
              <Pressable
                key={x.nume}
                onPress={() => aplicaPreset(x)}
                style={[st.preset, firma === x.nume && st.presetActiv]}
                accessibilityRole="button"
              >
                <Text style={[st.textPreset, firma === x.nume && { color: T.accent.base }]}>
                  {x.nume}
                </Text>
              </Pressable>
            ))}
          </View>

          <Camp
            eticheta="Firma"
            valoare={firma}
            onChange={setFirma}
            placeholder="FTMO"
            style={{ marginTop: T.spacing.sm }}
          />

          <View style={st.randCampuri}>
            <Camp
              eticheta="Ținta de profit"
              valoare={tinta}
              onChange={setTinta}
              placeholder="10"
              tastatura="decimal-pad"
              numeric
              sufix="%"
              style={{ flex: 1 }}
            />
            <Camp
              eticheta="Zile minime"
              valoare={zileMin}
              onChange={setZileMin}
              placeholder="4"
              tastatura="number-pad"
              numeric
              style={{ flex: 1 }}
            />
          </View>

          <View style={st.randCampuri}>
            <Camp
              eticheta="Pierdere/zi"
              valoare={zi}
              onChange={setZi}
              placeholder="5"
              tastatura="decimal-pad"
              numeric
              sufix="%"
              style={{ flex: 1 }}
            />
            <Camp
              eticheta="Drawdown maxim"
              valoare={dd}
              onChange={setDd}
              placeholder="10"
              tastatura="decimal-pad"
              numeric
              sufix="%"
              style={{ flex: 1 }}
            />
          </View>

          {eroare ? <Text style={st.eroareFormular}>{eroare}</Text> : null}

          <Buton
            eticheta="Salvează regulile"
            onPress={() => { void salveazaReguli(); }}
            incarca={salveaza}
            plin
            style={{ marginTop: T.spacing.md }}
            iconita={<Ionicons name="save-outline" size={16} color="#ffffff" />}
          />
          <Buton
            eticheta="Renunță"
            varianta="secundar"
            onPress={() => { setEditeaza(false); setEroare(null); }}
            plin
            style={{ marginTop: T.spacing.sm }}
          />
        </View>
      ) : cont.status !== "NO_RULES" ? (
        <Pressable
          onPress={() => { Haptics.selectionAsync().catch(() => {}); setEditeaza(true); }}
          style={st.randEditare}
          accessibilityRole="button"
          accessibilityLabel={tr("Schimbă regulile firmei")}
          hitSlop={6}
        >
          <Ionicons name="create-outline" size={13} color={T.ink.i4} />
          <Text style={st.textEditare}>Schimbă regulile</Text>
        </Pressable>
      ) : null}

      {!editeaza && cont.status === "IN_PROGRESS" && r.maxDrawdownPct != null ? (
        <View style={st.margine}>
          <Ionicons name="information-circle-outline" size={13} color={T.ink.i4} />
          <Text style={st.textMargine}>
            Mai ai {procent(Math.max(0, r.maxDrawdownPct - p.maxDrawdownPct), 2)} de drawdown
            până la eliminare{r.maxDailyLossPct != null
              ? umple(", și {p1} azi", { p1: procent(Math.max(0, r.maxDailyLossPct - p.dailyLossPct), 2) })
              : ""}.
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

function Masura({
  eticheta, valoare, fractiune, culoare, pericol = false,
}: {
  eticheta: string;
  valoare: string;
  fractiune: number;
  culoare: string;
  pericol?: boolean;
}) {
  return (
    <View style={{ marginBottom: T.spacing.md }}>
      <View style={st.randMasura}>
        <Text style={st.etichetaMasura}>{eticheta}</Text>
        <Text style={[st.valoareMasura, { color: culoare }]}>{valoare}</Text>
      </View>
      <BaraProgres fractiune={fractiune} culoare={culoare} inaltime={pericol ? 6 : 5} />
    </View>
  );
}

const st = StyleSheet.create({
  formular: {
    marginTop: T.spacing.lg,
    paddingTop: T.spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.line.l1,
  },
  ajutorFormular: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  presetari: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: T.spacing.md },
  preset: {
    paddingHorizontal: T.spacing.md,
    paddingVertical: 7,
    borderRadius: T.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l2,
    backgroundColor: T.surface.s3,
  },
  presetActiv: { backgroundColor: T.accent.soft, borderColor: T.accent.line },
  textPreset: {
    color: T.ink.i3,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_700Bold",
  },
  randCampuri: { flexDirection: "row", gap: T.spacing.md, marginTop: T.spacing.sm },
  eroareFormular: {
    color: T.pnl.loss,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: T.spacing.sm,
  },
  randEditare: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: T.spacing.md,
    alignSelf: "flex-start",
  },
  textEditare: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_700Bold",
  },
  antet: { flexDirection: "row", alignItems: "center", gap: T.spacing.sm },
  nume: {
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.tight,
  },
  sub: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  stare: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: T.radius.sm,
  },
  textStare: {
    fontSize: 10,
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.wide,
  },
  sold: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: T.spacing.sm,
    marginTop: T.spacing.lg,
    marginBottom: T.spacing.lg,
  },
  delta: {
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_700Bold",
  },
  bare: { marginTop: T.spacing.xs },
  randMasura: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  etichetaMasura: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
  valoareMasura: {
    fontSize: T.fontSize.xs,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  faraReguli: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  margine: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: T.spacing.xs,
    paddingTop: T.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.line.l1,
  },
  textMargine: {
    flex: 1,
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
});
