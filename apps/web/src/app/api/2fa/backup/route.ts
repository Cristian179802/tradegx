import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";
import { decryptSecret, verifyToken, generateBackupCodes, hashBackupCodes } from "@/lib/twofactor";

// Regenerează codurile de rezervă — cere un cod valid din aplicație.
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { code } = await req.json().catch(() => ({}));
  if (!code) return NextResponse.json({ ok: false, code: "invalid_code" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true, totpEnabled: true },
  });
  if (!user || !user.totpEnabled || !user.totpSecret) {
    return NextResponse.json({ ok: false, code: "not_enabled" }, { status: 400 });
  }

  let valid = false;
  try { valid = verifyToken(String(code), decryptSecret(user.totpSecret)); } catch { valid = false; }
  if (!valid) return NextResponse.json({ ok: false, code: "invalid_code" }, { status: 400 });

  const backupCodes = generateBackupCodes(10);
  await prisma.user.update({
    where: { id: userId },
    data: { totpBackupCodes: hashBackupCodes(backupCodes) },
  });

  return NextResponse.json({ ok: true, backupCodes });
}
