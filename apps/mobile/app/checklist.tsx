import * as React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Buton } from "../src/ui/Buton";
import { Card } from "../src/ui/Card";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { BaraProgres } from "../src/ui/parti";
import { T, ATINGERE_MIN } from "../src/theme";

// ── Checklist înainte de intrare ─────────────────────────────────────────────
//
// Singurul ecran din aplicație care NU vorbește cu serverul, și e intenționat:
// pe web lista stă în `localStorage`, deci e a dispozitivului. Un checklist se
// bifează în treizeci de secunde, înainte de o intrare — dacă ar aștepta o
// cerere de rețea la fiecare bifă, ar fi inutilizabil exact în momentul în care
// contează. Regulile personale adăugate aici rămân pe telefon.
//
// BIFELE SE ȘTERG LA ZI NOUĂ, regulile rămân. Asta e toată ideea: lista e un
// ritual zilnic, nu o listă de sarcini care se termină odată.
//
// Cele zece reguli implicite sunt aceleași ca pe site, în aceeași ordine.
// Textul lor se citește MEREU din constanta de aici, chiar dacă în memorie e
// salvată o versiune veche — altfel o corectură de text n-ar ajunge niciodată
// la cineva care are deja lista salvată.

const CHEIE = "tradegx-pretrade-checklist";

const IMPLICITE = [
  "Trendul/structura HTF (H4/D1) susține direcția tranzacției",
  "Există un punct de interes clar (Order Block / FVG / lichiditate)",
  "Am o confirmare de intrare (CHoCH / BOS / retest)",
  "Stop Loss-ul este plasat logic (sub/peste structură), nu arbitrar",
  "Risk:Reward este minim 1:2",
  "Riscul per tranzacție respectă regula mea (≤ 1-2% din cont)",
  "Sunt în sesiunea potrivită (Londra / New York / overlap)",
  "Nu există știri de impact major în următoarele 30 min",
  "Nu tranzacționez din răzbunare, FOMO sau plictiseală",
  "Sunt calm și odihnit — starea mea mentală e bună",
];

interface Element {
  id: string;
  text: string;
  bifat: boolean;
}

const ziua = () => new Date().toISOString().slice(0, 10);

const proaspete = (): Element[] =>
  IMPLICITE.map((text, i) => ({ id: `d${i}`, text, bifat: false }));

