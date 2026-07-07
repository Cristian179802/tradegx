"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Check, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { value: "RO", label: "Română" },
  { value: "EN", label: "English" },
  { value: "ES", label: "Español" },
  { value: "DE", label: "Deutsch" },
  { value: "FR", label: "Français" },
  { value: "IT", label: "Italiano" },
];

// label = cheie → settings.appearance.* (tradusă la randare)
const CURRENCIES = [
  { value: "USD", label: "curUSD" },
  { value: "EUR", label: "curEUR" },
  { value: "GBP", label: "curGBP" },
  { value: "RON", label: "curRON" },
  { value: "CHF", label: "curCHF" },
  { value: "JPY", label: "curJPY" },
];

// label/desc = chei → settings.appearance.* (traduse la randare)
const THEMES = [
  {
    value: "DARK",
    label: "thDark",
    desc: "thDarkDesc",
    preview: "bg-zinc-950 border-zinc-800",
    dot: "bg-zinc-700",
  },
  {
    value: "LIGHT",
    label: "thLight",
    desc: "thLightDesc",
    preview: "bg-zinc-100 border-zinc-300",
    dot: "bg-zinc-300",
  },
  {
    value: "AMOLED",
    label: "thAmoled",
    desc: "thAmoledDesc",
    preview: "bg-black border-zinc-900",
    dot: "bg-zinc-900",
  },
];

const TIMEZONES = [
  "Europe/Bucharest",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Asia/Dubai",
  "Australia/Sydney",
];

interface AppearanceTabProps {
  initialLanguage?: string;
  initialCurrency?: string;
  initialTheme?: string;
  initialTimezone?: string;
}

const THEME_MAP: Record<string, string> = { DARK: "dark", LIGHT: "light", AMOLED: "amoled" };
const THEME_MAP_REVERSE: Record<string, string> = { dark: "DARK", light: "LIGHT", amoled: "AMOLED" };

export function AppearanceTab({
  initialLanguage = "RO",
  initialCurrency = "USD",
  initialTheme = "DARK",
  initialTimezone = "Europe/Bucharest",
}: AppearanceTabProps) {
  const t = useTranslations("settings.appearance");
  const { toast } = useToast();
  const { theme: activeTheme, setTheme: applyTheme } = useTheme();
  const [language, setLanguage] = useState(initialLanguage);
  const [currency, setCurrency] = useState(initialCurrency);
  const [theme, setTheme] = useState(initialTheme);
  const [timezone, setTimezone] = useState(initialTimezone);

  // Sync next-themes with the DB-loaded initial theme on mount
  useEffect(() => {
    applyTheme(THEME_MAP[initialTheme] ?? "dark");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleThemeChange(newTheme: string) {
    setTheme(newTheme);
    applyTheme(THEME_MAP[newTheme] ?? "dark");
  }
  const [isLoading, setIsLoading] = useState(false);

  async function handleSave() {
    setIsLoading(true);
    try {
      // Ensure we're using the currently active next-themes value mapped back to DB enum
      const dbTheme = THEME_MAP_REVERSE[activeTheme ?? "dark"] ?? theme;
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, currency, theme: dbTheme, timezone }),
      });

      if (!res.ok) throw new Error();
      toast({ title: t("savedTitle"), description: t("savedDesc") });
    } catch {
      toast({ title: t("errTitle"), description: t("errDesc"), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Language & Currency */}
      <Card className="bg-zinc-900/80 border-zinc-800/80 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-base">{t("langCardTitle")}</CardTitle>
          <CardDescription className="text-zinc-500">
            {t("langCardDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm text-zinc-300">{t("language")}</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value} className="text-zinc-300 focus:text-white focus:bg-zinc-800">
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-zinc-300">{t("currency")}</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="text-zinc-300 focus:text-white focus:bg-zinc-800">
                      {t(c.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm text-zinc-300">{t("timezone")}</label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz} className="text-zinc-300 focus:text-white focus:bg-zinc-800">
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="bg-zinc-900/80 border-zinc-800/80 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-base">{t("themeTitle")}</CardTitle>
          <CardDescription className="text-zinc-500">
            {t("themeDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {THEMES.map((th) => (
              <button
                key={th.value}
                type="button"
                onClick={() => handleThemeChange(th.value)}
                className={cn(
                  "relative rounded-xl border-2 p-4 text-left transition-all",
                  theme === th.value
                    ? "border-indigo-500 bg-indigo-500/5"
                    : "border-zinc-800 hover:border-zinc-700"
                )}
              >
                {theme === th.value && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className={`w-full h-10 rounded-lg border mb-3 ${th.preview}`}>
                  <div className="flex gap-1 p-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`h-2 rounded ${th.dot} opacity-60`} style={{ width: `${[30, 50, 20][i - 1]}%` }} />
                    ))}
                  </div>
                </div>
                <p className="text-sm font-medium text-zinc-200">{t(th.label)}</p>
                <p className="text-xs text-zinc-500">{t(th.desc)}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

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
