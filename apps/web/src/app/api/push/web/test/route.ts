import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { sendWebPushToUser } from "@/lib/web-push";

export const runtime = "nodejs";

// Trimite o notificare de test către device-urile utilizatorului (confirmare).
export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  await sendWebPushToUser(userId, {
    title: "🔔 TradeGx",
    body: "Notificările sunt active! Vei primi alerte, semnale HPS și mesaje de la AI Coach chiar și cu browserul închis.",
    url: "/dashboard",
    tag: "tradegx-welcome",
  });

  return NextResponse.json({ ok: true });
}
