"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Ceas + fus orar ──────────────────────────────────────────────────────────
// Nota istorică: acest widget avea și un tab de „limbă" cu 6 opțiuni
// (ro/en/es/de/fr/it). Era o promisiune falsă: doar două limbi există traduse,
// iar selecția scria în localStorage o cheie pe care NIMIC nu o citea — deci
// alegeai „Deutsch", primeai bifă și nu se schimba nimic. Schimbarea reală de
// limbă se face prin cookie-ul `locale` din LanguageSwitcher (bara de sus).
// Tab-ul a fost scos; a rămas ceasul pe fus orar, care e real și util pentru
// urmărirea sesiunilor de piață.

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

// Cheia rămâne „TradeGX_timezone" (X mare) intenționat: e o cheie de
// localStorage deja scrisă la userii existenți — redenumirea le-ar pierde fusul.
const LS_TZ = "TradeGX_timezone";

export function LocaleWidget() {
  const t = useTranslations("localeWidget");
  const appLocale = useLocale();
  const cityOverrides = t.raw("cities") as Record<string, string>;
  const cityLabel = (tz: { value: string; label: string }) => cityOverrides[tz.value] ?? tz.label;
  const [timezone, setTimezone] = useState("Europe/Bucharest");
  const [timeStr, setTimeStr]   = useState("");
  const [open, setOpen]         = useState(false);
  const [tzSearch, setTzSearch] = useState("");
  const popoverRef              = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTz = localStorage.getItem(LS_TZ);
    if (savedTz) setTimezone(savedTz);
  }, []);

  // Ceas live — o dată pe secundă
  useEffect(() => {
    function tick() {
      setTimeStr(
        new Intl.DateTimeFormat(appLocale === "ro" ? "ro-RO" : "en-GB", {
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
  }, [timezone, appLocale]);

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

  const currentTz  = TIMEZONES.find((x) => x.value === timezone);
  const filteredTz = TIMEZONES.filter((tz) =>
    cityLabel(tz).toLowerCase().includes(tzSearch.toLowerCase()) ||
    tz.label.toLowerCase().includes(tzSearch.toLowerCase())
  );

  return (
    <div ref={popoverRef} className="fixed bottom-5 right-5 z-50">
      {/* ── Pastila plutitoare ────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("title")}
        className={cn(
          "tg-tap flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-full border text-xs font-semibold transition-all select-none backdrop-blur-md",
          open ? "border-indigo-500/40" : "hover:border-zinc-600"
        )}
        style={{
          background: open ? "var(--s-3)" : "rgba(16,19,25,0.92)",
          borderColor: open ? undefined : "var(--line-2)",
          color: "var(--ink-2)",
          boxShadow: "var(--el-2)",
        }}
      >
        {/* Pictogramă, nu emoji de steag: Windows NU randează steagurile și le
            înlocuiește cu literele țării, deci pastila arăta „RO 01:50" — ca un
            rest de debug, nu ca un ceas. */}
        <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent)" }} />
        <span className="font-mono tabular-nums tracking-wide">{timeStr || "──:──:──"}</span>
        <span className="text-[10px] font-mono" style={{ color: "var(--ink-4)" }}>{currentTz?.offset}</span>
      </button>

      {/* ── Popover ───────────────────────────────────────────── */}
      {open && (
        <div className="tg-surface absolute bottom-full right-0 mb-2 w-72 rounded-2xl overflow-hidden">
          <div className="px-4 pt-3.5 pb-2.5" style={{ borderBottom: "1px solid var(--line-1)" }}>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
              <p className="text-xs font-bold" style={{ color: "var(--ink-1)" }}>{t("title")}</p>
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--ink-4)" }}>{t("subtitle")}</p>
          </div>

          <div className="px-3 pt-2.5 pb-1.5">
            <input
              className="w-full rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              style={{ background: "var(--s-4)", border: "1px solid var(--line-2)", color: "var(--ink-1)" }}
              placeholder={t("searchCity")}
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
                  timezone === tz.value ? "bg-indigo-500/10" : "hover:bg-zinc-800/70"
                )}
                style={{ color: timezone === tz.value ? "var(--accent)" : "var(--ink-3)" }}
              >
                <span className="text-base leading-none">{tz.flag}</span>
                <span className="flex-1 font-medium text-left">{cityLabel(tz)}</span>
                <span className="text-[10px] font-mono" style={{ color: "var(--ink-4)" }}>{tz.offset}</span>
                {timezone === tz.value && <Check className="h-3 w-3 shrink-0" />}
              </button>
            ))}
            {filteredTz.length === 0 && (
              <p className="text-center text-[11px] py-6" style={{ color: "var(--ink-4)" }}>{t("noResult")}</p>
            )}
          </div>

          <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: "1px solid var(--line-1)" }}>
            <span className="text-[10px]" style={{ color: "var(--ink-4)" }}>
              {currentTz?.flag} {currentTz ? cityLabel(currentTz) : ""}
            </span>
            <span className="text-[10px] font-mono" style={{ color: "var(--ink-4)" }}>{currentTz?.offset}</span>
          </div>
        </div>
      )}
    </div>
  );
}
