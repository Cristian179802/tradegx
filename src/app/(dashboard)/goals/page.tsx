import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { GoalsClient } from "./goals-client";

export const metadata: Metadata = { title: "Obiective" };

export default async function GoalsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const accounts = await prisma.tradingAccount.findMany({
    where: { userId: session.user.id },
    select: {
      id: true, name: true, type: true, currency: true,
      balance: true, initialBalance: true,
      maxDailyLossPct: true, maxDrawdownPct: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const propAccounts = accounts
    .filter((a) => a.type === "CHALLENGE" || a.type === "LIVE")
    .map((a) => {
      const balance = Number(a.balance);
      const initial = Number(a.initialBalance) || balance;
      const pnl = balance - initial;
      const pnlPct = initial > 0 ? (pnl / initial) * 100 : 0;
      const ddPct = initial > 0 && balance < initial ? ((initial - balance) / initial) * 100 : 0;
      return {
        id: a.id, name: a.name, type: a.type, currency: a.currency,
        balance, initial, pnl: +pnl.toFixed(2), pnlPct: +pnlPct.toFixed(2),
        ddPct: +ddPct.toFixed(2),
        maxDrawdownPct: a.maxDrawdownPct != null ? Number(a.maxDrawdownPct) : null,
        maxDailyLossPct: a.maxDailyLossPct != null ? Number(a.maxDailyLossPct) : null,
      };
    });

  return <GoalsClient propAccounts={propAccounts} />;
}
