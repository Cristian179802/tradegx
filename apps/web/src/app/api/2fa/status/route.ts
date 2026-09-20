import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";

// Starea 2FA a utilizatorului curent (pentru UI-ul din Setări).
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpEnabled: true, totpBackupCodes: true },
  });

  return NextResponse.json({
    enabled: !!user?.totpEnabled,
    backupCount: user?.totpBackupCodes?.length ?? 0,
  });
}
