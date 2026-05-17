import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FXS_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Referer": "https://www.fxstreet.com/economic-calendar",
  "Origin": "https://www.fxstreet.com",
};

const TV_HEADERS = {
  "Origin": "https://www.tradingview.com",
  "Referer": "https://www.tradingview.com/",
};

export interface CalendarEvent {
  id: string;
  title: string;
  currency: string;
  country: string;
  utcDate: string;        // ISO UTC datetime
  impact: "High" | "Medium" | "Low" | "Holiday";
  forecast: string;
  previous: string;
  actual: string;
  isBetter: boolean;
  isWorse: boolean;
  allDay: boolean;
  source: "fxstreet" | "tradingview";
}

// FXStreet: Volatility 3=High, 2=Medium, 1=Low
function fxsImpact(v: number): CalendarEvent["impact"] {
  if (v >= 3) return "High";
  if (v === 2) return "Medium";
  if (v === 0) return "Holiday";
  return "Low";
}

// TradingView: importance 1=High, 0=Medium, -1=Low
function tvImpact(v: number): CalendarEvent["impact"] {
  if (v === 1) return "High";
  if (v === 0) return "Medium";
  if (v === -1) return "Low";
  return "Holiday";
}

function fmtNum(v: number | null | undefined, precision = 2, unit = ""): string {
  if (v == null) return "";
  return `${Number(v).toFixed(precision)}${unit}`;
}

// FXStreet — most accurate, current week only
async function fetchFXStreet(): Promise<CalendarEvent[]> {
  try {
    const res = await fetch("https://calendar.fxstreet.com/eventdate/?gmt=0&rows=1000", {
      headers: FXS_HEADERS,
      next: { revalidate: 120 }, // 2-min cache
    });
    if (!res.ok) return [];
    const data: any[] = await res.json();
    return (Array.isArray(data) ? data : []).map((e, i) => {
      const unit = e.Unit ?? "";
      const precision = e.Precision ?? 2;
      return {
        id: `fxs-${e.IdEcoCalendarDate ?? i}`,
        title: e.Name ?? "",
        currency: e.Currency ?? "",
        country: e.Country ?? "",
        utcDate: e.DateTime?.Date ?? "",
        impact: fxsImpact(e.Volatility ?? 1),
        forecast: e.DisplayConsensus ?? fmtNum(e.Consensus, precision, unit),
        previous: e.DisplayPrevious ?? fmtNum(e.Previous, precision, unit),
        actual: e.DisplayActual ?? fmtNum(e.Actual, precision, unit),
        isBetter: e.Better === true,
        isWorse: e.Worst === true,
        allDay: e.AllDay === true,
        source: "fxstreet" as const,
      };
    });
  } catch { return []; }
}

// TradingView — any date range, used for prev/next week
async function fetchTradingView(from: string, to: string): Promise<CalendarEvent[]> {
  try {
    const url = `https://economic-calendar.tradingview.com/events?from=${from}T00:00:00.000Z&to=${to}T23:59:59.000Z&countries=US,EU,GB,JP,CA,AU,NZ,CH&importance=-1,0,1`;
    const res = await fetch(url, {
      headers: TV_HEADERS,
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list: any[] = data.result ?? [];
    return list.map((e, i) => ({
      id: `tv-${e.id ?? i}`,
      title: e.title ?? "",
      currency: e.currency ?? "",
      country: e.country ?? "",
      utcDate: e.date ?? "",
      impact: tvImpact(e.importance ?? -1),
      forecast: e.forecastRaw != null ? `${e.forecastRaw}${e.unit ?? ""}` : "",
      previous: e.previousRaw != null ? `${e.previousRaw}${e.unit ?? ""}` : "",
      actual: e.actualRaw != null ? `${e.actualRaw}${e.unit ?? ""}` : "",
      isBetter: e.actualRaw != null && e.forecastRaw != null && e.actualRaw > e.forecastRaw,
      isWorse: e.actualRaw != null && e.forecastRaw != null && e.actualRaw < e.forecastRaw,
      allDay: false,
      source: "tradingview" as const,
    }));
  } catch { return []; }
}

function getWeekRange(week: "last" | "this" | "next"): { from: string; to: string } {
  const now = new Date();
  const dow = now.getUTCDay();
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - (dow === 0 ? 6 : dow - 1));
  monday.setUTCHours(0, 0, 0, 0);

  const offset = week === "last" ? -7 : week === "next" ? 7 : 0;
  const start = new Date(monday);
  start.setUTCDate(monday.getUTCDate() + offset - 1); // -1 to include Sunday
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);

  return {
    from: start.toISOString().substring(0, 10),
    to:   end.toISOString().substring(0, 10),
  };
}

export async function GET(req: NextRequest) {
  const week = (req.nextUrl.searchParams.get("week") ?? "this") as "last" | "this" | "next";

  let events: CalendarEvent[];
  let source: string;

  if (week === "this") {
    // FXStreet is most accurate for current week (same quality as MyFXBook)
    events = await fetchFXStreet();
    source = "fxstreet";

    // If FXStreet fails, fallback to TradingView
    if (events.length === 0) {
      const { from, to } = getWeekRange("this");
      events = await fetchTradingView(from, to);
      source = "tradingview";
    }
  } else {
    // Previous/next week via TradingView
    const { from, to } = getWeekRange(week);
    events = await fetchTradingView(from, to);
    source = "tradingview";
  }

  // Sort by UTC date
  events.sort((a, b) => a.utcDate.localeCompare(b.utcDate));

  return NextResponse.json({
    events,
    count: events.length,
    source,
    high: events.filter(e => e.impact === "High").length,
    medium: events.filter(e => e.impact === "Medium").length,
    low: events.filter(e => e.impact === "Low").length,
  });
}
