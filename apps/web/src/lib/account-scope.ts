// ── Ce cont privește utilizatorul acum ───────────────────────────────────────
//
// Până acum, TOATE rutele de date interogau cu `account: { userId }`, adică
// amestecau fiecare cont al utilizatorului într-o singură statistică. Un cont
// FTMO de 100.000 $ și unul Binance de 500 $ ajungeau în aceeași rată de câștig,
// aceeași curbă de echitate, același drawdown. Cifra rezultată nu descria niciun
// cont real — era o medie fără sens, iar utilizatorul nu avea cum să o vadă ca
// atare.
//
// Un jurnal de trading trebuie să răspundă la „cum merge contul ĂSTA", nu la
// „cum merg toate deodată". Vederea agregată e utilă, dar ca opțiune explicită.
//
// CONVENȚIA: contul selectat e cel cu `isActive: true`. „Toate conturile" se
// exprimă prin ABSENȚA oricărui cont activ — astfel nu e nevoie de o coloană
// nouă în schemă, iar starea rămâne una singură, în baza de date, aceeași pe
// telefon și pe desktop.

import { prisma } from "@/lib/prisma";

export interface AccountScope {
  /** Fragment de filtrare pentru interogările pe Trade. */
  where: { accountId: string } | { account: { userId: string } };
  /** Contul selectat, sau null când se privesc toate. */
  accountId: string | null;
  /** true = vedere agregată pe toate conturile. */
  all: boolean;
}

/**
 * Determină ce trebuie să vadă utilizatorul, o singură dată per cerere.
 *
 * Când niciun cont nu e activ, cade pe vederea agregată — comportamentul de
 * dinainte. Deci o rută nemigrată încă și una migrată nu se contrazic: ambele
 * arată același lucru cât timp utilizatorul n-a ales un cont.
 */
export async function getAccountScope(userId: string): Promise<AccountScope> {
  const active = await prisma.tradingAccount.findFirst({
    where: { userId, isActive: true },
    // Dacă din vreun motiv rămân mai multe active (defect reparat, dar datele
    // vechi pot fi încă așa), alegem pe cel mai recent — e cel pe care userul
    // tocmai l-a conectat, deci cel la care se așteaptă.
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (!active) {
    return { where: { account: { userId } }, accountId: null, all: true };
  }
  return { where: { accountId: active.id }, accountId: active.id, all: false };
}

/**
 * Varianta pentru rute care primesc explicit un cont în query string
 * (`?accountId=<id>` sau `?accountId=all`), cu verificarea proprietății.
 *
 * Fără verificare, oricine ar putea citi tranzacțiile altcuiva trimițând un id
 * străin — de aceea id-ul primit nu ajunge NICIODATĂ direct în filtru.
 */
export async function resolveAccountScope(
  userId: string,
  requested: string | null
): Promise<AccountScope> {
  if (requested === "all") {
    return { where: { account: { userId } }, accountId: null, all: true };
  }
  if (requested) {
    const owned = await prisma.tradingAccount.findFirst({
      where: { id: requested, userId },
      select: { id: true },
    });
    if (owned) return { where: { accountId: owned.id }, accountId: owned.id, all: false };
    // Id străin sau inexistent → cădem pe selecția salvată, nu pe o eroare:
    // un link vechi cu alt cont nu trebuie să rupă pagina.
  }
  return getAccountScope(userId);
}
