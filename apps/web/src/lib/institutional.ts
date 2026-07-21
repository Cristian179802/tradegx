import { prisma } from "@/lib/prisma";
import {
  sharpe, sortino, maxDrawdown, cagr, calmar, edgeMetrics, type EdgeMetrics,
} from "@tradegx/core";

export interface AccountMetrics {
  id: string;
  name: string;
  currency: string;
  initialBalance: number;
  netPnl: number;
  returnPct: number;
  winRatePct: number;
  profitFactor: number | null;
  sharpe: number | null;
  maxDrawdownPct: number;
  totalTrades: number;
}

export interface InstitutionalData {
  empty: boolean;
  currency: string;
  // Portofoliu agregat (toate conturile)
  portfolio: {
    initialBalance: number;
    finalBalance: number;
    netPnl: number;
    returnPct: number;
    cagrPct: number | null;
    sharpe: number | null;
    sortino: number | null;
    calmar: number | null;
    maxDrawdownPct: number;
    tradingDays: number;
    edge: EdgeMetrics;
    equityCurve: { t: string; v: number }[]; // pentru sparkline
  };
  accounts: AccountMetrics[];
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

function buildDailyEquity(
  trades: { pnlMoney: unknown; exitTime: Date | null; entryTime: Date }[],
  initial: number
): { equity: number[]; returns: number[]; labels: string[]; days: number } {
  const byDay = new Map<string, number>();
  for (const t of trades) {
    const d = t.exitTime ?? t.entryTime;
    if (!d) continue;
    const k = dayKey(new Date(d));
    byDay.set(k, (byDay.get(k) ?? 0) + Number(t.pnlMoney ?? 0));
  }
  const sortedDays = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  const equity: number[] = [initial];
  const returns: number[] = [];
  const labels: string[] = [];
  let bal = initial;
  for (const [day, pnl] of sortedDays) {
    const prev = bal;
    bal += pnl;
    equity.push(bal);
    labels.push(day);
    returns.push(prev > 0 ? pnl / prev : 0);
  }
  const days = sortedDays.length > 0
    ? Math.max(1, Math.round((new Date(sortedDays[sortedDays.length - 1]![0]).getTime() - new Date(sortedDays[0]![0]).getTime()) / 864e5))
    : 0;
  return { equity, returns, labels, days };
}

export async function getInstitutionalData(userId: string): Promise<InstitutionalData> {
  const accounts = await prisma.tradingAccount.findMany({
    where: { userId },
    select: { id: true, name: true, currency: true, initialBalance: true },
    orderBy: { createdAt: "asc" },
  });

  const trades = await prisma.trade.findMany({
    where: { account: { userId }, OR: [{ status: "CLOSED" }, { pnlMoney: { not: null } }] },
    select: { pnlMoney: true, riskMoney: true, entryTime: true, exitTime: true, accountId: true },
  });

  const currency = accounts[0]?.currency ?? "USD";
  const totalInitial = accounts.reduce((s, a) => s + Number(a.initialBalance ?? 0), 0) || 10000;

  if (trades.length === 0) {
    return {
      empty: true,
      currency,
      portfolio: {
        initialBalance: totalInitial, finalBalance: totalInitial, netPnl: 0, returnPct: 0,
        cagrPct: null, sharpe: null, sortino: null, calmar: null, maxDrawdownPct: 0,
        tradingDays: 0, edge: edgeMetrics([]), equityCurve: [],
      },
      accounts: [],
    };
  }

  const rOf = (t: { pnlMoney: unknown; riskMoney: unknown }) => {
    const risk = Number(t.riskMoney ?? 0);
    return risk > 0 ? Number(t.pnlMoney ?? 0) / risk : null;
  };

  // ── Portofoliu agregat ──
  const pEquity = buildDailyEquity(trades, totalInitial);
  const pEdge = edgeMetrics(trades.map((t) => ({ pnl: Number(t.pnlMoney ?? 0), rMultiple: rOf(t) })));
  const pDD = maxDrawdown(pEquity.equity);
  const finalBalance = pEquity.equity[pEquity.equity.length - 1] ?? totalInitial;
  const cagrVal = cagr(totalInitial, finalBalance, pEquity.days);

  const portfolio = {
    initialBalance: totalInitial,
    finalBalance: +finalBalance.toFixed(2),
    netPnl: +pEdge.netPnl.toFixed(2),
    returnPct: +(((finalBalance - totalInitial) / totalInitial) * 100).toFixed(2),
    cagrPct: cagrVal != null ? +(cagrVal * 100).toFixed(2) : null,
    sharpe: round(sharpe(pEquity.returns)),
    sortino: round(sortino(pEquity.returns)),
    calmar: round(calmar(cagrVal, pDD.maxDrawdownPct)),
    maxDrawdownPct: +(pDD.maxDrawdownPct * 100).toFixed(2),
    tradingDays: pEquity.labels.length,
    edge: roundEdge(pEdge),
    equityCurve: sampleCurve(pEquity.labels, pEquity.equity.slice(1)),
  };

  // ── Per cont ──
  const accountMetrics: AccountMetrics[] = accounts.map((a) => {
    const at = trades.filter((t) => t.accountId === a.id);
    const init = Number(a.initialBalance ?? 0) || 10000;
    const eq = buildDailyEquity(at, init);
    const edge = edgeMetrics(at.map((t) => ({ pnl: Number(t.pnlMoney ?? 0), rMultiple: rOf(t) })));
    const dd = maxDrawdown(eq.equity);
    const finBal = eq.equity[eq.equity.length - 1] ?? init;
    return {
      id: a.id, name: a.name, currency: a.currency,
      initialBalance: init,
      netPnl: +edge.netPnl.toFixed(2),
      returnPct: +(((finBal - init) / init) * 100).toFixed(2),
      winRatePct: +edge.winRatePct.toFixed(1),
      profitFactor: edge.profitFactor != null ? +edge.profitFactor.toFixed(2) : null,
      sharpe: round(sharpe(eq.returns)),
      maxDrawdownPct: +(dd.maxDrawdownPct * 100).toFixed(2),
      totalTrades: edge.totalTrades,
    };
  }).filter((a) => a.totalTrades > 0);

  return { empty: false, currency, portfolio, accounts: accountMetrics };
}

function round(n: number | null): number | null {
  return n == null || !Number.isFinite(n) ? null : +n.toFixed(2);
}
function roundEdge(e: EdgeMetrics): EdgeMetrics {
  return {
    ...e,
    winRatePct: +e.winRatePct.toFixed(1),
    grossWin: +e.grossWin.toFixed(2),
    grossLoss: +e.grossLoss.toFixed(2),
    netPnl: +e.netPnl.toFixed(2),
    profitFactor: e.profitFactor != null ? +e.profitFactor.toFixed(2) : null,
    avgWin: +e.avgWin.toFixed(2),
    avgLoss: +e.avgLoss.toFixed(2),
    payoff: e.payoff != null ? +e.payoff.toFixed(2) : null,
    expectancyMoney: +e.expectancyMoney.toFixed(2),
    expectancyR: e.expectancyR != null ? +e.expectancyR.toFixed(3) : null,
    bestTrade: +e.bestTrade.toFixed(2),
    worstTrade: +e.worstTrade.toFixed(2),
  };
}
// eșantionează curba la ~60 puncte pentru sparkline
function sampleCurve(labels: string[], eq: number[]): { t: string; v: number }[] {
  const out: { t: string; v: number }[] = [];
  const step = Math.max(1, Math.ceil(eq.length / 60));
  for (let i = 0; i < eq.length; i += step) out.push({ t: labels[i] ?? "", v: +eq[i]!.toFixed(2) });
  if (eq.length && out[out.length - 1]?.v !== eq[eq.length - 1]) out.push({ t: labels[labels.length - 1] ?? "", v: +eq[eq.length - 1]!.toFixed(2) });
  return out;
}
