"use client";

import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface NotificationSetting {
  key: string;
  label: string;
  description: string;
  group: string;
}

const NOTIFICATION_SETTINGS: NotificationSetting[] = [
  // AI Coach alerts
  {
    key: "overtrading",
    label: "Supratranzacționare",
    description: "Alertă când depășești limita de tranzacții zilnice",
    group: "AI Coach",
  },
  {
    key: "revenge_trading",
    label: "Tranzacții din răzbunare",
    description: "Alertă când deschizi o tranzacție la scurt timp după o pierdere",
    group: "AI Coach",
  },
  {
    key: "fomo",
    label: "FOMO",
    description: "Alertă când intri prea târziu față de zona de setup",
    group: "AI Coach",
  },
  {
    key: "risk_exceeded",
    label: "Risc depășit",
    description: "Alertă când dimensiunea poziției depășește riscul configurat",
    group: "AI Coach",
  },
  {
    key: "daily_loss_limit",
    label: "Limită pierdere zilnică",
    description: "Alertă la 80%, 95% și 100% din limita zilnică",
    group: "Prop Firm",
  },
  {
    key: "news_impact",
    label: "Impact știri",
    description: "Alertă la 15 min înaintea știrilor de mare impact",
    group: "Prop Firm",
  },
  {
    key: "friday_trading",
    label: "Tranzacționare vineri",
    description: "Alertă la tentative de tranzacționare vineri",
    group: "Reguli personale",
  },
  {
    key: "monday_restriction",
    label: "Luni înainte de 13:00",
    description: "Alertă la tentative de tranzacționare luni dimineața",
    group: "Reguli personale",
  },
  // Summaries
  {
    key: "daily_review",
    label: "Revizuire zilnică AI",
    description: "Rezumat zilnic cu scor disciplină și observații",
    group: "Rezumate",
  },
  {
    key: "weekly_review",
    label: "Revizuire săptămânală",
    description: "Analiza săptămânii cu sugestii de îmbunătățire",
    group: "Rezumate",
  },
];

const GROUPS = [...new Set(NOTIFICATION_SETTINGS.map((s) => s.group))];

export function NotificationsTab() {
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
      toast({ title: "Salvat", description: "Preferințele de notificări au fost actualizate." });
    } catch {
      toast({ title: "Eroare", description: "Nu s-a putut salva.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  if (loadingPrefs) {
    return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-lg bg-zinc-800 animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {GROUPS.map((group) => (
        <Card key={group} className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-zinc-100 text-base">{group}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {NOTIFICATION_SETTINGS.filter((s) => s.group === group).map((setting) => (
              <div
                key={setting.key}
                className="flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-0"
              >
                <div className="flex-1 mr-4">
                  <p className="text-sm font-medium text-zinc-200">{setting.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{setting.description}</p>
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
        className="bg-indigo-600 hover:bg-indigo-500 text-white"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        Salvează notificările
      </Button>
    </div>
  );
}
