import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { api } from "./api";

// Cum se afișează notificările când app-ul e deschis (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Cere permisiune, obține tokenul Expo și îl înregistrează în backend.
// Returnează tokenul sau null (permisiune refuzată / emulator).
export async function registerForPush(): Promise<string | null> {
  if (!Device.isDevice) return null; // push real doar pe device fizic

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "TradeGx",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6366f1",
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenData.data;
    await api.push.register(token, Platform.OS);
    return token;
  } catch {
    return null; // lipsă projectId (Expo Go) sau eroare de rețea
  }
}

// Reacție la tap pe notificare → callback cu ruta dorită (din data.route)
export function addNotificationResponseListener(handler: (route?: string) => void) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const route = response.notification.request.content.data?.route as string | undefined;
    handler(route);
  });
}
