import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;

  const item = await prisma.watchlistItem.findFirst({
    where: { id, userId },
  });
  if (!item) return NextResponse.json({ error: "Negăsit" }, { status: 404 });

  await prisma.watchlistItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
