"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { journalEntrySchema, JournalEntryInput } from "@/lib/validations";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  CheckSquare, Square, Brain, BookOpen, Loader2,
  SmilePlus, AlertTriangle, Lightbulb, Save,
} from "lucide-react";
import { useMemo } from "react";

interface JournalEntry {
  preEmotionalState?: string | null;
  preNotes?: string | null;
  preConfidence?: number | null;
  postEmotionalState?: string | null;
  postNotes?: string | null;
  postMistakeTypes?: string[];
  postLessons?: string | null;
}

interface JournalEntryFormProps {
  tradeId: string;
  existing?: JournalEntry | null;
  onSave?: () => void;
}

// label = cheie → journal.* (tradusă la randare)
const EMOTIONAL_STATES = [
  { value: "CALM",       label: "esCalm",      emoji: "😌", color: "emerald" },
  { value: "CONFIDENT",  label: "esConfident", emoji: "💪", color: "indigo"  },
  { value: "ANXIOUS",    label: "esAnxious",   emoji: "😰", color: "amber"   },
  { value: "FEARFUL",    label: "esFearful",   emoji: "😨", color: "amber"   },
  { value: "GREEDY",     label: "esGreedy",    emoji: "🤑", color: "rose"    },
  { value: "REVENGE",    label: "esRevenge",   emoji: "😤", color: "rose"    },
  { value: "FOMO",       label: "esFomo",      emoji: "🔥", color: "rose"    },
  { value: "NEUTRAL",    label: "esNeutral",   emoji: "😐", color: "zinc"    },
] as const;

const MISTAKE_TYPES = [
  { value: "OVERTRADING",   label: "mkOvertrading",  icon: "⚡" },
  { value: "REVENGE_TRADE", label: "mkRevenge",      icon: "😤" },
  { value: "FOMO_ENTRY",    label: "mkFomo",         icon: "🔥" },
  { value: "MOVED_SL",      label: "mkMovedSl",      icon: "🚫" },
  { value: "NO_SL",         label: "mkNoSl",         icon: "⚠️" },
  { value: "WRONG_SIZE",    label: "mkWrongSize",    icon: "📏" },
  { value: "EARLY_EXIT",    label: "mkEarlyExit",    icon: "🏃" },
  { value: "LATE_ENTRY",    label: "mkLateEntry",    icon: "🐢" },
  { value: "IGNORED_RULES", label: "mkIgnoredRules", icon: "🙈" },
  { value: "OTHER",         label: "mkOther",        icon: "📌" },
] as const;

function ConfidenceBar({ value }: { value: number | null }) {
  const t = useTranslations("journal");
  const score = value ?? 0;
  const color = score >= 8 ? "emerald" : score >= 5 ? "indigo" : score >= 3 ? "amber" : "rose";
  const label = score >= 8 ? t("confVeryHigh") : score >= 5 ? t("confModerate") : score >= 3 ? t("confLow") : t("confUncertain");

  return (
    <div className="flex items-center gap-1.5 mt-1">
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className={cn(
            "flex-1 h-1.5 rounded-full transition-all duration-300",
            i < score
              ? color === "emerald" ? "bg-emerald-500"
              : color === "indigo"  ? "bg-indigo-500"
              : color === "amber"   ? "bg-amber-500"
              : "bg-rose-500"
              : "bg-zinc-800"
          )}
        />
      ))}
      <span className={cn(
        "text-xs font-medium ml-1 shrink-0",
        color === "emerald" ? "text-emerald-400"
        : color === "indigo"  ? "text-indigo-400"
        : color === "amber"   ? "text-amber-400"
        : "text-rose-400"
      )}>{label}</span>
    </div>
  );
}

