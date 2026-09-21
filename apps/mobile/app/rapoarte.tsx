import * as React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api } from "../src/lib/api";
import { useRouter } from "expo-router";
import { useCerere } from "../src/lib/useCerere";
import { bani, numar, procent } from "../src/lib/format";
import { faPdf, type Foaie } from "../src/lib/foaie";
import { Card } from "../src/ui/Card";
import { Buton } from "../src/ui/Buton";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { Paywall } from "../src/ui/Paywall";
import { Gol, GrilaStatistici, Rand, Sectiune, Segmente, Statistica } from "../src/ui/parti";
import { T, tonPnl, cifre } from "../src/theme";

// ── Rapoarte ─────────────────────────────────────────────────────────────────
//
// Două rapoarte, fiecare pentru altcineva: cel de PERFORMANȚĂ e pentru tine
// sau pentru o firmă de prop, cel FISCAL e pentru contabil.
//
// PDF-UL SE FACE PE TELEFON, din cifrele serverului. Pagina web îl scoate prin
// dialogul de tipărire al browserului, care pe Android nu există ca gest. Vezi
// `lib/foaie.ts` pentru ce înseamnă asta.
//
// AICI NU SE CALCULEAZĂ NIMIC. Ecranul formatează ce primește. La raportul
// fiscal asta nu e o preferință de arhitectură: o cifră care diferă între
// telefon și site n-ar fi o nepotrivire de interfață, ar fi o problemă cu
// Fiscul.
//
// SE VEDE ÎNAINTE SĂ SE TRIMITĂ. Un buton care scoate direct un PDF pe care
// nu l-ai văzut e un buton pe care îl apeși de trei ori ca să verifici.

const LUNI = [
  "ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
  "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie",
];

const FELURI = [
  { v: "performanta" as const, e: "Performanță" },
  { v: "fiscal" as const, e: "Fiscal" },
];

interface Performanta {
  currency: string;
  generatedAt: string;
  initialBalance: number;
  finalBalance: number;
  empty: boolean;
  summary: {
    totalTrades: number; wins: number; losses: number; winRate: number;
    totalPnl: number; grossProfit: number; grossLoss: number;
    profitFactor: number | null; avgWin: number; avgLoss: number;
    bestTrade: number; worstTrade: number; avgRR: number; maxDrawdown: number;
  };
  monthly: { month: string; pnl: number; trades: number }[];
  byInstrument: { label: string; winRate: number; total: number; pnl: number }[];
  bySetup: { label: string; winRate: number; total: number; pnl: number }[];
}

interface Fiscal {
  year: number;
  years: number[];
  currency: string;
  empty: boolean;
  summary: {
    totalTrades: number; grossGain: number; grossLoss: number;
    net: number; taxable: number; estTax: number;
  };
  monthly: { month: number; trades: number; pnl: number }[];
  byInstrument: { label: string; winRate: number; total: number; pnl: number }[];
}

