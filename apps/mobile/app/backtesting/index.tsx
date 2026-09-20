import * as React from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api, ApiError, URL_API } from "../../src/lib/api";
import { useCerere } from "../../src/lib/useCerere";
import { bani, candva, procent } from "../../src/lib/format";
import { Card } from "../../src/ui/Card";
import { Camp } from "../../src/ui/Camp";
import { Buton } from "../../src/ui/Buton";
import { Reveal } from "../../src/ui/Reveal";
import { Ecran } from "../../src/ui/Ecran";
import { Gol, Insigna, Segmente, Sectiune } from "../../src/ui/parti";
import { T, tonPnl, cifre } from "../../src/theme";

// ── Backtesting ──────────────────────────────────────────────────────────────
//
// Pe telefon se RULEAZĂ și se CITEȘTE un backtest, nu se construiește o
// strategie. Regulile unei strategii sunt zeci de condiții imbricate; un
// editor de reguli pe un ecran de cinci țoli ar fi fost o promisiune pe care
// n-ar fi folosit-o nimeni de două ori. Strategiile se scriu pe site.
//
// Ce chiar se face din tramvai: „ia strategia pe care am salvat-o aseară și
// dă-i drumul pe EURUSD, ultimele șase luni". Asta încape într-un card.
//
// RULAREA DUREAZĂ. Motorul aduce lumânări de la furnizor și le parcurge pe
// toate — zeci de secunde e normal. Butonul rămâne în starea de încărcare tot
// timpul, iar la final ecranul sare direct în rezultat: dacă l-ar lăsa pe om
// să-l caute singur în listă, ar crede că nu s-a întâmplat nimic.

interface Strategie {
  id: string;
  name: string;
  type: string;
  color: string | null;
  _count?: { backtests: number };
  backtests: {
    id: string;
    status: string;
    netPnl: string | null;
    winRate: string | null;
    createdAt: string;
  }[];
}

const INTERVALE = [
  { v: "M15", e: "M15" },
  { v: "H1", e: "H1" },
  { v: "H4", e: "H4" },
  { v: "D1", e: "D1" },
] as const;

const PERIOADE = [
  { v: "3", e: "3 luni" },
  { v: "6", e: "6 luni" },
  { v: "12", e: "1 an" },
  { v: "24", e: "2 ani" },
] as const;

const RISCURI = [
  { v: "0.5", e: "0.5%" },
  { v: "1", e: "1%" },
  { v: "2", e: "2%" },
] as const;

