import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { TeamClient } from "./team-client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const team = await prisma.team.findUnique({ where: { id }, select: { name: true } });
  return { title: team ? `${team.name} — TradeGX Comunitate` : "Comunitate" };
}

export default async function TeamPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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
        take: 50,
        include: {
          user: { select: { id: true, name: true, image: true } },
          _count: { select: { comments: true } },
          reactions: { select: { emoji: true, userId: true } },
        },
      },
    },
  });

  if (!team) notFound();

  const membership = team.members.find((m) => m.userId === userId);

  // Private team: only members can view
  if (!team.isPublic && !membership) {
    redirect("/community?error=private");
  }

  const posts = team.posts.map((p) => {
    const emojiMap: Record<string, { count: number; reacted: boolean }> = {};
    for (const r of p.reactions) {
      if (!emojiMap[r.emoji]) emojiMap[r.emoji] = { count: 0, reacted: false };
      emojiMap[r.emoji].count++;
      if (r.userId === userId) emojiMap[r.emoji].reacted = true;
    }
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
      reactions: Object.entries(emojiMap).map(([emoji, { count, reacted }]) => ({ emoji, count, reacted })),
    };
  });

  return (
    <TeamClient
      team={{
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
      }}
      currentUserId={userId}
    />
  );
}
