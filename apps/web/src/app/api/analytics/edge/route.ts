import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
// Datele se filtreaza pe contul selectat. Inainte, toate conturile erau
// amestecate intr-o singura statistica — un FTMO de 100.000 $ si un Binance de
// 500 $ in aceeasi rata de castig, cifra care nu descria niciun cont real.
import { getAccountScope } from "@/lib/account-scope";
import { computeEdges, type EdgeTrade } from "@/lib/edge-finder";
import { hasPro, PRO_REQUIRED } from "@/lib/plan";

// GET /api/analytics/edge?days=90&accountId=...
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

  const scope = await getAccountScope(session.user.id);

  const trades = await prisma.trade.findMany({
    where: {
      ...scope.where,
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
