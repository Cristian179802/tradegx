import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateDailyReview } from "@/lib/daily-review";

export const maxDuration = 30;

// Rezumatul zilei la cerere (widget dashboard)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const review = await generateDailyReview(session.user.id);
  return NextResponse.json(review);
}
