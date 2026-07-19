import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Șterge un abonament Web Push (dezactivare de pe device-ul curent).
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  let endpoint: string | undefined;
  try {
    endpoint = (await req.json())?.endpoint;
  } catch {
    return NextResponse.json({ error: "Cerere invalidă" }, { status: 400 });
  }
  if (!endpoint) return NextResponse.json({ error: "Endpoint lipsă" }, { status: 400 });

  // Doar propriul abonament (userId în filtru).
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
  return NextResponse.json({ ok: true });
}
