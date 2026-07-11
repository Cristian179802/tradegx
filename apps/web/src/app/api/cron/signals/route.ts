import { NextRequest, NextResponse } from "next/server";
import { getOrCreateTodaySignals, todayKey } from "@/lib/ai-signals";

export const maxDuration = 60;

// Cron zilnic (Vercel) — generează semnalele HPS ale zilei automat, dimineața.
// Programat în vercel.json. Vercel adaugă automat header-ul de autorizare
// cu CRON_SECRET dacă variabila e setată în env.
export async function GET(req: NextRequest) {
  // Fail-closed: fără CRON_SECRET setat în env, endpoint-ul refuză ORICE apel
  // (protejează creditele AI de declanșări neautorizate).
  const secret = process.env.CRON_SECRET;
  const authz = req.headers.get("authorization");
  if (!secret || authz !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const signals = await getOrCreateTodaySignals();
  return NextResponse.json({ date: todayKey(), count: signals.length });
}
