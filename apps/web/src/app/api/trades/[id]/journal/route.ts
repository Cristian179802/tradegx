import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { journalEntrySchema } from "@/lib/validations";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { id } = await params;

  const trade = await prisma.trade.findFirst({
    where: { id, account: { userId: session.user.id } },
    select: { id: true },
  });
  if (!trade) {
    return NextResponse.json({ error: "Trade negăsit" }, { status: 404 });
  }

  const journal = await prisma.journalEntry.findUnique({
    where: { tradeId: id },
  });

  return NextResponse.json(journal ?? null);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { id } = await params;

  const trade = await prisma.trade.findFirst({
    where: { id, account: { userId: session.user.id } },
    select: { id: true },
  });
  if (!trade) {
    return NextResponse.json({ error: "Trade negăsit" }, { status: 404 });
  }

  const body = await req.json();
  const result = journalEntrySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Date invalide", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const journal = await prisma.journalEntry.upsert({
    where: { tradeId: id },
    create: { tradeId: id, userId: session.user.id, ...result.data },
    update: result.data,
  });

  return NextResponse.json(journal);
}
