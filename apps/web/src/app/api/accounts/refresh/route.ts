import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/twofactor";
import { runExchangeSync } from "@/lib/exchange-sync-engine";

// POST /api/accounts/refresh
//
// Împrospătează conturile conectate ALE UTILIZATORULUI CURENT, la cerere.
//
// Cron-ul de 5 minute lasă o fereastră: dacă deschizi aplicația la minutul patru,
// vezi date de acum patru minute. Momentul în care prospețimea contează cel mai
// mult e exact acela — când te uiți. Ruta asta se cheamă din client la deschiderea
// panoului și la revenirea în tab, și acoperă fereastra.
//
// LIMITAREA E ESENȚIALĂ, nu decorativă. Fără ea, un utilizator care comută între
// taburi ar declanșa un import la fiecare comutare, iar Binance ne dă 6000 de
// puncte pe minut per IP — pe același IP cu fluxul de prețuri live al TUTUROR.
// Un singur utilizator nervos ar putea lăsa toată aplicația fără prețuri. Deci
// limita se aplică pe SERVER, per cont, unde clientul n-o poate ocoli.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Minimul dintre două împrospătări la cerere ale aceluiași cont. */
const MIN_INTERVAL_MS = 60_000;
/** Câte conturi împrospătăm într-o cerere. Cine are mai multe le prinde pe rând. */
const MAX_ACCOUNTS = 3;

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  // Contul demo are date fixe, puse intenționat. N-are ce împrospăta.
  if (session.user.role === "DEMO") return NextResponse.json({ ok: true, refreshed: 0 });

  const userId = session.user.id;

  const accounts = await prisma.tradingAccount.findMany({
    where: { userId, brokerSource: { in: ["BINANCE", "BYBIT"] } },
    select: { id: true, brokerSource: true, lastSyncedAt: true },
    orderBy: { lastSyncedAt: { sort: "asc", nulls: "first" } },
    take: MAX_ACCOUNTS,
  });

  let refreshed = 0, imported = 0, skippedFresh = 0;

  for (const account of accounts) {
    // Deja proaspăt: nu mai deranjăm bursa.
    if (account.lastSyncedAt && Date.now() - account.lastSyncedAt.getTime() < MIN_INTERVAL_MS) {
      skippedFresh++;
      continue;
    }

    const provider = account.brokerSource === "BYBIT" ? "bybit" : "binance";

    try {
      const integration = await prisma.userIntegration.findUnique({
        where: { userId_service: { userId, service: provider } },
      });
      if (!integration?.apiKey) continue;

      // Doar ca să eșuăm din timp, cu un mesaj clar, în loc de o eroare de la
      // bursă: cheile nedescifrabile cer reconectare.
      try {
        decryptSecret(String(((integration.config ?? {}) as Record<string, unknown>).secret ?? ""));
      } catch {
        continue;
      }

      // O singură rundă, cu buget scurt. Împrospătarea la deschidere trebuie să
      // fie rapidă: dacă mai e de lucru, cron-ul îl termină. Un utilizator care
      // deschide dashboard-ul nu așteaptă 20 de secunde ca să vadă o cifră.
      const res = await runExchangeSync({
        userId,
        provider,
        tradingAccountId: account.id,
        budgetMs: 6_000,
      });
      imported += res.imported;
      refreshed++;
    } catch {
      // Împrospătarea e un bonus. Dacă bursa nu răspunde, pagina se afișează
      // oricum cu ce avem — nu blocăm nimic pentru ea.
    }
  }

  return NextResponse.json({ ok: true, refreshed, imported, skippedFresh });
}
