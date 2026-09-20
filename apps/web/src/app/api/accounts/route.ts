import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { isExchangeSourced } from "@/lib/exchange-sourced";
import { hasPro, FREE_LIMITS } from "@/lib/plan";
import { prisma } from "@/lib/prisma";
import { tradingAccountSchema } from "@/lib/validations";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const accounts = await prisma.tradingAccount.findMany({
    where: { userId },
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
    // Pe conturile de bursă soldul stocat vine de la bursă și rămâne. Formula
    // `initialBalance + P&L realizat` ratează pozițiile deschise, deci ar înlocui
    // cifra adevărată cu una dedusă — inclusiv la reîmprospătarea din 15 în 15
    // secunde a paginii Conturi, care trece prin ruta asta.
    const correctBalance = isExchangeSourced(a.brokerSource)
      ? Number(a.balance)
      : Number(a.initialBalance) + tradePnl;
    return {
      ...a,
      balance: correctBalance.toFixed(2),
      initialBalance: a.initialBalance.toString(),
      tradePnl: tradePnl.toFixed(2),
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  // Plan FREE: un singur cont de trading
  if (!(await hasPro(userId))) {
    const count = await prisma.tradingAccount.count({
      where: { userId },
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
      userId,
    },
  });

  return NextResponse.json(account, { status: 201 });
}
