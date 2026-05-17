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

  // 1. Try user's own TwelveData key first (higher rate limits)
  // 2. Fall back to platform key (server-side env var)
  let apiKey: string | null = null;

  const userIntegration = await prisma.userIntegration.findUnique({
    where: { userId_service: { userId: session.user.id, service: "twelvedata" } },
  });

  if (userIntegration?.isActive && userIntegration.apiKey) {
    apiKey = userIntegration.apiKey;
  } else if (process.env.TWELVEDATA_API_KEY) {
    apiKey = process.env.TWELVEDATA_API_KEY;
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: "Date de piață indisponibile.", code: "NO_KEY" },
      { status: 503 }
    );
  }

  const tdSymbols = symbols.map(toTDSymbol);

  const result = tdSymbols.length === 1
    ? await getQuote(apiKey, tdSymbols[0]).then((q) => (q ? { [symbols[0]]: q } : {}))
    : await getBatchQuotes(apiKey, tdSymbols);

  return NextResponse.json({ quotes: result });
}
