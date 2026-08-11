import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";
// Prețul vine prin stratul de rutare: cripto de la Binance (live), restul de
// la Yahoo. Înainte totul trecea prin Yahoo, care e măsurabil în urmă la cripto.
import { fetchSpotPrice, priceFreshness } from "@/lib/price-feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Preț live + soldul contului activ — alimentează instrumentul de risc vizual.
export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const symbol = (req.nextUrl.searchParams.get("symbol") ?? "EURUSD")
    .toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);

  const [price, account] = await Promise.all([
    fetchSpotPrice(symbol).catch(() => null),
    prisma.tradingAccount.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: "asc" },
      select: { balance: true, currency: true },
    }),
  ]);

  if (price == null) {
    return NextResponse.json({ error: "Preț indisponibil pentru acest simbol.", code: "NO_PRICE" }, { status: 422 });
  }

  return NextResponse.json({
    ok: true,
    symbol,
    price,
    // Cât de proaspăt e prețul, ca interfața să nu prezinte drept „live" o
    // cotație de futures pe care Yahoo o întârzie 10 minute. „live" = Binance,
    // „near" = valute Yahoo (sub un minut), „delayed" = metale/indici/energie.
    freshness: priceFreshness(symbol),
    balance: account ? Number(account.balance) : 10000,
    currency: account?.currency ?? "USD",
  });
}
