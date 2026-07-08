"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { CheckSquare, Square, Plus, X, RotateCcw, ShieldCheck, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  text: string;
  checked: boolean;
}

const STORAGE_KEY = "tradegx-pretrade-checklist";
const todayKey = () => new Date().toISOString().slice(0, 10);

function loadItems(defaults: string[]): Item[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { date: string; items: Item[] };
      // Resetează bifările dacă e o zi nouă (păstrează itemele custom)
      if (parsed.date !== todayKey()) {
        return parsed.items.map((it) => ({ ...it, checked: false }));
      }
      return parsed.items;
    }
  } catch { /* ignoră */ }
  return defaults.map((text, i) => ({ id: `d${i}`, text, checked: false }));
}

export default function ChecklistPage() {
  const t = useTranslations("checklistPage");
  const DEFAULT_ITEMS = t.raw("items") as string[];
  const [items, setItems] = React.useState<Item[]>([]);
  const [newText, setNewText] = React.useState("");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setItems(loadItems(DEFAULT_ITEMS));
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey(), items }));
  }, [items, mounted]);

  const toggle = (id: string) => setItems((p) => p.map((it) => it.id === id ? { ...it, checked: !it.checked } : it));
  const remove = (id: string) => setItems((p) => p.filter((it) => it.id !== id));
  const add = () => {
    if (!newText.trim()) return;
    setItems((p) => [...p, { id: `c${Date.now()}`, text: newText.trim(), checked: false }]);
    setNewText("");
  };
  const resetChecks = () => setItems((p) => p.map((it) => ({ ...it, checked: false })));
  const restoreDefaults = () => setItems(DEFAULT_ITEMS.map((text, i) => ({ id: `d${i}`, text, checked: false })));

  const checkedCount = items.filter((it) => it.checked).length;
  const total = items.length;
  const allChecked = total > 0 && checkedCount === total;
  const pct = total > 0 ? (checkedCount / total) * 100 : 0;

  return (
    <div className="space-y-6 pb-8 max-w-3xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
            <ListChecks className="w-4 h-4 text-sky-400" />
          </div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">{t("title")}</h1>
        </div>
        <p className="text-sm text-zinc-500">{t("subtitle")}</p>
      </div>

      {/* Progres */}
      <div className={cn(
        "rounded-2xl border p-5 transition-colors",
        allChecked ? "border-emerald-500/40 bg-emerald-500/[0.06]" : "border-zinc-800/70 bg-zinc-900/80"
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {allChecked
              ? <ShieldCheck className="w-5 h-5 text-emerald-400" />
              : <CheckSquare className="w-5 h-5 text-zinc-500" />}
            <span className={cn("text-sm font-bold", allChecked ? "text-emerald-300" : "text-zinc-300")}>
              {allChecked ? t("ready") : t("checkedOf", { checked: checkedCount, total })}
            </span>
          </div>
          <button onClick={resetChecks} className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> {t("reset")}
          </button>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: allChecked ? "linear-gradient(90deg,#059669,#34d399)" : "linear-gradient(90deg,#0284c7,#38bdf8)" }} />
        </div>
      </div>

      {/* Listă iteme */}
      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/80 divide-y divide-zinc-800/50">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-3 px-4 py-3 group">
            <button onClick={() => toggle(it.id)} className="shrink-0">
              {it.checked
                ? <CheckSquare className="w-5 h-5 text-emerald-400" />
                : <Square className="w-5 h-5 text-zinc-600 hover:text-zinc-400 transition-colors" />}
            </button>
            <span className={cn("flex-1 text-sm transition-colors", it.checked ? "text-zinc-500 line-through" : "text-zinc-200")}>
              {it.text}
            </span>
            <button onClick={() => remove(it.id)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-400 transition-all shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Adăugare item nou */}
        <div className="flex items-center gap-2 px-4 py-3">
          <Plus className="w-4 h-4 text-zinc-600 shrink-0" />
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") add(); }}
            placeholder={t("addPlaceholder")}
            className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none"
          />
          {newText.trim() && (
            <button onClick={add} className="text-xs font-semibold text-sky-400 hover:text-sky-300">{t("add")}</button>
          )}
        </div>
      </div>

      <button onClick={restoreDefaults} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
        {t("restoreDefaults")}
      </button>
    </div>
  );
}
