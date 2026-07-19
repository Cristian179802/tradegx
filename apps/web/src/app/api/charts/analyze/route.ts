import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAuthUserId } from "@/lib/auth-bridge";
import { hasPro, PRO_REQUIRED } from "@/lib/plan";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { fetchHistoricalCandles } from "@/lib/yahoo-finance";

export const runtime = "nodejs";
export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// TV interval → timeframe intern (yahoo-finance INTERVAL_MAP)
const TF_MAP: Record<string, { tf: string; days: number; label: string }> = {
  "1":   { tf: "M5",  days: 3,   label: "M5"  }, // 1m nu există pe Yahoo — M5 e suficient pt analiză
  "5":   { tf: "M5",  days: 3,   label: "M5"  },
  "15":  { tf: "M15", days: 7,   label: "M15" },
  "30":  { tf: "M30", days: 14,  label: "M30" },
  "60":  { tf: "H1",  days: 30,  label: "H1"  },
  "240": { tf: "H4",  days: 90,  label: "H4"  },
  "D":   { tf: "D1",  days: 365, label: "D1"  },
  "W":   { tf: "W1",  days: 365 * 3, label: "W1" },
};

function ema(values: number[], period: number): number {
  const k = 2 / (period + 1);
  let e = values[0]!;
  for (let i = 1; i < values.length; i++) e = values[i]! * k + e * (1 - k);
  return e;
}

function atr(candles: { high: number; low: number; close: number }[], period = 14): number {
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i]!, p = candles[i - 1]!;
    trs.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));
  }
  const last = trs.slice(-period);
  return last.reduce((s, v) => s + v, 0) / Math.max(1, last.length);
}

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (!(await hasPro(userId))) return NextResponse.json(PRO_REQUIRED, { status: 402 });

  // Costă tokeni AI → limită sănătoasă per utilizator
  const rl = await rateLimit(`chart-analyze:${userId}`, { limit: 15, windowSecs: 3600 });
  if (!rl.success) {
    return NextResponse.json({ error: "Prea multe analize. Reîncearcă peste puțin timp.", code: "RATE_LIMIT" }, { status: 429 });
  }

  let body: { symbol?: string; timeframe?: string; locale?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Cerere invalidă" }, { status: 400 }); }

  const symbol = (body.symbol ?? "EURUSD").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const tfCfg = TF_MAP[body.timeframe ?? "60"] ?? TF_MAP["60"]!;
  const lang = body.locale === "en" ? "en" : "ro";

  // ── 1. Lumânări reale ──
  const end = new Date();
  const start = new Date(end.getTime() - tfCfg.days * 864e5);
  let candles: Awaited<ReturnType<typeof fetchHistoricalCandles>> = [];
  try {
    candles = await fetchHistoricalCandles(symbol, tfCfg.tf, start, end);
  } catch {
    candles = [];
  }
  if (!candles || candles.length < 30) {
    return NextResponse.json({ error: "Nu am putut obține date de preț pentru acest simbol.", code: "NO_DATA" }, { status: 422 });
  }

  const recent = candles.slice(-200);
  const closes = recent.map((c) => c.close);
  const lastClose = closes[closes.length - 1]!;
  const ema20 = ema(closes.slice(-80), 20);
  const ema50 = ema(closes, 50);
  const atr14 = atr(recent);
  const win50 = recent.slice(-50);
  const swingHigh = Math.max(...win50.map((c) => c.high));
  const swingLow = Math.min(...win50.map((c) => c.low));
  const changePct = ((lastClose - closes[0]!) / closes[0]!) * 100;

  // OHLC compact pentru model (ultimele 60)
  const digits = lastClose > 500 ? 1 : lastClose > 10 ? 3 : 5;
  const series = recent.slice(-60).map((c) =>
    [c.open, c.high, c.low, c.close].map((v) => v.toFixed(digits)).join(",")
  ).join(" | ");

  // ── 2. Istoricul personal pe simbol (diferențiatorul) ──
  const symbolVariants = [symbol, symbol.replace(/(...)(...)/, "$1/$2")]; // EURUSD + EUR/USD
  const myTrades = await prisma.trade.findMany({
    where: { account: { userId }, symbol: { in: symbolVariants }, status: "CLOSED" },
    select: { pnlMoney: true, direction: true, journalEntry: { select: { postMistakeTypes: true } } },
    take: 300,
  });
  let personal = "";
  if (myTrades.length >= 3) {
    const wins = myTrades.filter((t) => Number(t.pnlMoney ?? 0) > 0).length;
    const net = myTrades.reduce((s, t) => s + Number(t.pnlMoney ?? 0), 0);
    const buys = myTrades.filter((t) => t.direction === "BUY").length;
    const mistakes: Record<string, number> = {};
    for (const t of myTrades) for (const m of t.journalEntry?.postMistakeTypes ?? []) mistakes[m] = (mistakes[m] ?? 0) + 1;
    const topMistake = Object.entries(mistakes).sort((a, b) => b[1] - a[1])[0]?.[0];
    personal = `Istoric personal pe ${symbol}: ${myTrades.length} tranzacții închise, win rate ${((wins / myTrades.length) * 100).toFixed(0)}%, PnL net ${net.toFixed(0)} USD, ${buys} BUY / ${myTrades.length - buys} SELL${topMistake ? `, greșeala frecventă: ${topMistake}` : ""}.`;
  }

  // ── 3. Claude ──
  const langLine = lang === "en"
    ? "Write ALL text values in English."
    : "Scrie TOATE valorile text în română.";

  const prompt = `Ești un analist instituțional SMC/ICT. Analizează DOAR datele de mai jos (nu inventa prețuri).

Simbol: ${symbol} · Timeframe: ${tfCfg.label}
Ultimul preț: ${lastClose.toFixed(digits)} · Variație pe fereastră: ${changePct.toFixed(2)}%
EMA20: ${ema20.toFixed(digits)} · EMA50: ${ema50.toFixed(digits)} · ATR14: ${atr14.toFixed(digits)}
Swing high (50): ${swingHigh.toFixed(digits)} · Swing low (50): ${swingLow.toFixed(digits)}
Ultimele 60 lumânări (O,H,L,C): ${series}
${personal}

Răspunde EXCLUSIV cu JSON valid (fără backticks), exact cu structura:
{"bias":"BULLISH"|"BEARISH"|"RANGE","confidence":<0-100>,"summary":"<2-3 fraze: citirea generală>","structure":"<1-2 fraze: structura SMC (BOS/CHoCH, zone de interes) dedusă din serie>","keyLevels":[{"price":"<nivel>","type":"support"|"resistance"|"liquidity"}] (2-4 niveluri),"plan":"<1-2 fraze: ce să aștepte traderul înainte să acționeze>","personalNote":"<1-2 fraze bazate pe istoricul personal; dacă nu există istoric, sfat de disciplină scurt>"}
${langLine} Educațional, nu sfat financiar — nu include disclaimere în text.`;

  try {
    const msg = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1200,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: prompt }],
    });

    const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    } catch {
      parsed = { bias: "RANGE", confidence: 50, summary: text.slice(0, 500), structure: "", keyLevels: [], plan: "", personalNote: "" };
    }

    return NextResponse.json({
      ok: true,
      symbol,
      timeframe: tfCfg.label,
      price: lastClose.toFixed(digits),
      analysis: parsed,
      hasPersonal: personal.length > 0,
    });
  } catch {
    return NextResponse.json({ error: "Analiza AI a eșuat. Încearcă din nou.", code: "AI_ERROR" }, { status: 502 });
  }
}
