import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-bridge";
import { hasPro, PRO_REQUIRED } from "@/lib/plan";
import { getInstitutionalData } from "@/lib/institutional";

// ── Vederea instituțională, ca date ──────────────────────────────────────────
//
// Pagina web e componentă de server și cheamă direct `getInstitutionalData`.
// Aplicația nu poate, deci aici e aceeași funcție, expusă ca JSON. Nu se
// recalculează nimic pe cont propriu: Sharpe și drawdown-ul trebuie să fie
// aceleași cifre pe telefon și pe desktop.
//
// Poarta de plan stă AICI, nu în aplicație. Un client care decide singur dacă
// are voie e o sugestie, nu o restricție.

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }
  if (!(await hasPro(userId))) {
    return NextResponse.json(PRO_REQUIRED, { status: 402 });
  }

  return NextResponse.json(await getInstitutionalData(userId));
}
