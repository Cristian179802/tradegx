import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Pre-check la login: verifică parola și spune dacă mai e nevoie de cod 2FA,
// FĂRĂ a crea o sesiune. Ocolește limitarea NextAuth v5 (nu transmite erori custom).
// Nu divulgă existența contului: parolă greșită / cont inexistent → { ok:false }.
export async function POST(req: Request) {
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
