import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { getAccountScope } from "@/lib/account-scope";
import { prisma } from "@/lib/prisma";

// ── Managerul de risc, ca date ───────────────────────────────────────────────
//
// Aceeași interogare ca pagina web, care e componentă de server și nu trece
// prin nicio rută. Forma răspunsului o copiază pe cea a propsurilor lui
// `<RiskManagerClient>`, ca să se vadă imediat când una se schimbă fără alta.
//
// Riscul se măsoară pe CONTUL pe care tranzacționezi. Pierderea zilei însumată
// peste toate conturile nu spune nimic despre limita niciunuia — și exact
// limita e ce apără ecranul ăsta.

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const scope = await getAccountScope(userId);
  const inceputulZilei = new Date(new Date().setHours(0, 0, 0, 0));

  const [conturi, utilizator, azi, saptamana] = await Promise.all([
    prisma.tradingAccount.findMany({
      where: { userId },
      select: {
        id: true, name: true, type: true, currency: true,
        balance: true, initialBalance: true,
        maxDailyLossPct: true, maxDrawdownPct: true, isActive: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.user.findUnique({
      where: { id: userId },
      select: {
        defaultRiskPct: true, maxTradesPerDay: true, noTradeDays: true,
        // Orele fără tranzacții intră în răspuns fiindcă PATCH-ul le rescrie cu
        // `null` dacă lipsesc din corp. Fără ele aici, orice salvare de pe telefon
        // ar șterge o setare făcută pe desktop, fără ca nimeni s-o ceară.
        noTradeHoursStart: true, noTradeHoursEnd: true,
      },
    }),

    prisma.trade.findMany({
      where: { ...scope.where, status: "CLOSED", exitTime: { gte: inceputulZilei } },
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

  const suma = (t: { pnlMoney: unknown }[]) =>
    t.reduce((s, x) => s + (Number(x.pnlMoney) || 0), 0);

  return NextResponse.json({
    accounts: conturi.map((a) => ({
      ...a,
      balance: a.balance.toString(),
      initialBalance: a.initialBalance.toString(),
      maxDailyLossPct: a.maxDailyLossPct?.toString() ?? null,
      maxDrawdownPct: a.maxDrawdownPct?.toString() ?? null,
    })),
    user: {
      defaultRiskPct: utilizator?.defaultRiskPct?.toString() ?? "1",
      maxTradesPerDay: utilizator?.maxTradesPerDay ?? 5,
      noTradeDays: utilizator?.noTradeDays ?? [],
      noTradeHoursStart: utilizator?.noTradeHoursStart ?? null,
      noTradeHoursEnd: utilizator?.noTradeHoursEnd ?? null,
    },
    todayPnl: suma(azi),
    todayTradeCount: azi.length,
    weekPnl: suma(saptamana),
  });
}
