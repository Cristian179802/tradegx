import * as React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "./Card";
import { Buton } from "./Buton";
import { T } from "../theme";

// ── Ce se vede când funcția e în PRO ─────────────────────────────────────────
//
// Trei ecrane primesc 402 de la server (Edge Finder, Monte Carlo,
// Instituțional). Fără un răspuns propriu, `useCerere` ar arăta textul crud al
// erorii — „Această funcție necesită planul PRO” pe fundal roșu, ca o defecțiune.
// Nu e defecțiune, e o ușă.
//
// BUTONUL DUCE ÎN ECRANUL DE ABONAMENT, nu în browser. Acolo sunt planurile,
// comparația completă și plata — totul în aplicație. Până acum arunca în
// browser, adică exact lucrul pe care l-am scos din tot restul aplicației.
//
// Nu promite ce nu se vede: lista de mai jos spune EXACT ce face ecranul ăsta,
// nu funcțiile întregului plan.

export function Paywall({
  functie,
  descriere,
  puncte,
}: {
  functie: string;
  descriere: string;
  puncte: string[];
}) {
  const router = useRouter();

  return (
    <Card style={{ marginTop: T.spacing.md }} culoareMuchie={T.accent.line}>
      <View style={st.sus}>
        <View style={st.iconita}>
          <Ionicons name="lock-closed" size={17} color={T.accent.base} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={st.titlu}>{functie}</Text>
          <Text style={st.plan}>Inclus în PRO</Text>
        </View>
      </View>

      <Text style={st.descriere}>{descriere}</Text>

      <View style={st.lista}>
        {puncte.map((p) => (
          <View key={p} style={st.punct}>
            <Ionicons name="checkmark" size={14} color={T.accent.base} />
            <Text style={st.textPunct}>{p}</Text>
          </View>
        ))}
      </View>

      <Buton
        eticheta="Vezi planurile"
        onPress={() => router.push("/abonament")}
        plin
        style={{ marginTop: T.spacing.lg }}
        iconita={<Ionicons name="arrow-forward" size={16} color="#ffffff" />}
      />
      <Text style={st.nota}>Poți anula oricând, dintr-o singură atingere.</Text>
    </Card>
  );
}

const st = StyleSheet.create({
  sus: { flexDirection: "row", alignItems: "center", gap: T.spacing.md },
  iconita: {
    width: 38,
    height: 38,
    borderRadius: T.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.accent.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.accent.line,
  },
  titlu: {
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.tight,
  },
  plan: {
    color: T.accent.base,
    fontSize: 10,
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.wide,
    textTransform: "uppercase",
    marginTop: 2,
  },
  descriere: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginTop: T.spacing.lg,
  },
  lista: { marginTop: T.spacing.md, gap: 8 },
  punct: { flexDirection: "row", alignItems: "flex-start", gap: T.spacing.sm },
  textPunct: {
    flex: 1,
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  nota: {
    color: T.ink.i4,
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: T.spacing.sm,
  },
});
