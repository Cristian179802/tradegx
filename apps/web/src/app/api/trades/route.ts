import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tradeSchema } from "@/lib/validations";
import { checkTradingRuleViolations } from "@/lib/trading-rules";

function calcPnlPercent(pnlMoney: number, balance: number): number {
  if (balance === 0) return 0;
  return (pnlMoney / balance) * 100;
}

function calcRisk(
  direction: string,
  entryPrice: number,
  stopLoss: number | null | undefined,
  lotSize: number,
  balance: number,
  symbol = ""
) {
  if (!stopLoss) return { riskMoney: null, riskPercent: null };
  const priceDiff =
    direction === "BUY"
      ? entryPrice - stopLoss
      : stopLoss - entryPrice;
  // Detectează perechile JPY (pip = 0.01, nu 0.0001)
  const isJPY = /JPY/i.test(symbol);
  const contractSize = 100000;
  const pipSize = isJPY ? 0.01 : 0.0001;
  const riskMoney = Math.abs(priceDiff) * lotSize * contractSize * pipSize;
  const riskPercent = balance > 0 ? (riskMoney / balance) * 100 : null;
  return { riskMoney, riskPercent };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");
  const status = searchParams.get("status");
  const symbol = searchParams.get("symbol");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));

  const userAccounts = await prisma.tradingAccount.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const accountIds = userAccounts.map((a) => a.id);

  // Securitate: verifică că accountId aparține utilizatorului curent
  if (accountId && !accountIds.includes(accountId)) {
    return NextResponse.json({ error: "Acces interzis" }, { status: 403 });
  }

  const where = {
    accountId: accountId ? accountId : { in: accountIds },
    ...(status && { status: status as "OPEN" | "CLOSED" | "CANCELLED" }),
    ...(symbol && { symbol: { contains: symbol.toUpperCase() } }),
    ...(dateFrom || dateTo
      ? {
          entryTime: {
            ...(dateFrom && { gte: new Date(dateFrom) }),
            ...(dateTo && { lte: new Date(dateTo) }),
          },
        }
      : {}),
  };

  const [total, trades] = await prisma.$transaction([
    prisma.trade.count({ where }),
    prisma.trade.findMany({
      where,
      include: {
        account: { select: { name: true, currency: true } },
        journalEntry: { select: { id: true, preConfidence: true, postMistakeTypes: true } },
        screenshots: { select: { id: true, url: true, type: true }, take: 1 },
      },
      orderBy: { entryTime: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    trades,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const body = await req.json();
  const result = tradeSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Date invalide", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { notes, ...data } = result.data;

  // Verify account belongs to user
  const account = await prisma.tradingAccount.findFirst({
    where: { id: data.accountId, userId: session.user.id },
  });
  if (!account) {
    return NextResponse.json({ error: "Cont negăsit" }, { status: 404 });
  }

  const balance = Number(account.balance);
  const pnlMoney = data.pnlMoney ?? null;
  const pnlPercent = pnlMoney != null ? calcPnlPercent(pnlMoney, balance) : null;
  const { riskMoney, riskPercent } = calcRisk(
    data.direction,
    data.entryPrice,
    data.stopLoss,
    data.lotSize,
    balance,
    data.symbol   // pentru detectarea corectă a pipSize JPY
  );

  let durationMinutes: number | null = null;
  if (data.entryTime && data.exitTime) {
    durationMinutes = Math.round(
      (new Date(data.exitTime).getTime() - new Date(data.entryTime).getTime()) / 60000
    );
  }

  const trade = await prisma.trade.create({
    data: {
      accountId: data.accountId,
      symbol: data.symbol,
      instrumentType: data.instrumentType,
      direction: data.direction,
      entryPrice: data.entryPrice,
      entryTime: new Date(data.entryTime),
      exitPrice: data.exitPrice ?? null,
      exitTime: data.exitTime ? new Date(data.exitTime) : null,
      lotSize: data.lotSize,
      stopLoss: data.stopLoss ?? null,
      takeProfit: data.takeProfit ?? null,
      pnlMoney: pnlMoney,
      pnlPercent: pnlPercent,
      commission: data.commission,
      swap: data.swap,
      setupType: data.setupType ?? null,
      killzone: data.killzone ?? null,
      timeframe: data.timeframe ?? null,
      sessionType: data.sessionType ?? null,
      status: data.status,
      tags: data.tags,
      riskMoney: riskMoney,
      riskPercent: riskPercent,
      durationMinutes,
      brokerSource: "MANUAL",
    },
    include: {
      account: { select: { name: true, currency: true } },
    },
  });

  // Update account balance if trade is closed
  if (data.status === "CLOSED" && pnlMoney != null) {
    const netPnl = pnlMoney - data.commission - data.swap;
    await prisma.tradingAccount.update({
      where: { id: data.accountId },
      data: { balance: { increment: netPnl } },
    });
  }

  // Create journal entry if notes provided
  if (notes) {
    await prisma.journalEntry.create({
      data: { tradeId: trade.id, userId: session.user.id, preNotes: notes },
    });
  }

  // Check trading rule violations asynchronously (non-blocking)
  if (data.status === "CLOSED" && pnlMoney != null) {
    checkTradingRuleViolations({
      userId: session.user.id,
      accountId: data.accountId,
      tradePnl: pnlMoney,
    }).catch(() => {});
  }

  return NextResponse.json(trade, { status: 201 });
}
