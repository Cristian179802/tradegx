import * as React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  continutLocal,
  aduContinut,
  progresLocal,
  scrieProgres,
  textul,
  cheieLectie,
  PROGRES_GOL,
  type ContinutAcademie,
  type LabRef,
  type LessonSection,
  type Progres,
} from "../../../src/lib/academia";
import { Card } from "../../../src/ui/Card";
import { Buton } from "../../../src/ui/Buton";
import { Reveal } from "../../../src/ui/Reveal";
import { Ecran } from "../../../src/ui/Ecran";
import { TextLectie } from "../../../src/ui/TextLectie";
import { Diagrama, useLatime } from "../../../src/ui/grafice";
import { Gol, Insigna, Sectiune } from "../../../src/ui/parti";
import { Camp } from "../../../src/ui/Camp";
import { intreabaTutorele } from "../../../src/lib/asistent";
import { ApiError } from "../../../src/lib/api";
import { T } from "../../../src/theme";

// ── O lecție ─────────────────────────────────────────────────────────────────
//
// Secțiunile se desenează în ordinea în care au fost scrise: titlu, text,
// diagramă, exemplu, tabel, formulă, sfat, capcană, idei de reținut.
//
// LABORATOARELE NU SE PREFAC. Pe web, un laborator e o componentă în care
// elevul trage de riscul per tranzacție și vede ruina mișcându-se. Aplicația
// are DEJA uneltele alea, ca ecrane proprii — calculatorul de lot, riscul de
// ruină, graficele cu lumânări reale. Deci laboratorul de aici nu e o copie
// pe jumătate, e un buton către unealta adevărată, cu explicația a ce trebuie
// încercat acolo. O versiune redusă a laboratorului, cu două cursoare din
// cinci, ar fi fost mai rea decât ambele.
//
// BIFA DE TERMINAT E MANUALĂ. Am fi putut marca lecția citită la derularea
// până jos, dar cineva care derulează repede ca să vadă diagrama n-a citit-o.
// Bifa înseamnă „am înțeles”, nu „am trecut pe aici”.

const CATRE_UNEALTA: Record<string, { ruta: string; buton: string; text: string }> = {
  "risk-lab": {
    ruta: "/calculator",
    buton: "Deschide calculatorul",
    text: "Încearcă în calculatorul de lot: schimbă riscul și vezi cum se mută mărimea poziției.",
  },
  "drawdown-lab": {
    ruta: "/unelte",
    buton: "Deschide uneltele",
    text: "În Unelte, la Risc de ruină, mută riscul pe tranzacție și vezi cât rezistă contul.",
  },
  "expectancy-lab": {
    ruta: "/unelte",
    buton: "Deschide uneltele",
    text: "În Unelte, combină rata de câștig cu raportul risc/câștig și vezi ce iese.",
  },
  "chart-lab": {
    ruta: "/grafice",
    buton: "Deschide graficele",
    text: "Pe ecranul de Grafice ai lumânări reale, cu tranzacțiile tale marcate peste ele.",
  },
  "pattern-drill": {
    ruta: "/grafice",
    buton: "Deschide graficele",
    text: "Caută tiparul pe un grafic real, pe intervale diferite.",
  },
  "sl-drill": {
    ruta: "/calculator",
    buton: "Deschide calculatorul",
    text: "Pune stopul unde crezi și vezi ce lot iese pentru riscul tău.",
  },
};