export default function Checklist() {
  const [elemente, setElemente] = React.useState<Element[]>([]);
  const [incarca, setIncarca] = React.useState(true);
  const [text, setText] = React.useState("");

  // Citire la montare.
  React.useEffect(() => {
    let anulat = false;
    AsyncStorage.getItem(CHEIE)
      .then((brut) => {
        if (anulat) return;
        if (!brut) return setElemente(proaspete());
        try {
          const salvat = JSON.parse(brut) as { zi: string; elemente: Element[] };
          if (!Array.isArray(salvat.elemente)) return setElemente(proaspete());
          setElemente(
            salvat.zi === ziua()
              ? salvat.elemente
              : salvat.elemente.map((e) => ({ ...e, bifat: false })),
          );
        } catch {
          setElemente(proaspete());
        }
      })
      .catch(() => { if (!anulat) setElemente(proaspete()); })
      .finally(() => { if (!anulat) setIncarca(false); });
    return () => { anulat = true; };
  }, []);

  // Scriere la fiecare schimbare, după ce s-a încărcat. Condiția contează: fără
  // ea, primul randare (cu listă goală) ar șterge ce era salvat.
  React.useEffect(() => {
    if (incarca) return;
    AsyncStorage.setItem(CHEIE, JSON.stringify({ zi: ziua(), elemente })).catch(() => {});
  }, [elemente, incarca]);

  const afisat = (e: Element) => {
    const m = /^d(\d+)$/.exec(e.id);
    return m ? (IMPLICITE[Number(m[1])] ?? e.text) : e.text;
  };

  const comuta = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    setElemente((p) => p.map((e) => (e.id === id ? { ...e, bifat: !e.bifat } : e)));
  };

  const sterge = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setElemente((p) => p.filter((e) => e.id !== id));
  };

  const adauga = () => {
    const t = text.trim();
    if (!t) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setElemente((p) => [...p, { id: `c${Date.now()}`, text: t, bifat: false }]);
    setText("");
  };

  const readuImplicite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setElemente(proaspete());
  };

  const reseteaza = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setElemente((p) => p.map((e) => ({ ...e, bifat: false })));
  };

  const bifate = elemente.filter((e) => e.bifat).length;
  const total = elemente.length;
  const toate = total > 0 && bifate === total;
  const fractiune = total > 0 ? bifate / total : 0;

  return (
    <Ecran
      titlu="Checklist"
      subtitlu="Disciplina, înainte de fiecare intrare"
      incarca={incarca}
      scheletRanduri={5}
      actiune={
        bifate > 0 ? (
          <Pressable
            onPress={reseteaza}
            style={st.reset}
            accessibilityRole="button"
            accessibilityLabel="Resetează bifele"
            hitSlop={8}
          >
            <Ionicons name="refresh" size={16} color={T.ink.i3} />
          </Pressable>
        ) : undefined
      }
    >
      {total === 0 ? (
        <Reveal>
          <Card culoareMuchie={T.accent.line}>
            <View style={st.sus}>
              <Ionicons name="shield-outline" size={18} color={T.accent.base} />
              <Text style={st.stare}>Lista e goală</Text>
            </View>
            <Text style={st.explicatie}>
              Checklistul e ultima oprire înainte de o intrare: zece întrebări pe care
              ți le pui de fiecare dată, ca să nu intri din plictiseală sau din
              răzbunare. Bifele se șterg singure la zi nouă; regulile rămân.
            </Text>
            <Text style={st.explicatie}>
              Le-ai șters pe toate. Poți aduce lista implicită înapoi, sau poți
              scrie mai jos doar regulile tale.
            </Text>
            <Buton
              eticheta="Adu lista implicită"
              onPress={readuImplicite}
              plin
              iconita={<Ionicons name="refresh" size={16} color="#ffffff" />}
              style={{ marginTop: T.spacing.lg }}
            />
          </Card>
        </Reveal>
      ) : (
      <Reveal>
        <Card culoareMuchie={toate ? "rgba(52,211,153,0.40)" : undefined}>
          <View style={st.sus}>
            <Ionicons
              name={toate ? "shield-checkmark" : "checkbox-outline"}
              size={18}
              color={toate ? T.pnl.gain : T.ink.i3}
            />
            <Text style={[st.stare, toate && { color: T.pnl.gain }]}>
              {toate ? "Ești pregătit să tranzacționezi" : `${bifate} din ${total} verificate`}
            </Text>
          </View>
          <BaraProgres
            fractiune={fractiune}
            culoare={toate ? T.pnl.gain : T.accent.base}
            style={{ marginTop: T.spacing.md }}
          />
          <Text style={st.nota}>
            {toate
              ? "Lista se golește singură mâine dimineață."
              : "Bifele se resetează automat în fiecare zi."}
          </Text>
        </Card>
      </Reveal>
      )}

      <Reveal intarziere={70} style={{ marginTop: T.spacing.md }}>
        <Card faraPadding>
          {elemente.map((e, i) => (
            <View key={e.id} style={[st.rand, i > 0 && st.separator]}>
              <Pressable
                onPress={() => comuta(e.id)}
                style={st.bifa}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: e.bifat }}
                accessibilityLabel={afisat(e)}
                hitSlop={6}
              >
                <Ionicons
                  name={e.bifat ? "checkbox" : "square-outline"}
                  size={21}
                  color={e.bifat ? T.pnl.gain : T.ink.i4}
                />
              </Pressable>

              <Pressable style={{ flex: 1 }} onPress={() => comuta(e.id)}>
                <Text style={[st.text, e.bifat && st.textBifat]}>{afisat(e)}</Text>
              </Pressable>

              <Pressable
                onPress={() => sterge(e.id)}
                style={st.sterge}
                accessibilityRole="button"
                accessibilityLabel={`Șterge regula: ${afisat(e)}`}
                hitSlop={6}
              >
                <Ionicons name="close" size={15} color={T.ink.i4} />
              </Pressable>
            </View>
          ))}

          <View style={[st.rand, st.separator]}>
            <View style={st.bifa}>
              <Ionicons name="add" size={19} color={T.ink.i4} />
            </View>
            <TextInput
              value={text}
              onChangeText={setText}
              onSubmitEditing={adauga}
              returnKeyType="done"
              placeholder="Adaugă o regulă personală…"
              placeholderTextColor={T.ink.i4}
              selectionColor={T.accent.base}
              style={st.camp}
            />
            {text.trim() ? (
              <Pressable onPress={adauga} accessibilityRole="button" hitSlop={8}>
                <Text style={st.adauga}>Adaugă</Text>
              </Pressable>
            ) : null}
          </View>
        </Card>
      </Reveal>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          setElemente(proaspete());
        }}
        style={st.restabilire}
        accessibilityRole="button"
      >
        <Text style={st.textRestabilire}>Restabilește lista implicită</Text>
      </Pressable>
    </Ecran>
  );
}

const st = StyleSheet.create({
  reset: {
    width: 34,
    height: 34,
    borderRadius: T.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface.s3,
  },
  sus: { flexDirection: "row", alignItems: "center", gap: T.spacing.sm },
  stare: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  nota: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: T.spacing.sm,
  },
  rand: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.sm,
    paddingHorizontal: T.spacing.md,
    paddingVertical: T.spacing.sm,
    minHeight: ATINGERE_MIN,
  },
  separator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.line.l1,
  },
  bifa: { width: 30, alignItems: "center", justifyContent: "center" },
  text: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  textBifat: {
    color: T.ink.i4,
    textDecorationLine: "line-through",
  },
  explicatie: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    marginTop: T.spacing.md,
  },
  sterge: { width: 26, alignItems: "center", justifyContent: "center" },
  camp: {
    flex: 1,
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    paddingVertical: T.spacing.sm,
  },
  adauga: {
    color: T.accent.base,
    fontSize: T.fontSize.sm,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  restabilire: { alignItems: "center", paddingVertical: T.spacing.xl },
  textRestabilire: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
});
