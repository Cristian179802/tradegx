import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/web-push";

export const runtime = "nodejs";

// Cheia publică VAPID pentru abonarea clientului (PushManager.subscribe).
export async function GET() {
  const publicKey = await getVapidPublicKey();
  if (!publicKey) return NextResponse.json({ error: "Web Push neconfigurat" }, { status: 503 });
  return NextResponse.json({ publicKey });
}
