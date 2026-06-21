import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;

  const alert = await prisma.alert.findFirst({
    where: { id, userId: session.user.id },
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
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;

  const alert = await prisma.alert.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!alert) return NextResponse.json({ error: "Negăsit" }, { status: 404 });

  await prisma.alert.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
