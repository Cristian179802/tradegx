"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Target, BookOpen, NotebookPen, ListChecks, Trophy,
  Calculator, Shield, Award, TrendingUp, BarChart3, FlaskConical, Brain,
  BellRing, GraduationCap, Crosshair, Dices, LineChart, Globe, Gauge,
  CalendarDays, Newspaper, Users, Settings, Plus, Search, CornerDownLeft,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Command Palette (Ctrl+K / Cmd+K) ────────────────────────────────────────
// Navigare instant + acțiuni rapide, cu căutare fără diacritice.

interface Cmd {
  label: string;
  hint?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string;
}

const COMMANDS: Cmd[] = [
  { label: "Adaugă tranzacție", hint: "acțiune", href: "/trades/new", icon: Plus, keywords: "trade nou add new" },
  { label: "Panou de Control", href: "/dashboard", icon: LayoutDashboard, keywords: "dashboard acasa home" },
  { label: "Semnale AI", href: "/signals", icon: Target, keywords: "hps signals" },
  { label: "Tranzacții", href: "/trades", icon: BookOpen, keywords: "trades istoric" },
  { label: "Jurnal", href: "/journal", icon: NotebookPen, keywords: "journal note emotii" },
  { label: "Checklist Pre-Trade", href: "/checklist", icon: ListChecks, keywords: "disciplina" },
  { label: "Obiective", href: "/goals", icon: Trophy, keywords: "goals target prop" },
  { label: "Calculator Lot", href: "/calculator", icon: Calculator, keywords: "lot size risc" },
  { label: "Risk Manager", href: "/risk-manager", icon: Shield, keywords: "risc" },
  { label: "Prop Firm", href: "/prop-firm", icon: Award, keywords: "ftmo challenge funded" },
  { label: "Conturi", href: "/accounts", icon: TrendingUp, keywords: "accounts broker sync mt4 mt5" },
  { label: "Analiză", href: "/analytics", icon: BarChart3, keywords: "analytics statistici metrici" },
  { label: "Edge Finder", href: "/edge", icon: Crosshair, keywords: "edge leak statistici tipare" },
  { label: "Monte Carlo", href: "/monte-carlo", icon: Dices, keywords: "simulare risc ruina challenge" },
  { label: "Backtesting", href: "/backtesting", icon: FlaskConical, keywords: "strategie test istoric" },
  { label: "AI Assistant", href: "/ai-assistant", icon: Brain, keywords: "coach chat" },
  { label: "Alerte AI", href: "/alerts", icon: BellRing, keywords: "alerts notificari" },
  { label: "Academie", href: "/academy", icon: GraduationCap, keywords: "curs invatare lectii academy" },
  { label: "Grafice Live", href: "/charts", icon: LineChart, keywords: "chart pret" },
  { label: "Selector Piață", href: "/market", icon: Globe, keywords: "market piete" },
  { label: "Unelte Pro", href: "/tools", icon: Gauge, keywords: "tools" },
  { label: "Calendar Economic", href: "/calendar", icon: CalendarDays, keywords: "stiri nfp cpi fomc" },
  { label: "Știri de Piață", href: "/news", icon: Newspaper, keywords: "news" },
  { label: "Comunitate", href: "/community", icon: Users, keywords: "community echipe" },
  { label: "Setări", href: "/settings", icon: Settings, keywords: "settings profil telegram notificari" },
  { label: "Abonament", href: "/billing", icon: CreditCard, keywords: "billing facturare plata pro upgrade abonament stripe" },
];

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Ctrl+K / Cmd+K deschide; Escape închide
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery("");
        setActive(0);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 20);
  }, [open]);

  const q = norm(query.trim());
  const results = q
    ? COMMANDS.filter((c) => norm(`${c.label} ${c.keywords ?? ""}`).includes(q))
    : COMMANDS;

  const go = (cmd: Cmd) => {
    setOpen(false);
    router.push(cmd.href);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[14vh] px-4"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg rounded-2xl border border-zinc-700/60 bg-zinc-900/95 shadow-2xl shadow-indigo-500/10 overflow-hidden"
        style={{ backdropFilter: "blur(24px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Linie neon sus */}
        <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKey}
            placeholder="Caută pagini și acțiuni..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none"
          />
          <kbd className="text-[9px] font-bold text-zinc-600 border border-zinc-700 rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        {/* Rezultate */}
        <div className="max-h-[320px] overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <p className="py-8 text-center text-xs text-zinc-600">Niciun rezultat.</p>
          ) : (
            results.map((cmd, i) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.href + cmd.label}
                  onClick={() => go(cmd)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                    i === active ? "bg-indigo-500/15" : "hover:bg-zinc-800/40"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border",
                      i === active
                        ? "bg-indigo-500/20 border-indigo-500/40"
                        : "bg-zinc-800/60 border-zinc-700/40"
                    )}
                  >
                    <Icon className={cn("w-3.5 h-3.5", i === active ? "text-indigo-300" : "text-zinc-500")} />
                  </div>
                  <span
                    className={cn(
                      "flex-1 text-sm font-medium",
                      i === active ? "text-zinc-100" : "text-zinc-400"
                    )}
                  >
                    {cmd.label}
                  </span>
                  {cmd.hint && (
                    <span className="text-[9px] font-bold uppercase text-indigo-400/70 border border-indigo-500/25 rounded px-1.5 py-0.5">
                      {cmd.hint}
                    </span>
                  )}
                  {i === active && <CornerDownLeft className="w-3.5 h-3.5 text-zinc-600" />}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-zinc-800 text-[9px] text-zinc-600 font-semibold">
          <span>↑↓ navighează</span>
          <span>↵ deschide</span>
          <span className="ml-auto">TradeGx</span>
        </div>
      </div>
    </div>
  );
}
