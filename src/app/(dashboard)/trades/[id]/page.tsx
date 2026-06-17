import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { TradeDetailClient } from "./trade-detail-client";
import { signShareToken } from "@/lib/share";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const trade = await prisma.trade.findUnique({
    where: { id },
    select: { symbol: true, direction: true },
  });
  return { title: trade ? `${trade.symbol} ${trade.direction}` : "Trade" };
}

export default async function TradeDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const trade = await prisma.trade.findFirst({
    where: { id, account: { userId: session.user.id } },
    include: {
      account: { select: { id: true, name: true, currency: true, balance: true } },
      journalEntry: true,
      screenshots: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!trade) notFound();

  const serialized = {
    ...trade,
    entryPrice: trade.entryPrice.toString(),
    exitPrice: trade.exitPrice?.toString() ?? null,
    lotSize: trade.lotSize.toString(),
    stopLoss: trade.stopLoss?.toString() ?? null,
    takeProfit: trade.takeProfit?.toString() ?? null,
    pnlMoney: trade.pnlMoney?.toString() ?? null,
    pnlPercent: trade.pnlPercent?.toString() ?? null,
    commission: trade.commission?.toString() ?? null,
    swap: trade.swap?.toString() ?? null,
    riskMoney: trade.riskMoney?.toString() ?? null,
    riskPercent: trade.riskPercent?.toString() ?? null,
    account: {
      ...trade.account,
      balance: trade.account.balance.toString(),
    },
    journalEntry: trade.journalEntry
      ? {
          ...trade.journalEntry,
          aiScore: trade.journalEntry.aiScore?.toString() ?? null,
        }
      : null,
  };

  const shareToken = signShareToken(trade.id);

  return <TradeDetailClient trade={serialized} shareToken={shareToken} />;
}
