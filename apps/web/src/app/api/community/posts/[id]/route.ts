import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;

  const post = await prisma.communityPost.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, image: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      reactions: { select: { emoji: true, userId: true } },
    },
  });

  if (!post) return NextResponse.json({ error: "Negăsit" }, { status: 404 });

  // Aggregate reactions
  const emojiMap: Record<string, { count: number; reacted: boolean }> = {};
  for (const r of post.reactions) {
    if (!emojiMap[r.emoji]) emojiMap[r.emoji] = { count: 0, reacted: false };
    emojiMap[r.emoji].count++;
    if (r.userId === session.user.id) emojiMap[r.emoji].reacted = true;
  }
  const reactions = Object.entries(emojiMap).map(([emoji, { count, reacted }]) => ({ emoji, count, reacted }));
  const { reactions: _r, ...rest } = post;

  return NextResponse.json({ ...rest, reactions });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;

  const post = await prisma.communityPost.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!post) return NextResponse.json({ error: "Negăsit sau neautorizat" }, { status: 404 });

  await prisma.communityPost.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

const commentSchema = z.object({ content: z.string().min(1).max(2000) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;
  const post = await prisma.communityPost.findUnique({ where: { id }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "Post negăsit" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  const result = commentSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Conținut invalid" }, { status: 400 });
  }

  const comment = await prisma.communityComment.create({
    data: { postId: id, userId: session.user.id, content: result.data.content },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json(comment, { status: 201 });
}
