import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { getAccountScope } from "@/lib/account-scope";
import { prisma } from "@/lib/prisma";

// ── Jurnalul, ca date ────────────────────────────────────────────────────────
//
// Pagina web `/journal` e o componentă de server: interoghează direct baza și
// nu trece prin nicio rută. Aplicația nu are cum să ajungă la ea, deci aici e
// ACEEAȘI interogare, expusă ca JSON.
//
// Forma răspunsului o copiază exact pe cea a propsurilor lui `<JournalClient>`.
// Dacă mâine se schimbă una, se vede imediat că trebuie schimbată și cealaltă —
// alternativa (două forme diferite pentru aceleași date) înseamnă că într-o zi
// telefonul arată altceva decât ecranul, și nimeni nu știe care minte.
//
// Contul respectă selecția utilizatorului (`getAccountScope`), ca pe web:
// cifrele de pe telefon trebuie să fie ale contului pe care tocmai l-a ales pe
// desktop, nu o medie peste toate.

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const scope = await getAccountScope(userId);

  const [conturi, brute, castiguri, profitBrut, pierdereBruta, mediaRR] = await Promise.all([
    prisma.tradingAccount.findMany({
      where: { userId },
      select: { currency: true },
      orderBy: { createdAt: "asc" },
      take: 1,
    }),

    prisma.trade.findMany({
      where: { ...scope.where, status: "CLOSED" },
      orderBy: { exitTime: "desc" },
      take: 200,
      select: {
        id: true,
        symbol: true,
        direction: true,
        lotSize: true,
        entryPrice: true,
        exitPrice: true,
        entryTime: true,
        exitTime: true,
        pnlMoney: true,
        pnlPips: true,
        riskRewardRatio: true,
        setupType: true,
        timeframe: true,
        tags: true,
        status: true,
        journalEntry: {
          select: {
            preNotes: true,
            preEmotionalState: true,
            preConfidence: true,
            postNotes: true,
            postEmotionalState: true,
            postMistakeTypes: true,
            postLessons: true,
            aiAnalysis: true,
            aiScore: true,
          },
        },
      },
    }),

    prisma.trade.count({
      where: { ...scope.where, status: "CLOSED", pnlMoney: { gt: 0 } },
    }),

    prisma.trade.aggregate({
      where: { ...scope.where, status: "CLOSED", pnlMoney: { gt: 0 } },
      _sum: { pnlMoney: true },
    }),

    prisma.trade.aggregate({
      where: { ...scope.where, status: "CLOSED", pnlMoney: { lt: 0 } },
      _sum: { pnlMoney: true },
    }),

    prisma.trade.aggregate({
      where: { ...scope.where, status: "CLOSED", riskRewardRatio: { not: null } },
      _avg: { riskRewardRatio: true },
    }),
  ]);

  const total = brute.length;
  const cuJurnal = brute.filter((t) => t.journalEntry).length;
  const netPnl =
    Number(profitBrut._sum.pnlMoney ?? 0) + Number(pierdereBruta._sum.pnlMoney ?? 0);

  const trades = brute.map((t) => ({
    id: t.id,
    symbol: t.symbol,
    direction: t.direction as "BUY" | "SELL",
    lotSize: Number(t.lotSize),
    entryPrice: Number(t.entryPrice),
    exitPrice: t.exitPrice !== null ? Number(t.exitPrice) : null,
    entryTime: new Date(t.entryTime).toISOString(),
    exitTime: t.exitTime ? new Date(t.exitTime).toISOString() : null,
    pnlMoney: t.pnlMoney !== null ? Number(t.pnlMoney) : null,
    pnlPips: t.pnlPips !== null ? Number(t.pnlPips) : null,
    riskRewardRatio: t.riskRewardRatio !== null ? Number(t.riskRewardRatio) : null,
    setupType: t.setupType,
    timeframe: t.timeframe,
    tags: t.tags,
    status: t.status,
    journal: t.journalEntry
      ? {
          preNotes: t.journalEntry.preNotes,
          preEmotionalState: t.journalEntry.preEmotionalState as string | null,
          preConfidence: t.journalEntry.preConfidence,
          postNotes: t.journalEntry.postNotes,
          postEmotionalState: t.journalEntry.postEmotionalState as string | null,
          postMistakeTypes: t.journalEntry.postMistakeTypes as string[],
          postLessons: t.journalEntry.postLessons,
          aiAnalysis: t.journalEntry.aiAnalysis,
          aiScore: t.journalEntry.aiScore !== null ? Number(t.journalEntry.aiScore) : null,
        }
      : null,
  }));

  return NextResponse.json({
    trades,
    stats: {
      totalTrades: total,
      journaled: cuJurnal,
      wins: castiguri,
      losses: total - castiguri,
      netPnl,
      winRate: total > 0 ? (castiguri / total) * 100 : null,
      avgRR:
        mediaRR._avg.riskRewardRatio !== null ? Number(mediaRR._avg.riskRewardRatio) : null,
      currency: conturi[0]?.currency ?? "USD",
    },
  });
}
