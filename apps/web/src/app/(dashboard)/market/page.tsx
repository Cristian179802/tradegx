import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MarketClient } from "./market-client";

export const metadata: Metadata = { title: "Selector Piață" };

export default async function MarketPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const items = await prisma.watchlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: [{ groupName: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, symbol: true, instrumentType: true, groupName: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Selector Piață</h1>
        <p className="text-sm text-zinc-500 mt-1">Gestionează lista ta de simboluri urmărite</p>
      </div>
      <MarketClient initial={items} />
    </div>
  );
}
