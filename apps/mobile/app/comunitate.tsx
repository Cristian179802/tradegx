import * as React from "react";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api, ApiError } from "../src/lib/api";
import { useCerere } from "../src/lib/useCerere";
import { candva } from "../src/lib/format";
import { Card } from "../src/ui/Card";
import { Camp } from "../src/ui/Camp";
import { Buton } from "../src/ui/Buton";
import { Reveal } from "../src/ui/Reveal";
import { Schelet } from "../src/ui/Schelet";
import { AntetEcran, SPATIU_BARA } from "../src/ui/Ecran";
import { Insigna, Segmente } from "../src/ui/parti";
import { T, ATINGERE_MIN } from "../src/theme";

// ── Comunitate ───────────────────────────────────────────────────────────────
//
// Două file: postările tuturor și echipele. Nimic altceva — o comunitate cu
// șase secțiuni pe telefon e o comunitate pe care nimeni n-o citește.
//
// ECRANUL SE EXPLICĂ PE SINE. Prima versiune arăta o listă goală și o
// propoziție („fii primul care scrie ceva”), ceea ce presupunea că omul știe
// deja unde a ajuns. Nu știa: ce e locul ăsta, cu cine vorbesc, ce sunt
// echipele, de ce aș scrie. O comunitate goală care nu se prezintă arată ca o
// funcție stricată.
//
// De aceea cardul de deschidere spune ce e, iar sugestiile de postare sunt
// CONCRETE — se apasă și deschid compunerea cu titlul pus. Un câmp gol și
// „scrie ceva” e cea mai sigură cale spre zero postări.
//
// REACȚIILE SE APLICĂ INSTANT, local, și abia apoi pleacă spre server. La o
// atingere pe un emoji, o rotiță de o secundă ar face gestul să pară stricat.
// Dacă cererea eșuează, reacția se retrage — lista nu are voie să mintă.
//
// POSTAREA E UN DIALOG, nu un ecran separat: scrii, trimiți, ești înapoi în
// listă. Un ecran întreg pentru două câmpuri ar fi însemnat o navigare dus-
// întors pentru fiecare gând.
//
// Ce NU e aici: comentariile. Un fir de discuție are nevoie de ecranul lui și
// de o rută de citire pe care n-o avem încă; un buton care duce nicăieri e mai
// rău decât lipsa lui. Numărul de comentarii se vede, ca să știi că există.

const EMOJI = ["🔥", "🚀", "💡", "💯", "👀", "❤️"];

/** Începuturi de postare. Se apasă și deschid compunerea cu titlul completat. */
const SUGESTII = [
  { titlu: "Greșeala care m-a costat cel mai mult luna asta", iconita: "warning-outline" as const },
  { titlu: "Setup-ul care îmi merge cel mai bine acum", iconita: "trending-up-outline" as const },
  { titlu: "O întrebare despre managementul riscului", iconita: "help-circle-outline" as const },
  { titlu: "Ce am învățat din ultimele 20 de tranzacții", iconita: "school-outline" as const },
];

const FILE = [
  { v: "postari" as const, e: "Postări" },
  { v: "echipe" as const, e: "Echipe" },
];

interface Reactie {
  emoji: string;
  count: number;
  reacted: boolean;
}

interface Postare {
  id: string;
  title: string | null;
  content: string;
  symbol: string | null;
  tags: string[];
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
  _count: { comments: number };
  reactions: Reactie[];
}

interface Echipa {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  postCount: number;
  isMember: boolean;
  isOwner: boolean;
  role?: string;
}

export default function Comunitate() {
  const [fila, setFila] = React.useState<"postari" | "echipe">("postari");

  return (
    <View style={st.radacina}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {fila === "postari" ? <Postari fila={fila} setFila={setFila} /> : <Echipe fila={fila} setFila={setFila} />}
      </SafeAreaView>
    </View>
  );
}

function Antet({
  fila, setFila, subtitlu, actiune,
}: {
  fila: "postari" | "echipe";
  setFila: (f: "postari" | "echipe") => void;
  subtitlu: string | null;
  actiune?: React.ReactNode;
}) {
  return (
    <>
      <AntetEcran titlu="Comunitate" subtitlu={subtitlu} actiune={actiune} />
      <View style={st.file}>
        <Segmente valori={FILE} valoare={fila} onSchimba={setFila} eticheta="Secțiune" />
      </View>
    </>
  );
}

/* ── Postări ──────────────────────────────────────────────────────────────── */

