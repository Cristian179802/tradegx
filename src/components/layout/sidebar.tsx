"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  BookOpen,
  Calculator,
  BarChart3,
  LineChart,
  Globe,
  CalendarDays,
  Users,
  Settings,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronDown,
  Plus,
  Zap,
  User,
  NotebookPen,
  FlaskConical,
  Brain,
  BellRing,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth.store";

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  proOnly?: boolean;
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Trading",
    items: [
      { href: "/dashboard", label: "Panou de Control", icon: LayoutDashboard },
      { href: "/trades", label: "Tranzacții", icon: BookOpen },
      { href: "/journal", label: "Jurnal", icon: NotebookPen },
      { href: "/calculator", label: "Calculator Lot", icon: Calculator },
      { href: "/accounts", label: "Conturi", icon: TrendingUp },
      { href: "/analytics", label: "Analiză", icon: BarChart3 },
      { href: "/backtesting", label: "Backtesting", icon: FlaskConical },
    ],
  },
  {
    label: "AI",
    items: [
      { href: "/ai-assistant", label: "AI Assistant", icon: Brain },
      { href: "/alerts", label: "Alerte AI", icon: BellRing },
    ],
  },
  {
    label: "Piețe",
    items: [
      { href: "/charts", label: "Grafice Live", icon: LineChart },
      { href: "/market", label: "Selector Piață", icon: Globe },
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
  const { sidebarCollapsed, setSidebarCollapsed, activeAccountId } = useAuthStore();
  const isPro = session?.user?.plan === "PRO" || session?.user?.isTrialing;

  const userInitials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AT";

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex-shrink-0 h-screen bg-zinc-950 border-r border-zinc-800/60 flex flex-col overflow-hidden"
    >
      {/* Logo — home button */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 px-3 py-2 h-14 border-b border-zinc-800/60 hover:bg-zinc-900/50 transition-colors overflow-hidden"
      >
        {/* Logo image — mix-blend-mode:screen removes the black background */}
        <div className="shrink-0 w-10 h-10 relative flex items-center justify-center">
          <Image
            src="/logo.jpg"
            alt="TradeGX"
            width={40}
            height={40}
            className="object-contain"
            style={{ mixBlendMode: "screen" }}
            priority
          />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="font-extrabold text-white tracking-tight whitespace-nowrap overflow-hidden text-base"
            >
              Trade<span className="text-emerald-400">GX</span>
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-1">
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-4 py-1.5"
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
                    "flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 group",
                    isActive
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900",
                    locked && "opacity-60"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0",
                      isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"
                    )}
                  />
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="whitespace-nowrap overflow-hidden flex-1"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!sidebarCollapsed && item.proOnly && !isPro && (
                    <Badge className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0">
                      PRO
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom: Trial banner + User menu */}
      <div className="border-t border-zinc-800/60 p-3 space-y-2">
        {/* Trial / upgrade banner */}
        {!sidebarCollapsed && session?.user?.isTrialing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2.5"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3 h-3 text-indigo-400" />
              <span className="text-indigo-300 text-xs font-semibold">Probă PRO activă</span>
            </div>
            <p className="text-zinc-500 text-[10px] leading-relaxed">
              Actualizează pentru a păstra accesul nelimitat.
            </p>
          </motion.div>
        )}

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full flex items-center gap-2.5 px-2 py-2 h-auto hover:bg-zinc-900 rounded-lg text-left"
            >
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarImage src={session?.user?.image ?? ""} />
                <AvatarFallback className="bg-indigo-600 text-white text-xs">
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
                    <p className="text-xs font-medium text-zinc-200 truncate">
                      {session?.user?.name ?? "Trader"}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate">
                      {session?.user?.email}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              {!sidebarCollapsed && (
                <ChevronDown className="w-3 h-3 text-zinc-600 shrink-0" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            className="w-52 bg-zinc-900 border-zinc-800"
          >
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-full h-7 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900 rounded-lg"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
    </motion.aside>
  );
}
