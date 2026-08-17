import { NextResponse } from "next/server";

/**
 * Autorizarea cron-urilor, fail-closed — și, la refuz, spune CARE capăt e greșit.
 *
 * Mesajul „Neautorizat" e corect și complet inutil. Alertele de preț au fost moarte
 * șase zile din exact eroarea asta: secretul din GitHub nu se potrivea cu cel din
 * Vercel, iar singurul semn era un email „All jobs have failed" pe zi — care s-a
 * terminat cu oprirea workflow-ului, deci cu alertele stinse de tot. Un log care
 * spunea „serverul nu are CRON_SECRET" sau „secretul trimis nu corespunde" ar fi
 * transformat o săptămână de ghicit într-un minut de reparat.
 *
 * Nu divulgă nimic exploatabil: nici valoarea, nici o parte din ea, iar refuzul
 * rămâne refuz în ambele cazuri. Singura informație în plus e ÎN CE PARTE să te
 * uiți, ceea ce oricine cu acces la Vercel sau la GitHub știe oricum.
 */
export function checkCronAuth(req: { headers: { get(name: string): string | null } }):
  NextResponse | null {
  const secret = process.env.CRON_SECRET;
  const authz = req.headers.get("authorization");

  if (!secret) {
    return NextResponse.json(
      { error: "Neautorizat", reason: "CRON_SECRET nu e configurat pe server (Vercel)" },
      { status: 401 }
    );
  }
  if (!authz) {
    return NextResponse.json(
      { error: "Neautorizat", reason: "cererea nu a trimis antetul Authorization" },
      { status: 401 }
    );
  }
  if (authz !== `Bearer ${secret}`) {
    return NextResponse.json(
      {
        error: "Neautorizat",
        reason: "secretul trimis nu corespunde celui din Vercel — aliniază CRON_SECRET între GitHub Secrets și Vercel",
      },
      { status: 401 }
    );
  }
  return null;
}
