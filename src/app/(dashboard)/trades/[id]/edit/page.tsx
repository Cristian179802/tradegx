import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { TradeForm } from "@/components/trades/trade-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const trade = await prisma.trade.findUnique({ where: { id }, select: { symbol: true } });
  return { title: trade ? `Editează ${trade.symbol}` : "Editează trade" };
}

export default async function EditTradePage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const [trade, accounts] = await Promise.all([
    prisma.trade.findFirst({
      where: { id, account: { userId: session.user.id } },
      include: { account: { select: { id: true } } },
    }),
    prisma.tradingAccount.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, currency: true, balance: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!trade) notFound();

  const serializedAccounts = accounts.map((a) => ({
    ...a,
    balance: a.balance.toString(),
  }));

  const initialTrade = {
    id: trade.id,
    accountId: trade.accountId,
    symbol: trade.symbol,
    instrumentType: trade.instrumentType,
    direction: trade.direction,
    entryPrice: trade.entryPrice.toString(),
    entryTime: trade.entryTime.toISOString(),
    exitPrice: trade.exitPrice?.toString() ?? null,
    exitTime: trade.exitTime?.toISOString() ?? null,
    lotSize: trade.lotSize.toString(),
    stopLoss: trade.stopLoss?.toString() ?? null,
    takeProfit: trade.takeProfit?.toString() ?? null,
    pnlMoney: trade.pnlMoney?.toString() ?? null,
    commission: trade.commission?.toString() ?? null,
    swap: trade.swap?.toString() ?? null,
    setupType: trade.setupType,
    killzone: trade.killzone,
    timeframe: trade.timeframe,
    status: trade.status,
    tags: trade.tags,
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/trades/${id}`}
          className="text-zinc-400 hover:text-zinc-100 flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Editează {trade.symbol} {trade.direction}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">Modifică detaliile trade-ului</p>
        </div>
      </div>
      <TradeForm accounts={serializedAccounts} initialTrade={initialTrade} />
    </div>
  );
}
