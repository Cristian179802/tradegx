import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  monthlyProfitTarget: z.number().min(0).max(100_000_000).nullable().optional(),
  monthlyTradeTarget: z.number().int().min(0).max(10_000).nullable().optional(),
  monthlyWinRateTarget: z.number().int().min(0).max(100).nullable().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { monthlyProfitTarget: true, monthlyTradeTarget: true, monthlyWinRateTarget: true, currency: true },
  });

  // Progres luna curentă
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthTrades = await prisma.trade.findMany({
    where: {
      account: { userId: session.user.id },
      OR: [{ status: "CLOSED" }, { pnlMoney: { not: null } }],
      entryTime: { gte: monthStart },
    },
    select: { pnlMoney: true },
  });

  const count = monthTrades.length;
  const pnl = monthTrades.reduce((s, t) => s + Number(t.pnlMoney ?? 0), 0);
  const wins = monthTrades.filter((t) => Number(t.pnlMoney ?? 0) > 0).length;
  const winRate = count > 0 ? (wins / count) * 100 : 0;

  return NextResponse.json({
    targets: {
      monthlyProfitTarget: user?.monthlyProfitTarget != null ? Number(user.monthlyProfitTarget) : null,
      monthlyTradeTarget: user?.monthlyTradeTarget ?? null,
      monthlyWinRateTarget: user?.monthlyWinRateTarget ?? null,
    },
    progress: {
      pnl: +pnl.toFixed(2),
      trades: count,
      winRate: +winRate.toFixed(1),
    },
    currency: user?.currency ?? "USD",
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }

  const data = parsed.data;
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(data.monthlyProfitTarget !== undefined ? { monthlyProfitTarget: data.monthlyProfitTarget } : {}),
      ...(data.monthlyTradeTarget !== undefined ? { monthlyTradeTarget: data.monthlyTradeTarget } : {}),
      ...(data.monthlyWinRateTarget !== undefined ? { monthlyWinRateTarget: data.monthlyWinRateTarget } : {}),
    },
  });

  return NextResponse.json({ success: true });
}
