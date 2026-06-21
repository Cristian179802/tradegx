import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// ── Agregator de știri Forex/macro din feed-uri RSS publice ──────────────────
// Server-side cu cache 5 min, ca să nu lovim sursele la fiecare cerere.

type Impact = "HIGH" | "MEDIUM" | "LOW";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;       // ISO
  description: string;
  impact: Impact;
}

// Clasificare impact pe baza cuvintelor cheie macro (limbaj de știri financiare)
const HIGH_KW = [
  "nfp", "non-farm", "nonfarm", "payroll", "cpi", "inflation", "fomc", "fed ", "federal reserve",
  "interest rate", "rate decision", "rate hike", "rate cut", "gdp", "unemployment", "jobs report",
  "ecb", "boe", "boj", "central bank", "recession", "powell", "lagarde", "ppi", "core pce",
];
const MEDIUM_KW = [
  "pmi", "retail sales", "consumer confidence", "consumer sentiment", "manufacturing", "trade balance",
  "housing", "durable goods", "ism", "earnings", "jobless claims", "industrial production", "wages",
];

function classifyImpact(text: string): Impact {
  const t = text.toLowerCase();
  if (HIGH_KW.some((k) => t.includes(k))) return "HIGH";
  if (MEDIUM_KW.some((k) => t.includes(k))) return "MEDIUM";
  return "LOW";
}

const FEEDS: Array<{ url: string; source: string }> = [
  { url: "https://www.investing.com/rss/news_1.rss",        source: "Investing.com" },
  { url: "https://www.investing.com/rss/news_285.rss",      source: "Investing — Forex" },
  { url: "https://nfs.faireconomy.media/ff_calendar_thisweek.xml", source: "ForexFactory" },
];

let CACHE: { at: number; items: NewsItem[] } | null = null;
const TTL_MS = 5 * 60_000;

// Decodare entități HTML uzuale + CDATA + curățare taguri
function clean(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? clean(m[1]) : "";
}

async function fetchFeed(url: string, source: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; tradegx-news/1.0)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      signal: AbortSignal.timeout(7_000),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const items: NewsItem[] = [];
    const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
    for (const block of blocks.slice(0, 15)) {
      const title = tag(block, "title");
      if (!title) continue;
      const link = tag(block, "link") || (block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ?? "").trim();
      const pub = tag(block, "pubDate");
      const desc = tag(block, "description");
      let iso = new Date().toISOString();
      if (pub) { const d = new Date(pub); if (!isNaN(d.getTime())) iso = d.toISOString(); }
      items.push({
        title,
        link: link || "#",
        source,
        pubDate: iso,
        description: desc.slice(0, 180),
        impact: classifyImpact(`${title} ${desc}`),
      });
    }
    return items;
  } catch {
    return [];
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  if (CACHE && Date.now() - CACHE.at < TTL_MS) {
    return NextResponse.json({ items: CACHE.items, cached: true });
  }

  const results = await Promise.allSettled(FEEDS.map((f) => fetchFeed(f.url, f.source)));
  let items: NewsItem[] = [];
  for (const r of results) if (r.status === "fulfilled") items = items.concat(r.value);

  // Sortează descrescător după dată, deduplică pe titlu, păstrează primele 20
  const seen = new Set<string>();
  items = items
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .filter((it) => {
      const key = it.title.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 20);

  if (items.length > 0) {
    CACHE = { at: Date.now(), items };
  }

  return NextResponse.json({ items, cached: false });
}
