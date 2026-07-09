"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, Lock, Zap } from "lucide-react";

// ── PaywallCard ─────────────────────────────────────────────────────────────
// Afișat în locul conținutului PRO pentru utilizatorii FREE — vinde beneficiul,
// nu blochează sec.

export function PaywallCard({
  feature,
  description,
  bullets,
}: {
  feature: string;
  description: string;
  bullets: string[];
}) {
  const t = useTranslations("paywall");
  return (
    <div className="relative rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/[0.07] via-zinc-900/80 to-zinc-900/80 p-10 text-center overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-5 h-5 text-indigo-400" />
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">
          {t("proFeature")}
        </p>
        <h2 className="text-xl font-black text-zinc-100 mb-2">{feature}</h2>
        <p className="text-sm text-zinc-500 max-w-md mx-auto mb-6">{description}</p>

        <ul className="inline-block text-left space-y-2 mb-7">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-xs text-zinc-400">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              {b}
            </li>
          ))}
        </ul>

        <div>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Zap className="w-4 h-4" />
            {t("activatePro")}
          </Link>
          <p className="text-[10px] text-zinc-600 mt-3">
            {t("cancelNote")}
          </p>
        </div>
      </div>
    </div>
  );
}