export default function Backtesting() {
  const router = useRouter();
  const c = useCerere<Strategie[]>(() => api.backtesting.strategies() as Promise<Strategie[]>);
  const strategii = c.date ?? [];

  const [aleasa, setAleasa] = React.useState<string | null>(null);
  const [simbol, setSimbol] = React.useState("EURUSD");
  const [interval, setInterval_] = React.useState<string>("H1");
  const [luni, setLuni] = React.useState<string>("6");
  const [risc, setRisc] = React.useState<string>("1");
  const [ruleaza, setRuleaza] = React.useState(false);
  const [eroare, setEroare] = React.useState<string | null>(null);

  const ruleazaAcum = async () => {
    if (!aleasa) return;
    const s = simbol.trim().toUpperCase();
    if (s.length < 3) {
      setEroare("Scrie un simbol valid, de exemplu EURUSD.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setRuleaza(true);
    setEroare(null);
    try {
      const sfarsit = new Date();
      const inceput = new Date();
      inceput.setMonth(inceput.getMonth() - Number(luni));

      const r = (await api.backtesting.run({
        strategyId: aleasa,
        symbol: s,
        timeframe: interval,
        startDate: inceput.toISOString(),
        endDate: sfarsit.toISOString(),
        initialBalance: 10000,
        riskPerTrade: Number(risc),
      })) as { backtestId: string; status?: string; error?: string };

      if (r.error) {
        // Ruta întoarce 200 cu `error` când motorul a pornit dar n-a putut
        // termina. E o eroare de date, nu de rețea — merită spusă ca atare.
        setEroare(r.error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      c.reia();
      router.push(`/backtesting/${r.backtestId}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        Alert.alert(
          "Ai terminat backtestele lunii",
          "Planul gratuit include trei backteste pe lună. Abonamentul se gestionează pe site.",
          [
            { text: "Mai târziu", style: "cancel" },
            { text: "Vezi planurile", onPress: () => { Linking.openURL(`${URL_API}/pricing`).catch(() => {}); } },
          ],
        );
      } else {
        setEroare(e instanceof ApiError ? e.message : "Rularea nu a pornit. Verifică semnalul.");
      }
    } finally {
      setRuleaza(false);
    }
  };

  return (
    <Ecran
      titlu="Backtesting"
      subtitlu={strategii.length > 0 ? `${strategii.length} ${strategii.length === 1 ? "strategie" : "strategii"}` : "Strategiile tale, pe date reale"}
      incarca={c.incarca && strategii.length === 0}
      scheletRanduri={3}
      reimprospateaza={c.reimprospateaza}
      onReia={c.reia}
      eroare={eroare ?? c.eroare}
    >
      {strategii.length === 0 ? (
        <Gol
          iconita="flask-outline"
          titlu="Nicio strategie salvată"
          text="Regulile unei strategii se scriu pe site — sunt prea multe pentru un ecran de telefon. După ce ai una, o rulezi de aici."
          actiune={
            <Buton
              eticheta="Deschide pe site"
              varianta="secundar"
              onPress={() => { Linking.openURL(`${URL_API}/backtesting`).catch(() => {}); }}
              iconita={<Ionicons name="open-outline" size={15} color={T.ink.i1} />}
            />
          }
        />
      ) : (
        <>
          <Sectiune titlu="Alege strategia" />

          {strategii.map((s, i) => (
            <Reveal key={s.id} intarziere={i * 55} style={{ marginBottom: T.spacing.sm }}>
              <CardStrategie
                s={s}
                aleasa={aleasa === s.id}
                onAlege={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setAleasa(aleasa === s.id ? null : s.id);
                  setEroare(null);
                }}
                onVeziUltimul={(id) => router.push(`/backtesting/${id}`)}
              />
            </Reveal>
          ))}

          {aleasa ? (
            <>
              <Sectiune titlu="Parametrii rulării" nota="Regulile strategiei rămân cele salvate pe site." />
              <Reveal>
                <Card culoareMuchie={T.accent.line}>
                  <Camp
                    eticheta="Simbol"
                    valoare={simbol}
                    onChange={(v) => setSimbol(v.toUpperCase())}
                    placeholder="EURUSD"
                    autoCapitalize="characters"
                  />

                  <Text style={st.eticheta}>Interval</Text>
                  <Segmente valori={INTERVALE} valoare={interval} onSchimba={setInterval_} style={st.segmente} />

                  <Text style={st.eticheta}>Perioadă</Text>
                  <Segmente valori={PERIOADE} valoare={luni} onSchimba={setLuni} style={st.segmente} />

                  <Text style={st.eticheta}>Risc pe tranzacție</Text>
                  <Segmente valori={RISCURI} valoare={risc} onSchimba={setRisc} style={st.segmente} />

                  <Buton
                    eticheta={ruleaza ? "Rulează…" : "Rulează backtestul"}
                    onPress={ruleazaAcum}
                    incarca={ruleaza}
                    plin
                    style={{ marginTop: T.spacing.md }}
                    iconita={<Ionicons name="play" size={15} color="#ffffff" />}
                  />
                  <Text style={st.notaRulare}>
                    Pornește de la un sold de 10.000. Poate dura câteva zeci de secunde —
                    motorul parcurge fiecare lumânare din perioada aleasă.
                  </Text>
                </Card>
              </Reveal>
            </>
          ) : null}
        </>
      )}
    </Ecran>
  );
}

function CardStrategie({
  s, aleasa, onAlege, onVeziUltimul,
}: {
  s: Strategie;
  aleasa: boolean;
  onAlege: () => void;
  onVeziUltimul: (id: string) => void;
}) {
  const ultim = s.backtests[0];
  const pnl = ultim?.netPnl == null ? null : Number(ultim.netPnl);

  return (
    <Card onPress={onAlege} culoareMuchie={aleasa ? T.accent.line : "rgba(255,255,255,0.04)"}>
      <View style={st.antet}>
        <View style={[st.bulina, { backgroundColor: s.color ?? T.accent.base }]} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={st.nume} numberOfLines={1}>{s.name}</Text>
          <Text style={st.tip} numberOfLines={1}>
            {s.type} · {s._count?.backtests ?? 0} {(s._count?.backtests ?? 0) === 1 ? "rulare" : "rulări"}
          </Text>
        </View>
        {aleasa ? <Ionicons name="checkmark-circle" size={18} color={T.accent.base} /> : null}
      </View>

      {ultim ? (
        <Pressable
          onPress={() => onVeziUltimul(ultim.id)}
          style={st.ultim}
          accessibilityRole="button"
          accessibilityLabel="Vezi ultimul rezultat"
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={st.etichetaUltim}>ULTIMA RULARE · {candva(ultim.createdAt)}</Text>
            <View style={st.randUltim}>
              {ultim.status === "COMPLETED" ? (
                <>
                  <Text style={[st.pnlUltim, cifre, { color: tonPnl(pnl) }]}>
                    {pnl == null ? "—" : bani(pnl, "")}
                  </Text>
                  {ultim.winRate ? (
                    <Text style={st.rataUltim}>{procent(Number(ultim.winRate))}</Text>
                  ) : null}
                </>
              ) : (
                <Insigna
                  text={ultim.status === "FAILED" ? "eșuat" : ultim.status.toLowerCase()}
                  culoare={ultim.status === "FAILED" ? T.pnl.loss : T.ink.i3}
                />
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={15} color={T.ink.i4} />
        </Pressable>
      ) : null}
    </Card>
  );
}

const st = StyleSheet.create({
  antet: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  bulina: { width: 10, height: 10, borderRadius: 5 },
  nume: {
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.tight,
  },
  tip: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  ultim: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.sm,
    marginTop: T.spacing.md,
    paddingTop: T.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.line.l1,
  },
  etichetaUltim: {
    color: T.ink.i4,
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.wide,
  },
  randUltim: { flexDirection: "row", alignItems: "baseline", gap: T.spacing.sm, marginTop: 3 },
  pnlUltim: {
    fontSize: T.fontSize.base,
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  rataUltim: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
  eticheta: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: T.tracking.wider,
    marginTop: T.spacing.sm,
  },
  segmente: { paddingVertical: T.spacing.sm, paddingRight: 0 },
  notaRulare: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    marginTop: T.spacing.sm,
  },
});
