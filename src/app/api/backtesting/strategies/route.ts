import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const strategySchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional().nullable(),
  type: z.enum(["EMA_CROSSOVER", "SESSION_BREAKOUT", "RSI_REVERSAL", "TREND_FOLLOWING", "CUSTOM"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  rules: z.record(z.unknown()),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const strategies = await prisma.strategy.findMany({
    where: { userId: session.user.id, isActive: true },
    include: {
      _count: { select: { backtests: true } },
      backtests: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true, netPnl: true, winRate: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(
    strategies.map((s) => ({
      ...s,
      backtests: s.backtests.map((b) => ({
        ...b,
        netPnl: b.netPnl?.toString() ?? null,
        winRate: b.winRate?.toString() ?? null,
      })),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const body = await req.json();
  const result = strategySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Date invalide", details: result.error.flatten() }, { status: 400 });
  }

  const strategy = await prisma.strategy.create({
    data: {
      userId: session.user.id,
      name: result.data.name,
      description: result.data.description ?? null,
      type: result.data.type,
      color: result.data.color ?? null,
      rules: result.data.rules as never,
    },
  });

  return NextResponse.json(strategy, { status: 201 });
}
