import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Server-side schema — no confirmPassword (that's client-only)
const serverRegisterSchema = z.object({
  name: z.string().min(2, "Numele trebuie să aibă cel puțin 2 caractere").max(50),
  email: z.string().email("Email invalid"),
  password: z
    .string()
    .min(8, "Parola trebuie să aibă cel puțin 8 caractere")
    .regex(/[A-Z]/, "Parola trebuie să conțină cel puțin o literă mare")
    .regex(/[0-9]/, "Parola trebuie să conțină cel puțin o cifră"),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`register:${ip}`, { limit: 5, windowSecs: 15 * 60 });
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Prea multe cereri. Încearcă din nou mai târziu." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const parsed = serverRegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Date invalide" },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Un cont cu acest email există deja" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      await tx.subscription.create({
        data: {
          userId: newUser.id,
          plan: "FREE",
          status: "TRIALING",
          trialEnd,
        },
      });

      await tx.tradingAccount.create({
        data: {
          userId: newUser.id,
          name: "Cont Demo",
          type: "DEMO",
          currency: "USD",
          balance: 10000,
          initialBalance: 10000,
          leverage: 100,
        },
      });

      return newUser;
    });

    const token = await generateVerificationToken(email);

    // Contul rămâne creat chiar dacă emailul nu pleacă — dar NU mai înghițim
    // eroarea. `catch {}` gol însemna că nici userul, nici logurile nu aflau
    // vreodată că trimiterea a eșuat: exact motivul pentru care lipsa
    // configurării Resend a trecut neobservată.
    let emailSent = false;
    let emailError: string | undefined;
    try {
      await sendVerificationEmail(email, token);
      emailSent = true;
    } catch (err) {
      emailError = err instanceof Error ? err.message : String(err);
      console.error("[REGISTER] Trimiterea emailului de verificare a eșuat:", emailError);
    }

    return NextResponse.json(
      {
        success: true,
        message: emailSent
          ? "Cont creat. Verifică emailul pentru a-l activa."
          : "Cont creat, dar nu am putut trimite emailul de verificare. Poți cere retrimiterea.",
        emailSent,
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER]", error);
    return NextResponse.json(
      { success: false, error: "Eroare internă. Încearcă din nou." },
      { status: 500 }
    );
  }
}
