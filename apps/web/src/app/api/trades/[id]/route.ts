import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tradeSchema } from "@/lib/validations";

async function getOwnedTrade(id: string, userId: string) {
  return prisma.trade.findFirst({
    where: {
      id,
      account: { userId },
    },
    include: {
      account: { select: { id: true, name: true, currency: true, balance: true } },
      journalEntry: true,
      screenshots: true,
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { id } = await params;
  const trade = await getOwnedTrade(id, session.user.id);
  if (!trade) {
    return NextResponse.json({ error: "Trade negăsit" }, { status: 404 });
  }

  return NextResponse.json(trade);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedTrade(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Trade negăsit" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  const result = tradeSchema.partial().safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Date invalide", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { notes, pnlMoney, accountId, ...rest } = result.data;

  // Convenția sistemului: comision/swap SEMNATE (negativ = cost), net = pnl +
  // commission + swap — la fel ca în accounts/route.ts și ancora EA. Comisionul
  // introdus manual (pozitiv = cost) se normalizează la negativ.
  if (rest.commission !== undefined && rest.commission !== null) {
    rest.commission = -Math.abs(rest.commission);
  }

  // Determine new status (may be changing from OPEN → CLOSED)
  const newStatus = rest.status ?? existing.status;
  const oldPnl = existing.status === "CLOSED" && existing.pnlMoney != null
    ? Number(existing.pnlMoney) + Number(existing.commission ?? 0) + Number(existing.swap ?? 0)
    : null;

  const newPnlMoney = pnlMoney !== undefined ? pnlMoney : (existing.pnlMoney ? Number(existing.pnlMoney) : null);
  const newCommission = rest.commission !== undefined && rest.commission !== null ? rest.commission : Number(existing.commission ?? 0);
  const newSwap = result.data.swap !== undefined && result.data.swap !== null ? result.data.swap : Number(existing.swap ?? 0);
  const newNetPnl = newStatus === "CLOSED" && newPnlMoney != null
    ? newPnlMoney + newCommission + newSwap
    : null;

  const balance = Number(existing.account.balance);
  let pnlPercent: number | null = existing.pnlPercent ? Number(existing.pnlPercent) : null;
  if (pnlMoney !== undefined && pnlMoney !== null) {
    // Recalculate pnlPercent relative to balance before old PNL was applied
    const balanceBeforeOld = oldPnl !== null ? balance - oldPnl : balance;
    pnlPercent = balanceBeforeOld > 0 ? (pnlMoney / balanceBeforeOld) * 100 : null;
  }

  let durationMinutes = existing.durationMinutes;
  const newEntryTime = rest.entryTime ? new Date(rest.entryTime) : existing.entryTime;
  const newExitTime = rest.exitTime !== undefined
    ? (rest.exitTime ? new Date(rest.exitTime) : null)
    : existing.exitTime;
  if (newEntryTime && newExitTime) {
    durationMinutes = Math.round((newExitTime.getTime() - newEntryTime.getTime()) / 60000);
  }

  // Recalculate account balance: reverse old PNL, apply new PNL
  const balanceDelta = (() => {
    if (oldPnl !== null && newNetPnl !== null) return newNetPnl - oldPnl; // edit closed trade
    if (oldPnl !== null && newNetPnl === null) return -oldPnl;            // re-opening closed trade
    if (oldPnl === null && newNetPnl !== null) return newNetPnl;          // closing open trade
    return 0;
  })();

  const [trade] = await prisma.$transaction([
    prisma.trade.update({
      where: { id },
      data: {
        ...rest,
        ...(accountId && { account: { connect: { id: accountId } } }),
        ...(pnlMoney !== undefined ? { pnlMoney, pnlPercent } : {}),
        ...(rest.entryTime && { entryTime: new Date(rest.entryTime) }),
        ...(rest.exitTime !== undefined && { exitTime: rest.exitTime ? new Date(rest.exitTime) : null }),
        durationMinutes,
      },
      include: {
        account: { select: { name: true, currency: true } },
        journalEntry: true,
      },
    }),
    ...(balanceDelta !== 0
      ? [prisma.tradingAccount.update({
          where: { id: existing.accountId },
          data: { balance: { increment: balanceDelta } },
        })]
      : []),
  ]);

  return NextResponse.json(trade);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedTrade(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Trade negăsit" }, { status: 404 });
  }

  // Reverse balance impact if closed trade
  if (existing.status === "CLOSED" && existing.pnlMoney != null) {
    const netPnl =
      Number(existing.pnlMoney) -
      Number(existing.commission ?? 0) -
      Number(existing.swap ?? 0);
    await prisma.tradingAccount.update({
      where: { id: existing.accountId },
      data: { balance: { decrement: netPnl } },
    });
  }

  await prisma.trade.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
