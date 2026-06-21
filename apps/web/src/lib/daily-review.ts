import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

// ── Rezumat AI de seară — cum a mers ziua de trading + ce să îmbunătățești ────

export interface DailyReview {
  hasTrades: boolean;
  date: string;
  trades: number;
  wins: number;
  losses: number;
  netPnl: number;
  winRate: number;
  summary: string;
}

function dayBoundsUTC() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  return { start, dateKey: now.toISOString().slice(0, 10) };
}

export async function generateDailyReview(userId: string): Promise<DailyReview> {
  const { start, dateKey } = dayBoundsUTC();

  const trades = await prisma.trade.findMany({
    where: {
      account: { userId },
      OR: [{ status: "CLOSED" }, { pnlMoney: { not: null } }],
      entryTime: { gte: start },
    },
    select: { symbol: true, direction: true, pnlMoney: true, setupType: true },
    orderBy: { entryTime: "asc" },
  });

  const count = trades.length;
  const pnls = trades.map((t) => Number(t.pnlMoney ?? 0));
  const wins = pnls.filter((p) => p > 0).length;
  const losses = pnls.filter((p) => p < 0).length;
  const netPnl = +pnls.reduce((s, p) => s + p, 0).toFixed(2);
  const winRate = count > 0 ? +((wins / count) * 100).toFixed(0) : 0;

  if (count === 0) {
    return { hasTrades: false, date: dateKey, trades: 0, wins: 0, losses: 0, netPnl: 0, winRate: 0,
      summary: "Nicio tranzacție astăzi. Uneori cea mai bună decizie e să aștepți un setup clar — răbdarea e o poziție." };
  }

  let summary = `Astăzi: ${count} tranzacții, ${wins}W/${losses}L, P&L net ${netPnl >= 0 ? "+" : ""}${netPnl}.`;

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const tradeList = trades.map((t) => {
        const p = Number(t.pnlMoney ?? 0);
        return `${p >= 0 ? "✓" : "✗"} ${t.direction} ${t.symbol} ${p >= 0 ? "+" : ""}${p.toFixed(2)}${t.setupType ? ` (${t.setupType})` : ""}`;
      }).join("\n");

      const resp = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        system: "Ești un coach de trading concis și motivant. Scrii un rezumat scurt al zilei de tranzacționare în română (max 100 cuvinte), structurat: 1) cum a mers ziua, 2) o observație concretă (ce a mers bine sau ce de îmbunătățit), 3) o încurajare scurtă. Ton profesionist, direct, fără clișee. NU da sfaturi financiare specifice.",
        messages: [{
          role: "user",
          content: `Tranzacțiile mele de azi:\n${tradeList}\n\nStatistici: ${count} trades, win rate ${winRate}%, P&L net ${netPnl}. Scrie rezumatul zilei.`,
        }],
      });
      const text = resp.content.filter((c) => c.type === "text").map((c) => (c as { text: string }).text).join("").trim();
      if (text) summary = text;
    } catch {
      /* păstrează rezumatul basic */
    }
  }

  return { hasTrades: true, date: dateKey, trades: count, wins, losses, netPnl, winRate, summary };
}
