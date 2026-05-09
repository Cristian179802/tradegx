"use client";

import React, { useState, useEffect, useRef } from "react";
import { Globe, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Data ─────────────────────────────────────────────────────────────────────

const TIMEZONES = [
  { label: "București",    value: "Europe/Bucharest",       flag: "🇷🇴", offset: "UTC+3" },
  { label: "Londra",       value: "Europe/London",          flag: "🇬🇧", offset: "UTC+1" },
  { label: "Paris",        value: "Europe/Paris",           flag: "🇫🇷", offset: "UTC+2" },
  { label: "Berlin",       value: "Europe/Berlin",          flag: "🇩🇪", offset: "UTC+2" },
  { label: "Madrid",       value: "Europe/Madrid",          flag: "🇪🇸", offset: "UTC+2" },
  { label: "Roma",         value: "Europe/Rome",            flag: "🇮🇹", offset: "UTC+2" },
  { label: "Amsterdam",    value: "Europe/Amsterdam",       flag: "🇳🇱", offset: "UTC+2" },
  { label: "Moscova",      value: "Europe/Moscow",          flag: "🇷🇺", offset: "UTC+3" },
  { label: "Istanbul",     value: "Europe/Istanbul",        flag: "🇹🇷", offset: "UTC+3" },
  { label: "Dubai",        value: "Asia/Dubai",             flag: "🇦🇪", offset: "UTC+4" },
  { label: "Mumbai",       value: "Asia/Kolkata",           flag: "🇮🇳", offset: "UTC+5:30" },
  { label: "Bangkok",      value: "Asia/Bangkok",           flag: "🇹🇭", offset: "UTC+7" },
  { label: "Singapore",    value: "Asia/Singapore",         flag: "🇸🇬", offset: "UTC+8" },
  { label: "Hong Kong",    value: "Asia/Hong_Kong",         flag: "🇭🇰", offset: "UTC+8" },
  { label: "Tokyo",        value: "Asia/Tokyo",             flag: "🇯🇵", offset: "UTC+9" },
  { label: "Sydney",       value: "Australia/Sydney",       flag: "🇦🇺", offset: "UTC+10" },
  { label: "New York",     value: "America/New_York",       flag: "🇺🇸", offset: "UTC-4" },
  { label: "Chicago",      value: "America/Chicago",        flag: "🇺🇸", offset: "UTC-5" },
  { label: "Los Angeles",  value: "America/Los_Angeles",    flag: "🇺🇸", offset: "UTC-7" },
  { label: "São Paulo",    value: "America/Sao_Paulo",      flag: "🇧🇷", offset: "UTC-3" },
  { label: "Toronto",      value: "America/Toronto",        flag: "🇨🇦", offset: "UTC-4" },
];

const LANGUAGES = [
  { label: "Română",    value: "ro", flag: "🇷🇴" },
  { label: "English",   value: "en", flag: "🇬🇧" },
  { label: "Español",   value: "es", flag: "🇪🇸" },
  { label: "Deutsch",   value: "de", flag: "🇩🇪" },
  { label: "Français",  value: "fr", flag: "🇫🇷" },
  { label: "Italiano",  value: "it", flag: "🇮🇹" },
];

const LS_TZ   = "TradeGX_timezone";
const LS_LANG = "TradeGX_language";

// ─── Component ────────────────────────────────────────────────────────────────

export function LocaleWidget() {
  const [timezone, setTimezone]   = useState("Europe/Bucharest");
  const [language, setLanguage]   = useState("ro");
  const [timeStr, setTimeStr]     = useState("");
  const [open, setOpen]           = useState(false);
  const [tab, setTab]             = useState<"tz" | "lang">("tz");
  const [tzSearch, setTzSearch]   = useState("");
  const popoverRef                = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedTz   = localStorage.getItem(LS_TZ);
    const savedLang = localStorage.getItem(LS_LANG);
    if (savedTz)   setTimezone(savedTz);
    if (savedLang) setLanguage(savedLang);
  }, []);

  // Live clock — updates every second
  useEffect(() => {
    function tick() {
      setTimeStr(
        new Intl.DateTimeFormat("ro-RO", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date())
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timezone]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function selectTimezone(tz: string) {
    setTimezone(tz);
    localStorage.setItem(LS_TZ, tz);
  }

  function selectLanguage(lang: string) {
    setLanguage(lang);
    localStorage.setItem(LS_LANG, lang);
  }

  const currentTz   = TIMEZONES.find((t) => t.value === timezone);
  const currentLang = LANGUAGES.find((l) => l.value === language);
  const filteredTz  = TIMEZONES.filter((t) =>
    t.label.toLowerCase().includes(tzSearch.toLowerCase())
  );

  return (
    <div ref={popoverRef} className="fixed bottom-5 right-5 z-50">
      {/* ── Floating pill ─────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-full border text-xs font-semibold shadow-xl transition-all select-none",
          open
            ? "bg-zinc-800 border-zinc-600 text-zinc-100"
            : "bg-zinc-900/95 border-zinc-700/80 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 backdrop-blur-sm"
        )}
      >
        <span className="text-sm leading-none">{currentTz?.flag ?? "🌍"}</span>
        <span className="font-mono tabular-nums tracking-wide">{timeStr || "──:──:──"}</span>
        <span className="text-zinc-600 text-[10px] ml-0.5">{currentLang?.flag}</span>
      </button>

      {/* ── Popover ───────────────────────────────────────── */}
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-72 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-3.5 pb-2.5 border-b border-zinc-800">
            <p className="text-xs font-bold text-zinc-200">Preferințe locale</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">Fusul orar și limba afișate</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-zinc-800">
            <button
              onClick={() => setTab("tz")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 transition-colors",
                tab === "tz"
                  ? "text-indigo-400 bg-indigo-500/8 border-b-2 border-indigo-500"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              Fus orar
            </button>
            <button
              onClick={() => setTab("lang")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 transition-colors",
                tab === "lang"
                  ? "text-indigo-400 bg-indigo-500/8 border-b-2 border-indigo-500"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Globe className="h-3.5 w-3.5" />
              Limbă
            </button>
          </div>

          {/* Timezone tab */}
          {tab === "tz" && (
            <div>
              {/* Search */}
              <div className="px-3 pt-2.5 pb-1.5">
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Caută oraș..."
                  value={tzSearch}
                  onChange={(e) => setTzSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-56 overflow-y-auto pb-1">
                {filteredTz.map((tz) => (
                  <button
                    key={tz.value}
                    onClick={() => { selectTimezone(tz.value); setTzSearch(""); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-xs transition-colors",
                      timezone === tz.value
                        ? "bg-indigo-500/10 text-indigo-300"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    )}
                  >
                    <span className="text-base leading-none">{tz.flag}</span>
                    <span className="flex-1 font-medium text-left">{tz.label}</span>
                    <span className="text-[10px] font-mono text-zinc-600">{tz.offset}</span>
                    {timezone === tz.value && (
                      <Check className="h-3 w-3 text-indigo-400 shrink-0" />
                    )}
                  </button>
                ))}
                {filteredTz.length === 0 && (
                  <p className="text-center text-[11px] text-zinc-600 py-6">Niciun rezultat</p>
                )}
              </div>
            </div>
          )}

          {/* Language tab */}
          {tab === "lang" && (
            <div className="p-3 grid grid-cols-2 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => selectLanguage(lang.value)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all",
                    language === lang.value
                      ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-200"
                      : "border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  )}
                >
                  <span className="text-base leading-none">{lang.flag}</span>
                  <span>{lang.label}</span>
                  {language === lang.value && (
                    <Check className="h-3 w-3 text-indigo-400 ml-auto shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Current selection footer */}
          <div className="border-t border-zinc-800 px-4 py-2.5 flex items-center justify-between">
            <span className="text-[10px] text-zinc-600">
              {currentTz?.flag} {currentTz?.label} · {currentTz?.offset}
            </span>
            <span className="text-[10px] text-zinc-600">
              {currentLang?.flag} {currentLang?.label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
