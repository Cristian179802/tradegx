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

  // Soldul se cere EXPLICIT, nu din oficiu.
  //
  // Ruta asta e interogată la 5 secunde de graficul live, iar interogarea de cont
  // se făcea la fiecare apel — pentru un sold care nu se schimbă cât stai pe
  // pagină. Baza de date Neon suspendă computul după 5 minute fără interogări,
  // deci un grafic deschis o ținea trează permanent și consuma alocația lunară.
  //
  // Prețul nu are nevoie de baza de date deloc: sesiunea e JWT, iar cotația vine
  // de la bursă. Singurul care chiar vrea soldul e panoul de risc, care îl cere o
  // dată la deschidere — deci el trimite `withBalance=1`.
  const withBalance = req.nextUrl.searchParams.get("withBalance") === "1";

  const [price, account] = await Promise.all([
    fetchSpotPrice(symbol).catch(() => null),
    withBalance
      ? prisma.tradingAccount.findFirst({
          where: { userId, isActive: true },
          orderBy: { createdAt: "asc" },
          select: { balance: true, currency: true },
        })
      : Promise.resolve(null),
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
