import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AIChatClient } from "./chat-client";
import type { TraderStatsType } from "@/app/api/ai-assistant/chat/route";

export const metadata: Metadata = { title: "AI Coach — TradeGX" };

async function getTraderStats(userId: string): Promise<TraderStatsType> {
  const [accounts, trades, user] = await Promise.all([
    prisma.tradingAccount.findMany({ where: { userId }, take: 1, orderBy: { createdAt: "asc" } }),
    prisma.trade.findMany({
      where: { account: { userId }, status: "CLOSED" },
      orderBy: { exitTime: "desc" },
      take: 500,
      include: { journalEntry: { select: { postMistakeTypes: true } } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ]);

  const n = trades.length;
  const getPnl = (t: typeof trades[0]) => parseFloat(t.pnlMoney?.toString() ?? "0");
  const wins = trades.filter(t => getPnl(t) > 0);
  const losses = trades.filter(t => getPnl(t) < 0);
  const grossWin = wins.reduce((s, t) => s + getPnl(t), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + getPnl(t), 0));
  const netPnl = trades.reduce((s, t) => s + getPnl(t), 0);
  const winRate = n > 0 ? ((wins.length / n) * 100).toFixed(1) : "0";
  const profitFactor = grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : wins.length > 0 ? "∞" : "0";
  const rrVals = trades.filter(t => t.riskRewardRatio).map(t => parseFloat(t.riskRewardRatio!.toString()));
  const avgRR = rrVals.length > 0 ? (rrVals.reduce((s, v) => s + v, 0) / rrVals.length).toFixed(2) : "N/A";
  const avgWin = wins.length > 0 ? (grossWin / wins.length).toFixed(2) : "0";
  const avgLoss = losses.length > 0 ? (grossLoss / losses.length).toFixed(2) : "0";

  const sorted = [...trades].sort((a, b) => getPnl(b) - getPnl(a));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  const symCount: Record<string, number> = {};
  trades.forEach(t => { symCount[t.symbol] = (symCount[t.symbol] || 0) + 1; });
  const topSymbol = Object.entries(symCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

  const setupPnl: Record<string, number> = {};
  trades.filter(t => t.setupType).forEach(t => {
    setupPnl[t.setupType!] = (setupPnl[t.setupType!] || 0) + getPnl(t);
  });
  const bestSetup = Object.entries(setupPnl).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

  const mistakeCounts: Record<string, number> = {};
  trades.forEach(t =>
    (t.journalEntry?.postMistakeTypes ?? []).forEach((m: string) => {
      mistakeCounts[m] = (mistakeCounts[m] || 0) + 1;
    })
  );
  const topMistakes = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([m, c]) => `${m} (${c}x)`).join(", ") || "fără date din jurnal";

  const last5Trades = trades.slice(0, 5).map(t =>
    `  ${getPnl(t) >= 0 ? "✅" : "❌"} ${t.direction} ${t.symbol} | ${t.exitTime?.toISOString().slice(0, 10)} | ${getPnl(t) >= 0 ? "+" : ""}${getPnl(t).toFixed(2)} USD | Setup: ${t.setupType ?? "Manual"}`
  ).join("\n") || "  Nicio tranzacție recentă";

  let curStreak = 0, maxWinStreak = 0, curLossStreak = 0;
  [...trades].reverse().forEach(t => {
    if (getPnl(t) > 0) { curStreak++; curLossStreak = 0; maxWinStreak = Math.max(maxWinStreak, curStreak); }
    else { curLossStreak++; curStreak = 0; }
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
    bestTrade: best ? `+${getPnl(best).toFixed(2)} USD (${best.symbol}, ${best.setupType ?? "N/A"})` : "N/A",
    worstTrade: worst ? `${getPnl(worst).toFixed(2)} USD (${worst.symbol})` : "N/A",
    topSymbol, bestSetup, topMistakes, last5Trades,
    winStreak: curStreak, lossStreak: curLossStreak, longestWinStreak: maxWinStreak,
  };
}

export default async function AIAssistantPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const stats = await getTraderStats(session.user.id);

  return <AIChatClient stats={stats} />;
}
