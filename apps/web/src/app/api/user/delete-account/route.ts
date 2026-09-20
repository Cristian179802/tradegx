import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }


  // Cancel Stripe subscription if active
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: { stripeSubId: true },
    });

    if (subscription?.stripeSubId) {
      const { getStripe } = await import("@/lib/stripe");
      await getStripe().subscriptions.cancel(subscription.stripeSubId).catch(() => {});
    }
  } catch {
    // Non-fatal — proceed with deletion
  }

  // Delete user (cascades to all related data via Prisma schema onDelete: Cascade)
  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ success: true });
}
