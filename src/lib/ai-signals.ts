import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { broadcastTelegram, sendToBroadcastChats, escapeHtml } from "@/lib/telegram";

// ── Generator zilnic de semnale AI (HPS — High Probability Setups) ───────────
// Maxim 3 semnale pe zi, generate o singură dată (lazy), pe baza prețurilor reale.

export interface MarketSnapshot {
  symbol: string;
  instrument: "FOREX" | "CRYPTO" | "METALS" | "INDICES";
  price: number;
  high24: number;
  low24: number;
  changePct: number;
}

// Data curentă în format YYYY-MM-DD (UTC) — toți utilizatorii văd aceleași semnale
export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Surse de preț (server-side) ───────────────────────────────────────────────
const YAHOO: Record<string, { sym: string; instrument: MarketSnapshot["instrument"] }> = {
  "EUR/USD": { sym: "EURUSD=X", instrument: "FOREX" },
  "GBP/USD": { sym: "GBPUSD=X", instrument: "FOREX" },
  "USD/JPY": { sym: "USDJPY=X", instrument: "FOREX" },
  "AUD/USD": { sym: "AUDUSD=X", instrument: "FOREX" },
  "USD/CAD": { sym: "USDCAD=X", instrument: "FOREX" },
  "GBP/JPY": { sym: "GBPJPY=X", instrument: "FOREX" },
  "XAU/USD": { sym: "GC=F",     instrument: "METALS" },
  "US30":    { sym: "^DJI",     instrument: "INDICES" },
  "NAS100":  { sym: "^NDX",     instrument: "INDICES" },
};

async function fetchYahoo(label: string, ySym: string, instrument: MarketSnapshot["instrument"]): Promise<MarketSnapshot | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySym)}?interval=1h&range=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36" },
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    const price = Number(meta.regularMarketPrice);
    const prev = Number(meta.chartPreviousClose ?? price);
    return {
      symbol: label,
      instrument,
      price,
      high24: Number(meta.regularMarketDayHigh ?? price),
      low24: Number(meta.regularMarketDayLow ?? price),
      changePct: prev > 0 ? ((price - prev) / prev) * 100 : 0,
    };
  } catch {
    return null;
  }
}

