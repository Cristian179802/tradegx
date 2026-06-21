import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createHmac } from "crypto";

function getUserToken(userId: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "apex-trader-secret";
  return createHmac("sha256", secret).update(`ea:${userId}`).digest("hex").slice(0, 32);
}

function getAppUrl(): string {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const userId = session.user.id;
  const token  = getUserToken(userId);
  const appUrl = getAppUrl();
  const webhookUrl = `${appUrl}/api/webhooks/ea/${userId}`;

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    ticket: 999999001, positionId: 999999001,
    symbol: "EURUSD", type: "buy", lots: 0.01,
    openPrice: 1.10000, closePrice: 1.10100,
    openTime: now - 3600, closeTime: now,
    profit: 10.00, commission: -0.5, swap: 0,
    sl: 0, tp: 0, balance: 10000,
    login: "TEST_DIAG", platform: "mt5",
  };

  let webhookRes: Response;
  let body: unknown;

  try {
    webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Apex-Token": token },
      body: JSON.stringify(payload),
    });
    body = await webhookRes.json().catch(() => null);
  } catch (e) {
    return NextResponse.json({
      ok: false,
      step: "fetch",
      error: e instanceof Error ? e.message : String(e),
      webhookUrl,
    });
  }

  return NextResponse.json({
    ok: webhookRes.ok,
    status: webhookRes.status,
    body,
    webhookUrl,
    userId,
  });
}
