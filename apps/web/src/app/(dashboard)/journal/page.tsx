import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { JournalClient } from "./journal-client";

export const metadata: Metadata = { title: "Jurnal de Trading" };

export default async function JournalPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [accounts, rawTrades, wins, grossProfit, grossLoss, rrAgg] = await Promise.all([
    prisma.tradingAccount.findMany({
      where: { userId },
      select: { currency: true },
      orderBy: { createdAt: "asc" },
      take: 1,
    }),

    prisma.trade.findMany({
      where: { account: { userId }, status: "CLOSED" },
      orderBy: { exitTime: "desc" },
      take: 200,
      select: {
        id: true,
        symbol: true,
        direction: true,
        lotSize: true,
        entryPrice: true,
        exitPrice: true,
        entryTime: true,
        exitTime: true,
        pnlMoney: true,
        pnlPips: true,
        riskRewardRatio: true,
        setupType: true,
        timeframe: true,
        tags: true,
        status: true,
        journalEntry: {
          select: {
            preNotes: true,
            preEmotionalState: true,
            preConfidence: true,
            postNotes: true,
            postEmotionalState: true,
            postMistakeTypes: true,
            postLessons: true,
            aiAnalysis: true,
            aiScore: true,
          },
        },
      },
    }),

    prisma.trade.count({
      where: { account: { userId }, status: "CLOSED", pnlMoney: { gt: 0 } },
    }),

    prisma.trade.aggregate({
      where: { account: { userId }, status: "CLOSED", pnlMoney: { gt: 0 } },
      _sum: { pnlMoney: true },
    }),

    prisma.trade.aggregate({
      where: { account: { userId }, status: "CLOSED", pnlMoney: { lt: 0 } },
      _sum: { pnlMoney: true },
    }),

    prisma.trade.aggregate({
      where: { account: { userId }, status: "CLOSED", riskRewardRatio: { not: null } },
      _avg: { riskRewardRatio: true },
    }),
  ]);

  const totalTrades = rawTrades.length;
  const journaled = rawTrades.filter((t) => t.journalEntry).length;
  const losses = totalTrades - wins;
  const netPnl = Number(grossProfit._sum.pnlMoney ?? 0) + Number(grossLoss._sum.pnlMoney ?? 0);
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : null;
  const currency = accounts[0]?.currency ?? "USD";

  const trades = rawTrades.map((t) => ({
    id: t.id,
    symbol: t.symbol,
    direction: t.direction as "BUY" | "SELL",
    lotSize: Number(t.lotSize),
    entryPrice: Number(t.entryPrice),
    exitPrice: t.exitPrice !== null ? Number(t.exitPrice) : null,
    entryTime: new Date(t.entryTime).toISOString(),
    exitTime: t.exitTime ? new Date(t.exitTime).toISOString() : null,
    pnlMoney: t.pnlMoney !== null ? Number(t.pnlMoney) : null,
    pnlPips: t.pnlPips !== null ? Number(t.pnlPips) : null,
    riskRewardRatio: t.riskRewardRatio !== null ? Number(t.riskRewardRatio) : null,
    setupType: t.setupType,
    timeframe: t.timeframe,
    tags: t.tags,
    status: t.status,
    journal: t.journalEntry
      ? {
          preNotes: t.journalEntry.preNotes,
          preEmotionalState: t.journalEntry.preEmotionalState as string | null,
          preConfidence: t.journalEntry.preConfidence,
          postNotes: t.journalEntry.postNotes,
          postEmotionalState: t.journalEntry.postEmotionalState as string | null,
          postMistakeTypes: t.journalEntry.postMistakeTypes as string[],
          postLessons: t.journalEntry.postLessons,
          aiAnalysis: t.journalEntry.aiAnalysis,
          aiScore: t.journalEntry.aiScore !== null ? Number(t.journalEntry.aiScore) : null,
        }
      : null,
  }));

  return (
    <JournalClient
      trades={trades}
      stats={{
        totalTrades,
        journaled,
        wins,
        losses,
        netPnl,
        winRate,
        avgRR: rrAgg._avg.riskRewardRatio !== null ? Number(rrAgg._avg.riskRewardRatio) : null,
        bestDay: null,
        currency,
      }}
    />
  );
}
