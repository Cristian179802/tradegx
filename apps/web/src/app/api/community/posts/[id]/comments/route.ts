import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ── Comentariile unei postări ────────────────────────────────────────────────
//
// Ruta asta LIPSEA cu totul. Modelul `CommunityComment` există de la început,
// pagina de postare le AFIȘEAZĂ, dar nu exista niciun drum prin care să apară
// vreunul — adică un fir de discuție în care nimeni nu putea scrie.
//
// Descoperit portând comunitatea în aplicație: se vedea numărul de comentarii
// pe card, dar nu exista nimic care să-l poată face mai mare decât zero.

const schema = z.object({
  content: z.string().min(2, "Prea scurt").max(2000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id: postId } = await params;

  const postare = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!postare) return NextResponse.json({ error: "Postare negăsită" }, { status: 404 });

  const corp = await req.json().catch(() => null);
  const rezultat = schema.safeParse(corp);
  if (!rezultat.success) {
    return NextResponse.json({ error: "Comentariu invalid" }, { status: 400 });
  }

  const comentariu = await prisma.communityComment.create({
    data: { postId, userId, content: rezultat.data.content.trim() },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json(comentariu, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id: postId } = await params;
  const comentariuId = req.nextUrl.searchParams.get("comentariu");
  if (!comentariuId) {
    return NextResponse.json({ error: "Lipsește comentariul" }, { status: 400 });
  }

  // Proprietatea se verifică în filtru, nu după citire: fără ea, oricine ar
  // putea șterge comentariul altcuiva trimițând un id străin.
  const sters = await prisma.communityComment.deleteMany({
    where: { id: comentariuId, postId, userId },
  });
  if (sters.count === 0) {
    return NextResponse.json({ error: "Comentariu negăsit" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
