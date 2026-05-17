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
  source: string;
}

const IMPACT_RANK: Record<string, number> = { High: 3, Medium: 2, Low: 1, Holiday: 0 };

// ─── 1. ForexFactory public feed ────────────────────────────────────────────
async function fetchFF(url: string): Promise<CalendarEvent[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data: any[] = await res.json();
    return (Array.isArray(data) ? data : []).map((e, i) => ({
      id: `ff-${(e.date ?? "") + i}`,
      title: e.title ?? "",
      currency: e.country ?? "",
      country: e.country ?? "",
      utcDate: e.date ? new Date(e.date).toISOString() : "",
      impact: ((e.impact ?? "").toLowerCase() === "high" ? "High"
             : (e.impact ?? "").toLowerCase() === "medium" ? "Medium"
             : (e.impact ?? "").toLowerCase() === "holiday" ? "Holiday"
             : "Low") as CalendarEvent["impact"],
      forecast: e.forecast ?? "",
      previous: e.previous ?? "",
      actual: e.actual ?? "",
      isBetter: false,
      isWorse: false,
      allDay: false,
      source: "ff",
    }));
  } catch { return []; }
}

// ─── 2. Investing.com (HTML parser) ─────────────────────────────────────────
const INV_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "X-Requested-With": "XMLHttpRequest",
  "Referer": "https://www.investing.com/economic-calendar/",
  "Accept": "application/json, text/javascript, */*; q=0.01",
  "Content-Type": "application/x-www-form-urlencoded",
  "Accept-Language": "en-US,en;q=0.9",
};

function parseInvestingHTML(html: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const rowRe = /<tr[^>]+id="eventRowId_(\d+)"[^>]+data-event-datetime="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = rowRe.exec(html)) !== null) {
    const [, rowId, datetime, body] = m;

    // Currency (3-letter code after flag span)
    const currM = body.match(/ceFlags[^>]*>[^<]*<\/span>\s*([A-Z]{2,4})/);
    const currency = currM?.[1]?.trim() ?? "";

    // Country
    const countryM = body.match(/title="([^"]+)"\s+class="ceFlags/);
    const country = countryM?.[1] ?? "";

    // Impact
    let impact: CalendarEvent["impact"] = "Low";
    if (body.includes('title="High Volatility Expected"') || body.includes('data-img_key="bull3"')) impact = "High";
    else if (body.includes('title="Moderate Volatility Expected"') || body.includes('data-img_key="bull2"')) impact = "Medium";

    // Event name
    const nameM = body.match(/class="[^"]*\bevent\b[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/);
    const title = nameM?.[1]?.replace(/\s+/g, " ").trim() ?? "";

    // Actual / Forecast / Previous
    const actualM   = body.match(new RegExp(`id="eventActual_${rowId}"[^>]*>([^<]*)<`));
    const forecastM = body.match(new RegExp(`id="eventForecast_${rowId}"[^>]*>([^<]*)<`));
    const previousM = body.match(new RegExp(`id="eventPrevious_${rowId}"[^>]*>[\\s\\S]*?(?:<span[^>]*>([^<]+)<|([^<]*))<`));

    const actual   = actualM?.[1]?.replace(/&nbsp;/g, "").trim() ?? "";
    const forecast = forecastM?.[1]?.replace(/&nbsp;/g, "").trim() ?? "";
    const previous = (previousM?.[1] ?? previousM?.[2] ?? "").replace(/&nbsp;/g, "").trim();

    if (!currency || !title) continue;

    // datetime: "2026/05/20 05:00:00" → ISO UTC
    const utcDate = datetime.replace(/(\d{4})\/(\d{2})\/(\d{2}) (\d{2}:\d{2}:\d{2})/, "$1-$2-$3T$4Z");

    events.push({
      id: `inv-${rowId}`,
      title,
      currency,
      country,
      utcDate,
      impact,
      forecast,
      previous,
      actual,
      isBetter: body.includes("greenFont") && !!actual,
      isWorse:  body.includes("redFont")   && !!actual,
      allDay: false,
      source: "investing",
    });
  }
  return events;
}

