import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBatchQuotes, getQuote, toTDSymbol } from "@/lib/twelvedata";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const symbols = searchParams.get("symbols")?.split(",").filter(Boolean) ?? [];

  if (!symbols.length) {
    return NextResponse.json({ error: "Specifică cel puțin un simbol" }, { status: 400 });
  }

  // Get user's TwelveData API key
  const integration = await prisma.userIntegration.findUnique({
    where: { userId_service: { userId: session.user.id, service: "twelvedata" } },
  });

  if (!integration?.isActive || !integration.apiKey) {
    return NextResponse.json({ error: "TwelveData nu este conectat", code: "NOT_CONNECTED" }, { status: 400 });
  }

  const tdSymbols = symbols.map(toTDSymbol);

  const quotes = tdSymbols.length === 1
    ? (() => {
        // Return single quote as record
        return getQuote(integration.apiKey!, tdSymbols[0]).then((q) =>
          q ? { [symbols[0]]: q } : {}
        );
      })()
    : getBatchQuotes(integration.apiKey, tdSymbols);

  const result = await quotes;
  return NextResponse.json({ quotes: result });
}
