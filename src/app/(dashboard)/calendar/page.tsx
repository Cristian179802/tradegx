"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Clock, Wifi } from "lucide-react";
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
  ffDate: string;
  isoDate: string;
  impact: Impact;
  forecast: string;
  previous: string;
  actual: string;
  unit: string;
  source: "ff" | "tv";
}

const FLAGS: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵",
  CAD: "🇨🇦", AUD: "🇦🇺", NZD: "🇳🇿", CHF: "🇨🇭",
  CNY: "🇨🇳", CNH: "🇨🇳", KRW: "🇰🇷", SGD: "🇸🇬",
  HKD: "🇭🇰", MXN: "🇲🇽", BRL: "🇧🇷", ZAR: "🇿🇦",
  INR: "🇮🇳", SEK: "🇸🇪", NOK: "🇳🇴", DKK: "🇩🇰",
  PLN: "🇵🇱", CZK: "🇨🇿", HUF: "🇭🇺", TRY: "🇹🇷",
  TWD: "🇹🇼", MYR: "🇲🇾", THB: "🇹🇭", IDR: "🇮🇩",
  US: "🇺🇸", EU: "🇪🇺", GB: "🇬🇧", JP: "🇯🇵",
  CA: "🇨🇦", AU: "🇦🇺", NZ: "🇳🇿", CH: "🇨🇭",
  CN: "🇨🇳",
};

const IMPACT_CFG: Record<Impact, { color: string; bg: string; border: string; dotColor: string }> = {
  High:    { color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30",    dotColor: "bg-red-500" },
  Medium:  { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", dotColor: "bg-orange-500" },
  Low:     { color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30", dotColor: "bg-yellow-500" },
  Holiday: { color: "text-zinc-500",   bg: "bg-zinc-800/50",   border: "border-zinc-700",      dotColor: "bg-zinc-600" },
};

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "NZD", "CHF"];
const WEEK_LABELS: Record<Week, string> = {
  last: "Săptămâna trecută",
  this: "Săptămâna aceasta",
  next: "Săptămâna viitoare",
};

// Dots like MyFXBook: 3 red = High, 2 orange = Medium, 1 yellow = Low
function ImpactDots({ impact }: { impact: Impact }) {
  const cfg = IMPACT_CFG[impact];
  if (impact === "Holiday") return <span className="text-xs text-zinc-600">—</span>;
  const total = impact === "High" ? 3 : impact === "Medium" ? 2 : 1;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map(i => (
        <div key={i} className={cn("w-2 h-2 rounded-full", i <= total ? cfg.dotColor : "bg-zinc-700")} />
      ))}
    </div>
  );
}

function TimeDisplay({ isoDate }: { isoDate: string }) {
  const [time, setTime] = useState("...");
  useEffect(() => {
    try {
      const d = new Date(isoDate);
      const t = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
      setTime(t === "00:00" ? "Toată ziua" : t);
    } catch { setTime("—"); }
  }, [isoDate]);
  return <span className="font-mono text-xs tabular-nums">{time}</span>;
}

function ActualBadge({ actual, forecast, impact }: { actual: string; forecast: string; impact: Impact }) {
  if (!actual) return <span className="text-zinc-600 text-xs">—</span>;
  const aNum = parseFloat(actual);
  const fNum = parseFloat(forecast);
  const better = !isNaN(aNum) && !isNaN(fNum) && aNum > fNum;
  const worse  = !isNaN(aNum) && !isNaN(fNum) && aNum < fNum;
  return (
    <span className={cn(
      "font-semibold text-xs tabular-nums font-mono",
      impact !== "Low" && better ? "text-emerald-400" : "",
      impact !== "Low" && worse  ? "text-red-400"     : "",
      (!better && !worse)        ? "text-zinc-300"    : "",
    )}>
      {actual}
    </span>
  );
}

