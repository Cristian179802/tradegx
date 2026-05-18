"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Settings, Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { AccountSwitcher } from "@/components/layout/account-switcher";

const PAGE_TITLES: Record<string, { title: string; icon?: string }> = {
  "/dashboard":    { title: "Panou de Control",  icon: "🏠" },
  "/trades":       { title: "Tranzacții",         icon: "📋" },
  "/journal":      { title: "Jurnal",             icon: "📓" },
  "/calculator":   { title: "Calculator Lot",     icon: "🧮" },
  "/analytics":    { title: "Analiză",            icon: "📊" },
  "/accounts":     { title: "Conturi",            icon: "💼" },
  "/backtesting":  { title: "Backtesting",        icon: "🔬" },
  "/charts":       { title: "Grafice Live",       icon: "📈" },
  "/market":       { title: "Selector Piață",     icon: "🌍" },
  "/calendar":     { title: "Calendar Economic",  icon: "📅" },
  "/community":    { title: "Comunitate",         icon: "👥" },
  "/settings":     { title: "Setări",             icon: "⚙️" },
  "/ai-assistant": { title: "AI Trading Coach",   icon: "🤖" },
  "/alerts":       { title: "Alerte AI",          icon: "🔔" },
};

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Find closest match
  const matchKey = Object.keys(PAGE_TITLES).find(k => pathname === k || pathname.startsWith(k + "/"));
  const page = (matchKey ? PAGE_TITLES[matchKey] : null) ?? { title: "TradeGX" };

  return (
    <header className="relative h-14 border-b border-zinc-800/50 bg-zinc-950/90 backdrop-blur-xl flex items-center justify-between px-5 shrink-0">
      {/* Subtle bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />

      {/* Left: breadcrumb-style title */}
      <div className="flex items-center gap-2">
        <span className="text-zinc-600 text-xs hidden sm:block">TradeGX</span>
        <ChevronRight className="w-3 h-3 text-zinc-700 hidden sm:block" />
        <h1 className="text-sm font-semibold text-zinc-200 tracking-tight">{page.title}</h1>
      </div>

      {/* Center: account switcher */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
        <AccountSwitcher />
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-1.5">
        {/* Trial badge */}
        {session?.user?.isTrialing && (
          <Link href="/pricing">
            <Badge className="bg-gradient-to-r from-indigo-500/15 to-violet-500/10 border border-indigo-500/25 text-indigo-300 hover:from-indigo-500/25 hover:to-violet-500/15 cursor-pointer text-[10px] px-2 py-0.5 gap-1 flex items-center">
              <Zap className="w-2.5 h-2.5" />
              Probă PRO
            </Badge>
          </Link>
        )}
        {session?.user?.plan === "PRO" && !session?.user?.isTrialing && (
          <Badge className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] px-2 py-0.5">
            PRO
          </Badge>
        )}

        <NotificationDropdown />

        <Link href="/settings">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/80 rounded-xl transition-all",
              pathname === "/settings" && "text-white bg-zinc-800"
            )}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
