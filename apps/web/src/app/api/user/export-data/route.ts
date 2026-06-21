import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const userId = session.user.id;

  const [user, accounts, trades, journal, watchlist, alerts, subscription] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        language: true,
        currency: true,
        theme: true,
        timezone: true,
        defaultRiskPct: true,
        maxTradesPerDay: true,
        noTradeDays: true,
        createdAt: true,
      },
    }),
    prisma.tradingAccount.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        type: true,
        broker: true,
        currency: true,
        balance: true,
        initialBalance: true,
        leverage: true,
        maxDailyLossPct: true,
        maxDrawdownPct: true,
        createdAt: true,
      },
    }),
    prisma.trade.findMany({
      where: { account: { userId } },
      include: {
        journalEntry: true,
        screenshots: { select: { url: true, type: true } },
      },
      orderBy: { entryTime: "desc" },
    }),
    prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.watchlistItem.findMany({
      where: { userId },
      select: { symbol: true, instrumentType: true, groupName: true },
    }),
    prisma.alert.findMany({
      where: { userId },
      select: { type: true, title: true, message: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true, status: true, currentPeriodEnd: true },
    }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    user: {
      ...user,
      defaultRiskPct: user?.defaultRiskPct?.toString(),
    },
    subscription,
    accounts: accounts.map((a) => ({
      ...a,
      balance: a.balance.toString(),
      initialBalance: a.initialBalance.toString(),
      maxDailyLossPct: a.maxDailyLossPct?.toString() ?? null,
      maxDrawdownPct: a.maxDrawdownPct?.toString() ?? null,
    })),
    trades: trades.map((t) => ({
      ...t,
      entryPrice: t.entryPrice.toString(),
      exitPrice: t.exitPrice?.toString() ?? null,
      lotSize: t.lotSize.toString(),
      stopLoss: t.stopLoss?.toString() ?? null,
      takeProfit: t.takeProfit?.toString() ?? null,
      pnlMoney: t.pnlMoney?.toString() ?? null,
      pnlPercent: t.pnlPercent?.toString() ?? null,
      pnlPips: t.pnlPips?.toString() ?? null,
      commission: t.commission?.toString() ?? null,
      swap: t.swap?.toString() ?? null,
      riskMoney: t.riskMoney?.toString() ?? null,
      riskPercent: t.riskPercent?.toString() ?? null,
      riskRewardRatio: t.riskRewardRatio?.toString() ?? null,
    })),
    journalEntries: journal,
    watchlist,
    recentAlerts: alerts,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="TradeGX-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
