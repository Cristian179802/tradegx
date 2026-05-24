import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";
import { detectInstrumentType } from "@/lib/parsers/index";

function getUserToken(userId: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "apex-trader-secret";
  return createHmac("sha256", secret).update(`ea:${userId}`).digest("hex").slice(0, 32);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const token = req.headers.get("x-apex-token") ?? req.nextUrl.searchParams.get("token") ?? "";
  if (token !== getUserToken(params.userId)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;

  // ── Verify token ───────────────────────────────────────────────────────────
  const token = req.headers.get("x-apex-token") ?? req.nextUrl.searchParams.get("token") ?? "";
  if (token !== getUserToken(userId)) {
    return NextResponse.json({ error: "Token invalid" }, { status: 401 });
  }

  // ── Verify user exists ─────────────────────────────────────────────────────
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User inexistent" }, { status: 404 });

  // ── Parse payload ──────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "JSON invalid" }, { status: 400 }); }

  const platform      = String(body.platform ?? "mt4").toLowerCase();
  const accountNumber = String(body.accountNumber ?? body.login ?? "");
  const brokerTradeId = String(body.positionId ?? body.ticket ?? "");
  const symbol        = String(body.symbol ?? "").toUpperCase().replace(/\s/g, "");
  const typeRaw       = String(body.type ?? "").toLowerCase();
  const direction     = typeRaw === "buy" ? "BUY" : typeRaw === "sell" ? "SELL" : null;
  const openTime      = typeof body.openTime  === "number" ? new Date(body.openTime  * 1000) : null;
  const closeTime     = typeof body.closeTime === "number" ? new Date(body.closeTime * 1000) : null;
  const openPrice     = Number(body.openPrice  ?? 0);
  const closePrice    = Number(body.closePrice ?? 0);
  const lots          = Number(body.lots       ?? 0);
  const profit        = Number(body.profit     ?? 0);
  const commission    = Number(body.commission ?? 0);
  const swap          = Number(body.swap       ?? 0);
  const sl            = body.sl ? Number(body.sl) : null;
  const tp            = body.tp ? Number(body.tp) : null;
  const balance       = Number(body.balance    ?? 0);

  if (!brokerTradeId || !symbol || !direction || !openTime || !closeTime) {
    return NextResponse.json({ error: "Date incomplete" }, { status: 400 });
  }

  // ── Find or auto-create trading account ────────────────────────────────────
  // Match by accountNumber (login) if provided, otherwise find the first EA account for this user
  let tradingAccount = accountNumber
    ? await prisma.tradingAccount.findFirst({
        where: { userId, accountNumber, brokerSource: "MANUAL" },
      })
    : await prisma.tradingAccount.findFirst({
        where: { userId, brokerSource: "MANUAL" },
        orderBy: { createdAt: "desc" },
      });

  if (!tradingAccount) {
    // Auto-create account on first trade
    const name = accountNumber
      ? `${platform.toUpperCase()} #${accountNumber}`
      : `${platform.toUpperCase()} Cont`;

    tradingAccount = await prisma.tradingAccount.create({
      data: {
        userId,
        name,
        type:          "LIVE",
        broker:        "MT4/MT5",
        accountNumber: accountNumber || "",
        currency:      "USD",
        balance:       balance || 0,
        initialBalance: balance || 0,
        leverage:      100,
        brokerSource:  "MANUAL",
        lastSyncedAt:  new Date(),
      },
    });
  }

  // ── Upsert trade ───────────────────────────────────────────────────────────
  const existing = await prisma.trade.findFirst({
    where: { accountId: tradingAccount.id, brokerTradeId },
  });

  const durationMinutes = Math.max(
    0,
    Math.round((closeTime.getTime() - openTime.getTime()) / 60_000)
  );

  if (existing) {
    await prisma.trade.update({
      where: { id: existing.id },
      data: { exitPrice: closePrice, exitTime: closeTime, pnlMoney: profit, commission, swap, durationMinutes },
    });
    if (balance > 0) {
      await prisma.tradingAccount.update({ where: { id: tradingAccount.id }, data: { balance, lastSyncedAt: new Date() } });
    }
    return NextResponse.json({ status: "updated", tradeId: existing.id });
  }

  const trade = await prisma.trade.create({
    data: {
      accountId:      tradingAccount.id,
      symbol,
      instrumentType: detectInstrumentType(symbol) as any,
      direction,
      entryPrice:     openPrice,
      entryTime:      openTime,
      exitPrice:      closePrice,
      exitTime:       closeTime,
      lotSize:        lots,
      stopLoss:       sl,
      takeProfit:     tp,
      pnlMoney:       profit,
      pnlPercent:     0,
      commission,
      swap,
      status:         "CLOSED",
      brokerSource:   "MANUAL",
      brokerTradeId,
      durationMinutes,
      tags:           [],
    },
  });

  if (balance > 0) {
    await prisma.tradingAccount.update({
      where: { id: tradingAccount.id },
      data: { balance, lastSyncedAt: new Date() },
    });
  }

  return NextResponse.json({ status: "created", tradeId: trade.id, accountId: tradingAccount.id }, { status: 201 });
}
