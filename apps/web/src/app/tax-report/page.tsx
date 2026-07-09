import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaywallCard } from "@/components/billing/paywall-card";
import { TaxReportClient } from "./tax-report-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("taxReport");
  return { title: t("metaTitle"), description: t("metaDesc") };
}

interface Props { searchParams: Promise<{ year?: string }> }

export default async function TaxReportPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const t = await getTranslations("taxReport");

  const isPro = session.user.plan === "PRO" || session.user.isTrialing;
  if (!isPro) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <PaywallCard feature={t("navTitle")} description={t("paywallDesc")} bullets={[t("pw1"), t("pw2"), t("pw3"), t("pw4")]} />
      </div>
    );
  }

  const { prisma } = await import("@/lib/prisma");
  const userId = session.user.id;

  const [accounts, trades] = await Promise.all([
    prisma.tradingAccount.findMany({ where: { userId }, select: { currency: true } }),
    prisma.trade.findMany({
      where: { account: { userId }, OR: [{ status: "CLOSED" }, { pnlMoney: { not: null } }] },
      select: { symbol: true, instrumentType: true, pnlMoney: true, entryTime: true, exitTime: true },
    }),
  ]);

  const currency = accounts[0]?.currency ?? "USD";
  const tradeDate = (tr: { exitTime: Date | null; entryTime: Date }) => tr.exitTime ?? tr.entryTime;

  // Ani disponibili (din tranzacții) + anul curent
  const yearsSet = new Set<number>([new Date().getFullYear()]);
  for (const tr of trades) yearsSet.add(new Date(tradeDate(tr)).getFullYear());
  const years = Array.from(yearsSet).sort((a, b) => b - a);

  const { year: yearParam } = await searchParams;
  const year = years.includes(Number(yearParam)) ? Number(yearParam) : years[0];

  const start = new Date(year, 0, 1).getTime();
  const end = new Date(year + 1, 0, 1).getTime();
  const inYear = trades.filter((tr) => {
    const d = new Date(tradeDate(tr)).getTime();
    return d >= start && d < end;
  });

  const pnls = inYear.map((tr) => Number(tr.pnlMoney ?? 0));
  const grossGain = pnls.filter((p) => p > 0).reduce((s, p) => s + p, 0);
  const grossLoss = Math.abs(pnls.filter((p) => p < 0).reduce((s, p) => s + p, 0));
  const net = grossGain - grossLoss;
  const taxable = Math.max(net, 0);
  const estTax = taxable * 0.1;

  // Lunar
  const monthly = Array.from({ length: 12 }, (_, m) => ({ month: m, trades: 0, pnl: 0 }));
  for (const tr of inYear) {
    const m = new Date(tradeDate(tr)).getMonth();
    monthly[m].trades++;
    monthly[m].pnl += Number(tr.pnlMoney ?? 0);
  }
  const monthlyRows = monthly.filter((r) => r.trades > 0).map((r) => ({ ...r, pnl: +r.pnl.toFixed(2) }));

  // Pe instrument
  const instrMap = new Map<string, { wins: number; total: number; pnl: number }>();
  for (const tr of inYear) {
    const e = instrMap.get(tr.instrumentType) ?? { wins: 0, total: 0, pnl: 0 };
    e.total++;
    const p = Number(tr.pnlMoney ?? 0);
    e.pnl += p;
    if (p > 0) e.wins++;
    instrMap.set(tr.instrumentType, e);
  }
  const byInstrument = Array.from(instrMap.entries())
    .map(([label, v]) => ({ label, winRate: +((v.wins / v.total) * 100).toFixed(1), total: v.total, pnl: +v.pnl.toFixed(2) }))
    .sort((a, b) => b.pnl - a.pnl);

  return (
    <TaxReportClient
      data={{
        year, years, currency,
        empty: inYear.length === 0,
        summary: {
          totalTrades: inYear.length,
          grossGain: +grossGain.toFixed(2),
          grossLoss: +grossLoss.toFixed(2),
          net: +net.toFixed(2),
          taxable: +taxable.toFixed(2),
          estTax: +estTax.toFixed(2),
        },
        monthly: monthlyRows,
        byInstrument,
      }}
    />
  );
}
