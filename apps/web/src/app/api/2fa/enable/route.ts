import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptSecret, verifyToken, generateBackupCodes, hashBackupCodes } from "@/lib/twofactor";

// Confirmă un cod din aplicație → activează 2FA + generează coduri de rezervă.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { code } = await req.json().catch(() => ({}));
  if (!code || typeof code !== "string") return NextResponse.json({ ok: false, code: "invalid_code" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { totpSecret: true, totpEnabled: true },
  });
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.totpEnabled) return NextResponse.json({ ok: false, code: "already_enabled" }, { status: 400 });
  if (!user.totpSecret) return NextResponse.json({ ok: false, code: "no_pending" }, { status: 400 });

  let valid = false;
  try { valid = verifyToken(code, decryptSecret(user.totpSecret)); } catch { valid = false; }
  if (!valid) return NextResponse.json({ ok: false, code: "invalid_code" }, { status: 400 });

  const backupCodes = generateBackupCodes(10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpEnabled: true, totpBackupCodes: hashBackupCodes(backupCodes) },
  });

  return NextResponse.json({ ok: true, backupCodes });
}
