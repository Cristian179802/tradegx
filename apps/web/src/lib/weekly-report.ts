import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { computeEdges, type EdgeTrade } from "@/lib/edge-finder";

// ── Raport AI săptămânal ────────────────────────────────────────────────────
// Statistici pe ultimele 7 zile + comparație cu săptămâna anterioară +
// insight-uri Edge Finder → rezumat de coaching generat de AI.

export interface WeeklyReport {
  hasTrades: boolean;
  summary: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnl: number;
  profitFactor: number | null;
  prevNetPnl: number | null;
}

const WEEK = 7 * 24 * 60 * 60 * 1000;

async function tradesBetween(userId: string, from: Date, to: Date) {
  return prisma.trade.findMany({
    where: {
      account: { userId },
      status: "CLOSED",
      exitTime: { gte: from, lt: to },
    },
    select: {
      symbol: true,
      direction: true,
      setupType: true,
      killzone: true,
      timeframe: true,
      sessionType: true,
      tags: true,
      entryTime: true,
      durationMinutes: true,
      pnlMoney: true,
      commission: true,
      swap: true,
    },
  });
}

function toEdgeTrades(rows: Awaited<ReturnType<typeof tradesBetween>>): EdgeTrade[] {
  return rows.map((t) => ({
    symbol: t.symbol,
    direction: t.direction,
    setupType: t.setupType,
    killzone: t.killzone,
    timeframe: t.timeframe,
    sessionType: t.sessionType,
    tags: t.tags,
    entryTime: t.entryTime,
    durationMinutes: t.durationMinutes,
    netPnl:
      Number(t.pnlMoney ?? 0) + Number(t.commission ?? 0) + Number(t.swap ?? 0),
  }));
}

export async function generateWeeklyReport(userId: string): Promise<WeeklyReport> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - WEEK);
  const twoWeeksAgo = new Date(now.getTime() - 2 * WEEK);

  const [thisWeekRows, prevWeekRows] = await Promise.all([
    tradesBetween(userId, weekAgo, now),
    tradesBetween(userId, twoWeeksAgo, weekAgo),
  ]);

  const empty: WeeklyReport = {
    hasTrades: false, summary: "", trades: 0, wins: 0, losses: 0,
    winRate: 0, netPnl: 0, profitFactor: null, prevNetPnl: null,
  };
  if (thisWeekRows.length === 0) return empty;

  const trades = toEdgeTrades(thisWeekRows);
  const pnls = trades.map((t) => t.netPnl);
  const wins = pnls.filter((p) => p > 0).length;
  const losses = pnls.filter((p) => p < 0).length;
  const netPnl = Math.round(pnls.reduce((a, p) => a + p, 0) * 100) / 100;
  const grossWin = pnls.filter((p) => p > 0).reduce((a, p) => a + p, 0);
  const grossLoss = Math.abs(pnls.filter((p) => p < 0).reduce((a, p) => a + p, 0));
  const winRate = Math.round((wins / trades.length) * 1000) / 10;
  const profitFactor = grossLoss > 0 ? Math.round((grossWin / grossLoss) * 100) / 100 : null;

  const prevPnls = toEdgeTrades(prevWeekRows).map((t) => t.netPnl);
  const prevNetPnl = prevWeekRows.length
    ? Math.round(prevPnls.reduce((a, p) => a + p, 0) * 100) / 100
    : null;

  // Edge-uri pe săptămâna curentă (prag mic — eșantion de 7 zile)
  const edges = computeEdges(trades, { minSample: 3, top: 3 });

  const best = [...trades].sort((a, b) => b.netPnl - a.netPnl)[0];
  const worst = [...trades].sort((a, b) => a.netPnl - b.netPnl)[0];

  // ── Narativa AI ───────────────────────────────────────────────────────────
  let summary = "";
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const facts = [
        `Tranzacții: ${trades.length} (${wins}W/${losses}L), win rate ${winRate}%`,
        `P&L net: ${netPnl >= 0 ? "+" : ""}${netPnl}$` +
          (profitFactor != null ? `, profit factor ${profitFactor}` : ""),
        prevNetPnl != null
          ? `Săptămâna trecută: ${prevNetPnl >= 0 ? "+" : ""}${prevNetPnl}$ (${prevWeekRows.length} tranzacții)`
          : "Prima săptămână cu activitate din ultimele două.",
        best ? `Cea mai bună: ${best.symbol} ${best.netPnl >= 0 ? "+" : ""}${Math.round(best.netPnl)}$` : "",
        worst ? `Cea mai slabă: ${worst.symbol} ${Math.round(worst.netPnl)}$` : "",
        edges.edges[0]
          ? `Edge al săptămânii: ${edges.edges[0].dimensionLabel} „${edges.edges[0].value}" — ${edges.edges[0].n} tranzacții, WR ${edges.edges[0].winRate}%, ${edges.edges[0].netPnl >= 0 ? "+" : ""}${edges.edges[0].netPnl}$`
          : "",
        edges.leaks[0]
          ? `Leak al săptămânii: ${edges.leaks[0].dimensionLabel} „${edges.leaks[0].value}" — ${edges.leaks[0].n} tranzacții, WR ${edges.leaks[0].winRate}%, ${edges.leaks[0].netPnl}$`
          : "",
      ].filter(Boolean).join("\n");

      const resp = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        messages: [{
          role: "user",
          content:
            `Ești coach de trading. Scrie raportul săptămânal pentru un trader, în română, pe baza datelor:\n\n${facts}\n\n` +
            `Cerințe: 130-180 de cuvinte, ton direct dar încurajator, fără introduceri generice. ` +
            `Structură: 1) verdictul săptămânii într-o frază, 2) ce a mers (concret, cu cifre), ` +
            `3) ce trebuie corectat (concret), 4) UN singur obiectiv clar pentru săptămâna viitoare. ` +
            `Fără emoji, fără disclaimere.`,
        }],
      });
      summary = resp.content[0]?.type === "text" ? resp.content[0].text.trim() : "";
    } catch {
      /* fallback mai jos */
    }
  }

  if (!summary) {
    summary =
      `Săptămână cu ${trades.length} tranzacții (${wins}W/${losses}L, win rate ${winRate}%) și ` +
      `P&L net ${netPnl >= 0 ? "+" : ""}${netPnl}$.` +
      (edges.leaks[0]
        ? ` Atenție la ${edges.leaks[0].dimensionLabel.toLowerCase()} „${edges.leaks[0].value}" — te-a costat ${Math.abs(edges.leaks[0].netPnl)}$.`
        : "");
  }

  return {
    hasTrades: true, summary, trades: trades.length, wins, losses,
    winRate, netPnl, profitFactor, prevNetPnl,
  };
}
