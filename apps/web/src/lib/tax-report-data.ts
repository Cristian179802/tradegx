import { prisma } from "@/lib/prisma";

export interface TaxReportData {
  year: number;
  years: number[];
  currency: string;
  empty: boolean;
  summary: { totalTrades: number; grossGain: number; grossLoss: number; net: number; taxable: number; estTax: number };
  monthly: Array<{ month: number; trades: number; pnl: number }>;
  byInstrument: Array<{ label: string; winRate: number; total: number; pnl: number }>;
}

/**
 * Calculează raportul fiscal pentru un utilizator și un an dat.
 * Folosit de pagina /tax-report (randare) și de ruta /tax-report/pdf (export).
 */
export async function getTaxReportData(userId: string, yearParam?: string): Promise<TaxReportData> {
  const [accounts, trades] = await Promise.all([
    prisma.tradingAccount.findMany({ where: { userId }, select: { currency: true } }),
    prisma.trade.findMany({
      where: { account: { userId }, OR: [{ status: "CLOSED" }, { pnlMoney: { not: null } }] },
      select: { symbol: true, instrumentType: true, pnlMoney: true, entryTime: true, exitTime: true },
    }),
  ]);

  const currency = accounts[0]?.currency ?? "USD";
  const tradeDate = (tr: { exitTime: Date | null; entryTime: Date }) => tr.exitTime ?? tr.entryTime;

  const yearsSet = new Set<number>([new Date().getFullYear()]);
  for (const tr of trades) yearsSet.add(new Date(tradeDate(tr)).getFullYear());
  const years = Array.from(yearsSet).sort((a, b) => b - a);

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

  const monthly = Array.from({ length: 12 }, (_, m) => ({ month: m, trades: 0, pnl: 0 }));
  for (const tr of inYear) {
    const m = new Date(tradeDate(tr)).getMonth();
    monthly[m].trades++;
    monthly[m].pnl += Number(tr.pnlMoney ?? 0);
  }
  const monthlyRows = monthly.filter((r) => r.trades > 0).map((r) => ({ ...r, pnl: +r.pnl.toFixed(2) }));

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

  return {
    year,
    years,
    currency,
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
  };
}
