import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";
// Datele se filtreaza pe contul selectat. Inainte, toate conturile erau
// amestecate intr-o singura statistica — un cont finanțat de 100.000 $ si un Binance de
// 500 $ in aceeasi rata de castig, cifra care nu descria niciun cont real.
import { getAccountScope } from "@/lib/account-scope";

// Returnează timestamp-urile + P&L pentru toate tranzacțiile decontate.
// Ora/ziua locală se calculează în client (timezone-ul browserului) pentru acuratețe.
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const scope = await getAccountScope(userId);

  const trades = await prisma.trade.findMany({
    where: {
      ...scope.where,
      OR: [{ status: "CLOSED" }, { pnlMoney: { not: null } }],
    },
    select: { entryTime: true, exitTime: true, pnlMoney: true },
    orderBy: { entryTime: "asc" },
  });

  const accounts = await prisma.tradingAccount.findMany({
    where: { userId },
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
