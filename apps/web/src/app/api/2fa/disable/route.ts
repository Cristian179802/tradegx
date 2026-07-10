import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptSecret, verifyToken, verifyBackup } from "@/lib/twofactor";

// Dezactivează 2FA — cere parola ȘI un cod valid (din app sau de rezervă).
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { password, code } = await req.json().catch(() => ({}));
  if (!password || !code) return NextResponse.json({ ok: false, code: "missing_fields" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true, totpSecret: true, totpEnabled: true, totpBackupCodes: true },
  });
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!user.totpEnabled) return NextResponse.json({ ok: false, code: "not_enabled" }, { status: 400 });

  if (!user.password || !(await bcrypt.compare(String(password), user.password))) {
    return NextResponse.json({ ok: false, code: "invalid_password" }, { status: 400 });
  }

  let valid = false;
  if (/^\d{6}$/.test(String(code)) && user.totpSecret) {
    try { valid = verifyToken(String(code), decryptSecret(user.totpSecret)); } catch { valid = false; }
  }
  if (!valid) valid = verifyBackup(String(code), user.totpBackupCodes).ok;
  if (!valid) return NextResponse.json({ ok: false, code: "invalid_code" }, { status: 400 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpEnabled: false, totpSecret: null, totpBackupCodes: [] },
  });

  return NextResponse.json({ ok: true });
}
