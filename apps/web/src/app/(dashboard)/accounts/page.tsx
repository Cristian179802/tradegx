import type { Metadata } from "next";
import { isExchangeSourced } from "@/lib/exchange-sourced";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AccountsClient } from "./accounts-client";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageTitles");
  return { title: t("accounts") };
}

export default async function AccountsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const raw = await prisma.tradingAccount.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { trades: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Aggregate P&L per account directly from trades (more accurate than balance delta,
  // covers imported trades that didn't update account balance at import time)
  const accountIds = raw.map((a) => a.id);
  const pnlAgg = await prisma.trade.groupBy({
    by: ["accountId"],
    where: {
      accountId: { in: accountIds },
      OR: [{ status: "CLOSED" }, { pnlMoney: { not: null } }],
    },
    _sum: { pnlMoney: true, commission: true, swap: true },
  });
  // MT4/MT5 commission & swap are already signed, so the broker-accurate net is
  // pnlMoney + commission + swap (NOT minus). This matches the webhook's anchor.
  const pnlMap = new Map(
    pnlAgg.map((g) => [
      g.accountId,
      Number(g._sum.pnlMoney ?? 0)
        + Number(g._sum.commission ?? 0)
        + Number(g._sum.swap ?? 0),
    ])
  );

  // Auto-sync account balances that are out of date (e.g. after CSV import)
  //
  // NU pentru conturile de bursă: acolo soldul vine de la bursă și e adevărul.
  // Formula `initialBalance + P&L realizat` nu poate ajunge la el, fiindcă ratează
  // pozițiile DESCHISE — care au `pnlMoney` null tocmai ca să nu murdărească
  // statistica. Pe un cont cu poziții deschise, recalcularea rescria soldul real
  // de la Binance cu unul dedus, la fiecare încărcare de pagină.
  const syncOps: Promise<unknown>[] = [];
  for (const a of raw) {
    if (isExchangeSourced(a.brokerSource)) continue;
    const tradePnl = pnlMap.get(a.id) ?? 0;
    const correctBalance = Number(a.initialBalance) + tradePnl;
    const storedBalance = Number(a.balance);
    // If off by more than 1 cent, sync
    if (Math.abs(correctBalance - storedBalance) > 0.01) {
      syncOps.push(
        prisma.tradingAccount.update({
          where: { id: a.id },
          data: { balance: correctBalance },
        })
      );
    }
  }
  if (syncOps.length > 0) await Promise.all(syncOps);

  // Re-fetch after sync (or compute corrected balances inline)
  const accounts = raw.map((a) => {
    const tradePnl = pnlMap.get(a.id) ?? 0;
    const correctBalance = isExchangeSourced(a.brokerSource)
      ? Number(a.balance)
      : Number(a.initialBalance) + tradePnl;
    return {
      ...a,
      balance: correctBalance.toFixed(2),
      initialBalance: a.initialBalance.toString(),
      maxDailyLossPct: a.maxDailyLossPct?.toString() ?? null,
      maxDrawdownPct: a.maxDrawdownPct?.toString() ?? null,
      tradePnl: tradePnl.toFixed(2),
      lastSyncedAt: a.lastSyncedAt?.toISOString() ?? null,
    };
  });

  return <AccountsClient initialAccounts={accounts} />;
}