export default function Rapoarte() {
  const router = useRouter();
  const [fel, setFel] = React.useState<"performanta" | "fiscal">("performanta");
  const [an, setAn] = React.useState<string | undefined>(undefined);
  const [lucreaza, setLucreaza] = React.useState(false);
  const [mesaj, setMesaj] = React.useState<string | null>(null);

  const perf = useCerere<Performanta>(() => api.rapoarte.performanta() as Promise<Performanta>);
  const fisc = useCerere<Fiscal>(() => api.rapoarte.fiscal(an) as Promise<Fiscal>, [an]);

  const c = fel === "performanta" ? perf : fisc;
  const p = perf.date;
  const f = fisc.date;

  const luna = (m: string) => {
    const [a, l] = m.split("-");
    return `${LUNI[Number(l) - 1] ?? l} ${a}`;
  };

  /* ── Foile, construite din aceleași cifre care se văd pe ecran ─────────── */

  const foaiaPerformanta = (): Foaie | null => {
    if (!p) return null;
    const m = p.currency;
    const s = p.summary;
    return {
      titlu: "Raport de performanță",
      subtitlu: `Generat pe ${new Date(p.generatedAt).toLocaleDateString("ro-RO", {
        day: "numeric", month: "long", year: "numeric",
      })} · ${s.totalTrades} tranzacții`,
      sectiuni: [
        {
          titlu: "Rezumat",
          perechi: [
            { cheie: "Rezultat net", valoare: bani(s.totalPnl, m), ton: s.totalPnl >= 0 ? "castig" : "pierdere" },
            { cheie: "Rată de câștig", valoare: procent(s.winRate) },
            { cheie: "Profit factor", valoare: s.profitFactor == null ? "—" : numar(s.profitFactor, 2) },
            { cheie: "RR mediu", valoare: numar(s.avgRR, 2) },
            { cheie: "Tranzacții", valoare: `${s.totalTrades} (${s.wins}W / ${s.losses}L)` },
            { cheie: "Drawdown maxim", valoare: procent(s.maxDrawdown, 2) },
            { cheie: "Profit brut", valoare: bani(s.grossProfit, m, false), ton: "castig" },
            { cheie: "Pierdere brută", valoare: bani(s.grossLoss, m, false), ton: "pierdere" },
            { cheie: "Câștig mediu", valoare: bani(s.avgWin, m, false), ton: "castig" },
            { cheie: "Pierdere medie", valoare: bani(s.avgLoss, m, false), ton: "pierdere" },
            { cheie: "Cea mai bună", valoare: bani(s.bestTrade, m), ton: "castig" },
            { cheie: "Cea mai slabă", valoare: bani(s.worstTrade, m), ton: "pierdere" },
            { cheie: "Sold inițial", valoare: bani(p.initialBalance, m, false) },
            { cheie: "Sold curent", valoare: bani(p.finalBalance, m, false) },
          ],
        },
        ...(p.monthly.length
          ? [{
              titlu: "Pe luni",
              capete: ["Luna", "Tranzacții", "Rezultat"],
              randuri: p.monthly.map((x) => ({
                eticheta: luna(x.month),
                valori: [String(x.trades), bani(x.pnl, m)],
                ton: (x.pnl >= 0 ? "castig" : "pierdere") as "castig" | "pierdere",
              })),
            }]
          : []),
        ...(p.byInstrument.length
          ? [{
              titlu: "Pe instrument",
              capete: ["Instrument", "Tranz.", "Rată", "Rezultat"],
              randuri: p.byInstrument.map((x) => ({
                eticheta: x.label,
                valori: [String(x.total), procent(x.winRate), bani(x.pnl, m)],
                ton: (x.pnl >= 0 ? "castig" : "pierdere") as "castig" | "pierdere",
              })),
            }]
          : []),
        ...(p.bySetup.length
          ? [{
              titlu: "Pe setup",
              capete: ["Setup", "Tranz.", "Rată", "Rezultat"],
              randuri: p.bySetup.map((x) => ({
                eticheta: x.label,
                valori: [String(x.total), procent(x.winRate), bani(x.pnl, m)],
                ton: (x.pnl >= 0 ? "castig" : "pierdere") as "castig" | "pierdere",
              })),
            }]
          : []),
      ],
      subsol:
        "Raport generat de TradeGx din tranzacțiile înregistrate în cont. Cifrele sunt informative și nu constituie consultanță de investiții.",
    };
  };

  const foaiaFiscala = (): Foaie | null => {
    if (!f) return null;
    const m = f.currency;
    const s = f.summary;
    return {
      titlu: `Raport fiscal ${f.year}`,
      subtitlu: `${s.totalTrades} tranzacții închise · toate conturile`,
      sectiuni: [
        {
          titlu: "Rezumat fiscal",
          perechi: [
            { cheie: "Câștig brut", valoare: bani(s.grossGain, m, false), ton: "castig" },
            { cheie: "Pierdere brută", valoare: bani(s.grossLoss, m, false), ton: "pierdere" },
            { cheie: "Rezultat net", valoare: bani(s.net, m), ton: s.net >= 0 ? "castig" : "pierdere" },
            { cheie: "Bază impozabilă", valoare: bani(s.taxable, m, false) },
            { cheie: "Impozit estimat", valoare: bani(s.estTax, m, false) },
            { cheie: "Tranzacții", valoare: String(s.totalTrades) },
          ],
          nota: "Impozitul e o ESTIMARE, calculată pe regulile generale. Nu înlocuiește un contabil și nu ține cont de situația ta particulară.",
        },
        ...(f.monthly.length
          ? [{
              titlu: "Pe luni",
              capete: ["Luna", "Tranzacții", "Rezultat"],
              randuri: f.monthly.map((x) => ({
                eticheta: LUNI[x.month - 1] ?? String(x.month),
                valori: [String(x.trades), bani(x.pnl, m)],
                ton: (x.pnl >= 0 ? "castig" : "pierdere") as "castig" | "pierdere",
              })),
            }]
          : []),
        ...(f.byInstrument.length
          ? [{
              titlu: "Pe instrument",
              capete: ["Instrument", "Tranz.", "Rată", "Rezultat"],
              randuri: f.byInstrument.map((x) => ({
                eticheta: x.label,
                valori: [String(x.total), procent(x.winRate), bani(x.pnl, m)],
                ton: (x.pnl >= 0 ? "castig" : "pierdere") as "castig" | "pierdere",
              })),
            }]
          : []),
      ],
      subsol:
        "Raport generat de TradeGx pe toate conturile, fiindcă impozitul se calculează pe persoană, nu pe cont. Verifică cifrele cu contabilul tău înainte de a le declara.",
    };
  };

  const scoate = async () => {
    const foaie = fel === "performanta" ? foaiaPerformanta() : foaiaFiscala();
    if (!foaie) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setLucreaza(true);
    setMesaj(null);
    const nume =
      fel === "performanta"
        ? `TradeGx-Performanta-${new Date().toISOString().slice(0, 10)}.pdf`
        : `TradeGx-Fiscal-${f?.year ?? ""}.pdf`;
    const r = await faPdf(foaie, nume);
    setLucreaza(false);
    if (r.fel === "eroare") setMesaj(r.mesaj);
    else if (r.fel === "salvat") setMesaj(`PDF salvat: ${r.cale}`);
    else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  if (fel === "fiscal" && fisc.stare === 402) {
    return (
      <Ecran titlu="Rapoarte" subtitlu="Pentru tine și pentru contabil">
        <Segmente valori={FELURI} valoare={fel} onSchimba={setFel} eticheta="Fel de raport" />
        <Paywall
          functie="Raport fiscal"
          descriere="Câștigul brut, pierderea brută, baza impozabilă și impozitul estimat pentru anul ales — pe toate conturile, ca la Fisc."
          puncte={[
            "Defalcare pe luni și pe instrument",
            "Calculat pe toate conturile, cum se declară",
            "PDF gata de trimis contabilului",
            "Istoric pe fiecare an în care ai tranzacționat",
          ]}
        />
      </Ecran>
    );
  }

  return (
    <Ecran
      titlu="Rapoarte"
      subtitlu={
        fel === "performanta"
          ? p
            ? `${p.summary.totalTrades} tranzacții`
            : "Cum a mers, pe hârtie"
          : f
            ? `Anul ${f.year}`
            : "Pentru contabil"
      }
      incarca={c.incarca && !c.date}
      scheletRanduri={4}
      reimprospateaza={c.reimprospateaza}
      onReia={c.reia}
      eroare={mesaj ?? c.eroare}
      subsol={
        c.date ? (
          <Buton
            eticheta="Scoate PDF-ul"
            onPress={scoate}
            incarca={lucreaza}
            plin
            iconita={<Ionicons name="share-outline" size={17} color="#ffffff" />}
          />
        ) : null
      }
    >
      <Segmente valori={FELURI} valoare={fel} onSchimba={setFel} eticheta="Fel de raport" />

      {fel === "performanta" ? (
        !p ? null : p.empty ? (
          <Gol
            iconita="document-text-outline"
            titlu="Nimic de raportat încă"
            text="Raportul adună ce s-a întâmplat: rezultat, rată de câștig, defalcare pe luni, instrumente și setup-uri. Are nevoie de tranzacții închise."
            actiune={
              <Buton
                eticheta="Adaugă o tranzacție"
                onPress={() => router.push("/(tabs)/adauga")}
                iconita={<Ionicons name="add" size={16} color="#ffffff" />}
              />
            }
          />
        ) : (
          <>
            <Reveal>
              <Card>
                <GrilaStatistici>
                  <Statistica
                    eticheta="Rezultat net"
                    valoare={bani(p.summary.totalPnl, p.currency)}
                    culoare={tonPnl(p.summary.totalPnl)}
                    marime={T.fontSize.xl}
                    style={st.celula}
                  />
                  <Statistica
                    eticheta="Rată de câștig"
                    valoare={procent(p.summary.winRate)}
                    marime={T.fontSize.xl}
                    intarziere={70}
                    nota={`${p.summary.wins}W / ${p.summary.losses}L`}
                    style={st.celula}
                  />
                  <Statistica
                    eticheta="Profit factor"
                    valoare={p.summary.profitFactor == null ? "—" : numar(p.summary.profitFactor, 2)}
                    marime={T.fontSize.lg}
                    intarziere={140}
                    style={st.celula}
                  />
                  <Statistica
                    eticheta="Drawdown maxim"
                    valoare={procent(p.summary.maxDrawdown, 2)}
                    culoare={p.summary.maxDrawdown > 20 ? T.pnl.loss : T.ink.i1}
                    marime={T.fontSize.lg}
                    intarziere={210}
                    style={st.celula}
                  />
                </GrilaStatistici>

                <View style={st.linie} />

                <Rand cheie="Profit brut" valoare={bani(p.summary.grossProfit, p.currency, false)} culoare={T.pnl.gain} />
                <Rand cheie="Pierdere brută" valoare={bani(p.summary.grossLoss, p.currency, false)} culoare={T.pnl.loss} />
                <Rand cheie="RR mediu" valoare={numar(p.summary.avgRR, 2)} />
                <Rand cheie="Sold inițial → curent" valoare={`${numar(p.initialBalance, 0)} → ${numar(p.finalBalance, 0)}`} />
              </Card>
            </Reveal>

            <Tabel
              titlu="Pe luni"
              capete={["Luna", "Tranz.", "Rezultat"]}
              randuri={p.monthly.map((x) => ({
                eticheta: luna(x.month),
                valori: [String(x.trades), bani(x.pnl, "")],
                pnl: x.pnl,
              }))}
            />
            <Tabel
              titlu="Pe instrument"
              capete={["Instrument", "Rată", "Rezultat"]}
              randuri={p.byInstrument.map((x) => ({
                eticheta: x.label,
                valori: [procent(x.winRate), bani(x.pnl, "")],
                pnl: x.pnl,
              }))}
            />
            <Tabel
              titlu="Pe setup"
              capete={["Setup", "Rată", "Rezultat"]}
              randuri={p.bySetup.map((x) => ({
                eticheta: x.label,
                valori: [procent(x.winRate), bani(x.pnl, "")],
                pnl: x.pnl,
              }))}
            />
          </>
        )
      ) : !f ? null : (
        <>
          {f.years.length > 1 ? (
            <Segmente
              valori={f.years.map((y) => ({ v: String(y), e: String(y) }))}
              valoare={String(an ?? f.year)}
              onSchimba={setAn}
              eticheta="Anul"
            />
          ) : null}

          {f.empty ? (
            <Gol
              iconita="receipt-outline"
              titlu={`Nimic în ${f.year}`}
              text="Nicio tranzacție închisă în anul ăsta."
            />
          ) : (
            <>
              <Reveal>
                <Card culoareMuchie={T.accent.line}>
                  <GrilaStatistici>
                    <Statistica
                      eticheta="Rezultat net"
                      valoare={bani(f.summary.net, f.currency)}
                      culoare={tonPnl(f.summary.net)}
                      marime={T.fontSize.xl}
                      style={st.celula}
                    />
                    <Statistica
                      eticheta="Impozit estimat"
                      valoare={bani(f.summary.estTax, f.currency, false)}
                      marime={T.fontSize.xl}
                      intarziere={70}
                      style={st.celula}
                    />
                  </GrilaStatistici>

                  <View style={st.linie} />

                  <Rand cheie="Câștig brut" valoare={bani(f.summary.grossGain, f.currency, false)} culoare={T.pnl.gain} />
                  <Rand cheie="Pierdere brută" valoare={bani(f.summary.grossLoss, f.currency, false)} culoare={T.pnl.loss} />
                  <Rand cheie="Bază impozabilă" valoare={bani(f.summary.taxable, f.currency, false)} />
                  <Rand cheie="Tranzacții închise" valoare={numar(f.summary.totalTrades, 0)} />
                </Card>
              </Reveal>

              <View style={st.avertisment}>
                <Ionicons name="information-circle-outline" size={14} color={T.state.warn} />
                <Text style={st.textAvertisment}>
                  Impozitul e o estimare pe regulile generale, calculată pe toate conturile —
                  așa se declară. Nu înlocuiește un contabil.
                </Text>
              </View>

              <Tabel
                titlu="Pe luni"
                capete={["Luna", "Tranz.", "Rezultat"]}
                randuri={f.monthly.map((x) => ({
                  eticheta: LUNI[x.month - 1] ?? String(x.month),
                  valori: [String(x.trades), bani(x.pnl, "")],
                  pnl: x.pnl,
                }))}
              />
              <Tabel
                titlu="Pe instrument"
                capete={["Instrument", "Rată", "Rezultat"]}
                randuri={f.byInstrument.map((x) => ({
                  eticheta: x.label,
                  valori: [procent(x.winRate), bani(x.pnl, "")],
                  pnl: x.pnl,
                }))}
              />
            </>
          )}
        </>
      )}
    </Ecran>
  );
}

function Tabel({
  titlu, capete, randuri,
}: {
  titlu: string;
  capete: string[];
  randuri: { eticheta: string; valori: string[]; pnl: number }[];
}) {
  if (randuri.length === 0) return null;
  return (
    <>
      <Sectiune titlu={titlu} />
      <Card faraPadding>
        <View style={[st.rand, st.cap]}>
          {capete.map((c, i) => (
            <Text key={c} style={[st.textCap, i > 0 && st.dr, i === 0 && st.primaColoana]}>
              {c}
            </Text>
          ))}
        </View>
        {randuri.map((r, i) => (
          <View key={`${r.eticheta}-${i}`} style={[st.rand, st.cuLinie]}>
            <Text style={[st.celulaText, st.primaColoana]} numberOfLines={1}>{r.eticheta}</Text>
            {r.valori.map((v, j) => (
              <Text
                key={j}
                style={[
                  st.celulaText,
                  st.dr,
                  cifre,
                  j === r.valori.length - 1 && { color: tonPnl(r.pnl) },
                ]}
              >
                {v}
              </Text>
            ))}
          </View>
        ))}
      </Card>
    </>
  );
}

const st = StyleSheet.create({
  celula: { width: "50%" },
  linie: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.line.l1,
    marginVertical: T.spacing.lg,
  },
  avertisment: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: T.spacing.md,
  },
  textAvertisment: {
    flex: 1,
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  rand: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: T.spacing.lg,
    paddingVertical: T.spacing.md,
  },
  cap: { paddingBottom: T.spacing.sm },
  cuLinie: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: T.line.l1 },
  primaColoana: { flex: 1.6, textAlign: "left" },
  dr: { flex: 1, textAlign: "right" },
  textCap: {
    color: T.ink.i4,
    fontSize: 9,
    fontFamily: "Inter_800ExtraBold",
    textTransform: "uppercase",
    letterSpacing: T.tracking.wide,
  },
  celulaText: {
    color: T.ink.i2,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
});
