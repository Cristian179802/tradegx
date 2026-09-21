import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { prisma } from "@/lib/prisma";
import { getAccountScope } from "@/lib/account-scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Coloana vertebrală vizuală ───────────────────────────────────────────────
//
// Curba contului, redusă la ce încape în bara de sus, plus rezultatul zilei.
// Alimentează două lucruri deodată: linia din topbar și tonul de fundal al
// aplicației. O singură interogare pentru amândouă, deliberat.
//
// ECONOMIE. Baza de date Neon suspendă computul după câteva minute fără
// interogări, iar o cerere la FIECARE încărcare de pagină ar ține-o trează
// permanent. De aceea clientul o cere o dată pe sesiune și o ține în
// `sessionStorage` — vezi `components/layout/equity-spark.tsx`.

const MAX_PUNCTE = 40;

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const scope = await getAccountScope(userId);

  const inceputulZilei = new Date();
  inceputulZilei.setHours(0, 0, 0, 0);

  // „Toate conturile" înseamnă exact ABSENȚA unui cont activ (vezi
  // `getAccountScope`). Varianta veche cerea totuși `isActive: true` în cazul
  // agregat, deci nu găsea nimic și întorcea `sold: null` — pe telefon, unde
  // soldul e prima cifră de pe ecran, se vedea o liniuță în loc de bani.
  //
  // În modul agregat se ÎNSUMEAZĂ conturile, ca la `/api/nav/pulse`. Asta și
  // înseamnă opțiunea: suma a ce ai, nu soldul unui cont ales la întâmplare.
  const [cont, agregat, primul, inchise] = await Promise.all([
    scope.accountId
      ? prisma.tradingAccount.findFirst({
          where: { id: scope.accountId },
          select: { balance: true, initialBalance: true, currency: true },
        })
      : Promise.resolve(null),

    scope.accountId
      ? Promise.resolve(null)
      : prisma.tradingAccount.aggregate({
          where: { userId },
          _sum: { balance: true, initialBalance: true },
          _count: { _all: true },
        }),

    // Moneda vederii agregate e a primului cont; a amesteca monede într-o
    // singură sumă e deja o aproximație, dar e ce cere opțiunea.
    scope.accountId
      ? Promise.resolve(null)
      : prisma.tradingAccount.findFirst({
          where: { userId },
          orderBy: { createdAt: "asc" },
          select: { currency: true },
        }),

    prisma.trade.findMany({
      where: { ...scope.where, status: "CLOSED", pnlMoney: { not: null } },
      orderBy: { exitTime: "desc" },
      take: 120,
      select: { pnlMoney: true, exitTime: true },
    }),
  ]);

  // Cronologic, ca să putem cumula.
  const cronologic = inchise.reverse();

  const areConturi = cont != null || (agregat?._count._all ?? 0) > 0;
  const soldTotal = cont
    ? Number(cont.balance)
    : Number(agregat?._sum.balance ?? 0);

  const pornire = cont
    ? Number(cont.initialBalance)
    : Number(agregat?._sum.initialBalance ?? 0);
  let cumulat = pornire;
  const curba: number[] = [pornire];
  let azi = 0;

  for (const t of cronologic) {
    const p = Number(t.pnlMoney ?? 0);
    cumulat += p;
    curba.push(cumulat);
    if (t.exitTime && t.exitTime >= inceputulZilei) azi += p;
  }

  return NextResponse.json({
    curba: subtiaza(curba, MAX_PUNCTE),
    pnlAzi: cronologic.length ? azi : null,
    sold: areConturi ? soldTotal : null,
    moneda: cont?.currency ?? primul?.currency ?? "USD",
  });
}

/**
 * Reduce curba la cel mult `n` puncte păstrând forma: ia câte o probă la
 * intervale egale, dar NU pierde niciodată ultimul punct — acolo se uită omul.
 */
function subtiaza(puncte: number[], n: number): number[] {
  if (puncte.length <= n) return puncte;
  const pas = (puncte.length - 1) / (n - 1);
  const out: number[] = [];
  for (let i = 0; i < n - 1; i++) out.push(puncte[Math.round(i * pas)]!);
  out.push(puncte[puncte.length - 1]!);
  return out;
}
