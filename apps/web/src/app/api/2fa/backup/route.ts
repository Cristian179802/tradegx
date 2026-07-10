import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptSecret, verifyToken, generateBackupCodes, hashBackupCodes } from "@/lib/twofactor";

// Regenerează codurile de rezervă — cere un cod valid din aplicație.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { code } = await req.json().catch(() => ({}));
  if (!code) return NextResponse.json({ ok: false, code: "invalid_code" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
    where: { id: session.user.id },
    data: { totpBackupCodes: hashBackupCodes(backupCodes) },
  });

  return NextResponse.json({ ok: true, backupCodes });
}
