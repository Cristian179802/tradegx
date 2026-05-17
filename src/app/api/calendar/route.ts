import { NextRequest, NextResponse } from "next/server";

// ForexFactory public feed — exact same source as MyFXBook
const FF_FEEDS = {
  last:  "https://nfs.faireconomy.media/ff_calendar_lastweek.json?version=latest",
  this:  "https://nfs.faireconomy.media/ff_calendar_thisweek.json?version=latest",
  next:  "https://nfs.faireconomy.media/ff_calendar_nextweek.json?version=latest",
};

export interface CalendarEvent {
  id: string;
  title: string;
  currency: string;
  date: string;       // ISO string
  impact: "High" | "Medium" | "Low" | "Holiday";
  forecast: string;
  previous: string;
  actual: string;
}

async function fetchFeed(url: string): Promise<CalendarEvent[]> {
  const res = await fetch(url, {
    next: { revalidate: 900 }, // cache 15 min
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((e: any, i: number) => ({
    id: `${e.date}-${e.country}-${e.title}-${i}`,
    title: e.title ?? "",
    currency: e.country ?? "",
    date: e.date ?? "",
    impact: normalizeImpact(e.impact),
    forecast: e.forecast ?? "",
    previous: e.previous ?? "",
    actual: e.actual ?? "",
  }));
}

function normalizeImpact(v: string): "High" | "Medium" | "Low" | "Holiday" {
  const s = (v ?? "").toLowerCase();
  if (s === "high") return "High";
  if (s === "medium") return "Medium";
  if (s === "holiday") return "Holiday";
  return "Low";
}

export async function GET(req: NextRequest) {
  const week = (req.nextUrl.searchParams.get("week") ?? "this") as keyof typeof FF_FEEDS;
  const feedUrl = FF_FEEDS[week] ?? FF_FEEDS.this;

  try {
    const events = await fetchFeed(feedUrl);
    return NextResponse.json({ events, count: events.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, events: [] }, { status: 500 });
  }
}
