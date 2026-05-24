import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";
import { generateMQ4, generateMQ5 } from "@/lib/ea-templates";

function getWebhookToken(accountId: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "apex-trader-fallback-secret";
  return createHmac("sha256", secret).update(accountId).digest("hex").slice(0, 32);
}

function getAppUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const account = await prisma.tradingAccount.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { id: true, name: true },
  });

  if (!account) {
    return NextResponse.json({ error: "Cont inexistent" }, { status: 404 });
  }

  const token = getWebhookToken(account.id);
  const appUrl = getAppUrl();
  const webhookUrl = `${appUrl}/api/webhooks/mt/${account.id}`;

  return NextResponse.json({
    token,
    webhookUrl,
    eaMQ4: generateMQ4(webhookUrl, token),
    eaMQ5: generateMQ5(webhookUrl, token),
    appDomain: new URL(appUrl).origin,
  });
}
