import * as React from "react";
import { Alert, Pressable, StyleSheet, Switch, View } from "react-native";
import { tr } from "../src/lib/i18n";
import { Text } from "../src/ui/Text";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api, ApiError } from "../src/lib/api";
import { useCerere } from "../src/lib/useCerere";
import { useAuth } from "../src/lib/auth";
import { faPdf } from "../src/lib/foaie";
import { Card } from "../src/ui/Card";
import { Camp } from "../src/ui/Camp";
import { Buton } from "../src/ui/Buton";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { Insigna, Sectiune } from "../src/ui/parti";
import { T, ATINGERE_MIN } from "../src/theme";
import { umple } from "../src/lib/i18n";

// ── Toate setările ───────────────────────────────────────────────────────────
//
// Ultimul loc din aplicație care mai trimitea în browser. Web-ul are nouă
// taburi; aici sunt cele care au sens pe telefon, în ordinea în care se umblă
// la ele: cine ești, ce te anunță, cum intri, ce date ai.
//
// CE N-AM ADUS, și de ce: cheile de API ale brokerilor. Se lipesc o dată, de pe
// calculator, dintr-un panou al brokerului care oricum nu se deschide comod pe
// telefon. Un formular aici ar fi fost o invitație să tastezi o cheie de
// producție cu degetul mare.
//
// NOTIFICĂRILE SE SALVEAZĂ LA FIECARE COMUTARE, fără buton. Zece comutatoare
// și un „Salvează” jos înseamnă că jumătate din oameni ies fără să apese.
// Restul ecranului are buton, fiindcă acolo se scrie text.
//
// ȘTERGEREA CONTULUI CERE SĂ SCRII CUVÂNTUL. O confirmare cu două butoane se
// apasă din reflex; aici trebuie să te oprești și să tastezi.

const MONEDE = ["USD", "EUR", "GBP", "RON", "CHF", "JPY"];

const NOTIFICARI = [
  { grup: "Antrenorul AI", chei: [
    { cheie: "overtrading", text: "Overtrading", sub: "Când tranzacționezi mai mult decât ți-ai propus" },
    { cheie: "revenge_trading", text: "Tranzacții de răzbunare", sub: "Intrări imediat după o pierdere" },
    { cheie: "fomo", text: "FOMO", sub: "Intrări după o mișcare deja făcută" },
    { cheie: "risk_exceeded", text: "Risc depășit", sub: "Când treci de riscul tău pe tranzacție" },
  ]},
  { grup: "Prop firm și piață", chei: [
    { cheie: "daily_loss_limit", text: "Limita zilnică de pierdere", sub: "Înainte s-o atingi, nu după" },
    { cheie: "news_impact", text: "Știri cu impact", sub: "Anunțuri care mișcă piața" },
  ]},
  { grup: "Regulile tale", chei: [
    { cheie: "friday_trading", text: "Tranzacții vineri", sub: "Dacă ți-ai pus vinerea ca zi liberă" },
    { cheie: "monday_restriction", text: "Restricție luni", sub: "Idem, pentru luni" },
  ]},
  { grup: "Recapitulări", chei: [
    { cheie: "daily_review", text: "Revizuirea zilei", sub: "Ce ai făcut azi, seara" },
    { cheie: "weekly_review", text: "Raportul săptămânii", sub: "Analiză AI, duminica" },
  ]},
];

interface Setari {
  name: string | null;
  email: string;
  language: string;
  currency: string;
  theme: string;
  timezone: string | null;
}

interface StareTelegram {
  connected?: boolean;
  isActive?: boolean;
  chatId?: string | null;
}

interface Stare2FA {
  enabled: boolean;
  backupCount: number;
}

// Doar limbile TRADUSE COMPLET. Schema serverului acceptă și ES/DE/FR/IT, dar
// dicționarele alea nu sunt gata — le-am arăta ca opțiuni și omul ar primi o
// aplicație jumătate în română. Se adaugă aici pe măsură ce se termină.
const LIMBI = [
  { cod: "RO", nume: "Română" },
  { cod: "EN", nume: "English" },
];

