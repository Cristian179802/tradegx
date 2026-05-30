import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tradingAccountSchema } from "@/lib/validations";

async function getOwnedAccount(id: string, userId: string) {
  const account = await prisma.tradingAccount.findFirst({
    where: { id, userId },
  });
  return account;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { id } = await params;
  const account = await getOwnedAccount(id, session.user.id);
  if (!account) {
    return NextResponse.json({ error: "Cont negăsit" }, { status: 404 });
  }

  return NextResponse.json(account);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedAccount(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Cont negăsit" }, { status: 404 });
  }

  const body = await req.json();
  const result = tradingAccountSchema.partial().safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Date invalide", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { balance, ...rest } = result.data;

  // Auto-synced accounts (MT4/MT5/cTrader/MetaApi) own their balance — it is
  // re-anchored from the broker on every sync. Never let a manual edit override
  // it, otherwise the next sync would just revert it and confuse the user.
  const isSynced =
    existing.lastSyncedAt != null ||
    (existing.brokerSource != null && existing.brokerSource !== "MANUAL");

  const account = await prisma.tradingAccount.update({
    where: { id },
    data: {
      ...rest,
      ...(balance !== undefined && !isSynced ? { balance } : {}),
    },
  });

  return NextResponse.json(account);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedAccount(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Cont negăsit" }, { status: 404 });
  }

  await prisma.tradingAccount.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
