import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPrefs: true },
  });

  return NextResponse.json(user?.notificationPrefs ?? {});
}

export async function PATCH(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  const { preferences } = body as { preferences: Record<string, boolean> };

  if (!preferences || typeof preferences !== "object") {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { notificationPrefs: preferences },
  });

  return NextResponse.json({ success: true });
}