/** Aceleași fusuri ca pe site, în aceeași ordine. */
const FUSURI = [
  { cod: "Europe/Bucharest", nume: "București" },
  { cod: "Europe/London", nume: "Londra" },
  { cod: "Europe/Berlin", nume: "Berlin" },
  { cod: "Europe/Paris", nume: "Paris" },
  { cod: "America/New_York", nume: "New York" },
  { cod: "America/Chicago", nume: "Chicago" },
  { cod: "America/Los_Angeles", nume: "Los Angeles" },
  { cod: "Asia/Tokyo", nume: "Tokyo" },
  { cod: "Asia/Dubai", nume: "Dubai" },
  { cod: "Australia/Sydney", nume: "Sydney" },
];

/** Fusul telefonului, dacă îl putem afla. */
function fusulTelefonului(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

export default function Profil() {
  const router = useRouter();
  const { utilizator, deconecteaza } = useAuth();

  const setari = useCerere<Setari>(() => api.utilizator.setari() as Promise<Setari>);
  const notif = useCerere<Record<string, boolean>>(
    () => api.utilizator.notificari() as Promise<Record<string, boolean>>,
  );
  const tg = useCerere<StareTelegram>(() => api.utilizator.telegram() as Promise<StareTelegram>);
  const df = useCerere<Stare2FA>(() => api.doiFactori.stare() as Promise<Stare2FA>);

  const [nume, setNume] = React.useState("");
  const [moneda, setMoneda] = React.useState("USD");
  const [limba, setLimba] = React.useState("RO");
  const [fus, setFus] = React.useState("Europe/Bucharest");
  const [gata, setGata] = React.useState(false);
  const [salveaza, setSalveaza] = React.useState(false);
  const [salvat, setSalvat] = React.useState(false);
  const [mesaj, setMesaj] = React.useState<string | null>(null);
  const [lucreaza, setLucreaza] = React.useState(false);

  // Comutatoarele se aplică instant, local; serverul primește în fundal.
  const [comutatoare, setComutatoare] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (gata || !setari.date) return;
    setNume(setari.date.name ?? "");
    setMoneda(setari.date.currency ?? "USD");
    setLimba(setari.date.language ?? "RO");
    // Dacă serverul n-are fus salvat, pornim de la cel al telefonului — e
    // aproape sigur cel corect, și omul nu trebuie să caute nimic.
    setFus(setari.date.timezone ?? fusulTelefonului() ?? "Europe/Bucharest");
    setGata(true);
  }, [setari.date, gata]);

  React.useEffect(() => {
    if (!notif.date) return;
    const implicite = Object.fromEntries(
      NOTIFICARI.flatMap((g) => g.chei.map((c) => [c.cheie, true])),
    );
    setComutatoare({ ...implicite, ...notif.date });
  }, [notif.date]);

  const comuta = (cheie: string, valoare: boolean) => {
    Haptics.selectionAsync().catch(() => {});
    const urmatoare = { ...comutatoare, [cheie]: valoare };
    setComutatoare(urmatoare);
    api.utilizator.salveazaNotificari(urmatoare).catch(() => {
      // Serverul n-a primit: readucem comutatorul, ca ecranul să nu mintă.
      setComutatoare(comutatoare);
      setMesaj("Nu am putut salva preferința. Verifică semnalul.");
    });
  };

  const salveazaProfilul = async () => {
    setSalveaza(true);
    setMesaj(null);
    try {
      await api.utilizator.salveazaSetari({
        name: nume.trim(),
        currency: moneda,
        language: limba,
        timezone: fus,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSalvat(true);
      setari.reia();
    } catch (e) {
      setMesaj(e instanceof ApiError ? e.message : "Nu am putut salva.");
    } finally {
      setSalveaza(false);
    }
  };

  /* ── Datele mele ──────────────────────────────────────────────────────── */

  const exporta = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLucreaza(true);
    setMesaj(null);
    try {
      const date = await api.utilizator.exportaDate();
      // Exportul e JSON, nu un raport — dar drumul spre telefon e același:
      // un fișier și foaia de partajare a sistemului.
      const r = await faPdf(
        {
          titlu: "Export de date",
          subtitlu: umple("Toate datele contului {email}", { email: utilizator?.email ?? "" }),
          sectiuni: [
            {
              titlu: "Conținut",
              nota: "Fișierul de mai jos conține datele brute, în format JSON.",
            },
            {
              titlu: "Date",
              nota: JSON.stringify(date).slice(0, 40000),
            },
          ],
          subsol: "Export generat de TradeGx la cererea ta, conform dreptului la portabilitatea datelor.",
        },
        "TradeGx-date.pdf",
      );
      if (r.fel === "eroare") setMesaj(r.mesaj);
    } catch (e) {
      setMesaj(e instanceof ApiError ? e.message : "Nu am putut exporta datele.");
    } finally {
      setLucreaza(false);
    }
  };

  const [cuvant, setCuvant] = React.useState("");
  const [arataStergerea, setArataStergerea] = React.useState(false);

  const stergeContul = async () => {
    setLucreaza(true);
    try {
      await api.utilizator.stergeContul();
      await deconecteaza();
      router.replace("/login");
    } catch (e) {
      setMesaj(e instanceof ApiError ? e.message : "Nu am putut șterge contul.");
      setLucreaza(false);
    }
  };

  const conectat = Boolean(tg.date?.connected ?? tg.date?.isActive);
  const [chatId, setChatId] = React.useState("");
  const [conecteaza, setConecteaza] = React.useState(false);

  // Conectarea nu are nevoie de site: botul dă un Chat ID, iar ruta îl salvează.
  // Trimiterea omului în browser pentru un câmp de text era doar o piesă care
  // lipsea din aplicație, nu o restricție reală.
  const conecteazaTelegram = async () => {
    const id = chatId.trim();
    if (!/^-?d{5,}$/.test(id)) {
      setMesaj("Chat ID-ul e un număr, de obicei din nouă cifre.");
      return;
    }
    setConecteaza(true);
    setMesaj(null);
    try {
      await api.utilizator.conecteazaTelegram({ chatId: id });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setChatId("");
      tg.reia();
    } catch (e) {
      setMesaj(e instanceof ApiError ? e.message : "Nu am putut conecta Telegram.");
    } finally {
      setConecteaza(false);
    }
  };

  return (
    <Ecran
      titlu="Toate setările"
      subtitlu={setari.date?.email ?? utilizator?.email ?? null}
      incarca={setari.incarca && !setari.date}
      scheletRanduri={4}
      reimprospateaza={setari.reimprospateaza}
      onReia={() => { setari.reia(); notif.reia(); tg.reia(); df.reia(); }}
      eroare={mesaj ?? setari.eroare}
    >
      {/* ── Profil ── */}
      <Reveal>
        <Card>
          <Camp
            eticheta="Nume"
            valoare={nume}
            onChange={(v) => { setSalvat(false); setNume(v); }}
            autoCapitalize="words"
            placeholder="Cum să-ți spunem"
          />

          <Text style={st.eticheta}>Moneda contului</Text>
          <View style={st.pastile}>
            {MONEDE.map((m) => {
              const activ = m === moneda;
              return (
                <Pressable
                  key={m}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setSalvat(false);
                    setMoneda(m);
                  }}
                  style={[st.pastila, activ && st.pastilaActiva]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activ }}
                >
                  <Text style={[st.textPastila, activ && { color: T.accent.base }]}>{m}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={st.subEticheta}>LIMBA</Text>
          <View style={st.pastile}>
            {LIMBI.map((l) => {
              const activ = l.cod === limba;
              return (
                <Pressable
                  key={l.cod}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setSalvat(false);
                    setLimba(l.cod);
                  }}
                  style={[st.pastila, activ && st.pastilaActiva]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activ }}
                >
                  <Text style={[st.textPastila, activ && { color: T.accent.base }]}>{l.nume}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={st.subEticheta}>FUS ORAR</Text>
          <Text style={st.ajutorSetare}>
            După el se face ziua de tranzacționare: ce intră în „azi", când se
            resetează checklistul și limita zilnică de pierdere.
          </Text>

          {(() => {
            // Dacă telefonul stă pe un fus care nu e în listă, îl oferim
            // separat — altfel cineva din Madrid sau Varșovia n-ar avea ce
            // alege, deși știm exact unde e.
            const alTelefonului = fusulTelefonului();
            const inLista = FUSURI.some((x) => x.cod === alTelefonului);
            const toate = alTelefonului && !inLista
              ? [{ cod: alTelefonului, nume: alTelefonului.split("/").pop()?.replace(/_/g, " ") ?? alTelefonului }, ...FUSURI]
              : FUSURI;

            return (
              <View style={st.pastile}>
                {toate.map((z) => {
                  const activ = z.cod === fus;
                  const eAlTelefonului = z.cod === alTelefonului;
                  return (
                    <Pressable
                      key={z.cod}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setSalvat(false);
                        setFus(z.cod);
                      }}
                      style={[st.pastila, activ && st.pastilaActiva]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: activ }}
                      accessibilityLabel={`${z.nume}${eAlTelefonului ? ", fusul telefonului" : ""}`}
                    >
                      <Text style={[st.textPastila, activ && { color: T.accent.base }]}>
                        {z.nume}
                        {eAlTelefonului ? " ·" : ""}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            );
          })()}

          {fusulTelefonului() ? (
            <Text style={st.ajutorSetare}>
              Punctul arată fusul pe care e telefonul tău acum.
            </Text>
          ) : null}

          <Text style={st.nota}>
            Emailul nu se poate schimba: cu el intri în cont și pe el sunt emise
            facturile. Dacă ai nevoie de altul, scrie-ne și îl mutăm noi.
          </Text>

          <Buton
            eticheta={salvat ? "Salvat" : "Salvează profilul"}
            onPress={salveazaProfilul}
            incarca={salveaza}
            plin
            style={{ marginTop: T.spacing.lg }}
            iconita={
              <Ionicons name={salvat ? "checkmark-circle" : "save-outline"} size={16} color="#ffffff" />
            }
          />
        </Card>
      </Reveal>

      {/* ── Notificări ── */}
      <Sectiune titlu="Notificări" nota="Se salvează singure, la fiecare comutare." />
      {NOTIFICARI.map((g, i) => (
        <Reveal key={g.grup} intarziere={i * 40} style={{ marginBottom: T.spacing.sm }}>
          <Card faraPadding>
            <Text style={st.grup}>{g.grup.toUpperCase()}</Text>
            {g.chei.map((c, k) => (
              <View key={c.cheie} style={[st.randComutator, k > 0 && st.cuLinie]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={st.textComutator}>{c.text}</Text>
                  <Text style={st.subComutator}>{c.sub}</Text>
                </View>
                <Switch
                  value={comutatoare[c.cheie] ?? true}
                  onValueChange={(v) => comuta(c.cheie, v)}
                  trackColor={{ false: T.surface.s4, true: T.accent.soft }}
                  thumbColor={comutatoare[c.cheie] ?? true ? T.accent.base : T.ink.i4}
                />
              </View>
            ))}
          </Card>
        </Reveal>
      ))}

      {/* ── Telegram ── */}
      <Sectiune titlu="Telegram" nota="Alertele ajung și acolo, nu doar ca notificare." />
      <Reveal>
        <Card>
          <View style={st.randStare}>
            <View style={[st.iconStare, conectat && { backgroundColor: "rgba(52,211,153,0.12)" }]}>
              <Ionicons
                name={conectat ? "paper-plane" : "paper-plane-outline"}
                size={17}
                color={conectat ? T.pnl.gain : T.ink.i3}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={st.textStare}>
                {conectat ? "Conectat" : "Neconectat"}
              </Text>
              <Text style={st.subStare}>
                {conectat
                  ? "Primești alertele și pe Telegram."
                  : "Trei pași, mai jos. Durează un minut."}
              </Text>
            </View>
            {conectat ? <Insigna text="activ" culoare={T.pnl.gain} fundal="rgba(52,211,153,0.12)" /> : null}
          </View>

          {conectat ? null : (
            <View style={st.pasiTelegram}>
              {[
                "Deschide Telegram și caută @userinfobot — îți trimite Chat ID-ul tău.",
                "Caută botul TradeGx și apasă Start.",
                "Scrie Chat ID-ul aici și conectează.",
              ].map((p, i) => (
                <View key={p} style={st.randPas}>
                  <View style={st.numarPas}>
                    <Text style={st.textNumarPas}>{i + 1}</Text>
                  </View>
                  <Text style={st.textPas}>{p}</Text>
                </View>
              ))}

              <Camp
                eticheta="Chat ID"
                valoare={chatId}
                onChange={setChatId}
                placeholder="123456789"
                tastatura="number-pad"
                numeric
                style={{ marginTop: T.spacing.md }}
              />

              <Buton
                eticheta="Conectează Telegram"
                onPress={conecteazaTelegram}
                incarca={conecteaza}
                dezactivat={chatId.trim() === "" || conecteaza}
                plin
                style={{ marginTop: T.spacing.md }}
                iconita={<Ionicons name="paper-plane-outline" size={16} color="#ffffff" />}
              />
            </View>
          )}

          {conectat ? (
            <Buton
              eticheta="Deconectează Telegram"
              varianta="secundar"
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                try {
                  await api.utilizator.deconecteazaTelegram();
                  tg.reia();
                } catch {
                  setMesaj("Nu am putut deconecta.");
                }
              }}
              plin
              style={{ marginTop: T.spacing.lg }}
            />
          ) : null}
        </Card>
      </Reveal>

      {/* ── Securitate ── */}
      <Sectiune titlu="Securitate" />
      <Reveal>
        <Card culoareMuchie={df.date?.enabled ? "rgba(52,211,153,0.30)" : undefined}>
          <View style={st.randStare}>
            <View style={[st.iconStare, df.date?.enabled && { backgroundColor: "rgba(52,211,153,0.12)" }]}>
              <Ionicons
                name={df.date?.enabled ? "shield-checkmark" : "shield-outline"}
                size={17}
                color={df.date?.enabled ? T.pnl.gain : T.ink.i3}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={st.textStare}>Autentificare în doi pași</Text>
              <Text style={st.subStare}>
                {df.date?.enabled
                  ? umple("Pornită. {p1} coduri de rezervă rămase.", { p1: df.date.backupCount })
                  : "Oprită. Cu ea, parola singură nu mai e de ajuns."}
              </Text>
            </View>
          </View>

          <DoiFactori
            pornita={Boolean(df.date?.enabled)}
            onSchimbat={() => df.reia()}
            onEroare={setMesaj}
          />
        </Card>
      </Reveal>

      <Reveal style={{ marginTop: T.spacing.sm }}>
        <Card nivel={1}>
          <Text style={st.nota}>
            Parola se schimbă prin linkul de resetare trimis pe email — la fel ca pe
            site. Așa nu există niciun loc în aplicație unde parola veche să fie tastată.
          </Text>
          <Buton
            eticheta="Trimite-mi link de resetare"
            varianta="secundar"
            onPress={async () => {
              const email = setari.date?.email ?? utilizator?.email;
              if (!email) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              try {
                await api.cont.parolaUitata(email);
                setMesaj("Ți-am trimis linkul pe email.");
              } catch {
                setMesaj("Nu am putut trimite linkul.");
              }
            }}
            plin
            style={{ marginTop: T.spacing.md }}
            iconita={<Ionicons name="mail-outline" size={15} color={T.ink.i1} />}
          />
        </Card>
      </Reveal>

      {/* ── Datele mele ── */}
      <Sectiune titlu="Datele mele" />
      <Reveal>
        <Card>
          <Text style={st.nota}>
            Ai dreptul să-ți iei datele oricând. Exportul conține tranzacțiile, notele,
            conturile și progresul, ca fișier.
          </Text>
          <Buton
            eticheta="Exportă-mi datele"
            varianta="secundar"
            onPress={exporta}
            incarca={lucreaza}
            plin
            style={{ marginTop: T.spacing.md }}
            iconita={<Ionicons name="download-outline" size={15} color={T.ink.i1} />}
          />
        </Card>
      </Reveal>

      <Sectiune titlu="Zonă periculoasă" />
      <Reveal style={{ marginBottom: T.spacing.xl }}>
        <Card nivel={1} culoareMuchie="rgba(251,113,133,0.30)">
          <Insigna text="ireversibil" culoare={T.pnl.loss} fundal="rgba(251,113,133,0.12)" />
          <Text style={[st.nota, { marginTop: T.spacing.sm }]}>
            Ștergerea contului elimină toate tranzacțiile, notele, conturile de trading
            și progresul din Academie. Abonamentul se anulează. Nu se poate anula.
          </Text>

          {!arataStergerea ? (
            <Buton
              eticheta="Vreau să-mi șterg contul"
              varianta="distructiv"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                setArataStergerea(true);
              }}
              plin
              style={{ marginTop: T.spacing.md }}
            />
          ) : (
            <>
              <Camp
                eticheta="Scrie ȘTERG ca să confirmi"
                valoare={cuvant}
                onChange={setCuvant}
                placeholder="ȘTERG"
                autoCapitalize="characters"
                style={{ marginTop: T.spacing.md }}
              />
              <Buton
                eticheta="Șterge contul definitiv"
                varianta="distructiv"
                onPress={() => {
                  if (cuvant.trim().toUpperCase() !== "ȘTERG") {
                    setMesaj("Nu s-a șters nimic — cuvântul nu s-a potrivit.");
                    return;
                  }
                  Alert.alert(
                    tr("Ultima confirmare"),
                    tr("Contul și tot ce conține dispar acum. Sigur?"),
                    [
                      { text: tr("Renunț"), style: "cancel" },
                      { text: tr("Șterge"), style: "destructive", onPress: () => void stergeContul() },
                    ],
                  );
                }}
                incarca={lucreaza}
                dezactivat={cuvant.trim().toUpperCase() !== "ȘTERG"}
                plin
              />
            </>
          )}
        </Card>
      </Reveal>
    </Ecran>
  );
}

