"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Sparkles, X, Zap } from "lucide-react";

// ── Banner plan: countdown trial / invitație upgrade ────────────────────────
// Trial activ → countdown indigo. Plan FREE → banner amber discret (dismissible).

const DISMISS_KEY = "tradegx-free-banner-dismissed";

export function TrialBanner() {
  const t = useTranslations("banner");
  const { data: session, status } = useSession();
  const [dismissed, setDismissed] = React.useState(true);

  React.useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (status !== "authenticated" || !session?.user) return null;

  const { plan, isTrialing, trialEndsAt } = session.user;

  // ── Trial activ: countdown ──
  if (isTrialing && trialEndsAt) {
    const daysLeft = Math.max(1, Math.ceil((trialEndsAt - Date.now()) / (24 * 60 * 60 * 1000)));
    return (
      <div className="flex items-center justify-center gap-2.5 px-4 py-2 bg-gradient-to-r from-indigo-600/15 via-violet-600/15 to-indigo-600/15 border-b border-indigo-500/20 text-xs">
        <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span className="text-zinc-300 font-medium">
          <span className="font-black text-indigo-300">{t("trialLabel")}</span> —{" "}
          {t("trialDaysLeft", { days: daysLeft })}
        </span>
        <Link
          href="/pricing"
          className="font-bold text-indigo-300 hover:text-indigo-200 underline underline-offset-2 transition-colors"
        >
          {t("trialCta")}
        </Link>
      </div>
    );
  }

  // ── Plan FREE: invitație discretă (dismissible) ──
  if (plan === "FREE" && !dismissed) {
    return (
      <div className="flex items-center justify-center gap-2.5 px-4 py-1.5 bg-zinc-900/90 border-b border-zinc-800 text-[11px]">
        <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
        <span className="text-zinc-500">{t("freeText")}</span>
        <Link href="/pricing" className="font-bold text-amber-400 hover:text-amber-300 transition-colors">
          {t("freeCta")}
        </Link>
        <button
          onClick={() => {
            setDismissed(true);
            try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
          }}
          className="ml-1 text-zinc-600 hover:text-zinc-400"
          aria-label={t("close")}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return null;
}
