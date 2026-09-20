import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;

  const alert = await prisma.alert.findFirst({
    where: { id, userId },
  });
  if (!alert) return NextResponse.json({ error: "Negăsit" }, { status: 404 });

  const updated = await prisma.alert.update({
    where: { id },
    data: { isRead: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;

  const alert = await prisma.alert.findFirst({
    where: { id, userId },
  });
  if (!alert) return NextResponse.json({ error: "Negăsit" }, { status: 404 });

  await prisma.alert.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
