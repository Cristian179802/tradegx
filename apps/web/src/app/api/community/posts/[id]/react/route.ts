import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";

const VALID_EMOJIS = ["🔥", "🚀", "💡", "💯", "👀", "❤️"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { id: postId } = await params;

  let emoji: string;
  try {
    const body = await req.json();
    emoji = body.emoji;
  } catch {
    return NextResponse.json({ error: "Body invalid" }, { status: 400 });
  }

  if (!VALID_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: "Emoji invalid" }, { status: 400 });
  }

  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) return NextResponse.json({ error: "Postare negăsită" }, { status: 404 });

  const existing = await prisma.communityReaction.findUnique({
    where: { postId_userId_emoji: { postId, userId, emoji } },
  });

  if (existing) {
    await prisma.communityReaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: "removed", emoji });
  }

  await prisma.communityReaction.create({
    data: { postId, userId, emoji },
  });
  return NextResponse.json({ action: "added", emoji });
}
