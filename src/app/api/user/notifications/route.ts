import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notificationPrefs: true },
  });

  return NextResponse.json(user?.notificationPrefs ?? {});
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const body = await req.json();
  const { preferences } = body as { preferences: Record<string, boolean> };

  if (!preferences || typeof preferences !== "object") {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { notificationPrefs: preferences },
  });

  return NextResponse.json({ success: true });
}
