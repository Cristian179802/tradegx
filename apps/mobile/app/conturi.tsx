import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { tr } from "../src/lib/i18n";
import { Text } from "../src/ui/Text";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api, ApiError } from "../src/lib/api";
import { useRouter } from "expo-router";
import { useCerere } from "../src/lib/useCerere";
import { bani, candva, numar } from "../src/lib/format";
import { Card } from "../src/ui/Card";
import { Buton } from "../src/ui/Buton";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { RollingNumber } from "../src/ui/RollingNumber";
import { Gol, Insigna, Rand, Sectiune } from "../src/ui/parti";
import { T, tonPnl } from "../src/theme";

// ── Conturi de trading ───────────────────────────────────────────────────────
//
// Ecranul ăsta face UN lucru important, restul e afișare: alege contul pe care
// îl privește tot restul aplicației. Selecția stă în baza de date
// (`isActive`), nu pe telefon — deci schimbi contul aici și dashboard-ul de pe
// desktop arată același lucru.
//
// „Toate conturile” e o opțiune explicită, nu lipsa unei alegeri. Media peste
// un cont finanțat de 100.000 și unul de crypto de 500 nu descrie niciun cont
// real; cine o vrea, o cere.
//
// SOLDUL nu se recalculează local. Pe conturile sincronizate cu brokerul,
// cifra vine de la broker și include pozițiile deschise; formula
// „sold inițial + P&L realizat” ar înlocui adevărul cu o deducție. Ruta face
// deja distincția — aici doar o afișăm.

interface Cont {
  id: string;
  name: string;
  type: string;
  broker: string | null;
  currency: string;
  balance: string;
  initialBalance: string;
  tradePnl: string;
  leverage: number;
  isActive: boolean;
  brokerSource: string | null;
  lastSyncedAt: string | null;
  propFirm: string | null;
  _count?: { trades: number };
}

const TIPURI: Record<string, string> = {
  DEMO: "Demo",
  LIVE: "Real",
  PROP_FIRM: "Prop firm",
  BACKTEST: "Backtest",
};

