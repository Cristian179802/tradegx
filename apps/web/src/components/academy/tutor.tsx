"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUp, Loader2, Lock, Sparkles, Square } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { tApiError } from "@/lib/api-error-dict";
import type { Lang } from "@/lib/academy/types";
import { renderInline } from "./lesson-body";

// ── Tutorele lecției ─────────────────────────────────────────────────────────
//
// „Am citit paragraful de trei ori și tot nu-l înțeleg" e momentul în care un
// elev abandonează un curs. Aici întreabă pe loc, despre lecția deschisă.
//
// DOAR PRO/PREMIUM. Treapta gratuită nu vede un buton care nu merge — vede o
// explicație a ce ar primi și cât costă. Un buton care refuză la apăsare e mai
// rău decât unul care lipsește: îl apeși de trei ori înainte să înțelegi.
//
// Sugestiile de start există pentru că cea mai grea parte a unei întrebări e
// prima propoziție. Trei întrebări pe care oricine le are, gata scrise.

const UI = {
  title: { ro: "Întreabă despre lecția asta", en: "Ask about this lesson" },
  sub: {
    ro: "Tutorele răspunde doar pe baza acestei lecții, în limba ta.",
    en: "The tutor answers from this lesson only, in your language.",
  },
  placeholder: { ro: "Ce n-ai înțeles?", en: "What didn't you get?" },
  send: { ro: "Trimite", en: "Send" },
  stop: { ro: "Oprește", en: "Stop" },
  thinking: { ro: "Se gândește…", en: "Thinking…" },
  proTitle: { ro: "Tutorele AI e inclus în PRO", en: "The AI tutor is included in PRO" },
  proBody: {
    ro: "Pune orice întrebare despre lecția deschisă și primești o explicație pe loc, cu exemple cu cifre. Lecțiile, diagramele, laboratoarele și quiz-urile rămân complet gratuite.",
    en: "Ask anything about the open lesson and get an explanation on the spot, with worked numbers. Lessons, diagrams, labs and quizzes stay completely free.",
  },
  proCta: { ro: "Vezi planurile", en: "See the plans" },
  quotaLeft: { ro: "întrebări rămase luna asta", en: "questions left this month" },
  again: { ro: "Mai întreabă", en: "Ask again" },
  suggestions: {
    ro: ["Explică-mi mai simplu", "Dă-mi un exemplu cu cifre", "De ce contează asta în practică?"],
    en: ["Explain it more simply", "Give me an example with numbers", "Why does this matter in practice?"],
  },
} as const;

/**
 * Textul de eroare pentru afișare.
 *
 * `tApiError` primește `unknown` și întoarce `string | undefined` — nu
 * inventează un text dacă nu i s-a dat unul. Decizia „ce arătăm când n-avem
 * nimic" e a apelantului, și o luăm o singură dată, aici.
 */
function eroareDeAfișat(brut: unknown, lang: Lang): string {
  return (
    tApiError(brut) ??
    (lang === "ro" ? "A apărut o eroare. Încearcă din nou." : "Something went wrong. Try again.")
  );
}

type State =
  | { s: "idle" }
  | { s: "loading" }
  | { s: "streaming"; text: string }
  | { s: "done"; text: string }
  | { s: "error"; message: string; upgrade?: boolean };

