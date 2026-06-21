import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  accountId: z.string().cuid(),
  propFirm: z.string().max(40).nullable().optional(),
  profitTarget: z.number().min(0).max(100).nullable().optional(),
  maxDailyLossPct: z.number().min(0).max(100).nullable().optional(),
  maxDrawdownPct: z.number().min(0).max(100).nullable().optional(),
  minTradingDays: z.number().int().min(0).max(60).nullable().optional(),
});

// Calculează progresul challenge-ului pentru un cont
function computeProgress(
  initialBalance: number,
  balance: number,
  trades: { entryTime: Date; exitTime: Date | null; pnlMoney: unknown }[]
) {
  const pnl = (t: typeof trades[number]) => Number(t.pnlMoney ?? 0);

  // Profit curent
  const netPnl = balance - initialBalance;
  const profitPct = initialBalance > 0 ? (netPnl / initialBalance) * 100 : 0;

  // Pierderea zilei curente (UTC)
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayPnl = trades
    .filter((t) => new Date(t.exitTime ?? t.entryTime) >= dayStart)
    .reduce((s, t) => s + pnl(t), 0);
  const dailyLossPct = todayPnl < 0 && initialBalance > 0 ? (Math.abs(todayPnl) / initialBalance) * 100 : 0;

  // Max drawdown din echity curve (de la peak)
  let runBal = initialBalance;
  let peak = initialBalance;
  let maxDdPct = 0;
  const sorted = [...trades]
    .filter((t) => t.exitTime || t.entryTime)
    .sort((a, b) => new Date(a.exitTime ?? a.entryTime).getTime() - new Date(b.exitTime ?? b.entryTime).getTime());
  for (const t of sorted) {
    runBal += pnl(t);
    if (runBal > peak) peak = runBal;
    const dd = peak > 0 ? ((peak - runBal) / peak) * 100 : 0;
    if (dd > maxDdPct) maxDdPct = dd;
  }

  // Zile de tranzacționare distincte
  const days = new Set(
    trades.map((t) => new Date(t.exitTime ?? t.entryTime).toISOString().slice(0, 10))
  );
  const tradingDays = days.size;

  return {
    netPnl: +netPnl.toFixed(2),
    profitPct: +profitPct.toFixed(2),
    dailyLossPct: +dailyLossPct.toFixed(2),
    maxDrawdownPct: +maxDdPct.toFixed(2),
    tradingDays,
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const accounts = await prisma.tradingAccount.findMany({
    where: { userId: session.user.id, type: { in: ["CHALLENGE", "LIVE"] } },
    orderBy: { createdAt: "asc" },
    include: { trades: { where: { OR: [{ status: "CLOSED" }, { pnlMoney: { not: null } }] }, select: { entryTime: true, exitTime: true, pnlMoney: true } } },
  });

  const result = accounts.map((a) => {
    const initialBalance = Number(a.initialBalance) || Number(a.balance);
    const balance = Number(a.balance);
    const progress = computeProgress(initialBalance, balance, a.trades);

    const rules = {
      propFirm: a.propFirm ?? null,
      profitTarget: a.profitTarget != null ? Number(a.profitTarget) : null,
      maxDailyLossPct: a.maxDailyLossPct != null ? Number(a.maxDailyLossPct) : null,
      maxDrawdownPct: a.maxDrawdownPct != null ? Number(a.maxDrawdownPct) : null,
      minTradingDays: a.minTradingDays ?? null,
    };

    // Status global al challenge-ului
    let status: "PASSED" | "FAILED" | "IN_PROGRESS" | "NO_RULES" = "IN_PROGRESS";
    const hasRules = rules.profitTarget != null || rules.maxDailyLossPct != null || rules.maxDrawdownPct != null;
    if (!hasRules) {
      status = "NO_RULES";
    } else {
      const failedDaily = rules.maxDailyLossPct != null && progress.dailyLossPct >= rules.maxDailyLossPct;
      const failedDd = rules.maxDrawdownPct != null && progress.maxDrawdownPct >= rules.maxDrawdownPct;
      if (failedDaily || failedDd) status = "FAILED";
      else {
        const hitTarget = rules.profitTarget == null || progress.profitPct >= rules.profitTarget;
        const enoughDays = rules.minTradingDays == null || progress.tradingDays >= rules.minTradingDays;
        status = hitTarget && enoughDays ? "PASSED" : "IN_PROGRESS";
      }
    }

    return {
      id: a.id, name: a.name, type: a.type, currency: a.currency,
      initialBalance, balance, rules, progress, status,
    };
  });

  return NextResponse.json({ accounts: result });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Date invalide" }, { status: 400 });

  const { accountId, ...rules } = parsed.data;

  // Verifică proprietatea contului
  const acc = await prisma.tradingAccount.findFirst({
    where: { id: accountId, userId: session.user.id },
  });
  if (!acc) return NextResponse.json({ error: "Cont negăsit" }, { status: 404 });

  await prisma.tradingAccount.update({
    where: { id: accountId },
    data: {
      ...(rules.propFirm !== undefined ? { propFirm: rules.propFirm } : {}),
      ...(rules.profitTarget !== undefined ? { profitTarget: rules.profitTarget } : {}),
      ...(rules.maxDailyLossPct !== undefined ? { maxDailyLossPct: rules.maxDailyLossPct } : {}),
      ...(rules.maxDrawdownPct !== undefined ? { maxDrawdownPct: rules.maxDrawdownPct } : {}),
      ...(rules.minTradingDays !== undefined ? { minTradingDays: rules.minTradingDays } : {}),
    },
  });

  return NextResponse.json({ success: true });
}
