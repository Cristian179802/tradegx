import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "../../../src/ui/Text";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  continutLocal,
  aduContinut,
  progresLocal,
  scrieProgres,
  textul,
  PROGRES_GOL,
  type ContinutAcademie,
  type Progres,
  type QuizQuestion,
} from "../../../src/lib/academia";
import { Card } from "../../../src/ui/Card";
import { Buton } from "../../../src/ui/Buton";
import { Reveal } from "../../../src/ui/Reveal";
import { Ecran } from "../../../src/ui/Ecran";
import { RollingNumber } from "../../../src/ui/RollingNumber";
import { BaraProgres, Gol } from "../../../src/ui/parti";
import { T } from "../../../src/theme";

// ── Quiz ─────────────────────────────────────────────────────────────────────
//
// O întrebare pe ecran, răspunsul se vede imediat, cu explicație. Un quiz în
// care afli abia la final ce ai greșit te învață mult mai puțin: ai uitat deja
// la ce te gândeai când ai ales.
//
// NU SE POATE SCHIMBA RĂSPUNSUL după ce l-ai dat. Altfel devine un joc de
// nimerit, iar scorul n-ar mai însemna nimic.
//
// GREȘELILE SE ȚIN MINTE (`missed`), nu doar scorul. Cifra aia e ce permite
// mai târziu o repetare țintită — exact întrebările la care cazi de fiecare
// dată, nu tot modulul de la capăt.
//
// SCORUL SALVAT E CEL MAI BUN, niciodată ultimul. Cine reia un quiz ca să
// recitească explicațiile n-are de ce să-și strice rezultatul.

