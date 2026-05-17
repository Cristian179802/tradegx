"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Impact = "High" | "Medium" | "Low" | "Holiday";
type Week = "last" | "this" | "next";

interface CalendarEvent {
  id: string;
  title: string;
  currency: string;
  date: string;
  impact: Impact;
  forecast: string;
  previous: string;
  actual: string;
}

const CURRENCY_FLAGS: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵",
  CAD: "🇨🇦", AUD: "🇦🇺", NZD: "🇳🇿", CHF: "🇨🇭",
  CNY: "🇨🇳", CNH: "🇨🇳", KRW: "🇰🇷", SGD: "🇸🇬",
  HKD: "🇭🇰", MXN: "🇲🇽", BRL: "🇧🇷", ZAR: "🇿🇦",
  INR: "🇮🇳", SEK: "🇸🇪", NOK: "🇳🇴", DKK: "🇩🇰",
  PLN: "🇵🇱", CZK: "🇨🇿", HUF: "🇭🇺", TRY: "🇹🇷",
};

const IMPACT_CONFIG: Record<Impact, { label: string; dots: number; color: string; bg: string; border: string }> = {
  High:    { label: "High",    dots: 3, color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30" },
  Medium:  { label: "Medium",  dots: 2, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  Low:     { label: "Low",     dots: 1, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  Holiday: { label: "Holiday", dots: 0, color: "text-zinc-500",   bg: "bg-zinc-800/50",   border: "border-zinc-700" },
};

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "NZD", "CHF"];

const WEEK_LABELS: Record<Week, string> = {
  last: "Săptămâna trecută",
  this: "Săptămâna aceasta",
  next: "Săptămâna viitoare",
};

function ImpactDots({ impact }: { impact: Impact }) {
  const cfg = IMPACT_CONFIG[impact];
  if (cfg.dots === 0) return <span className="text-xs text-zinc-600">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            "w-2 h-2 rounded-full",
            i <= cfg.dots ? cfg.color.replace("text-", "bg-") : "bg-zinc-700"
          )}
        />
      ))}
    </div>
  );
}

function ActualValue({ actual, forecast, impact }: { actual: string; forecast: string; impact: Impact }) {
  if (!actual) return <span className="text-zinc-600">—</span>;

  const aNum = parseFloat(actual.replace("%", "").replace("K", "").replace("M", "").replace("B", ""));
  const fNum = parseFloat(forecast.replace("%", "").replace("K", "").replace("M", "").replace("B", ""));
  const isBetter = !isNaN(aNum) && !isNaN(fNum) && aNum > fNum;
  const isWorse  = !isNaN(aNum) && !isNaN(fNum) && aNum < fNum;

  return (
    <span className={cn(
      "font-semibold",
      impact === "High" && isBetter && "text-emerald-400",
      impact === "High" && isWorse  && "text-red-400",
      (!isBetter && !isWorse) && "text-zinc-300",
    )}>
      {actual}
    </span>
  );
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch { return ""; }
}

function formatDayHeader(dateStr: string): { day: string; date: string; isToday: boolean } {
  try {
    const d = new Date(dateStr);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    return {
      day: d.toLocaleDateString("ro-RO", { weekday: "long" }),
      date: d.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" }),
      isToday,
    };
  } catch { return { day: "", date: "", isToday: false }; }
}

function groupByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const dayKey = new Date(e.date).toDateString();
    if (!map.has(dayKey)) map.set(dayKey, []);
    map.get(dayKey)!.push(e);
  }
  return map;
}

