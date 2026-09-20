import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";

// POST { code } — find private team by invite code and join it
export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { code } = await req.json().catch(() => ({}));
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Cod lipsă" }, { status: 400 });
  }

  const team = await prisma.team.findUnique({
    where: { inviteCode: code.trim().toUpperCase() },
    include: { members: { where: { userId }, select: { id: true } } },
  });

  if (!team) return NextResponse.json({ error: "Codul este invalid sau expirat" }, { status: 404 });
  if (team.members.length > 0) return NextResponse.json({ error: "Ești deja în această comunitate" }, { status: 409 });

  await prisma.teamMember.create({
    data: { teamId: team.id, userId, role: "MEMBER" },
  });

  // Fetch updated team with counts
  const updatedTeam = await prisma.team.findUnique({
    where: { id: team.id },
    include: { _count: { select: { members: true, posts: true } } },
  });

  return NextResponse.json({
    id: team.id,
    name: team.name,
    description: team.description,
    isPublic: team.isPublic,
    avatarUrl: team.avatarUrl,
    inviteCode: null,
    _count: { members: updatedTeam?._count.members ?? 1, posts: updatedTeam?._count.posts ?? 0 },
  });
}