export default function Quiz() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const router = useRouter();

  const [continut, setContinut] = React.useState<ContinutAcademie | null>(null);
  const [progres, setProgres] = React.useState<Progres>(PROGRES_GOL);
  const [incarca, setIncarca] = React.useState(true);

  const [index, setIndex] = React.useState(0);
  const [ales, setAles] = React.useState<number | null>(null);
  const [corecte, setCorecte] = React.useState(0);
  const [gresite, setGresite] = React.useState<number[]>([]);
  const [gata, setGata] = React.useState(false);

  React.useEffect(() => {
    let anulat = false;
    (async () => {
      const local = await continutLocal();
      if (!anulat && local) setContinut(local);
      if (!local) {
        try {
          const proaspat = await aduContinut();
          if (!anulat) setContinut(proaspat);
        } catch { /* ecranul o spune */ }
      }
      const p = await progresLocal();
      if (!anulat) { setProgres(p); setIncarca(false); }
    })();
    return () => { anulat = true; };
  }, []);

  const modul = continut?.modules.find((m) => m.id === String(moduleId)) ?? null;
  const intrebari: QuizQuestion[] = continut?.quizzes?.[String(moduleId)] ?? [];
  const prag = continut?.passThreshold ?? 80;
  const intrebarea = intrebari[index];

  const alege = (i: number) => {
    if (ales != null || !intrebarea) return;
    const bine = i === intrebarea.correct;
    Haptics.notificationAsync(
      bine ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
    ).catch(() => {});
    setAles(i);
    if (bine) setCorecte((c) => c + 1);
    else setGresite((g) => [...g, index]);
  };

  const urmatoarea = async () => {
    if (index < intrebari.length - 1) {
      setIndex((i) => i + 1);
      setAles(null);
      return;
    }

    // Final: salvăm cel mai bun scor și întrebările ratate.
    const scor = intrebari.length > 0 ? (corecte / intrebari.length) * 100 : 0;
    const id = String(moduleId);
    const ratate = { ...progres.missed };
    for (const i of gresite) {
      const cheie = `${id}#${i}`;
      ratate[cheie] = (ratate[cheie] ?? 0) + 1;
    }
    const nou: Progres = {
      ...progres,
      quizzes: { ...progres.quizzes, [id]: Math.max(progres.quizzes[id] ?? 0, scor) },
      missed: ratate,
    };
    setProgres(nou);
    await scrieProgres(nou);
    setGata(true);
  };

  const reia = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIndex(0);
    setAles(null);
    setCorecte(0);
    setGresite([]);
    setGata(false);
  };

  const scorCurent = intrebari.length > 0 ? (corecte / intrebari.length) * 100 : 0;
  const promovat = scorCurent >= prag;

  return (
    <Ecran
      titlu={modul ? textul(modul.title) : "Quiz"}
      subtitlu={
        intrebari.length === 0
          ? null
          : gata
            ? "Rezultat"
            : `Întrebarea ${index + 1} din ${intrebari.length}`
      }
      incarca={incarca && !continut}
      scheletRanduri={3}
      subsol={
        gata || ales == null || intrebari.length === 0 ? null : (
          <Buton
            eticheta={index < intrebari.length - 1 ? "Următoarea" : "Vezi rezultatul"}
            onPress={urmatoarea}
            plin
            iconita={<Ionicons name="arrow-forward" size={16} color="#ffffff" />}
          />
        )
      }
    >
      {intrebari.length === 0 ? (
        !incarca ? (
          <Gol
            iconita="help-circle-outline"
            titlu="Modulul ăsta n-are quiz"
            text="Nu toate modulele au verificare. Întoarce-te la lecții."
          />
        ) : null
      ) : gata ? (
        <Reveal>
          <Card culoareMuchie={promovat ? "rgba(52,211,153,0.40)" : "rgba(251,191,36,0.40)"}>
            <View style={st.rezultat}>
              <View
                style={[
                  st.medalie,
                  { backgroundColor: promovat ? "rgba(52,211,153,0.12)" : "rgba(251,191,36,0.12)" },
                ]}
              >
                <Ionicons
                  name={promovat ? "ribbon" : "refresh"}
                  size={26}
                  color={promovat ? T.pnl.gain : T.state.warn}
                />
              </View>

              <RollingNumber
                value={`${Math.round(scorCurent)}%`}
                size={T.fontSize["3xl"]}
                color={promovat ? T.pnl.gain : T.state.warn}
              />
              <Text style={st.dinTotal}>
                {corecte} din {intrebari.length} corecte · prag {prag}%
              </Text>

              <Text style={st.verdict}>
                {promovat
                  ? "Promovat. Materia din modulul ăsta e a ta."
                  : "Sub prag. Recitește lecțiile la care ai ezitat și reia — scorul salvat rămâne cel mai bun."}
              </Text>

              <BaraProgres
                fractiune={scorCurent / 100}
                culoare={promovat ? T.pnl.gain : T.state.warn}
                style={{ marginTop: T.spacing.lg, width: "100%" }}
              />
            </View>

            <View style={st.butoane}>
              <Buton eticheta="Reia quizul" varianta="secundar" onPress={reia} style={{ flex: 1 }} />
              <Buton
                eticheta="La lecții"
                onPress={() => router.replace(`/academia/${String(moduleId)}`)}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </Reveal>
      ) : intrebarea ? (
        <>
          <BaraProgres
            fractiune={(index + (ales != null ? 1 : 0)) / intrebari.length}
            inaltime={4}
            style={{ marginBottom: T.spacing.lg }}
          />

          <Reveal key={index}>
            <Card>
              <Text style={st.intrebare}>{textul(intrebarea.q)}</Text>

              <View style={st.variante}>
                {intrebarea.options.map((o, i) => {
                  const esteCorect = i === intrebarea.correct;
                  const alesDeMine = i === ales;
                  const aratat = ales != null;

                  return (
                    <Pressable
                      key={i}
                      onPress={() => alege(i)}
                      disabled={aratat}
                      style={[
                        st.varianta,
                        aratat && esteCorect && st.variantaCorecta,
                        aratat && alesDeMine && !esteCorect && st.variantaGresita,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: aratat, selected: alesDeMine }}
                    >
                      <View
                        style={[
                          st.litera,
                          aratat && esteCorect && { backgroundColor: "rgba(52,211,153,0.18)" },
                          aratat && alesDeMine && !esteCorect && { backgroundColor: "rgba(251,113,133,0.18)" },
                        ]}
                      >
                        {aratat && esteCorect ? (
                          <Ionicons name="checkmark" size={13} color={T.pnl.gain} />
                        ) : aratat && alesDeMine ? (
                          <Ionicons name="close" size={13} color={T.pnl.loss} />
                        ) : (
                          <Text style={st.textLitera}>{String.fromCharCode(65 + i)}</Text>
                        )}
                      </View>
                      <Text
                        style={[
                          st.textVarianta,
                          aratat && esteCorect && { color: T.ink.i1 },
                        ]}
                      >
                        {textul(o)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {ales != null ? (
                <View style={st.explicatie}>
                  <View style={st.antetExplicatie}>
                    <Ionicons
                      name={ales === intrebarea.correct ? "checkmark-circle" : "information-circle"}
                      size={14}
                      color={ales === intrebarea.correct ? T.pnl.gain : T.accent.base}
                    />
                    <Text
                      style={[
                        st.titluExplicatie,
                        { color: ales === intrebarea.correct ? T.pnl.gain : T.accent.base },
                      ]}
                    >
                      {ales === intrebarea.correct ? "Corect" : "Nu chiar"}
                    </Text>
                  </View>
                  <Text style={st.textExplicatie}>{textul(intrebarea.explain)}</Text>
                </View>
              ) : null}
            </Card>
          </Reveal>
        </>
      ) : null}
    </Ecran>
  );
}

const st = StyleSheet.create({
  rezultat: { alignItems: "center", paddingVertical: T.spacing.lg },
  medalie: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: T.spacing.lg,
  },
  dinTotal: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 6,
  },
  verdict: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    textAlign: "center",
    marginTop: T.spacing.md,
  },
  butoane: { flexDirection: "row", gap: T.spacing.sm, marginTop: T.spacing.lg },
  intrebare: {
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontFamily: "Inter_700Bold",
    lineHeight: 23,
  },
  variante: { marginTop: T.spacing.lg, gap: T.spacing.sm },
  varianta: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.md,
    minHeight: 52,
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm,
    borderRadius: T.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    backgroundColor: T.surface.s3,
  },
  variantaCorecta: {
    borderColor: "rgba(52,211,153,0.45)",
    backgroundColor: "rgba(52,211,153,0.08)",
  },
  variantaGresita: {
    borderColor: "rgba(251,113,133,0.45)",
    backgroundColor: "rgba(251,113,133,0.08)",
  },
  litera: {
    width: 26,
    height: 26,
    borderRadius: T.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface.s4,
  },
  textLitera: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_800ExtraBold",
  },
  textVarianta: {
    flex: 1,
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  explicatie: {
    marginTop: T.spacing.lg,
    paddingTop: T.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.line.l1,
  },
  antetExplicatie: { flexDirection: "row", alignItems: "center", gap: 5 },
  titluExplicatie: {
    fontSize: 9,
    fontFamily: "Inter_800ExtraBold",
    textTransform: "uppercase",
    letterSpacing: T.tracking.wider,
  },
  textExplicatie: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    marginTop: 5,
  },
});