export function JournalEntryForm({ tradeId, existing, onSave }: JournalEntryFormProps) {
  const t = useTranslations("journal");
  const { toast } = useToast();

  const form = useForm<JournalEntryInput>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      preEmotionalState:  (existing?.preEmotionalState  as JournalEntryInput["preEmotionalState"]) ?? null,
      preNotes:           existing?.preNotes            ?? "",
      preConfidence:      existing?.preConfidence       ?? null,
      postEmotionalState: (existing?.postEmotionalState as JournalEntryInput["postEmotionalState"]) ?? null,
      postNotes:          existing?.postNotes           ?? "",
      postMistakeTypes:   (existing?.postMistakeTypes   ?? []) as JournalEntryInput["postMistakeTypes"],
      postLessons:        existing?.postLessons         ?? "",
    },
  });

  const { watch, setValue, formState: { isSubmitting } } = form;
  const selectedMistakes = watch("postMistakeTypes");
  const confidence       = watch("preConfidence");
  const mistakeCount     = useMemo(() => (selectedMistakes ?? []).length, [selectedMistakes]);

  async function onSubmit(data: JournalEntryInput) {
    const res = await fetch(`/api/trades/${tradeId}/journal`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      toast({ title: t("errTitle"), description: t("errDesc"), variant: "destructive" });
      return;
    }

    toast({ title: t("savedTitle"), description: t("savedDesc") });
    onSave?.();
  }

  function toggleMistake(value: string) {
    const current = selectedMistakes ?? [];
    const next = current.includes(value as never)
      ? current.filter((m) => m !== value)
      : [...current, value as never];
    setValue("postMistakeTypes", next);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Step 1: Pre-trade ─────────────────────────────────────────── */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">{t("step1")}</p>
              <h3 className="text-sm font-bold text-zinc-200">{t("beforeTrade")}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Emotional state pre */}
            <FormField
              control={form.control}
              name="preEmotionalState"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                    {t("emotionalState")}
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                    <FormControl>
                      <SelectTrigger className="bg-zinc-800/60 border-zinc-700/80 text-zinc-100 rounded-xl focus:ring-indigo-500/50">
                        <SelectValue placeholder={t("emotionalPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-900 border-zinc-800 rounded-xl">
                      {EMOTIONAL_STATES.map((s) => (
                        <SelectItem key={s.value} value={s.value} className="text-zinc-100 rounded-lg">
                          <span className="flex items-center gap-2">
                            <span>{s.emoji}</span>
                            <span>{t(s.label)}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confidence slider */}
            <FormField
              control={form.control}
              name="preConfidence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                    {t("confidence")}{" "}
                    <span className={cn(
                      "font-black",
                      (confidence ?? 0) >= 8 ? "text-emerald-400"
                      : (confidence ?? 0) >= 5 ? "text-indigo-400"
                      : (confidence ?? 0) >= 3 ? "text-amber-400"
                      : "text-rose-400"
                    )}>
                      {confidence ?? "—"}/10
                    </span>
                  </FormLabel>
                  <FormControl>
                    <input
                      type="range"
                      min={1} max={10} step={1}
                      className="w-full accent-indigo-500 mt-1"
                      value={field.value ?? 5}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <ConfidenceBar value={confidence ?? null} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Pre-trade notes */}
          <FormField
            control={form.control}
            name="preNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  {t("preNotes")}
                </FormLabel>
                <FormControl>
                  <textarea
                    rows={3}
                    placeholder={t("preNotesPlaceholder")}
                    className="w-full rounded-xl bg-zinc-800/60 border border-zinc-700/80 text-zinc-100 px-3.5 py-2.5 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-none transition-all"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ── Step 2: Post-trade ────────────────────────────────────────── */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">{t("step2")}</p>
              <h3 className="text-sm font-bold text-zinc-200">{t("afterTrade")}</h3>
            </div>
          </div>

          {/* Emotional state post */}
          <FormField
            control={form.control}
            name="postEmotionalState"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  {t("emotionalStateAfter")}
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                  <FormControl>
                    <SelectTrigger className="bg-zinc-800/60 border-zinc-700/80 text-zinc-100 rounded-xl focus:ring-emerald-500/50">
                      <SelectValue placeholder={t("emotionalAfterPlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-zinc-900 border-zinc-800 rounded-xl">
                    {EMOTIONAL_STATES.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-zinc-100 rounded-lg">
                        <span className="flex items-center gap-2">
                          <span>{s.emoji}</span>
                          <span>{s.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Mistake types */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                {t("mistakes")}
              </label>
              {mistakeCount > 0 && (
                <span className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full px-2 py-0.5">
                  {t("selected", { n: mistakeCount })}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MISTAKE_TYPES.map((m) => {
                const isChecked = (selectedMistakes ?? []).includes(m.value as never);
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => toggleMistake(m.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-left transition-all duration-200 border",
                      isChecked
                        ? "bg-rose-500/12 border-rose-500/35 text-rose-300 shadow-sm shadow-rose-500/10"
                        : "bg-zinc-800/50 border-zinc-700/60 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/80"
                    )}
                  >
                    <span className="text-base leading-none">{m.icon}</span>
                    {isChecked ? (
                      <CheckSquare className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                    ) : (
                      <Square className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                    )}
                    <span className="text-xs">{t(m.label)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Post-trade notes */}
          <FormField
            control={form.control}
            name="postNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  {t("postNotes")}
                </FormLabel>
                <FormControl>
                  <textarea
                    rows={3}
                    placeholder={t("postNotesPlaceholder")}
                    className="w-full rounded-xl bg-zinc-800/60 border border-zinc-700/80 text-zinc-100 px-3.5 py-2.5 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none transition-all"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Lessons learned */}
          <FormField
            control={form.control}
            name="postLessons"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  {t("lessons")}
                </FormLabel>
                <FormControl>
                  <textarea
                    rows={2}
                    placeholder={t("lessonsPlaceholder")}
                    className="w-full rounded-xl bg-zinc-800/60 border border-zinc-700/80 text-zinc-100 px-3.5 py-2.5 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 resize-none transition-all"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ── Save button ───────────────────────────────────────────────── */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="relative w-full overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-lg shadow-indigo-500/25 rounded-xl h-10 group transition-all duration-300"
        >
          <span className="absolute inset-0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] bg-white/10 transition-transform duration-700" />
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("saving")}</>
          ) : (
            <><Save className="w-4 h-4 mr-2" />{t("saveBtn")}</>
          )}
        </Button>
      </form>
    </Form>
  );
}
