import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { ACADEMY, DIAGRAMS, TOTAL_LESSONS } from "@/lib/academy";
import { PASS_THRESHOLD, QUIZZES } from "@/lib/academy/quiz";
import { GLOSSARY } from "@/lib/academy/glossary";

// ── Conținutul Academiei, ca date ────────────────────────────────────────────
//
// Lecțiile, diagramele, quiz-urile și glosarul stau în fișiere `.ts` din
// `src/lib/academy`. Sunt date pure, serializabile — exact cum au fost gândite.
//
// DE CE O RUTĂ ȘI NU UN PACHET PARTAJAT. Am fi putut muta conținutul într-un
// pachet din monorepo și să-l împachetăm în aplicație. Ar fi mers offline din
// prima, dar fiecare lecție nouă ar fi cerut o versiune nouă în magazin și o
// așteptare de câteva zile. Așa, o lecție scrisă azi ajunge azi pe telefon, iar
// aplicația o ține local după prima descărcare — deci tot merge fără semnal,
// doar că din a doua deschidere.
//
// Răspunsul e mare (sute de kiloocteți) și NU se schimbă între două
// implementări, deci poate fi păstrat în cache agresiv. `version` e ce
// compară aplicația ca să știe dacă merită descărcat din nou.

// Ruta citește antetul de autentificare, deci NU poate fi statică — ar cădea
// la build cu „Dynamic server usage". Cache-ul stă în răspuns, ca antet
// privat: conținutul e același pentru toți, dar se cere cu un token.
export const dynamic = "force-dynamic";

/** Se schimbă la fiecare modificare de conținut. Aplicația compară cu ce are salvat. */
const VERSIUNE = "2026-09-20";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  return NextResponse.json({
    version: VERSIUNE,
    totalLessons: TOTAL_LESSONS,
    passThreshold: PASS_THRESHOLD,
    // Doar modulele, fără diagramele lor: sunt deja toate în `DIAGRAMS`, iar
    // trimise de două ori ar dubla degeaba jumătate din răspuns.
    modules: ACADEMY.map((b) => b.module),
    diagrams: DIAGRAMS,
    quizzes: QUIZZES,
    glossary: GLOSSARY,
  }, {
    headers: { "Cache-Control": "private, max-age=3600" },
  });
}