/* ── Pornirea / oprirea celui de-al doilea pas ────────────────────────────── */

function DoiFactori({
  pornita, onSchimbat, onEroare,
}: {
  pornita: boolean;
  onSchimbat: () => void;
  onEroare: (m: string) => void;
}) {
  const [secret, setSecret] = React.useState<string | null>(null);
  const [cod, setCod] = React.useState("");
  const [lucreaza, setLucreaza] = React.useState(false);

  const pregateste = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLucreaza(true);
    try {
      const r = (await api.doiFactori.pregateste()) as { secret: string };
      setSecret(r.secret);
    } catch (e) {
      onEroare(e instanceof ApiError ? e.message : "Nu am putut porni configurarea.");
    } finally {
      setLucreaza(false);
    }
  };

  const confirma = async () => {
    setLucreaza(true);
    try {
      await api.doiFactori.porneste(cod.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSecret(null);
      setCod("");
      onSchimbat();
    } catch {
      onEroare("Codul nu e bun. Verifică ora telefonului și încearcă din nou.");
    } finally {
      setLucreaza(false);
    }
  };

  const opreste = async () => {
    setLucreaza(true);
    try {
      await api.doiFactori.opreste(cod.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setCod("");
      onSchimbat();
    } catch {
      onEroare("Codul nu e bun.");
    } finally {
      setLucreaza(false);
    }
  };

  if (pornita) {
    return (
      <>
        <Camp
          eticheta="Cod din aplicația de autentificare"
          valoare={cod}
          onChange={setCod}
          placeholder="123456"
          tastatura="number-pad"
          numeric
          style={{ marginTop: T.spacing.lg }}
        />
        <Buton
          eticheta="Oprește doi pași"
          varianta="distructiv"
          onPress={opreste}
          incarca={lucreaza}
          dezactivat={cod.trim().length < 6}
          plin
        />
      </>
    );
  }

  if (!secret) {
    return (
      <Buton
        eticheta="Pornește doi pași"
        varianta="secundar"
        onPress={pregateste}
        incarca={lucreaza}
        plin
        style={{ marginTop: T.spacing.lg }}
        iconita={<Ionicons name="lock-closed-outline" size={15} color={T.ink.i1} />}
      />
    );
  }

  return (
    <View style={{ marginTop: T.spacing.lg }}>
      <Text style={st.nota}>
        Deschide aplicația ta de autentificare (Google Authenticator, Aegis, 1Password)
        și adaugă un cont nou cu cheia de mai jos. Apoi scrie codul de șase cifre.
      </Text>

      <Pressable
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          Clipboard.setStringAsync(secret).catch(() => {});
        }}
        style={st.cheie}
        accessibilityRole="button"
        accessibilityLabel={tr("Copiază cheia")}
      >
        <Text style={st.textCheie} selectable>{secret}</Text>
        <Ionicons name="copy-outline" size={15} color={T.ink.i3} />
      </Pressable>

      <Camp
        eticheta="Codul de șase cifre"
        valoare={cod}
        onChange={setCod}
        placeholder="123456"
        tastatura="number-pad"
        numeric
        style={{ marginTop: T.spacing.md }}
      />
      <Buton
        eticheta="Confirmă și pornește"
        onPress={confirma}
        incarca={lucreaza}
        dezactivat={cod.trim().length < 6}
        plin
      />
    </View>
  );
}

