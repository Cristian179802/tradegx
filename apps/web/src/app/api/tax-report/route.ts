import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { hasPro, PRO_REQUIRED } from "@/lib/plan";
import { getTaxReportData } from "@/lib/tax-report-data";

// ── Raportul fiscal, ca date ─────────────────────────────────────────────────
//
// Aceeași funcție ca pagina web și ca ruta de PDF (`getTaxReportData`), deci
// aceleași cifre. Un raport fiscal care dă altceva pe telefon decât pe desktop
// n-ar fi o nepotrivire de interfață, ar fi o problemă cu Fiscul.
//
// Calculul e pe TOATE conturile, intenționat: impozitul se plătește pe
// persoană, nu pe cont. Vezi nota din `tax-report-data.ts` — a filtra pe contul
// selectat ar da un rezultat greșit legal, nu doar incomplet.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (!(await hasPro(userId))) return NextResponse.json(PRO_REQUIRED, { status: 402 });

  const an = req.nextUrl.searchParams.get("year") ?? undefined;
  return NextResponse.json(await getTaxReportData(userId, an));
}
