import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPro, FREE_LIMITS } from "@/lib/plan";
import { prisma } from "@/lib/prisma";
import { tradingAccountSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const accounts = await prisma.tradingAccount.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { trades: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const accountIds = accounts.map((a) => a.id);
  const pnlAgg = await prisma.trade.groupBy({
    by: ["accountId"],
    where: {
      accountId: { in: accountIds },
      OR: [{ status: "CLOSED" }, { pnlMoney: { not: null } }],
    },
    _sum: { pnlMoney: true, commission: true, swap: true },
  });
  // MT4/MT5 commission & swap are already signed, so the broker-accurate net is
  // pnlMoney + commission + swap (NOT minus). Must match accounts/page.tsx + the
  // EA webhook anchor, otherwise a client refetch would revert to wrong numbers.
  const pnlMap = new Map(
    pnlAgg.map((g) => [
      g.accountId,
      (
        Number(g._sum.pnlMoney ?? 0)
        + Number(g._sum.commission ?? 0)
        + Number(g._sum.swap ?? 0)
      ).toFixed(2),
    ])
  );

  const result = accounts.map((a) => {
    const tradePnl = Number(pnlMap.get(a.id) ?? "0.00");
    const correctBalance = Number(a.initialBalance) + tradePnl;
    return {
      ...a,
      balance: correctBalance.toFixed(2), // corrected balance = initialBalance + actual trade P&L
      initialBalance: a.initialBalance.toString(),
      tradePnl: tradePnl.toFixed(2),
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  // Plan FREE: un singur cont de trading
  if (!(await hasPro(session.user.id))) {
    const count = await prisma.tradingAccount.count({
      where: { userId: session.user.id },
    });
    if (count >= FREE_LIMITS.tradingAccounts) {
      return NextResponse.json(
        {
          error: "Planul FREE include un singur cont de trading. Treci la PRO pentru conturi nelimitate.",
          code: "PRO_REQUIRED",
          upgradeUrl: "/pricing",
        },
        { status: 402 }
      );
    }
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  const result = tradingAccountSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Date invalide", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { balance, ...rest } = result.data;

  const account = await prisma.tradingAccount.create({
    data: {
      ...rest,
      balance,
      initialBalance: balance,
      userId: session.user.id,
    },
  });

  return NextResponse.json(account, { status: 201 });
}
