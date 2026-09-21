import * as React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { tr } from "../src/lib/i18n";
import { Text } from "../src/ui/Text";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { clasificaSimbol } from "@tradegx/core";
import { api, ApiError } from "../src/lib/api";
import { useCerere } from "../src/lib/useCerere";
import { numar } from "../src/lib/format";
import { Card } from "../src/ui/Card";
import { Camp } from "../src/ui/Camp";
import { Buton } from "../src/ui/Buton";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { Gol, Insigna, Sectiune } from "../src/ui/parti";
import { T, tonPnl, cifre } from "../src/theme";

// ── Lista de urmărire ────────────────────────────────────────────────────────
//
// Până acum puteai VEDEA alertele primite, dar nu puteai crea niciuna — ceea ce
// e ca un ceas deșteptător care sună doar dacă îl potrivește altcineva.
//
// ALERTA E O PERECHE DE PRAGURI, nu o notificare cu text. Pui „peste” sau
// „sub”, iar cronul de la server compară la fiecare zece minute. De aceea nu se
// declanșează instant când prețul atinge nivelul — și ecranul o spune, în loc
// să lase pe cineva să creadă că a ratat o alertă.
//
// PRAGURILE SUNT SUGERATE din prețul curent (±0,5%), nu goale. Un câmp gol pe
// un simbol la 1,08432 te pune să tastezi cinci zecimale cu degetul mare;
// sugestia se corectează în două atingeri.
//
// Alertele de preț sunt în planul PRO. Ecranul rămâne folosibil fără el — lista
// se vede, se adaugă simboluri — doar salvarea pragurilor cere abonament, și o
// spune înainte, nu după ce ai completat.

const INSTRUMENTE: Record<string, string> = {
  FOREX: "FOREX",
  METAL: "METALS",
  INDICE: "INDICES",
  CRIPTO: "CRYPTO",
  MARFA: "COMMODITIES",
};

interface Element {
  id: string;
  symbol: string;
  instrumentType: string;
  alertAbove: string | number | null;
  alertBelow: string | number | null;
  groupName: string | null;
}

interface Cotatie {
  price?: string;
  percent_change?: string;
}

/** Simbolurile din watchlist, în forma cerută de ruta de cotații. */
const cuBara = (s: string): string =>
  s.length === 6 && /^[A-Z]{6}$/.test(s) ? `${s.slice(0, 3)}/${s.slice(3)}` : s;

