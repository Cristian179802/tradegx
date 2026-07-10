import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSecret, keyuri, encryptSecret } from "@/lib/twofactor";

// Pornește configurarea 2FA: generează un secret (stocat criptat, „pending"),
// întoarce QR + secret pentru introducere manuală. Nu activează încă.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, totpEnabled: true },
  });
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.totpEnabled) return NextResponse.json({ ok: false, code: "already_enabled" }, { status: 400 });

  const secret = generateSecret();
  const otpauth = keyuri(user.email, secret);
  const qr = await QRCode.toDataURL(otpauth, { margin: 1, width: 220 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpSecret: encryptSecret(secret) },
  });

  return NextResponse.json({ ok: true, secret, otpauth, qr });
}
