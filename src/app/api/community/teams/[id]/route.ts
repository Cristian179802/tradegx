import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — team detail (posts + members)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;
  const userId = session.user.id;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { joinedAt: "asc" },
      },
      posts: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          user: { select: { id: true, name: true, image: true } },
          _count: { select: { comments: true } },
          reactions: { select: { emoji: true, userId: true } },
        },
      },
    },
  });

  if (!team) return NextResponse.json({ error: "Negăsit" }, { status: 404 });

  const membership = team.members.find((m) => m.userId === userId);
  if (!team.isPublic && !membership) {
    return NextResponse.json({ error: "Acces interzis" }, { status: 403 });
  }

  const posts = team.posts.map((p) => {
    const emojiMap: Record<string, { count: number; reacted: boolean }> = {};
    for (const r of p.reactions) {
      if (!emojiMap[r.emoji]) emojiMap[r.emoji] = { count: 0, reacted: false };
      emojiMap[r.emoji].count++;
      if (r.userId === userId) emojiMap[r.emoji].reacted = true;
    }
    const reactions = Object.entries(emojiMap).map(([emoji, { count, reacted }]) => ({ emoji, count, reacted }));
    return {
      id: p.id,
      title: p.title,
      content: p.content,
      symbol: p.symbol,
      tags: p.tags,
      imageUrls: p.imageUrls,
      upvotes: p.upvotes,
      createdAt: p.createdAt.toISOString(),
      user: p.user,
      _count: p._count,
      reactions,
    };
  });

  return NextResponse.json({
    id: team.id,
    name: team.name,
    description: team.description,
    isPublic: team.isPublic,
    inviteCode: membership?.role === "OWNER" ? team.inviteCode : null,
    createdAt: team.createdAt.toISOString(),
    isMember: !!membership,
    isOwner: membership?.role === "OWNER",
    role: membership?.role ?? null,
    members: team.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      user: m.user,
    })),
    posts,
  });
}

// DELETE — delete team (owner only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;
  const member = await prisma.teamMember.findFirst({
    where: { teamId: id, userId: session.user.id, role: "OWNER" },
  });
  if (!member) return NextResponse.json({ error: "Neautorizat" }, { status: 403 });

  await prisma.team.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
