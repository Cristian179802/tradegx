"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Settings, Zap, ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { AccountSwitcher } from "@/components/layout/account-switcher";
import { useAuthStore } from "@/stores/auth.store";

// route → { nav translation key, icon }. Titlul se traduce la randare via nav.*
const PAGE_TITLES: Record<string, { key: string; icon: string }> = {
  "/dashboard":    { key: "dashboard",   icon: "📊" },
  "/signals":      { key: "signals",     icon: "🎯" },
  "/checklist":    { key: "checklist",   icon: "✅" },
  "/goals":        { key: "goals",       icon: "🏆" },
  "/trades":       { key: "trades",      icon: "📋" },
  "/journal":      { key: "journal",     icon: "📓" },
  "/calculator":   { key: "calculator",  icon: "🧮" },
  "/analytics":    { key: "analytics",   icon: "📈" },
  "/accounts":     { key: "accounts",    icon: "💼" },
  "/backtesting":  { key: "backtesting", icon: "🔬" },
  "/charts":       { key: "charts",      icon: "💹" },
  "/market":       { key: "market",      icon: "🌍" },
  "/tools":        { key: "tools",       icon: "📊" },
  "/news":         { key: "news",        icon: "📰" },
  "/calendar":     { key: "calendar",    icon: "📅" },
  "/community":    { key: "community",   icon: "👥" },
  "/settings":     { key: "settings",    icon: "⚙️" },
  "/ai-assistant": { key: "aiAssistant", icon: "🤖" },
  "/alerts":       { key: "alerts",      icon: "🔔" },
  "/risk-manager": { key: "riskManager", icon: "🛡️" },
  "/prop-firm":    { key: "propFirm",    icon: "🏆" },
};

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { toggleMobileSidebar } = useAuthStore();
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");

  const matchKey = Object.keys(PAGE_TITLES).find(k => pathname === k || pathname.startsWith(k + "/"));
  const matched = matchKey ? PAGE_TITLES[matchKey] : null;
  const page = matched
    ? { title: tNav(matched.key), icon: matched.icon }
    : { title: "TradeGx", icon: "⚡" };

  return (
    <div className="shrink-0">
      {/* ── Main topbar ─────────────────────────────────────────────────── */}
      <header className="relative h-12 border-b border-zinc-800/60 backdrop-blur-xl flex items-center justify-between px-5"
        style={{ background: "linear-gradient(90deg, rgba(13,13,18,0.98) 0%, rgba(9,9,11,0.98) 100%)" }}>
        {/* Bottom glow */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/40 to-transparent" />

        {/* Left: page title with breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Hamburger — doar pe mobil */}
          <button
            onClick={toggleMobileSidebar}
            className="md:hidden flex items-center justify-center w-8 h-8 -ml-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 transition-colors"
            aria-label={tCommon("openMenu")}
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-zinc-700 text-[11px] hidden sm:block font-bold tracking-wide">
            Trade<span className="gradient-text-indigo">Gx</span>
          </span>
          <ChevronRight className="w-3 h-3 text-zinc-800 hidden sm:block flex-shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0">
            {page.icon && <span className="text-sm leading-none flex-shrink-0">{page.icon}</span>}
            <h1 className="text-[13px] font-bold text-zinc-100 tracking-tight truncate">{page.title}</h1>
          </div>
        </div>

        {/* Center: account switcher */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
          <AccountSwitcher />
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Trial badge */}
          {session?.user?.isTrialing && (
            <Link href="/pricing">
              <Badge className="bg-gradient-to-r from-indigo-500/15 to-violet-500/10 border border-indigo-500/25 text-indigo-300 hover:from-indigo-500/25 hover:to-violet-500/20 cursor-pointer text-[10px] px-2 py-0.5 gap-1 flex items-center transition-all">
                <Zap className="w-2.5 h-2.5" />
                {tCommon("trialPro")}
              </Badge>
            </Link>
          )}
          {session?.user?.plan === "PRO" && !session?.user?.isTrialing && (
            <Badge className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] px-2 py-0.5 font-black tracking-wide">
              PRO
            </Badge>
          )}

          <LanguageSwitcher compact />

          <NotificationDropdown />

          <Link href="/settings">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/70 rounded-xl transition-all duration-200",
                pathname === "/settings" && "text-white bg-zinc-800/80"
              )}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>
    </div>
  );
}
