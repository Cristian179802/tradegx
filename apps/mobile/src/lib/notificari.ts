import * as React from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { api } from "./api";

// ── Notificări ───────────────────────────────────────────────────────────────
//
// Singurul motiv pentru care merită o aplicație nativă în loc de site: te
// anunță când NU ești în ea. Alertă de preț atinsă, semnal nou, regula de risc
// aproape depășită.
//
// TREI REGULI, toate din greșeli pe care le face lumea aici:
//
// 1. NU cerem permisiunea la prima deschidere. Un dialog de notificări înainte
//    ca omul să fi văzut ce face aplicația se refuză, iar pe Android refuzul e
//    permanent după două respingeri — ai pierdut canalul pentru totdeauna.
//    Se cere DUPĂ autentificare, când există deja un motiv.
//
// 2. Nimic din asta nu aruncă. Fără permisiune, fără rețea, pe emulator — toate
//    sunt cazuri normale, nu erori. O aplicație care crapă fiindcă n-are voie
//    să trimită notificări e o aplicație stricată.
//
// 3. Canalul Android se creează ÎNAINTE de token. Fără canal, notificările
//    ajung pe Android 8+ în categoria implicită, fără sunet și fără prioritate
//    — adică nu se văd.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CANAL = "tradegx-alerte";

async function pregatesteCanalul() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CANAL, {
    name: "Alerte TradeGx",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: "#6d75f6",
    sound: "default",
  });
}

/**
 * Cere permisiunea, obține tokenul Expo și îl trimite serverului.
 * Întoarce tokenul, sau `null` dacă nu s-a putut — ceea ce e o stare normală.
 */
export async function inregistreazaNotificari(): Promise<string | null> {
  // Emulatoarele nu au serviciu de notificări. Nu e o eroare, e un emulator.
  if (!Device.isDevice) return null;

  try {
    await pregatesteCanalul();

    const existenta = await Notifications.getPermissionsAsync();
    let acordata = existenta.granted;

    if (!acordata && existenta.canAskAgain) {
      const ceruta = await Notifications.requestPermissionsAsync();
      acordata = ceruta.granted;
    }
    if (!acordata) return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;
    if (!projectId) return null;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!token) return null;

    await api.push.register(token, Platform.OS);
    return token;
  } catch {
    // Orice eșec aici înseamnă doar „fără notificări”, niciodată „aplicație
    // stricată".
    return null;
  }
}

/** Scoate tokenul de pe server la deconectare, ca telefonul să nu mai primească. */
export async function scoateNotificari(): Promise<void> {
  try {
    if (!Device.isDevice) return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (token) await api.push.unregister(token);
  } catch {
    /* deconectarea nu se blochează pentru asta */
  }
}

/**
 * Înregistrează telefonul o dată pe sesiune, după autentificare.
 * Se montează în layout-ul aplicației, nu în fiecare ecran.
 */
export function useInregistrareNotificari(autentificat: boolean) {
  const facut = React.useRef(false);

  React.useEffect(() => {
    if (!autentificat || facut.current) return;
    facut.current = true;
    void inregistreazaNotificari();
  }, [autentificat]);

  // La deconectare permitem o nouă înregistrare la următoarea autentificare.
  React.useEffect(() => {
    if (!autentificat) facut.current = false;
  }, [autentificat]);
}
