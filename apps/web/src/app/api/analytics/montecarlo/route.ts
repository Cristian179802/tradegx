import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPro, PRO_REQUIRED } from "@/lib/plan";

// GET /api/analytics/montecarlo?days=365&accountId=...
// Returnează randamentele procentuale per tranzacție (materia primă a simulării).
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }
  if (!(await hasPro(session.user.id))) {
    return NextResponse.json(PRO_REQUIRED, { status: 402 });
  }

  const days = Math.min(Number(req.nextUrl.searchParams.get("days") ?? 365), 3650);
  const accountId = req.nextUrl.searchParams.get("accountId");

  const trades = await prisma.trade.findMany({
    where: {
      account: { userId: session.user.id },
      ...(accountId ? { accountId } : {}),
      status: "CLOSED",
      exitTime: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    },
    select: {
      pnlMoney: true,
      pnlPercent: true,
      commission: true,
      swap: true,
      account: { select: { initialBalance: true } },
    },
    orderBy: { exitTime: "desc" },
    take: 500,
  });

  // Randament % per tranzacție: pnlPercent dacă există, altfel net / initialBalance.
  const returns: number[] = [];
  for (const t of trades) {
    const pct = t.pnlPercent != null ? Number(t.pnlPercent) : null;
    if (pct != null && pct !== 0) {
      returns.push(pct);
      continue;
    }
    const initial = Number(t.account.initialBalance);
    if (initial > 0) {
      const net =
        Number(t.pnlMoney ?? 0) + Number(t.commission ?? 0) + Number(t.swap ?? 0);
      returns.push((net / initial) * 100);
    }
  }

  return NextResponse.json({ returns, count: returns.length });
}
