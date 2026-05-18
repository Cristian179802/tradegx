"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Settings, Zap, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { AccountSwitcher } from "@/components/layout/account-switcher";

// Static market snapshot — in a real app this would come from a websocket feed
const MARKET_TICKERS = [
  { symbol: "EUR/USD", price: "1.0847", change: "+0.12%", up: true },
  { symbol: "GBP/USD", price: "1.2714", change: "-0.08%", up: false },
  { symbol: "XAU/USD", price: "2,321.4", change: "+0.34%", up: true },
  { symbol: "BTC/USD", price: "67,820", change: "+1.82%", up: true },
  { symbol: "USD/JPY", price: "157.34", change: "+0.22%", up: true },
  { symbol: "NAS100",  price: "18,247", change: "-0.15%", up: false },
  { symbol: "SPX500",  price: "5,304",  change: "+0.07%", up: true },
  { symbol: "OIL/USD", price: "78.42",  change: "-0.51%", up: false },
  { symbol: "ETH/USD", price: "3,416",  change: "+2.14%", up: true },
  { symbol: "USD/CHF", price: "0.9042", change: "+0.05%", up: true },
];

const PAGE_TITLES: Record<string, { title: string; icon?: string; description?: string }> = {
  "/dashboard":    { title: "Panou de Control",  icon: "📊", description: "Statistici & activitate recentă" },
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
};

function TickerItem({ symbol, price, change, up }: typeof MARKET_TICKERS[0]) {
  return (
    <span className="flex items-center gap-1.5 shrink-0 select-none">
      <span className="text-zinc-500 text-[11px] font-bold tracking-wide">{symbol}</span>
      <span className="text-zinc-200 text-[11px] font-mono font-semibold">{price}</span>
      <span className={cn(
        "text-[10px] font-bold flex items-center gap-0.5",
        up ? "text-emerald-400" : "text-rose-400"
      )}>
        {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
        {change}
      </span>
      <span className="text-zinc-800 mx-2 text-[10px]">·</span>
    </span>
  );
}

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const matchKey = Object.keys(PAGE_TITLES).find(k => pathname === k || pathname.startsWith(k + "/"));
  const page = (matchKey ? PAGE_TITLES[matchKey] : null) ?? { title: "TradeGx", icon: "⚡" };

  return (
    <div className="shrink-0">
      {/* ── Live market ticker strip ────────────────────────────────────── */}
      <div className="h-7 border-b border-zinc-800/40 bg-zinc-950/80 overflow-hidden flex items-center">
        {/* Left label */}
        <div className="shrink-0 flex items-center gap-1.5 px-3 border-r border-zinc-800/50 h-full bg-zinc-950/60">
          <span className="live-dot-indigo" />
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">
            Live
          </span>
        </div>
        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden">
          <div className="flex animate-ticker whitespace-nowrap gap-0">
            {[...MARKET_TICKERS, ...MARKET_TICKERS].map((t, i) => (
              <TickerItem key={i} {...t} />
            ))}
          </div>
        </div>
        {/* Right fade */}
        <div className="shrink-0 w-12 h-full bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none" />
      </div>

      {/* ── Main topbar ─────────────────────────────────────────────────── */}
      <header className="relative h-12 border-b border-zinc-800/50 bg-zinc-950/90 backdrop-blur-xl flex items-center justify-between px-5">
        {/* Bottom glow */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700/40 to-transparent" />

        {/* Left: page title with breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
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