export default function Lectie() {
  const { moduleId, lessonId } = useLocalSearchParams<{ moduleId: string; lessonId: string }>();
  const router = useRouter();
  const [latime, laMasurare] = useLatime();

  const [continut, setContinut] = React.useState<ContinutAcademie | null>(null);
  const [progres, setProgres] = React.useState<Progres>(PROGRES_GOL);
  const [incarca, setIncarca] = React.useState(true);

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
  const index = modul?.lessons.findIndex((l) => l.id === String(lessonId)) ?? -1;
  const lectie = index >= 0 ? modul!.lessons[index]! : null;
  const urmatoare = modul && index >= 0 && index < modul.lessons.length - 1
    ? modul.lessons[index + 1]!
    : null;

  const cheie = modul && lectie ? cheieLectie(modul.id, lectie.id) : "";
  const terminata = cheie ? progres.lessons.includes(cheie) : false;

  const comutaTerminat = async () => {
    if (!cheie) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const lectii = terminata
      ? progres.lessons.filter((x) => x !== cheie)
      : [...progres.lessons, cheie];
    const nou = { ...progres, lessons: lectii };
    setProgres(nou);
    await scrieProgres(nou);
  };

  const laGlosar = (slug: string) => {
    Haptics.selectionAsync().catch(() => {});
    router.push(`/academia/glosar?termen=${encodeURIComponent(slug)}`);
  };

  return (
    <Ecran
      titlu={lectie ? textul(lectie.title) : "Lecție"}
      subtitlu={modul && lectie ? `${textul(modul.title)} · ${lectie.minutes} min` : null}
      incarca={incarca && !continut}
      scheletRanduri={5}
      subsol={
        lectie ? (
          <Buton
            eticheta={terminata ? "Terminată" : "Marchează terminată"}
            varianta={terminata ? "secundar" : "principal"}
            onPress={comutaTerminat}
            plin
            iconita={
              <Ionicons
                name={terminata ? "checkmark-circle" : "checkmark"}
                size={17}
                color={terminata ? T.ink.i1 : "#ffffff"}
              />
            }
          />
        ) : null
      }
    >
      <View onLayout={laMasurare} />

      {!lectie ? (
        !incarca ? (
          <Gol
            iconita="document-outline"
            titlu="Lecția nu a fost găsită"
            text="Întoarce-te la modul și alege-o din listă."
          />
        ) : null
      ) : (
        <>
          {lectie.sections.map((s, i) => (
            <Reveal key={i} intarziere={Math.min(i, 6) * 50} style={{ marginBottom: T.spacing.lg }}>
              <SectiuneLectie
                s={s}
                continut={continut}
                latime={latime}
                onTermen={laGlosar}
                onUnealta={(ruta) => router.push(ruta as never)}
              />
            </Reveal>
          ))}

          <Sectiune titlu="N-ai înțeles ceva?" nota="Tutorele citește lecția asta și îți răspunde despre ea." />
          <Tutore moduleId={modul!.id} lessonId={lectie.id} />

          {urmatoare ? (
            <Pressable
              onPress={() => router.replace(`/academia/${modul!.id}/${urmatoare.id}`)}
              accessibilityRole="button"
              style={{ marginBottom: T.spacing.xl }}
            >
              <Card nivel={1}>
                <View style={st.randUrmatoare}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={st.etichetaUrmatoare}>URMĂTOAREA LECȚIE</Text>
                    <Text style={st.titluUrmatoare} numberOfLines={2}>
                      {textul(urmatoare.title)}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={17} color={T.accent.base} />
                </View>
              </Card>
            </Pressable>
          ) : null}
        </>
      )}
    </Ecran>
  );
}

/**
 * Tutorele lecției.
 *
 * SERVERUL CITEȘTE SINGUR TEXTUL LECȚIEI din `moduleId` + `lessonId` — noi
 * trimitem doar întrebarea. Altfel ar fi trebuit să urcăm câteva mii de
 * caractere de lecție la fiecare întrebare, dintr-un text pe care serverul îl
 * are oricum.
 *
 * Conversația NU se păstrează între lecții: e o întrebare despre ce tocmai ai
 * citit, nu un chat. Pentru discuții lungi există Asistentul.
 */
function Tutore({ moduleId, lessonId }: { moduleId: string; lessonId: string }) {
  const [intrebare, setIntrebare] = React.useState("");
  const [raspuns, setRaspuns] = React.useState<string | null>(null);
  const [asteapta, setAsteapta] = React.useState(false);
  const [eroare, setEroare] = React.useState<string | null>(null);

  const trimite = async () => {
    const q = intrebare.trim();
    if (q.length < 3 || asteapta) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setAsteapta(true);
    setEroare(null);
    setRaspuns(null);
    try {
      const r = await intreabaTutorele({ moduleId, lessonId, question: q });
      setRaspuns(r);
      Haptics.selectionAsync().catch(() => {});
    } catch (e) {
      setEroare(
        e instanceof ApiError && e.status === 402
          ? "Tutorele e inclus în planul PRO."
          : e instanceof ApiError ? e.message : "Nu am primit răspuns.",
      );
    } finally {
      setAsteapta(false);
    }
  };

  return (
    <Card culoareMuchie={raspuns ? T.accent.line : undefined}>
      <Camp
        eticheta="Întrebarea ta"
        valoare={intrebare}
        onChange={setIntrebare}
        placeholder="Ce anume n-a fost clar?"
        multilinie
        randuri={2}
        autoCapitalize="sentences"
      />

      {eroare ? <Text style={st.eroareTutore}>{eroare}</Text> : null}

      {raspuns ? (
        <View style={st.raspuns}>
          <Insigna text="tutore" culoare={T.accent.base} fundal={T.accent.soft} />
          <Text style={st.textRaspuns}>{raspuns}</Text>
        </View>
      ) : null}

      <Buton
        eticheta={asteapta ? "Se gândește…" : raspuns ? "Întreabă altceva" : "Întreabă"}
        varianta="secundar"
        onPress={trimite}
        incarca={asteapta}
        dezactivat={intrebare.trim().length < 3}
        plin
        iconita={<Ionicons name="school-outline" size={15} color={T.ink.i1} />}
      />
    </Card>
  );
}

