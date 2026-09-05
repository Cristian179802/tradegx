import { NextRequest, NextResponse } from "next/server";
import { checkCronAuth } from "@/lib/cron-auth";
import { getOrCreateTodaySignals, todayKey } from "@/lib/ai-signals";

export const maxDuration = 60;

// Cron zilnic (Vercel) — generează semnalele HPS ale zilei automat, dimineața.
// Programat în vercel.json. Vercel adaugă automat header-ul de autorizare
// cu CRON_SECRET dacă variabila e setată în env.
export async function GET(req: NextRequest) {
  const denied = checkCronAuth(req);
  if (denied) return denied;

  const { signals, outcome } = await getOrCreateTodaySignals();
  // `outcome` in raspuns: o rulare care intoarce {count: 0} arata identic fie ca
  // piata n-a oferit nimic, fie ca apelul a esuat. Acum se vede care din ele.
  return NextResponse.json({ date: todayKey(), count: signals.length, outcome });
}
