import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(3).max(60),
  description: z.string().max(500).optional().nullable(),
  isPublic: z.boolean().default(true),
});

function makeInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// GET  — list: public teams + teams user is already in
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const userId = session.user.id;

  const [myMemberships, publicTeams] = await Promise.all([
    prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            _count: { select: { members: true, posts: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    }),
    prisma.team.findMany({
      where: {
        isPublic: true,
        members: { none: { userId } },
      },
      include: { _count: { select: { members: true, posts: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({
    myTeams: myMemberships.map((m) => ({
      id: m.team.id,
      name: m.team.name,
      description: m.team.description,
      isPublic: m.team.isPublic,
      avatarUrl: m.team.avatarUrl,
      memberCount: m.team._count.members,
      postCount: m.team._count.posts,
      role: m.role,
      isMember: true,
      isOwner: m.role === "OWNER",
      createdAt: m.team.createdAt.toISOString(),
    })),
    publicTeams: publicTeams.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      isPublic: t.isPublic,
      avatarUrl: t.avatarUrl,
      memberCount: t._count.members,
      postCount: t._count.posts,
      isMember: false,
      isOwner: false,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}

// POST — create team
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const body = await req.json();
  const result = createSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }

  const inviteCode = makeInviteCode();

  const team = await prisma.team.create({
    data: {
      name: result.data.name,
      description: result.data.description ?? null,
      isPublic: result.data.isPublic,
      inviteCode,
      members: {
        create: { userId: session.user.id, role: "OWNER" },
      },
    },
    include: { _count: { select: { members: true, posts: true } } },
  });

  return NextResponse.json(
    {
      id: team.id,
      name: team.name,
      description: team.description,
      isPublic: team.isPublic,
      inviteCode: team.inviteCode,
      memberCount: team._count.members,
      postCount: team._count.posts,
      isMember: true,
      isOwner: true,
      role: "OWNER",
      createdAt: team.createdAt.toISOString(),
    },
    { status: 201 }
  );
}
