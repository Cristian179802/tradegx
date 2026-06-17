"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, BookOpen, Calculator, BarChart3, LineChart, Globe,
  CalendarDays, Users, Settings, TrendingUp, LogOut, ChevronDown,
  Plus, Zap, User, NotebookPen, FlaskConical, Brain, BellRing,
  PanelLeftClose, PanelLeftOpen, Sparkles, Activity, Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth.store";
import { AlertsBadge } from "./alerts-badge";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  proOnly?: boolean;
  badge?: string;
  color?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Trading",
    items: [
      { href: "/dashboard",    label: "Panou de Control", icon: LayoutDashboard, color: "indigo" },
      { href: "/trades",       label: "Tranzacții",        icon: BookOpen,        color: "violet" },
      { href: "/journal",      label: "Jurnal",            icon: NotebookPen,     color: "emerald" },
      { href: "/calculator",   label: "Calculator Lot",    icon: Calculator,      color: "amber" },
      { href: "/risk-manager", label: "Risk Manager",      icon: Shield,          color: "amber" },
      { href: "/accounts",     label: "Conturi",           icon: TrendingUp,      color: "sky" },
      { href: "/analytics",    label: "Analiză",           icon: BarChart3,       color: "violet" },
      { href: "/backtesting",  label: "Backtesting",       icon: FlaskConical,    color: "rose" },
    ],
  },
  {
    label: "AI",
    items: [
      { href: "/ai-assistant", label: "AI Assistant", icon: Brain,    color: "violet" },
      { href: "/alerts",       label: "Alerte AI",    icon: BellRing, color: "amber" },
    ],
  },
  {
    label: "Piețe",
    items: [
      { href: "/charts",   label: "Grafice Live",      icon: LineChart,    color: "emerald" },
      { href: "/market",   label: "Selector Piață",    icon: Globe,        color: "sky" },
      { href: "/calendar", label: "Calendar Economic", icon: CalendarDays, color: "amber" },
    ],
  },
  {
    label: "Comunitate",
    items: [
      { href: "/community", label: "Comunitate", icon: Users, proOnly: true, color: "indigo" },
    ],
  },
  {
    label: "Cont",
    items: [
      { href: "/settings", label: "Setări", icon: Settings, color: "zinc" },
    ],
  },
];

const COLOR_MAP: Record<string, { active: string; icon: string }> = {
  indigo:  { active: "bg-indigo-500/20 border-indigo-400/50",  icon: "text-indigo-300"  },
  violet:  { active: "bg-violet-500/20 border-violet-400/50",  icon: "text-violet-300"  },
  emerald: { active: "bg-emerald-500/20 border-emerald-400/50",icon: "text-emerald-300" },
  amber:   { active: "bg-amber-500/20 border-amber-400/50",    icon: "text-amber-300"   },
  sky:     { active: "bg-sky-500/20 border-sky-400/50",        icon: "text-sky-300"     },
  rose:    { active: "bg-rose-500/20 border-rose-400/50",      icon: "text-rose-300"    },
  zinc:    { active: "bg-zinc-700/60 border-zinc-500/50",      icon: "text-zinc-200"    },
};

