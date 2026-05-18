"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, BookOpen, Calculator, BarChart3, LineChart, Globe,
  CalendarDays, Users, Settings, TrendingUp, ChevronLeft, ChevronRight,
  LogOut, ChevronDown, Plus, Zap, User, NotebookPen, FlaskConical,
  Brain, BellRing, PanelLeftClose, PanelLeftOpen,
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

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  proOnly?: boolean;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Trading",
    items: [
      { href: "/dashboard",    label: "Panou de Control", icon: LayoutDashboard },
      { href: "/trades",       label: "Tranzacții",        icon: BookOpen },
      { href: "/journal",      label: "Jurnal",            icon: NotebookPen },
      { href: "/calculator",   label: "Calculator Lot",    icon: Calculator },
      { href: "/accounts",     label: "Conturi",           icon: TrendingUp },
      { href: "/analytics",    label: "Analiză",           icon: BarChart3 },
      { href: "/backtesting",  label: "Backtesting",       icon: FlaskConical },
    ],
  },
  {
    label: "AI",
    items: [
      { href: "/ai-assistant", label: "AI Assistant", icon: Brain },
      { href: "/alerts",       label: "Alerte AI",    icon: BellRing },
    ],
  },
  {
    label: "Piețe",
    items: [
      { href: "/charts",   label: "Grafice Live",      icon: LineChart },
      { href: "/market",   label: "Selector Piață",    icon: Globe },
      { href: "/calendar", label: "Calendar Economic", icon: CalendarDays },
    ],
  },
  {
    label: "Comunitate",
    items: [
      { href: "/community", label: "Comunitate", icon: Users, proOnly: true },
    ],
  },
  {
    label: "Cont",
    items: [
      { href: "/settings", label: "Setări", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { sidebarCollapsed, setSidebarCollapsed } = useAuthStore();
  const isPro = session?.user?.plan === "PRO" || session?.user?.isTrialing;

  const userInitials = session?.user?.name
    ? session.user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "AT";

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative flex-shrink-0 h-screen bg-zinc-950 border-r border-zinc-800/50 flex flex-col overflow-hidden"
    >
      {/* Subtle top glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      {/* Logo */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 px-3 py-2 h-14 border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors overflow-hidden group"
      >
        <div className="shrink-0 w-9 h-9 relative flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 group-hover:border-indigo-500/30 transition-colors overflow-hidden">
          <Image src="/logo.jpg" alt="TradeGX" width={36} height={36}
            className="object-contain" style={{ mixBlendMode: "screen" }} priority />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="font-black text-white tracking-tight whitespace-nowrap overflow-hidden text-[15px]"
            >
              Trade<span className="gradient-text-indigo">GX</span>
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
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

              return (
                <Link
                  key={item.href}
                  href={locked ? "/pricing" : item.href}
                  className={cn(
                    "relative flex items-center gap-3 mx-2 px-2.5 py-2 rounded-xl text-sm transition-all duration-150 group",
                    isActive
                      ? "bg-zinc-800/80 text-white"
                      : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/70",
                    locked && "opacity-50"
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-indigo-400 rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}

                  <Icon className={cn(
                    "w-[17px] h-[17px] shrink-0 transition-colors",
                    isActive ? "text-indigo-400" : "text-zinc-600 group-hover:text-zinc-300"
                  )} />

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
                    <Badge className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] px-1.5 py-0 h-4">
                      PRO
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-zinc-800/50 p-2.5 space-y-1.5">
        {/* Trial banner */}
        {!sidebarCollapsed && session?.user?.isTrialing && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-indigo-500/10 to-violet-500/5 border border-indigo-500/20 rounded-xl p-2.5 mb-1"
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <Zap className="w-3 h-3 text-indigo-400" />
              <span className="text-indigo-300 text-[11px] font-bold">Probă PRO activă</span>
            </div>
            <p className="text-zinc-600 text-[10px] leading-relaxed">
              Actualizează pentru acces nelimitat.
            </p>
          </motion.div>
        )}

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full flex items-center gap-2 px-2 py-2 h-auto hover:bg-zinc-900 rounded-xl text-left"
            >
              <Avatar className="w-7 h-7 shrink-0 ring-1 ring-zinc-700">
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
                    <p className="text-[10px] text-zinc-600 truncate">
                      {session?.user?.email}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              {!sidebarCollapsed && (
                <ChevronDown className="w-3 h-3 text-zinc-700 shrink-0" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-52 bg-zinc-900 border-zinc-800 shadow-xl">
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <User className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-300">Profil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/accounts" className="flex items-center gap-2 cursor-pointer">
                <Plus className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-300">Cont nou</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2 cursor-pointer text-rose-400 focus:text-rose-300 focus:bg-rose-500/10"
            >
              <LogOut className="w-4 h-4" />
              <span>Deconectare</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-full flex items-center justify-center h-7 text-zinc-700 hover:text-zinc-400 hover:bg-zinc-900 rounded-xl transition-colors"
        >
          {sidebarCollapsed
            ? <PanelLeftOpen className="w-3.5 h-3.5" />
            : <PanelLeftClose className="w-3.5 h-3.5" />
          }
        </button>
      </div>
    </motion.aside>
  );
}
