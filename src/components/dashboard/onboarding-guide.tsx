"use client";

import * as React from "react";
import Link from "next/link";
import {
  Rocket, X, CheckCircle2, Circle, Briefcase, Target, Trophy, ListChecks, ArrowRight, GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  href: string;
  done?: boolean;
}

export function OnboardingGuide({ hasTrades }: { hasTrades: boolean }) {
  const [hidden, setHidden] = React.useState(true);

  React.useEffect(() => {
    // Ascuns dacă utilizatorul l-a închis explicit
    setHidden(localStorage.getItem("onboarding-dismissed") === "1");
  }, []);

  function dismiss() {
    localStorage.setItem("onboarding-dismissed", "1");
    setHidden(true);
  }

  if (hidden) return null;

  const steps: Step[] = [
    { icon: Briefcase, title: "Adaugă primul cont de trading", desc: "Conectează MT4/MT5 cu EA-ul gratuit sau adaugă un cont manual.", href: "/accounts", done: hasTrades },
    { icon: ListChecks, title: "Înregistrează / importă tranzacții", desc: "Sincronizare automată din MT4/MT5 sau adaugă manual prima tranzacție.", href: "/trades", done: hasTrades },
    { icon: Target, title: "Vezi semnalele AI ale zilei", desc: "Maxim 3 setup-uri de înaltă probabilitate, cu Entry/SL/TP și analiză.", href: "/signals" },
    { icon: Trophy, title: "Setează-ți obiectivele lunare", desc: "Țintă de profit, tranzacții și win rate — urmărite automat.", href: "/goals" },
    { icon: ListChecks, title: "Folosește checklist-ul pre-trade", desc: "Verifică disciplina înainte de fiecare intrare în piață.", href: "/checklist" },
  ];

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div
      className="relative rounded-2xl border border-indigo-500/25 overflow-hidden animate-fade-in-up"
      style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.06) 45%, rgba(24,24,28,0.85) 100%)" }}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/25 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base font-black text-zinc-100 flex items-center gap-2">
                Bun venit la TradeGx! <Rocket className="w-4 h-4 text-indigo-400" />
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {doneCount > 0
                  ? `Ai parcurs ${doneCount} din ${steps.length} pași — continuă să-ți configurezi jurnalul.`
                  : "5 pași simpli ca să profiți la maxim de platformă."}
              </p>
            </div>
          </div>
          <button onClick={dismiss} className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors" title="Ascunde ghidul">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {steps.map((s, i) => (
            <Link
              key={i}
              href={s.href}
              className={cn(
                "group flex items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-all",
                s.done
                  ? "border-emerald-500/25 bg-emerald-500/[0.04]"
                  : "border-zinc-800/70 bg-zinc-900/40 hover:border-indigo-500/40 hover:bg-zinc-800/40"
              )}
            >
              <div className="shrink-0 mt-0.5">
                {s.done
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  : <Circle className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("text-xs font-semibold leading-tight", s.done ? "text-zinc-400 line-through" : "text-zinc-200")}>
                  {i + 1}. {s.title}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{s.desc}</p>
              </div>
              {!s.done && <ArrowRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-indigo-400 shrink-0 mt-0.5 transition-colors" />}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