export function LessonTutor({
  moduleId,
  lessonId,
  lang,
}: {
  moduleId: string;
  lessonId: string;
  lang: Lang;
}) {
  const { data: session } = useSession();
  const [question, setQuestion] = React.useState("");
  const [state, setState] = React.useState<State>({ s: "idle" });
  const [quotaLeft, setQuotaLeft] = React.useState<number | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  // Treapta se citește din sesiune, deci poarta se vede INSTANT, fără un apel
  // în plus. Trial-ul numără ca PRO — omul plătește după, nu acum.
  const plan = session?.user?.plan;
  const arePro = plan === "PRO" || plan === "PREMIUM" || session?.user?.isTrialing === true;

  // Lecția s-a schimbat → conversația nu mai are subiect.
  React.useEffect(() => {
    abortRef.current?.abort();
    setState({ s: "idle" });
    setQuestion("");
  }, [moduleId, lessonId]);

  async function ask(q: string) {
    const text = q.trim();
    if (text.length < 3 || state.s === "loading" || state.s === "streaming") return;

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setState({ s: "loading" });

    try {
      const res = await fetch("/api/academy/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, lessonId, question: text, lang }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
        setState({
          s: "error",
          // Mesajele de API sunt scrise în română și traduse la AFIȘARE —
          // stratul din api-error-dict.ts. Aici doar îl aplicăm.
          message: eroareDeAfișat(data?.error, lang),
          upgrade: res.status === 402,
        });
        return;
      }

      const left = res.headers.get("X-Quota-Left");
      if (left != null) setQuotaLeft(Number(left));

      if (!res.body) {
        setState({ s: "error", message: eroareDeAfișat(null, lang) });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      setState({ s: "streaming", text: "" });
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setState({ s: "streaming", text: acc });
      }
      setState({ s: "done", text: acc });
      setQuestion("");
    } catch (err) {
      // Anularea e o acțiune a utilizatorului, nu o eroare: păstrăm ce a venit.
      if ((err as Error)?.name === "AbortError") {
        setState((prev) => (prev.s === "streaming" ? { s: "done", text: prev.text } : { s: "idle" }));
        return;
      }
      setState({ s: "error", message: eroareDeAfișat(null, lang) });
    }
  }

  // ── Poarta PRO ──
  if (!arePro) {
    return (
      <aside className="mt-10 rounded-2xl border p-5 md:p-6" style={{ borderColor: "var(--accent-line)", background: "var(--accent-soft)" }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 shrink-0 rounded-lg grid place-items-center border" style={{ borderColor: "var(--accent-line)", background: "var(--s-2)" }}>
            <Lock className="w-4 h-4 text-[color:var(--accent)]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[14px] font-bold text-[color:var(--ink-1)]">{UI.proTitle[lang]}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[color:var(--ink-2)]">{UI.proBody[lang]}</p>
            <Link href="/pricing" className="tg-btn tg-btn-primary mt-4 inline-flex rounded-xl px-4 py-2 text-[12px] font-bold">
              {UI.proCta[lang]} →
            </Link>
          </div>
        </div>
      </aside>
    );
  }

  const busy = state.s === "loading" || state.s === "streaming";
  const answer = state.s === "streaming" || state.s === "done" ? state.text : "";

  return (
    <aside className="mt-10 tg-surface rounded-2xl overflow-hidden">
      <header className="flex items-start justify-between gap-3 px-4 md:px-5 py-3.5 border-b border-[color:var(--line-1)] bg-[color:var(--s-3)]">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-7 h-7 shrink-0 rounded-lg grid place-items-center" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-line)" }}>
            <Sparkles className="w-3.5 h-3.5 text-[color:var(--accent)]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[13.5px] font-bold text-[color:var(--ink-1)] leading-tight">{UI.title[lang]}</h3>
            <p className="text-[11px] text-[color:var(--ink-4)] mt-0.5">{UI.sub[lang]}</p>
          </div>
        </div>
        {quotaLeft != null && (
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--ink-4)] tabular-nums text-right leading-tight">
            {quotaLeft}
            <br />
            <span className="font-medium normal-case tracking-normal">{UI.quotaLeft[lang]}</span>
          </span>
        )}
      </header>

      <div className="p-4 md:p-5">
        {/* Răspunsul */}
        {answer && (
          <div className="mb-4 space-y-3">
            {answer
              .split(/\n\s*\n/)
              .map((p) => p.trim())
              .filter(Boolean)
              .map((p, i) => (
                <p key={i} className="text-[14px] leading-[1.7] text-[color:var(--ink-2)]">
                  {renderInline(p, lang)}
                </p>
              ))}
            {state.s === "streaming" && (
              <span className="inline-block w-[7px] h-[15px] align-text-bottom animate-pulse" style={{ background: "var(--accent)" }} />
            )}
          </div>
        )}

        {state.s === "loading" && (
          <p className="mb-4 inline-flex items-center gap-2 text-[13px] text-[color:var(--ink-4)]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> {UI.thinking[lang]}
          </p>
        )}

        {state.s === "error" && (
          <div className="mb-4 rounded-xl border p-3.5" style={{ borderColor: "rgba(251,92,114,0.25)", background: "rgba(251,92,114,0.05)" }}>
            <p className="text-[13px] leading-relaxed text-[color:var(--ink-2)]">{state.message}</p>
            {state.upgrade && (
              <Link href="/pricing" className="mt-2.5 inline-flex text-[12px] font-bold text-[color:var(--accent)] hover:underline">
                {UI.proCta[lang]} →
              </Link>
            )}
          </div>
        )}

        {/* Sugestii — doar înainte de prima întrebare */}
        {state.s === "idle" && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {UI.suggestions[lang].map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="px-2.5 py-1.5 rounded-lg border border-[color:var(--line-1)] bg-[color:var(--s-1)] text-[11.5px] font-medium text-[color:var(--ink-3)] hover:text-[color:var(--ink-1)] hover:border-[color:var(--accent-line)] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Câmpul de întrebare */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              // Enter trimite, Shift+Enter face rând nou: convenția pe care o
              // are deja oricine a folosit un chat.
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(question);
              }
            }}
            rows={1}
            placeholder={state.s === "done" ? UI.again[lang] : UI.placeholder[lang]}
            className="flex-1 resize-none rounded-xl border border-[color:var(--line-2)] bg-[color:var(--s-1)] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[color:var(--ink-1)] placeholder:text-[color:var(--ink-4)] outline-none focus:border-[color:var(--accent-line)] transition-colors max-h-32"
            style={{ minHeight: 42 }}
          />
          {busy ? (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="shrink-0 w-[42px] h-[42px] rounded-xl border border-[color:var(--line-2)] bg-[color:var(--s-3)] grid place-items-center text-[color:var(--ink-3)] hover:text-[color:var(--ink-1)] transition-colors"
              aria-label={UI.stop[lang]}
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={question.trim().length < 3}
              className={cn(
                "shrink-0 w-[42px] h-[42px] rounded-xl grid place-items-center transition-all",
                question.trim().length < 3
                  ? "border border-[color:var(--line-1)] bg-[color:var(--s-1)] text-[color:var(--ink-4)]"
                  : "tg-btn tg-btn-primary text-white"
              )}
              aria-label={UI.send[lang]}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
    </aside>
  );
}
