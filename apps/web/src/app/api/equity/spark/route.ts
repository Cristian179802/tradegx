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

  const [cont, inchise] = await Promise.all([
    prisma.tradingAccount.findFirst({
      where: scope.accountId ? { id: scope.accountId } : { userId, isActive: true },
      select: { balance: true, initialBalance: true, currency: true },
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

  const pornire = Number(cont?.initialBalance ?? 0);
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
    sold: cont ? Number(cont.balance) : null,
    moneda: cont?.currency ?? "USD",
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
