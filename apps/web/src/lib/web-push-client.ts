// ── Client Web Push ──────────────────────────────────────────────────────────
// Înregistrează service worker-ul și abonează device-ul la push (VAPID).
// Rulează în browser. Complementar Notification API din web-notify.ts:
// web-notify = notificări cât browserul e deschis; web-push = și cu el închis.

export function webPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/sw.js");
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

/** Deja abonat pe acest device? */
export async function isWebPushSubscribed(): Promise<boolean> {
  if (!webPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

/** Cere permisiunea, înregistrează SW, se abonează și salvează pe server. */
export async function subscribeWebPush(): Promise<boolean> {
  if (!webPushSupported()) return false;

  let perm = Notification.permission;
  if (perm === "default") {
    try { perm = await Notification.requestPermission(); } catch { return false; }
  }
  if (perm !== "granted") return false;

  try {
    const reg = await getRegistration();
    await navigator.serviceWorker.ready;

    // Cheia publică VAPID de pe server
    const res = await fetch("/api/push/web/vapid");
    if (!res.ok) return false;
    const { publicKey } = await res.json();
    if (!publicKey) return false;

    // Reutilizează abonamentul existent dacă e valid
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
    }

    const save = await fetch("/api/push/web/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON() }),
    });
    return save.ok;
  } catch {
    return false;
  }
}

/** Dezabonează device-ul curent (local + server). */
export async function unsubscribeWebPush(): Promise<void> {
  if (!webPushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await sub.unsubscribe().catch(() => {});
    await fetch("/api/push/web/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    }).catch(() => {});
  } catch {
    /* best-effort */
  }
}
