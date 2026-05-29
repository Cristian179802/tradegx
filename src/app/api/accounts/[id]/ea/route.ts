import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";
import { generateMQ4, generateMQ5 } from "@/lib/ea-templates";

/** Token bound to userId — matches the /webhooks/ea/[userId] route */
function getUserEaToken(userId: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "apex-trader-secret";
  return createHmac("sha256", secret).update(`ea:${userId}`).digest("hex").slice(0, 32);
}

function getAppUrl(): string {
  const url = (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
  // MT4/MT5 WebRequest downgrades POST->GET when it follows a redirect.
  // Vercel 307-redirects the apex domain (tradegx.com) to www, which silently
  // broke EA syncs (POST landed on the GET handler). Target the canonical www
  // host directly so the EA's POST hits the webhook with no redirect in between.
  return url.replace("://tradegx.com", "://www.tradegx.com");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  // Verify the account belongs to this user (just for auth check)
  const account = await prisma.tradingAccount.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, name: true },
  });

  if (!account) {
    return NextResponse.json({ error: "Cont inexistent" }, { status: 404 });
  }

  // Use userId-based token + userId-based webhook URL
  // This allows the EA route to auto-create a new trading account on first sync
  const userId = session.user.id;
  const token = getUserEaToken(userId);
  const appUrl = getAppUrl();
  const webhookUrl = `${appUrl}/api/webhooks/ea/${userId}`;

  return NextResponse.json({
    token,
    webhookUrl,
    eaMQ4: generateMQ4(webhookUrl, token),
    eaMQ5: generateMQ5(webhookUrl, token),
    appDomain: new URL(appUrl).origin,
  });
}
