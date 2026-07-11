import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Pre-check la login: verifică parola și spune dacă mai e nevoie de cod 2FA,
// FĂRĂ a crea o sesiune. Ocolește limitarea NextAuth v5 (nu transmite erori custom).
// Nu divulgă existența contului: parolă greșită / cont inexistent → { ok:false }.
export async function POST(req: Request) {
  // Anti brute-force: endpoint-ul verifică parole → limită strictă pe IP.
  const ip = getClientIp(req);
  const rl = rateLimit(`2fa-required:${ip}`, { limit: 10, windowSecs: 15 * 60 });
  if (!rl.success) {
    return NextResponse.json(
      { ok: false },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) return NextResponse.json({ ok: false });

  const user = await prisma.user.findUnique({
    where: { email: String(email) },
    select: { password: true, totpEnabled: true },
  });

  if (!user?.password || !(await bcrypt.compare(String(password), user.password))) {
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({ ok: true, required: !!user.totpEnabled });
}
