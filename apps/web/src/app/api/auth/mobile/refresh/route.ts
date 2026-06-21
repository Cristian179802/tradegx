import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signTokenPair, verifyRefreshToken } from "@/lib/mobile-auth";

// Reînnoiește perechea de token-uri pe baza refresh token-ului (rotație completă).
export async function POST(req: Request) {
  let body: { refreshToken?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Cerere invalidă" }, { status: 400 }); }

  const userId = body.refreshToken ? verifyRefreshToken(body.refreshToken) : null;
  if (!userId) {
    return NextResponse.json({ error: "Refresh token invalid sau expirat" }, { status: 401 });
  }

  // Verifică că utilizatorul încă există
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } });
  if (!user) {
    return NextResponse.json({ error: "Utilizator inexistent" }, { status: 401 });
  }

  const tokens = signTokenPair(user.id);
  return NextResponse.json({ ...tokens, user });
}