export default function Watchlist() {
  const lista = useCerere<Element[]>(() => api.watchlist.list() as Promise<Element[]>);
  const elemente = React.useMemo(() => lista.date ?? [], [lista.date]);

  const preturi = useCerere<Record<string, Cotatie>>(
    async () => {
      if (elemente.length === 0) return {};
      const r = (await api.market.cotatii(elemente.map((e) => cuBara(e.symbol)))) as {
        quotes?: Record<string, Cotatie>;
      };
      return r.quotes ?? {};
    },
    [elemente.length],
  );

  const [simbolNou, setSimbolNou] = React.useState("");
  const [adauga, setAdauga] = React.useState(false);
  const [editat, setEditat] = React.useState<Element | null>(null);
  const [mesaj, setMesaj] = React.useState<string | null>(null);

  const pretul = (e: Element): number | null => {
    const q = preturi.date?.[cuBara(e.symbol)];
    const p = q?.price == null ? null : Number(q.price);
    return p != null && Number.isFinite(p) ? p : null;
  };

  const adaugaSimbol = async () => {
    const s = simbolNou.trim().toUpperCase();
    if (s.length < 2) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setAdauga(true);
    setMesaj(null);
    try {
      await api.watchlist.add({
        symbol: s,
        instrumentType: INSTRUMENTE[clasificaSimbol(s)] ?? "FOREX",
      });
      setSimbolNou("");
      lista.reia();
    } catch (e) {
      setMesaj(
        e instanceof ApiError && e.status === 409
          ? "Simbolul e deja în listă."
          : e instanceof ApiError ? e.message : "Nu am putut adăuga simbolul.",
      );
    } finally {
      setAdauga(false);
    }
  };

  const scoate = async (e: Element) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      await api.watchlist.remove(e.id);
      lista.reia();
    } catch {
      setMesaj("Nu am putut scoate simbolul.");
    }
  };

  const cuAlerta = elemente.filter((e) => e.alertAbove != null || e.alertBelow != null).length;

  return (
    <Ecran
      titlu="Urmărite"
      subtitlu={
        elemente.length > 0
          ? `${elemente.length} simboluri · ${cuAlerta} cu alertă`
          : "Simbolurile tale și pragurile lor"
      }
      incarca={lista.incarca && elemente.length === 0}
      scheletRanduri={4}
      reimprospateaza={lista.reimprospateaza || preturi.reimprospateaza}
      onReia={() => { lista.reia(); preturi.reia(); }}
      eroare={mesaj ?? lista.eroare}
    >
      <Reveal>
        <Card>
          <View style={st.randAdauga}>
            <Camp
              eticheta="Adaugă simbol"
              valoare={simbolNou}
              onChange={(v) => setSimbolNou(v.toUpperCase())}
              placeholder="EURUSD"
              autoCapitalize="characters"
              onSubmit={adaugaSimbol}
              returnKeyType="done"
              style={{ flex: 1 }}
            />
            <Buton
              eticheta="Adaugă"
              varianta="secundar"
              onPress={adaugaSimbol}
              incarca={adauga}
              dezactivat={simbolNou.trim().length < 2}
              style={st.butonAdauga}
            />
          </View>
        </Card>
      </Reveal>

      {elemente.length === 0 ? (
        <Gol
          iconita="eye-outline"
          titlu="Nimic urmărit încă"
          text="Adaugă un simbol mai sus, apoi pune-i un prag. Te anunțăm când prețul îl trece."
        />
      ) : (
        <>
          <Sectiune
            titlu="Lista ta"
            nota="Pragurile se verifică din zece în zece minute, nu în timp real."
          />
          {elemente.map((e, i) => {
            const p = pretul(e);
            const q = preturi.date?.[cuBara(e.symbol)];
            const variatie = q?.percent_change == null ? null : Number(q.percent_change);
            const peste = e.alertAbove == null ? null : Number(e.alertAbove);
            const sub = e.alertBelow == null ? null : Number(e.alertBelow);

            return (
              <Reveal key={e.id} intarziere={i * 45} style={{ marginBottom: T.spacing.sm }}>
                <Card
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setEditat(e);
                  }}
                  onLongPress={() => scoate(e)}
                  culoareMuchie={peste != null || sub != null ? T.accent.line : "rgba(255,255,255,0.04)"}
                  accesibilEticheta={`${e.symbol}. Apasă pentru praguri, apasă lung ca să scoți din listă.`}
                >
                  <View style={st.rand}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={st.simbol}>{e.symbol}</Text>
                      <View style={st.praguri}>
                        {peste != null ? (
                          <View style={st.prag}>
                            <Ionicons name="arrow-up" size={10} color={T.pnl.gain} />
                            <Text style={[st.textPrag, cifre]}>{numar(peste, 5)}</Text>
                          </View>
                        ) : null}
                        {sub != null ? (
                          <View style={st.prag}>
                            <Ionicons name="arrow-down" size={10} color={T.pnl.loss} />
                            <Text style={[st.textPrag, cifre]}>{numar(sub, 5)}</Text>
                          </View>
                        ) : null}
                        {peste == null && sub == null ? (
                          <Text style={st.faraPrag}>fără prag — apasă ca să pui unul</Text>
                        ) : null}
                      </View>
                    </View>

                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={[st.pret, cifre]}>{p == null ? "—" : numar(p, 5)}</Text>
                      {variatie != null ? (
                        <Text style={[st.variatie, { color: tonPnl(variatie) }]}>
                          {variatie > 0 ? "+" : variatie < 0 ? "−" : ""}
                          {Math.abs(variatie).toFixed(2)}%
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </Card>
              </Reveal>
            );
          })}

          <Text style={st.subsol}>
            Apasă lung pe un simbol ca să-l scoți din listă.
          </Text>
        </>
      )}

      <DialogPraguri
        element={editat}
        pretCurent={editat ? pretul(editat) : null}
        onInchide={() => setEditat(null)}
        onSalvat={() => { setEditat(null); lista.reia(); }}
        onEroare={setMesaj}
      />
    </Ecran>
  );
}

