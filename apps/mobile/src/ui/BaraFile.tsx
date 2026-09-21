import * as React from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "./Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { DOMENII, type Domeniu, type ElementMeniu } from "../lib/meniu";
import { URL_API } from "../lib/api";
import { T, ATINGERE_MIN, umbra } from "../theme";

// ── Bara de jos, cu bule ─────────────────────────────────────────────────────
//
// Cinci butoane care oglindesc domeniile din șina de comandă a site-ului. Patru
// deschid o BULĂ cu subcategoriile; „Acasă” duce direct acolo, fiindcă e o
// destinație, nu o categorie — un meniu care se deschide când vrei doar să te
// întorci acasă e o atingere în plus de fiecare dată.
//
// Butonul „+” din mijloc a dispărut. Ocupa locul cel mai bun din bară pentru o
// singură acțiune, iar „Adaugă tranzacție” stă acum primul în bula Jurnal —
// tot la două atingeri, dar fără să fure un slot întreg.
//
// BULA se deschide de deasupra butonului apăsat, nu din centru: ochiul trebuie
// să vadă DE UNDE vine, altfel pare că a apărut un ecran nou.
//
// Butonul fizic „înapoi” al Android-ului închide bula înainte să iasă din
// ecran. Fără asta, un meniu deschis ar înghiți gestul și omul ar ieși din
// aplicație crezând că închide meniul.

const LATIME = Dimensions.get("window").width;

