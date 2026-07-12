import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signTokenPair } from "@/lib/mobile-auth";
import { loginSchema } from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Login pentru app-ul native — returnează JWT (access + refresh) pentru secure-store.
// NextAuth (cookie) rămâne neatins pentru web.
export async function POST(req: Request) {
  // Anti brute-force: verificăm parole → limită strictă pe IP.
  const ip = getClientIp(req);
  const rl = await rateLimit(`mobile-login:${ip}`, { limit: 10, windowSecs: 15 * 60 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Prea multe încercări. Încearcă din nou mai târziu." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email sau parolă invalide" }, { status: 400 });
  }
  const { email, password } = parsed.data;
  // Cod 2FA opțional (6 cifre din app sau cod de rezervă) — în afara loginSchema.
  const code = String((body as { code?: unknown })?.code ?? "").trim();

  const user = await prisma.user.findUnique({ where: { email } });
  // Mesaj generic + comparație bcrypt chiar și fără user (anti-enumeration / timing)
  if (!user || !user.password) {
    return NextResponse.json({ error: "Credențiale invalide" }, { status: 401 });
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return NextResponse.json({ error: "Credențiale invalide" }, { status: 401 });
  }

  // ── Gate 2FA — mobile respectă aceeași regulă ca web (fără bypass) ──
  if (user.totpEnabled && user.totpSecret) {
    if (!code) {
      return NextResponse.json({ error: "Cod 2FA necesar", twoFARequired: true }, { status: 401 });
    }
    const { verifyToken, decryptSecret, verifyBackup } = await import("@/lib/twofactor");
    let codeOk = false;
    if (/^\d{6}$/.test(code)) {
      try { codeOk = verifyToken(code, decryptSecret(user.totpSecret)); } catch { codeOk = false; }
    }
    if (!codeOk) {
      const res = verifyBackup(code, user.totpBackupCodes);
      if (res.ok) {
        await prisma.user.update({ where: { id: user.id }, data: { totpBackupCodes: res.remaining } });
        codeOk = true;
      }
    }
    if (!codeOk) {
      return NextResponse.json({ error: "Cod 2FA invalid", twoFARequired: true }, { status: 401 });
    }
  }

  const tokens = signTokenPair(user.id);
  return NextResponse.json({
    ...tokens,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
