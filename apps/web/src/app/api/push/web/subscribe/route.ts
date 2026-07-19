import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Salvează un abonament Web Push pentru utilizatorul curent.
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  let body: { subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă" }, { status: 400 });
  }

  const sub = body.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: "Abonament invalid" }, { status: 400 });
  }

  const userAgent = req.headers.get("user-agent")?.slice(0, 255) ?? null;

  // Upsert pe endpoint (același device se re-abonează fără duplicat).
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: { userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, userAgent },
    update: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth, userAgent },
  });

  return NextResponse.json({ ok: true });
}
