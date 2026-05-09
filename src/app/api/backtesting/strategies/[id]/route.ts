import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(500).optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  rules: z.record(z.unknown()).optional(),
});

async function getStrategy(id: string, userId: string) {
  return prisma.strategy.findFirst({ where: { id, userId } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;
  const strategy = await getStrategy(id, session.user.id);
  if (!strategy) return NextResponse.json({ error: "Negăsit" }, { status: 404 });

  const body = await req.json();
  const result = updateSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Date invalide" }, { status: 400 });

  const updated = await prisma.strategy.update({ where: { id }, data: result.data as never });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;
  const strategy = await getStrategy(id, session.user.id);
  if (!strategy) return NextResponse.json({ error: "Negăsit" }, { status: 404 });

  await prisma.strategy.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
