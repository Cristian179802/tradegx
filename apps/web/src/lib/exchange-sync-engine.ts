import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/twofactor";
import { detectInstrumentType } from "@/lib/parsers/index";
import type { ExchangeTrade } from "@/lib/exchanges/bybit";

// ── Motorul de sincronizare cu bursele ───────────────────────────────────────
//
// Logica stătea în corpul rutei HTTP, ceea ce o făcea inaccesibilă oricui nu are
// o sesiune de utilizator — adică exact cron-ului. Aici e independentă de
// transport: ruta o cheamă pentru un click, cron-ul o cheamă în buclă pentru
// toată lumea, iar amândouă primesc același rezultat.

const DAY_MS = 86_400_000;
/** Cât lucrează o singură invocare înainte să predea prin cursor. */
export const DEFAULT_BUDGET_MS = 20_000;

/** Eroare cu status HTTP atașat, ca ruta să nu ghicească ce s-a întâmplat. */
export class SyncError extends Error {
  status: number;
  extra: Record<string, unknown>;
  constructor(message: string, status = 400, extra: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export interface SyncResult {
  tradingAccountId: string;
  imported: number;
  skipped: number;
  hasMore: boolean;
  cursor?: string;
  progressPct: number;
  note?: string;
}

async function insertTrades(
  accountId: string,
  brokerSource: "BINANCE" | "BYBIT",
  trades: ExchangeTrade[]
): Promise<{ imported: number; skipped: number }> {
  if (trades.length === 0) return { imported: 0, skipped: 0 };

  // Dedup în interiorul lotului + față de baza de date, apoi createMany în
  // loturi de 500. Varianta veche (findFirst + create per tranzacție) însemna
  // două interogări per rând — la mii de rânduri, mai lentă decât bugetul.
  const seen = new Set<string>();
  const unique = trades.filter((t) => {
    if (!t.symbol || seen.has(t.brokerTradeId)) return false;
    seen.add(t.brokerTradeId);
    return true;
  });

  const existing = await prisma.trade.findMany({
    where: { accountId, brokerTradeId: { in: unique.map((t) => t.brokerTradeId) } },
    select: { brokerTradeId: true },
  });
  const have = new Set(existing.map((e) => e.brokerTradeId));
  const fresh = unique.filter((t) => !have.has(t.brokerTradeId));

  for (let i = 0; i < fresh.length; i += 500) {
    await prisma.trade.createMany({
      data: fresh.slice(i, i + 500).map((t) => ({
        accountId,
        symbol: t.symbol,
        instrumentType: detectInstrumentType(t.symbol) as never,
        direction: t.direction,
        entryPrice: t.entryPrice,
        entryTime: t.entryTime,
        exitPrice: t.exitPrice,
        exitTime: t.exitTime,
        lotSize: t.lotSize,
        pnlMoney: t.pnlMoney,
        pnlPercent: 0,
        commission: t.commission,
        swap: 0,
        status: "CLOSED" as never,
        brokerSource: brokerSource as never,
        brokerTradeId: t.brokerTradeId,
        durationMinutes: Math.max(0, Math.round((t.exitTime.getTime() - t.entryTime.getTime()) / 60000)),
        tags: [],
      })),
    });
  }

  return { imported: fresh.length, skipped: trades.length - fresh.length };
}

/**
 * Scrie poziția deschisă a unei perechi spot — ce ai încă în mână.
 *
 * Fără ea, jurnalul spunea „ai pierdut 739 de dolari pe HEMI" și tăcea complet
 * despre cei 128.000 de HEMI rămași în cont. Binance arată amândouă, una lângă
 * alta, și de aceea cele două ecrane păreau că se contrazic.
 *
 * `pnlMoney` rămâne NULL intenționat. Toate metricile filtrează pe
 * `status: CLOSED` SAU `pnlMoney != null`, deci o poziție deschisă cu P&L nul nu
 * atinge win rate-ul, profit factor-ul sau profitul realizat — apare unde trebuie
 * să apară, ca poziție, și nu contaminează statistica tranzacțiilor încheiate.
 * P&L-ul flotant se calculează la afișare, din prețul live: e o cifră care se
 * schimbă în fiecare secundă, nu are ce căuta îngheţată în baza de date.
 *
 * Se rescrie la fiecare sync: e o fotografie a prezentului, nu un istoric. Un lot
 * vândut parțial între două sincronizări trebuie să scadă, nu să se adune.
 */
async function writeOpenPosition(
  accountId: string,
  symbol: string,
  open: { symbol: string; qty: number; avgPrice: number; since: Date; commission: number } | null
): Promise<void> {
  const brokerTradeId = `bncs_open_${symbol}`;

  if (!open) {
    // Poziția s-a închis între timp: rândul trebuie să dispară, nu să rămână.
    await prisma.trade.deleteMany({ where: { accountId, brokerTradeId } });
    return;
  }

  const data = {
    symbol,
    instrumentType: detectInstrumentType(symbol) as never,
    direction: "BUY" as never,
    entryPrice: open.avgPrice,
    entryTime: open.since,
    lotSize: open.qty,
    commission: open.commission,
    status: "OPEN" as never,
  };

  const existing = await prisma.trade.findFirst({ where: { accountId, brokerTradeId }, select: { id: true } });
  if (existing) {
    await prisma.trade.update({ where: { id: existing.id }, data });
  } else {
    await prisma.trade.create({
      data: {
        ...data,
        accountId,
        brokerSource: "BINANCE" as never,
        brokerTradeId,
        swap: 0,
        tags: [],
      },
    });
  }
}

/**
 * Scrie în cont soldul REAL de la bursă, la finalul importului.
 *
 * Nimeni nu-l scria. Contul se crea cu soldul implicit — zero — iar de acolo
 * încolo totul se calcula greșit, deși tranzacțiile erau corecte: selectorul de
 * cont arăta „0,00 USD", profitul net citea ca și cum ăla ar fi tot contul, iar
 * drawdown-ul se măsura față de un vârf care pornea din zero. Un cont cu 900 de
 * dolari și pierderi realizate de 740 apărea ca un cont de minus 740.
 *
 * `initialBalance` se deduce, nu se inventează: dacă acum ai `equity` și
 * tranzacțiile închise au dat `Σ pnl`, atunci ai pornit de la `equity − Σ pnl`.
 * Așa curba de capital se termină exact în soldul real, în loc să plutească.
 *
 * Depunerile și retragerile ulterioare strică identitatea asta — soldul rămâne
 * corect (vine de la bursă), dar punctul de start se rescrie la fiecare sync ca
 * să închidă socoteala. Alternativa ar fi istoricul de transferuri, care e un
 * proiect în sine; până atunci, soldul afișat e cel adevărat.
 */
async function syncAccountBalance(
  accountId: string,
  provider: "bybit" | "binance",
  apiKey: string,
  apiSecret: string
): Promise<void> {
  try {
    const mod = provider === "bybit"
      ? await import("@/lib/exchanges/bybit")
      : await import("@/lib/exchanges/binance");
    const { equity } = await mod.validateKeys(apiKey, apiSecret);
    if (!Number.isFinite(equity) || equity <= 0) return;

    const agg = await prisma.trade.aggregate({
      where: { accountId },
      _sum: { pnlMoney: true },
    });
    const realized = Number(agg._sum.pnlMoney ?? 0);

    await prisma.tradingAccount.update({
      where: { id: accountId },
      data: { balance: equity, initialBalance: equity - realized },
    });
  } catch {
    // Soldul e un plus, nu o condiție: un import reușit nu are voie să eșueze
    // pentru că bursa n-a răspuns la ultima cerere.
  }
}

export async function runExchangeSync(opts: {
  userId: string;
  provider: "binance" | "bybit";
  tradingAccountId?: string;
  name?: string;
  cursor?: string;
  budgetMs?: number;
}): Promise<SyncResult> {
  const { userId, provider } = opts;
  const BUDGET_MS = opts.budgetMs ?? DEFAULT_BUDGET_MS;
  const body = { tradingAccountId: opts.tradingAccountId, name: opts.name, cursor: opts.cursor };
  const integration = await prisma.userIntegration.findUnique({
    where: { userId_service: { userId, service: provider } },
  });
  if (!integration?.apiKey) {
    throw new SyncError("Conectează mai întâi cheile API.", 400);
  }

  let apiSecret: string;
  try {
    apiSecret = decryptSecret(String(((integration.config ?? {}) as Record<string, unknown>).secret ?? ""));
  } catch {
    throw new SyncError("Secretul stocat nu poate fi descifrat. Reconectează cheile.", 400, { needsReconnect: true });
  }

  const brokerSource = provider === "bybit" ? ("BYBIT" as const) : ("BINANCE" as const);
  // „Binance", nu „Binance Futures": contul acoperă acum ambele piețe. Conturile
  // create înainte își păstrează numele — e un câmp editabil de utilizator, nu
  // ne apucăm să-l rescriem peste el.
  const label = provider === "bybit" ? "Bybit" : "Binance";

  let account = body.tradingAccountId
    ? await prisma.tradingAccount.findFirst({ where: { id: body.tradingAccountId, userId } })
    : await prisma.tradingAccount.findFirst({ where: { userId, brokerSource } });

  if (!account) {
    await prisma.tradingAccount.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // Contul nou devine SINGURUL activ. `isActive` are implicit `true` in
    // schema, iar nimeni nu le stingea pe celelalte — asa se ajungea la mai
    // multe conturi active simultan, iar aplicatia alegea pe cel mai vechi
    // (findFirst + orderBy createdAt asc). Efectul: conectai Binance si vedeai
    // in continuare datele contului precedent.

    account = await prisma.tradingAccount.create({
      data: {
        userId,
        name: body.name?.trim() || label,
        type: "LIVE",
        broker: label,
        accountNumber: "",
        currency: "USD",
        leverage: 1,
        brokerSource,
        lastSyncedAt: null,
      },
    });
  }

  const t0 = Date.now();
  let imported = 0, skipped = 0;

  try {
    if (provider === "bybit") {
      const { getClosedTradesWindow, BYBIT_MAX_HISTORY_MS, BYBIT_WINDOW_MS } =
        await import("@/lib/exchanges/bybit");

      const now = Date.now();
      const floor = now - BYBIT_MAX_HISTORY_MS;
      let start = account.lastSyncedAt
        ? Math.max(account.lastSyncedAt.getTime() - DAY_MS, floor)
        : floor;

      const batch: ExchangeTrade[] = [];
      while (start < now && Date.now() - t0 < BUDGET_MS) {
        batch.push(...(await getClosedTradesWindow(
          integration.apiKey, apiSecret, start, Math.min(start + BYBIT_WINDOW_MS, now)
        )));
        start = Math.min(start + BYBIT_WINDOW_MS, now);
      }

      const r = await insertTrades(account.id, brokerSource, batch);
      imported = r.imported; skipped = r.skipped;

      // Cursorul temporal se persistă: reluarea continuă exact de aici.
      await prisma.tradingAccount.update({
        where: { id: account.id },
        data: { lastSyncedAt: new Date(start) },
      });

      const hasMore = start < now;
      if (!hasMore) await syncAccountBalance(account.id, provider, integration.apiKey, apiSecret);
      return {
        tradingAccountId: account.id,
        imported, skipped, hasMore,
        progressPct: Math.min(100, Math.round(((start - floor) / (now - floor)) * 100)),
      };
    }

    // ── Binance: SPOT + FUTURES ──
    //
    // Sunt două burse sub aceeași cheie API, cu hosturi și formate diferite.
    // Sincronizam doar futures, deci cine cumpără crypto pe spot — majoritatea —
    // conecta contul cu succes și primea zero tranzacții.
    //
    // Fiecare simbol din coadă își duce piața în prefix, `F:` sau `S:`. Un cursor
    // rămas în zbor de la versiunea anterioară vine fără prefix și e futures,
    // fiindcă atât exista atunci.
    const { discoverSymbols, tradesForSymbol, BINANCE_MAX_HISTORY_MS } =
      await import("@/lib/exchanges/binance");
    const { discoverSpotSymbols, spotTradesForSymbol, BINANCE_SPOT_MAX_HISTORY_MS } =
      await import("@/lib/exchanges/binance-spot");

    // Adâncimi diferite pentru că plafoanele lor diferă: futures taie la 6 luni,
    // spot nu documentează nicio limită.
    const sinceFutures = account.lastSyncedAt
      ? account.lastSyncedAt.getTime() - DAY_MS
      : Date.now() - BINANCE_MAX_HISTORY_MS;

    // `lastSyncedAt` e unul singur pentru cont, dar spot intră în joc abia acum.
    // Un cont sincronizat deja pe futures are marcajul pus, deci calea
    // incrementală ar fi cerut de la spot doar ultima zi — primul import de spot
    // ar fi adus aproape nimic și ar fi părut că funcția nu merge. Prima dată se
    // ia tot, iar „prima dată" se citește din date: existența unei tranzacții cu
    // prefixul de spot. Fără coloană nouă, fără migrare.
    const spotAlreadyImported = await prisma.trade.findFirst({
      where: { accountId: account.id, brokerTradeId: { startsWith: "bncs_" } },
      select: { id: true },
    });
    const sinceSpot = account.lastSyncedAt && spotAlreadyImported
      ? account.lastSyncedAt.getTime() - DAY_MS
      : Date.now() - BINANCE_SPOT_MAX_HISTORY_MS;

    let pending: string[]; let total: number;
    if (body.cursor) {
      try {
        const c = JSON.parse(body.cursor) as { pending?: string[]; total?: number };
        pending = Array.isArray(c.pending) ? c.pending : [];
        total = Number(c.total) || pending.length;
      } catch {
        throw new SyncError("Cursor invalid", 400);
      }
    } else {
      // Perechile spot pe care le-am importat deja: singura sursă care ține minte
      // un activ vândut integral între timp. Fără ea, discovery-ul spot uită
      // exact tranzacțiile încheiate.
      const known = await prisma.trade.findMany({
        where: { accountId: account.id },
        select: { symbol: true },
        distinct: ["symbol"],
        take: 500,
      });
      const knownSymbols = known.map((k) => k.symbol);

      // Piețele se interoghează în paralel și independent: o cheie fără
      // permisiune pe una din ele nu trebuie să anuleze importul de pe cealaltă.
      const [futuresRes, spotRes] = await Promise.allSettled([
        discoverSymbols(integration.apiKey, apiSecret),
        discoverSpotSymbols(integration.apiKey, apiSecret, knownSymbols),
      ]);

      if (futuresRes.status === "rejected" && spotRes.status === "rejected") {
        throw futuresRes.reason;
      }

      pending = [
        ...(futuresRes.status === "fulfilled" ? futuresRes.value.map((s) => `F:${s}`) : []),
        ...(spotRes.status === "fulfilled" ? spotRes.value.map((s) => `S:${s}`) : []),
      ];
      total = pending.length;
    }

    // Fiecare simbol e atomic; inserăm după fiecare, ca progresul să fie durabil
    // înainte să-l scoatem din listă.
    while (pending.length > 0 && Date.now() - t0 < BUDGET_MS) {
      const entry = pending[0];
      const isSpot = entry.startsWith("S:");
      const symbol = entry.replace(/^[FS]:/, "");

      if (isSpot) {
        const { closed, open } = await spotTradesForSymbol(
          integration.apiKey, apiSecret, symbol, sinceSpot
        );
        const r = await insertTrades(account.id, brokerSource, closed);
        imported += r.imported; skipped += r.skipped;
        await writeOpenPosition(account.id, symbol, open);
      } else {
        const trades = await tradesForSymbol(integration.apiKey, apiSecret, symbol, sinceFutures);
        const r = await insertTrades(account.id, brokerSource, trades);
        imported += r.imported; skipped += r.skipped;
      }
      pending.shift();
    }

    const hasMore = pending.length > 0;
    if (!hasMore) {
      await prisma.tradingAccount.update({
        where: { id: account.id },
        data: { lastSyncedAt: new Date() },
      });
      await syncAccountBalance(account.id, provider, integration.apiKey, apiSecret);
    }

    return {
      tradingAccountId: account.id,
      imported, skipped, hasMore,
      cursor: hasMore ? JSON.stringify({ pending, total }) : undefined,
      progressPct: total > 0 ? Math.round(((total - pending.length) / total) * 100) : 100,
      note: "Spot și Futures, amândouă. Futures e plafonat de Binance la 6 luni de istoric; spot merge mai adânc. Pentru un activ cumpărat și vândut integral înainte de conectare: exportul CSV din Binance + importul CSV de aici.",
    };
  } catch (err) {
    if (err instanceof SyncError) throw err;
    const msg = err instanceof Error ? err.message : "Eroare la bursă";

    // O cheie revocată sau fără permisiuni NU e o eroare trecătoare: nimic din
    // ce facem noi n-o repară. Ambalată ca 502, cron-ul o trata drept hop de
    // rețea și reîncerca la fiecare cinci minute, la nesfârșit — irosind din
    // bugetul de cereri al Binance, care e comun cu fluxul de prețuri live al
    // TUTUROR utilizatorilor. Marcată 401, contul intră în răcire până când
    // utilizatorul reconectează cheile.
    //
    // Codurile sunt cele documentate de burse: -2008 și -2015 la Binance
    // („Invalid Api-Key ID", „Invalid API-key, IP, or permissions"), 10003 și
    // 10004 la Bybit, plus 401/403 la nivel de HTTP.
    const authFailure = /401|403|-2008|-2015|10003|10004|invalid api.?key|api.?key.*permission|signature/i.test(msg);
    throw new SyncError(msg, authFailure ? 401 : 502);
  }
}