const st = StyleSheet.create({
  subEticheta: {
    color: T.ink.i4,
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.wider,
    marginTop: T.spacing.lg,
    marginBottom: T.spacing.sm,
  },
  ajutorSetare: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    marginBottom: T.spacing.sm,
  },
  pasiTelegram: {
    marginTop: T.spacing.lg,
    paddingTop: T.spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.line.l1,
    gap: T.spacing.sm,
  },
  randPas: { flexDirection: "row", alignItems: "flex-start", gap: T.spacing.sm },
  numarPas: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.accent.soft,
    marginTop: 1,
  },
  textNumarPas: {
    color: T.accent.base,
    fontSize: 10,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  textPas: {
    flex: 1,
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  eticheta: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: T.tracking.wider,
    marginBottom: T.spacing.sm,
  },
  pastile: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pastila: {
    minHeight: 34,
    paddingHorizontal: T.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: T.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    backgroundColor: T.surface.s3,
  },
  pastilaActiva: { backgroundColor: T.accent.soft, borderColor: T.accent.line },
  textPastila: {
    color: T.ink.i3,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_700Bold",
  },
  nota: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: T.spacing.md,
  },
  grup: {
    color: T.ink.i4,
    fontSize: 9,
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.wider,
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.lg,
    paddingBottom: T.spacing.sm,
  },
  randComutator: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.md,
    minHeight: ATINGERE_MIN,
    paddingHorizontal: T.spacing.lg,
    paddingVertical: T.spacing.sm,
  },
  cuLinie: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: T.line.l1 },
  textComutator: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_600SemiBold",
  },
  subComutator: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    lineHeight: 16,
  },
  randStare: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  iconStare: {
    width: 38,
    height: 38,
    borderRadius: T.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface.s4,
  },
  textStare: {
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_700Bold",
  },
  subStare: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    marginTop: 2,
  },
  cheie: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.md,
    padding: T.spacing.md,
    borderRadius: T.radius.md,
    backgroundColor: T.surface.s4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l1,
    marginTop: T.spacing.md,
  },
  textCheie: {
    flex: 1,
    color: T.ink.i1,
    fontSize: T.fontSize.xs,
    fontFamily: "SpaceGrotesk_500Medium",
    letterSpacing: 1,
  },
});
