"use client";

import { useState, useTransition } from "react";
import {
  BellRing,
  AlertTriangle,
  TrendingDown,
  Flame,
  Shield,
  Activity,
  BarChart2,
  CheckCircle2,
  Clock,
  Brain,
  ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Config ───────────────────────────────────────────────────────────────────

const ALERT_CONFIG: Record<
  keyof AlertSettings,
  {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    desc: string;
    color: string;
    bg: string;
  }
> = {
  OVERTRADING: {
    icon: Activity,
    title: "Supratranzacționare",
    desc: "Alertă când depășești numărul maxim de tranzacții pe zi sau sesiune.",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  REVENGE_TRADING: {
    icon: Flame,
    title: "Revenge Trading",
    desc: "Detectare automată când intri în tranzacții emoționale după o pierdere.",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  RISK_EXCEEDED: {
    icon: Shield,
    title: "Risc Depășit",
    desc: "Alertă când riscul pe tranzacție depășește procentul tău maxim setat.",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
  DAILY_LOSS_LIMIT: {
    icon: TrendingDown,
    title: "Limită Pierdere Zilnică",
    desc: "Notificare când pierderile zilei ating limita ta sau limita prop firm.",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  FOMO: {
    icon: AlertTriangle,
    title: "FOMO Detection",
    desc: "Alertă când intri în tranzacții după mișcări mari fără un setup valid.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
  STREAK_ALERT: {
    icon: BarChart2,
    title: "Serie Pierderi",
    desc: "Notificare după 3+ pierderi consecutive pentru a lua o pauză.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  NEWS_IMPACT: {
    icon: BellRing,
    title: "Stiri HIGH Impact",
    desc: "Alertă cu 30 minute înainte de evenimentele economice de impact major.",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  DRAWDOWN_ALERT: {
    icon: TrendingDown,
    title: "Alertă Drawdown",
    desc: "Notificare când drawdown-ul contului depășește pragul setat.",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
};

const SEVERITY_STYLE: Record<string, string> = {
  LOW: "text-zinc-400 bg-zinc-800 border-zinc-700",
  MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  HIGH: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  CRITICAL: "text-red-400 bg-red-500/10 border-red-500/20",
};

const SEVERITY_LABEL: Record<string, string> = {
  LOW: "Scăzut",
  MEDIUM: "Mediu",
  HIGH: "Ridicat",
  CRITICAL: "Critic",
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("ro-RO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none ${
        checked ? "bg-indigo-600" : "bg-zinc-700"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AlertsClient({ alerts, settings: initialSettings }: AlertsClientProps) {
  const [settings, setSettings] = useState<AlertSettings>(initialSettings);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const unread = alerts.filter((a) => !a.isRead).length;

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
      } catch {
        // handle error silently for now
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Alerte AI</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Protecție inteligentă împotriva greșelilor de trading.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              <BellRing className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-xs font-semibold text-rose-300">{unread} necitite</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Salvat
              </>
            ) : (
              "Salvează Setările"
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel — 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-zinc-300">Configurare Alerte</h2>
          </div>

          {(Object.keys(ALERT_CONFIG) as (keyof AlertSettings)[]).map((key) => {
            const config = ALERT_CONFIG[key];
            const Icon = config.icon;
            const enabled = settings[key];

            return (
              <div
                key={key}
                className={`flex items-start gap-4 p-4 bg-zinc-900 border rounded-xl transition-all ${
                  enabled ? "border-zinc-700" : "border-zinc-800 opacity-60"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg border ${config.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">{config.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{config.desc}</p>
                    </div>
                    <Toggle
                      checked={enabled}
                      onChange={(v) => handleToggle(key, v)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              Statistici Alerte
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">Total primit</span>
                <span className="text-sm font-bold text-zinc-200">{alerts.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">Necitite</span>
                <span className={`text-sm font-bold ${unread > 0 ? "text-rose-400" : "text-zinc-400"}`}>
                  {unread}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">Setări active</span>
                <span className="text-sm font-bold text-emerald-400">
                  {Object.values(settings).filter(Boolean).length}/{Object.keys(settings).length}
                </span>
              </div>
            </div>
          </div>

          {/* AI Insight */}
          <div className="bg-gradient-to-br from-violet-950/40 via-zinc-900 to-zinc-900 border border-violet-800/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-semibold text-violet-300">AI Insight</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Activează toate alertele pentru protecție maximă. AI-ul monitorizează comportamentul
              tău de trading în timp real și te avertizează înainte să faci o greșeală costisitoare.
            </p>
          </div>

          {/* Recent Alerts */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              Alerte Recente
            </h3>
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
                <p className="text-xs text-zinc-600 text-center">
                  Nicio alertă. Trading perfect! 🎯
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {alerts.slice(0, 8).map((alert) => {
                  const config = ALERT_CONFIG[alert.type as keyof AlertSettings];
                  const Icon = config?.icon ?? BellRing;
                  return (
                    <div
                      key={alert.id}
                      className={`flex gap-3 p-3 rounded-lg border ${
                        alert.isRead
                          ? "bg-zinc-900/50 border-zinc-800/60"
                          : "bg-zinc-800/60 border-zinc-700"
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                          config?.color ?? "text-zinc-400"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className={`text-[11px] font-semibold ${alert.isRead ? "text-zinc-500" : "text-zinc-200"}`}>
                            {alert.title}
                          </p>
                          <span className={`text-[9px] font-bold border rounded px-1 py-0.5 ${SEVERITY_STYLE[alert.severity]}`}>
                            {SEVERITY_LABEL[alert.severity]}
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
