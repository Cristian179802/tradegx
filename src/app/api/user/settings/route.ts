import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema, tradingRulesSchema } from "@/lib/validations";
import { z } from "zod";

const settingsSchema = profileSchema
  .partial()
  .merge(tradingRulesSchema.partial());

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const body = await req.json();
  const result = settingsSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Date invalide", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { noTradeHoursStart, noTradeHoursEnd, ...rest } = result.data;

  const user = await prisma.user.update({
    where: { id: session.user.id },
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
