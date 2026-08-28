import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";
import { getAccountScope } from "@/lib/account-scope";

// ── Pulsul navigației ────────────────────────────────────────────────────────
//
// Tot ce afișează șina, într-o singură cerere. Deliberat una singură: fiecare
// poll separat ține baza de date trează, iar exact asta a epuizat alocația lunară
// data trecută — trei bucle de client, una la 5 secunde, care nu lăsau computul
// să adoarmă niciodată.
//
// Aici sunt patru numere. Se citesc în paralel, sunt toate agregate (COUNT/SUM,
// fără să aducă rânduri), și se cer la un minut, doar cu tabul vizibil.
//
// Ce NU e aici, deși ar fi arătat bine: știrile cu impact și activitatea din
// comunitate. Prima ar cere o sursă externă la fiecare puls, a doua n-are încă
// date reale. O cifră inventată într-un loc pe care îl privești de o sută de ori
// pe zi e mai rea decât un loc gol.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const scope = await getAccountScope(userId);

  // Ziua începe la miezul nopții în ora serverului. Aproximație asumată: pentru
  // „cât am făcut azi" diferența de fus contează mai puțin decât o interogare în
  // plus ca să aflăm preferința utilizatorului.
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const [unreadAlerts, todayAgg, openPositions, accountsAgg] = await Promise.all([
    prisma.alert.count({ where: { userId, isRead: false } }),

    prisma.trade.aggregate({
      where: { ...scope.where, status: "CLOSED", exitTime: { gte: dayStart } },
      _sum: { pnlMoney: true },
      _count: { _all: true },
    }),

    prisma.trade.count({ where: { ...scope.where, status: "OPEN" } }),

    // Soldul contului privit acum. Pe „toate conturile" se însumează, ceea ce e
    // exact ce înseamnă opțiunea aia.
    prisma.tradingAccount.aggregate({
      where: scope.accountId ? { id: scope.accountId } : { userId },
      _sum: { balance: true },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    alerts: unreadAlerts,
    pnlToday: Number(todayAgg._sum.pnlMoney ?? 0),
    tradesToday: todayAgg._count._all,
    openPositions,
    balance: Number(accountsAgg._sum.balance ?? 0),
  });
}
