import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signTokenPair } from "@/lib/mobile-auth";
import { loginSchema } from "@tradegx/core/validations";

// Login pentru app-ul native — returnează JWT (access + refresh) pentru secure-store.
// NextAuth (cookie) rămâne neatins pentru web.
export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Cerere invalidă" }, { status: 400 }); }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email sau parolă invalide" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    return NextResponse.json({ error: "Credențiale invalide" }, { status: 401 });
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return NextResponse.json({ error: "Credențiale invalide" }, { status: 401 });
  }

  const tokens = signTokenPair(user.id);
  return NextResponse.json({
    ...tokens,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
