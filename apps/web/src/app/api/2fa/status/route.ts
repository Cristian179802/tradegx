import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Starea 2FA a utilizatorului curent (pentru UI-ul din Setări).
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { totpEnabled: true, totpBackupCodes: true },
  });

  return NextResponse.json({
    enabled: !!user?.totpEnabled,
    backupCount: user?.totpBackupCodes?.length ?? 0,
  });
}
