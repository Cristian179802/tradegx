import { NextRequest, NextResponse } from "next/server";
import { getOrCreateTodaySignals, todayKey } from "@/lib/ai-signals";

export const maxDuration = 60;

// Cron zilnic (Vercel) — generează semnalele HPS ale zilei automat, dimineața.
// Programat în vercel.json. Vercel adaugă automat header-ul de autorizare
// cu CRON_SECRET dacă variabila e setată în env.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authz = req.headers.get("authorization");
    if (authz !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
  }

  const signals = await getOrCreateTodaySignals();
  return NextResponse.json({ date: todayKey(), count: signals.length });
}