export default function Conturi() {
  const router = useRouter();
  const c = useCerere<Cont[]>(() => api.accounts.list() as Promise<Cont[]>);
  const conturi = c.date ?? [];

  const [comuta, setComuta] = React.useState<string | "toate" | null>(null);
  const [sincronizeaza, setSincronizeaza] = React.useState(false);
  const [eroare, setEroare] = React.useState<string | null>(null);

  const activ = conturi.find((x) => x.isActive) ?? null;

  const alege = async (id: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setComuta(id ?? "toate");
    setEroare(null);
    try {
      await api.accounts.setActive(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      c.reia();
    } catch (e) {
      setEroare(e instanceof ApiError ? e.message : "Nu am putut schimba contul.");
    } finally {
      setComuta(null);
    }
  };

  const sincronizeazaAcum = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSincronizeaza(true);
    setEroare(null);
    try {
      await api.accounts.refresh();
      c.reia();
    } catch (e) {
      setEroare(e instanceof ApiError ? e.message : "Sincronizarea nu a pornit.");
    } finally {
      setSincronizeaza(false);
    }
  };

  const areSincronizate = conturi.some((x) => x.brokerSource);

  return (
    <Ecran
      titlu="Conturi"
      subtitlu={activ ? `Vezi: ${activ.name}` : "Vezi: toate conturile"}
      incarca={c.incarca && conturi.length === 0}
      scheletRanduri={4}
      reimprospateaza={c.reimprospateaza}
      onReia={c.reia}
      eroare={eroare ?? c.eroare}
      actiune={
        areSincronizate ? (
          <Pressable
            onPress={sincronizeazaAcum}
            style={st.actiune}
            accessibilityRole="button"
            accessibilityLabel={tr("Sincronizează cu brokerul")}
            accessibilityState={{ busy: sincronizeaza }}
            hitSlop={8}
          >
            <Ionicons
              name={sincronizeaza ? "sync" : "sync-outline"}
              size={16}
              color={sincronizeaza ? T.accent.base : T.ink.i3}
            />
          </Pressable>
        ) : undefined
      }
    >
      {conturi.length === 0 ? (
        <Gol
          iconita="wallet-outline"
          titlu="Niciun cont de trading"
          text="Aplicația măsoară ce se întâmplă într-un cont: sold, rezultate, limite. Fără unul, n-are ce urmări."
          actiune={
            <Buton
              eticheta="Adaugă primul cont"
              onPress={() => router.push("/cont-nou")}
              iconita={<Ionicons name="add" size={16} color="#ffffff" />}
            />
          }
        />
      ) : (
        <>
          <Reveal>
            <Pressable onPress={() => alege(null)} accessibilityRole="button">
              <Card
                culoareMuchie={activ == null ? T.accent.line : "rgba(255,255,255,0.04)"}
                nivel={1}
              >
                <View style={st.randToate}>
                  <View style={[st.cerc, activ == null && st.cercPlin]}>
                    {activ == null ? (
                      <Ionicons name="checkmark" size={13} color={T.accent.base} />
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.numeToate}>Toate conturile</Text>
                    <Text style={st.notaToate}>
                      Vedere agregată. Util ca sumă, nu ca performanță.
                    </Text>
                  </View>
                  {comuta === "toate" ? (
                    <Ionicons name="hourglass-outline" size={15} color={T.ink.i4} />
                  ) : null}
                </View>
              </Card>
            </Pressable>
          </Reveal>

          <Sectiune titlu={`${conturi.length} ${conturi.length === 1 ? "cont" : "conturi"}`} />

          {conturi.map((x, i) => (
            <Reveal key={x.id} intarziere={60 + i * 55} style={{ marginBottom: T.spacing.md }}>
              <CardCont
                cont={x}
                inAsteptare={comuta === x.id}
                onAlege={() => alege(x.id)}
              />
            </Reveal>
          ))}
        </>
      )}
    </Ecran>
  );
}

function CardCont({
  cont, inAsteptare, onAlege,
}: {
  cont: Cont;
  inAsteptare: boolean;
  onAlege: () => void;
}) {
  const sold = Number(cont.balance);
  const initial = Number(cont.initialBalance);
  const pnl = Number(cont.tradePnl);
  const randament = initial > 0 ? ((sold - initial) / initial) * 100 : null;

  return (
    <Card
      onPress={onAlege}
      culoareMuchie={cont.isActive ? T.accent.line : "rgba(255,255,255,0.04)"}
      accesibilEticheta={`${cont.name}, sold ${bani(sold, cont.currency, false)}${cont.isActive ? ", cont selectat" : ""}`}
    >
      <View style={st.antetCont}>
        <View style={[st.cerc, cont.isActive && st.cercPlin]}>
          {cont.isActive ? <Ionicons name="checkmark" size={13} color={T.accent.base} /> : null}
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={st.nume} numberOfLines={1}>{cont.name}</Text>
          <Text style={st.subnume} numberOfLines={1}>
            {[cont.propFirm ?? cont.broker, TIPURI[cont.type] ?? cont.type, `1:${cont.leverage}`]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>

        {inAsteptare ? (
          <Ionicons name="hourglass-outline" size={15} color={T.ink.i4} />
        ) : cont.brokerSource ? (
          <Insigna text={cont.brokerSource} culoare={T.ink.i3} />
        ) : null}
      </View>

      <View style={st.sold}>
        <RollingNumber
          value={bani(sold, cont.currency, false)}
          size={T.fontSize["2xl"]}
          color={T.ink.i1}
        />
        {randament != null ? (
          <Text style={[st.randament, { color: tonPnl(randament) }]}>
            {randament > 0 ? "+" : randament < 0 ? "−" : ""}
            {Math.abs(randament).toFixed(2)}%
          </Text>
        ) : null}
      </View>

      <View style={st.detalii}>
        <Rand cheie="Rezultat din tranzacții" valoare={bani(pnl, cont.currency)} culoare={tonPnl(pnl)} />
        <Rand cheie="Sold inițial" valoare={bani(initial, cont.currency, false)} />
        <Rand cheie="Tranzacții" valoare={numar(cont._count?.trades ?? 0, 0)} />
        {cont.lastSyncedAt ? (
          <Rand cheie="Sincronizat" valoare={candva(cont.lastSyncedAt)} numeric={false} />
        ) : null}
      </View>
    </Card>
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
  randToate: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  cerc: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: T.line.l2,
    alignItems: "center",
    justifyContent: "center",
  },
  cercPlin: { backgroundColor: T.accent.soft, borderColor: T.accent.line },
  numeToate: {
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontFamily: "Inter_700Bold",
  },
  notaToate: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  antetCont: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  nume: {
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.tight,
  },
  subnume: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  sold: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: T.spacing.sm,
    marginTop: T.spacing.lg,
  },
  randament: {
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_800ExtraBold",
  },
  detalii: {
    marginTop: T.spacing.md,
    paddingTop: T.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.line.l1,
  },
});
