"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Impact = "High" | "Medium" | "Low" | "Holiday";
type Week = "last" | "this" | "next";

interface CalendarEvent {
  id: string;
  title: string;
  currency: string;
  country: string;
  utcDate: string;
  impact: Impact;
  forecast: string;
  previous: string;
  actual: string;
  isBetter: boolean;
  isWorse: boolean;
  allDay: boolean;
  source: "fxstreet" | "tradingview";
}

const FLAGS: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵",
  CAD: "🇨🇦", AUD: "🇦🇺", NZD: "🇳🇿", CHF: "🇨🇭",
  CNY: "🇨🇳", CNH: "🇨🇳", KRW: "🇰🇷", SGD: "🇸🇬",
  HKD: "🇭🇰", MXN: "🇲🇽", BRL: "🇧🇷", ZAR: "🇿🇦",
  INR: "🇮🇳", SEK: "🇸🇪", NOK: "🇳🇴", DKK: "🇩🇰",
  PLN: "🇵🇱", CZK: "🇨🇿", HUF: "🇭🇺", TRY: "🇹🇷",
  TWD: "🇹🇼", MYR: "🇲🇾", THB: "🇹🇭", IDR: "🇮🇩",
  RUB: "🇷🇺", SAR: "🇸🇦", AED: "🇦🇪",
};

// Country name → flag fallback
const COUNTRY_FLAGS: Record<string, string> = {
  "United States": "🇺🇸", "Eurozone": "🇪🇺", "United Kingdom": "🇬🇧", "Japan": "🇯🇵",
  "Canada": "🇨🇦", "Australia": "🇦🇺", "New Zealand": "🇳🇿", "Switzerland": "🇨🇭",
  "China": "🇨🇳", "Germany": "🇩🇪", "France": "🇫🇷", "Italy": "🇮🇹",
  "Spain": "🇪🇸", "Netherlands": "🇳🇱",
};

