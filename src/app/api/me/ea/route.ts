import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createHmac } from "crypto";
import { generateMQ4, generateMQ5 } from "@/lib/ea-templates";

function getUserToken(userId: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "apex-trader-secret";
  return createHmac("sha256", secret).update(`ea:${userId}`).digest("hex").slice(0, 32);
}

function getAppUrl(): string {
  const url = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  // MT4/MT5 WebRequest downgrades POST->GET when it follows a redirect.
  // Vercel 307-redirects the apex domain (tradegx.com) to www, which silently
  // broke EA syncs (POST landed on the GET handler). Target the canonical www
  // host directly so the EA's POST hits the webhook with no redirect in between.
  return url.replace("://tradegx.com", "://www.tradegx.com");
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const userId     = session.user.id;
  const token      = getUserToken(userId);
  const appUrl     = getAppUrl();
  const webhookUrl = `${appUrl}/api/webhooks/ea/${userId}`;

  return NextResponse.json({
    token,
    webhookUrl,
    appDomain: new URL(appUrl).origin,
    eaMQ4: generateMQ4(webhookUrl, token),
    eaMQ5: generateMQ5(webhookUrl, token),
  });
}