function DayHeader({ ffDate, events }: { ffDate: string; events: CalendarEvent[] }) {
  const [label, setLabel] = useState({ day: "", date: "", isToday: false });
  useEffect(() => {
    // Parse ffDate as local date (YYYY-MM-DD) — no TZ shift
    const [y, m, d] = ffDate.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    const today = new Date();
    const isToday = dt.getFullYear() === today.getFullYear() &&
                    dt.getMonth() === today.getMonth() &&
                    dt.getDate() === today.getDate();
    setLabel({
      day: dt.toLocaleDateString("ro-RO", { weekday: "long" }),
      date: dt.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" }),
      isToday,
    });
  }, [ffDate]);

  const high   = events.filter(e => e.impact === "High").length;
  const medium = events.filter(e => e.impact === "Medium").length;

  return (
    <div className={cn(
      "px-5 py-3 border-b border-zinc-800 flex items-center gap-3",
      label.isToday ? "bg-indigo-500/10" : "bg-zinc-900/30"
    )}>
      <div className="flex items-center gap-2 flex-1">
        {label.isToday && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
        <span className={cn("font-bold capitalize", label.isToday ? "text-indigo-300" : "text-zinc-300")}>
          {label.day}
        </span>
        <span className="text-zinc-500 text-sm">{label.date}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        {high > 0 && <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"/>{high} High</span>}
        {medium > 0 && <span className="flex items-center gap-1 text-orange-400"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block"/>{medium} Med</span>}
        {label.isToday && <Badge className="bg-indigo-500/20 border-indigo-500/30 text-indigo-300 text-xs">Astăzi</Badge>}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [week, setWeek]           = useState<Week>("this");
  const [events, setEvents]       = useState<CalendarEvent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [source, setSource]       = useState<string>("");
  const [error, setError]         = useState<string | null>(null);
  const [selCurr, setSelCurr]     = useState<string[]>([]);
  const [selImpact, setSelImpact] = useState<Impact[]>([]);
  const [now, setNow]             = useState(new Date());
  const refreshRef                = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/calendar?week=${week}`, { cache: "no-store" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEvents(data.events ?? []);
      setSource(data.source ?? "");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [week]);

  useEffect(() => {
    fetchEvents();
    // Auto-refresh every 5 min for live actual values
    refreshRef.current = setInterval(fetchEvents, 300000);
    return () => clearInterval(refreshRef.current);
  }, [fetchEvents]);

  // Filtering
  const filtered = events.filter(e => {
    if (selCurr.length > 0 && !selCurr.includes(e.currency)) return false;
    if (selImpact.length > 0 && !selImpact.includes(e.impact)) return false;
    return true;
  });

  // Group by ffDate (same as ForexFactory website, no TZ conversion)
  const grouped = new Map<string, CalendarEvent[]>();
  for (const e of filtered) {
    const k = e.ffDate;
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(e);
  }

  const weekOrder: Week[] = ["last", "this", "next"];
  const weekIdx = weekOrder.indexOf(week);

  const highCount   = filtered.filter(e => e.impact === "High").length;
  const mediumCount = filtered.filter(e => e.impact === "Medium").length;
  const lowCount    = filtered.filter(e => e.impact === "Low").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Calendar Economic</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Sursă: {source === "ff" ? "Forex Factory (identic MyFXBook)" : source === "tv" ? "TradingView (backup)" : "—"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!loading && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-400">{filtered.length} evenimente</span>
              {highCount > 0 && <span className="text-red-400">· {highCount} High</span>}
              {mediumCount > 0 && <span className="text-orange-400">· {mediumCount} Medium</span>}
              {lowCount > 0 && <span className="text-zinc-500">· {lowCount} Low</span>}
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={fetchEvents} disabled={loading}
            className="text-zinc-400 hover:text-zinc-100">
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Reîmprospătează
          </Button>
        </div>
      </div>

      {/* Week nav */}
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
        {/* Currency */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium w-14 shrink-0">Monedă</span>
          <button onClick={() => setSelCurr([])}
            className={cn("px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors",
              selCurr.length === 0 ? "bg-zinc-700 border-zinc-600 text-zinc-100" : "border-zinc-700 text-zinc-500 hover:text-zinc-300")}>
            Toate
          </button>
          {CURRENCIES.map(c => (
            <button key={c} onClick={() => setSelCurr(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])}
              className={cn("px-2 py-1 text-xs rounded-lg border font-medium transition-colors flex items-center gap-1",
                selCurr.includes(c) ? "bg-indigo-600/30 border-indigo-500/50 text-indigo-300" : "border-zinc-700 text-zinc-500 hover:text-zinc-300")}>
              <span>{FLAGS[c] ?? "🌐"}</span>{c}
            </button>
          ))}
        </div>

        {/* Impact */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium w-14 shrink-0">Impact</span>
          <button onClick={() => setSelImpact([])}
            className={cn("px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors",
              selImpact.length === 0 ? "bg-zinc-700 border-zinc-600 text-zinc-100" : "border-zinc-700 text-zinc-500 hover:text-zinc-300")}>
            Toate
          </button>
          {(["High", "Medium", "Low"] as Impact[]).map(imp => {
            const cfg = IMPACT_CFG[imp];
            return (
              <button key={imp} onClick={() => setSelImpact(p => p.includes(imp) ? p.filter(x => x !== imp) : [...p, imp])}
                className={cn("px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors flex items-center gap-1.5",
                  selImpact.includes(imp) ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "border-zinc-700 text-zinc-500 hover:text-zinc-300")}>
                <ImpactDots impact={imp} />{imp}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="h-4 w-40 bg-zinc-800 rounded animate-pulse" />
              {[...Array(4)].map((_, j) => <div key={j} className="h-10 bg-zinc-800/50 rounded-lg animate-pulse" />)}
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
          <p className="text-zinc-500 mb-1">Niciun eveniment găsit.</p>
          <p className="text-zinc-600 text-sm">Schimbă filtrele sau navighează la altă săptămână.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([dayKey, dayEvents]) => (
            <div key={dayKey} className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
              <DayHeader ffDate={dayKey} events={dayEvents} />

              {/* Table header */}
              <div className="hidden md:grid grid-cols-[100px_70px_110px_1fr_90px_90px_90px] gap-2 px-5 py-2 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider border-b border-zinc-800/50">
                <span>Oră (local)</span>
                <span>Impact</span>
                <span>Monedă</span>
                <span>Eveniment</span>
                <span className="text-right">Actual</span>
                <span className="text-right">Prognoză</span>
                <span className="text-right">Anterior</span>
              </div>

              <div className="divide-y divide-zinc-800/40">
                {dayEvents.map(event => {
                  const eventTime = new Date(event.isoDate);
                  const isPast = eventTime < now;
                  const isImminent = !isPast && eventTime.getTime() - now.getTime() < 3600000;
                  const cfg = IMPACT_CFG[event.impact];

                  return (
                    <div key={event.id} className={cn(
                      "grid grid-cols-[100px_70px_110px_1fr_90px_90px_90px] gap-2 px-5 py-3 items-center text-sm transition-colors hover:bg-zinc-800/20",
                      isImminent && "bg-amber-500/5 border-l-2 border-l-amber-500/60",
                      isPast && event.impact !== "Holiday" && "opacity-55",
                    )}>
                      {/* Time */}
                      <div className="flex items-center gap-1">
                        {isImminent && <Clock className="w-3 h-3 text-amber-400 shrink-0" />}
                        <span className={cn(isImminent ? "text-amber-300 font-semibold" : "text-zinc-400")}>
                          <TimeDisplay isoDate={event.isoDate} />
                        </span>
                      </div>

                      {/* Impact */}
                      <div><ImpactDots impact={event.impact} /></div>

                      {/* Currency */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-base leading-none">{FLAGS[event.currency] ?? FLAGS[event.country] ?? "🌐"}</span>
                        <span className={cn("font-bold text-xs", cfg.color)}>{event.currency}</span>
                      </div>

                      {/* Title */}
                      <span className="text-zinc-200 font-medium truncate pr-2 text-sm">{event.title}</span>

                      {/* Actual */}
                      <div className="text-right">
                        <ActualBadge actual={event.actual} forecast={event.forecast} impact={event.impact} />
                      </div>

                      {/* Forecast */}
                      <div className="text-right font-mono text-xs text-zinc-500 tabular-nums">
                        {event.forecast || "—"}
                      </div>

                      {/* Previous */}
                      <div className="text-right font-mono text-xs text-zinc-600 tabular-nums">
                        {event.previous || "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer legend */}
      <div className="flex flex-wrap items-center gap-5 pb-4 text-xs text-zinc-600">
        <span className="text-zinc-500 font-medium">Legendă:</span>
        {(["High", "Medium", "Low"] as Impact[]).map(imp => (
          <div key={imp} className="flex items-center gap-1.5">
            <ImpactDots impact={imp} />
            <span className={IMPACT_CFG[imp].color}>{imp}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2">
          <div className="w-1 h-4 bg-amber-500/60 rounded-sm" />
          <span>Urmează în &lt;1h</span>
        </div>
        <span className="ml-auto">Refresh automat la 5 min</span>
      </div>
    </div>
  );
}
