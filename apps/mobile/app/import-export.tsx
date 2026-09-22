import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "../src/ui/Text";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api, ApiError } from "../src/lib/api";
import { useRouter } from "expo-router";
import { useCerere } from "../src/lib/useCerere";
import { dataScurta, numar } from "../src/lib/format";
import { alegeFisierText, faCsv, trimiteText } from "../src/lib/fisiere";
import { Card } from "../src/ui/Card";
import { Buton } from "../src/ui/Buton";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { Gol, Insigna, Rand, Sectiune } from "../src/ui/parti";
import { T } from "../src/theme";
import { umple } from "../src/lib/i18n";

// ── Import și export ─────────────────────────────────────────────────────────
//
// Drumul de intrare și cel de ieșire pentru tranzacții, amândouă prin foile de
// sistem: alegi un fișier din Drive/Descărcări, sau trimiți unul pe WhatsApp.
// Aplicația nu cere nicio permisiune de stocare — alegătoarele moderne dau
// exact fișierul ales și nimic altceva.
//
// IMPORTUL CERE CONTUL ÎNTÂI, nu după. Un fișier ales și apoi întrebarea „în ce
// cont?" înseamnă că poți alege greșit cu fișierul deja citit; aici contul e
// vizibil tot timpul, iar butonul nu se apasă fără el.
//
// REZULTATUL SPUNE ȘI CE N-A MERS. Ruta întoarce primele zece erori — le
// arătăm pe toate zece. Un „importate: 43” fără numărul celor sărite lasă omul
// să creadă că are tot.
//
// EXPORTUL SE FACE ÎN APLICAȚIE, din lista pe care o are deja. Nu există rută
// de CSV pe server, iar a adăuga una pentru ceva ce se poate construi din date
// pe care le-am descărcat oricum ar fi fost o cerere de rețea în plus.

interface Cont {
  id: string;
  name: string;
  currency: string;
  isActive: boolean;
  _count?: { trades: number };
}

interface Tranzactie {
  id: string;
  symbol: string;
  direction: string;
  status: string;
  lotSize: string | number;
  entryPrice: string | number;
  exitPrice: string | number | null;
  stopLoss: string | number | null;
  takeProfit: string | number | null;
  entryTime: string;
  exitTime: string | null;
  pnlMoney: string | number | null;
  commission: string | number | null;
  swap: string | number | null;
  setupType: string | null;
  timeframe: string | null;
  notes: string | null;
}

interface Rezultat {
  imported: number;
  errors: number;
  errorDetails?: string[];
  debug?: { format?: string; totalRows?: number };
}

