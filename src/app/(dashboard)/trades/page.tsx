import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TradesClient } from "./trades-client";

export const metadata = { title: "Trade-uri" };

export default async function TradesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const accounts = await prisma.tradingAccount.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  return <TradesClient accounts={accounts} />;
}
