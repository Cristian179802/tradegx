import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { hasPro, PRO_REQUIRED } from "@/lib/plan";

const addSchema = z.object({
  symbol: z.string().min(1).max(20).toUpperCase(),
  instrumentType: z.enum(["FOREX", "CRYPTO", "METALS", "INDICES", "COMMODITIES", "STOCKS", "CFD"]),
  groupName: z.string().max(50).optional().nullable(),
});

const alertSchema = z.object({
  id: z.string().cuid(),
  alertAbove: z.number().positive().max(100_000_000).optional().nullable(),
  alertBelow: z.number().positive().max(100_000_000).optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const items = await prisma.watchlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: [{ groupName: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  const result = addSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }

  const existing = await prisma.watchlistItem.findUnique({
    where: { userId_symbol: { userId: session.user.id, symbol: result.data.symbol } },
  });
  if (existing) {
    return NextResponse.json({ error: "Simbolul există deja în watchlist" }, { status: 409 });
  }

  const item = await prisma.watchlistItem.create({
    data: {
      userId: session.user.id,
      symbol: result.data.symbol,
      instrumentType: result.data.instrumentType,
      ...(result.data.groupName != null && { groupName: result.data.groupName }),
    },
  });

  return NextResponse.json(item, { status: 201 });
}

// PATCH — setează/șterge pragurile de alertă de preț pe un item.
// null = dezactivează pragul; undefined = păstrează valoarea existentă.
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (!(await hasPro(session.user.id))) {
    return NextResponse.json(PRO_REQUIRED, { status: 402 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  const result = alertSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }

  const item = await prisma.watchlistItem.findFirst({
    where: { id: result.data.id, userId: session.user.id },
  });
  if (!item) return NextResponse.json({ error: "Item negăsit" }, { status: 404 });

  const updated = await prisma.watchlistItem.update({
    where: { id: item.id },
    data: {
      ...(result.data.alertAbove !== undefined && { alertAbove: result.data.alertAbove }),
      ...(result.data.alertBelow !== undefined && { alertBelow: result.data.alertBelow }),
    },
  });

  return NextResponse.json(updated);
}
