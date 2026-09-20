import * as React from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "./Card";
import { Buton } from "./Buton";
import { URL_API } from "../lib/api";
import { T } from "../theme";

// ── Ce se vede când funcția e în PRO ─────────────────────────────────────────
//
// Trei ecrane primesc 402 de la server (Edge Finder, Monte Carlo,
// Instituțional). Fără un răspuns propriu, `useCerere` ar arăta textul crud al
// erorii — „Această funcție necesită planul PRO" pe fundal roșu, ca o defecțiune.
// Nu e defecțiune, e o ușă.
//
// BUTONUL DESCHIDE BROWSERUL, și e singura cale corectă: plata trece prin
// Stripe Checkout. Un formular de card reconstruit în aplicație ar însemna date
// de card prin codul nostru, plus regulile magazinelor de aplicații pe cap.
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
        onPress={() => {
          Linking.openURL(`${URL_API}/pricing`).catch(() => {});
        }}
        plin
        style={{ marginTop: T.spacing.lg }}
        iconita={<Ionicons name="open-outline" size={16} color="#ffffff" />}
      />
      <Text style={st.nota}>Abonamentul se gestionează pe site, în browser.</Text>
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
    fontWeight: "800",
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: T.tracking.tight,
  },
  plan: {
    color: T.accent.base,
    fontSize: 10,
    fontWeight: "800",
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
