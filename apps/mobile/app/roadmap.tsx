import * as React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../src/lib/api";
import { useCerere } from "../src/lib/useCerere";
import { Card } from "../src/ui/Card";
import { Reveal } from "../src/ui/Reveal";
import { Ecran } from "../src/ui/Ecran";
import { BaraProgres, Insigna } from "../src/ui/parti";
import { T } from "../src/theme";

// ── Roadmap ──────────────────────────────────────────────────────────────────
//
// Listele reflectă ce e ÎN COD, nu ce ne-am propus — aceeași regulă ca pe site,
// și același text, luat din aceeași sursă (`/api/roadmap`). Copiat în
// aplicație, ar fi rămas în urmă la prima livrare nouă, iar un roadmap care
// minte e mai rău decât niciunul.
//
// LIVRATE STAU PRIMELE și au numărul lor mare, sus. Cine deschide ecranul ăsta
// întreabă de fapt „merită să am încredere în produsul ăsta” — iar răspunsul
// nu e lista de promisiuni, e lista de lucruri deja făcute.
//
// Secțiunile se pot strânge. Douăzeci și șase de rânduri livrate sunt o dovadă
// bună, dar dacă sunt mereu desfășurate, nimeni n-ajunge la ce urmează.

interface Sectiune {
  id: string;
  titlu: string;
  stare: "gata" | "lucru" | "planificat" | "viziune" | string;
  nota?: string;
  elemente: string[];
}

interface Roadmap {
  titlu: string;
  actualizat: string;
  intro: string;
  sectiuni: Sectiune[];
}

const INFATISARE: Record<
  string,
  { culoare: string; iconita: React.ComponentProps<typeof Ionicons>["name"]; eticheta: string }
> = {
  gata: { culoare: T.pnl.gain, iconita: "checkmark-circle", eticheta: "livrat" },
  lucru: { culoare: T.accent.base, iconita: "sync", eticheta: "în lucru" },
  planificat: { culoare: T.state.warn, iconita: "ellipse-outline", eticheta: "planificat" },
  viziune: { culoare: T.ink.i4, iconita: "sparkles-outline", eticheta: "viziune" },
};

export default function RoadmapEcran() {
  const c = useCerere<Roadmap>(() => api.roadmap() as Promise<Roadmap>);
  const d = c.date;

  // Prima secțiune (livrate) e deschisă; restul se desfac la atingere.
  const [deschise, setDeschise] = React.useState<Record<string, boolean>>({ livrate: true });

  const livrate = d?.sectiuni.find((s) => s.stare === "gata")?.elemente.length ?? 0;
  const total = d?.sectiuni.reduce((n, s) => n + s.elemente.length, 0) ?? 0;

  return (
    <Ecran
      titlu="Roadmap"
      subtitlu={d ? d.actualizat : "Ce s-a livrat și ce urmează"}
      incarca={c.incarca && !d}
      scheletRanduri={4}
      reimprospateaza={c.reimprospateaza}
      onReia={c.reia}
      eroare={c.eroare}
    >
      {!d ? null : (
        <>
          <Reveal>
            <Card culoareMuchie="rgba(52,211,153,0.30)">
              <View style={st.antet}>
                <View>
                  <Text style={st.eticheta}>LIVRATE PÂNĂ ACUM</Text>
                  <View style={st.randNumar}>
                    <Text style={st.numar}>{livrate}</Text>
                    <Text style={st.dinTotal}>din {total} pe listă</Text>
                  </View>
                </View>
                <View style={st.bifa}>
                  <Ionicons name="checkmark-done" size={22} color={T.pnl.gain} />
                </View>
              </View>
              <BaraProgres
                fractiune={total > 0 ? livrate / total : 0}
                culoare={T.pnl.gain}
                style={{ marginTop: T.spacing.lg }}
              />
              <Text style={st.intro}>{d.intro}</Text>
            </Card>
          </Reveal>

          {d.sectiuni.map((s, i) => {
            const inf = INFATISARE[s.stare] ?? INFATISARE.planificat!;
            const desfasurat = deschise[s.id] ?? false;
            return (
              <Reveal key={s.id} intarziere={60 + i * 50} style={{ marginTop: T.spacing.md }}>
                <Card
                  faraPadding
                  onPress={() => setDeschise((p) => ({ ...p, [s.id]: !desfasurat }))}
                  accesibilEticheta={`${s.titlu}, ${s.elemente.length} elemente`}
                >
                  <View style={st.antetSectiune}>
                    <View style={[st.iconSectiune, { backgroundColor: `${inf.culoare}1A` }]}>
                      <Ionicons name={inf.iconita} size={16} color={inf.culoare} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={st.titluSectiune} numberOfLines={1}>{s.titlu}</Text>
                      <Text style={st.numarSectiune}>
                        {s.elemente.length} {s.elemente.length === 1 ? "element" : "elemente"}
                      </Text>
                    </View>
                    <Insigna text={inf.eticheta} culoare={inf.culoare} fundal={`${inf.culoare}1A`} />
                    <Ionicons
                      name={desfasurat ? "chevron-up" : "chevron-down"}
                      size={15}
                      color={T.ink.i4}
                    />
                  </View>

                  {desfasurat ? (
                    <View style={st.lista}>
                      {s.nota ? <Text style={st.nota}>{s.nota}</Text> : null}
                      {s.elemente.map((e, k) => (
                        <View key={`${s.id}-${k}`} style={st.rand}>
                          <Ionicons
                            name={inf.iconita}
                            size={13}
                            color={inf.culoare}
                            style={st.iconRand}
                          />
                          <Text style={st.textRand}>{e}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
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
  antet: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  eticheta: {
    color: T.ink.i4,
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: T.tracking.wider,
    marginBottom: 5,
  },
  randNumar: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  numar: {
    color: T.pnl.gain,
    fontSize: T.fontSize["2xl"],
    fontWeight: "800",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  dinTotal: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
  },
  bifa: {
    width: 44,
    height: 44,
    borderRadius: T.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(52,211,153,0.10)",
  },
  intro: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    marginTop: T.spacing.md,
  },
  antetSectiune: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.sm,
    padding: T.spacing.lg,
  },
  iconSectiune: {
    width: 34,
    height: 34,
    borderRadius: T.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titluSectiune: {
    color: T.ink.i1,
    fontSize: T.fontSize.sm,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  numarSectiune: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  lista: {
    paddingHorizontal: T.spacing.lg,
    paddingBottom: T.spacing.lg,
    gap: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.line.l1,
    paddingTop: T.spacing.md,
  },
  nota: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginBottom: 4,
  },
  rand: { flexDirection: "row", alignItems: "flex-start", gap: T.spacing.sm },
  iconRand: { marginTop: 2 },
  textRand: {
    flex: 1,
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});
