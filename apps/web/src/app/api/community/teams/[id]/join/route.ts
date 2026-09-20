import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";

// POST — join a team (public = direct, private = needs inviteCode)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: { members: { where: { userId }, select: { id: true } } },
  });
  if (!team) return NextResponse.json({ error: "Comunitate negăsită" }, { status: 404 });

  if (team.members.length > 0) {
    return NextResponse.json({ error: "Ești deja membru" }, { status: 409 });
  }

  if (!team.isPublic) {
    const body = await req.json().catch(() => ({}));
    if (body.inviteCode !== team.inviteCode) {
      return NextResponse.json({ error: "Cod de invitație invalid" }, { status: 403 });
    }
  }

  const member = await prisma.teamMember.create({
    data: { teamId: id, userId, role: "MEMBER" },
  });

  return NextResponse.json({ success: true, memberId: member.id });
}
