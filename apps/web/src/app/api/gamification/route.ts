import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { getGamification } from "@/lib/gamification";

// GET /api/gamification — streak + realizări (gratuit pentru toți: motivează
// jurnalizarea, care e inima produsului pe orice plan).
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const data = await getGamification(userId);
  return NextResponse.json(data);
}
