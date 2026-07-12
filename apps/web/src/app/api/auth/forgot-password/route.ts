import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { generatePasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`forgot-pw:${ip}`, { limit: 3, windowSecs: 15 * 60 });
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Prea multe cereri. Încearcă din nou mai târziu." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Email invalid" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && user.password) {
      const token = await generatePasswordResetToken(email);
      try {
        await sendPasswordResetEmail(email, token);
      } catch {
        // silent
      }
    }

    return NextResponse.json({
      success: true,
      message: "Dacă adresa există, vei primi un email cu instrucțiuni.",
    });
  } catch (error) {
    console.error("[FORGOT_PASSWORD]", error);
    return NextResponse.json(
      { success: false, error: "Eroare internă." },
      { status: 500 }
    );
  }
}
