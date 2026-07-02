import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createHmac } from "crypto";

// Returnează URL-ul de webhook TradingView al utilizatorului curent.
function getTvToken(userId: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "apex-trader-secret";
  return createHmac("sha256", secret).update(`tv:${userId}`).digest("hex").slice(0, 32);
}

function getAppUrl(): string {
  const url = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  // Evită redirect-ul apex→www (TradingView nu urmează redirecturi la POST).
  return url.replace("://tradegx.com", "://www.tradegx.com");
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const userId = session.user.id;
  const token = getTvToken(userId);
  const webhookUrl = `${getAppUrl()}/api/webhooks/tradingview/${userId}?token=${token}`;

  return NextResponse.json({
    webhookUrl,
    // Șablon de mesaj pentru alertele TradingView (câmpurile sunt opționale)
    exampleMessage: {
      symbol: "{{ticker}}",
      direction: "buy",
      price: "{{close}}",
      timeframe: "{{interval}}",
      comment: "Breakout confirmat",
    },
  });
}
