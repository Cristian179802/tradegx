import * as React from "react";
import { Tabs } from "expo-router";
import { useAuth } from "../../src/lib/auth";
import { useInregistrareNotificari } from "../../src/lib/notificari";
import { T } from "../../src/theme";

// ── Filele ───────────────────────────────────────────────────────────────────
//
// Cele patru ecrane care se deschid des rămân FILE adevărate: starea și poziția
// derulării se păstrează când treci între ele. Restul aplicației (peste
// douăzeci de ecrane, deschise din bulele meniului) sunt ecrane de stivă — se
// deschid și se închid, nu are sens să rămână toate montate în memorie.
//
// Bara nu se mai desenează aici. A urcat în `app/_layout.tsx`, ca să fie
// vizibilă și peste ecranele de stivă; `tabBar` întoarce `null` fiindcă
// navigatorul cere o bară, iar a lui ar fi a doua.

export default function TabsLayout() {
  // Permisiunea de notificări se cere AICI, după autentificare — nu la prima
  // deschidere, când omul încă n-a văzut ce face aplicația și refuză.
  const { utilizator } = useAuth();
  useInregistrareNotificari(Boolean(utilizator));

  return (
    <Tabs
      tabBar={() => null}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: T.surface.s0 },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="tranzactii" />
      <Tabs.Screen name="adauga" options={{ href: null }} />
      <Tabs.Screen name="setari" options={{ href: null }} />
    </Tabs>
  );
}
