import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// POST /api/auth/resend-verification   { email }
//
// Lipsea complet: dacă emailul de la înregistrare nu ajungea, utilizatorul nu
// avea NICIO cale de recuperare — nici buton, nici rută.
//
// Răspunsul e intenționat identic indiferent dacă adresa există sau nu. Altfel
// ruta ar deveni un oracol prin care oricine poate afla ce adrese sunt
// înregistrate (enumerare de utilizatori).

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`resend-verif:${ip}`, { limit: 5, windowSecs: 15 * 60 });
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Prea multe cereri. Încearcă din nou mai târziu." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  let email: string | undefined;
  try {
    const body = await request.json();
    email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : undefined;
  } catch {
    return NextResponse.json({ success: false, error: "Corp de cerere invalid" }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ success: false, error: "Email obligatoriu" }, { status: 400 });
  }

  const generic = {
    success: true,
    message: "Dacă adresa există și nu e verificată, am trimis un email nou.",
  };

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });

  // Adresă inexistentă sau deja verificată → același răspuns, fără muncă în plus.
  if (!user || user.emailVerified) return NextResponse.json(generic);

  try {
    const token = await generateVerificationToken(email);
    await sendVerificationEmail(email, token);
  } catch (err) {
    // Aici logăm, dar tot nu divulgăm nimic apelantului.
    console.error("[RESEND-VERIFICATION] Trimitere eșuată:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { success: false, error: "Serviciul de email nu este disponibil momentan." },
      { status: 503 }
    );
  }

  return NextResponse.json(generic);
}
