import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MarketClient } from "./market-client";

export const metadata: Metadata = { title: "Selector Piață" };

export default async function MarketPage() {
  const t = await getTranslations("market");
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const rows = await prisma.watchlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: [{ groupName: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true, symbol: true, instrumentType: true, groupName: true,
      alertAbove: true, alertBelow: true,
    },
  });

  // Decimal nu poate traversa granița server→client — serializăm la number
  const items = rows.map((r) => ({
    ...r,
    alertAbove: r.alertAbove != null ? Number(r.alertAbove) : null,
    alertBelow: r.alertBelow != null ? Number(r.alertBelow) : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">{t("title")}</h1>
        <p className="text-sm text-zinc-500 mt-1">{t("subtitle")}</p>
      </div>
      <MarketClient initial={items} />
    </div>
  );
}