const IMPACT_CFG: Record<Impact, { dotColor: string; textColor: string; bg: string; border: string; label: string }> = {
  High:    { dotColor: "bg-red-500",    textColor: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30",    label: "High" },
  Medium:  { dotColor: "bg-orange-500", textColor: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", label: "Medium" },
  Low:     { dotColor: "bg-yellow-500", textColor: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30", label: "Low" },
  Holiday: { dotColor: "bg-zinc-600",   textColor: "text-zinc-500",   bg: "bg-zinc-800/50",   border: "border-zinc-700",      label: "Holiday" },
};

const MAJOR_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "NZD", "CHF"];
const WEEK_LABELS: Record<Week, string> = {
  last: "Săptămâna trecută",
  this: "Săptămâna aceasta",
  next: "Săptămâna viitoare",
};

function ImpactDots({ impact }: { impact: Impact }) {
  if (impact === "Holiday") return <span className="text-xs text-zinc-600">—</span>;
  const filled = impact === "High" ? 3 : impact === "Medium" ? 2 : 1;
  const cfg = IMPACT_CFG[impact];
  return (
    <div className="flex items-center gap-[3px]">
      {[1, 2, 3].map(i => (
        <div key={i} className={cn("w-[7px] h-[7px] rounded-full", i <= filled ? cfg.dotColor : "bg-zinc-700")} />
      ))}
    </div>
  );
}

function EventTime({ utcDate, allDay }: { utcDate: string; allDay: boolean }) {
  const [display, setDisplay] = useState("");
  useEffect(() => {
    if (allDay || !utcDate) { setDisplay("Toată ziua"); return; }
    try {
      setDisplay(new Date(utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
    } catch { setDisplay("—"); }
  }, [utcDate, allDay]);
  return <span className="font-mono text-xs tabular-nums text-zinc-400">{display || "..."}</span>;
}

function ActualCell({ actual, isBetter, isWorse, impact }: { actual: string; isBetter: boolean; isWorse: boolean; impact: Impact }) {
  if (!actual) return <span className="text-zinc-600 text-xs">—</span>;
  const isSignificant = impact === "High" || impact === "Medium";
  return (
    <span className={cn(
      "font-semibold text-xs tabular-nums font-mono",
      isSignificant && isBetter ? "text-emerald-400" : "",
      isSignificant && isWorse  ? "text-red-400" : "",
      !isBetter && !isWorse     ? "text-zinc-200" : "",
    )}>
      {actual}
    </span>
  );
}

// Get UTC date string "YYYY-MM-DD" for grouping (same timezone as source)
function getUTCDateKey(utcDate: string): string {
  if (!utcDate) return "unknown";
  return utcDate.substring(0, 10);
}

export default function CalendarPage() {
  const [week, setWeek]           = useState<Week>("this");
  const [events, setEvents]       = useState<CalendarEvent[]>([]);
  const [stats, setStats]         = useState({ high: 0, medium: 0, low: 0, source: "" });
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [selCurr, setSelCurr]     = useState<string[]>([]);
  const [selImpact, setSelImpact] = useState<Impact[]>([]);
  const [now, setNow]             = useState(new Date());
  const timerRef                  = useRef<ReturnType<typeof setInterval>>();
  const refreshRef                = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timerRef.current);
  }, []);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/calendar?week=${week}`, { cache: "no-store" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEvents(data.events ?? []);
      setStats({ high: data.high, medium: data.medium, low: data.low, source: data.source });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [week]);

  useEffect(() => {
    loadEvents();
    refreshRef.current = setInterval(loadEvents, 300000); // auto-refresh every 5 min
    return () => clearInterval(refreshRef.current);
  }, [loadEvents]);

  // Filtered events
  const filtered = events.filter(e => {
    if (selCurr.length > 0 && !selCurr.includes(e.currency)) return false;
    if (selImpact.length > 0 && !selImpact.includes(e.impact)) return false;
    return true;
  });

  // Group by UTC date key
  const grouped = new Map<string, CalendarEvent[]>();
  for (const e of filtered) {
    const k = getUTCDateKey(e.utcDate);
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(e);
  }

  const weekOrder: Week[] = ["last", "this", "next"];
  const weekIdx = weekOrder.indexOf(week);

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Calendar Economic</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-zinc-600">Sursă:</span>
            <Badge className={cn(
              "text-[10px] border px-1.5 py-0",
              stats.source === "fxstreet" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-zinc-800 border-zinc-700 text-zinc-500"
            )}>
              {stats.source === "fxstreet" ? "FXStreet (Live)" : stats.source === "tradingview" ? "TradingView" : "—"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!loading && events.length > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{stats.high} High</span>
              <span className="flex items-center gap-1 text-orange-400"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />{stats.medium} Medium</span>
              <span className="flex items-center gap-1 text-zinc-500"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />{stats.low} Low</span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={loadEvents} disabled={loading}
            className="text-zinc-400 hover:text-zinc-100">
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Reîmprospătează
          </Button>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3">
        <Button variant="ghost" size="sm"
          onClick={() => setWeek(weekOrder[Math.max(0, weekIdx - 1)])}
          disabled={weekIdx === 0}
          className="text-zinc-400 hover:text-zinc-100 disabled:opacity-30">
          <ChevronLeft className="w-4 h-4 mr-1" />Anterior
        </Button>
        <span className="font-semibold text-zinc-200">{WEEK_LABELS[week]}</span>
        <Button variant="ghost" size="sm"
          onClick={() => setWeek(weekOrder[Math.min(weekOrder.length - 1, weekIdx + 1)])}
          disabled={weekIdx === weekOrder.length - 1}
          className="text-zinc-400 hover:text-zinc-100 disabled:opacity-30">
          Următor<ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium w-14 shrink-0">Monedă</span>
          <button onClick={() => setSelCurr([])}
            className={cn("px-2.5 py-1 text-xs rounded-lg border transition-colors",
              selCurr.length === 0 ? "bg-zinc-700 border-zinc-600 text-zinc-100 font-semibold" : "border-zinc-700 text-zinc-500 hover:text-zinc-300")}>
            Toate
          </button>
          {MAJOR_CURRENCIES.map(c => (
            <button key={c} onClick={() => setSelCurr(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])}
              className={cn("px-2 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1 font-medium",
                selCurr.includes(c) ? "bg-indigo-600/30 border-indigo-500/50 text-indigo-300" : "border-zinc-700 text-zinc-500 hover:text-zinc-300")}>
              {FLAGS[c] ?? "🌐"} {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium w-14 shrink-0">Impact</span>
          <button onClick={() => setSelImpact([])}
            className={cn("px-2.5 py-1 text-xs rounded-lg border transition-colors",
              selImpact.length === 0 ? "bg-zinc-700 border-zinc-600 text-zinc-100 font-semibold" : "border-zinc-700 text-zinc-500 hover:text-zinc-300")}>
            Toate
          </button>
          {(["High", "Medium", "Low"] as Impact[]).map(imp => {
            const cfg = IMPACT_CFG[imp];
            return (
              <button key={imp} onClick={() => setSelImpact(p => p.includes(imp) ? p.filter(x => x !== imp) : [...p, imp])}
                className={cn("px-2.5 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1.5",
                  selImpact.includes(imp) ? `${cfg.bg} ${cfg.border} ${cfg.textColor} font-medium` : "border-zinc-700 text-zinc-500 hover:text-zinc-300")}>
                <ImpactDots impact={imp} />{imp}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="h-4 w-40 bg-zinc-800 rounded animate-pulse" />
              {[...Array(5)].map((_, j) => <div key={j} className="h-9 bg-zinc-800/50 rounded-lg animate-pulse" />)}
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <Button size="sm" variant="outline" className="mt-3 border-red-500/30 text-red-400" onClick={loadEvents}>Încearcă din nou</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-zinc-500">Niciun eveniment pentru filtrele selectate.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([dayKey, dayEvents]) => {
            const [y, m, d] = dayKey.split("-").map(Number);
            const dayDate = new Date(y, m - 1, d);
            const today = new Date();
            const isToday = dayDate.getFullYear() === today.getFullYear() &&
                            dayDate.getMonth() === today.getMonth() &&
                            dayDate.getDate() === today.getDate();
            const dayLabel = dayDate.toLocaleDateString("ro-RO", { weekday: "long" });
            const dateLabel = dayDate.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
            const dayHigh = dayEvents.filter(e => e.impact === "High").length;
            const dayMed  = dayEvents.filter(e => e.impact === "Medium").length;

            return (
              <div key={dayKey} className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                {/* Day header */}
                <div className={cn("px-5 py-3 border-b border-zinc-800 flex items-center gap-3 flex-wrap", isToday ? "bg-indigo-500/10" : "bg-zinc-900/30")}>
                  <div className="flex items-center gap-2">
                    {isToday && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                    <span className={cn("font-bold capitalize text-sm", isToday ? "text-indigo-300" : "text-zinc-300")}>{dayLabel}</span>
                    <span className="text-zinc-500 text-xs">{dateLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto text-xs">
                    {dayHigh > 0 && <span className="text-red-400">{dayHigh} High</span>}
                    {dayMed  > 0 && <span className="text-orange-400">{dayMed} Med</span>}
                    {isToday && <Badge className="bg-indigo-500/20 border-indigo-500/30 text-indigo-300 text-[10px]">Astăzi</Badge>}
                  </div>
                </div>

                {/* Column headers */}
                <div className="hidden md:grid grid-cols-[90px_60px_100px_1fr_90px_90px_90px] gap-2 px-5 py-2 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider border-b border-zinc-800/40">
                  <span>Oră (local)</span>
                  <span>Impact</span>
                  <span>Monedă</span>
                  <span>Eveniment</span>
                  <span className="text-right">Actual</span>
                  <span className="text-right">Prognoză</span>
                  <span className="text-right">Anterior</span>
                </div>

                {/* Events */}
                <div className="divide-y divide-zinc-800/30">
                  {dayEvents.map(event => {
                    const eventTime = new Date(event.utcDate);
                    const isPast = !event.allDay && eventTime < now;
                    const isImminent = !isPast && !event.allDay && (eventTime.getTime() - now.getTime()) < 3600000;
                    const cfg = IMPACT_CFG[event.impact];
                    const flag = FLAGS[event.currency] ?? COUNTRY_FLAGS[event.country] ?? "🌐";

                    return (
                      <div key={event.id} className={cn(
                        "grid grid-cols-[90px_60px_100px_1fr_90px_90px_90px] gap-2 px-5 py-2.5 items-center transition-colors hover:bg-zinc-800/20",
                        isImminent && "bg-amber-500/5 border-l-2 border-l-amber-500/50",
                        isPast && "opacity-50",
                        event.impact === "High" && !isPast && "hover:bg-red-500/5",
                      )}>
                        {/* Time */}
                        <div className="flex items-center gap-1">
                          {isImminent && <Clock className="w-3 h-3 text-amber-400 shrink-0" />}
                          <EventTime utcDate={event.utcDate} allDay={event.allDay} />
                        </div>

                        {/* Impact */}
                        <div><ImpactDots impact={event.impact} /></div>

                        {/* Currency */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm leading-none">{flag}</span>
                          <span className={cn("font-bold text-xs shrink-0", cfg.textColor)}>{event.currency}</span>
                        </div>

                        {/* Title */}
                        <span className={cn(
                          "font-medium truncate pr-2 text-xs",
                          event.impact === "High" ? "text-zinc-100" : event.impact === "Medium" ? "text-zinc-200" : "text-zinc-400"
                        )}>
                          {event.title}
                        </span>

                        {/* Actual */}
                        <div className="text-right">
                          <ActualCell actual={event.actual} isBetter={event.isBetter} isWorse={event.isWorse} impact={event.impact} />
                        </div>

                        {/* Forecast */}
                        <div className="text-right font-mono text-xs text-zinc-500 tabular-nums">{event.forecast || "—"}</div>

                        {/* Previous */}
                        <div className="text-right font-mono text-xs text-zinc-600 tabular-nums">{event.previous || "—"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-zinc-600">
        <span className="text-zinc-500 font-medium">Legendă:</span>
        {(["High", "Medium", "Low"] as Impact[]).map(imp => (
          <div key={imp} className="flex items-center gap-1.5">
            <ImpactDots impact={imp} />
            <span className={IMPACT_CFG[imp].textColor}>{imp}</span>
          </div>
        ))}
        <span className="mx-2">·</span>
        <div className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">Verde</span> = mai bun ca prognoza</div>
        <div className="flex items-center gap-1.5"><span className="text-red-400 font-bold">Roșu</span> = mai slab ca prognoza</div>
        <div className="flex items-center gap-1.5 ml-auto">
          <Zap className="w-3 h-3 text-zinc-600" /><span>Refresh automat la 5 min</span>
        </div>
      </div>
    </div>
  );
}
