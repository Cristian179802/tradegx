import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tradingRulesSchema } from "@/lib/validations";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const body = await req.json();
  const result = tradingRulesSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Date invalide", details: result.error.flatten() }, { status: 400 });
  }

  const { noTradeHoursStart, noTradeHoursEnd, ...data } = result.data;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, maxTradesPerDay: true, defaultRiskPct: true, noTradeDays: true },
  });

  return NextResponse.json(user);
}
