import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateWeeklyReport } from "@/lib/weekly-report";
import { sendTelegramMessage, escapeHtml } from "@/lib/telegram";
import { sendPushToUser } from "@/lib/push";
import { hasPro } from "@/lib/plan";

export const maxDuration = 120;

// Cron duminică seara (Vercel) — raportul AI al săptămânii pentru fiecare
// utilizator activ: alertă in-app + Telegram (dacă are integrarea) + push.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authz = req.headers.get("authorization");
    if (authz !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Utilizatorii cu activitate în ultimele 7 zile
  const accounts = await prisma.tradingAccount.findMany({
    where: { trades: { some: { status: "CLOSED", exitTime: { gte: weekAgo } } } },
    select: { userId: true },
    distinct: ["userId"],
  });

  let created = 0;
  let telegramSent = 0;

  for (const { userId } of accounts) {
    try {
      // Raportul AI e funcție PRO (generarea costă credit Anthropic)
      if (!(await hasPro(userId))) continue;

      // Dedup: nu genera de două ori raportul aceleiași săptămâni
      const recent = await prisma.alert.findFirst({
        where: {
          userId,
          type: "WEEKLY_REVIEW",
          createdAt: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        },
      });
      if (recent) continue;

      const report = await generateWeeklyReport(userId);
      if (!report.hasTrades) continue;

      const title = `Raportul săptămânii: ${report.netPnl >= 0 ? "+" : ""}${report.netPnl}$ (${report.wins}W/${report.losses}L)`;

      await prisma.alert.create({
        data: {
          userId,
          type: "WEEKLY_REVIEW",
          severity: report.netPnl >= 0 ? "LOW" : "MEDIUM",
          title,
          message: report.summary,
          isRead: false,
        },
      });
      created++;

      void sendPushToUser(userId, {
        title: "📊 Raportul tău săptămânal e gata",
        body: title,
        data: { route: "/(tabs)/alerts" },
      });

      // Telegram (dacă are integrarea activă)
      if (process.env.TELEGRAM_BOT_TOKEN) {
        const integ = await prisma.userIntegration.findUnique({
          where: { userId_service: { userId, service: "telegram" } },
          select: { apiKey: true, isActive: true },
        });
        if (integ?.isActive && integ.apiKey) {
          const text =
            `📊 <b>Raportul săptămânii — TradeGx</b>\n\n` +
            `${escapeHtml(report.summary)}\n\n` +
            `📈 ${report.trades} tranzacții · ${report.wins}W/${report.losses}L · ` +
            `WR ${report.winRate}% · P&L ${report.netPnl >= 0 ? "+" : ""}${report.netPnl}$` +
            (report.profitFactor != null ? ` · PF ${report.profitFactor}` : "");
          const ok = await sendTelegramMessage(integ.apiKey, text);
          if (ok) telegramSent++;
        }
      }

      await new Promise((r) => setTimeout(r, 80));
    } catch {
      /* continuă cu următorul user */
    }
  }

  return NextResponse.json({ created, telegramSent, candidates: accounts.length });
}
