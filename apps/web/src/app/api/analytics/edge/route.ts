import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeEdges, type EdgeTrade } from "@/lib/edge-finder";

// GET /api/analytics/edge?days=90&accountId=...
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
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
      symbol: true,
      direction: true,
      setupType: true,
      killzone: true,
      timeframe: true,
      sessionType: true,
      tags: true,
      entryTime: true,
      durationMinutes: true,
      pnlMoney: true,
      commission: true,
      swap: true,
    },
  });

  const edgeTrades: EdgeTrade[] = trades.map((t) => ({
    symbol: t.symbol,
    direction: t.direction,
    setupType: t.setupType,
    killzone: t.killzone,
    timeframe: t.timeframe,
    sessionType: t.sessionType,
    tags: t.tags,
    entryTime: t.entryTime,
    durationMinutes: t.durationMinutes,
    // net semnat: pnl + comision + swap (convenția sistemului)
    netPnl:
      Number(t.pnlMoney ?? 0) + Number(t.commission ?? 0) + Number(t.swap ?? 0),
  }));

  const report = computeEdges(edgeTrades, { minSample: 5, top: 8 });
  return NextResponse.json(report);
}
