import { prisma } from "@/lib/prisma";

/**
 * Pulsul sincronizării automate.
 *
 * Cron-ul scrie o dată aici la fiecare rulare reușită. Vechimea valorii e singura
 * cale de a ști dacă sincronizarea automată mai trăiește: când cron-ul nu se poate
 * autentifica, nu ajunge să ruleze nimic, deci nu poate raporta el însuși nimic.
 * Tăcerea e simptomul.
 *
 * Există fiindcă alertele de preț au fost moarte șase zile fără ca nimeni să știe.
 * Singurul semnal era un email de la GitHub la fiecare rulare eșuată — atât de
 * zgomotos încât singura reacție rezonabilă a fost să fie oprit, iar odată cu el
 * s-a stins și funcția. Un semnal pe care îl închizi nu e un semnal.
 */
export const HEARTBEAT_KEY = "cron:lastOk:exchange-sync";

/**
 * Patru tick-uri ratate. Unul singur nu spune nimic — programările GitHub Actions
 * întârzie des sub încărcare, iar o alarmă care se aprinde la fiecare întârziere
 * normală devine repede zgomot de ignorat.
 */
export const STALE_AFTER_MS = 20 * 60 * 1000;

export interface SyncHealth {
  /** Sincronizarea automată a rulat recent? */
  ok: boolean;
  /** De câte minute n-a mai rulat. `null` = n-a rulat niciodată. */
  staleMinutes: number | null;
}

export async function getSyncHealth(): Promise<SyncHealth> {
  const row = await prisma.appSetting.findUnique({ where: { key: HEARTBEAT_KEY } });
  const last = Number(row?.value ?? 0);

  if (!last) return { ok: false, staleMinutes: null };

  const age = Date.now() - last;
  return {
    ok: age <= STALE_AFTER_MS,
    staleMinutes: Math.floor(age / 60_000),
  };
}
