import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";
import { getAccountScope } from "@/lib/account-scope";
import { symbolVariants } from "@/lib/symbols";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Tranzacțiile mele pentru un simbol, ca să le desenăm pe grafic ───────────
//
// Ăsta e lucrul pe care widgetul TradingView nu îl poate face niciodată: el nu
// are acces la jurnalul tău. Un grafic care arată unde ai intrat, unde ai pus
// stopul și cum s-a terminat fiecare tranzacție e singurul motiv întemeiat ca un
// jurnal de trading să deseneze grafice proprii.
//
// Simbolul se caută pe toate variantele (vezi lib/symbols): aceeași pereche e
// salvată și „EURUSD" și „EUR/USD", după sursa importului.

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const symbolParam = (req.nextUrl.searchParams.get("symbol") ?? "").slice(0, 16);
  if (!symbolParam) {
    return NextResponse.json({ error: "Simbol lipsă" }, { status: 400 });
  }

  // Fereastra vizibilă a graficului, în secunde Unix. Fără ea am trimite tot
  // istoricul, care pe un cont vechi înseamnă mii de tranzacții degeaba.
  const fromSec = Number(req.nextUrl.searchParams.get("from"));
  const toSec = Number(req.nextUrl.searchParams.get("to"));
  const from = Number.isFinite(fromSec) && fromSec > 0 ? new Date(fromSec * 1000) : null;
  const to = Number.isFinite(toSec) && toSec > 0 ? new Date(toSec * 1000) : null;

  const scope = await getAccountScope(userId);

  const trades = await prisma.trade.findMany({
    where: {
      // Tranzacțiile atârnă de cont, nu direct de utilizator.
      ...scope.where,
      symbol: { in: symbolVariants(symbolParam) },
      ...(from || to
        ? { entryTime: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
    },
    select: {
      id: true, direction: true, status: true,
      entryPrice: true, entryTime: true,
      exitPrice: true, exitTime: true,
      stopLoss: true, takeProfit: true,
      pnlMoney: true, lotSize: true,
    },
    orderBy: { entryTime: "asc" },
    // Plafon de siguranță: un grafic cu peste 300 de marcaje devine ilizibil,
    // iar randarea începe să sacadeze. Mai bine tăiem decât să înecăm ecranul.
    take: 300,
  });

  // Decimal-urile Prisma nu supraviețuiesc serializării JSON ca numere.
  const num = (v: unknown) => (v == null ? null : Number(v));

  return NextResponse.json({
    ok: true,
    trades: trades.map((t) => ({
      id: t.id,
      direction: t.direction,
      status: t.status,
      entryPrice: num(t.entryPrice),
      entryTime: Math.floor(t.entryTime.getTime() / 1000),
      exitPrice: num(t.exitPrice),
      exitTime: t.exitTime ? Math.floor(t.exitTime.getTime() / 1000) : null,
      stopLoss: num(t.stopLoss),
      takeProfit: num(t.takeProfit),
      pnl: num(t.pnlMoney),
      lots: num(t.lotSize),
    })),
  });
}
