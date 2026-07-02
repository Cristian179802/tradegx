import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }

  // Persist alert settings as notificationPrefs on the user model
  await prisma.user.update({
    where: { id: session.user.id },
    data: { notificationPrefs: body },
  });

  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notificationPrefs: true },
  });

  return NextResponse.json(user?.notificationPrefs ?? {});
}
