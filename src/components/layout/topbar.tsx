"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { AccountSwitcher } from "@/components/layout/account-switcher";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Panou de Control",
  "/trades": "Tranzacții",
  "/journal": "Jurnal",
  "/calculator": "Calculator Lot",
  "/analytics": "Analiză",
  "/backtesting": "Backtesting",
  "/charts": "Grafice Live",
  "/market": "Selector Piață",
  "/community": "Comunitate",
  "/settings": "Setări",
  "/ai-assistant": "AI Coach",
  "/alerts": "Alerte AI",
};

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  DEMO: "text-zinc-400 bg-zinc-800 border-zinc-700",
  CHALLENGE: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  LIVE: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const pageTitle = PAGE_TITLES[pathname] ?? "TradeGX";

  return (
    <header className="relative h-14 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-between px-5 shrink-0">
      {/* Left: page title */}
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-semibold text-zinc-200">{pageTitle}</h1>
      </div>

      {/* Center: account switcher */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <AccountSwitcher />
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2">
        {/* Subscription badge */}
        {session?.user?.isTrialing && (
          <Link href="/pricing">
            <Badge className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/15 cursor-pointer text-xs">
              Probă PRO
            </Badge>
          </Link>
        )}

        {/* Notifications */}
        <NotificationDropdown />

        {/* Settings shortcut */}
        <Link href="/settings">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800",
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
