import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { captureError } from "@/lib/error-monitor";
import { esteZgomotDeBrowser } from "@/lib/client-error-filter";

// ── Erorile din browserul clientului ─────────────────────────────────────────
//
// Monitorul de server prinde ce se strică pe Vercel. Dacă o pagină crapă în
// browserul cuiva — o componentă care aruncă la randare, o promisiune respinsă —
// serverul n-a greșit cu nimic și nu află nimic. Asta e jumătatea care lipsea.
//
// TREI GRIJI, în ordine:
//
// 1. E O POARTĂ PUBLICĂ SPRE BAZĂ. Trebuie să meargă și pentru vizitatori
//    nelogați — erorile de pe landing și din formularul de înregistrare sunt
//    exact cele care costă clienți — deci nu poate cere autentificare. Limita pe
//    IP e singura barieră, și e strânsă.
//
// 2. ZGOMOTUL. Browserele și extensiile produc erori care nu sunt ale noastre.
//    Filtrate pe SERVER, nu în client: un filtru din client poate fi ocolit, și
//    oricum nu vrem să depindem de el.
//
// 3. NU RĂSPUNDE CU NIMIC UTIL. Un endpoint care confirmă ce a înregistrat e o
//    invitație. Întoarce mereu 204, indiferent ce s-a întâmplat înăuntru.


export async function POST(req: NextRequest) {
  // Răspunsul e MEREU același, oricare ar fi rezultatul. Vezi grija 3.
  const raspuns = new NextResponse(null, { status: 204 });

  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "necunoscut";

    // 20 pe oră per IP: generos pentru erori reale, strâns pentru orice altceva.
    // Un client cu o pagină chiar stricată trimite 2-3, nu 200 — clientul face
    // și el dedublare înainte să ajungă aici.
    const rl = await rateLimit(`client-errors:${ip}`, { limit: 20, windowSecs: 3600 });
    if (!rl.success) return raspuns;

    const body = await req.json().catch(() => null);
    if (!body || typeof body.message !== "string") return raspuns;

    const message = body.message.slice(0, 1000).trim();
    const stack = typeof body.stack === "string" ? body.stack.slice(0, 3000) : "";
    const route = typeof body.route === "string" ? body.route.slice(0, 200) : "";

    if (message.length < 3) return raspuns;
    if (esteZgomotDeBrowser(message) || esteZgomotDeBrowser(stack)) return raspuns;

    // Cine a lovit-o, dacă ştim. Multe erori vin de pe pagini publice.
    const session = await auth().catch(() => null);

    const err = new Error(message);
    err.stack = stack || undefined;
    // Prefixul `client:` separă net cele două lumi în panou: o eroare de browser
    // se repară altfel decât una de server, iar amestecate s-ar citi mai greu.
    await captureError(`client:${route || "necunoscut"}`, err, {
      route: route || undefined,
      userId: session?.user?.id,
    });
  } catch {
    // Un monitor care strică cererea e mai rău decât lipsa lui — cu atât mai mult
    // aici, unde cererea vine dintr-o pagină deja în suferință.
  }

  return raspuns;
}
