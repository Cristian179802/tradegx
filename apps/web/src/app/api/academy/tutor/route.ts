import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getEffectivePlan, PRO_REQUIRED } from "@/lib/plan";
import { rateLimit } from "@/lib/rate-limit";
import { apiError, apiErrorText } from "@/lib/api-error";
import { consumaBugetLunar } from "@/lib/ai-budget";
import { ACADEMY, getLesson } from "@/lib/academy";

// ── Tutorele Academiei ───────────────────────────────────────────────────────
//
// „Am citit paragraful de trei ori și tot nu-l înțeleg" e momentul în care un
// elev abandonează un curs. Aici poate întreba, pe loc, despre lecția deschisă.
//
// PATRU DECIZII, în ordinea importanței:
//
// 1. NUMAI PRO/PREMIUM. Regula produsului: treapta gratuită nu consumă AI,
//    fiindcă fiecare răspuns costă bani reali. Poarta nu e o verificare în plus
//    — e `AI_QUOTA.FREE.chat === 0`, deci `consumaBugetLunar` refuză singur, iar
//    contorul lunar NU se atinge (altfel cine face upgrade ar începe cu cota
//    deja consumată).
//
// 2. CONTEXTUL SE CONSTRUIEȘTE PE SERVER. Clientul trimite doar `moduleId`,
//    `lessonId` și întrebarea; textul lecției îl citim noi din `ACADEMY`. Dacă
//    l-ar trimite clientul, oricine ar putea înlocui lecția cu un text propriu
//    și ar folosi cheia noastră ca pe un chat general.
//
// 3. ACELAȘI MODEL CA ASISTENTUL, deliberat. Economia abonamentului e calculată
//    pe el; un model mai scump aici ar mânca marja fără să se vadă în nicio
//    cifră. Un tutore care explică un paragraf n-are nevoie de mai mult.
//
// 4. ACELAȘI BUGET ca la chat. Costul e același pentru noi, deci n-are sens un
//    contor separat pe care clientul să nu-l poată prevedea.

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const bodySchema = z.object({
  moduleId: z.string().max(80),
  lessonId: z.string().max(80),
  question: z.string().min(3).max(500),
  lang: z.enum(["ro", "en"]).default("ro"),
});

/** Textul lecției, aplatizat pentru prompt. */
function lessonText(moduleId: string, lessonId: string, lang: "ro" | "en"): string | null {
  const data = getLesson(moduleId, lessonId);
  if (!data) return null;
  const { module: mod, lesson } = data;

  const parts: string[] = [`MODUL: ${mod.title[lang]}`, `LECȚIA: ${lesson.title[lang]}`, ""];
  for (const s of lesson.sections) {
    if (s.heading) parts.push(`## ${s.heading[lang]}`);
    parts.push(s.body[lang]);
    if (s.formula) parts.push(`Formulă: ${s.formula.expr}`);
    if (s.example) parts.push(`Exemplu: ${s.example[lang]}`);
    if (s.tip) parts.push(`Sfat: ${s.tip[lang]}`);
    if (s.warning) parts.push(`Capcană: ${s.warning[lang]}`);
    for (const t of s.takeaways ?? []) parts.push(`- ${t[lang]}`);
    parts.push("");
  }
  return parts.join("\n");
}

function systemPrompt(lesson: string, lang: "ro" | "en"): string {
  const cuprins = ACADEMY.map((b) => `- ${b.module.title[lang]} (${b.module.id})`).join("\n");
  const limba = lang === "ro" ? "ROMÂNĂ" : "ENGLISH";

  return `Ești tutorele Academiei TradeGx. Un elev citește lecția de mai jos și are o întrebare despre ea.

REGULI, în ordinea importanței:

1. Răspunde DOAR în ${limba}, indiferent în ce limbă e întrebarea.
2. Răspunde SCURT: 2-4 paragrafe, maximum. Elevul e în mijlocul unei lecții, nu vrea un al doilea curs.
3. Explică pornind de la LECȚIA DE MAI JOS. Dacă întrebarea e despre altceva din trading, spune într-o propoziție care modul o acoperă și oprește-te — nu ține o lecție care nu e a ta.
4. NU da niciodată sfaturi de tranzacționare personalizate: nicio recomandare de cumpărare/vânzare, niciun preț-țintă, nicio predicție de piață. Dacă elevul întreabă „ar trebui să cumpăr X acum?", explică-i cum ar analiza el situația cu ce a învățat, nu ce să facă.
5. NU inventa. Dacă lecția nu acoperă ceva și nici nu știi sigur, spune-o.
6. Folosește exemple cu cifre concrete. „Riști 1% din 10.000 $, adică 100 $" explică mai mult decât un paragraf de teorie.
7. Fără formule de politețe la început, fără „Sper că te-am ajutat" la final. Intră direct în răspuns.

MODULELE ACADEMIEI (pentru redirecționare):
${cuprins}

════════ LECȚIA DESCHISĂ ════════
${lesson}
════════════════════════════════`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Neautorizat" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Barieră de rafală, înaintea bugetului lunar: cine e oprit aici n-are de ce
  // să piardă din cota lunii.
  const rl = await rateLimit(`tutor:${session.user.id}`, { limit: 20, windowSecs: 3600 });
  if (!rl.success) {
    return new Response(
      JSON.stringify({ error: "Ai atins limita de 20 de întrebări pe oră. Revino mai târziu.", code: "RATE" }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  const { plan } = await getEffectivePlan(session.user.id);
  const buget = await consumaBugetLunar("chat", session.user.id, plan);

  // Cotă zero = funcția e închisă pe treapta asta. E o invitație de upgrade
  // (402), nu un „ai consumat tot" despre ceva ce n-a avut niciodată.
  if (buget.cota === 0) {
    return new Response(JSON.stringify(PRO_REQUIRED), {
      status: 402,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!buget.ok) {
    return new Response(
      JSON.stringify({
        error: "Ai folosit toate mesajele AI incluse în abonament luna asta.",
        code: "MONTHLY_BUDGET",
        seReinnoieste: buget.seReinnoieste,
        ...(plan === "PREMIUM" ? {} : { upgradeUrl: "/pricing" }),
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Date invalide" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { moduleId, lessonId, question, lang } = parsed.data;
  const lesson = lessonText(moduleId, lessonId, lang);
  if (!lesson) {
    return new Response(JSON.stringify({ error: "Lecția nu există" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[Academy Tutor] ANTHROPIC_API_KEY lipsește din mediul de producție");
    return apiError("aiUnavailable", { status: 503 });
  }

  try {
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 900,
      system: systemPrompt(lesson, lang),
      messages: [{ role: "user", content: question }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
        } catch (streamErr) {
          // Fluxul a pornit deja, deci eroarea trebuie scrisă ÎN corp — dar
          // textul brut al SDK-ului nu are ce căuta acolo: când creditul se
          // termină, mesajul lor îi cere CITITORULUI să-și încarce contul.
          console.error("[Academy Tutor stream]", streamErr);
          controller.enqueue(encoder.encode(`\n\n⚠️ ${await apiErrorText("aiUnavailable")}`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-store",
        // Cât a mai rămas din cotă — clientul o afișează, ca elevul să nu
        // descopere limita abia când se lovește de ea.
        "X-Quota-Left": String(buget.ramase),
      },
    });
  } catch (err) {
    return apiError("aiFailed", { status: 502, log: ["Academy Tutor", err] });
  }
}
