import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { PostClient } from "./post-client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const post = await prisma.communityPost.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: post?.title ?? "Postare — TradeGX Comunitate" };
}

export default async function PostPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const userId = session.user.id;

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

  if (!post) notFound();

  // Build reaction summaries
  const emojiMap: Record<string, { count: number; reacted: boolean }> = {};
  for (const r of post.reactions) {
    if (!emojiMap[r.emoji]) emojiMap[r.emoji] = { count: 0, reacted: false };
    emojiMap[r.emoji].count++;
    if (r.userId === userId) emojiMap[r.emoji].reacted = true;
  }
  const reactions = Object.entries(emojiMap).map(([emoji, { count, reacted }]) => ({ emoji, count, reacted }));

  const serialized = {
    id: post.id,
    title: post.title,
    content: post.content,
    symbol: post.symbol,
    tags: post.tags,
    imageUrls: post.imageUrls,
    upvotes: post.upvotes,
    createdAt: post.createdAt.toISOString(),
    user: post.user,
    reactions,
    comments: post.comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      user: c.user,
    })),
  };

  return <PostClient post={serialized} currentUserId={userId} />;
}
