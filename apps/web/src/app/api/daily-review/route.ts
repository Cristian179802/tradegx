import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { generateDailyReview } from "@/lib/daily-review";

export const maxDuration = 30;

// Rezumatul zilei la cerere (widget dashboard)
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const review = await generateDailyReview(userId);
  return NextResponse.json(review);
}
