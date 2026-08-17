import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Contul pe care îl privește utilizatorul ──────────────────────────────────
//
// Selecția stătea DOAR în magazinul client (localStorage), deci se pierdea la
// schimbarea dispozitivului și nu era vizibilă serverului. Rutele de date
// citeau cu totul altceva — flagul `isActive` din baza de date — iar cele două
// puteau arăta conturi diferite în același timp.
//
// Acum selecția trăiește într-un singur loc: baza de date. Aceeași pe telefon
// și pe desktop, aceeași pentru interfață și pentru API.
//
// `accountId: null` înseamnă „toate conturile": niciun cont activ. Astfel
// vederea agregată nu are nevoie de o coloană nouă în schemă.

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const active = await prisma.tradingAccount.findFirst({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, currency: true, balance: true },
  });

  return NextResponse.json({
    accountId: active?.id ?? null,
    all: !active,
    account: active ? { ...active, balance: Number(active.balance) } : null,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || !("accountId" in body)) {
    return NextResponse.json({ error: "accountId lipsă (folosește null pentru toate conturile)" }, { status: 400 });
  }

  const accountId: string | null = body.accountId ?? null;

  // Verificarea proprietății e obligatorie: fără ea, oricine ar putea activa
  // contul altcuiva trimițând un id străin.
  if (accountId !== null) {
    const owned = await prisma.tradingAccount.findFirst({
      where: { id: accountId, userId: session.user.id },
      select: { id: true },
    });
    if (!owned) return NextResponse.json({ error: "Cont negăsit" }, { status: 404 });
  }

  // Într-o singură tranzacție, ca să nu existe nicio clipă în care utilizatorul
  // are două conturi active sau niciunul din greșeală.
  await prisma.$transaction([
    prisma.tradingAccount.updateMany({
      where: { userId: session.user.id, isActive: true },
      data: { isActive: false },
    }),
    ...(accountId
      ? [prisma.tradingAccount.update({ where: { id: accountId }, data: { isActive: true } })]
      : []),
  ]);

  return NextResponse.json({ ok: true, accountId, all: accountId === null });
}
