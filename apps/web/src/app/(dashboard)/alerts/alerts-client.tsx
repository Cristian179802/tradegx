"use client";

import { useState, useTransition } from "react";
import {
  BellRing, AlertTriangle, TrendingDown, Flame, Shield,
  Activity, BarChart2, CheckCircle2, Clock, Brain,
  Loader2, Zap, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AlertRecord {
  id: string;
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AlertSettings {
  OVERTRADING: boolean;
  REVENGE_TRADING: boolean;
  RISK_EXCEEDED: boolean;
  DAILY_LOSS_LIMIT: boolean;
  FOMO: boolean;
  STREAK_ALERT: boolean;
  NEWS_IMPACT: boolean;
  DRAWDOWN_ALERT: boolean;
}

interface AlertsClientProps {
  alerts: AlertRecord[];
  settings: AlertSettings;
}

const ALERT_CONFIG: Record<keyof AlertSettings, {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  color: string;
  bg: string;
  borderActive: string;
}> = {
  OVERTRADING: {
    icon: Activity,
    title: "Supratranzacționare",
    desc: "Alertă când depășești numărul maxim de tranzacții pe zi sau sesiune.",
    color: "text-amber-400",
    bg: "bg-amber-500/8 border-amber-500/20",
    borderActive: "border-amber-500/30",
  },
  REVENGE_TRADING: {
    icon: Flame,
    title: "Revenge Trading",
    desc: "Detectare automată când intri în tranzacții emoționale după o pierdere.",
    color: "text-rose-400",
    bg: "bg-rose-500/8 border-rose-500/20",
    borderActive: "border-rose-500/30",
  },
  RISK_EXCEEDED: {
    icon: Shield,
    title: "Risc Depășit",
    desc: "Alertă când riscul pe tranzacție depășește procentul tău maxim setat.",
    color: "text-orange-400",
    bg: "bg-orange-500/8 border-orange-500/20",
    borderActive: "border-orange-500/30",
  },
  DAILY_LOSS_LIMIT: {
    icon: TrendingDown,
    title: "Limită Pierdere Zilnică",
    desc: "Notificare când pierderile zilei ating limita ta sau limita prop firm.",
    color: "text-rose-400",
    bg: "bg-rose-500/8 border-rose-500/20",
    borderActive: "border-rose-500/30",
  },
  FOMO: {
    icon: AlertTriangle,
    title: "FOMO Detection",
    desc: "Alertă când intri în tranzacții după mișcări mari fără un setup valid.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/8 border-yellow-500/20",
    borderActive: "border-yellow-500/30",
  },
  STREAK_ALERT: {
    icon: BarChart2,
    title: "Serie Pierderi",
    desc: "Notificare după 3+ pierderi consecutive pentru a lua o pauză.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/8 border-indigo-500/20",
    borderActive: "border-indigo-500/30",
  },
  NEWS_IMPACT: {
    icon: BellRing,
    title: "Știri HIGH Impact",
    desc: "Alertă cu 30 minute înainte de evenimentele economice de impact major.",
    color: "text-violet-400",
    bg: "bg-violet-500/8 border-violet-500/20",
    borderActive: "border-violet-500/30",
  },
  DRAWDOWN_ALERT: {
    icon: TrendingDown,
    title: "Alertă Drawdown",
    desc: "Notificare când drawdown-ul contului depășește pragul setat.",
    color: "text-red-400",
    bg: "bg-red-500/8 border-red-500/20",
    borderActive: "border-red-500/30",
  },
};

const SEVERITY_CONFIG: Record<string, { label: string; cls: string; dot: string; glow?: string }> = {
  LOW:      { label: "Scăzut",  cls: "text-zinc-400 bg-zinc-800/80 border-zinc-700",           dot: "bg-zinc-500" },
  MEDIUM:   { label: "Mediu",   cls: "text-amber-400 bg-amber-500/10 border-amber-500/25",     dot: "bg-amber-400", glow: "shadow-[0_0_8px_rgba(245,158,11,0.4)]" },
  HIGH:     { label: "Ridicat", cls: "text-rose-400 bg-rose-500/10 border-rose-500/25",        dot: "bg-rose-400",  glow: "shadow-[0_0_8px_rgba(244,63,94,0.4)]" },
  CRITICAL: { label: "Critic",  cls: "text-red-300 bg-red-500/15 border-red-500/30",           dot: "bg-red-400",   glow: "shadow-[0_0_12px_rgba(239,68,68,0.6)]" },
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("ro-RO", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function Toggle({ checked, onChange, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30",
        checked ? "bg-indigo-600 shadow-lg shadow-indigo-500/30" : "bg-zinc-700",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span className={cn(
        "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300",
        checked ? "translate-x-5" : "translate-x-0"
      )} />
    </button>
  );
}

export function AlertsClient({ alerts, settings: initialSettings }: AlertsClientProps) {
  const [settings, setSettings] = useState<AlertSettings>(initialSettings);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [localAlerts, setLocalAlerts] = useState(alerts);
  const [markingAll, setMarkingAll] = useState(false);

  const unread = localAlerts.filter((a) => !a.isRead).length;
  const activeCount = Object.values(settings).filter(Boolean).length;

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await fetch("/api/alerts", { method: "PATCH" });
      setLocalAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    } catch { /* silent */ }
    setMarkingAll(false);
  }

  function handleToggle(key: keyof AlertSettings, value: boolean) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await fetch("/api/user/alert-settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch { /* silent */ }
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black neon-amber tracking-tight">Alerte AI</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Protecție inteligentă împotriva greșelilor de trading.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <div className="flex items-center gap-2 bg-rose-500/8 border border-rose-500/20 rounded-xl px-3 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              <span className="text-xs font-semibold text-rose-300">{unread} necitite</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isPending}
            className={cn(
              "flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200",
              saved
                ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-300"
                : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25",
              isPending && "opacity-60"
            )}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            {saved ? "Salvat!" : "Salvează Setările"}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Alerte active", value: `${activeCount}/${Object.keys(settings).length}`, color: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/15" },
          { label: "Necitite", value: unread, color: unread > 0 ? "text-rose-400" : "text-zinc-400", bg: unread > 0 ? "bg-rose-500/8 border-rose-500/15" : "bg-zinc-800/40 border-zinc-700/40" },
          { label: "Total primite", value: localAlerts.length, color: "text-zinc-300", bg: "bg-zinc-800/40 border-zinc-700/40" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn("rounded-xl border p-3.5 text-center", bg)}>
            <p className={cn("text-xl font-black", color)}>{value}</p>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Settings panel */}
        <div className="lg:col-span-2 space-y-2.5">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-bold text-zinc-300">Configurare Alerte Inteligente</h2>
          </div>

          {(Object.keys(ALERT_CONFIG) as (keyof AlertSettings)[]).map((key) => {
            const config = ALERT_CONFIG[key];
            const Icon = config.icon;
            const enabled = settings[key];

            return (
              <div
                key={key}
                className={cn(
                  "card-3d flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200",
                  enabled
                    ? `bg-zinc-900/80 ${config.borderActive}`
                    : "bg-zinc-900/40 border-zinc-800/50 opacity-60"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0",
                  config.bg
                )}>
                  <Icon className={cn("w-4 h-4", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-200">{config.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{config.desc}</p>
                </div>
                <Toggle
                  checked={enabled}
                  onChange={(v) => handleToggle(key, v)}
                />
              </div>
            );
          })}
        </div>

        {/* Right panel */}
        <div className="space-y-4">

          {/* AI Insight card */}
          <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 via-zinc-900/80 to-zinc-900 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-violet-300">AI Protection</p>
                <p className="text-[10px] text-zinc-600">Always On</p>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Activează toate alertele pentru protecție maximă. AI-ul monitorizează comportamentul
              tău de trading în timp real și te avertizează înainte să faci o greșeală costisitoare.
            </p>
            <div className="mt-3 pt-3 border-t border-violet-500/10">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-600">Protecție activă</span>
                <span className={cn(
                  "font-bold",
                  activeCount >= 6 ? "text-emerald-400" : activeCount >= 3 ? "text-amber-400" : "text-rose-400"
                )}>
                  {activeCount >= 6 ? "Maximă" : activeCount >= 3 ? "Medie" : "Scăzută"}
                </span>
              </div>
              <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    activeCount >= 6 ? "bg-emerald-500" : activeCount >= 3 ? "bg-amber-500" : "bg-rose-500"
                  )}
                  style={{ width: `${(activeCount / Object.keys(settings).length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Recent alerts */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Alerte Recente
              </h3>
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {markingAll ? "..." : "Marchează toate ca citite"}
                </button>
              )}
            </div>

            {localAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/8 border border-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500/60" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-zinc-500">Nicio alertă!</p>
                  <p className="text-xs text-zinc-700 mt-0.5">Trading perfect 🎯</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {localAlerts.slice(0, 8).map((alert) => {
                  const config = ALERT_CONFIG[alert.type as keyof AlertSettings];
                  const Icon = config?.icon ?? BellRing;
                  const sev = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.LOW;
                  const isCritical = alert.severity === "CRITICAL";

                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        "flex gap-3 p-3 rounded-xl border transition-all",
                        alert.isRead
                          ? "bg-zinc-900/30 border-zinc-800/40"
                          : "bg-zinc-800/50 border-zinc-700/60",
                        isCritical && !alert.isRead && "border-red-500/30"
                      )}
                    >
                      <div className="relative shrink-0 mt-0.5">
                        {isCritical && !alert.isRead && (
                          <span className="absolute inset-0 rounded-lg bg-red-500/30 animate-ping" />
                        )}
                        <div className={cn(
                          "relative w-7 h-7 rounded-lg border flex items-center justify-center",
                          config?.bg ?? "bg-zinc-800 border-zinc-700"
                        )}>
                          <Icon className={cn("w-3.5 h-3.5", config?.color ?? "text-zinc-400")} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className={cn(
                            "text-[11px] font-semibold truncate",
                            alert.isRead ? "text-zinc-500" : "text-zinc-200"
                          )}>
                            {alert.title}
                          </p>
                          <span className={cn(
                            "text-[9px] font-bold border rounded-full px-1.5 py-0.5 flex items-center gap-1 shrink-0",
                            sev.cls,
                            sev.glow
                          )}>
                            <span className={cn("w-1 h-1 rounded-full", sev.dot)} />
                            {sev.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-600 truncate">{alert.message}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-2.5 h-2.5 text-zinc-700" />
                          <span className="text-[9px] text-zinc-700">{fmtTime(alert.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
