import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(5000),
  symbol: z.string().max(20).optional().nullable(),
  tags: z.array(z.string().max(30)).max(5).optional(),
  imageUrls: z.array(z.string()).max(4).optional(),
  teamId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 20;

  const [total, posts] = await Promise.all([
    prisma.communityPost.count(),
    prisma.communityPost.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { comments: true } },
        reactions: { select: { emoji: true, userId: true } },
      },
    }),
  ]);

  // Build reaction summaries per post
  const postsWithReactions = posts.map((p) => {
    const emojiMap: Record<string, { count: number; reacted: boolean }> = {};
    for (const r of p.reactions) {
      if (!emojiMap[r.emoji]) emojiMap[r.emoji] = { count: 0, reacted: false };
      emojiMap[r.emoji].count++;
      if (r.userId === session.user.id) emojiMap[r.emoji].reacted = true;
    }
    const reactions = Object.entries(emojiMap).map(([emoji, { count, reacted }]) => ({
      emoji,
      count,
      reacted,
    }));
    const { reactions: _r, ...rest } = p;
    return { ...rest, reactions };
  });

  return NextResponse.json({
    posts: postsWithReactions,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const body = await req.json();
  const result = createSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Date invalide", details: result.error.flatten() }, { status: 400 });
  }

  const post = await prisma.communityPost.create({
    data: {
      userId: session.user.id,
      title: result.data.title,
      content: result.data.content,
      symbol: result.data.symbol ?? null,
      tags: result.data.tags ?? [],
      imageUrls: result.data.imageUrls ?? [],
      teamId: result.data.teamId ?? null,
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json({ ...post, reactions: [] }, { status: 201 });
}
