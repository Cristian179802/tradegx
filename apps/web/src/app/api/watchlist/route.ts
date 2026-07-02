import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addSchema = z.object({
  symbol: z.string().min(1).max(20).toUpperCase(),
  instrumentType: z.enum(["FOREX", "CRYPTO", "METALS", "INDICES", "COMMODITIES", "STOCKS", "CFD"]),
  groupName: z.string().max(50).optional().nullable(),
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
