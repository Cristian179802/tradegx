import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";
import { fetchLatestPrice } from "@/lib/yahoo-finance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Preț live + soldul contului activ — alimentează instrumentul de risc vizual.
export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const symbol = (req.nextUrl.searchParams.get("symbol") ?? "EURUSD")
    .toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);

  const [price, account] = await Promise.all([
    fetchLatestPrice(symbol).catch(() => null),
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
    balance: account ? Number(account.balance) : 10000,
    currency: account?.currency ?? "USD",
  });
}
