import * as React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  aduContinut,
  continutLocal,
  sincronizeaza,
  textul,
  ETICHETA_NIVEL,
  type ContinutAcademie,
  type Progres,
  PROGRES_GOL,
  cheieLectie,
  type AcademyLevel,
} from "../../src/lib/academia";
import { Buton } from "../../src/ui/Buton";
import { Card } from "../../src/ui/Card";
import { Reveal } from "../../src/ui/Reveal";
import { Ecran } from "../../src/ui/Ecran";
import { RollingNumber } from "../../src/ui/RollingNumber";
import { BaraProgres, Gol, Insigna, Sectiune } from "../../src/ui/parti";
import { T } from "../../src/theme";

// ── Academia ─────────────────────────────────────────────────────────────────
//
// Nouă module, de la „ce e un pip” până la sisteme de trading. Ordinea din
// listă e curriculumul recomandat, nu ordinea alfabetică — cine începe de la
// modulul 6 nu înțelege modulul 6.
//
// SE DESCHIDE CU CE AVEM DEJA. Conținutul salvat local apare instant, iar
// serverul e întrebat în fundal dacă are o versiune nouă. Două secunde de
// schelet pentru un curs pe care îl ai pe disc ar fi fost o alegere proastă.
//
// PROGRESUL E PRIMUL LUCRU DE PE ECRAN, fiindcă la un curs de nouă module
// întrebarea nu e „ce module există”, ci „unde rămăsesem”.

const CULOARE_NIVEL: Record<AcademyLevel, string> = {
  BEGINNER: T.pnl.gain,
  INTERMEDIATE: T.accent.base,
  ADVANCED: T.state.warn,
  EXPERT: T.pnl.loss,
};

const ICONITE: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  candlestick: "bar-chart-outline",
  "trending-up": "trending-up-outline",
  layers: "layers-outline",
  activity: "pulse-outline",
  shield: "shield-checkmark-outline",
  brain: "bulb-outline",
  settings: "construct-outline",
  target: "locate-outline",
  book: "book-outline",
};