function Postari({
  fila, setFila,
}: {
  fila: "postari" | "echipe";
  setFila: (f: "postari" | "echipe") => void;
}) {
  const router = useRouter();
  const c = useCerere<{ posts: Postare[] }>(
    () => api.community.posts(1) as Promise<{ posts: Postare[] }>,
  );

  const [local, setLocal] = React.useState<Record<string, Reactie[]>>({});
  const [compune, setCompune] = React.useState(false);
  const [titluSugerat, setTitluSugerat] = React.useState("");

  const postari = c.date?.posts ?? [];

  const reactiiPentru = (p: Postare): Reactie[] => local[p.id] ?? p.reactions;

  const reactioneaza = (p: Postare, emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const actuale = reactiiPentru(p);
    const gasita = actuale.find((r) => r.emoji === emoji);

    // Aplicare optimistă. Emoji-ul dispare din listă când ajunge la zero.
    const urmatoare = gasita
      ? actuale
          .map((r) => (r.emoji === emoji
            ? { ...r, count: r.count + (r.reacted ? -1 : 1), reacted: !r.reacted }
            : r))
          .filter((r) => r.count > 0)
      : [...actuale, { emoji, count: 1, reacted: true }];

    setLocal((s) => ({ ...s, [p.id]: urmatoare }));

    api.community.react(p.id, { emoji }).catch(() => {
      // Retragem, ca lista să nu arate o reacție care n-a ajuns nicăieri.
      setLocal((s) => ({ ...s, [p.id]: actuale }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    });
  };

  return (
    <>
      <Antet
        fila={fila}
        setFila={setFila}
        subtitlu={postari.length > 0 ? `${postari.length} postări recente` : "Ce discută ceilalți"}
        actiune={
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setTitluSugerat("");
              setCompune(true);
            }}
            style={st.actiune}
            accessibilityRole="button"
            accessibilityLabel="Scrie o postare"
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={17} color={T.accent.base} />
          </Pressable>
        }
      />

      {c.incarca && postari.length === 0 ? (
        <View style={st.continut}>
          {[0, 1, 2].map((i) => (
            <Schelet key={i} inaltime={140} raza={T.radius.xl} style={{ marginBottom: T.spacing.sm }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={postari}
          keyExtractor={(p) => p.id}
          contentContainerStyle={st.continut}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={c.reimprospateaza}
              onRefresh={c.reia}
              tintColor={T.accent.base}
              colors={[T.accent.base]}
              progressBackgroundColor={T.surface.s2}
            />
          }
          ListEmptyComponent={
            <Prezentare onScrie={(titlu) => { setTitluSugerat(titlu); setCompune(true); }} />
          }
          renderItem={({ item, index }) => (
            <Reveal intarziere={index < 6 ? index * 50 : 0} style={{ marginBottom: T.spacing.sm }}>
              <CardPostare
                p={item}
                reactii={reactiiPentru(item)}
                onReactie={(e) => reactioneaza(item, e)}
                onDeschide={() => router.push(`/postare/${item.id}`)}
              />
            </Reveal>
          )}
        />
      )}

      {c.eroare ? <Text style={st.eroare}>{c.eroare}</Text> : null}

      <DialogPostare
        vizibil={compune}
        titluInitial={titluSugerat}
        onInchide={() => { setCompune(false); setTitluSugerat(""); }}
        onTrimis={() => { setCompune(false); setTitluSugerat(""); c.reia(); }}
      />
    </>
  );
}

function CardPostare({
  p, reactii, onReactie, onDeschide,
}: {
  p: Postare;
  reactii: Reactie[];
  onReactie: (emoji: string) => void;
  onDeschide: () => void;
}) {
  const [desfasurat, setDesfasurat] = React.useState(false);
  const initiala = (p.user.name ?? "?").trim().charAt(0).toUpperCase();

  return (
    <Card>
      <View style={st.antetPostare}>
        <View style={st.avatar}>
          <Text style={st.initiala}>{initiala}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={st.autor} numberOfLines={1}>{p.user.name ?? "Anonim"}</Text>
          <Text style={st.cand}>{candva(p.createdAt)}</Text>
        </View>
        {p.symbol ? <Insigna text={p.symbol} culoare={T.accent.base} fundal={T.accent.soft} /> : null}
      </View>

      {p.title ? <Text style={st.titlu}>{p.title}</Text> : null}

      <Pressable onPress={() => setDesfasurat((x) => !x)}>
        <Text style={st.continutPostare} numberOfLines={desfasurat ? undefined : 5}>
          {p.content}
        </Text>
      </Pressable>

      {p.tags.length > 0 ? (
        <View style={st.etichete}>
          {p.tags.slice(0, 5).map((t) => (
            <Text key={t} style={st.eticheta}>#{t}</Text>
          ))}
        </View>
      ) : null}

      <View style={st.josPostare}>
        <View style={st.emojiuri}>
          {EMOJI.map((e) => {
            const r = reactii.find((x) => x.emoji === e);
            const activ = r?.reacted ?? false;
            return (
              <Pressable
                key={e}
                onPress={() => onReactie(e)}
                style={[st.emoji, activ && st.emojiActiv]}
                accessibilityRole="button"
                accessibilityLabel={`Reacționează cu ${e}`}
                accessibilityState={{ selected: activ }}
              >
                <Text style={st.textEmoji}>{e}</Text>
                {r && r.count > 0 ? (
                  <Text style={[st.numarEmoji, activ && { color: T.accent.base }]}>{r.count}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={onDeschide}
          style={st.comentarii}
          accessibilityRole="button"
          accessibilityLabel={
            p._count.comments > 0
              ? `Vezi cele ${p._count.comments} comentarii`
              : "Comentează"
          }
          hitSlop={8}
        >
          <Ionicons name="chatbubble-outline" size={12} color={T.ink.i4} />
          <Text style={st.numarComentarii}>
            {p._count.comments > 0 ? p._count.comments : "comentează"}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}

/**
 * Ce e locul ăsta.
 *
 * Apare când nu există nicio postare — adică exact când cineva are cea mai
 * mare nevoie să afle unde a ajuns. O stare goală care spune doar „fii primul”
 * presupune că omul știe deja ce e comunitatea, cu cine vorbește și ce câștigă
 * dacă scrie.
 */
function Prezentare({ onScrie }: { onScrie: (titlu: string) => void }) {
  return (
    <View>
      <Card culoareMuchie={T.accent.line}>
        <View style={st.antetPrezentare}>
          <View style={st.iconPrezentare}>
            <Ionicons name="people" size={20} color={T.accent.base} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={st.titluPrezentare}>Traderii de pe TradeGx</Text>
            <Text style={st.subPrezentare}>Un loc unde se vorbește despre execuție, nu despre profituri</Text>
          </View>
        </View>

        <Text style={st.textPrezentare}>
          Toți cei care folosesc TradeGx scriu aici: un setup care a mers, o greșeală
          care a costat, o întrebare la care nu găsesc răspuns. Nimeni nu vinde
          semnale și nimeni nu-ți cere bani.
        </Text>

        <View style={st.puncte}>
          {[
            { i: "chatbubbles-outline" as const, t: "Scrii o postare, ceilalți comentează și reacționează" },
            { i: "pricetag-outline" as const, t: "Poți lega postarea de un simbol, ca s-o găsească cine tranzacționează același lucru" },
            { i: "people-circle-outline" as const, t: "Echipele sunt grupuri închise — intri cu un cod primit de la cineva" },
          ].map((x) => (
            <View key={x.t} style={st.punct}>
              <Ionicons name={x.i} size={15} color={T.accent.base} />
              <Text style={st.textPunct}>{x.t}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Text style={st.titluSugestii}>DE UNDE POȚI ÎNCEPE</Text>

      {SUGESTII.map((x, i) => (
        <Reveal key={x.titlu} intarziere={i * 45} style={{ marginBottom: T.spacing.sm }}>
          <Card
            nivel={1}
            onPress={() => onScrie(x.titlu)}
            accesibilEticheta={`Scrie o postare: ${x.titlu}`}
          >
            <View style={st.randSugestie}>
              <View style={st.iconSugestie}>
                <Ionicons name={x.iconita} size={16} color={T.ink.i3} />
              </View>
              <Text style={st.textSugestie} numberOfLines={2}>{x.titlu}</Text>
              <Ionicons name="create-outline" size={15} color={T.accent.base} />
            </View>
          </Card>
        </Reveal>
      ))}

      <Text style={st.notaPrezentare}>
        Nu e nicio postare încă — a ta ar fi prima. Comunitatea e nouă, la fel ca
        aplicația.
      </Text>
    </View>
  );
}

function DialogPostare({
  vizibil, titluInitial, onInchide, onTrimis,
}: {
  vizibil: boolean;
  titluInitial?: string;
  onInchide: () => void;
  onTrimis: () => void;
}) {
  const [titlu, setTitlu] = React.useState("");

  // Titlul venit dintr-o sugestie se pune la deschidere, o singură dată — nu la
  // fiecare randare, altfel ar șterge ce tocmai a schimbat omul în el.
  React.useEffect(() => {
    if (vizibil) setTitlu(titluInitial ?? "");
  }, [vizibil, titluInitial]);
  const [continut, setContinut] = React.useState("");
  const [simbol, setSimbol] = React.useState("");
  const [trimite, setTrimite] = React.useState(false);
  const [eroare, setEroare] = React.useState<string | null>(null);

  const trimiteAcum = async () => {
    setTrimite(true);
    setEroare(null);
    try {
      await api.community.createPost({
        title: titlu.trim(),
        content: continut.trim(),
        symbol: simbol.trim().toUpperCase() || null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setTitlu(""); setContinut(""); setSimbol("");
      onTrimis();
    } catch (e) {
      setEroare(
        e instanceof ApiError && e.status === 400
          ? "Titlul are nevoie de minim 3 caractere, iar textul de minim 10."
          : e instanceof ApiError ? e.message : "Nu am putut trimite postarea.",
      );
    } finally {
      setTrimite(false);
    }
  };

  const valid = titlu.trim().length >= 3 && continut.trim().length >= 10;

  return (
    <Modal visible={vizibil} animationType="slide" transparent onRequestClose={onInchide}>
      <View style={st.voal}>
        <SafeAreaView style={st.foaie} edges={["bottom"]}>
          <View style={st.manerFoaie}>
            <View style={st.maner} />
          </View>

          <View style={st.antetFoaie}>
            <Text style={st.titluFoaie}>Scrie o postare</Text>
            <Pressable onPress={onInchide} hitSlop={10} accessibilityRole="button" accessibilityLabel="Închide">
              <Ionicons name="close" size={20} color={T.ink.i3} />
            </Pressable>
          </View>

          <View style={st.corpFoaie}>
            <Camp
              eticheta="Titlu"
              valoare={titlu}
              onChange={setTitlu}
              placeholder="Despre ce e vorba?"
              autoCapitalize="sentences"
            />
            <Camp
              eticheta="Text"
              valoare={continut}
              onChange={setContinut}
              placeholder="Ideea, greșeala sau întrebarea ta."
              multilinie
              randuri={5}
              autoCapitalize="sentences"
            />
            <Camp
              eticheta="Simbol (opțional)"
              valoare={simbol}
              onChange={(v) => setSimbol(v.toUpperCase())}
              placeholder="EURUSD"
              autoCapitalize="characters"
            />

            {eroare ? <Text style={st.eroareFoaie}>{eroare}</Text> : null}

            <Buton
              eticheta="Publică"
              onPress={trimiteAcum}
              incarca={trimite}
              dezactivat={!valid}
              plin
              iconita={<Ionicons name="send" size={15} color="#ffffff" />}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

/* ── Echipe ───────────────────────────────────────────────────────────────── */

function Echipe({
  fila, setFila,
}: {
  fila: "postari" | "echipe";
  setFila: (f: "postari" | "echipe") => void;
}) {
  const c = useCerere<{ myTeams: Echipa[]; publicTeams: Echipa[] }>(
    () => api.community.teams() as Promise<{ myTeams: Echipa[]; publicTeams: Echipa[] }>,
  );

  const [cod, setCod] = React.useState("");
  const [intra, setIntra] = React.useState(false);
  const [numeEchipa, setNumeEchipa] = React.useState("");
  const [creeaza, setCreeaza] = React.useState(false);
  const [eroare, setEroare] = React.useState<string | null>(null);

  const creeazaEchipa = async () => {
    const n = numeEchipa.trim();
    if (n.length < 3) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setCreeaza(true);
    setEroare(null);
    try {
      const e = (await api.community.creeazaEchipa({ name: n, isPublic: true })) as {
        inviteCode?: string;
      };
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setNumeEchipa("");
      c.reia();
      if (e.inviteCode) {
        setEroare(`Echipa e gata. Codul de invitație: ${e.inviteCode}`);
      }
    } catch (e) {
      setEroare(e instanceof ApiError ? e.message : "Nu am putut crea echipa.");
    } finally {
      setCreeaza(false);
    }
  };

  const alaturaCuCod = async () => {
    const t = cod.trim();
    if (!t) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIntra(true);
    setEroare(null);
    try {
      await api.community.joinByCode({ code: t });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setCod("");
      c.reia();
    } catch (e) {
      setEroare(e instanceof ApiError ? e.message : "Codul nu a fost acceptat.");
    } finally {
      setIntra(false);
    }
  };

  const aleMele = c.date?.myTeams ?? [];
  const publice = c.date?.publicTeams ?? [];

  return (
    <>
      <Antet
        fila={fila}
        setFila={setFila}
        subtitlu={aleMele.length > 0 ? `Ești în ${aleMele.length} ${aleMele.length === 1 ? "echipă" : "echipe"}` : "Grupuri de trading"}
      />

      <FlatList
        data={[]}
        keyExtractor={() => "x"}
        renderItem={() => null}
        contentContainerStyle={st.continut}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={c.reimprospateaza}
            onRefresh={c.reia}
            tintColor={T.accent.base}
            colors={[T.accent.base]}
            progressBackgroundColor={T.surface.s2}
          />
        }
        ListHeaderComponent={
          <View>
            <Card>
              <Camp
                eticheta="Intră cu un cod de invitație"
                valoare={cod}
                onChange={(v) => setCod(v.toUpperCase())}
                placeholder="ABC123"
                autoCapitalize="characters"
              />
              {eroare ? <Text style={st.eroareFoaie}>{eroare}</Text> : null}
              <Buton
                eticheta="Alătură-te"
                onPress={alaturaCuCod}
                incarca={intra}
                dezactivat={!cod.trim()}
                varianta="secundar"
                plin
              />

              <View style={st.separatorEchipe}>
                <View style={st.linieEchipe} />
                <Text style={st.sauEchipe}>sau</Text>
                <View style={st.linieEchipe} />
              </View>

              <Camp
                eticheta="Fă o echipă nouă"
                valoare={numeEchipa}
                onChange={setNumeEchipa}
                placeholder="Cum o cheamă"
                autoCapitalize="words"
              />
              <Buton
                eticheta="Creează echipa"
                onPress={creeazaEchipa}
                incarca={creeaza}
                dezactivat={numeEchipa.trim().length < 3}
                plin
                iconita={<Ionicons name="add" size={15} color="#ffffff" />}
              />
              <Text style={st.notaEchipa}>
                Primești un cod de invitație pe care îl dai celor pe care îi vrei
                înăuntru.
              </Text>
            </Card>

            {aleMele.length > 0 ? (
              <>
                <Text style={st.sectiune}>ECHIPELE MELE</Text>
                {aleMele.map((e, i) => (
                  <Reveal key={e.id} intarziere={i * 50} style={{ marginBottom: T.spacing.sm }}>
                    <CardEchipa e={e} />
                  </Reveal>
                ))}
              </>
            ) : null}

            {publice.length > 0 ? (
              <>
                <Text style={st.sectiune}>ECHIPE PUBLICE</Text>
                {publice.map((e, i) => (
                  <Reveal key={e.id} intarziere={i * 50} style={{ marginBottom: T.spacing.sm }}>
                    <CardEchipa e={e} />
                  </Reveal>
                ))}
              </>
            ) : null}

            {!c.incarca && aleMele.length === 0 && publice.length === 0 ? (
              <Card style={{ marginTop: T.spacing.lg }} nivel={1}>
                <View style={st.antetPrezentare}>
                  <View style={st.iconPrezentare}>
                    <Ionicons name="people-circle" size={20} color={T.accent.base} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={st.titluPrezentare}>Ce e o echipă</Text>
                    <Text style={st.subPrezentare}>Un grup închis, cu postările lui</Text>
                  </View>
                </View>
                <Text style={st.textPrezentare}>
                  Un grup de traderi care discută separat de restul comunității — colegi
                  de la aceeași firmă de prop, un grup de studiu, prietenii cu care
                  tranzacționezi. Intri cu un cod primit de la cineva, sau faci tu una
                  și dai codul mai departe.
                </Text>
                <Text style={st.notaPrezentare}>
                  Nu există nicio echipă publică încă. Poți face prima.
                </Text>
              </Card>
            ) : null}
          </View>
        }
      />
    </>
  );
}

function CardEchipa({ e }: { e: Echipa }) {
  return (
    <Card nivel={1} culoareMuchie={e.isMember ? T.accent.line : "rgba(255,255,255,0.04)"}>
      <View style={st.antetEchipa}>
        <View style={st.avatarEchipa}>
          <Ionicons name="people" size={16} color={T.accent.base} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={st.randNumeEchipa}>
            <Text style={st.numeEchipa} numberOfLines={1}>{e.name}</Text>
            {e.isOwner ? <Insigna text="Proprietar" culoare={T.state.warn} /> : null}
          </View>
          <Text style={st.metaEchipa}>
            {e.memberCount} {e.memberCount === 1 ? "membru" : "membri"} · {e.postCount} postări
          </Text>
        </View>
      </View>
      {e.description ? (
        <Text style={st.descriereEchipa} numberOfLines={2}>{e.description}</Text>
      ) : null}
    </Card>
  );
}

const st = StyleSheet.create({
  radacina: { flex: 1, backgroundColor: T.surface.s0 },
  file: { paddingHorizontal: T.spacing.lg },
  actiune: {
    width: 34,
    height: 34,
    borderRadius: T.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.accent.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.accent.line,
  },
  continut: { paddingHorizontal: T.spacing.lg, paddingBottom: SPATIU_BARA },
  antetPostare: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface.s4,
  },
  initiala: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
  },
  autor: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  cand: {
    color: T.ink.i4,
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  titlu: {
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    lineHeight: 21,
    marginTop: T.spacing.md,
  },
  continutPostare: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginTop: 6,
  },
  etichete: { flexDirection: "row", flexWrap: "wrap", gap: T.spacing.sm, marginTop: T.spacing.sm },
  eticheta: {
    color: T.accent.base,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
  josPostare: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: T.spacing.md,
    paddingTop: T.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.line.l1,
  },
  emojiuri: { flexDirection: "row", gap: 4, flex: 1, flexWrap: "wrap" },
  emoji: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    minHeight: 30,
    paddingHorizontal: 7,
    borderRadius: T.radius.sm,
    backgroundColor: T.surface.s3,
  },
  emojiActiv: {
    backgroundColor: T.accent.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.accent.line,
  },
  textEmoji: { fontSize: 12 },
  numarEmoji: {
    color: T.ink.i4,
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  comentarii: { flexDirection: "row", alignItems: "center", gap: 4 },
  numarComentarii: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
  eroare: {
    color: T.pnl.loss,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    padding: T.spacing.lg,
  },
  antetPrezentare: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  iconPrezentare: {
    width: 42,
    height: 42,
    borderRadius: T.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.accent.soft,
  },
  titluPrezentare: {
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.tight,
  },
  subPrezentare: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    lineHeight: 16,
  },
  textPrezentare: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    marginTop: T.spacing.lg,
  },
  puncte: { marginTop: T.spacing.md, gap: 9 },
  punct: { flexDirection: "row", alignItems: "flex-start", gap: T.spacing.sm },
  textPunct: {
    flex: 1,
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  titluSugestii: {
    color: T.ink.i4,
    fontSize: 10,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.wider,
    marginTop: T.spacing.xl,
    marginBottom: T.spacing.sm,
  },
  randSugestie: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  iconSugestie: {
    width: 32,
    height: 32,
    borderRadius: T.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface.s4,
  },
  textSugestie: {
    flex: 1,
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  notaPrezentare: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    textAlign: "center",
    marginTop: T.spacing.lg,
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
    justifyContent: "space-between",
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.lg,
  },
  titluFoaie: {
    color: T.ink.i1,
    fontSize: T.fontSize.lg,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.tight,
  },
  corpFoaie: { paddingHorizontal: T.spacing.lg, paddingTop: T.spacing.lg, paddingBottom: T.spacing.xl },
  eroareFoaie: {
    color: T.pnl.loss,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginBottom: T.spacing.sm,
    lineHeight: 17,
  },
  sectiune: {
    color: T.ink.i4,
    fontSize: 10,
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.wider,
    marginTop: T.spacing.xl,
    marginBottom: T.spacing.sm,
  },
  separatorEchipe: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.md,
    marginVertical: T.spacing.lg,
  },
  linieEchipe: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: T.line.l1 },
  sauEchipe: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
  notaEchipa: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    marginTop: T.spacing.sm,
  },
  antetEchipa: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  avatarEchipa: {
    width: 34,
    height: 34,
    borderRadius: T.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.accent.soft,
  },
  randNumeEchipa: { flexDirection: "row", alignItems: "center", gap: T.spacing.sm },
  numeEchipa: {
    flex: 1,
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  metaEchipa: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  descriereEchipa: {
    color: T.ink.i3,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: T.spacing.sm,
  },
  minAtingere: { minHeight: ATINGERE_MIN },
});
