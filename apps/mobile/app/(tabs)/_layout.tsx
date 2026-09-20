import * as React from "react";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { T } from "../../src/theme";

// ── Bara de file ─────────────────────────────────────────────────────────────
//
// PATRU file, nu opt. Site-ul are 54 de ecrane; pe telefon contează patru
// lucruri: unde sunt azi, ce am tranzacționat, adaug ceva nou, setări. Restul
// e muncă de birou, iar o bară cu opt pictograme înseamnă că niciuna nu se
// nimerește din prima.
//
// „Adaugă" stă la mijloc și e evidențiată: e singura acțiune pentru care cineva
// deschide aplicația în grabă, imediat după ce a închis o poziție.
//
// Fundal translucid cu blur pe iOS; pe Android BlurView costă mult pe telefoane
// slabe, deci acolo e o suprafață opacă. Diferența nu se vede, lag-ul se vede.

function Iconita({
  nume, activ, accent,
}: {
  nume: React.ComponentProps<typeof Ionicons>["name"];
  activ: boolean;
  accent?: boolean;
}) {
  if (accent) {
    return (
      <View style={[st.plus, activ && st.plusActiv]}>
        <Ionicons name={nume} size={24} color="#fff" />
      </View>
    );
  }
  return (
    <Ionicons
      name={nume}
      size={23}
      color={activ ? T.accent.base : T.ink.i4}
    />
  );
}

export default function TabsLayout() {
  const bataie = React.useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: T.accent.base,
        tabBarInactiveTintColor: T.ink.i4,
        tabBarLabelStyle: st.eticheta,
        tabBarStyle: st.bara,
        tabBarBackground:
          Platform.OS === "ios"
            ? () => <BlurView tint="dark" intensity={40} style={StyleSheet.absoluteFill} />
            : undefined,
        sceneStyle: { backgroundColor: T.surface.s0 },
      }}
      screenListeners={{ tabPress: bataie }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Acasă",
          tabBarIcon: ({ focused }) => <Iconita nume={focused ? "home" : "home-outline"} activ={focused} />,
        }}
      />
      <Tabs.Screen
        name="tranzactii"
        options={{
          title: "Tranzacții",
          tabBarIcon: ({ focused }) => <Iconita nume={focused ? "list" : "list-outline"} activ={focused} />,
        }}
      />
      <Tabs.Screen
        name="adauga"
        options={{
          title: "Adaugă",
          tabBarIcon: ({ focused }) => <Iconita nume="add" activ={focused} accent />,
        }}
      />
      <Tabs.Screen
        name="setari"
        options={{
          title: "Setări",
          tabBarIcon: ({ focused }) => <Iconita nume={focused ? "settings" : "settings-outline"} activ={focused} />,
        }}
      />
    </Tabs>
  );
}

const st = StyleSheet.create({
  bara: {
    position: "absolute",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.line.l1,
    backgroundColor:
      Platform.OS === "ios" ? "transparent" : T.surface.s1,
    height: Platform.OS === "ios" ? 84 : 64,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 28 : 8,
    elevation: 0,
  },
  eticheta: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: T.tracking.wide,
  },
  plus: {
    width: 44,
    height: 34,
    borderRadius: T.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.accent.base,
    // Umbra colorată face butonul să pară că stă DEASUPRA barei, nu în ea.
    shadowColor: T.accent.base,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  plusActiv: {
    transform: [{ scale: 1.04 }],
  },
});
