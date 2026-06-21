import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CommunityClient } from "./community-client";

export const metadata: Metadata = { title: "Comunitate — TradeGX" };

export default async function CommunityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [totalUsers, totalTeams] = await Promise.all([
    prisma.user.count(),
    prisma.team.count(),
  ]);

  const myTeamMemberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        include: {
          _count: { select: { members: true, posts: true } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const publicTeams = await prisma.team.findMany({
    where: {
      isPublic: true,
      members: { none: { userId } },
    },
    include: {
      _count: { select: { members: true, posts: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const myTeams = myTeamMemberships.map((m) => ({
    id: m.team.id,
    name: m.team.name,
    description: m.team.description,
    isPublic: m.team.isPublic,
    avatarUrl: m.team.avatarUrl,
    inviteCode: m.role === "OWNER" ? m.team.inviteCode : null,
    myRole: m.role as "OWNER" | "ADMIN" | "MEMBER",
    _count: m.team._count,
  }));

  const publicTeamsSerialized = publicTeams.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    isPublic: t.isPublic,
    avatarUrl: t.avatarUrl,
    inviteCode: null as null,
    myRole: null as null,
    _count: t._count,
  }));

  return (
    <CommunityClient
      currentUserId={userId}
      stats={{ totalUsers, totalTeams }}
      myTeams={myTeams}
      publicTeams={publicTeamsSerialized}
    />
  );
}
