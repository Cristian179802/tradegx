import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";

/**
 * Marchează o eroare rezolvată sau o redeschide.
 *
 * „Rezolvat" e doar un marcaj de triaj, nu o ștergere: dacă aceeași amprentă
 * reapare, `captureError` pune `resolvedAt` înapoi pe null și rândul urcă singur
 * la loc în listă. Un istoric păstrat spune ceva ce numărătoarea nu spune —
 * dacă am mai crezut o dată că am reparat asta.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  // Aceeași regulă ca la pagină: cine n-are voie nu află nici măcar că există.
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Negăsit" }, { status: 404 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.resolved !== "boolean") {
    return NextResponse.json({ error: "Cerere invalidă" }, { status: 400 });
  }

  try {
    const rand = await prisma.errorLog.update({
      where: { id },
      data: { resolvedAt: body.resolved ? new Date() : null },
      select: { resolvedAt: true },
    });
    return NextResponse.json({ resolvedAt: rand.resolvedAt?.toISOString() ?? null });
  } catch (err) {
    return apiError("generic", { log: ["Admin Errors", err] });
  }
}
