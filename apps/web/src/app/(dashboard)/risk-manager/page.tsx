import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccountScope } from "@/lib/account-scope";
import { redirect } from "next/navigation";
import { RiskManagerClient } from "./risk-manager-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageTitles");
  return { title: t("riskManager") };
}

export default async function RiskManagerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Riscul se măsoară pe contul pe care tranzacționezi. Pierderea zilei
  // însumată peste toate conturile nu spune nimic despre limita niciunuia —
  // și exact limita e ce apără pagina asta.
  const scope = await getAccountScope(session.user.id);

  const [accounts, user, todayTrades, weekTrades] = await Promise.all([
    prisma.tradingAccount.findMany({
      where: { userId: session.user.id },
      select: {
        id: true, name: true, type: true, currency: true,
        balance: true, initialBalance: true,
        maxDailyLossPct: true, maxDrawdownPct: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { defaultRiskPct: true, maxTradesPerDay: true, noTradeDays: true },
    }),
    prisma.trade.findMany({
      where: {
        ...scope.where,
        status: "CLOSED",
        exitTime: { gte: new Date(new Date().setHours(0,0,0,0)) },
      },
      select: { pnlMoney: true, riskPercent: true, direction: true },
    }),
    prisma.trade.findMany({
      where: {
        ...scope.where,
        status: "CLOSED",
        exitTime: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { pnlMoney: true, exitTime: true },
    }),
  ]);

  const serialized = {
    accounts: accounts.map(a => ({
      ...a,
      balance: a.balance.toString(),
      initialBalance: a.initialBalance.toString(),
      maxDailyLossPct: a.maxDailyLossPct?.toString() ?? null,
      maxDrawdownPct: a.maxDrawdownPct?.toString() ?? null,
    })),
    user: {
      defaultRiskPct: user?.defaultRiskPct?.toString() ?? "1",
      maxTradesPerDay: user?.maxTradesPerDay ?? 5,
      noTradeDays: user?.noTradeDays ?? [],
    },
    todayPnl: todayTrades.reduce((sum, t) => sum + (Number(t.pnlMoney) || 0), 0),
    todayTradeCount: todayTrades.length,
    weekPnl: weekTrades.reduce((sum, t) => sum + (Number(t.pnlMoney) || 0), 0),
  };

  return <RiskManagerClient data={serialized} />;
}
