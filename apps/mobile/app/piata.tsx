import * as React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../src/lib/api";
import { useCerere } from "../src/lib/useCerere";
import { bani, numar } from "../src/lib/format";
import { Card } from "../src/ui/Card";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { RollingNumber } from "../src/ui/RollingNumber";
import { Gol, GrilaStatistici, Sectiune, Statistica } from "../src/ui/parti";
import { T, tonPnl, cifre } from "../src/theme";

// ── Piața azi ────────────────────────────────────────────────────────────────
//
// Două lucruri, în ordinea în care contează dimineața: unde ești TU (pulsul
// contului) și unde e piața (cotațiile zilei).
//
// SESIUNILE SE CALCULEAZĂ LOCAL, din ceasul telefonului. O rută care ar
// întoarce „Londra e deschisă" ar fi o cerere de rețea pentru ceva ce se știe
// din oră — și ar fi greșită pentru cineva aflat în alt fus.
//
// Cotațiile vin de la aceeași rută ca uneltele de pe site. Când furnizorul
// tace, rândul rămâne gol cu „—", nu cu ultima valoare știută: un preț vechi
// afișat ca actual e mai rău decât niciun preț.

const PERECHI = ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/CAD", "XAU/USD", "BTC/USD"];

/** Sesiunile, în ore UTC. Închiderile care trec de miezul nopții sunt notate ca atare. */
const SESIUNI = [
  { nume: "Sydney", de: 21, la: 6 },
  { nume: "Tokyo", de: 0, la: 9 },
  { nume: "Londra", de: 7, la: 16 },
  { nume: "New York", de: 12, la: 21 },
];

interface Puls {
  ok: boolean;
  alerts: number;
  pnlToday: number;
  tradesToday: number;
  openPositions: number;
  balance: number;
}

interface Cotatie {
  price?: string;
  percent_change?: string;
}

function deschisa(de: number, la: number, ora: number): boolean {
  return de < la ? ora >= de && ora < la : ora >= de || ora < la;
}