export default function Academia() {
  const router = useRouter();
  const [continut, setContinut] = React.useState<ContinutAcademie | null>(null);
  const [progres, setProgres] = React.useState<Progres>(PROGRES_GOL);
  const [incarca, setIncarca] = React.useState(true);
  const [reimprospateaza, setReimprospateaza] = React.useState(false);
  const [eroare, setEroare] = React.useState<string | null>(null);

  const incarcaTot = React.useCallback(async (dinNou = false) => {
    if (dinNou) setReimprospateaza(true);

    // Întâi ce avem pe disc — ecranul are conținut în prima clipă.
    const local = await continutLocal();
    if (local && !dinNou) {
      setContinut(local);
      setIncarca(false);
    }

    try {
      const proaspat = await aduContinut();
      setContinut(proaspat);
      setEroare(null);
    } catch {
      if (!local) setEroare("Nu am putut încărca lecțiile. Verifică semnalul.");
    } finally {
      setIncarca(false);
      setReimprospateaza(false);
    }

    setProgres(await sincronizeaza());
  }, []);

  React.useEffect(() => { void incarcaTot(); }, [incarcaTot]);

  const module_ = continut?.modules ?? [];
  const total = continut?.totalLessons ?? 0;
  const terminate = progres.lessons.length;
  const fractiune = total > 0 ? Math.min(1, terminate / total) : 0;

  // Primul modul neterminat: de acolo se continuă.
  const urmatorul = React.useMemo(() => {
    for (const m of module_) {
      const lipsa = m.lessons.find((l) => !progres.lessons.includes(cheieLectie(m.id, l.id)));
      if (lipsa) return { modul: m, lectie: lipsa };
    }
    return null;
  }, [module_, progres.lessons]);

  return (
    <Ecran
      titlu="Academia"
      subtitlu={total > 0 ? `${terminate} din ${total} lecții` : "Nouă module, de la zero"}
      incarca={incarca && module_.length === 0}
      scheletRanduri={4}
      reimprospateaza={reimprospateaza}
      onReia={() => { void incarcaTot(true); }}
      eroare={eroare}
      actiune={
        module_.length > 0 ? (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.push("/academia/glosar");
            }}
            style={st.actiune}
            accessibilityRole="button"
            accessibilityLabel="Glosar"
            hitSlop={8}
          >
            <Ionicons name="search" size={16} color={T.ink.i3} />
          </Pressable>
        ) : undefined
      }
    >
      {module_.length === 0 ? (
        !incarca ? (
          <Gol
            iconita="school-outline"
            titlu="Lecțiile nu s-au încărcat"
            text="Academia are nouă module, de la ce e un pip până la managementul riscului, cu laboratoare pe datele tale reale. Prima deschidere are nevoie de internet; după aceea cursul rămâne pe telefon."
            actiune={
              <Buton
                eticheta="Încearcă din nou"
                onPress={() => { void incarcaTot(true); }}
                iconita={<Ionicons name="refresh" size={15} color="#ffffff" />}
              />
            }
          />
        ) : null
      ) : (
        <>
          <Reveal>
            <Card>
              <View style={st.antetProgres}>
                <View>
                  <Text style={st.eticheta}>PROGRESUL TĂU</Text>
                  <View style={st.randProgres}>
                    <RollingNumber
                      value={`${Math.round(fractiune * 100)}%`}
                      size={T.fontSize["2xl"]}
                      color={fractiune >= 1 ? T.pnl.gain : T.ink.i1}
                    />
                    <Text style={st.dinTotal}>{terminate}/{total} lecții</Text>
                  </View>
                </View>
                <View style={st.capTerminat}>
                  <Ionicons
                    name={fractiune >= 1 ? "school" : "school-outline"}
                    size={22}
                    color={fractiune >= 1 ? T.pnl.gain : T.accent.base}
                  />
                </View>
              </View>
              <BaraProgres
                fractiune={fractiune}
                culoare={fractiune >= 1 ? T.pnl.gain : T.accent.base}
                style={{ marginTop: T.spacing.lg }}
              />
            </Card>
          </Reveal>

          {urmatorul ? (
            <Reveal intarziere={60} style={{ marginTop: T.spacing.md }}>
              <Card
                onPress={() => router.push(`/academia/${urmatorul.modul.id}/${urmatorul.lectie.id}`)}
                culoareMuchie={T.accent.line}
                accesibilEticheta={`Continuă cu ${textul(urmatorul.lectie.title)}`}
              >
                <View style={st.randContinua}>
                  <View style={st.playIcon}>
                    <Ionicons name="play" size={15} color={T.accent.base} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={st.etichetaContinua}>
                      {terminate === 0 ? "ÎNCEPE DE AICI" : "CONTINUĂ"}
                    </Text>
                    <Text style={st.titluContinua} numberOfLines={1}>
                      {textul(urmatorul.lectie.title)}
                    </Text>
                    <Text style={st.modulContinua} numberOfLines={1}>
                      {textul(urmatorul.modul.title)} · {urmatorul.lectie.minutes} min
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={T.ink.i4} />
                </View>
              </Card>
            </Reveal>
          ) : null}

          <Sectiune titlu="Module" nota="În ordinea în care se învață, nu alfabetic." />

          {module_.map((m, i) => {
            const facute = m.lessons.filter((l) =>
              progres.lessons.includes(cheieLectie(m.id, l.id)),
            ).length;
            const scor = continut?.quizzes?.[m.id] ? progres.quizzes[m.id] : undefined;
            const gata = facute === m.lessons.length;

            return (
              <Reveal key={m.id} intarziere={90 + i * 45} style={{ marginBottom: T.spacing.sm }}>
                <Card
                  onPress={() => router.push(`/academia/${m.id}`)}
                  culoareMuchie={gata ? "rgba(52,211,153,0.30)" : "rgba(255,255,255,0.04)"}
                  accesibilEticheta={`${textul(m.title)}, ${facute} din ${m.lessons.length} lecții`}
                >
                  <View style={st.randModul}>
                    <View
                      style={[
                        st.iconModul,
                        { backgroundColor: `${CULOARE_NIVEL[m.level]}1A` },
                      ]}
                    >
                      <Ionicons
                        name={gata ? "checkmark" : (ICONITE[m.icon] ?? "book-outline")}
                        size={17}
                        color={CULOARE_NIVEL[m.level]}
                      />
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={st.randTitluModul}>
                        <Text style={st.titluModul} numberOfLines={1}>{textul(m.title)}</Text>
                        <Insigna
                          text={ETICHETA_NIVEL[m.level]}
                          culoare={CULOARE_NIVEL[m.level]}
                          fundal={`${CULOARE_NIVEL[m.level]}1A`}
                        />
                      </View>
                      <Text style={st.descriereModul} numberOfLines={2}>
                        {textul(m.description)}
                      </Text>

                      <View style={st.josModul}>
                        <BaraProgres
                          fractiune={facute / Math.max(1, m.lessons.length)}
                          culoare={gata ? T.pnl.gain : T.accent.base}
                          inaltime={4}
                          style={{ flex: 1 }}
                        />
                        <Text style={st.numarLectii}>
                          {facute}/{m.lessons.length}
                        </Text>
                        {scor != null ? (
                          <Insigna
                            text={`quiz ${Math.round(scor)}%`}
                            culoare={
                              scor >= (continut?.passThreshold ?? 80) ? T.pnl.gain : T.state.warn
                            }
                          />
                        ) : null}
                      </View>
                    </View>
                  </View>
                </Card>
              </Reveal>
            );
          })}
        </>
      )}
    </Ecran>
  );
}

const st = StyleSheet.create({
  actiune: {
    width: 34,
    height: 34,
    borderRadius: T.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface.s3,
  },
  antetProgres: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  eticheta: {
    color: T.ink.i4,
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.wider,
    marginBottom: 5,
  },
  randProgres: { flexDirection: "row", alignItems: "baseline", gap: T.spacing.sm },
  dinTotal: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
  capTerminat: {
    width: 44,
    height: 44,
    borderRadius: T.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.accent.soft,
  },
  randContinua: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  playIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.accent.soft,
  },
  etichetaContinua: {
    color: T.accent.base,
    fontSize: 9,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.wider,
  },
  titluContinua: {
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginTop: 3,
  },
  modulContinua: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  randModul: { flexDirection: "row", gap: T.spacing.md, alignItems: "flex-start" },
  iconModul: {
    width: 36,
    height: 36,
    borderRadius: T.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  randTitluModul: { flexDirection: "row", alignItems: "center", gap: T.spacing.sm },
  titluModul: {
    flex: 1,
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  descriereModul: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: 4,
  },
  josModul: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.sm,
    marginTop: T.spacing.md,
  },
  numarLectii: {
    color: T.ink.i4,
    fontSize: 10,
    fontFamily: "SpaceGrotesk_500Medium",
  },
});
