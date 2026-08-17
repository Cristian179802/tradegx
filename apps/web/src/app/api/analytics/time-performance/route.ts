import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
// Datele se filtreaza pe contul selectat. Inainte, toate conturile erau
// amestecate intr-o singura statistica — un FTMO de 100.000 $ si un Binance de
// 500 $ in aceeasi rata de castig, cifra care nu descria niciun cont real.
import { getAccountScope } from "@/lib/account-scope";

// Returnează timestamp-urile + P&L pentru toate tranzacțiile decontate.
// Ora/ziua locală se calculează în client (timezone-ul browserului) pentru acuratețe.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const scope = await getAccountScope(session.user.id);

  const trades = await prisma.trade.findMany({
    where: {
      ...scope.where,
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