export function BaraFile() {
  const router = useRouter();
  const cale = usePathname();
  const jos = useSafeAreaInsets().bottom;

  const [deschis, setDeschis] = React.useState<Domeniu | null>(null);
  const p = React.useRef(new Animated.Value(0)).current;

  const inchide = React.useCallback(() => {
    Animated.timing(p, {
      toValue: 0,
      duration: T.duration.fast,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => finished && setDeschis(null));
  }, [p]);

  const deschide = React.useCallback(
    (d: Domeniu) => {
      setDeschis(d);
      p.setValue(0);
      Animated.timing(p, {
        toValue: 1,
        duration: T.duration.normal,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }).start();
    },
    [p],
  );

  // Android: „înapoi” închide bula, nu ecranul.
  React.useEffect(() => {
    if (Platform.OS !== "android" || !deschis) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      inchide();
      return true;
    });
    return () => sub.remove();
  }, [deschis, inchide]);

  const apasa = React.useCallback(
    (d: Domeniu) => {
      Haptics.selectionAsync().catch(() => {});
      if (deschis?.id === d.id) return inchide();
      if (d.ruta) {
        if (deschis) inchide();
        router.navigate(d.ruta as never);
        return;
      }
      deschide(d);
    },
    [deschis, deschide, inchide, router],
  );

  const mergiLa = React.useCallback(
    async (e: ElementMeniu) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      inchide();
      if (e.nativ) {
        router.navigate(e.tinta as never);
        return;
      }
      const url = `${URL_API}${e.tinta}`;
      if (await Linking.canOpenURL(url)) Linking.openURL(url);
    },
    [inchide, router],
  );

  // Ce buton e aprins se DEDUCE din meniu, nu se scrie a doua oară. Varianta
  // veche compara bucăți de cale („cale.includes('setari')”); cu douăzeci de
  // ecrane, fiecare ecran nou ar fi cerut încă o linie aici — și lipsa ei nu
  // dă eroare, doar o bară care nu arată unde ești.
  const activ = (d: Domeniu): boolean => {
    if (deschis) return deschis.id === d.id;
    if (d.ruta) return potrivit(cale, d.ruta);
    if (d.potriviri?.some((t) => potrivit(cale, t))) return true;
    return (d.grupuri ?? []).some((g) =>
      g.elemente.some((e) => e.nativ && potrivit(cale, e.tinta)),
    );
  };

  return (
    <>
      {/* ── Bula ── */}
      {deschis && (
        <>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={inchide}
            accessibilityRole="button"
            accessibilityLabel="Închide meniul"
          >
            <Animated.View style={[StyleSheet.absoluteFill, st.voal, { opacity: p }]} />
          </Pressable>

          <Animated.View
            style={[
              st.bula,
              umbra(3),
              { bottom: 64 + jos + 8 },
              {
                opacity: p,
                transform: [
                  { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
                  { scale: p.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                ],
              },
            ]}
          >
            <View style={st.manerBula}>
              <View style={st.maner} />
              <Text style={st.titluBula}>{deschis.eticheta}</Text>
            </View>

            <ScrollView
              style={{ maxHeight: 420 }}
              contentContainerStyle={st.continutBula}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {deschis.grupuri?.map((g, gi) => (
                <View key={gi} style={gi > 0 ? { marginTop: T.spacing.lg } : undefined}>
                  {g.titlu ? <Text style={st.titluGrup}>{g.titlu}</Text> : null}
                  {g.elemente.map((e) => (
                    <Rand key={e.tinta} element={e} onPress={() => mergiLa(e)} />
                  ))}
                </View>
              ))}
            </ScrollView>

            {/* Săgeata care leagă bula de butonul apăsat. */}
            <View
              style={[
                st.varf,
                { left: pozitiaVarfului(deschis.id) },
              ]}
            />
          </Animated.View>
        </>
      )}

      {/* ── Bara ── */}
      <View style={[st.bara, { height: 64 + jos, paddingBottom: jos }]}>
        {Platform.OS === "ios" ? (
          <BlurView tint="dark" intensity={40} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: T.surface.s1 }]} />
        )}
        <View style={st.linieSus} />

        {DOMENII.map((d) => {
          const a = activ(d);
          return (
            <Pressable
              key={d.id}
              onPress={() => apasa(d)}
              style={st.buton}
              accessibilityRole="button"
              accessibilityState={{ selected: a, expanded: deschis?.id === d.id }}
              accessibilityLabel={d.eticheta}
            >
              <Ionicons
                name={a ? d.iconitaPlina : d.iconita}
                size={22}
                color={a ? T.accent.base : T.ink.i4}
              />
              <Text style={[st.eticheta, a && { color: T.accent.base }]} numberOfLines={1}>
                {d.eticheta}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

function Rand({ element, onPress }: { element: ElementMeniu; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [st.rand, pressed && st.randApasat]}
      accessibilityRole={element.nativ ? "button" : "link"}
      accessibilityLabel={element.eticheta}
    >
      <View style={[st.cutieIconita, element.nativ && st.cutieNativa]}>
        <Ionicons
          name={element.iconita}
          size={17}
          color={element.nativ ? T.accent.base : T.ink.i3}
        />
      </View>
      <Text style={st.textRand} numberOfLines={1}>{element.eticheta}</Text>
      {element.insigna ? (
        <View style={st.insigna}>
          <Text style={st.textInsigna}>{element.insigna}</Text>
        </View>
      ) : null}
      {!element.nativ ? (
        <Ionicons name="open-outline" size={14} color={T.ink.i4} />
      ) : null}
    </Pressable>
  );
}

/**
 * Calea curentă corespunde țintei din meniu?
 *
 * `usePathname()` nu include grupurile de rute, deci „/(tabs)/tranzactii” din
 * meniu ajunge pe ecran ca „/tranzactii”, iar „/(tabs)” ca „/”.
 */
function potrivit(cale: string, tinta: string): boolean {
  const curata = (s: string) => {
    const fara = s.replace("/(tabs)", "");
    return fara === "" ? "/" : fara;
  };
  const t = curata(tinta);
  const c = curata(cale);
  if (t === "/") return c === "/";
  return c === t || c.startsWith(`${t}/`);
}

/** Vârful săgeții stă sub butonul care a deschis bula. */
function pozitiaVarfului(id: string): number {
  const i = DOMENII.findIndex((d) => d.id === id);
  const latimeButon = LATIME / DOMENII.length;
  const centru = latimeButon * i + latimeButon / 2;
  // Bula are 12px margine laterală; vârful are 16px lățime.
  return Math.max(24, Math.min(LATIME - 12 - 40, centru - 12 - 8));
}

const st = StyleSheet.create({
  bara: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 8,
    overflow: "hidden",
  },
  linieSus: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.line.l1,
  },
  buton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 3,
    minHeight: ATINGERE_MIN,
    paddingTop: 2,
  },
  eticheta: {
    fontSize: 10,
    color: T.ink.i4,
    letterSpacing: T.tracking.wide,
    fontFamily: "Inter_700Bold",
  },
  voal: {
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  bula: {
    position: "absolute",
    left: 12,
    right: 12,
    backgroundColor: T.surface.s2,
    borderRadius: T.radius["2xl"],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l2,
    overflow: "visible",
  },
  manerBula: {
    alignItems: "center",
    paddingTop: T.spacing.md,
    paddingBottom: T.spacing.sm,
  },
  maner: {
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: T.line.top,
  },
  titluBula: {
    marginTop: T.spacing.sm,
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    textTransform: "uppercase",
    letterSpacing: T.tracking.wider,
    fontFamily: "Inter_800ExtraBold",
  },
  continutBula: {
    paddingHorizontal: T.spacing.sm,
    paddingBottom: T.spacing.lg,
  },
  titluGrup: {
    color: T.ink.i4,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: T.tracking.wider,
    paddingHorizontal: T.spacing.md,
    marginBottom: 4,
    fontFamily: "Inter_700Bold",
  },
  rand: {
    flexDirection: "row",
    alignItems: "center",
    gap: T.spacing.md,
    minHeight: ATINGERE_MIN,
    paddingHorizontal: T.spacing.md,
    borderRadius: T.radius.md,
  },
  randApasat: {
    backgroundColor: T.surface.s3,
  },
  cutieIconita: {
    width: 32,
    height: 32,
    borderRadius: T.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.surface.s4,
  },
  cutieNativa: {
    backgroundColor: T.accent.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.accent.line,
  },
  textRand: {
    flex: 1,
    color: T.ink.i2,
    fontSize: T.fontSize.base,
    fontFamily: "Inter_400Regular",
  },
  insigna: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: T.radius.sm,
    backgroundColor: "rgba(251,191,36,0.14)",
  },
  textInsigna: {
    color: T.state.warn,
    fontSize: 9,
    letterSpacing: T.tracking.wide,
    fontFamily: "Inter_800ExtraBold",
  },
  varf: {
    position: "absolute",
    bottom: -7,
    width: 16,
    height: 16,
    backgroundColor: T.surface.s2,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: T.line.l2,
    transform: [{ rotate: "45deg" }],
  },
});
