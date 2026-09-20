import * as React from "react";
import { Tabs } from "expo-router";
import { useAuth } from "../../src/lib/auth";
import { useInregistrareNotificari } from "../../src/lib/notificari";
import { BaraFile } from "../../src/ui/BaraFile";
import { T } from "../../src/theme";

// ── Navigarea aplicației ─────────────────────────────────────────────────────
//
// Bara e construită manual (`BaraFile`), nu cea implicită, fiindcă are nevoie
// de ceva ce navigatorul standard nu face: patru dintre cele cinci butoane
// deschid o BULĂ cu subcategorii, ca șina de comandă de pe site, în loc să
// navigheze direct.
//
// Ecranele rămân file adevărate — starea fiecăruia se păstrează când treci
// între ele, iar derularea nu se pierde.
//
// `href: null` pe „adauga" îl scoate din bară fără să-l scoată din aplicație:
// rămâne o rută normală, deschisă din bula Jurnal. Butonul „+" din mijloc a
// dispărut; ocupa cel mai bun loc din bară pentru o singură acțiune.

export default function TabsLayout() {
  // Permisiunea de notificări se cere AICI, după autentificare — nu la prima
  // deschidere, când omul încă n-a văzut ce face aplicația și refuză.
  const { utilizator } = useAuth();
  useInregistrareNotificari(Boolean(utilizator));

  return (
    <Tabs
      tabBar={() => <BaraFile />}
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