const INDICATOR_MAP: Record<string, string> = {
  indigo:  "bg-indigo-400 shadow-[0_0_10px_3px_rgba(99,102,241,0.9),0_0_20px_6px_rgba(99,102,241,0.4)]",
  violet:  "bg-violet-400 shadow-[0_0_10px_3px_rgba(139,92,246,0.9),0_0_20px_6px_rgba(139,92,246,0.4)]",
  emerald: "bg-emerald-400 shadow-[0_0_10px_3px_rgba(52,211,153,0.9),0_0_20px_6px_rgba(52,211,153,0.4)]",
  amber:   "bg-amber-400 shadow-[0_0_10px_3px_rgba(245,158,11,0.9),0_0_20px_6px_rgba(245,158,11,0.4)]",
  sky:     "bg-sky-400 shadow-[0_0_10px_3px_rgba(14,165,233,0.9),0_0_20px_6px_rgba(14,165,233,0.4)]",
  rose:    "bg-rose-400 shadow-[0_0_10px_3px_rgba(244,63,94,0.9),0_0_20px_6px_rgba(244,63,94,0.4)]",
  zinc:    "bg-zinc-400 shadow-[0_0_8px_2px_rgba(161,161,170,0.7)]",
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { sidebarCollapsed, setSidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useAuthStore();
  const isPro = session?.user?.plan === "PRO" || session?.user?.isTrialing;

  const userInitials = session?.user?.name
    ? session.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "TG";

  return (
    <>
    {/* Backdrop mobil — apare când drawerul e deschis */}
    {mobileSidebarOpen && (
      <div
        onClick={() => setMobileSidebarOpen(false)}
        className="md:hidden fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm"
        aria-hidden
      />
    )}
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "relative flex-shrink-0 h-screen border-r border-zinc-800/60 flex flex-col overflow-visible",
        // Pe mobil: drawer fix peste conținut, lățime fixă, glisare cu transform
        "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-[60] max-md:!w-[264px] max-md:transition-transform max-md:duration-300",
        mobileSidebarOpen ? "max-md:translate-x-0 max-md:shadow-2xl max-md:shadow-black/60" : "max-md:-translate-x-full",
      )}
      style={{ background: "linear-gradient(180deg, #0d0d12 0%, #09090b 100%)" }}
    >
      {/* Top neon line */}
      <div className="absolute top-0 left-0 right-0 h-px neon-line-indigo" />

      {/* Ambient background glow */}
      <div className="absolute top-0 left-0 right-0 h-64 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(99,102,241,0.08) 0%, transparent 70%)" }}
      />

      {/* ── Floating edge collapse/expand handle ── */}
      <motion.button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        title={sidebarCollapsed ? "Extinde bara laterală" : "Restrânge bara laterală"}
        className="max-md:hidden absolute top-1/2 -translate-y-1/2 -right-3 z-50 flex items-center justify-center w-6 h-12 rounded-r-xl border border-l-0 border-zinc-700/60 bg-zinc-900 hover:bg-zinc-800 hover:border-indigo-500/50 text-zinc-600 hover:text-indigo-400 transition-all duration-200 shadow-lg group"
        style={{ boxShadow: "2px 0 16px rgba(0,0,0,0.5)" }}
        whileHover={{ x: 2, scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ rotate: sidebarCollapsed ? 0 : 180 }}
          transition={{ duration: 0.22 }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M3 2L7 5L3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </motion.button>

      {/* Logo */}
      <Link
        href="/dashboard"
        className="relative flex items-center gap-2.5 px-3 py-2 h-14 border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors overflow-hidden group"
      >
        {/* Logo icon */}
        <div className="shrink-0 w-9 h-9 relative flex items-center justify-center rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 group-hover:border-indigo-500/40 transition-all duration-300 overflow-hidden">
          {/* Inner glow on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-violet-500/0 group-hover:from-indigo-500/10 group-hover:to-violet-500/5 transition-all duration-300 rounded-xl" />
          <Image
            src="/logo.jpg"
            alt="TradeGx"
            width={36}
            height={36}
            className="object-contain relative z-10"
            style={{ mixBlendMode: "screen" }}
            priority
          />
        </div>

        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col overflow-hidden"
            >
              <span className="font-black text-white tracking-tight whitespace-nowrap text-[15px] leading-tight">
                Trade<span className="gradient-text-indigo">Gx</span>
              </span>
              <span className="text-[9px] font-bold text-zinc-600 tracking-[0.1em] uppercase whitespace-nowrap">
                Pro Trading Journal
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-2 sidebar-scroll">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-0.5">
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.12em] px-4 pt-4 pb-1.5 select-none"
                >
                  {group.label}
                </motion.p>
              )}
            </AnimatePresence>

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const locked = item.proOnly && !isPro;
              const colorKey = item.color ?? "indigo";
              const colors = COLOR_MAP[colorKey] ?? COLOR_MAP.indigo;
              const indicatorClass = INDICATOR_MAP[colorKey] ?? INDICATOR_MAP.indigo;

              return (
                <Link
                  key={item.href}
                  href={locked ? "/pricing" : item.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={cn(
                    "relative flex items-center gap-3 mx-2 px-2.5 py-[7px] rounded-xl text-sm transition-all duration-200 group cyber-scan",
                    isActive
                      ? cn("nav-item-active text-white font-semibold", colors.icon)
                      : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent hover:border-zinc-700/40",
                    locked && "opacity-40 cursor-not-allowed"
                  )}
                >
                  {/* Neon active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-bar"
                      className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full",
                        indicatorClass
                      )}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}

                  {/* Icon */}
                  <Icon className={cn(
                    "w-[17px] h-[17px] shrink-0 transition-all duration-200",
                    isActive
                      ? cn(colors.icon)
                      : "text-zinc-600 group-hover:text-zinc-300"
                  )} />

                  {/* Label */}
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="whitespace-nowrap overflow-hidden flex-1 text-[13px] font-medium"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {!sidebarCollapsed && item.proOnly && !isPro && (
                    <Badge className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] px-1.5 py-0 h-4 font-bold">
                      PRO
                    </Badge>
                  )}
                  {!sidebarCollapsed && item.href === "/alerts" && (
                    <AlertsBadge />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-zinc-800/50 p-2.5 space-y-1.5">
        {/* Trial / PRO banner */}
        <AnimatePresence>
          {!sidebarCollapsed && session?.user?.isTrialing && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="relative overflow-hidden bg-gradient-to-br from-indigo-500/12 via-violet-500/8 to-transparent border border-indigo-500/25 rounded-xl p-2.5 mb-1"
            >
              {/* Animated top line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />
              <div className="flex items-center gap-1.5 mb-0.5">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span className="text-indigo-300 text-[11px] font-bold">Probă PRO activă</span>
              </div>
              <p className="text-zinc-500 text-[10px] leading-relaxed">
                Actualizează pentru acces nelimitat la toate funcțiile.
              </p>
              <Link href="/pricing" className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                <Zap className="w-2.5 h-2.5" />
                Upgrade acum
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full flex items-center gap-2 px-2 py-2 h-auto hover:bg-zinc-900/80 rounded-xl text-left transition-all duration-200 group"
            >
              <Avatar className="w-7 h-7 shrink-0 ring-1 ring-indigo-500/30 group-hover:ring-indigo-500/50 transition-all">
                <AvatarImage src={session?.user?.image ?? ""} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white text-[10px] font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 min-w-0 overflow-hidden"
                  >
                    <p className="text-[12px] font-semibold text-zinc-200 truncate leading-tight">
                      {session?.user?.name ?? "Trader"}
                    </p>
                    <div className="flex items-center gap-1">
                      {isPro && (
                        <span className="text-[9px] font-black text-indigo-400 tracking-wide">PRO</span>
                      )}
                      <p className="text-[10px] text-zinc-600 truncate">
                        {session?.user?.email}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {!sidebarCollapsed && (
                <ChevronDown className="w-3 h-3 text-zinc-700 shrink-0 group-hover:text-zinc-500 transition-colors" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            className="w-52 bg-zinc-900/95 border-zinc-800/80 shadow-2xl shadow-black/40 backdrop-blur-xl rounded-xl"
          >
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <User className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-300">Profil & Setări</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/accounts" className="flex items-center gap-2 cursor-pointer">
                <Activity className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-300">Conturi Trading</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800/80" />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2 cursor-pointer text-rose-400 focus:text-rose-300 focus:bg-rose-500/10"
            >
              <LogOut className="w-4 h-4" />
              <span>Deconectare</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </motion.aside>
    </>
  );
}
