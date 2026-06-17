"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Settings, Zap, ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { AccountSwitcher } from "@/components/layout/account-switcher";
import { useAuthStore } from "@/stores/auth.store";

const PAGE_TITLES: Record<string, { title: string; icon?: string; description?: string }> = {
  "/dashboard":    { title: "Panou de Control",  icon: "📊", description: "Statistici & activitate recentă" },
  "/signals":      { title: "Semnale AI",         icon: "🎯", description: "Setup-uri de înaltă probabilitate (HPS)" },
  "/checklist":    { title: "Checklist Pre-Trade", icon: "✅", description: "Verifică disciplina înainte de intrare" },
  "/goals":        { title: "Obiective",          icon: "🏆", description: "Ținte lunare & monitor prop firm" },
  "/trades":       { title: "Tranzacții",         icon: "📋", description: "Istoric complet de trading" },
  "/journal":      { title: "Jurnal",             icon: "📓", description: "Analiză & reflecție" },
  "/calculator":   { title: "Calculator Lot",     icon: "🧮", description: "Calculează dimensiunea poziției" },
  "/analytics":    { title: "Analiză",            icon: "📈", description: "Metrici & performanță" },
  "/accounts":     { title: "Conturi",            icon: "💼", description: "Gestionează conturile de trading" },
  "/backtesting":  { title: "Backtesting",        icon: "🔬", description: "Testează strategii pe date istorice" },
  "/charts":       { title: "Grafice Live",       icon: "💹", description: "TradingView avansat" },
  "/market":       { title: "Piețe",              icon: "🌍", description: "Prețuri & instrumente" },
  "/calendar":     { title: "Calendar Economic",  icon: "📅", description: "Evenimente macro importante" },
  "/community":    { title: "Comunitate",         icon: "👥", description: "Conectează-te cu traderii" },
  "/settings":     { title: "Setări",             icon: "⚙️", description: "Personalizează TradeGx" },
  "/ai-assistant": { title: "AI Trading Coach",   icon: "🤖", description: "Analiză inteligentă AI" },
  "/alerts":       { title: "Alerte AI",          icon: "🔔", description: "Monitorizare risc în timp real" },
  "/risk-manager": { title: "Risk Manager",        icon: "🛡️", description: "Monitorizare risc în timp real" },
};

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { toggleMobileSidebar } = useAuthStore();

  const matchKey = Object.keys(PAGE_TITLES).find(k => pathname === k || pathname.startsWith(k + "/"));
  const page = (matchKey ? PAGE_TITLES[matchKey] : null) ?? { title: "TradeGx", icon: "⚡" };

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
            aria-label="Deschide meniul"
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
                Probă PRO
              </Badge>
            </Link>
          )}
          {session?.user?.plan === "PRO" && !session?.user?.isTrialing && (
            <Badge className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] px-2 py-0.5 font-black tracking-wide">
              PRO
            </Badge>
          )}

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
