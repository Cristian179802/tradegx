import { NextRequest, NextResponse } from "next/server";
import { HEARTBEAT_KEY } from "@/lib/sync-heartbeat";
import { checkCronAuth } from "@/lib/cron-auth";
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
//     funcționează deloc. E oricum o alternativă redundantă la EA, care merge și
//     e mai rapid. Am lăsat-o pe dinafară deliberat: n-aș putea verifica nimic
//     din ce scriu pentru ea.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Cât lucrează o rulare. Sub maxDuration, cu marjă pentru răspuns. */
const TICK_BUDGET_MS = 45_000;
/**
 * Câte conturi verificăm per rulare.
 *
 * Ăsta e plafonul REAL al promisiunii „sincronizare la 5 minute": cu mai multe
 * conturi decât atât, coada se rotește și fiecare cont ajunge la rând o dată la
 * `ceil(N/MAX) × 5` minute.
 *
 * 100, nu mai mult, iar limita nu e baza de date — e Binance. Verificarea de
 * activitate costă ~25 de puncte, iar bursa dă 6000 pe minut PER IP, pe același
 * IP cu fluxul de prețuri live al tuturor utilizatorilor. 100 de verificări
 * întinse pe o rulare stau confortabil sub prag; dublul ar începe să concureze
 * cu prețurile, iar un 418 de la Binance ar lăsa tot site-ul fără cotații ca să
 * sincronizăm mai repede câteva conturi.
 */
const MAX_ACCOUNTS = 100;
/** Cât primește un singur cont, ca unul lent să nu mănânce toată rularea. */
const PER_ACCOUNT_BUDGET_MS = 12_000;
/** Chiar fără nicio activitate, resincronizăm rar — prinde depuneri și retrageri. */
const FORCE_AFTER_MS = 6 * 60 * 60 * 1000;
/**
 * Cât stă deoparte un cont care cere intervenția utilizatorului.
 *
 * Un token TradeLocker expirat sau o cheie revocată nu se repară de la sine. Fără
 * răcire, cron-ul ar reîncerca la fiecare cinci minute, la infinit, consumând
 * cereri și înecând logurile în aceeași eroare — și ocupând locurile din felia de
 * 40 de conturi pe care le-ar merita alții.
 */
const COOLDOWN_MS = 60 * 60 * 1000;

const fpKey = (accountId: string) => `sync:fp:${accountId}`;
const coolKey = (accountId: string) => `sync:cooldown:${accountId}`;

export async function GET(req: NextRequest) {
  const denied = checkCronAuth(req);
  if (denied) return denied;

  const t0 = Date.now();

  // Cele mai neglijate primele. `nulls: "first"` pune în față conturile
  // niciodată sincronizate — un cont nou nu trebuie să aștepte după unul care
  // s-a împrospătat acum două minute.
  const accounts = await prisma.tradingAccount.findMany({
    where: { brokerSource: { in: ["BINANCE", "BYBIT", "TRADELOCKER"] } },
    select: {
      id: true, userId: true, brokerSource: true, lastSyncedAt: true,
      brokerAccountId: true, brokerAccNum: true,
    },
    orderBy: { lastSyncedAt: { sort: "asc", nulls: "first" } },
    take: MAX_ACCOUNTS,
  });

  // Conturile în răcire se citesc într-o singură interogare, nu una per cont.
  const cooldowns = new Map<string, number>();
  if (accounts.length > 0) {
    const rows = await prisma.appSetting.findMany({
      where: { key: { in: accounts.map((a) => coolKey(a.id)) } },
    });
    for (const r of rows) cooldowns.set(r.key, Number(r.value) || 0);
  }

  let checked = 0, unchanged = 0, synced = 0, imported = 0, failed = 0, cooling = 0;
  // Motivele eșecurilor ajung în răspuns, deci în logul workflow-ului. De trei ori
  // până acum am pierdut ore pentru că ceva pica în tăcere și singurul semn era un
  // număr. Un contor spune CÂTE au picat; asta spune DE CE.
  const failures: string[] = [];

  for (const account of accounts) {
    if (Date.now() - t0 > TICK_BUDGET_MS) break;

    const until = cooldowns.get(coolKey(account.id)) ?? 0;
    if (until > Date.now()) { cooling++; continue; }

    checked++;

    // Dacă a fost în răcire și acum reușește, marcajul trebuie să dispară —
    // altfel un cont reconectat ar rămâne penalizat pentru o problemă rezolvată.
    const wasCooling = cooldowns.has(coolKey(account.id));
    const clearCooldown = async () => {
      if (wasCooling) {
        await prisma.appSetting.deleteMany({ where: { key: coolKey(account.id) } });
      }
    };

    try {
      // ── TradeLocker ──
      // Fără detector de activitate: importul incremental e o fereastră sau două
      // de la `lastSyncedAt`, deci deja ieftin. Identificatorii vin de pe cont,
      // unde i-a pus conectarea.
      if (account.brokerSource === "TRADELOCKER") {
        if (!account.brokerAccountId || account.brokerAccNum === null) continue;
        const { runTradeLockerSync } = await import("@/lib/tradelocker-sync-engine");
        const res = await runTradeLockerSync({
          userId: account.userId,
          tradeLockerAccountId: account.brokerAccountId,
          accNum: Number(account.brokerAccNum),
          tradingAccountId: account.id,
          budgetMs: 10_000,
        });
        imported += res.imported;
        synced++;
        await clearCooldown();
        continue;
      }

      const provider = account.brokerSource === "BYBIT" ? "bybit" : "binance";
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
      await clearCooldown();

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
    } catch (err) {
      // Un cont picat (chei revocate, bursă indisponibilă) nu are voie să
      // oprească restul rulării.
      failed++;
      const why = err instanceof Error ? err.message : String(err);
      failures.push(`${account.brokerSource}: ${why.slice(0, 120)}`);

      // Ce cere intervenția utilizatorului intră în răcire. Un token expirat nu
      // se repară singur, iar reîncercarea la fiecare cinci minute doar consumă
      // cereri și ocupă un loc din felie pe care altcineva l-ar folosi.
      const status = (err as { status?: number })?.status;
      const needsUser = status === 400 || status === 401 || status === 403;
      if (needsUser) {
        const until = String(Date.now() + COOLDOWN_MS);
        await prisma.appSetting.upsert({
          where: { key: coolKey(account.id) },
          create: { key: coolKey(account.id), value: until },
          update: { value: until },
        });
      }
    }
  }

  // ── Puls ──
  // Semnul că sincronizarea automată trăiește. Absența lui e singurul semnal
  // posibil când cron-ul nu poate nici măcar să se autentifice: atunci nu ajunge
  // să ruleze nimic, deci nu poate raporta el însuși că e rupt.
  //
  // Aplicația citește vechimea asta și o arată acolo unde te uiți oricum. Până
  // acum singurul semnal era un email „All jobs have failed" — pe care l-ai oprit,
  // firește, și odată cu el ai stins și funcția fără să știi. Un produs care își
  // spune singur când o parte din el nu merge nu depinde de cine citește emailuri.
  await prisma.appSetting.upsert({
    where: { key: HEARTBEAT_KEY },
    create: { key: HEARTBEAT_KEY, value: String(Date.now()) },
    update: { value: String(Date.now()) },
  });

  return NextResponse.json({
    ok: true,
    candidates: accounts.length,
    checked, unchanged, synced, imported, failed, cooling,
    failures: failures.length > 0 ? failures : undefined,
    ms: Date.now() - t0,
  });
}
