import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";
import { listAccounts } from "@/lib/metaapi";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const integration = await prisma.userIntegration.findUnique({
    where: { userId_service: { userId, service: "metaapi" } },
  });

  if (!integration?.isActive || !integration.apiKey) {
    return NextResponse.json({ error: "MetaAPI nu este conectat" }, { status: 400 });
  }

  try {
    const accounts = await listAccounts(integration.apiKey);

    // Fetch user's TradeGx accounts to show linking status
    const tradingAccounts = await prisma.tradingAccount.findMany({
      where: { userId },
      select: { id: true, name: true, type: true, metaApiId: true },
    });

    const enriched = accounts.map((acc) => ({
      ...acc,
      linkedTradingAccountId: tradingAccounts.find((ta) => ta.metaApiId === acc.id)?.id ?? null,
    }));

    return NextResponse.json({ accounts: enriched, tradingAccounts });
  } catch (err) {
    console.error("[METAAPI/ACCOUNTS]", err);
    return NextResponse.json(
      { error: "Nu s-au putut încărca conturile MetaAPI. Verifică token-ul." },
      { status: 502 }
    );
  }
}
