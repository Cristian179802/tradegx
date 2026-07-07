"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { Loader2, Save, Send, Check, Trash2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// ── Secțiune conectare Telegram ───────────────────────────────────────────────
function TelegramSection() {
  const t = useTranslations("settings.notifications");
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [maskedChatId, setMaskedChatId] = useState<string | null>(null);
  const [botConfigured, setBotConfigured] = useState(true);
  const [chatId, setChatId] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/user/telegram")
      .then((r) => r.json())
      .then((d) => {
        setConnected(!!d.connected);
        setMaskedChatId(d.maskedChatId ?? null);
        setBotConfigured(d.botConfigured !== false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    setLoading(true);
  }, []);

  async function connect() {
    if (!chatId.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/user/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: chatId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("errFallback"));
      setConnected(true);
      setMaskedChatId(data.maskedChatId);
      setChatId("");
      toast({ title: t("connectedTitle"), description: t("connectedDesc") });
    } catch (e: any) {
      toast({ title: t("connectFailTitle"), description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      await fetch("/api/user/telegram", { method: "DELETE" });
      setConnected(false);
      setMaskedChatId(null);
      toast({ title: t("disconnectedTitle") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <CardTitle className="text-zinc-100 text-base">{t("cardTitle")}</CardTitle>
            <CardDescription className="text-xs text-zinc-500 mt-0.5">
              {t("cardDesc")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-10 rounded-lg bg-zinc-800/60 animate-pulse" />
        ) : !botConfigured ? (
          <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            {t("botNotConfigured")}
          </p>
        ) : connected ? (
          <div className="flex items-center justify-between gap-3 bg-zinc-800/40 border border-zinc-700/50 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200">{t("connectedLabel")}</p>
                <p className="text-xs text-zinc-500 font-mono">{t("chatIdLabel", { id: maskedChatId ?? "" })}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={disconnect}
              disabled={busy}
              className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
              {t("disconnect")}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <ol className="text-xs text-zinc-500 space-y-1 list-decimal list-inside">
              <li>{t.rich("step1", { b: (c) => <span className="text-sky-400 font-semibold">{c}</span> })}</li>
              <li>{t.rich("step2", { b: (c) => <span className="text-zinc-300 font-semibold">{c}</span> })}</li>
              <li>{t("step3")}</li>
            </ol>
            <div className="flex items-center gap-2">
              <Input
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder={t("chatIdPlaceholder")}
                className="bg-zinc-800/60 border-zinc-700 text-zinc-200"
                inputMode="numeric"
              />
              <Button
                onClick={connect}
                disabled={busy || !chatId.trim()}
                className="bg-sky-600 hover:bg-sky-500 text-white shrink-0"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Send className="w-4 h-4 mr-1.5" />}
                {t("connect")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface NotificationSetting {
  key: string;
  label: string;
  description: string;
  group: string;
}

// label/description/group = chei → settings.notifications.* (traduse la randare)
const NOTIFICATION_SETTINGS: NotificationSetting[] = [
  { key: "overtrading",        label: "nOvertrading",       description: "nOvertradingD",       group: "grpAiCoach" },
  { key: "revenge_trading",    label: "nRevenge",           description: "nRevengeD",           group: "grpAiCoach" },
  { key: "fomo",               label: "nFomo",              description: "nFomoD",              group: "grpAiCoach" },
  { key: "risk_exceeded",      label: "nRiskExceeded",      description: "nRiskExceededD",      group: "grpAiCoach" },
  { key: "daily_loss_limit",   label: "nDailyLoss",         description: "nDailyLossD",         group: "grpPropFirm" },
  { key: "news_impact",        label: "nNewsImpact",        description: "nNewsImpactD",        group: "grpPropFirm" },
  { key: "friday_trading",     label: "nFridayTrading",     description: "nFridayTradingD",     group: "grpPersonal" },
  { key: "monday_restriction", label: "nMondayRestriction", description: "nMondayRestrictionD", group: "grpPersonal" },
  { key: "daily_review",       label: "nDailyReview",       description: "nDailyReviewD",       group: "grpSummaries" },
  { key: "weekly_review",      label: "nWeeklyReview",      description: "nWeeklyReviewD",       group: "grpSummaries" },
];

const GROUPS = [...new Set(NOTIFICATION_SETTINGS.map((s) => s.group))];

export function NotificationsTab() {
  const t = useTranslations("settings.notifications");
  const { toast } = useToast();
  const defaults = Object.fromEntries(NOTIFICATION_SETTINGS.map((s) => [s.key, true]));
  const [settings, setSettings] = useState<Record<string, boolean>>(defaults);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  useEffect(() => {
    fetch("/api/user/notifications")
      .then((r) => r.json())
      .then((data: Record<string, boolean>) => {
        if (data && typeof data === "object" && Object.keys(data).length > 0) {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPrefs(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(key: string) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: settings }),
      });
      if (!res.ok) throw new Error();
      toast({ title: t("savedTitle"), description: t("savedDesc") });
    } catch {
      toast({ title: t("errTitle"), description: t("errDesc"), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  if (loadingPrefs) {
    return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-lg bg-zinc-800 animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <TelegramSection />

      {GROUPS.map((group) => (
        <Card key={group} className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-zinc-100 text-base">{t(group)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {NOTIFICATION_SETTINGS.filter((s) => s.group === group).map((setting) => (
              <div
                key={setting.key}
                className="flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-0"
              >
                <div className="flex-1 mr-4">
                  <p className="text-sm font-medium text-zinc-200">{t(setting.label)}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{t(setting.description)}</p>
                </div>
                <Switch
                  checked={settings[setting.key] ?? true}
                  onCheckedChange={() => toggle(setting.key)}
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Button
        onClick={handleSave}
        disabled={isLoading}
        className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        {t("save")}
      </Button>
    </div>
  );
}