export default function CalendarPage() {
  const [week, setWeek] = useState<Week>("this");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [selectedImpacts, setSelectedImpacts] = useState<Impact[]>([]);
  const [now, setNow] = useState(new Date());

  // Update "now" every minute for countdown
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/calendar?week=${week}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEvents(data.events ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [week]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  function toggleCurrency(c: string) {
    setSelectedCurrencies(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  }

  function toggleImpact(i: Impact) {
    setSelectedImpacts(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  }

  const filtered = events.filter(e => {
    if (selectedCurrencies.length > 0 && !selectedCurrencies.includes(e.currency)) return false;
    if (selectedImpacts.length > 0 && !selectedImpacts.includes(e.impact)) return false;
    return true;
  });

  const grouped = groupByDay(filtered);

  const weekOrder: Week[] = ["last", "this", "next"];
  const weekIdx = weekOrder.indexOf(week);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Calendar Economic</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Date în timp real · Sursă: Forex Factory</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchEvents}
          disabled={loading}
          className="text-zinc-400 hover:text-zinc-100"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Reîmprospătează
        </Button>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWeek(weekOrder[Math.max(0, weekIdx - 1)])}
          disabled={weekIdx === 0}
          className="text-zinc-400 hover:text-zinc-100 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>
        <span className="font-semibold text-zinc-200">{WEEK_LABELS[week]}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWeek(weekOrder[Math.min(weekOrder.length - 1, weekIdx + 1)])}
          disabled={weekIdx === weekOrder.length - 1}
          className="text-zinc-400 hover:text-zinc-100 disabled:opacity-30"
        >
          Următor
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Currency filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium w-16">Monedă:</span>
          <button
            onClick={() => setSelectedCurrencies([])}
            className={cn(
              "px-3 py-1 text-xs rounded-lg border font-medium transition-colors",
              selectedCurrencies.length === 0
                ? "bg-zinc-700 border-zinc-600 text-zinc-100"
                : "border-zinc-700 text-zinc-500 hover:text-zinc-300"
            )}
          >
            Toate
          </button>
          {CURRENCIES.map(c => (
            <button
              key={c}
              onClick={() => toggleCurrency(c)}
              className={cn(
                "px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors flex items-center gap-1",
                selectedCurrencies.includes(c)
                  ? "bg-indigo-600/30 border-indigo-500/50 text-indigo-300"
                  : "border-zinc-700 text-zinc-500 hover:text-zinc-300"
              )}
            >
              <span>{CURRENCY_FLAGS[c] ?? "🌐"}</span>
              {c}
            </button>
          ))}
        </div>

        {/* Impact filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium w-16">Impact:</span>
          <button
            onClick={() => setSelectedImpacts([])}
            className={cn(
              "px-3 py-1 text-xs rounded-lg border font-medium transition-colors",
              selectedImpacts.length === 0
                ? "bg-zinc-700 border-zinc-600 text-zinc-100"
                : "border-zinc-700 text-zinc-500 hover:text-zinc-300"
            )}
          >
            Toate
          </button>
          {(["High", "Medium", "Low"] as Impact[]).map(imp => {
            const cfg = IMPACT_CONFIG[imp];
            return (
              <button
                key={imp}
                onClick={() => toggleImpact(imp)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors flex items-center gap-1.5",
                  selectedImpacts.includes(imp)
                    ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                    : "border-zinc-700 text-zinc-500 hover:text-zinc-300"
                )}
              >
                <ImpactDots impact={imp} />
                {imp}
              </button>
            );
          })}
        </div>
      </div>

      {/* Events */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="h-4 w-40 bg-zinc-800 rounded animate-pulse" />
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-10 bg-zinc-800/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <Button size="sm" variant="outline" className="mt-3 border-red-500/30 text-red-400" onClick={fetchEvents}>
            Încearcă din nou
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-zinc-500">Niciun eveniment găsit pentru filtrele selectate.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...grouped.entries()].map(([dayKey, dayEvents]) => {
            const { day, date, isToday } = formatDayHeader(dayEvents[0].date);
            return (
              <div key={dayKey} className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                {/* Day header */}
                <div className={cn(
                  "px-5 py-3 border-b border-zinc-800 flex items-center gap-3",
                  isToday ? "bg-indigo-500/10" : "bg-zinc-900/30"
                )}>
                  <div className="flex items-center gap-2">
                    {isToday && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    )}
                    <span className={cn(
                      "font-bold capitalize",
                      isToday ? "text-indigo-300" : "text-zinc-300"
                    )}>
                      {day}
                    </span>
                    <span className="text-zinc-500 text-sm">{date}</span>
                  </div>
                  {isToday && (
                    <Badge className="ml-auto bg-indigo-500/20 border-indigo-500/30 text-indigo-300 text-xs">
                      Astăzi
                    </Badge>
                  )}
                </div>

                {/* Events table */}
                <div className="divide-y divide-zinc-800/50">
                  {/* Table header */}
                  <div className="hidden md:grid grid-cols-[90px_80px_120px_1fr_90px_90px_90px] gap-2 px-5 py-2 text-xs font-medium text-zinc-600 uppercase tracking-wider">
                    <span>Oră</span>
                    <span>Impact</span>
                    <span>Monedă</span>
                    <span>Eveniment</span>
                    <span className="text-right">Actual</span>
                    <span className="text-right">Prognoză</span>
                    <span className="text-right">Anterior</span>
                  </div>

                  {dayEvents.map(event => {
                    const cfg = IMPACT_CONFIG[event.impact];
                    const eventTime = new Date(event.date);
                    const isPast = eventTime < now;
                    const isUpcoming = !isPast && eventTime.getTime() - now.getTime() < 3600000; // within 1hr

                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "grid grid-cols-[90px_80px_120px_1fr_90px_90px_90px] gap-2 px-5 py-3 items-center text-sm transition-colors",
                          "hover:bg-zinc-800/30",
                          isUpcoming && "bg-amber-500/5 border-l-2 border-amber-500/50",
                          isPast && "opacity-60",
                          event.impact === "Holiday" && "opacity-40"
                        )}
                      >
                        {/* Time */}
                        <div className="flex items-center gap-1.5">
                          {isUpcoming && <Clock className="w-3 h-3 text-amber-400 shrink-0" />}
                          <span className={cn(
                            "font-mono text-xs tabular-nums",
                            isUpcoming ? "text-amber-300 font-semibold" : "text-zinc-400"
                          )}>
                            {formatTime(event.date) || "Toată ziua"}
                          </span>
                        </div>

                        {/* Impact */}
                        <div className="flex items-center">
                          <ImpactDots impact={event.impact} />
                        </div>

                        {/* Currency */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-base leading-none">
                            {CURRENCY_FLAGS[event.currency] ?? "🌐"}
                          </span>
                          <span className={cn("font-semibold text-xs", cfg.color)}>
                            {event.currency}
                          </span>
                        </div>

                        {/* Title */}
                        <span className="text-zinc-200 font-medium truncate pr-2">
                          {event.title}
                        </span>

                        {/* Actual */}
                        <div className="text-right font-mono text-xs">
                          <ActualValue
                            actual={event.actual}
                            forecast={event.forecast}
                            impact={event.impact}
                          />
                        </div>

                        {/* Forecast */}
                        <div className="text-right font-mono text-xs text-zinc-500">
                          {event.forecast || "—"}
                        </div>

                        {/* Previous */}
                        <div className="text-right font-mono text-xs text-zinc-600">
                          {event.previous || "—"}
                        </div>
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
      <div className="flex flex-wrap items-center gap-4 pt-2 pb-4 text-xs text-zinc-600">
        <span className="font-medium text-zinc-500">Legendă:</span>
        {(["High", "Medium", "Low"] as Impact[]).map(imp => {
          const cfg = IMPACT_CONFIG[imp];
          return (
            <div key={imp} className="flex items-center gap-1.5">
              <ImpactDots impact={imp} />
              <span>{cfg.label}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-1.5 ml-2">
          <div className="w-2 h-4 bg-amber-500/50 rounded-sm" />
          <span>Urmează în &lt;1h</span>
        </div>
      </div>
    </div>
  );
}
