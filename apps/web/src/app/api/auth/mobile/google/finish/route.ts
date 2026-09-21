import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { signExchangeCode } from "@/lib/mobile-auth";

// ── Capătul fluxului de conectare cu Google pentru aplicație ─────────────────
//
// Aici ajunge browserul DUPĂ ce NextAuth a terminat cu Google și a pus cookie-ul
// de sesiune. Singura noastră treabă e să transformăm sesiunea aia într-un cod
// pe care telefonul îl poate preschimba în token-uri.
//
// Nu întoarcem JSON, ci o REDIRECȚIONARE către `tradegx://` — fereastra de
// browser se închide singură când vede schema aplicației, și omul se trezește
// înapoi în aplicație fără să apese nimic.
//
// Amprenta (`challenge`) vine din linkul cu care a început tot drumul și e
// pusă în cod. Fără ea n-am avea de ce să legăm codul de telefonul care l-a
// cerut — vezi comentariul din `lib/mobile-auth.ts`.

export const dynamic = "force-dynamic";

function inapoi(parametri: Record<string, string>) {
  const q = new URLSearchParams(parametri).toString();
  return NextResponse.redirect(`tradegx://auth?${q}`);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const challenge = url.searchParams.get("challenge") ?? "";

  // Amprenta e obligatorie. Fără ea am emite un cod pe care oricine l-ar putea
  // folosi, ceea ce e exact ce încercăm să evităm.
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(challenge)) {
    return inapoi({ eroare: "cerere-invalida" });
  }

  const sesiune = await auth();
  const userId = sesiune?.user?.id;
  if (!userId) {
    // Google a eșuat, sau omul a închis fereastra la jumătate.
    return inapoi({ eroare: "neautentificat" });
  }

  return inapoi({ cod: signExchangeCode(userId, challenge) });
}
