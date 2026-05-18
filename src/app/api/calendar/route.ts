import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface CalendarEvent {
  id: string;
  title: string;
  currency: string;
  country: string;
  utcDate: string;
  impact: "High" | "Medium" | "Low" | "Holiday";
  forecast: string;
  previous: string;
  actual: string;
  isBetter: boolean;
  isWorse: boolean;
  allDay: boolean;
}

// FXStreet public calendar — professional forex data, no auth needed
async function fetchFXStreet(): Promise<CalendarEvent[]> {
  const res = await fetch("https://calendar.fxstreet.com/eventdate/?gmt=0&rows=1000", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "Referer": "https://www.fxstreet.com/economic-calendar",
      "Origin": "https://www.fxstreet.com",
    },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`FXStreet ${res.status}`);
  const data: any[] = await res.json();
  return data.map((e, i) => ({
    id: `fxs-${e.IdEcoCalendarDate ?? i}`,
    title: e.Name ?? "",
    currency: e.Currency ?? "",
    country: e.Country ?? "",
    utcDate: e.DateTime?.Date ?? "",
    impact: (e.Volatility >= 3 ? "High" : e.Volatility === 2 ? "Medium" : e.Volatility === 0 ? "Holiday" : "Low") as any,
    forecast: e.DisplayConsensus || "",
    previous: e.DisplayPrevious || "",
    actual: e.DisplayActual || "",
    isBetter: e.Better === true,
    isWorse: e.Worst === true,
    allDay: e.AllDay === true,
  }));
}

// TradingView fallback for prev/next week
async function fetchTV(from: string, to: string): Promise<CalendarEvent[]> {
  const url = `https://economic-calendar.tradingview.com/events?from=${from}T00:00:00.000Z&to=${to}T23:59:59.000Z&countries=US,EU,GB,JP,CA,AU,NZ,CH&importance=-1,0,1`;
  const res = await fetch(url, {
    headers: { "Origin": "https://www.tradingview.com", "Referer": "https://www.tradingview.com/" },
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.result ?? []).map((e: any, i: number) => ({
    id: `tv-${e.id ?? i}`,
    title: e.title ?? "",
    currency: e.currency ?? "",
    country: e.country ?? "",
    utcDate: e.date ?? "",
    impact: (e.importance === 1 ? "High" : e.importance === 0 ? "Medium" : "Low") as any,
    forecast: e.forecastRaw != null ? `${e.forecastRaw}${e.unit ?? ""}` : "",
    previous: e.previousRaw != null ? `${e.previousRaw}${e.unit ?? ""}` : "",
    actual: e.actualRaw != null ? `${e.actualRaw}${e.unit ?? ""}` : "",
    isBetter: e.actualRaw != null && e.forecastRaw != null && e.actualRaw > e.forecastRaw,
    isWorse: e.actualRaw != null && e.forecastRaw != null && e.actualRaw < e.forecastRaw,
    allDay: false,
  }));
}

function getWeekRange(week: "last" | "this" | "next") {
  const now = new Date();
  const dow = now.getUTCDay();
  const mon = new Date(now);
  mon.setUTCDate(now.getUTCDate() - (dow === 0 ? 6 : dow - 1));
  mon.setUTCHours(0, 0, 0, 0);
  const offset = week === "last" ? -7 : week === "next" ? 7 : 0;
  const start = new Date(mon);
  start.setUTCDate(mon.getUTCDate() + offset - 1);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { from: start.toISOString().substring(0, 10), to: end.toISOString().substring(0, 10) };
}

export async function GET(req: NextRequest) {
  const week = (req.nextUrl.searchParams.get("week") ?? "this") as "last" | "this" | "next";
  try {
    let events: CalendarEvent[];
    let source: string;

    if (week === "this") {
      events = await fetchFXStreet();
      source = "fxstreet";
    } else {
      const { from, to } = getWeekRange(week);
      events = await fetchTV(from, to);
      source = "tradingview";
    }

    events.sort((a, b) => a.utcDate.localeCompare(b.utcDate));
    return NextResponse.json({
      events, count: events.length, source,
      high: events.filter(e => e.impact === "High").length,
      medium: events.filter(e => e.impact === "Medium").length,
      low: events.filter(e => e.impact === "Low").length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, events: [] }, { status: 500 });
  }
}