export default function Piata() {
  const c = useCerere<{ puls: Puls | null; cotatii: Record<string, Cotatie> }>(async () => {
    const [puls, q] = await Promise.all([
      (api.market.pulse() as Promise<Puls>).catch(() => null),
      (api.market.cotatii(PERECHI) as Promise<{ quotes: Record<string, Cotatie> }>)
        .then((r) => r.quotes ?? {})
        .catch(() => ({} as Record<string, Cotatie>)),
    ]);
    return { puls, cotatii: q };
  });

  const puls = c.date?.puls ?? null;
  const cotatii = c.date?.cotatii ?? {};
  const oraUtc = new Date().getUTCHours();
  const active = SESIUNI.filter((s) => deschisa(s.de, s.la, oraUtc));

  const cuDate = Object.values(cotatii).some((q) => q?.price != null);

  return (
    <Ecran
      titlu="Piața azi"
      subtitlu={
        active.length > 0
          ? `Deschis: ${active.map((s) => s.nume).join(", ")}`
          : "Toate sesiunile sunt închise"
      }
      incarca={c.incarca && !c.date}
      scheletRanduri={3}
      reimprospateaza={c.reimprospateaza}
      onReia={c.reia}
      eroare={c.eroare}
    >
      {puls ? (
        <Reveal>
          <Card>
            <GrilaStatistici>
              <Statistica
                eticheta="Rezultatul zilei"
                valoare={bani(puls.pnlToday, "")}
                culoare={tonPnl(puls.pnlToday)}
                marime={T.fontSize.xl}
                nota={`${puls.tradesToday} ${puls.tradesToday === 1 ? "tranzacție" : "tranzacții"}`}
                style={st.celula}
              />
              <Statistica
                eticheta="Sold"
                valoare={bani(puls.balance, "", false)}
                marime={T.fontSize.xl}
                intarziere={70}
                style={st.celula}
              />
              <Statistica
                eticheta="Poziții deschise"
                valoare={numar(puls.openPositions, 0)}
                marime={T.fontSize.lg}
                intarziere={140}
                culoare={puls.openPositions > 0 ? T.accent.base : T.ink.i1}
                style={st.celula}
              />
              <Statistica
                eticheta="Alerte necitite"
                valoare={numar(puls.alerts, 0)}
                marime={T.fontSize.lg}
                intarziere={210}
                culoare={puls.alerts > 0 ? T.state.warn : T.ink.i1}
                style={st.celula}
              />
            </GrilaStatistici>
          </Card>
        </Reveal>
      ) : null}

      <Sectiune titlu="Sesiuni" nota="După ora UTC. Suprapunerea Londra–New York e cea mai lichidă fereastră." />

      <Reveal intarziere={60}>
        <Card>
          {SESIUNI.map((s, i) => {
            const activa = deschisa(s.de, s.la, oraUtc);
            return (
              <View key={s.nume} style={[st.sesiune, i > 0 && st.cuLinie]}>
                <View style={[st.bulina, { backgroundColor: activa ? T.pnl.gain : T.line.l2 }]} />
                <Text style={[st.numeSesiune, activa && { color: T.ink.i1 }]}>{s.nume}</Text>
                <Text style={st.oreSesiune}>
                  {String(s.de).padStart(2, "0")}:00–{String(s.la).padStart(2, "0")}:00 UTC
                </Text>
                {activa ? (
                  <View style={st.deschis}>
                    <Text style={st.textDeschis}>DESCHIS</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </Card>
      </Reveal>

      <Sectiune titlu="Cotații" />

      {!cuDate ? (
        <Gol
          iconita="cloud-offline-outline"
          titlu="Cotațiile nu răspund"
          text="Furnizorul de prețuri nu e disponibil acum. Trage în jos ca să reîncerci."
        />
      ) : (
        <Reveal intarziere={90}>
          <Card faraPadding>
            {PERECHI.map((p, i) => {
              const q = cotatii[p];
              const pret = q?.price == null ? null : Number(q.price);
              const variatie = q?.percent_change == null ? null : Number(q.percent_change);
              return (
                <View key={p} style={[st.randCotatie, i > 0 && st.cuLinie]}>
                  <Text style={st.pereche}>{p}</Text>
                  <View style={{ alignItems: "flex-end" }}>
                    {pret == null ? (
                      <Text style={[st.pret, cifre, { color: T.ink.i4 }]}>—</Text>
                    ) : (
                      <RollingNumber
                        value={numar(pret, zecimale(p))}
                        size={T.fontSize.sm}
                        color={T.ink.i1}
                        intarziere={i * 40}
                      />
                    )}
                    {variatie != null ? (
                      <Text style={[st.variatie, { color: tonPnl(variatie) }]}>
                        {variatie > 0 ? "+" : variatie < 0 ? "−" : ""}
                        {Math.abs(variatie).toFixed(2)}%
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </Card>
        </Reveal>
      )}

      <View style={st.nota}>
        <Ionicons name="information-circle-outline" size={13} color={T.ink.i4} />
        <Text style={st.textNota}>
          Prețurile sunt informative, cu întârzierea furnizorului. Pentru execuție,
          contul tău la broker e singura referință.
        </Text>
      </View>
    </Ecran>
  );
}

function zecimale(pereche: string): number {
  const s = pereche.toUpperCase();
  if (s.includes("JPY")) return 3;
  if (s.startsWith("XAU") || s.startsWith("BTC") || s.startsWith("ETH")) return 2;
  return 5;
}

const st = StyleSheet.create({
  celula: { width: "50%" },
  sesiune: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.sm,
    paddingVertical: T.spacing.md,
  },
  cuLinie: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: T.line.l1 },
  bulina: { width: 7, height: 7, borderRadius: 4 },
  numeSesiune: {
    flex: 1,
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  oreSesiune: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  deschis: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: T.radius.sm,
    backgroundColor: "rgba(52,211,153,0.14)",
  },
  textDeschis: {
    color: T.pnl.gain,
    fontSize: 9,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.wide,
  },
  randCotatie: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: T.spacing.lg,
    paddingVertical: T.spacing.md,
  },
  pereche: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  pret: {
    fontSize: T.fontSize.sm,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  variatie: {
    fontSize: T.fontSize.xs,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  nota: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: T.spacing.lg,
  },
  textNota: {
    flex: 1,
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
});
