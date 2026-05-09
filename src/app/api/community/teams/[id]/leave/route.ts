import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — leave a team (owner cannot leave, must delete)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;
  const userId = session.user.id;

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
