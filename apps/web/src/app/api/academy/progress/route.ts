import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";
import {
  EMPTY_PROGRESS,
  mergeProgress,
  normalize,
  sameProgress,
  type AcademyProgressData,
} from "@/lib/academy/progress-merge";

// ── Progresul în Academie ────────────────────────────────────────────────────
//
// GET  → starea din bază (sau goală). Clientul o ÎMBINĂ cu ce are local.
// PUT  → clientul trimite starea lui completă; serverul o îmbină cu ce are și
//        scrie rezultatul. Îmbinarea e comutativă, deci nu contează cine a
//        fost primul: doi clienți care scriu în paralel converg la același rând.
//
// Contul DEMO e împărțit între toți vizitatorii: dacă am scrie progresul lui
// în bază, fiecare ar vedea lecțiile terminate de alții. Pentru el răspundem
// „ține-l local” și nu atingem baza.

export const dynamic = "force-dynamic";

const drillSchema = z.object({
  attempts: z.number().int().min(0).max(1_000_000),
  correct: z.number().int().min(0).max(1_000_000),
  bestStreak: z.number().int().min(0).max(1_000_000),
});

const bodySchema = z.object({
  lessons: z.array(z.string().max(120)).max(500),
  quizzes: z.record(z.string().max(60), z.number().min(0).max(100)),
  drills: z.record(z.string().max(60), drillSchema),
  missed: z.record(z.string().max(80), z.number().int().min(0).max(10_000)),
});

function rowToData(row: {
  lessons: string[];
  quizzes: unknown;
  drills: unknown;
  missed: unknown;
} | null): AcademyProgressData {
  if (!row) return EMPTY_PROGRESS;
  return normalize({ lessons: row.lessons, quizzes: row.quizzes, drills: row.drills, missed: row.missed });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  if (session.user.role === "DEMO") {
    return NextResponse.json({ local: true, progress: EMPTY_PROGRESS });
  }

  const row = await prisma.academyProgress.findUnique({
    where: { userId: session.user.id },
    select: { lessons: true, quizzes: true, drills: true, missed: true },
  });

  return NextResponse.json({ local: false, progress: rowToData(row) });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  if (session.user.role === "DEMO") {
    return NextResponse.json({ local: true, progress: EMPTY_PROGRESS });
  }

  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Date invalide" }, { status: 400 });

  const incoming = normalize(parsed.data);

  try {
    const existing = await prisma.academyProgress.findUnique({
      where: { userId: session.user.id },
      select: { lessons: true, quizzes: true, drills: true, missed: true },
    });
    const current = rowToData(existing);
    const merged = mergeProgress(current, incoming);

    // Nu scriem dacă nu s-a schimbat nimic: fiecare PUT ar bate `updatedAt`
    // degeaba, iar clientul trimite la fiecare bifă.
    if (existing && sameProgress(current, merged)) {
      return NextResponse.json({ local: false, progress: merged });
    }

    // Coloanele Json cer InputJsonValue. Forma e deja garantata de zod la
    // intrare si de `normalize()` la ieșire, deci conversia e sigura aici.
    const scriere = {
      lessons: merged.lessons,
      quizzes: merged.quizzes as Prisma.InputJsonValue,
      drills: merged.drills as unknown as Prisma.InputJsonValue,
      missed: merged.missed as Prisma.InputJsonValue,
    };

    await prisma.academyProgress.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...scriere },
      update: scriere,
    });

    return NextResponse.json({ local: false, progress: merged });
  } catch (err) {
    return apiError("generic", { status: 500, log: ["Academy progress", err] });
  }
}
