"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

// ── Pornirea conectării cu Google din aplicația de telefon ───────────────────
//
// Pagina asta nu e pentru oameni care navighează pe site: aplicația o deschide
// într-o fereastră peste ea însăși, iar ea trimite mai departe la Google fără
// să aștepte vreo apăsare. Se vede o clipă, cât se încarcă.
//
// De ce nu merge direct pe `/api/auth/signin/google`: acolo NextAuth cere un
// POST cu jeton CSRF, iar un GET arată un ecran de confirmare în plus. `signIn`
// din client face toată treaba și duce la Google dintr-un pas.
//
// `challenge` e amprenta secretului păstrat de telefon. O purtăm prin toată
// călătoria ca s-o regăsim în `/api/auth/mobile/google/finish`, care o pune în
// codul de întoarcere.

export default function MobileGoogle() {
  const [eroare, setEroare] = useState<string | null>(null);

  useEffect(() => {
    const challenge = new URLSearchParams(window.location.search).get("challenge") ?? "";
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(challenge)) {
      setEroare("Cerere invalidă.");
      return;
    }
    void signIn("google", {
      callbackUrl: `/api/auth/mobile/google/finish?challenge=${encodeURIComponent(challenge)}`,
    });
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      {eroare ? (
        <p className="text-sm text-rose-400">{eroare}</p>
      ) : (
        <>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500" />
          <p className="text-sm text-zinc-400">Te ducem la Google…</p>
        </>
      )}
    </div>
  );
}
