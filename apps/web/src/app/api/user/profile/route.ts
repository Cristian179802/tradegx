import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Acceptă atât câmpurile de profil (nume) cât și preferințele de afișare
// (limbă, monedă, temă, fus orar) — AppearanceTab și ProfileTab apelează
// ambele această rută.
const updateProfileSchema = z.object({
  name:     z.string().min(2).max(50).optional(),
  language: z.enum(["RO", "EN", "ES", "DE", "FR", "IT"]).optional(),
  currency: z.enum(["USD", "EUR", "GBP", "RON", "CHF", "JPY"]).optional(),
  theme:    z.enum(["DARK", "LIGHT", "AMOLED"]).optional(),
  timezone: z.string().min(1).max(50).optional(),
});

export async function PATCH(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  const result = updateProfileSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Date invalide", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: result.data,
    select: { id: true, name: true, email: true, language: true, currency: true, theme: true, timezone: true },
  });

  return NextResponse.json(user);
}
