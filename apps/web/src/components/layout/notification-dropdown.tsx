"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Bell, BellRing, BellOff, CheckCheck, AlertTriangle, TrendingDown, Zap, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  webNotifySupported, webNotifyEnabled, webNotifyDenied,
  enableWebNotify, disableWebNotify, showWebNotification,
} from "@/lib/web-notify";
import {
  webPushSupported, isWebPushSubscribed, subscribeWebPush, unsubscribeWebPush,
} from "@/lib/web-push-client";

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const SEVERITY_CONFIG = {
  CRITICAL: { color: "text-rose-400", bg: "bg-rose-500/10", icon: AlertTriangle },
  HIGH: { color: "text-orange-400", bg: "bg-orange-500/10", icon: AlertTriangle },
  MEDIUM: { color: "text-amber-400", bg: "bg-amber-500/10", icon: TrendingDown },
  LOW: { color: "text-indigo-400", bg: "bg-indigo-500/10", icon: Info },
};

function timeAgo(iso: string, nowLabel: string, daySuffix: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return nowLabel;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}${daySuffix}`;
}

export function NotificationDropdown() {
  const t = useTranslations("notifDropdown");
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  // Notificări native de browser (Notification API) — opt-in
  const [webNotify, setWebNotify] = React.useState(false);

  const [busyNotify, setBusyNotify] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      // Activ dacă permisiunea e dată ȘI (abonat push SAU preferința locală ON)
      const pushOn = webPushSupported() ? await isWebPushSubscribed() : false;
      setWebNotify(webNotifyEnabled() || pushOn);
    })();
  }, []);

  async function toggleWebNotify() {
    if (busyNotify) return;
    setBusyNotify(true);
    try {
      if (webNotify) {
        disableWebNotify();
        await unsubscribeWebPush();
        setWebNotify(false);
      } else {
        if (webNotifyDenied()) {
          toast({ title: t("webNotifyDeniedT"), description: t("webNotifyDeniedD"), variant: "destructive" });
          return;
        }
        // 1) Notificări în browser (toast + OS pe alt tab)
        const okLocal = await enableWebNotify();
        // 2) Web Push real — notificări chiar cu browserul închis
        const okPush = webPushSupported() ? await subscribeWebPush() : false;
        const ok = okLocal || okPush;
        setWebNotify(ok);
        if (ok) {
          if (okPush) {
            // Confirmarea vine ca notificare REALĂ prin service worker (dovadă live)
            await fetch("/api/push/web/test", { method: "POST" }).catch(() => {});
          } else {
            showWebNotification("TradeGx", t("webNotifyTest"));
          }
        }
      }
    } finally {
      setBusyNotify(false);
    }
  }

  // ID-urile alertelor deja văzute — pentru a detecta alerte noi (toast live)
  const knownIds = React.useRef<Set<string>>(new Set());
  const initialized = React.useRef(false);

  const fetchAlerts = React.useCallback(async (notify = false) => {
    setLoading(true);
    try {
      const res = await fetch("/api/alerts", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const list: Alert[] = data.alerts ?? [];
        setAlerts(list);
        setUnreadCount(data.unreadCount ?? 0);

        // Detectează alerte noi (apărute de la ultima verificare)
        if (notify && initialized.current) {
          const fresh = list.filter((a) => !a.isRead && !knownIds.current.has(a.id));
          if (fresh.length > 0) {
            const top = fresh[0];
            const desc = fresh.length > 1 ? `${top.message} · +${fresh.length - 1}` : top.message;
            if (document.visibilityState === "visible") {
              // Pe site → toast (ca înainte)
              toast({
                title: top.title,
                description: desc,
                variant: top.severity === "CRITICAL" || top.severity === "HIGH" ? "destructive" : "default",
              });
            } else {
              // Pe alt tab/fereastră → notificare de sistem
              showWebNotification(top.title, desc);
            }
          }
        }
        // Reține toate ID-urile curente
        knownIds.current = new Set(list.map((a) => a.id));
        initialized.current = true;
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchAlerts(false); // prima încărcare — fără toast (doar baseline)

    // Polling: 25s cu tab-ul vizibil; 90s în fundal DACĂ notificările de
    // browser sunt active (altfel se oprește complet, ca înainte).
    let id: ReturnType<typeof setInterval> | null = null;
    const start = (ms: number) => {
      if (id) clearInterval(id);
      id = setInterval(() => fetchAlerts(true), ms);
    };
    const stop = () => {
      if (id) { clearInterval(id); id = null; }
    };

    start(25_000);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchAlerts(true);
        start(25_000);
      } else if (webNotifyEnabled()) {
        start(90_000); // fundal: mai rar, dar viu → notificări de sistem
      } else {
        stop();
      }
    };
    const onFocus = () => fetchAlerts(true);

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchAlerts]);

  async function markAllRead() {
    await fetch("/api/alerts", { method: "PATCH" });
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    setUnreadCount(0);
  }

  // La deschiderea panoului: golește badge-ul instant + persistă „citit" pe
  // server (altfel reapăreau necitite la navigare/refresh). Punctele albastre
  // de pe fiecare notificare RĂMÂN pentru sesiunea curentă, ca să vezi ce era
  // nou; la următoarea deschidere apar toate ca citite.
  const markingSeen = React.useRef(false);
  async function openAndMarkSeen() {
    await fetchAlerts();
    if (markingSeen.current) return;
    markingSeen.current = true;
    setUnreadCount(0);
    try {
      await fetch("/api/alerts", { method: "PATCH", cache: "no-store" });
    } catch {
      /* best-effort */
    } finally {
      markingSeen.current = false;
    }
  }

  async function dismissAlert(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  async function markRead(alertId: string) {
    const alert = alerts.find((a) => a.id === alertId);
    if (!alert || alert.isRead) return;
    await fetch(`/api/alerts/${alertId}`, { method: "PATCH" });
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  return (
    <DropdownMenu open={open} onOpenChange={(v) => { setOpen(v); if (v) openAndMarkSeen(); }}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 relative"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full bg-indigo-500 text-[9px] font-bold text-white flex items-center justify-center px-0.5">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 bg-zinc-900/95 border-zinc-800/80 backdrop-blur-xl p-0 shadow-2xl shadow-black/40"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-zinc-100">{t("title")}</p>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-full">
                {unreadCount} {t("newSuffix")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {t("markAllRead")}
              </button>
            )}
            {webNotifySupported() && (
              <button
                onClick={toggleWebNotify}
                disabled={busyNotify}
                title={webNotify ? t("webNotifyOn") : t("webNotifyOff")}
                className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-wait",
                  webNotify
                    ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20"
                    : "text-zinc-600 border-zinc-700/70 hover:text-zinc-400 hover:border-zinc-600"
                )}
              >
                {webNotify ? <BellRing className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="max-h-[360px] overflow-y-auto">
          {loading && alerts.length === 0 ? (
            <div className="py-8 text-center text-zinc-600 text-xs">{t("loading")}</div>
          ) : alerts.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mx-auto mb-3">
                <Zap className="h-5 w-5 text-zinc-600" />
              </div>
              <p className="text-sm font-semibold text-zinc-500">{t("empty")}</p>
              <p className="text-xs text-zinc-600 mt-0.5">{t("emptyHint")}</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const cfg = SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.LOW;
              const Icon = cfg.icon;
              return (
                <div
                  key={alert.id}
                  onClick={() => markRead(alert.id)}
                  className={cn(
                    "flex gap-3 px-4 py-3 border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-800/40 transition-colors relative group",
                    !alert.isRead && "bg-zinc-800/20"
                  )}
                >
                  {!alert.isRead && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-indigo-500" />
                  )}
                  <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
                    <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-200 truncate">{alert.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{alert.message}</p>
                    <p className="text-[10px] text-zinc-600 mt-1">{timeAgo(alert.createdAt, t("now"), t("daySuffix"))}</p>
                  </div>
                  <button
                    onClick={(e) => dismissAlert(alert.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-zinc-400 transition-opacity shrink-0 mt-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
