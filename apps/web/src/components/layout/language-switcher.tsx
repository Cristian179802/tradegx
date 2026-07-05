"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

// ── Comutator de limbă (RO/EN) ──────────────────────────────────────────────
// Setează cookie-ul `locale` (citit de next-intl pe server), sincronizează
// limba Academiei (localStorage) și reîmprospătează UI-ul instant.

const LOCALES = ["ro", "en"] as const;

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const locale = useLocale();
  const [pending, setPending] = React.useState(false);

  function switchTo(next: string) {
    if (next === locale || pending) return;
    setPending(true);
    // Cookie 1 an, tot site-ul
    document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`;
    // Academia își ține limba separat (localStorage) — le ținem sincron
    try {
      localStorage.setItem("tradegx-academy-lang", next);
    } catch {}
    router.refresh();
    setTimeout(() => setPending(false), 400);
  }

  return (
    <div
      className={cn(
        "flex rounded-lg border border-zinc-800 bg-zinc-900/80 p-0.5",
        pending && "opacity-60"
      )}
      role="group"
      aria-label="Limbă / Language"
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => switchTo(l)}
          className={cn(
            "font-bold rounded-md transition-colors uppercase",
            compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-xs",
            locale === l
              ? "bg-indigo-500/20 text-indigo-300"
              : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