function DialogPraguri({
  element, pretCurent, onInchide, onSalvat, onEroare,
}: {
  element: Element | null;
  pretCurent: number | null;
  onInchide: () => void;
  onSalvat: () => void;
  onEroare: (m: string) => void;
}) {
  const [peste, setPeste] = React.useState("");
  const [sub, setSub] = React.useState("");
  const [salveaza, setSalveaza] = React.useState(false);
  const [proCerut, setProCerut] = React.useState(false);

  React.useEffect(() => {
    if (!element) return;
    setProCerut(false);
    setPeste(element.alertAbove == null ? "" : String(Number(element.alertAbove)));
    setSub(element.alertBelow == null ? "" : String(Number(element.alertBelow)));
  }, [element]);

  const sugereaza = (directie: "peste" | "sub") => {
    if (pretCurent == null) return;
    Haptics.selectionAsync().catch(() => {});
    const v = directie === "peste" ? pretCurent * 1.005 : pretCurent * 0.995;
    const zec = pretCurent > 1000 ? 1 : pretCurent > 10 ? 2 : 5;
    if (directie === "peste") setPeste(v.toFixed(zec));
    else setSub(v.toFixed(zec));
  };

  const nr = (v: string): number | null => {
    if (v.trim() === "") return null;
    const x = Number(v.replace(",", "."));
    return Number.isFinite(x) && x > 0 ? x : null;
  };

  const salveaza_ = async () => {
    if (!element) return;
    setSalveaza(true);
    try {
      await api.request("/api/watchlist", {
        method: "PATCH",
        body: JSON.stringify({
          id: element.id,
          alertAbove: nr(peste),
          alertBelow: nr(sub),
        }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onSalvat();
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        setProCerut(true);
      } else {
        onEroare(e instanceof ApiError ? e.message : "Nu am putut salva pragurile.");
        onInchide();
      }
    } finally {
      setSalveaza(false);
    }
  };

  return (
    <Modal visible={element != null} animationType="slide" transparent onRequestClose={onInchide}>
      <View style={st.voal}>
        <SafeAreaView style={st.foaie} edges={["bottom"]}>
          <View style={st.manerFoaie}>
            <View style={st.maner} />
          </View>

          <View style={st.antetFoaie}>
            <View style={{ flex: 1 }}>
              <Text style={st.titluFoaie}>{element?.symbol}</Text>
              {pretCurent != null ? (
                <Text style={st.subFoaie}>acum {numar(pretCurent, 5)}</Text>
              ) : null}
            </View>
            <Pressable onPress={onInchide} hitSlop={10} accessibilityRole="button" accessibilityLabel={tr("Închide")}>
              <Ionicons name="close" size={20} color={T.ink.i3} />
            </Pressable>
          </View>

          <View style={st.corpFoaie}>
            {proCerut ? (
              <View style={st.pro}>
                <Ionicons name="lock-closed" size={17} color={T.accent.base} />
                <Text style={st.textPro}>
                  Alertele de preț sunt în planul PRO. Lista rămâne a ta oricum —
                  doar pragurile cer abonament.
                </Text>
              </View>
            ) : null}

            <View style={st.randPrag}>
              <Camp
                eticheta="Anunță-mă peste"
                valoare={peste}
                onChange={setPeste}
                numeric
                placeholder="gol = fără"
                style={{ flex: 1 }}
              />
              <Pressable
                onPress={() => sugereaza("peste")}
                style={st.sugestie}
                accessibilityRole="button"
                accessibilityLabel={tr("Sugerează prag peste")}
              >
                <Text style={st.textSugestie}>+0,5%</Text>
              </Pressable>
            </View>

            <View style={st.randPrag}>
              <Camp
                eticheta="Anunță-mă sub"
                valoare={sub}
                onChange={setSub}
                numeric
                placeholder="gol = fără"
                style={{ flex: 1 }}
              />
              <Pressable
                onPress={() => sugereaza("sub")}
                style={st.sugestie}
                accessibilityRole="button"
                accessibilityLabel={tr("Sugerează prag sub")}
              >
                <Text style={st.textSugestie}>−0,5%</Text>
              </Pressable>
            </View>

            <View style={st.notaCutie}>
              <Ionicons name="time-outline" size={13} color={T.ink.i4} />
              <Text style={st.nota}>
                Pragurile se verifică din zece în zece minute. Nu e o alertă în timp
                real — dacă prețul atinge nivelul și se întoarce între verificări,
                nu vei primi nimic.
              </Text>
            </View>

            <Buton
              eticheta="Salvează pragurile"
              onPress={salveaza_}
              incarca={salveaza}
              plin
              iconita={<Ionicons name="notifications-outline" size={16} color="#ffffff" />}
            />

            {(element?.alertAbove != null || element?.alertBelow != null) ? (
              <Buton
                eticheta="Scoate pragurile"
                varianta="secundar"
                onPress={() => { setPeste(""); setSub(""); }}
                plin
                style={{ marginTop: T.spacing.sm }}
              />
            ) : null}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  randAdauga: { flexDirection: "row", alignItems: "flex-start", gap: T.spacing.sm },
  butonAdauga: { marginTop: 21, paddingHorizontal: T.spacing.lg },
  rand: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  simbol: {
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.tight,
  },
  praguri: { flexDirection: "row", gap: T.spacing.md, marginTop: 4, flexWrap: "wrap" },
  prag: { flexDirection: "row", alignItems: "center", gap: 3 },
  textPrag: {
    color: T.ink.i3,
    fontSize: T.fontSize.xs,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  faraPrag: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
  pret: {
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  variatie: {
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  subsol: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: T.spacing.md,
  },
  voal: { flex: 1, backgroundColor: "rgba(0,0,0,0.62)", justifyContent: "flex-end" },
  foaie: {
    backgroundColor: T.surface.s1,
    borderTopLeftRadius: T.radius["2xl"],
    borderTopRightRadius: T.radius["2xl"],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l2,
  },
  manerFoaie: { alignItems: "center", paddingTop: T.spacing.md },
  maner: { width: 34, height: 4, borderRadius: 2, backgroundColor: T.line.top },
  antetFoaie: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.lg,
  },
  titluFoaie: {
    color: T.ink.i1,
    fontSize: T.fontSize.lg,
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.tight,
  },
  subFoaie: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "SpaceGrotesk_500Medium",
    marginTop: 2,
  },
  corpFoaie: {
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.lg,
    paddingBottom: T.spacing.xl,
  },
  randPrag: { flexDirection: "row", alignItems: "flex-start", gap: T.spacing.sm },
  sugestie: {
    marginTop: 21,
    minHeight: 48,
    paddingHorizontal: T.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: T.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    backgroundColor: T.surface.s3,
  },
  textSugestie: {
    color: T.ink.i3,
    fontSize: T.fontSize.xs,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  notaCutie: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: T.spacing.lg,
  },
  nota: {
    flex: 1,
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  pro: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: T.spacing.md,
    padding: T.spacing.md,
    borderRadius: T.radius.md,
    backgroundColor: T.accent.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.accent.line,
    marginBottom: T.spacing.lg,
  },
  textPro: {
    flex: 1,
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
});
