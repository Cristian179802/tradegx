import { prisma } from "@/lib/prisma";
import { limbaUtilizatorului, type Limba } from "@/lib/limba-utilizator";

// Trimitere push prin Expo Push API (https://docs.expo.dev/push-notifications).
// Tokenurile Expo sunt stocate în PushToken la înregistrarea device-ului.

export type PushMessage = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

async function dispatch(tokens: string[], msg: PushMessage) {
  const valid = tokens.filter((t) => t.startsWith("ExponentPushToken") || t.startsWith("ExpoPushToken"));
  if (valid.length === 0) return;

  const messages = valid.map((to) => ({
    to,
    sound: "default",
    title: msg.title,
    body: msg.body,
    data: msg.data ?? {},
    priority: "high",
    // Canalul pe care îl creează aplicația (`apps/mobile/src/lib/notificari.ts`).
    // Pe Android 8+, o notificare trimisă pe un canal care nu există pe telefon
    // NU SE AFIȘEAZĂ deloc — iar aici era „default", pe care aplicația nu-l face.
    channelId: "tradegx-alerte",
  }));

  // Expo acceptă maxim 100 mesaje per cerere
  for (let i = 0; i < messages.length; i += 100) {
    try {
      await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(messages.slice(i, i + 100)),
      });
    } catch {
      /* best-effort — nu blocăm fluxul principal dacă push-ul eșuează */
    }
  }
}

// Push către un user (toate device-urile lui) — ex: alertă de risc/drawdown.
export async function sendPushToUser(userId: string, msg: PushMessage) {
  const tokens = await prisma.pushToken.findMany({ where: { userId }, select: { token: true } });
  await dispatch(tokens.map((t) => t.token), msg);
}

// Push către toți userii cu device înregistrat, fiecare în limba lui — ex:
// semnale HPS globale. Un singur text pentru toți ar fi ajuns în română și la
// cine folosește aplicația în engleză.
export async function sendPushToAll(mesaje: Record<Limba, PushMessage>) {
  const tokens = await prisma.pushToken.findMany({
    select: { token: true, user: { select: { language: true } } },
  });
  for (const limba of ["ro", "en"] as const) {
    const aiLimbii = tokens.filter((t) => limbaUtilizatorului(t.user.language) === limba);
    await dispatch(aiLimbii.map((t) => t.token), mesaje[limba]);
  }
}
