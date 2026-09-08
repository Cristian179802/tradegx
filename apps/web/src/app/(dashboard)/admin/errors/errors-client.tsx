"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { AlertTriangle, Check, ChevronDown, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EroareAfisata {
  id: string;
  label: string;
  message: string;
  stack: string | null;
  route: string | null;
  count: number;
  firstSeen: string;
  lastSeen: string;
  resolvedAt: string | null;
}

export function ErrorsClient({ erori }: { erori: EroareAfisata[] }) {
  const t = useTranslations("errorMonitor");
  const locale = useLocale();
  const [lista, setLista] = React.useState(erori);
  const [deschis, setDeschis] = React.useState<string | null>(null);
  const [inLucru, setInLucru] = React.useState<string | null>(null);

  const nerezolvate = lista.filter((e) => !e.resolvedAt).length;

  async function comutaRezolvat(id: string, rezolvatAcum: boolean) {
    setInLucru(id);
    try {
      const res = await fetch(`/api/admin/errors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: !rezolvatAcum }),
      });
      if (!res.ok) return;
      const { resolvedAt } = (await res.json()) as { resolvedAt: string | null };
      setLista((prev) => prev.map((e) => (e.id === id ? { ...e, resolvedAt } : e)));
    } finally {
      setInLucru(null);
    }
  }

  const cand = (iso: string) =>
    new Date(iso).toLocaleString(locale, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[color:var(--ink-1)]">
            {t("title")}
          </h1>
          <p className="text-sm text-[color:var(--ink-4)] mt-0.5">{t("subtitle")}</p>
        </div>
        <div
          className={cn(
            "rounded-xl border px-3 py-2 text-sm font-bold",
            nerezolvate === 0
              ? "border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-300"
              : "border-amber-500/25 bg-amber-500/[0.07] text-amber-300"
          )}
        >
          {nerezolvate === 0 ? t("allClear") : t("openCount", { n: nerezolvate })}
        </div>
      </div>

      {lista.length === 0 ? (
        // Lista goală e vestea bună, nu o stare de „nu s-a încărcat". Merită să
        // arate ca atare.
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <ShieldCheck className="w-10 h-10 text-emerald-500/70" />
          <p className="text-sm font-semibold text-[color:var(--ink-2)]">{t("emptyTitle")}</p>
          <p className="text-xs text-[color:var(--ink-4)] max-w-sm">{t("emptyBody")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lista.map((e) => {
            const rezolvat = !!e.resolvedAt;
            const extins = deschis === e.id;
            return (
              <div
                key={e.id}
                className={cn(
                  "rounded-xl border transition-colors",
                  rezolvat
                    ? "border-[color:var(--line-1)] bg-[color:var(--s-1)]/60 opacity-60"
                    : "border-rose-500/20 bg-rose-500/[0.04]"
                )}
              >
                <div className="flex items-start gap-3 p-3.5">
                  <AlertTriangle
                    className={cn(
                      "w-4 h-4 shrink-0 mt-0.5",
                      rezolvat ? "text-[color:var(--ink-4)]" : "text-rose-400"
                    )}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--ink-3)]">
                        {e.label}
                      </span>
                      {/* Numărul de apariții e cel mai bun indiciu de prioritate:
                          o eroare lovită de 400 de ori nu e la fel cu una lovită
                          o dată, chiar dacă textul arată la fel de rău. */}
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[color:var(--s-2)] text-[color:var(--ink-3)] num">
                        ×{e.count}
                      </span>
                      {e.route && (
                        <span className="text-[10px] text-[color:var(--ink-4)] font-mono truncate">
                          {e.route}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-[color:var(--ink-2)] mt-1 break-words">
                      {e.message}
                    </p>

                    <p className="text-[10px] text-[color:var(--ink-4)] mt-1.5">
                      {t("seenRange", { first: cand(e.firstSeen), last: cand(e.lastSeen) })}
                    </p>

                    {extins && e.stack && (
                      <pre className="mt-3 text-[10px] leading-relaxed text-[color:var(--ink-3)] bg-[color:var(--s-0)] border border-[color:var(--line-1)] rounded-lg p-3 overflow-x-auto whitespace-pre">
                        {e.stack}
                      </pre>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {e.stack && (
                      <button
                        onClick={() => setDeschis(extins ? null : e.id)}
                        className="tg-tap grid place-items-center w-8 h-8 rounded-lg text-[color:var(--ink-4)]
                                   hover:text-[color:var(--ink-1)] hover:bg-[color:var(--s-2)] transition-colors"
                        aria-label={t("toggleStack")}
                      >
                        <ChevronDown className={cn("w-4 h-4 transition-transform", extins && "rotate-180")} />
                      </button>
                    )}
                    <button
                      onClick={() => comutaRezolvat(e.id, rezolvat)}
                      disabled={inLucru === e.id}
                      className={cn(
                        "tg-tap grid place-items-center w-8 h-8 rounded-lg transition-colors disabled:opacity-40",
                        rezolvat
                          ? "text-emerald-400 bg-emerald-500/10"
                          : "text-[color:var(--ink-4)] hover:text-emerald-300 hover:bg-emerald-500/10"
                      )}
                      aria-label={rezolvat ? t("reopen") : t("resolve")}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
