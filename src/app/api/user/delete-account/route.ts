import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const userId = session.user.id;

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
