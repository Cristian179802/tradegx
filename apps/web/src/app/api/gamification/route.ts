import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGamification } from "@/lib/gamification";

// GET /api/gamification — streak + realizări (gratuit pentru toți: motivează
// jurnalizarea, care e inima produsului pe orice plan).
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const data = await getGamification(session.user.id);
  return NextResponse.json(data);
}
