// ── Notificări native de browser (Notification API) ─────────────────────────
// Complementare toast-urilor: toast când ești PE site, notificare de sistem
// când ești pe alt tab/fereastră. Opt-in dublu: permisiunea browserului +
// preferința locală (localStorage), ca să poată fi oprite ușor din clopoțel.

const PREF_KEY = "tradegx-web-notify";

export function webNotifySupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** Notificările sunt blocate ireversibil din setările browserului? */
export function webNotifyDenied(): boolean {
  return webNotifySupported() && Notification.permission === "denied";
}

/** Active acum? (permisiune acordată + preferința utilizatorului ON) */
export function webNotifyEnabled(): boolean {
  return (
    webNotifySupported() &&
    Notification.permission === "granted" &&
    localStorage.getItem(PREF_KEY) !== "off"
  );
}

/** Cere permisiunea și pornește notificările. Returnează starea finală. */
export async function enableWebNotify(): Promise<boolean> {
  if (!webNotifySupported()) return false;
  let perm = Notification.permission;
  if (perm === "default") {
    try { perm = await Notification.requestPermission(); } catch { return false; }
  }
  if (perm !== "granted") return false;
  localStorage.setItem(PREF_KEY, "on");
  return true;
}

export function disableWebNotify() {
  try { localStorage.setItem(PREF_KEY, "off"); } catch { /* private mode */ }
}

/** Afișează o notificare de sistem (dacă e permis). Click → focus pe site. */
export function showWebNotification(title: string, body: string) {
  if (!webNotifyEnabled()) return;
  try {
    const n = new Notification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "tradegx-alert", // înlocuiește notificarea anterioară (fără spam)
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* unele browsere (mobil) cer Service Worker — ignorăm silențios */
  }
}
