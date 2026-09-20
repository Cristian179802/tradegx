import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";

// POST — leave a team (owner cannot leave, must delete)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;

  const member = await prisma.teamMember.findFirst({
    where: { teamId: id, userId },
  });

  if (!member) return NextResponse.json({ error: "Nu ești membru" }, { status: 404 });
  if (member.role === "OWNER") {
    return NextResponse.json({ error: "Owner-ul nu poate părăsi comunitatea. Șterge-o în schimb." }, { status: 400 });
  }

  await prisma.teamMember.delete({ where: { id: member.id } });
  return NextResponse.json({ success: true });
}
