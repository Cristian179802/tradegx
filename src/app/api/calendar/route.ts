import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ForexFactory public feeds — same source as MyFXBook
const FF = {
  last: "https://nfs.faireconomy.media/ff_calendar_lastweek.json?version=latest",
  this: "https://nfs.faireconomy.media/ff_calendar_thisweek.json?version=latest",
  next: "https://nfs.faireconomy.media/ff_calendar_nextweek.json?version=latest",
};

// TradingView public API — backup for when FF feeds are unavailable
const TV_BASE = "https://economic-calendar.tradingview.com/events";

export interface CalendarEvent {
  id: string;
  title: string;
  currency: string;
  country: string;
  // ffDate is the "wall-clock" date in FF's timezone (same as ForexFactory website)
  ffDate: string;      // "YYYY-MM-DD" extracted directly from FF string (no TZ conversion)
  isoDate: string;     // full ISO string for time display
  impact: "High" | "Medium" | "Low" | "Holiday";
  forecast: string;
  previous: string;
  actual: string;
  unit: string;
  source: "ff" | "tv";
}

function normalizeFFImpact(v: string): CalendarEvent["impact"] {
  const s = (v ?? "").toLowerCase();
  if (s === "high") return "High";
  if (s === "medium") return "Medium";
  if (s === "holiday") return "Holiday";
  return "Low";
}

function normalizeTVImpact(v: number): CalendarEvent["impact"] {
  if (v === 1) return "High";
  if (v === 0) return "Medium";
  if (v === -1) return "Low";
  return "Holiday";
}

function formatValue(v: number | null | undefined, unit?: string): string {
  if (v == null) return "";
  const s = String(v);
  return unit ? `${s}${unit}` : s;
}

async function fetchFF(url: string): Promise<CalendarEvent[]> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return [];
    const data: any[] = await res.json();
    return (Array.isArray(data) ? data : []).map((e, i) => ({
      id: `ff-${e.date}-${e.country}-${i}`,
      title: e.title ?? "",
      currency: e.country ?? "",
      country: e.country ?? "",
      // Extract date directly from ISO string — avoids timezone shift
      ffDate: (e.date ?? "").substring(0, 10),
      isoDate: e.date ?? "",
      impact: normalizeFFImpact(e.impact),
      forecast: e.forecast ?? "",
      previous: e.previous ?? "",
      actual: e.actual ?? "",
      unit: "",
      source: "ff" as const,
    }));
  } catch { return []; }
}

async function fetchTV(from: string, to: string): Promise<CalendarEvent[]> {
  try {
    const url = `${TV_BASE}?from=${from}T00:00:00.000Z&to=${to}T23:59:59.000Z&countries=US,EU,GB,JP,CA,AU,NZ,CH&importance=-1,0,1`;
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: {
        "Origin": "https://www.tradingview.com",
        "Referer": "https://www.tradingview.com/",
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list: any[] = data.result ?? [];
    return list.map((e, i) => ({
      id: `tv-${e.id ?? i}`,
      title: e.title ?? "",
      currency: e.currency ?? "",
      country: e.country ?? "",
      ffDate: (e.date ?? "").substring(0, 10),
      isoDate: e.date ?? "",
      impact: normalizeTVImpact(e.importance),
      forecast: formatValue(e.forecastRaw, e.unit),
      previous: formatValue(e.previousRaw, e.unit),
      actual: formatValue(e.actualRaw, e.unit),
      unit: e.unit ?? "",
      source: "tv" as const,
    }));
  } catch { return []; }
}

function getDateRange(week: string) {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  if (week === "last") {
    const start = new Date(monday); start.setDate(monday.getDate() - 7);
    const end = new Date(monday); end.setDate(monday.getDate() - 1);
    return { start: start.toISOString().substring(0, 10), end: end.toISOString().substring(0, 10) };
  }
  if (week === "next") {
    const start = new Date(monday); start.setDate(monday.getDate() + 7);
    const end = new Date(monday); end.setDate(monday.getDate() + 13);
    return { start: start.toISOString().substring(0, 10), end: end.toISOString().substring(0, 10) };
  }
  // "this"
  const end = new Date(monday); end.setDate(monday.getDate() + 6);
  return { start: monday.toISOString().substring(0, 10), end: end.toISOString().substring(0, 10) };
}

export async function GET(req: NextRequest) {
  const week = (req.nextUrl.searchParams.get("week") ?? "this") as "last" | "this" | "next";

  // Try ForexFactory first (most accurate — same source as MyFXBook)
  let events = await fetchFF(FF[week]);

  // If FF feed unavailable, fall back to TradingView
  if (events.length === 0) {
    const { start, end } = getDateRange(week);
    events = await fetchTV(start, end);
  }

  // Sort by date ascending
  events.sort((a, b) => a.isoDate.localeCompare(b.isoDate));

  return NextResponse.json({
    events,
    count: events.length,
    source: events[0]?.source ?? "none",
  });
}