async function fetchInvesting(from: string, to: string): Promise<CalendarEvent[]> {
  const body = new URLSearchParams({
    dateFrom: from, dateTo: to,
    timeZone: "0", timeFilter: "timeOnly",
    currentTab: "custom", submitFilters: "1", limit_from: "0",
  });
  try {
    const res = await fetch(
      "https://www.investing.com/economic-calendar/Service/getCalendarFilteredData",
      { method: "POST", headers: INV_HEADERS, body: body.toString(), next: { revalidate: 180 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return parseInvestingHTML(json.data ?? "");
  } catch { return []; }
}

// ─── 3. FXStreet fallback ────────────────────────────────────────────────────
async function fetchFXStreet(): Promise<CalendarEvent[]> {
  try {
    const res = await fetch("https://calendar.fxstreet.com/eventdate/?gmt=0&rows=1000", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Referer": "https://www.fxstreet.com/economic-calendar",
        "Origin": "https://www.fxstreet.com",
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data: any[] = await res.json();
    return (Array.isArray(data) ? data : []).map((e, i) => ({
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
      source: "fxstreet",
    }));
  } catch { return []; }
}

// ─── Merge: take max impact across sources ───────────────────────────────────
// Match events by: same currency + similar time (±15min) + roughly same title
function normalizeTitle(t: string): string {
  return t.toLowerCase()
    .replace(/\s*\([^)]*\)/g, "")  // remove parentheses
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 30);
}

function mergeEvents(primary: CalendarEvent[], secondary: CalendarEvent[]): CalendarEvent[] {
  const merged = [...primary];
  const used = new Set<string>();

  for (const p of primary) {
    used.add(`${p.currency}-${p.utcDate.substring(0, 16)}`);
  }

  for (const s of secondary) {
    const key = `${s.currency}-${s.utcDate.substring(0, 16)}`;
    if (used.has(key)) {
      // Already have this event — upgrade impact if secondary is higher
      const existing = merged.find(e => e.currency === s.currency && e.utcDate.substring(0, 16) === s.utcDate.substring(0, 16));
      if (existing && IMPACT_RANK[s.impact] > IMPACT_RANK[existing.impact]) {
        existing.impact = s.impact;
      }
      // Also copy actual/forecast/previous if empty
      if (existing && !existing.actual && s.actual) existing.actual = s.actual;
      if (existing && !existing.forecast && s.forecast) existing.forecast = s.forecast;
      if (existing && !existing.previous && s.previous) existing.previous = s.previous;
    } else {
      // New event not in primary — add it
      merged.push(s);
      used.add(key);
    }
  }

  return merged;
}

function getWeekRange(week: "last" | "this" | "next") {
  const now = new Date();
  const dow = now.getUTCDay();
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - (dow === 0 ? 6 : dow - 1));
  monday.setUTCHours(0, 0, 0, 0);

  const offset = week === "last" ? -7 : week === "next" ? 7 : 0;
  const start = new Date(monday);
  start.setUTCDate(monday.getUTCDate() + offset - 1);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);

  return { from: start.toISOString().substring(0, 10), to: end.toISOString().substring(0, 10) };
}

export async function GET(req: NextRequest) {
  const week = (req.nextUrl.searchParams.get("week") ?? "this") as "last" | "this" | "next";
  const { from, to } = getWeekRange(week);

  const FF_URLS: Record<string, string> = {
    last: "https://nfs.faireconomy.media/ff_calendar_lastweek.json?version=latest",
    this: "https://nfs.faireconomy.media/ff_calendar_thisweek.json?version=latest",
    next: "https://nfs.faireconomy.media/ff_calendar_nextweek.json?version=latest",
  };

  // Fetch in parallel: ForexFactory + Investing.com
  const [ffEvents, invEvents] = await Promise.all([
    fetchFF(FF_URLS[week]),
    fetchInvesting(from, to),
  ]);

  let events: CalendarEvent[];
  let source: string;

  if (ffEvents.length > 0 && invEvents.length > 0) {
    // Best coverage: merge both, take max impact
    events = mergeEvents(ffEvents, invEvents);
    source = "ff+investing";
  } else if (ffEvents.length > 0) {
    events = ffEvents;
    source = "forexfactory";
  } else if (invEvents.length > 0) {
    events = invEvents;
    source = "investing";
  } else {
    // Last resort: FXStreet
    events = await fetchFXStreet();
    source = "fxstreet";
  }

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
