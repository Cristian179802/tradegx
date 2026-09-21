import * as React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  continutLocal,
  aduContinut,
  progresLocal,
  textul,
  ETICHETA_NIVEL,
  cheieLectie,
  PROGRES_GOL,
  type ContinutAcademie,
  type Progres,
} from "../../../src/lib/academia";
import { Card } from "../../../src/ui/Card";
import { Reveal } from "../../../src/ui/Reveal";
import { Ecran } from "../../../src/ui/Ecran";
import { BaraProgres, Gol, Insigna, Sectiune } from "../../../src/ui/parti";
import { T } from "../../../src/theme";

// ── Un modul ─────────────────────────────────────────────────────────────────
//
// Lecțiile în ordine, cu bifă pe cele terminate, și quiz-ul la final.
//
// QUIZ-UL SE DESCHIDE ORICÂND, nu doar după ce ai terminat toate lecțiile. Cine
// știe deja materia trebuie să poată sări direct la verificare; un quiz blocat
// până la ultima lecție ar fi fost o barieră pusă din principiu, nu din
// pedagogie. Cardul spune totuși câte lecții mai ai.

export default function Modul() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const router = useRouter();

  const [continut, setContinut] = React.useState<ContinutAcademie | null>(null);
  const [progres, setProgres] = React.useState<Progres>(PROGRES_GOL);
  const [incarca, setIncarca] = React.useState(true);

  React.useEffect(() => {
    let anulat = false;
    (async () => {
      const local = await continutLocal();
      if (!anulat && local) { setContinut(local); setIncarca(false); }
      if (!local) {
        try {
          const proaspat = await aduContinut();
          if (!anulat) setContinut(proaspat);
        } catch { /* rămâne gol; ecranul o spune */ }
      }
      const p = await progresLocal();
      if (!anulat) { setProgres(p); setIncarca(false); }
    })();
    return () => { anulat = true; };
  }, []);

  const modul = continut?.modules.find((m) => m.id === String(moduleId)) ?? null;
  const intrebari = continut?.quizzes?.[String(moduleId)] ?? [];
  const prag = continut?.passThreshold ?? 80;
  const scor = progres.quizzes[String(moduleId)];

  const facute = modul
    ? modul.lessons.filter((l) => progres.lessons.includes(cheieLectie(modul.id, l.id))).length
    : 0;

  return (
    <Ecran
      titlu={modul ? textul(modul.title) : "Modul"}
      subtitlu={modul ? `${facute} din ${modul.lessons.length} lecții · ${ETICHETA_NIVEL[modul.level]}` : null}
      incarca={incarca && !continut}
      scheletRanduri={4}
    >
      {!modul ? (
        !incarca ? (
          <Gol
            iconita="help-circle-outline"
            titlu="Modulul nu a fost găsit"
            text="Poate a fost redenumit. Întoarce-te la listă și alege-l de acolo."
          />
        ) : null
      ) : (
        <>
          <Reveal>
            <Card nivel={1}>
              <Text style={st.descriere}>{textul(modul.description)}</Text>
              <BaraProgres
                fractiune={facute / Math.max(1, modul.lessons.length)}
                culoare={facute === modul.lessons.length ? T.pnl.gain : T.accent.base}
                style={{ marginTop: T.spacing.md }}
              />
            </Card>
          </Reveal>

          <Sectiune titlu="Lecții" />

          {modul.lessons.map((l, i) => {
            const gata = progres.lessons.includes(cheieLectie(modul.id, l.id));
            return (
              <Reveal key={l.id} intarziere={i * 45} style={{ marginBottom: T.spacing.sm }}>
                <Card
                  onPress={() => router.push(`/academia/${modul.id}/${l.id}`)}
                  culoareMuchie={gata ? "rgba(52,211,153,0.30)" : "rgba(255,255,255,0.04)"}
                  accesibilEticheta={`${textul(l.title)}${gata ? ", terminată" : ""}`}
                >
                  <View style={st.randLectie}>
                    <View style={[st.numar, gata && st.numarGata]}>
                      {gata ? (
                        <Ionicons name="checkmark" size={14} color={T.pnl.gain} />
                      ) : (
                        <Text style={st.textNumar}>{i + 1}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[st.titluLectie, gata && { color: T.ink.i3 }]} numberOfLines={2}>
                        {textul(l.title)}
                      </Text>
                      <Text style={st.durata}>{l.minutes} min de citit</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={15} color={T.ink.i4} />
                  </View>
                </Card>
              </Reveal>
            );
          })}

          {intrebari.length > 0 ? (
            <>
              <Sectiune titlu="Verificare" nota={`Prag de promovare: ${prag}%.`} />
              <Reveal>
                <Card
                  onPress={() => router.push(`/academia/${modul.id}/quiz`)}
                  culoareMuchie={
                    scor != null && scor >= prag ? "rgba(52,211,153,0.35)" : T.accent.line
                  }
                >
                  <View style={st.randQuiz}>
                    <View
                      style={[
                        st.iconQuiz,
                        scor != null && scor >= prag && { backgroundColor: "rgba(52,211,153,0.12)" },
                      ]}
                    >
                      <Ionicons
                        name={scor != null && scor >= prag ? "ribbon" : "help-circle-outline"}
                        size={18}
                        color={scor != null && scor >= prag ? T.pnl.gain : T.accent.base}
                      />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={st.titluQuiz}>Quiz — {intrebari.length} întrebări</Text>
                      <Text style={st.subQuiz}>
                        {scor == null
                          ? facute < modul.lessons.length
                            ? `Mai ai ${modul.lessons.length - facute} lecții, dar poți încerca oricând.`
                            : "Nu l-ai dat încă."
                          : scor >= prag
                            ? `Promovat cu ${Math.round(scor)}%. Poți relua oricând.`
                            : `Cel mai bun scor: ${Math.round(scor)}%. Sub prag.`}
                      </Text>
                    </View>
                    {scor != null ? (
                      <Insigna
                        text={`${Math.round(scor)}%`}
                        culoare={scor >= prag ? T.pnl.gain : T.state.warn}
                      />
                    ) : null}
                  </View>
                </Card>
              </Reveal>
            </>
          ) : null}
        </>
      )}
    </Ecran>
  );
}

const st = StyleSheet.create({
  descriere: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  randLectie: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  numar: {
    width: 28,
    height: 28,
    borderRadius: T.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface.s4,
  },
  numarGata: { backgroundColor: "rgba(52,211,153,0.12)" },
  textNumar: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  titluLectie: {
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_700Bold",
    lineHeight: 19,
  },
  durata: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
  },
  randQuiz: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  iconQuiz: {
    width: 38,
    height: 38,
    borderRadius: T.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.accent.soft,
  },
  titluQuiz: {
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_700Bold",
  },
  subQuiz: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    marginTop: 3,
  },
});
