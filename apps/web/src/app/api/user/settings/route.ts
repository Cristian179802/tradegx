import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";
import { profileSchema, tradingRulesSchema } from "@/lib/validations";
import { z } from "zod";

const settingsSchema = profileSchema
  .partial()
  .merge(tradingRulesSchema.partial());

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      language: true,
      currency: true,
      theme: true,
      timezone: true,
      maxTradesPerDay: true,
      defaultRiskPct: true,
      noTradeDays: true,
    },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  const result = settingsSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Date invalide", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { noTradeHoursStart, noTradeHoursEnd, ...rest } = result.data;

  const user = await prisma.user.update({
    where: { id: userId },
    data: rest,
    select: {
      id: true,
      name: true,
      language: true,
      currency: true,
      theme: true,
      timezone: true,
    },
  });

  return NextResponse.json(user);
}
