import * as React from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { tr } from "../../src/lib/i18n";
import { Text } from "../../src/ui/Text";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api } from "../../src/lib/api";
import { ApiError } from "../../src/lib/api";
import { useCerere } from "../../src/lib/useCerere";
import { bani, dataScurta } from "../../src/lib/format";
import { Card } from "../../src/ui/Card";
import { Camp } from "../../src/ui/Camp";
import { Buton } from "../../src/ui/Buton";
import { Reveal } from "../../src/ui/Reveal";
import { Ecran } from "../../src/ui/Ecran";
import { Insigna, Rand, Sectiune } from "../../src/ui/parti";
import { T, tonPnl } from "../../src/theme";
import { umple } from "../../src/lib/i18n";

// ── Nota unei tranzacții ─────────────────────────────────────────────────────
//
// Jurnalul are două jumătăți, și ordinea contează: ÎNAINTE (ce credeai) și
// DUPĂ (ce s-a întâmplat). Amestecate într-un singur formular, notele de după
// contaminează amintirea celor dinainte — omul scrie ce ar fi trebuit să
// creadă, nu ce a crezut.
//
// Emoțiile și greșelile sunt LISTE ÎNCHISE, nu text liber. Un câmp liber dă
// „nervos”, „nervoasa”, „stresat” — trei etichete pentru același lucru, deci
// nicio statistică. Listele sunt exact cele din `journalEntrySchema`.
//
// SALVAREA E EXPLICITĂ. Am fi putut salva la fiecare tastă, dar aici omul
// scrie despre banii pierduți ieri: are nevoie să poată să se răzgândească și
// să iasă fără urmă.

const EMOTII = [
  { v: "CALM", e: "Calm" },
  { v: "CONFIDENT", e: "Încrezător" },
  { v: "NEUTRAL", e: "Neutru" },
  { v: "ANXIOUS", e: "Anxios" },
  { v: "FEARFUL", e: "Temător" },
  { v: "GREEDY", e: "Lacom" },
  { v: "FOMO", e: "FOMO" },
  { v: "REVENGE", e: "Răzbunare" },
] as const;

const GRESELI = [
  { v: "OVERTRADING", e: "Overtrading" },
  { v: "REVENGE_TRADE", e: "Răzbunare" },
  { v: "FOMO_ENTRY", e: "Intrare FOMO" },
  { v: "MOVED_SL", e: "Am mutat SL-ul" },
  { v: "NO_SL", e: "Fără SL" },
  { v: "WRONG_SIZE", e: "Lot greșit" },
  { v: "EARLY_EXIT", e: "Ieșire prematură" },
  { v: "LATE_ENTRY", e: "Intrare târzie" },
  { v: "IGNORED_RULES", e: "Am ignorat regulile" },
  { v: "OTHER", e: "Altceva" },
] as const;

interface Tranzactie {
  id: string;
  symbol: string;
  direction: string;
  lotSize: string | number;
  entryPrice: string | number;
  exitPrice: string | number | null;
  entryTime: string;
  exitTime: string | null;
  pnlMoney: string | number | null;
  riskRewardRatio: string | number | null;
  setupType: string | null;
  timeframe: string | null;
  status: string;
  account?: { currency?: string } | null;
  journalEntry?: {
    preNotes: string | null;
    preEmotionalState: string | null;
    preConfidence: number | null;
    postNotes: string | null;
    postEmotionalState: string | null;
    postMistakeTypes: string[];
    postLessons: string | null;
    aiAnalysis: string | null;
    aiScore: string | number | null;
  } | null;
}

