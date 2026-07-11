import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDailyReview } from "@/lib/daily-review";
import { sendTelegramMessage, escapeHtml } from "@/lib/telegram";

export const maxDuration = 120;

// Cron de seară (Vercel) — trimite rezumatul AI al zilei pe Telegram
// fiecărui utilizator care are integrare activă ȘI a tranzacționat azi.
export async function GET(req: NextRequest) {
  // Fail-closed: fără CRON_SECRET setat în env, endpoint-ul refuză ORICE apel
  // (protejează creditele AI și notificările de declanșări neautorizate).
  const secret = process.env.CRON_SECRET;
  const authz = req.headers.get("authorization");
  if (!secret || authz !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ skipped: "no telegram token" });
  }

  const integrations = await prisma.userIntegration.findMany({
    where: { service: "telegram", isActive: true, apiKey: { not: null } },
    select: { userId: true, apiKey: true },
  });

  let sent = 0;
  for (const integ of integrations) {
    if (!integ.apiKey) continue;
    try {
      const review = await generateDailyReview(integ.userId);
      if (!review.hasTrades) continue; // nu deranja userii care n-au tranzacționat
      const text =
        `🌙 <b>Rezumatul zilei — TradeGx</b>\n\n` +
        `${escapeHtml(review.summary)}\n\n` +
        `📊 ${review.trades} tranzacții · ${review.wins}W/${review.losses}L · Win rate ${review.winRate}% · ` +
        `P&L ${review.netPnl >= 0 ? "+" : ""}${review.netPnl}`;
      const ok = await sendTelegramMessage(integ.apiKey, text);
      if (ok) sent++;
      await new Promise((r) => setTimeout(r, 80));
    } catch {
      /* continuă cu următorul user */
    }
  }

  return NextResponse.json({ sent, total: integrations.length });
}
