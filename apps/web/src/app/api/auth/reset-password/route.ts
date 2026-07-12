import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations";
import { verifyToken, consumeToken } from "@/lib/tokens";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`reset-pw:${ip}`, { limit: 5, windowSecs: 15 * 60 });
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Prea multe cereri. Încearcă din nou mai târziu." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const { token, ...rest } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token lipsă" },
        { status: 400 }
      );
    }

    const parsed = resetPasswordSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Date invalide" },
        { status: 400 }
      );
    }

    const result = await verifyToken(token, "PASSWORD_RESET");
    if (!result) {
      return NextResponse.json(
        { success: false, error: "Linkul a expirat sau este invalid" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

    await prisma.user.update({
      where: { email: result.identifier },
      data: { password: hashedPassword },
    });

    await consumeToken(token);

    return NextResponse.json({
      success: true,
      message: "Parola a fost resetată cu succes.",
    });
  } catch (error) {
    console.error("[RESET_PASSWORD]", error);
    return NextResponse.json(
      { success: false, error: "Eroare internă." },
      { status: 500 }
    );
  }
}
