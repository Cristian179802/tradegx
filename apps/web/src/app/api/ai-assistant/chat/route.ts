import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { hasPro } from "@/lib/plan";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ─── Rate limiting (30 messages / hour / user) ────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const key = `chat:${userId}`;
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (entry.count >= 30) return false;
  entry.count++;
  return true;
}

// ─── Build trader context ─────────────────────────────────────────────────────
export interface TraderStats {
  userName: string;
  accountName: string;
  accountType: string;
  balance: string;
  initialBalance: string;
  accountPnl: number;
  accountPnlPct: string;
  totalTrades: number;
  winRate: string;
  profitFactor: string;
  netPnl: number;
  avgRR: string;
  avgWin: string;
  avgLoss: string;
  bestTrade: string;
  worstTrade: string;
  topSymbol: string;
  bestSetup: string;
  topMistakes: string;
  last5Trades: string;
  winStreak: number;
  lossStreak: number;
  longestWinStreak: number;
}

async function buildTraderStats(userId: string): Promise<TraderStats> {
  const [accounts, trades, user] = await Promise.all([
    prisma.tradingAccount.findMany({ where: { userId }, take: 1, orderBy: { createdAt: "asc" } }),
    prisma.trade.findMany({
      where: { account: { userId }, status: "CLOSED" },
      orderBy: { exitTime: "desc" },
      take: 500,
      include: { journalEntry: { select: { postMistakeTypes: true, preEmotionalState: true, postEmotionalState: true } } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ]);

  const n = trades.length;
  const pnl = (t: typeof trades[0]) => parseFloat(t.pnlMoney?.toString() ?? "0");

  const wins = trades.filter(t => pnl(t) > 0);
  const losses = trades.filter(t => pnl(t) < 0);
  const grossWin = wins.reduce((s, t) => s + pnl(t), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + pnl(t), 0));
  const netPnl = trades.reduce((s, t) => s + pnl(t), 0);
  const winRate = n > 0 ? ((wins.length / n) * 100).toFixed(1) : "0";
  const profitFactor = grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : wins.length > 0 ? "∞" : "0";
  const rrVals = trades.filter(t => t.riskRewardRatio).map(t => parseFloat(t.riskRewardRatio!.toString()));
  const avgRR = rrVals.length > 0 ? (rrVals.reduce((s, v) => s + v, 0) / rrVals.length).toFixed(2) : "N/A";
  const avgWin = wins.length > 0 ? (grossWin / wins.length).toFixed(2) : "0";
  const avgLoss = losses.length > 0 ? (grossLoss / losses.length).toFixed(2) : "0";

  const sorted = [...trades].sort((a, b) => pnl(b) - pnl(a));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  const symCount: Record<string, number> = {};
  trades.forEach(t => { symCount[t.symbol] = (symCount[t.symbol] || 0) + 1; });
  const topSymbol = Object.entries(symCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

  const setupPnl: Record<string, { pnl: number; w: number; l: number }> = {};
  trades.filter(t => t.setupType).forEach(t => {
    if (!setupPnl[t.setupType!]) setupPnl[t.setupType!] = { pnl: 0, w: 0, l: 0 };
    setupPnl[t.setupType!].pnl += pnl(t);
    if (pnl(t) > 0) setupPnl[t.setupType!].w++; else setupPnl[t.setupType!].l++;
  });
  const bestSetup = Object.entries(setupPnl).sort((a, b) => b[1].pnl - a[1].pnl)[0]?.[0] ?? "N/A";

  const mistakeCounts: Record<string, number> = {};
  trades.forEach(t => (t.journalEntry?.postMistakeTypes ?? []).forEach((m: string) => {
    mistakeCounts[m] = (mistakeCounts[m] || 0) + 1;
  }));
  const topMistakes = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([m, c]) => `${m} (${c}x)`).join(", ") || "fără date din jurnal";

  const last5Trades = trades.slice(0, 5).map(t =>
    `  ${pnl(t) >= 0 ? "✅" : "❌"} ${t.direction} ${t.symbol} | ${t.exitTime?.toISOString().slice(0, 10)} | ${pnl(t) >= 0 ? "+" : ""}${pnl(t).toFixed(2)} USD | Setup: ${t.setupType ?? "Manual"}`
  ).join("\n") || "  Nicio tranzacție recentă";

  // Streak calculation
  let curStreak = 0, maxWinStreak = 0, maxLossStreak = 0, curLossStreak = 0;
  [...trades].reverse().forEach(t => {
    if (pnl(t) > 0) {
      curStreak++;
      curLossStreak = 0;
      maxWinStreak = Math.max(maxWinStreak, curStreak);
    } else {
      curLossStreak++;
      curStreak = 0;
      maxLossStreak = Math.max(maxLossStreak, curLossStreak);
    }
  });

  const acc = accounts[0];
  const balNum = parseFloat(acc?.balance?.toString() ?? "0");
  const initNum = parseFloat(acc?.initialBalance?.toString() ?? "0");
  const accountPnl = balNum - initNum;
  const accountPnlPct = initNum > 0 ? ((accountPnl / initNum) * 100).toFixed(2) : "0";

  return {
    userName: user?.name ?? "Trader",
    accountName: acc?.name ?? "N/A",
    accountType: acc?.type ?? "N/A",
    balance: balNum.toFixed(2),
    initialBalance: initNum.toFixed(2),
    accountPnl, accountPnlPct,
    totalTrades: n, winRate, profitFactor, netPnl, avgRR, avgWin, avgLoss,
    bestTrade: best ? `+${pnl(best).toFixed(2)} USD (${best.symbol}, ${best.setupType ?? "N/A"})` : "N/A",
    worstTrade: worst ? `${pnl(worst).toFixed(2)} USD (${worst.symbol})` : "N/A",
    topSymbol, bestSetup, topMistakes, last5Trades,
    winStreak: curStreak, lossStreak: curLossStreak,
    longestWinStreak: maxWinStreak,
  };
}

function buildSystemPrompt(s: TraderStats, mode: string): string {
  return `Ești **TradeGX AI Coach** — un coach de trading de elită cu expertiză în Smart Money Concepts, ICT methodology, psihologie trading și risk management profesionist.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PROFIL: ${s.userName} | ${s.accountName} (${s.accountType})
💰 Sold curent: $${s.balance} | Sold inițial: $${s.initialBalance}
📈 P&L CONT: ${s.accountPnl >= 0 ? "+" : ""}$${s.accountPnl.toFixed(2)} (${s.accountPnlPct}%) ${s.accountPnl >= 0 ? "✅" : "❌"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 PERFORMANȚĂ TOTALĂ (${s.totalTrades} tranzacții înregistrate):
• Win Rate: ${s.winRate}% ${parseFloat(s.winRate) >= 55 ? "✅" : parseFloat(s.winRate) >= 45 ? "⚠️" : "❌"}
• Profit Factor: ${s.profitFactor} ${parseFloat(s.profitFactor) >= 1.5 ? "✅" : parseFloat(s.profitFactor) >= 1.0 ? "⚠️" : "❌"}
• Net P&L: ${s.netPnl >= 0 ? "+" : ""}$${s.netPnl.toFixed(2)} ${s.netPnl >= 0 ? "✅" : "❌"}
• R:R Mediu: ${s.avgRR}
• Medie câștig: +$${s.avgWin} | Medie pierdere: -$${s.avgLoss}
• Best trade: ${s.bestTrade}
• Worst trade: ${s.worstTrade}
• Symbol top: ${s.topSymbol}
• Setup profitabil: ${s.bestSetup}
• Serie câștigătoare max: ${s.longestWinStreak}
• Greșeli frecvente: ${s.topMistakes}

📋 ULTIMELE 5 TRANZACȚII:
${s.last5Trades}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 INSTRUCȚIUNI COACHING:
1. Analizează ÎNTOTDEAUNA bazat pe datele reale de mai sus — nu da sfaturi generice
2. Fii DIRECT și SPECIFIC — identifică exact problema și soluția concretă
3. Prioritizează problemele — ce are cel mai mare impact pe performanță
4. Folosește terminologie SMC/ICT când e relevant: Order Blocks, Fair Value Gaps, Liquidity Sweeps, BOS, ChoCH, POI
5. Răspunde în română (scurt, structurat, cu bullet points)
6. Fii mentor strict dar motivant — nu sugarcoat, dar nu demotiva
7. Când dai recomandări: CONTEXT → PROBLEMĂ → SOLUȚIE → ACȚIUNE CONCRETĂ${
    mode === "psychology"
      ? "\n\n🧠 SESIUNE PSIHOLOGIE: Focus pe patternuri comportamentale, disciplină, control emoțional, FOMO, revenge trading, overconfidence. Tehnici cognitive specifice."
      : mode === "risk"
      ? "\n\n⚡ SESIUNE RISK: Focus pe position sizing, drawdown protection, corelații între instrumente, reguli stop-loss, risk per setup. Calculează exact."
      : mode === "strategy"
      ? "\n\n📈 SESIUNE STRATEGIE SMC: Focus pe Order Blocks, FVG, Liquidity, sesiuni de tranzacționare, confluențe, execuție entry/exit. Specific pe datele traderului."
      : mode === "performance"
      ? "\n\n📊 SESIUNE ANALIZĂ: Deep dive în statistici — identifică exact ce aduce profit vs. ce distruge cont. Breakdown pe setup, sesiune, instrument, zi a săptămânii."
      : "\n\n🎯 SESIUNE GENERALĂ: Identifică și adresează cea mai importantă problemă din datele traderului."
  }`;
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  if (!(await hasPro(session.user.id))) {
    return Response.json({ error: "AI Assistant este disponibil doar in planul PRO", code: "PRO_REQUIRED", upgradeUrl: "/pricing" }, { status: 402 });
  }

  if (!checkRateLimit(session.user.id)) {
    return new Response(JSON.stringify({ error: "Ai atins limita de 30 mesaje/oră. Revino mai târziu." }), {
      status: 429, headers: { "Content-Type": "application/json" },
    });
  }

  let messages: { role: string; content: string }[];
  let mode = "general";
  try {
    ({ messages, mode = "general" } = await req.json());
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  // Early check — fail fast with clear error if key missing
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY lipsește din .env.local. Adaugă cheia și repornește serverul." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const stats = await buildTraderStats(session.user.id);
    const systemPrompt = buildSystemPrompt(stats, mode);

    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
        } catch (streamErr) {
          // Stream error — write error message into the response body so client can display it
          const msg = streamErr instanceof Error ? streamErr.message : "Eroare necunoscută API";
          console.error("[AI Stream]", streamErr);
          controller.enqueue(encoder.encode(`\n\n⚠️ Eroare: ${msg}`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-store" },
    });
  } catch (err) {
    console.error("[AI Chat]", err);
    const msg = err instanceof Error ? err.message : "Eroare necunoscută";
    return new Response(
      JSON.stringify({ error: `Eroare server: ${msg}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export type { TraderStats as TraderStatsType };
