"use client";

import { useTranslations } from "next-intl";
import { Send, Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Link-ul canalului public de comunitate
export const TELEGRAM_CHANNEL_URL = "https://t.me/tradegxsignals";

/**
 * Card de invitație în canalul Telegram al comunității.
 * variant="full" — card mare (pagina Semnale). variant="compact" — bară subțire (dashboard).
 */
export function TelegramChannelCard({ variant = "full" }: { variant?: "full" | "compact" }) {
  const t = useTranslations("telegramCard");
  if (variant === "compact") {
    return (
      <a
        href={TELEGRAM_CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3 rounded-2xl border border-sky-500/25 px-4 py-3 transition-all hover:border-sky-400/50"
        style={{ background: "linear-gradient(100deg, rgba(56,189,248,0.10) 0%, rgba(14,165,233,0.05) 50%, rgba(24,24,28,0.6) 100%)" }}
      >
        <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center shrink-0">
          <Send className="w-4 h-4 text-sky-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-zinc-200 leading-tight">{t("compactTitle")}</p>
          <p className="text-[11px] text-zinc-500">{t("compactSubtitle")}</p>
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-sky-400 shrink-0 group-hover:gap-2 transition-all">
          {t("enter")} <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </a>
    );
  }

  return (
    <div
      className="relative flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-sky-500/25 p-5 overflow-hidden"
      style={{ background: "linear-gradient(110deg, rgba(56,189,248,0.12) 0%, rgba(14,165,233,0.06) 45%, rgba(24,24,28,0.7) 100%)" }}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
      <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
        <Send className="w-6 h-6 text-sky-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-black text-zinc-100">{t("fullTitle")}</h3>
          <span className="flex items-center gap-1 text-[10px] font-bold text-sky-300 bg-sky-500/10 border border-sky-500/25 px-1.5 py-0.5 rounded-full">
            <Users className="w-2.5 h-2.5" /> Telegram
          </span>
        </div>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          {t("fullDesc")}
        </p>
      </div>
      <a
        href={TELEGRAM_CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "shrink-0 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-sky-500/20"
        )}
      >
        <Send className="w-4 h-4" />
        {t("enterChannel")}
      </a>
    </div>
  );
}