async function fetchBinance(label: string, bnSym: string): Promise<MarketSnapshot | null> {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${bnSym}`, {
      signal: AbortSignal.timeout(6_000), cache: "no-store",
    });
    if (!res.ok) return null;
    const d = await res.json();
    const price = Number(d.lastPrice);
    if (!price) return null;
    return {
      symbol: label, instrument: "CRYPTO", price,
      high24: Number(d.highPrice ?? price), low24: Number(d.lowPrice ?? price),
      changePct: Number(d.priceChangePercent ?? 0),
    };
  } catch {
    return null;
  }
}

export async function fetchMarketSnapshot(): Promise<MarketSnapshot[]> {
  const tasks: Promise<MarketSnapshot | null>[] = [
    ...Object.entries(YAHOO).map(([label, { sym, instrument }]) => fetchYahoo(label, sym, instrument)),
    fetchBinance("BTC/USD", "BTCUSDT"),
    fetchBinance("ETH/USD", "ETHUSDT"),
  ];
  const results = await Promise.allSettled(tasks);
  const out: MarketSnapshot[] = [];
  for (const r of results) if (r.status === "fulfilled" && r.value) out.push(r.value);
  return out;
}

// ── Generare cu Anthropic ─────────────────────────────────────────────────────
interface RawSignal {
  symbol: string;
  instrumentType: string;
  direction: "BUY" | "SELL";
  timeframe: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  takeProfit2?: number;
  confidence: number;
  setupType?: string;
  bias?: string;
  session?: string;
  rationale: string;
  confirmation: string;
  invalidation?: string;
}

const VALID_TF = ["M5", "M15", "M30", "H1", "H4", "D1"];
const VALID_SETUP = ["ORDER_BLOCK", "FAIR_VALUE_GAP", "LIQUIDITY_SWEEP", "BOS", "CHOCH", "BREAKER", "MITIGATION", "REJECTION", "TREND_FOLLOW", "SCALP", "OTHER"];
const VALID_SESSION = ["ASIAN", "LONDON", "NEW_YORK", "OVERLAP"];
const VALID_INSTR = ["FOREX", "CRYPTO", "METALS", "INDICES", "COMMODITIES", "STOCKS", "CFD"];

function pickEnum(val: string | undefined, allowed: string[], fallback: string): string {
  if (!val) return fallback;
  const up = val.toUpperCase().replace(/[^A-Z_]/g, "_");
  return allowed.includes(up) ? up : fallback;
}

export async function generateDailySignals(date: string): Promise<number> {
  if (!process.env.ANTHROPIC_API_KEY) return 0;

  const snapshot = await fetchMarketSnapshot();
  if (snapshot.length === 0) return 0;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const marketTable = snapshot
    .map((s) => `${s.symbol} (${s.instrument}): preț=${s.price}, high24h=${s.high24}, low24h=${s.low24}, variație24h=${s.changePct.toFixed(2)}%`)
    .join("\n");

  const system = `Ești un analist instituțional de trading de elită, specializat în Smart Money Concepts (SMC) și metodologia ICT. Generezi semnale de tip "High Probability Setup" (HPS) bazate pe acțiunea prețului, structura pieței, lichiditate, order blocks, fair value gaps și sesiuni de tranzacționare.

Generezi MAXIM 3 dintre cele mai bune setup-uri ale zilei, alese din instrumentele disponibile. Selectezi DOAR setup-urile cu confluență ridicată — calitate peste cantitate. Dacă piața nu oferă setup-uri bune, poți returna mai puține de 3.

REGULI STRICTE pentru fiecare semnal:
- entryPrice, stopLoss, takeProfit trebuie să fie niveluri REALISTE raportate la prețul curent și la high/low-ul de 24h
- Pentru BUY: stopLoss SUB entry, takeProfit PESTE entry. Pentru SELL: invers.
- Risk:Reward minim 1.5, ideal 2-3
- confidence între 60 și 92 (niciodată 100 — nimic nu e sigur)
- rationale: 3-5 propoziții în română, explicând structura, lichiditatea vizată, confluența și DE CE setup-ul are probabilitate ridicată
- confirmation: ce confirmare concretă să aștepte traderul ÎNAINTE de intrare (ex: "Așteaptă un CHoCH pe M15 + retest al order block-ului H1")
- invalidation: ce invalidează ideea

Răspunzi DOAR cu JSON valid, fără text suplimentar, în formatul:
{"signals":[{"symbol":"EUR/USD","instrumentType":"FOREX","direction":"BUY","timeframe":"H4","entryPrice":1.0850,"stopLoss":1.0820,"takeProfit":1.0920,"takeProfit2":1.0960,"confidence":78,"setupType":"ORDER_BLOCK","bias":"Bullish","session":"LONDON","rationale":"...","confirmation":"...","invalidation":"..."}]}

Valori permise:
- timeframe: ${VALID_TF.join(", ")}
- setupType: ${VALID_SETUP.join(", ")}
- session: ${VALID_SESSION.join(", ")}
- instrumentType: ${VALID_INSTR.join(", ")}`;

  const user = `Date de piață live (${date}):\n${marketTable}\n\nGenerează maxim 3 HPS pentru ziua de azi. Returnează DOAR JSON.`;

  const resp = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 3000,
    system,
    messages: [{ role: "user", content: user }],
  });

  const text = resp.content.filter((c) => c.type === "text").map((c) => (c as { text: string }).text).join("");
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return 0;

  let parsed: { signals?: RawSignal[] };
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return 0;
  }

  const raw = (parsed.signals ?? []).slice(0, 3);
  if (raw.length === 0) return 0;

  // Validare + sanitizare înainte de inserare
  const priceBySym = new Map(snapshot.map((s) => [s.symbol, s.price]));

  const valid = raw.filter((s) => {
    if (!s.symbol || !s.direction || !s.entryPrice || !s.stopLoss || !s.takeProfit) return false;
    const isBuy = s.direction === "BUY";
    // Coerență direcție/niveluri
    if (isBuy && !(s.stopLoss < s.entryPrice && s.takeProfit > s.entryPrice)) return false;
    if (!isBuy && !(s.stopLoss > s.entryPrice && s.takeProfit < s.entryPrice)) return false;
    // Entry să fie aproape de prețul real (max 5% abatere) — protecție anti-halucinație
    const ref = priceBySym.get(s.symbol);
    if (ref && Math.abs(s.entryPrice - ref) / ref > 0.05) return false;
    return true;
  });

  if (valid.length === 0) return 0;

  await prisma.aiSignal.createMany({
    data: valid.map((s) => {
      const risk = Math.abs(s.entryPrice - s.stopLoss);
      const reward = Math.abs(s.takeProfit - s.entryPrice);
      const rr = risk > 0 ? reward / risk : 0;
      return {
        date,
        symbol: s.symbol,
        instrumentType: pickEnum(s.instrumentType, VALID_INSTR, "FOREX") as never,
        direction: s.direction as never,
        timeframe: pickEnum(s.timeframe, VALID_TF, "H4") as never,
        entryPrice: s.entryPrice,
        stopLoss: s.stopLoss,
        takeProfit: s.takeProfit,
        takeProfit2: s.takeProfit2 ?? null,
        riskReward: Math.min(99, +rr.toFixed(2)),
        confidence: Math.max(50, Math.min(95, Math.round(s.confidence || 70))),
        setupType: s.setupType ? (pickEnum(s.setupType, VALID_SETUP, "OTHER") as never) : null,
        bias: s.bias ?? (s.direction === "BUY" ? "Bullish" : "Bearish"),
        session: s.session ? (pickEnum(s.session, VALID_SESSION, "LONDON") as never) : null,
        rationale: s.rationale ?? "",
        confirmation: s.confirmation ?? "",
        invalidation: s.invalidation ?? null,
      };
    }),
  });

  // Difuzează semnalele pe Telegram către utilizatorii conectați (best-effort)
  try {
    await broadcastSignalsToTelegram(valid);
  } catch {
    /* eșec silențios — nu blocăm generarea */
  }

  return valid.length;
}

// Formatează și difuzează semnalele zilei pe Telegram
async function broadcastSignalsToTelegram(signals: RawSignal[]): Promise<void> {
  if (signals.length === 0) return;
  const lines = signals.map((s, i) => {
    const arrow = s.direction === "BUY" ? "🟢" : "🔴";
    return `${arrow} <b>${escapeHtml(s.symbol)}</b> ${s.direction} (${s.timeframe})\n` +
      `   🎯 Entry: <code>${s.entryPrice}</code>\n` +
      `   🛡️ SL: <code>${s.stopLoss}</code>  ✅ TP: <code>${s.takeProfit}</code>\n` +
      `   📊 Încredere: ${s.confidence}%${i < signals.length - 1 ? "\n" : ""}`;
  });
  const text =
    `📡 <b>Semnalele AI ale zilei — TradeGx</b>\n` +
    `<i>Maxim ${signals.length} setup-uri de înaltă probabilitate</i>\n\n` +
    lines.join("\n") +
    `\n\n⚠️ <i>Nu sunt sfaturi financiare. Vezi analiza completă în aplicație și tranzacționează responsabil.</i>`;
  // Difuzare către utilizatorii individuali + canalele/grupurile comunității
  await broadcastTelegram(text);
  await sendToBroadcastChats(text);
}

// ── Lock in-memory per instanță pentru a evita generarea concurentă ───────────
const generating = new Set<string>();

export async function getOrCreateTodaySignals() {
  const date = todayKey();

  const existing = await prisma.aiSignal.findMany({
    where: { date },
    orderBy: { confidence: "desc" },
  });
  if (existing.length > 0) return existing;

  // Evită generarea dublă în aceeași instanță
  if (generating.has(date)) {
    // Altcineva generează — așteaptă scurt și recitește
    await new Promise((r) => setTimeout(r, 1500));
    return prisma.aiSignal.findMany({ where: { date }, orderBy: { confidence: "desc" } });
  }

  generating.add(date);
  try {
    await generateDailySignals(date);
  } catch {
    /* eșec silențios — pagina va arăta stare goală */
  } finally {
    generating.delete(date);
  }

  return prisma.aiSignal.findMany({ where: { date }, orderBy: { confidence: "desc" } });
}
