import "server-only";
import { prisma } from "@/lib/prisma";
import { errorFingerprint } from "@/lib/error-fingerprint";
import { sendTelegramMessage, escapeHtml } from "@/lib/telegram";

// ── Monitorizarea erorilor ───────────────────────────────────────────────────
//
// DE CE EXISTĂ. Până acum, când ceva se strica pentru un client, nu afla nimeni.
// Fiecare defect găsit în ultimele zile — semnalele care n-au funcționat
// niciodată, marcajele îngrămădite peste preț, erorile tehnice arătate
// clienților — a fost găsit citind cod și sondând producția. Unul dintre ele era
// acolo de la prima zi. Asta nu e o metodă, e noroc.
//
// TREI REGULI, în ordinea importanței:
//
// 1. NU ARUNCĂ NICIODATĂ. Un logger care strică cererea e mai rău decât lipsa
//    lui: transformă o eroare pe o rută secundară într-o pagină albă. Tot ce e
//    aici e învelit, iar eșecul lui se scrie doar în consolă.
//
// 2. GRUPEAZĂ, nu acumulează. O rută stricată apelată de o mie de ori produce un
//    rând cu `count = 1000`, nu o mie de rânduri — altfel primul incident îneacă
//    tabela și îl ascunde pe al doilea.
//
// 3. ALERTEAZĂ O SINGURĂ DATĂ per amprentă. Aceeași rută stricată n-are voie să
//    trimită o mie de mesaje pe Telegram; a doua zi n-ai mai citi niciunul.

/** Câți octeți din stivă păstrăm. Destul pentru cadrele care contează. */
const MAX_STACK = 4000;


/** Trimite alerta administratorilor care au Telegram legat. Eșec silențios. */
async function alerteazaAdmin(text: string): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;

  const admini = await prisma.userIntegration.findMany({
    where: {
      service: "telegram",
      isActive: true,
      apiKey: { not: null },
      user: { role: "ADMIN" },
    },
    select: { apiKey: true },
  });

  for (const a of admini) {
    if (a.apiKey) await sendTelegramMessage(a.apiKey, text);
  }
}

export interface ContextEroare {
  /** Ruta pe care s-a întâmplat, când o știm. */
  route?: string;
  /** Cine a lovit-o. Multe erori se întâmplă fără sesiune. */
  userId?: string;
}

/**
 * Înregistrează o eroare de server.
 *
 * Se apelează din `lib/api-error.ts` (erorile pe care le prindem intenționat) și
 * din `instrumentation.ts` (cele pe care nu le prindem — acelea contează cel mai
 * mult, fiindcă nimeni nu s-a gândit la ele).
 *
 * NU se așteaptă după ea în calea cererii decât acolo unde e ieftin: pe Vercel un
 * `void` se pierde, lambda-ul îngheață imediat după răspuns, deci apelantul o
 * așteaptă — dar operația e un singur upsert, iar alerta pleacă doar la prima
 * apariție.
 */
export async function captureError(
  label: string,
  err: unknown,
  ctx: ContextEroare = {}
): Promise<void> {
  // Consola rămâne prima linie: dacă baza e căzută, tot vrem urma în Vercel.
  console.error(`[${label}]`, err);

  try {
    const fp = errorFingerprint(label, err);
    const message = (err instanceof Error ? err.message : String(err)).slice(0, 2000);
    const stack = err instanceof Error && err.stack ? err.stack.slice(0, MAX_STACK) : null;

    // `upsert` atomic: la prima apariție creează, la următoarele incrementează.
    const rand = await prisma.errorLog.upsert({
      where: { fingerprint: fp },
      create: {
        fingerprint: fp,
        label,
        message,
        stack,
        route: ctx.route ?? null,
        userId: ctx.userId ?? null,
      },
      update: {
        count: { increment: 1 },
        lastSeen: new Date(),
        // Cine a lovit-o ULTIMA dată e mai util decât cine a lovit-o primul:
        // de obicei el e cel care scrie la suport.
        userId: ctx.userId ?? undefined,
        // O eroare marcată rezolvată care reapare se redeschide singură.
        resolvedAt: null,
      },
      select: { id: true, count: true, notified: true, resolvedAt: true },
    });

    // Alertă doar la prima apariție a unei amprente noi.
    if (rand.notified) return;

    await prisma.errorLog.update({ where: { id: rand.id }, data: { notified: true } });

    await alerteazaAdmin(
      `🚨 <b>Eroare nouă — TradeGx</b>\n\n` +
        `<b>${escapeHtml(label)}</b>\n` +
        `<code>${escapeHtml(message.slice(0, 300))}</code>\n\n` +
        (ctx.route ? `Rută: <code>${escapeHtml(ctx.route)}</code>\n` : "") +
        `<i>Prima apariție. Următoarele se numără, nu se mai anunță.</i>`
    );
  } catch (e) {
    // Regula 1. Dacă însuși monitorul crapă, cererea merge mai departe.
    console.error("[error-monitor] nu am putut înregistra eroarea:", e);
  }
}
