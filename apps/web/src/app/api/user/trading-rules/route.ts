import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";
import { tradingRulesSchema } from "@/lib/validations";

export async function PATCH(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  const result = tradingRulesSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Date invalide", details: result.error.flatten() }, { status: 400 });
  }

  const { noTradeHoursStart, noTradeHoursEnd, ...data } = result.data;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      // Salvează explicit orele de no-trade (null dacă câmpul e gol/omis)
      noTradeHoursStart: noTradeHoursStart ?? null,
      noTradeHoursEnd: noTradeHoursEnd ?? null,
    },
    select: {
      id: true,
      maxTradesPerDay: true,
      defaultRiskPct: true,
      noTradeDays: true,
      noTradeHoursStart: true,
      noTradeHoursEnd: true,
    },
  });

  return NextResponse.json(user);
}
