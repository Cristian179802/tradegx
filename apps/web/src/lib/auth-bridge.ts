import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { verifyAccessToken } from "@/lib/mobile-auth";

// Identifică utilizatorul din DOUĂ surse:
//  1. NextAuth (cookie httpOnly) — web
//  2. Authorization: Bearer <JWT> — mobile (expo-secure-store)
// Returnează userId sau null. Folosit în endpoint-urile consumate de ambele platforme.
export async function getAuthUserId(): Promise<string | null> {
  try {
    const session = await auth();
    if (session?.user?.id) return session.user.id;
  } catch {
    /* fără sesiune web — încearcă tokenul mobile */
  }
  try {
    const h = await headers();
    const authz = h.get("authorization") ?? h.get("Authorization");
    if (authz && authz.startsWith("Bearer ")) {
      return verifyAccessToken(authz.slice(7).trim());
    }
  } catch {
    /* ignoră */
  }
  return null;
}

/**
 * Ca `getAuthUserId`, dar întoarce și câmpurile de care au nevoie rutele care
 * verifică rolul sau trimit emailul mai departe (Stripe, integrări, admin).
 *
 * Pe web vine din sesiunea NextAuth, fără interogare. Pe mobil tokenul poartă
 * DOAR id-ul — deliberat, ca un token furat să nu divulge nimic despre om —
 * deci rolul se citește din baza de date. O interogare în plus, doar pe rutele
 * care chiar au nevoie; restul rămân pe `getAuthUserId`.
 */
export async function getAuthUser(): Promise<{
  id: string;
  email: string | null;
  name: string | null;
  role: string | null;
} | null> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      return {
        id: session.user.id,
        email: session.user.email ?? null,
        name: session.user.name ?? null,
        role: (session.user as { role?: string }).role ?? null,
      };
    }
  } catch {
    /* fără sesiune web — încearcă tokenul mobile */
  }

  const id = await getAuthUserId();
  if (!id) return null;

  const { prisma } = await import("@/lib/prisma");
  const u = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true },
  });
  return u ? { id: u.id, email: u.email, name: u.name, role: u.role } : null;
}
