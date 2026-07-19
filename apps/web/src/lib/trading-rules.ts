import { prisma } from "@/lib/prisma";
import { notifyTelegram } from "@/lib/telegram";
import { sendPushToUser } from "@/lib/push";
import { sendWebPushToUser } from "@/lib/web-push";

interface ViolationCheckParams {
  userId: string;
  accountId: string;
  tradePnl: number;
}

export async function checkTradingRuleViolations({
  userId,
  accountId,
  tradePnl,
}: ViolationCheckParams): Promise<void> {
  const account = await prisma.tradingAccount.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      name: true,
      balance: true,
      initialBalance: true,
      maxDailyLossPct: true,
      maxDrawdownPct: true,
    },
  });

  if (!account) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { maxTradesPerDay: true, noTradeDays: true },
  });

  const alerts: {
    type: string;
    severity: string;
    title: string;
    message: string;
  }[] = [];

  const balance = Number(account.balance);
  const initial = Number(account.initialBalance);

  // 1. Daily loss limit check
  if (account.maxDailyLossPct) {
    const maxDailyLossPct = Number(account.maxDailyLossPct);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const dailyPnl = await prisma.trade.aggregate({
      where: {
        accountId,
        status: "CLOSED",
        exitTime: { gte: startOfDay },
      },
      _sum: { pnlMoney: true },
    });

    const totalDailyPnl = Number(dailyPnl._sum.pnlMoney ?? 0);
    const dailyLossLimit = (initial * maxDailyLossPct) / 100;

    if (totalDailyPnl < 0 && Math.abs(totalDailyPnl) >= dailyLossLimit * 0.8) {
      const pct = (Math.abs(totalDailyPnl) / dailyLossLimit) * 100;
      const exceeded = pct >= 100;
      alerts.push({
        type: "DAILY_LOSS_LIMIT",
        severity: exceeded ? "CRITICAL" : "HIGH",
        title: exceeded ? "Limită zilnică depășită!" : "Aproape de limita zilnică",
        message: exceeded
          ? `Contul "${account.name}" a depășit limita de pierdere zilnică de ${maxDailyLossPct}%. Pierdere zilnică: ${Math.abs(totalDailyPnl).toFixed(2)}.`
          : `Contul "${account.name}" a atins ${pct.toFixed(0)}% din limita zilnică (${maxDailyLossPct}%). Pierdere: ${Math.abs(totalDailyPnl).toFixed(2)}.`,
      });
    }
  }

  // 2. Max drawdown check
  if (account.maxDrawdownPct) {
    const maxDrawdownPct = Number(account.maxDrawdownPct);
    const currentDrawdown = initial > 0 ? ((initial - balance) / initial) * 100 : 0;

    if (currentDrawdown >= maxDrawdownPct * 0.8) {
      const exceeded = currentDrawdown >= maxDrawdownPct;
      alerts.push({
        type: "RISK_EXCEEDED",
        severity: exceeded ? "CRITICAL" : "HIGH",
        title: exceeded ? "Drawdown maxim depășit!" : "Drawdown aproape de limită",
        message: exceeded
          ? `Contul "${account.name}" a depășit drawdown-ul maxim de ${maxDrawdownPct}%. Drawdown actual: ${currentDrawdown.toFixed(2)}%.`
          : `Contul "${account.name}" are un drawdown de ${currentDrawdown.toFixed(2)}% (limita: ${maxDrawdownPct}%).`,
      });
    }
  }

  // 3. Overtrading check (account-level maxTradesPerDay, fall back to user default)
  const maxTrades = user?.maxTradesPerDay;
  if (maxTrades) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayCount = await prisma.trade.count({
      where: {
        accountId,
        entryTime: { gte: startOfDay },
        status: { not: "CANCELLED" },
      },
    });

    if (todayCount >= maxTrades) {
      alerts.push({
        type: "OVERTRADING",
        severity: todayCount > maxTrades * 1.5 ? "HIGH" : "MEDIUM",
        title: "Limită de tranzacții zilnice atinsă",
        message: `Ai plasat ${todayCount} tranzacții astăzi pe contul "${account.name}" (limita: ${maxTrades}). Oprește-te pentru azi.`,
      });
    }
  }

  // 4. Revenge trading detection: loss followed immediately by another trade
  if (tradePnl < 0) {
    const recentTrades = await prisma.trade.findMany({
      where: {
        accountId,
        status: "CLOSED",
        exitTime: { gte: new Date(Date.now() - 30 * 60 * 1000) }, // last 30 min
      },
      select: { pnlMoney: true },
      orderBy: { exitTime: "desc" },
      take: 3,
    });

    const recentLosses = recentTrades.filter((t) => Number(t.pnlMoney ?? 0) < 0).length;
    if (recentLosses >= 2) {
      alerts.push({
        type: "REVENGE_TRADING",
        severity: "MEDIUM",
        title: "Posibil revenge trading detectat",
        message: `Ai înregistrat ${recentLosses} pierderi consecutive în ultimele 30 de minute pe contul "${account.name}". Ia o pauză și evaluează situația.`,
      });
    }
  }

  // Insert all alerts (avoid duplicate CRITICAL alerts for the same type within 1h)
  for (const alert of alerts) {
    const recent = await prisma.alert.findFirst({
      where: {
        userId,
        type: alert.type as never,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (!recent) {
      await prisma.alert.create({
        data: {
          userId,
          type: alert.type as never,
          severity: alert.severity as never,
          title: alert.title,
          message: alert.message,
          isRead: false,
        },
      });
      // Trimite și pe Telegram (dacă utilizatorul a conectat integrarea)
      await notifyTelegram(userId, alert.title, alert.message);
      // Push către device-urile native ale userului
      void sendPushToUser(userId, {
        title: alert.title,
        body: alert.message,
        data: { route: "/(tabs)/alerts" },
      });
      // Web Push (browser/PWA, chiar cu browserul închis)
      await sendWebPushToUser(userId, { title: alert.title, body: alert.message, url: "/dashboard", tag: `rule-${alert.type}` });
    }
  }
}
