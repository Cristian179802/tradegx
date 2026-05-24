import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";
import { detectInstrumentType } from "@/lib/parsers/index";

function getWebhookToken(accountId: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "apex-trader-fallback-secret";
  return createHmac("sha256", secret).update(accountId).digest("hex").slice(0, 32);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { accountId: string } }
) {
  const { accountId } = params;

  // ── 1. Verify token ────────────────────────────────────────────────────────
  const headerToken = req.headers.get("x-apex-token") ?? req.headers.get("x-token");
  const queryToken  = req.nextUrl.searchParams.get("token");
  const receivedToken = headerToken ?? queryToken ?? "";

  const expectedToken = getWebhookToken(accountId);
  if (receivedToken !== expectedToken) {
    return NextResponse.json({ error: "Token invalid" }, { status: 401 });
  }

  // ── 2. Find account ────────────────────────────────────────────────────────
  const account = await prisma.tradingAccount.findUnique({
    where: { id: accountId },
    select: { id: true, currency: true },
  });
  if (!account) {
    return NextResponse.json({ error: "Cont inexistent" }, { status: 404 });
  }

  // ── 3. Parse payload ───────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  // Support both MT4 (ticket) and MT5 (positionId) payloads
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
    return NextResponse.json(
      { error: "Payload incomplet: lipsesc ticket/symbol/type/openTime/closeTime" },
      { status: 400 }
    );
  }

  // Skip if open and close time are the same (incomplete data)
  if (openTime.getTime() === closeTime.getTime()) {
    return NextResponse.json({ status: "skipped", reason: "same_time" });
  }

  const durationMinutes = Math.max(
    0,
    Math.round((closeTime.getTime() - openTime.getTime()) / 60_000)
  );

  // ── 4. Upsert trade (idempotent — EA may resend) ──────────────────────────
  const existing = await prisma.trade.findFirst({
    where: { accountId, brokerTradeId },
  });

  if (existing) {
    // Update P&L / prices in case of partial close or correction
    await prisma.trade.update({
      where: { id: existing.id },
      data: {
        exitPrice:  closePrice,
        exitTime:   closeTime,
        pnlMoney:   profit,
        commission,
        swap,
        durationMinutes,
      },
    });
    // Update account balance
    if (balance > 0) {
      await prisma.tradingAccount.update({
        where: { id: accountId },
        data: { balance, lastSyncedAt: new Date() },
      });
    }
    return NextResponse.json({ status: "updated", tradeId: existing.id });
  }

  const trade = await prisma.trade.create({
    data: {
      accountId,
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

  // Update account balance
  if (balance > 0) {
    await prisma.tradingAccount.update({
      where: { id: accountId },
      data: { balance, lastSyncedAt: new Date() },
    });
  }

  return NextResponse.json({ status: "created", tradeId: trade.id }, { status: 201 });
}

// Allow MT4/MT5 to verify connectivity with GET
export async function GET(
  req: NextRequest,
  { params }: { params: { accountId: string } }
) {
  const { accountId } = params;
  const headerToken   = req.headers.get("x-apex-token") ?? "";
  const queryToken    = req.nextUrl.searchParams.get("token") ?? "";
  const token         = headerToken || queryToken;

  if (token !== getWebhookToken(accountId)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true, accountId });
}
