import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit } from "@/lib/rate-limit";
import { hasPro, PRO_REQUIRED } from "@/lib/plan";

export const maxDuration = 60;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (!(await hasPro(session.user.id))) {
    return NextResponse.json(PRO_REQUIRED, { status: 402 });
  }

  // 10 AI analyses per user per hour
  const rl = await rateLimit(`ai-analyze:${session.user.id}`, { limit: 10, windowSecs: 60 * 60 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Ai atins limita de analize AI. Încearcă din nou mai târziu." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI coach neconfiguarat — lipsește ANTHROPIC_API_KEY" }, { status: 503 });
  }

  const { id } = await params;

  const trade = await prisma.trade.findFirst({
    where: { id, account: { userId: session.user.id } },
    include: {
      account: { select: { name: true, currency: true, balance: true } },
      journalEntry: true,
      screenshots: {
        select: { url: true, type: true, timeframe: true },
        orderBy: { createdAt: "asc" },
        take: 4, // limită de cost: max 4 imagini per analiză
      },
    },
  });

  if (!trade) return NextResponse.json({ error: "Trade negăsit" }, { status: 404 });

  const pnl = trade.pnlMoney ? Number(trade.pnlMoney) : null;
  const rr = trade.riskMoney && pnl
    ? (Math.abs(pnl) / Number(trade.riskMoney)).toFixed(2)
    : null;

  const prompt = buildPrompt(trade, pnl, rr, trade.screenshots.length);

  // AI VISION: screenshot-urile graficelor intră în analiză ca imagini —
  // Claude „vede" structura, intrarea și plasarea SL-ului pe chart-ul real.
  const content: Anthropic.ContentBlockParam[] = [
    { type: "text", text: prompt },
    ...trade.screenshots.map((s): Anthropic.ContentBlockParam => ({
      type: "image",
      source: { type: "url", url: s.url },
    })),
    ...(trade.screenshots.length > 0
      ? [{
          type: "text" as const,
          text: trade.screenshots
            .map((s, i) => `Imaginea ${i + 1}: captură tip ${s.type}${s.timeframe ? `, timeframe ${s.timeframe}` : ""}.`)
            .join("\n"),
        }]
      : []),
  ];

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    // Vision pe grafice cere un model puternic — funcție PRO, merită calitatea
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    messages: [{ role: "user", content }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  // Parse score from response (expect format: SCORE: X/10 somewhere in text)
  const scoreMatch = text.match(/SCOR[E]?:\s*(\d+(?:\.\d+)?)\s*\/\s*10/i);
  const score = scoreMatch ? Math.min(10, Math.max(1, parseFloat(scoreMatch[1]))) : null;

  // Upsert journal entry with AI analysis
  const journalData = {
    aiAnalysis: text,
    aiScore: score,
  };

  await prisma.journalEntry.upsert({
    where: { tradeId: id },
    create: { tradeId: id, userId: session.user.id, ...journalData },
    update: journalData,
  });

  return NextResponse.json({ analysis: text, score });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPrompt(trade: any, pnl: number | null, rr: string | null, screenshotCount: number): string {
  const journal = trade.journalEntry;
  const isWin = pnl !== null && pnl > 0;

  const visionInstructions = screenshotCount > 0
    ? `\n\n## Analiza graficelor (${screenshotCount} ${screenshotCount === 1 ? "captură atașată" : "capturi atașate"})
Analizează ATENT graficele atașate și comentează CONCRET ce vezi:
- structura pieței la momentul intrării (trend, range, BOS/CHoCH vizibile)
- calitatea punctului de intrare față de structură (zonă de valoare sau chase?)
- plasarea Stop Loss-ului față de structura vizibilă (protejat logic sau arbitrar?)
- confluențe vizibile (order blocks, FVG, niveluri S/R) sau lipsa lor
Leagă observațiile vizuale de datele trade-ului. Dacă imaginea nu e un grafic lizibil, spune-o direct.`
    : "";

  return `Ești un coach profesionist de trading cu expertiză în SMC (Smart Money Concepts) și ICT. Analizează acest trade și oferă feedback constructiv.${visionInstructions}

## Date trade
- **Simbol:** ${trade.symbol}
- **Direcție:** ${trade.direction}
- **Instrument:** ${trade.instrumentType}
- **Setup:** ${trade.setupType ?? "Nespecificat"}
- **Killzone:** ${trade.killzone ?? "Nespecificat"}
- **Timeframe:** ${trade.timeframe ?? "Nespecificat"}
- **Preț intrare:** ${Number(trade.entryPrice).toFixed(5)}
- **Preț ieșire:** ${trade.exitPrice ? Number(trade.exitPrice).toFixed(5) : "—"}
- **Stop Loss:** ${trade.stopLoss ? Number(trade.stopLoss).toFixed(5) : "—"}
- **Take Profit:** ${trade.takeProfit ? Number(trade.takeProfit).toFixed(5) : "—"}
- **Volum:** ${Number(trade.lotSize).toFixed(2)} loturi
- **P&L:** ${pnl !== null ? (isWin ? "+" : "") + pnl.toFixed(2) + " " + trade.account.currency : "—"}
- **Risc:** ${trade.riskMoney ? Number(trade.riskMoney).toFixed(2) + " " + trade.account.currency + " (" + Number(trade.riskPercent ?? 0).toFixed(2) + "%)" : "—"}
- **R:R realizat:** ${rr ? "1:" + rr : "—"}
- **Durată:** ${trade.durationMinutes ? trade.durationMinutes + " minute" : "—"}

## Jurnal
- **Stare emoțională (pre):** ${journal?.preEmotionalState ?? "Necompletată"}
- **Încredere (pre):** ${journal?.preConfidence ? journal.preConfidence + "/10" : "Necompletată"}
- **Note pre-trade:** ${journal?.preNotes ?? "—"}
- **Stare emoțională (post):** ${journal?.postEmotionalState ?? "Necompletată"}
- **Greșeli identificate:** ${journal?.postMistakeTypes?.length ? journal.postMistakeTypes.join(", ") : "Niciuna"}
- **Lecții:** ${journal?.postLessons ?? "—"}

## Instrucțiuni
Oferă o analiză concisă în română (max 300 cuvinte) cu:
1. **Ce a mers bine** (dacă e cazul)
2. **Ce poate fi îmbunătățit** — specific, acționabil
3. **Aspecte psihologice** dacă jurnalul indică probleme
4. **Recomandare principală** pentru tradeuri similare

La final, pe o linie separată, acordă un scor obiectiv:
SCORE: X/10

Fii direct și constructiv. Nu repeta datele numerice din trade.`.trim();
}
