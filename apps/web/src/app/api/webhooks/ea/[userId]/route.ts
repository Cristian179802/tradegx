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
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const token = req.headers.get("x-apex-token") ?? req.nextUrl.searchParams.get("token") ?? "";
  if (token !== getUserToken(userId)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true, userId });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  // ── Verify token ───────────────────────────────────────────────────────────
  const token = req.headers.get("x-apex-token") ?? req.nextUrl.searchParams.get("token") ?? "";
  if (token !== getUserToken(userId)) {
    return NextResponse.json({ error: "Token invalid" }, { status: 401 });
  }

  // ── Verify user exists ─────────────────────────────────────────────────────
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // ── Parse payload ──────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const platform      = String(body.platform ?? "mt4").toLowerCase();
  const loginRaw      = String(body.login ?? body.accountNumber ?? "").trim();
  const brokerTradeId = String(body.positionId ?? body.ticket ?? "").trim();
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
  // ── Account-type detection (sent by EA v1.32+) ─────────────────────────────
  // tradeMode: 0 = demo, 1 = contest/challenge, 2 = real (live).
  const tradeMode     = body.tradeMode != null ? Number(body.tradeMode) : null;
  const serverName    = String(body.server ?? body.company ?? "").toLowerCase();
  // Prop-firm / challenge keywords (server or company name).
  const looksChallenge = /(ftmo|prop|challenge|funded|fundednext|the5ers|myforexfunds|e8|alpha\s*capital|instant\s*funding|finotive|blueberry\s*funded|smart\s*prop|goat\s*funded)/i.test(serverName);
  function detectAccountType(): "DEMO" | "CHALLENGE" | "LIVE" {
    if (looksChallenge) return "CHALLENGE";
    if (tradeMode === 1) return "CHALLENGE";
    if (tradeMode === 0) return "DEMO";
    if (tradeMode === 2) return "LIVE";
    return "DEMO"; // safe default when EA didn't send a mode
  }
  // brokerSource maps the live-sync platform to the schema enum.
  const brokerSourceEnum =
    platform === "mt5" ? "MT5" :
    platform === "mt4" ? "MT4" :
    platform === "ctrader" ? "CTRADER" : "MT5";

  if (!brokerTradeId || !symbol || !direction || !openTime || !closeTime) {
    return NextResponse.json({
      error: "Missing fields",
      got: { brokerTradeId, symbol, direction, openTime, closeTime }
    }, { status: 400 });
  }

  // ── Find or create account ─────────────────────────────────────────────────
  // accountKey: use MT5 login if available, otherwise a user-specific key
  const accountKey = loginRaw || `ea_${userId.slice(-8)}`;
  const accountName = loginRaw
    ? `${platform.toUpperCase()} #${loginRaw}`
    : `${platform.toUpperCase()} Sync`;

  let account = await prisma.tradingAccount.findFirst({
    where: { userId, accountNumber: accountKey },
  });

  if (!account) {
    account = await prisma.tradingAccount.create({
      data: {
        userId,
        name:           accountName,
        type:           detectAccountType(),
        broker:         platform.toUpperCase(),
        accountNumber:  accountKey,
        currency:       "USD",
        balance:        balance || 0,
        initialBalance: balance || 0,
        leverage:       100,
        brokerSource:   brokerSourceEnum as any,
        lastSyncedAt:   new Date(),
      },
    });
  }

  // ── Upsert trade ───────────────────────────────────────────────────────────
  const existing = await prisma.trade.findFirst({
    where: { accountId: account.id, brokerTradeId },
  });

  const durationMinutes = Math.max(
    0,
    Math.round((closeTime.getTime() - openTime.getTime()) / 60_000)
  );

  let tradeId: string;
  let createdNew = false;

  if (existing) {
    await prisma.trade.update({
      where: { id: existing.id },
      data: { exitPrice: closePrice, exitTime: closeTime, pnlMoney: profit, commission, swap, durationMinutes },
    });
    tradeId = existing.id;
  } else {
    const trade = await prisma.trade.create({
      data: {
        accountId:      account.id,
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
        brokerSource:   brokerSourceEnum as any,   // MT4 / MT5 / CTRADER, nu MANUAL
        brokerTradeId,
        durationMinutes,
        tags:           [],
      },
    });
    tradeId = trade.id;
    createdNew = true;
  }

  // ── Re-anchor account totals ───────────────────────────────────────────────
  // The EA-reported balance is the source of truth (it equals the live MT4/MT5
  // terminal balance). initialBalance is back-solved so that
  //   initialBalance + Σ(pnlMoney + commission + swap) === balance
  // holds exactly. This keeps balance, total P&L and return % mutually
  // consistent and matching the broker, even if some historical trades are
  // missing (the gap is absorbed by initialBalance, never by the live balance).
  // NOTE: in MT4/MT5 commission and swap are already signed, so they are ADDED.
  const agg = await prisma.trade.aggregate({
    where: { accountId: account.id },
    _sum: { pnlMoney: true, commission: true, swap: true },
  });
  const netPnl =
    Number(agg._sum.pnlMoney ?? 0) +
    Number(agg._sum.commission ?? 0) +
    Number(agg._sum.swap ?? 0);

  // Dacă EA trimite tradeMode sau server cu keyword prop-firm, re-detectăm tipul
  // și îl actualizăm pe cont (util pentru conturi vechi create cu default DEMO).
  const detectedType = detectAccountType();
  const shouldUpdateType = tradeMode !== null || looksChallenge;

  await prisma.tradingAccount.update({
    where: { id: account.id },
    data: {
      lastSyncedAt: new Date(),
      // Mark the live-sync source so the UI locks the balance fields (an
      // auto-synced account's balance must never be hand-edited). Older accounts
      // were created as MANUAL before this was tracked — upgrade them here.
      ...(account.brokerSource == null || account.brokerSource === "MANUAL"
        ? { brokerSource: brokerSourceEnum as any }
        : {}),
      // Re-aplică tipul detectat dacă EA trimite info de cont (tradeMode/server).
      ...(shouldUpdateType ? { type: detectedType } : {}),
      ...(balance > 0 ? { balance, initialBalance: balance - netPnl } : {}),
    },
  });

  return NextResponse.json(
    {
      ok: true,
      status: createdNew ? "created" : "updated",
      tradeId,
      accountId: account.id,
      accountName: account.name,
    },
    { status: createdNew ? 201 : 200 }
  );
}