export default function EditorJurnal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const c = useCerere<Tranzactie>(
    () => api.trades.get(String(id)) as Promise<Tranzactie>,
    [id],
  );
  const t = c.date;
  const moneda = t?.account?.currency ?? "USD";

  // Starea formularului se inițializează O SINGURĂ DATĂ, la sosirea datelor.
  // Dacă s-ar sincroniza la fiecare randare, o reîmprospătare prin tragere ar
  // șterge ce tocmai a scris omul.
  const [gata, setGata] = React.useState(false);
  const [preEmotie, setPreEmotie] = React.useState<string | null>(null);
  const [incredere, setIncredere] = React.useState<number | null>(null);
  const [preNote, setPreNote] = React.useState("");
  const [postEmotie, setPostEmotie] = React.useState<string | null>(null);
  const [greseli, setGreseli] = React.useState<string[]>([]);
  const [lectii, setLectii] = React.useState("");
  const [postNote, setPostNote] = React.useState("");

  const [salveaza, setSalveaza] = React.useState(false);
  const [analizeaza, setAnalizeaza] = React.useState(false);
  const [analiza, setAnaliza] = React.useState<{ text: string; scor: number | null } | null>(null);
  const [eroare, setEroare] = React.useState<string | null>(null);
  const [salvat, setSalvat] = React.useState(false);

  React.useEffect(() => {
    if (gata || !t) return;
    const j = t.journalEntry;
    setPreEmotie(j?.preEmotionalState ?? null);
    setIncredere(j?.preConfidence ?? null);
    setPreNote(j?.preNotes ?? "");
    setPostEmotie(j?.postEmotionalState ?? null);
    setGreseli(j?.postMistakeTypes ?? []);
    setLectii(j?.postLessons ?? "");
    setPostNote(j?.postNotes ?? "");
    if (j?.aiAnalysis) {
      setAnaliza({
        text: j.aiAnalysis,
        scor: j.aiScore == null ? null : Number(j.aiScore),
      });
    }
    setGata(true);
  }, [t, gata]);

  const comutaGreseala = (v: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSalvat(false);
    setGreseli((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));
  };

  const salveazaAcum = async () => {
    setSalveaza(true);
    setEroare(null);
    try {
      await api.journal.save(String(id), {
        preEmotionalState: preEmotie,
        preNotes: preNote.trim() || null,
        preConfidence: incredere,
        postEmotionalState: postEmotie,
        postMistakeTypes: greseli,
        postLessons: lectii.trim() || null,
        postNotes: postNote.trim() || null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSalvat(true);
    } catch (e) {
      setEroare(e instanceof ApiError ? e.message : "Nu am putut salva. Verifică semnalul.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setSalveaza(false);
    }
  };

  const cereAnaliza = async () => {
    setAnalizeaza(true);
    setEroare(null);
    try {
      const r = (await api.trades.analyze(String(id))) as { analysis: string; score: number | null };
      setAnaliza({ text: r.analysis, scor: r.score });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        Alert.alert(
          tr("Analiza AI e în planul PRO"),
          tr("Abonamentul se gestionează pe site, din meniul „Mai mult”."),
        );
      } else {
        setEroare(e instanceof ApiError ? e.message : "Analiza nu a pornit.");
      }
    } finally {
      setAnalizeaza(false);
    }
  };

  const pnl = t?.pnlMoney == null ? null : Number(t.pnlMoney);

  return (
    <Ecran
      titlu={t?.symbol ?? "Jurnal"}
      subtitlu={t ? `${t.direction === "BUY" ? "Cumpărare" : "Vânzare"} · ${dataScurta(t.exitTime ?? t.entryTime)}` : null}
      incarca={c.incarca && !t}
      scheletRanduri={5}
      reimprospateaza={c.reimprospateaza}
      onReia={c.reia}
      eroare={eroare ?? c.eroare}
      subsol={
        t ? (
          <Buton
            eticheta={salvat ? "Salvat" : "Salvează nota"}
            onPress={salveazaAcum}
            incarca={salveaza}
            plin
            iconita={
              <Ionicons
                name={salvat ? "checkmark-circle" : "save-outline"}
                size={17}
                color="#ffffff"
              />
            }
          />
        ) : null
      }
    >
      {t ? (
        <>
          <Reveal>
            <Card culoareMuchie={pnl != null && pnl < 0 ? "rgba(251,113,133,0.30)" : "rgba(52,211,153,0.30)"}>
              <Rand
                cheie="Rezultat"
                valoare={pnl == null ? "—" : bani(pnl, moneda)}
                culoare={tonPnl(pnl)}
              />
              <Rand cheie="Lot" valoare={Number(t.lotSize).toFixed(2)} />
              <Rand
                cheie="Intrare → ieșire"
                valoare={`${Number(t.entryPrice)} → ${t.exitPrice == null ? "—" : Number(t.exitPrice)}`}
              />
              <Rand
                cheie="Raport risc/câștig"
                valoare={t.riskRewardRatio == null ? "—" : Number(t.riskRewardRatio).toFixed(2)}
              />
              {t.setupType ? <Rand cheie="Setup" valoare={t.setupType} numeric={false} /> : null}
            </Card>
          </Reveal>

          <Sectiune titlu="Înainte de tranzacție" nota="Ce credeai când ai intrat." />

          <Reveal intarziere={60}>
            <Card>
              <Text style={st.eticheta}>Starea emoțională</Text>
              <Alegere
                optiuni={EMOTII}
                valoare={preEmotie}
                onAlege={(v) => { setSalvat(false); setPreEmotie(v); }}
              />

              <Text style={[st.eticheta, { marginTop: T.spacing.lg }]}>
                Încredere {incredere != null ? `· ${incredere}/10` : ""}
              </Text>
              <View style={st.scara}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                  const activ = incredere != null && n <= incredere;
                  return (
                    <Pressable
                      key={n}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setSalvat(false);
                        setIncredere(incredere === n ? null : n);
                      }}
                      style={[st.treapta, activ && st.treaptaActiva]}
                      accessibilityRole="button"
                      accessibilityLabel={umple("Încredere {p1} din 10", { p1: n })}
                      accessibilityState={{ selected: activ }}
                    >
                      <Text style={[st.textTreapta, activ && st.textTreaptaActiv]}>{n}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Camp
                eticheta="Notă dinainte"
                valoare={preNote}
                onChange={(v) => { setSalvat(false); setPreNote(v); }}
                placeholder="De ce ai intrat? Ce vedeai în grafic?"
                multilinie
                randuri={4}
                autoCapitalize="sentences"
                style={{ marginTop: T.spacing.lg }}
              />
            </Card>
          </Reveal>

          <Sectiune titlu="După tranzacție" nota="Ce s-a întâmplat de fapt." />

          <Reveal intarziere={120}>
            <Card>
              <Text style={st.eticheta}>Starea emoțională</Text>
              <Alegere
                optiuni={EMOTII}
                valoare={postEmotie}
                onAlege={(v) => { setSalvat(false); setPostEmotie(v); }}
              />

              <Text style={[st.eticheta, { marginTop: T.spacing.lg }]}>
                Greșeli {greseli.length > 0 ? `· ${greseli.length}` : ""}
              </Text>
              <View style={st.pastile}>
                {GRESELI.map((g) => {
                  const activ = greseli.includes(g.v);
                  return (
                    <Pressable
                      key={g.v}
                      onPress={() => comutaGreseala(g.v)}
                      style={[st.pastila, activ && st.pastilaGresita]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: activ }}
                    >
                      {activ ? (
                        <Ionicons name="close-circle" size={12} color={T.pnl.loss} />
                      ) : null}
                      <Text style={[st.textPastila, activ && { color: T.pnl.loss }]}>{g.e}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Camp
                eticheta="Ce ai învățat"
                valoare={lectii}
                onChange={(v) => { setSalvat(false); setLectii(v); }}
                placeholder="O propoziție pe care vrei s-o citești data viitoare."
                multilinie
                randuri={3}
                autoCapitalize="sentences"
                style={{ marginTop: T.spacing.lg }}
              />

              <Camp
                eticheta="Notă de după"
                valoare={postNote}
                onChange={(v) => { setSalvat(false); setPostNote(v); }}
                placeholder="Cum a decurs execuția?"
                multilinie
                randuri={4}
                autoCapitalize="sentences"
              />
            </Card>
          </Reveal>

          <Sectiune titlu="Analiza AI" />

          <Reveal intarziere={180}>
            <Card>
              {analiza ? (
                <>
                  {analiza.scor != null ? (
                    <Insigna
                      text={`Scor ${analiza.scor.toFixed(0)}/100`}
                      culoare={analiza.scor >= 70 ? T.pnl.gain : analiza.scor >= 40 ? T.state.warn : T.pnl.loss}
                      style={{ marginBottom: T.spacing.md }}
                    />
                  ) : null}
                  <Text style={st.analiza}>{analiza.text}</Text>
                </>
              ) : (
                <Text style={st.faraAnaliza}>
                  Analiza citește execuția și nota ta, apoi spune unde s-a rupt planul.
                </Text>
              )}
              <Buton
                eticheta={analiza ? "Reanalizează" : "Analizează cu AI"}
                varianta="secundar"
                onPress={cereAnaliza}
                incarca={analizeaza}
                style={{ marginTop: T.spacing.md }}
                iconita={<Ionicons name="sparkles-outline" size={16} color={T.ink.i1} />}
              />
            </Card>
          </Reveal>

          <Pressable
            onPress={() => router.push(`/tranzactie/${t.id}`)}
            style={st.legatura}
            accessibilityRole="button"
          >
            <Text style={st.textLegatura}>Vezi tranzacția completă</Text>
            <Ionicons name="chevron-forward" size={14} color={T.accent.base} />
          </Pressable>
        </>
      ) : null}
    </Ecran>
  );
}

function Alegere({
  optiuni,
  valoare,
  onAlege,
}: {
  optiuni: readonly { v: string; e: string }[];
  valoare: string | null;
  onAlege: (v: string | null) => void;
}) {
  return (
    <View style={st.pastile}>
      {optiuni.map((o) => {
        const activ = o.v === valoare;
        return (
          <Pressable
            key={o.v}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onAlege(activ ? null : o.v);
            }}
            style={[st.pastila, activ && st.pastilaActiva]}
            accessibilityRole="button"
            accessibilityState={{ selected: activ }}
          >
            <Text style={[st.textPastila, activ && { color: T.accent.base }]}>{o.e}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  eticheta: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: T.tracking.wider,
    marginBottom: T.spacing.sm,
  },
  pastile: { flexDirection: "row", flexWrap: "wrap", gap: T.spacing.sm },
  pastila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 34,
    paddingHorizontal: T.spacing.md,
    justifyContent: "center",
    borderRadius: T.radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    backgroundColor: T.surface.s3,
  },
  pastilaActiva: { backgroundColor: T.accent.soft, borderColor: T.accent.line },
  pastilaGresita: { backgroundColor: "rgba(251,113,133,0.12)", borderColor: "rgba(251,113,133,0.30)" },
  textPastila: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_600SemiBold",
  },
  scara: { flexDirection: "row", gap: 5 },
  treapta: {
    flex: 1,
    height: 38,
    borderRadius: T.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface.s4,
  },
  treaptaActiva: { backgroundColor: T.accent.soft },
  textTreapta: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_700Bold",
  },
  textTreaptaActiv: { color: T.accent.base },
  analiza: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  faraAnaliza: {
    color: T.ink.i4,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  legatura: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: T.spacing.lg,
  },
  textLegatura: {
    color: T.accent.base,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_700Bold",
  },
});
