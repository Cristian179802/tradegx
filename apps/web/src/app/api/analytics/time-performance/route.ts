import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Returnează timestamp-urile + P&L pentru toate tranzacțiile decontate.
// Ora/ziua locală se calculează în client (timezone-ul browserului) pentru acuratețe.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const trades = await prisma.trade.findMany({
    where: {
      account: { userId: session.user.id },
      OR: [{ status: "CLOSED" }, { pnlMoney: { not: null } }],
    },
    select: { entryTime: true, exitTime: true, pnlMoney: true },
    orderBy: { entryTime: "asc" },
  });

  const accounts = await prisma.tradingAccount.findMany({
    where: { userId: session.user.id },
    select: { currency: true },
    take: 1,
  });

  return NextResponse.json({
    currency: accounts[0]?.currency ?? "USD",
    trades: trades.map((t) => ({
      // Folosim ora de intrare ca moment al deciziei de tranzacționare
      time: new Date(t.entryTime).toISOString(),
      pnl: Number(t.pnlMoney ?? 0),
    })),
  });
}
