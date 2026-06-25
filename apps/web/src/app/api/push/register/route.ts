import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";

// Înregistrează tokenul Expo al device-ului pentru push notifications.
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  let body: { token?: string; platform?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă" }, { status: 400 });
  }
  if (!body.token) {
    return NextResponse.json({ error: "Token lipsă" }, { status: 400 });
  }

  await prisma.pushToken.upsert({
    where: { token: body.token },
    create: { token: body.token, platform: body.platform ?? null, userId },
    update: { userId, platform: body.platform ?? null },
  });

  return NextResponse.json({ success: true });
}

// Dezînregistrare (logout pe device).
export async function DELETE(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă" }, { status: 400 });
  }
  if (body.token) {
    await prisma.pushToken.deleteMany({ where: { token: body.token, userId } });
  }
  return NextResponse.json({ success: true });
}
