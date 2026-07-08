"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Lightbulb, X } from "lucide-react";

// ── Sfatul zilei ──────────────────────────────────────────────────────────────
// Sfaturi practice, concrete și acționabile de trading — diferite în fiecare zi,
// alese determinist pe baza zilei anului (se schimbă automat la miezul nopții).
// Textele sunt în messages/{locale}.json → motivationBanner.tips (array tradus).

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

export function MotivationBanner() {
  const t = useTranslations("motivationBanner");
  const tips = t.raw("tips") as { text: string; cat: string }[];
  const [hidden, setHidden] = React.useState(true);
  const tip = tips[dayOfYear() % tips.length];

  React.useEffect(() => {
    const key = `tip-dismissed-${new Date().toISOString().slice(0, 10)}`;
    setHidden(localStorage.getItem(key) === "1");
  }, []);

  function dismiss() {
    const key = `tip-dismissed-${new Date().toISOString().slice(0, 10)}`;
    localStorage.setItem(key, "1");
    setHidden(true);
  }

  if (hidden) return null;

  return (
    <div
      className="relative flex items-center gap-3 rounded-2xl border border-indigo-500/20 px-4 py-3 overflow-hidden animate-fade-in-up"
      style={{
        background: "linear-gradient(100deg, rgba(99,102,241,0.10) 0%, rgba(139,92,246,0.06) 40%, rgba(24,24,28,0.6) 100%)",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
      <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
        <Lightbulb className="w-4 h-4 text-amber-300" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-amber-400/90 uppercase tracking-[0.12em]">{t("label")}</span>
          <span className="text-[9px] font-bold text-indigo-300/80 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">{tip.cat}</span>
        </div>
        <p className="text-sm text-zinc-200 font-medium leading-snug mt-0.5">{tip.text}</p>
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors"
        title={t("hideForToday")}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
