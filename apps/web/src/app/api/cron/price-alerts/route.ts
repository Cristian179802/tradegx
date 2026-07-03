import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchLatestPrice } from "@/lib/yahoo-finance";
import { notifyTelegram } from "@/lib/telegram";
import { sendPushToUser } from "@/lib/push";

export const maxDuration = 60;

// ── Cron alerte de preț ─────────────────────────────────────────────────────
// Apelat la ~10 min (GitHub Actions). Verifică pragurile setate pe watchlist:
// la atingere → alertă in-app + Telegram + push, apoi pragul se GOLEȘTE
// (one-shot, fără spam). Prețuri: Yahoo v8 (reale, fără cheie API).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authz = req.headers.get("authorization");
    if (authz !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
  }

  // Toate item-urile cu praguri active
  const items = await prisma.watchlistItem.findMany({
    where: { OR: [{ alertAbove: { not: null } }, { alertBelow: { not: null } }] },
    select: { id: true, userId: true, symbol: true, alertAbove: true, alertBelow: true },
  });

  if (items.length === 0) return NextResponse.json({ checked: 0, fired: 0 });

  // Un singur fetch de preț per simbol unic
  const symbols = [...new Set(items.map((i) => i.symbol))];
  const prices = new Map<string, number>();
  for (const s of symbols) {
    const p = await fetchLatestPrice(s);
    if (p != null) prices.set(s, p);
    await new Promise((r) => setTimeout(r, 120)); // politețe cu Yahoo
  }

  let fired = 0;

  for (const item of items) {
    const price = prices.get(item.symbol);
    if (price == null) continue;

    const above = item.alertAbove != null ? Number(item.alertAbove) : null;
    const below = item.alertBelow != null ? Number(item.alertBelow) : null;

    const hitAbove = above != null && price >= above;
    const hitBelow = below != null && price <= below;
    if (!hitAbove && !hitBelow) continue;

    const level = hitAbove ? above : below;
    const dir = hitAbove ? "a urcat peste" : "a coborât sub";
    const title = `${item.symbol} ${dir} ${level}`;
    const message = `Preț curent: ${price}. Pragul setat de tine (${level}) a fost atins. Alerta s-a dezactivat automat — resetează-l dacă vrei să fii anunțat din nou.`;

    try {
      await prisma.$transaction([
        prisma.alert.create({
          data: {
            userId: item.userId,
            type: "PRICE_ALERT",
            severity: "HIGH",
            title: `🎯 ${title}`,
            message,
            isRead: false,
            metadata: { symbol: item.symbol, price, level, direction: hitAbove ? "above" : "below" },
          },
        }),
        // One-shot: golește DOAR pragul declanșat (celălalt rămâne activ)
        prisma.watchlistItem.update({
          where: { id: item.id },
          data: hitAbove ? { alertAbove: null } : { alertBelow: null },
        }),
      ]);

      await notifyTelegram(item.userId, `🎯 ${title}`, message);
      void sendPushToUser(item.userId, {
        title: `🎯 ${title}`,
        body: message,
        data: { route: "/(tabs)/alerts" },
      });
      fired++;
    } catch {
      /* continuă cu următorul */
    }
  }

  return NextResponse.json({ checked: items.length, symbols: symbols.length, fired });
}
