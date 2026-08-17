import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/twofactor";
import { runExchangeSync } from "@/lib/exchange-sync-engine";

// ── Sincronizare periodică a conturilor de bursă ──────────────────────────────
//
// Până acum importul se făcea DOAR la click. Un jurnal de trading care îți arată
// tranzacțiile abia când îți amintești să apeși un buton nu e un jurnal, e o
// arhivă manuală.
//
// DE CE LA 5 MINUTE, ȘI NU LA UNUL
//
// Două limite reale, nu prudență de dragul prudenței:
//
//  1. Declanșatorul e GitHub Actions (crons Vercel sunt zilnice pe planul de
//     aici). Programările lor au granularitate de ~5 minute și întârzie des sub
//     încărcare. „La un minut" ar fi o promisiune pe care unealta n-o ține.
//
//  2. Binance dă 6000 de puncte pe minut per IP, iar IP-ul e COMUN cu fluxul de
//     prețuri live al întregii aplicații. Un import complet costă ~485. La 1
//     minut × mulți utilizatori se ajunge la 429, apoi la 418 — ban temporar —
//     și atunci toată lumea rămâne fără prețuri, nu doar cel care sincroniza.
//
// Ce face intervalul suportabil e detectorul de activitate: ~25 de puncte ca să
// afli dacă s-a schimbat ceva. Un cont pe care nu s-a tranzacționat costă atât și
// se sare. Doar cine a tranzacționat plătește importul.
//
// Și ce NU e aici, ca să nu pară că e:
//   · MT4/MT5 cu EA instalat — deja live, dar invers: terminalul ÎMPINGE spre
//     /api/webhooks/ea, nu îl întrebăm noi. Nu are ce căuta într-un cron.
//   · MT4/MT5 prin MetaAPI — `METAAPI_TOKEN` nu e configurat, deci calea aia nu
//     funcționează deloc momentan.
//   · TradeLocker — logica lui de sync stă încă în corpul rutei HTTP, deci nu e
//     apelabilă fără sesiune. Are nevoie de aceeași extragere.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Cât lucrează o rulare. Sub maxDuration, cu marjă pentru răspuns. */
const TICK_BUDGET_MS = 45_000;
/** Câte conturi verificăm per rulare. Mărginit ca să nu depindă de câți useri sunt. */
const MAX_ACCOUNTS = 40;
/** Cât primește un singur cont, ca unul lent să nu mănânce toată rularea. */
const PER_ACCOUNT_BUDGET_MS = 12_000;
/** Chiar fără nicio activitate, resincronizăm rar — prinde depuneri și retrageri. */
const FORCE_AFTER_MS = 6 * 60 * 60 * 1000;

const fpKey = (accountId: string) => `sync:fp:${accountId}`;

export async function GET(req: NextRequest) {
  // Fail-closed: fără CRON_SECRET în env, endpoint-ul refuză orice apel.
  const secret = process.env.CRON_SECRET;
  const authz = req.headers.get("authorization");
  if (!secret || authz !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const t0 = Date.now();

  // Cele mai neglijate primele. `nulls: "first"` pune în față conturile
  // niciodată sincronizate — un cont nou nu trebuie să aștepte după unul care
  // s-a împrospătat acum două minute.
  const accounts = await prisma.tradingAccount.findMany({
    where: { brokerSource: { in: ["BINANCE", "BYBIT"] } },
    select: { id: true, userId: true, brokerSource: true, lastSyncedAt: true },
    orderBy: { lastSyncedAt: { sort: "asc", nulls: "first" } },
    take: MAX_ACCOUNTS,
  });

  let checked = 0, unchanged = 0, synced = 0, imported = 0, failed = 0;

  for (const account of accounts) {
    if (Date.now() - t0 > TICK_BUDGET_MS) break;
    checked++;

    const provider = account.brokerSource === "BYBIT" ? "bybit" : "binance";

    try {
      const integration = await prisma.userIntegration.findUnique({
        where: { userId_service: { userId: account.userId, service: provider } },
      });
      if (!integration?.apiKey) continue;

      let apiSecret: string;
      try {
        apiSecret = decryptSecret(
          String(((integration.config ?? {}) as Record<string, unknown>).secret ?? "")
        );
      } catch {
        // Cheile trebuie reconectate de utilizator. Nu e ceva ce poate rezolva
        // o reluare, deci nu o încercăm la fiecare cinci minute.
        continue;
      }

      // ── Detectorul de activitate ──
      // Doar Binance: la Bybit importul incremental e deja o cerere sau două
      // (fereastră temporală de la `lastSyncedAt`), deci o verificare separată
      // ar costa mai mult decât ar economisi.
      let fingerprint: string | null = null;
      if (provider === "binance") {
        const stale = !account.lastSyncedAt
          || Date.now() - account.lastSyncedAt.getTime() > FORCE_AFTER_MS;
        try {
          const { activityFingerprint } = await import("@/lib/exchanges/binance");
          fingerprint = await activityFingerprint(integration.apiKey, apiSecret);
          const prev = await prisma.appSetting.findUnique({ where: { key: fpKey(account.id) } });
          if (!stale && prev?.value === fingerprint) {
            unchanged++;
            continue;
          }
        } catch {
          // Amprenta e o optimizare, nu o poartă: dacă nu se poate calcula,
          // sincronizăm oricum. Un rateu la citire nu are voie să ascundă
          // tranzacții.
          fingerprint = null;
        }
      }

      // ── Importul, reluabil în interiorul aceleiași rulări ──
      let cursor: string | undefined;
      let done = false;
      const accountStart = Date.now();

      for (let round = 0; round < 50; round++) {
        const res = await runExchangeSync({
          userId: account.userId,
          provider,
          tradingAccountId: account.id,
          cursor,
          budgetMs: 8_000,
        });
        imported += res.imported;
        cursor = res.cursor;
        if (!res.hasMore) { done = true; break; }
        if (Date.now() - accountStart > PER_ACCOUNT_BUDGET_MS) break;
        if (Date.now() - t0 > TICK_BUDGET_MS) break;
      }

      synced++;

      // Amprenta se scrie DOAR după un import încheiat. Scrisă mai devreme, un
      // eșec la jumătate ne-ar face să sărim contul la rularea următoare,
      // crezând că nu s-a schimbat nimic — exact tranzacțiile pe care le-am
      // ratat ar fi cele ascunse.
      if (done && fingerprint) {
        await prisma.appSetting.upsert({
          where: { key: fpKey(account.id) },
          create: { key: fpKey(account.id), value: fingerprint },
          update: { value: fingerprint },
        });
      }
    } catch {
      // Un cont picat (chei revocate, bursă indisponibilă) nu are voie să
      // opreacă restul rulării.
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    candidates: accounts.length,
    checked, unchanged, synced, imported, failed,
    ms: Date.now() - t0,
  });
}