export default function ImportExport() {
  const router = useRouter();
  const conturi = useCerere<Cont[]>(() => api.accounts.list() as Promise<Cont[]>);
  const lista = useCerere<{ trades: Tranzactie[] }>(
    () => api.trades.list() as Promise<{ trades: Tranzactie[] }>,
  );

  const [contAles, setContAles] = React.useState<string | null>(null);
  const [lucreaza, setLucreaza] = React.useState(false);
  const [rezultat, setRezultat] = React.useState<Rezultat | null>(null);
  const [mesaj, setMesaj] = React.useState<string | null>(null);
  const [numeFisier, setNumeFisier] = React.useState<string | null>(null);

  // Contul activ e alegerea implicită — cel mai probabil acolo vrei să imporți.
  React.useEffect(() => {
    if (contAles || !conturi.date?.length) return;
    setContAles((conturi.date.find((c) => c.isActive) ?? conturi.date[0])!.id);
  }, [conturi.date, contAles]);

  const importa = async () => {
    if (!contAles) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setMesaj(null);
    setRezultat(null);

    const f = await alegeFisierText();
    if (f.fel === "anulat") return;
    if (f.fel === "eroare") { setMesaj(f.mesaj); return; }

    setNumeFisier(f.nume);
    setLucreaza(true);
    try {
      const r = (await api.trades.importa({
        accountId: contAles,
        csvContent: f.continut,
        fileType: /\.html?$/i.test(f.nume) ? "html" : "csv",
      })) as Rezultat;
      setRezultat(r);
      Haptics.notificationAsync(
        r.imported > 0
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {});
      lista.reia();
    } catch (e) {
      setMesaj(e instanceof ApiError ? e.message : "Importul nu a reușit.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setLucreaza(false);
    }
  };

  const exporta = async () => {
    const t = lista.date?.trades ?? [];
    if (t.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLucreaza(true);
    setMesaj(null);

    const csv = faCsv(
      [
        "Simbol", "Directie", "Stare", "Lot", "Intrare", "Iesire",
        "Stop loss", "Take profit", "Deschisa", "Inchisa",
        "Rezultat", "Comision", "Swap", "Setup", "Interval", "Nota",
      ],
      t.map((x) => [
        x.symbol,
        x.direction,
        x.status,
        Number(x.lotSize),
        Number(x.entryPrice),
        x.exitPrice == null ? null : Number(x.exitPrice),
        x.stopLoss == null ? null : Number(x.stopLoss),
        x.takeProfit == null ? null : Number(x.takeProfit),
        x.entryTime,
        x.exitTime,
        x.pnlMoney == null ? null : Number(x.pnlMoney),
        x.commission == null ? null : Number(x.commission),
        x.swap == null ? null : Number(x.swap),
        x.setupType,
        x.timeframe,
        x.notes,
      ]),
    );

    const r = await trimiteText(
      csv,
      `TradeGx-tranzactii-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    setLucreaza(false);
    if (r.fel === "eroare") setMesaj(r.mesaj);
    else if (r.fel === "salvat") setMesaj(umple("Fișier salvat: {p1}", { p1: r.cale }));
  };

  const cont = conturi.date?.find((c) => c.id === contAles) ?? null;
  const cateTranzactii = lista.date?.trades.length ?? 0;

  return (
    <Ecran
      titlu="Import și export"
      subtitlu="Mută tranzacțiile în și din aplicație"
      incarca={conturi.incarca && !conturi.date}
      scheletRanduri={3}
      reimprospateaza={conturi.reimprospateaza}
      onReia={() => { conturi.reia(); lista.reia(); }}
      eroare={mesaj ?? conturi.eroare}
    >
      {/* ── Import ── */}
      <Sectiune titlu="Import" nota="CSV de la broker, sau raportul HTML din MT4/MT5." />

      {(conturi.date?.length ?? 0) === 0 ? (
        <Gol
          iconita="wallet-outline"
          titlu="Niciun cont"
          text="Tranzacțiile importate intră într-un cont, ca să se știe pe ce sold s-au întâmplat."
          actiune={
            <Buton
              eticheta="Adaugă un cont"
              onPress={() => router.push("/cont-nou")}
              iconita={<Ionicons name="add" size={16} color="#ffffff" />}
            />
          }
        />
      ) : (
        <>
          <Reveal>
            <Card>
              <Text style={st.eticheta}>În ce cont</Text>
              <View style={st.conturi}>
                {(conturi.date ?? []).map((c) => {
                  const activ = c.id === contAles;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setContAles(c.id);
                      }}
                      style={[st.pastilaCont, activ && st.pastilaActiva]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: activ }}
                    >
                      <Text style={[st.textCont, activ && { color: T.accent.base }]} numberOfLines={1}>
                        {c.name}
                      </Text>
                      <Text style={st.subCont}>{c._count?.trades ?? 0} tranz.</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Buton
                eticheta="Alege fișierul"
                onPress={importa}
                incarca={lucreaza}
                dezactivat={!contAles}
                plin
                style={{ marginTop: T.spacing.lg }}
                iconita={<Ionicons name="cloud-upload-outline" size={16} color="#ffffff" />}
              />

              <Text style={st.nota}>
                Tranzacțiile deja existente nu se dublează — se recunosc după simbol,
                preț și oră.
              </Text>
            </Card>
          </Reveal>

          {rezultat ? (
            <Reveal style={{ marginTop: T.spacing.md }}>
              <Card
                culoareMuchie={
                  rezultat.imported > 0 ? "rgba(52,211,153,0.35)" : "rgba(251,191,36,0.35)"
                }
              >
                <View style={st.antetRezultat}>
                  <Ionicons
                    name={rezultat.imported > 0 ? "checkmark-circle" : "alert-circle-outline"}
                    size={19}
                    color={rezultat.imported > 0 ? T.pnl.gain : T.state.warn}
                  />
                  <Text style={st.titluRezultat}>
                    {rezultat.imported > 0
                      ? umple(rezultat.imported === 1 ? "{n} tranzacție importată" : "{n} tranzacții importate", { n: rezultat.imported })
                      : "Nicio tranzacție importată"}
                  </Text>
                  {numeFisier ? <Insigna text={numeFisier} culoare={T.ink.i4} /> : null}
                </View>

                <Rand
                  cheie="Rânduri sărite"
                  valoare={numar(rezultat.errors, 0)}
                  culoare={rezultat.errors > 0 ? T.state.warn : T.ink.i1}
                />
                {rezultat.debug?.format ? (
                  <Rand cheie="Format recunoscut" valoare={rezultat.debug.format} numeric={false} />
                ) : null}

                {rezultat.errorDetails && rezultat.errorDetails.length > 0 ? (
                  <View style={st.erori}>
                    <Text style={st.titluErori}>DE CE AU FOST SĂRITE</Text>
                    {rezultat.errorDetails.map((e, i) => (
                      <Text key={i} style={st.eroare}>• {e}</Text>
                    ))}
                  </View>
                ) : null}
              </Card>
            </Reveal>
          ) : null}
        </>
      )}

      {/* ── Export ── */}
      <Sectiune titlu="Export" nota="Toate tranzacțiile, ca fișier CSV." />
      <Reveal>
        <Card>
          <Rand cheie="Tranzacții în cont" valoare={numar(cateTranzactii, 0)} />
          {cont ? <Rand cheie="Moneda" valoare={cont.currency} numeric={false} /> : null}
          <Rand cheie="Data exportului" valoare={dataScurta(new Date())} numeric={false} />

          <Buton
            eticheta="Exportă CSV"
            varianta="secundar"
            onPress={exporta}
            incarca={lucreaza}
            dezactivat={cateTranzactii === 0}
            plin
            style={{ marginTop: T.spacing.lg }}
            iconita={<Ionicons name="share-outline" size={16} color={T.ink.i1} />}
          />
          <Text style={st.nota}>
            Se deschide foaia de partajare — îl trimiți pe email, pe WhatsApp, sau îl
            salvezi în Drive.
          </Text>
        </Card>
      </Reveal>
    </Ecran>
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
  conturi: { gap: 6 },
  pastilaCont: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: T.spacing.md,
    minHeight: 44,
    paddingHorizontal: T.spacing.md,
    borderRadius: T.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    backgroundColor: T.surface.s3,
  },
  pastilaActiva: { backgroundColor: T.accent.soft, borderColor: T.accent.line },
  textCont: {
    flex: 1,
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_700Bold",
  },
  subCont: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
  nota: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    marginTop: T.spacing.md,
  },
  antetRezultat: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.sm,
    marginBottom: T.spacing.md,
  },
  titluRezultat: {
    flex: 1,
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_700Bold",
  },
  erori: {
    marginTop: T.spacing.md,
    paddingTop: T.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.line.l1,
    gap: 4,
  },
  titluErori: {
    color: T.ink.i4,
    fontSize: 9,
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.wider,
    marginBottom: 3,
  },
  eroare: {
    color: T.ink.i3,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
});
