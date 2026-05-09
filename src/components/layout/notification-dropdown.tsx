"use client";

import * as React from "react";
import { Bell, CheckCheck, AlertTriangle, TrendingDown, Zap, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "acum";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}z`;
}

export function NotificationDropdown() {
  const [open, setOpen] = React.useState(false);
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  async function fetchAlerts() {
    setLoading(true);
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 60_000);
    return () => clearInterval(id);
  }, []);

  async function markAllRead() {
    await fetch("/api/alerts", { method: "PATCH" });
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    setUnreadCount(0);
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
    <DropdownMenu open={open} onOpenChange={(v) => { setOpen(v); if (v) fetchAlerts(); }}>
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
        className="w-80 bg-zinc-900 border-zinc-800 p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-zinc-100">Notificări</p>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-full">
                {unreadCount} noi
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Citește tot
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[360px] overflow-y-auto">
          {loading && alerts.length === 0 ? (
            <div className="py-8 text-center text-zinc-600 text-xs">Se încarcă...</div>
          ) : alerts.length === 0 ? (
            <div className="py-10 text-center">
              <Zap className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">Nicio notificare</p>
              <p className="text-xs text-zinc-600 mt-0.5">Vei fi alertat când apar probleme</p>
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
                    <p className="text-[10px] text-zinc-600 mt-1">{timeAgo(alert.createdAt)}</p>
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
