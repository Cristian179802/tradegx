import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";

  const alerts = await prisma.alert.findMany({
    where: {
      userId,
      ...(unreadOnly && { isRead: false }),
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const unreadCount = await prisma.alert.count({
    where: { userId, isRead: false },
  });

  return NextResponse.json({ alerts, unreadCount });
}

export async function PATCH(_req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  await prisma.alert.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}