function SectiuneLectie({
  s, continut, latime, onTermen, onUnealta,
}: {
  s: LessonSection;
  continut: ContinutAcademie | null;
  latime: number;
  onTermen: (slug: string) => void;
  onUnealta: (ruta: string) => void;
}) {
  const diagrama = s.diagram ? continut?.diagrams?.[s.diagram] : undefined;

  return (
    <View>
      {s.heading ? <Text style={st.titluSectiune}>{textul(s.heading)}</Text> : null}

      <TextLectie text={textul(s.body)} onTermen={onTermen} />

      {diagrama ? (
        <Card style={{ marginTop: T.spacing.lg }} faraPadding>
          <View style={st.zonaDiagrama}>
            <Diagrama def={diagrama} latime={latime - T.spacing.lg * 2} inaltime={190} />
          </View>
          {diagrama.caption ? (
            <Text style={st.legendaDiagrama}>{textul(diagrama.caption)}</Text>
          ) : null}
        </Card>
      ) : null}

      {s.formula ? (
        <View style={st.formula}>
          <Text style={st.expresie}>{s.formula.expr}</Text>
          {s.formula.legend ? (
            <Text style={st.legendaFormula}>{textul(s.formula.legend)}</Text>
          ) : null}
        </View>
      ) : null}

      {s.table ? (
        <View style={st.tabel}>
          <View style={st.randTabel}>
            {s.table.head.map((h, i) => (
              <Text key={i} style={[st.celulaTabel, st.capTabel]} numberOfLines={2}>
                {textul(h)}
              </Text>
            ))}
          </View>
          {s.table.rows.map((r, i) => (
            <View key={i} style={[st.randTabel, st.randTabelCorp]}>
              {r.map((c, j) => (
                <Text key={j} style={st.celulaTabel} numberOfLines={3}>{textul(c)}</Text>
              ))}
            </View>
          ))}
        </View>
      ) : null}

      {s.example ? (
        <Caseta
          iconita="calculator-outline"
          titlu="Exemplu"
          text={textul(s.example)}
          culoare={T.accent.base}
          onTermen={onTermen}
        />
      ) : null}

      {s.tip ? (
        <Caseta
          iconita="bulb-outline"
          titlu="Sfat"
          text={textul(s.tip)}
          culoare={T.pnl.gain}
          onTermen={onTermen}
        />
      ) : null}

      {s.warning ? (
        <Caseta
          iconita="warning-outline"
          titlu="Capcană"
          text={textul(s.warning)}
          culoare={T.pnl.loss}
          onTermen={onTermen}
        />
      ) : null}

      {s.takeaways && s.takeaways.length > 0 ? (
        <View style={st.retine}>
          <Text style={st.titluRetine}>DE REȚINUT</Text>
          {s.takeaways.map((t, i) => (
            <View key={i} style={st.randRetine}>
              <Ionicons name="checkmark" size={13} color={T.accent.base} />
              <Text style={st.textRetine}>{textul(t)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {s.lab ? <Laborator lab={s.lab} onUnealta={onUnealta} /> : null}
    </View>
  );
}

function Laborator({ lab, onUnealta }: { lab: LabRef; onUnealta: (ruta: string) => void }) {
  const c = CATRE_UNEALTA[lab.kind];
  if (!c) return null;

  const focus = lab.kind === "chart-lab" ? textul(lab.focus) : "";

  return (
    <Card style={{ marginTop: T.spacing.lg }} culoareMuchie={T.accent.line}>
      <View style={st.antetLab}>
        <View style={st.iconLab}>
          <Ionicons name="flask-outline" size={16} color={T.accent.base} />
        </View>
        <Text style={st.titluLab}>Încearcă singur</Text>
      </View>
      <Text style={st.textLab}>{focus || c.text}</Text>
      {focus ? <Text style={st.subLab}>{c.text}</Text> : null}
      <Buton
        eticheta={c.buton}
        varianta="secundar"
        onPress={() => onUnealta(c.ruta)}
        style={{ marginTop: T.spacing.md }}
        iconita={<Ionicons name="arrow-forward" size={15} color={T.ink.i1} />}
      />
    </Card>
  );
}

function Caseta({
  iconita, titlu, text, culoare, onTermen,
}: {
  iconita: React.ComponentProps<typeof Ionicons>["name"];
  titlu: string;
  text: string;
  culoare: string;
  onTermen: (slug: string) => void;
}) {
  return (
    <View style={[st.caseta, { borderLeftColor: culoare, backgroundColor: `${culoare}0D` }]}>
      <View style={st.antetCaseta}>
        <Ionicons name={iconita} size={13} color={culoare} />
        <Text style={[st.titluCaseta, { color: culoare }]}>{titlu}</Text>
      </View>
      <TextLectie text={text} onTermen={onTermen} style={{ marginTop: 4 }} />
    </View>
  );
}

const st = StyleSheet.create({
  titluSectiune: {
    color: T.ink.i1,
    fontSize: T.fontSize.lg,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.tight,
    marginBottom: 2,
  },
  zonaDiagrama: { paddingHorizontal: T.spacing.lg, paddingTop: T.spacing.lg },
  legendaDiagrama: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    padding: T.spacing.lg,
    paddingTop: T.spacing.md,
  },
  formula: {
    marginTop: T.spacing.lg,
    padding: T.spacing.lg,
    borderRadius: T.radius.lg,
    backgroundColor: T.surface.s3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
  },
  expresie: {
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: T.tracking.wide,
  },
  legendaFormula: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    marginTop: 6,
  },
  tabel: {
    marginTop: T.spacing.lg,
    borderRadius: T.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    overflow: "hidden",
  },
  randTabel: { flexDirection: "row", backgroundColor: T.surface.s3 },
  randTabelCorp: {
    backgroundColor: "transparent",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.line.l1,
  },
  celulaTabel: {
    flex: 1,
    color: T.ink.i3,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    padding: T.spacing.md,
  },
  capTabel: {
    color: T.ink.i4,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
    textTransform: "uppercase",
    letterSpacing: T.tracking.wide,
    fontSize: 9,
  },
  caseta: {
    marginTop: T.spacing.lg,
    paddingHorizontal: T.spacing.lg,
    paddingVertical: T.spacing.md,
    borderLeftWidth: 3,
    borderRadius: T.radius.md,
  },
  antetCaseta: { flexDirection: "row", alignItems: "center", gap: 5 },
  titluCaseta: {
    fontSize: 9,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
    textTransform: "uppercase",
    letterSpacing: T.tracking.wider,
  },
  retine: {
    marginTop: T.spacing.lg,
    padding: T.spacing.lg,
    borderRadius: T.radius.lg,
    backgroundColor: T.surface.s2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    gap: 8,
  },
  titluRetine: {
    color: T.ink.i4,
    fontSize: 9,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.wider,
    marginBottom: 2,
  },
  randRetine: { flexDirection: "row", gap: T.spacing.sm, alignItems: "flex-start" },
  textRetine: {
    flex: 1,
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  antetLab: { flexDirection: "row", alignItems: "center", gap: T.spacing.sm },
  iconLab: {
    width: 30,
    height: 30,
    borderRadius: T.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.accent.soft,
  },
  titluLab: {
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  textLab: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginTop: T.spacing.md,
  },
  subLab: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: 6,
  },
  eroareTutore: {
    color: T.state.warn,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    marginBottom: T.spacing.md,
  },
  raspuns: {
    marginBottom: T.spacing.md,
    padding: T.spacing.md,
    borderRadius: T.radius.md,
    backgroundColor: T.surface.s3,
    gap: T.spacing.sm,
  },
  textRaspuns: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  randUrmatoare: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  etichetaUrmatoare: {
    color: T.ink.i4,
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.wider,
  },
  titluUrmatoare: {
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginTop: 3,
    lineHeight: 19,
  },
});
