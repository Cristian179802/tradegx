import * as React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../src/lib/api";
import { useCerere } from "../src/lib/useCerere";
import { bani, numar, procent } from "../src/lib/format";
import { Card } from "../src/ui/Card";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { RollingNumber } from "../src/ui/RollingNumber";
import { BaraProgres, Gol, Insigna } from "../src/ui/parti";
import { T, tonPnl } from "../src/theme";

// ── Prop firm ────────────────────────────────────────────────────────────────
//
// Un challenge se pierde din două motive, nu din unul: pierderea zilei și
// drawdown-ul total. De aceea ecranul are TREI bare, nu una — ținta de profit
// plus cele două limite. O singură bară de progres ar fi spus „ești la 60%"
// exact în ziua în care contul e la un pas de a fi pierdut.
//
// LIMITELE SE DESENEAZĂ CA UMPLERE, nu ca distanță rămasă. „Ai consumat 78%
// din pierderea zilnică permisă" se citește ca pericol; „mai ai 22%" se
// citește ca permisiune.
//
// Regulile se setează de pe site, pe fiecare cont. Aici se citesc — un
// formular de reguli pe telefon ar fi fost o a doua sursă de adevăr pentru
// cifre pe care le dă firma, nu utilizatorul.

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
          text="Se urmăresc conturile de tip challenge și cele reale. Se adaugă de pe site, împreună cu regulile firmei."
        />
      ) : (
        conturi.map((x, i) => (
          <Reveal key={x.id} intarziere={i * 70} style={{ marginBottom: T.spacing.md }}>
            <CardChallenge cont={x} />
          </Reveal>
        ))
      )}
    </Ecran>
  );
}

function CardChallenge({ cont }: { cont: Cont }) {
  const s = STARE[cont.status];
  const r = cont.rules;
  const p = cont.progress;

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

      {cont.status === "NO_RULES" ? (
        <Text style={st.faraReguli}>
          Contul n-are regulile firmei setate. Se completează pe site, la cont —
          fără ele nu pot spune dacă challenge-ul e pe drumul bun.
        </Text>
      ) : (
        <View style={st.bare}>
          {r.profitTarget != null ? (
            <Masura
              eticheta="Ținta de profit"
              valoare={`${procent(p.profitPct, 2)} din ${procent(r.profitTarget, 0)}`}
              fractiune={spreTinta}
              culoare={spreTinta >= 1 ? T.pnl.gain : T.accent.base}
            />
          ) : null}

          {r.maxDailyLossPct != null ? (
            <Masura
              eticheta="Pierderea zilei, consumată"
              valoare={`${procent(p.dailyLossPct, 2)} din ${procent(r.maxDailyLossPct, 0)}`}
              fractiune={consumatZi}
              culoare={consumatZi >= 1 ? T.pnl.loss : consumatZi >= 0.7 ? T.state.warn : T.ink.i3}
              pericol
            />
          ) : null}

          {r.maxDrawdownPct != null ? (
            <Masura
              eticheta="Drawdown, consumat"
              valoare={`${procent(p.maxDrawdownPct, 2)} din ${procent(r.maxDrawdownPct, 0)}`}
              fractiune={consumatDd}
              culoare={consumatDd >= 1 ? T.pnl.loss : consumatDd >= 0.7 ? T.state.warn : T.ink.i3}
              pericol
            />
          ) : null}

          {r.minTradingDays != null ? (
            <Masura
              eticheta="Zile de tranzacționare"
              valoare={`${numar(p.tradingDays, 0)} din ${numar(r.minTradingDays, 0)}`}
              fractiune={p.tradingDays / r.minTradingDays}
              culoare={p.tradingDays >= r.minTradingDays ? T.pnl.gain : T.accent.base}
            />
          ) : null}
        </View>
      )}

      {cont.status === "IN_PROGRESS" && r.maxDrawdownPct != null ? (
        <View style={st.margine}>
          <Ionicons name="information-circle-outline" size={13} color={T.ink.i4} />
          <Text style={st.textMargine}>
            Mai ai {procent(Math.max(0, r.maxDrawdownPct - p.maxDrawdownPct), 2)} de drawdown
            până la eliminare{r.maxDailyLossPct != null
              ? `, și ${procent(Math.max(0, r.maxDailyLossPct - p.dailyLossPct), 2)} azi`
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
  antet: { flexDirection: "row", alignItems: "center", gap: T.spacing.sm },
  nume: {
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontWeight: "700",
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
    fontWeight: "800",
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
    fontWeight: "700",
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
    fontWeight: "800",
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
