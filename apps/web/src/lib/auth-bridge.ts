import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { verifyAccessToken } from "@/lib/mobile-auth";

// Identifică utilizatorul din DOUĂ surse:
//  1. NextAuth (cookie httpOnly) — web
//  2. Authorization: Bearer <JWT> — mobile (expo-secure-store)
// Returnează userId sau null. Folosit în endpoint-urile consumate de ambele platforme.
export async function getAuthUserId(): Promise<string | null> {
  // Web — sesiune NextAuth
  try {
    const session = await auth();
    if (session?.user?.id) return session.user.id;
  } catch {
    /* fără sesiune web — încearcă tokenul mobile */
  }

  // Mobile — Bearer token
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
