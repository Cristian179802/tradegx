import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// ── Web Push (browser/PWA prin service worker) ───────────────────────────────
// Notificări chiar cu tab-ul/browserul închis. Cheile VAPID stau în AppSetting
// (DB) — zero env de setat manual pe Vercel. Complementar Expo (app nativă).

export interface WebPushPayload {
  title: string;
  body: string;
  url?: string;      // unde duce click-ul (default /dashboard)
  tag?: string;      // grupare (înlocuiește notificarea anterioară cu același tag)
}

let vapidCache: { publicKey: string; privateKey: string; subject: string } | null = null;

async function loadVapid() {
  if (vapidCache) return vapidCache;
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: ["vapid_public", "vapid_private", "vapid_subject"] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  if (!map.vapid_public || !map.vapid_private) return null;
  vapidCache = {
    publicKey: map.vapid_public,
    privateKey: map.vapid_private,
    subject: map.vapid_subject || "mailto:support@tradegx.com",
  };
  webpush.setVapidDetails(vapidCache.subject, vapidCache.publicKey, vapidCache.privateKey);
  return vapidCache;
}

/** Cheia publică VAPID (pentru clientul care se abonează). */
export async function getVapidPublicKey(): Promise<string | null> {
  const v = await loadVapid();
  return v?.publicKey ?? null;
}

/**
 * Trimite un web push tuturor abonamentelor unui user. Best-effort:
 * abonamentele moarte (410 Gone / 404) sunt curățate automat.
 */
export async function sendWebPushToUser(userId: string, payload: WebPushPayload): Promise<void> {
  const vapid = await loadVapid();
  if (!vapid) return;

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/dashboard",
    tag: payload.tag ?? "tradegx",
  });

  const dead: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
          { TTL: 3600, urgency: "high" }
        );
      } catch (err: unknown) {
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) dead.push(s.id);
        // alte erori (rețea etc.) — best-effort, nu blocăm
      }
    })
  );

  if (dead.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: dead } } }).catch(() => {});
  }
}
