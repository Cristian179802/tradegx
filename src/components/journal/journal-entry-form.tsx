"use client";

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
import { CheckSquare, Square } from "lucide-react";

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

const EMOTIONAL_STATES = [
  { value: "CALM", label: "Calm" },
  { value: "CONFIDENT", label: "Încrezător" },
  { value: "ANXIOUS", label: "Anxios" },
  { value: "FEARFUL", label: "Fricos" },
  { value: "GREEDY", label: "Lacom" },
  { value: "REVENGE", label: "Revenge trade" },
  { value: "FOMO", label: "FOMO" },
  { value: "NEUTRAL", label: "Neutru" },
] as const;

const MISTAKE_TYPES = [
  { value: "OVERTRADING", label: "Overtrading" },
  { value: "REVENGE_TRADE", label: "Revenge trade" },
  { value: "FOMO_ENTRY", label: "FOMO entry" },
  { value: "MOVED_SL", label: "Stop loss mutat" },
  { value: "NO_SL", label: "Fără stop loss" },
  { value: "WRONG_SIZE", label: "Volum greșit" },
  { value: "EARLY_EXIT", label: "Ieșire prematură" },
  { value: "LATE_ENTRY", label: "Intrare târzie" },
  { value: "IGNORED_RULES", label: "Reguli ignorate" },
  { value: "OTHER", label: "Altul" },
] as const;

export function JournalEntryForm({ tradeId, existing, onSave }: JournalEntryFormProps) {
  const { toast } = useToast();

  const form = useForm<JournalEntryInput>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      preEmotionalState: (existing?.preEmotionalState as JournalEntryInput["preEmotionalState"]) ?? null,
      preNotes: existing?.preNotes ?? "",
      preConfidence: existing?.preConfidence ?? null,
      postEmotionalState: (existing?.postEmotionalState as JournalEntryInput["postEmotionalState"]) ?? null,
      postNotes: existing?.postNotes ?? "",
      postMistakeTypes: (existing?.postMistakeTypes ?? []) as JournalEntryInput["postMistakeTypes"],
      postLessons: existing?.postLessons ?? "",
    },
  });

  const { watch, setValue, formState: { isSubmitting } } = form;
  const selectedMistakes = watch("postMistakeTypes");
  const confidence = watch("preConfidence");

  async function onSubmit(data: JournalEntryInput) {
    const res = await fetch(`/api/trades/${tradeId}/journal`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      toast({ title: "Eroare", description: "Nu s-a putut salva", variant: "destructive" });
      return;
    }

    toast({ title: "Jurnal salvat", description: "Notițele au fost actualizate." });
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Pre-trade */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center">1</span>
            Înainte de trade
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="preEmotionalState"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Stare emoțională</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                        <SelectValue placeholder="Cum te simțeai?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {EMOTIONAL_STATES.map((s) => (
                        <SelectItem key={s.value} value={s.value} className="text-zinc-100">
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preConfidence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">
                    Încredere: <span className="text-indigo-400">{confidence ?? "—"}/10</span>
                  </FormLabel>
                  <FormControl>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      className="w-full accent-indigo-500"
                      value={field.value ?? 5}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-zinc-600">
                    <span>1</span><span>5</span><span>10</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="preNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-400">Note pre-trade</FormLabel>
                <FormControl>
                  <textarea
                    rows={3}
                    placeholder="De ce ai intrat în acest trade? Ce setup ai văzut?"
                    className="w-full rounded-md bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Post-trade */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center">2</span>
            După trade
          </h3>

          <FormField
            control={form.control}
            name="postEmotionalState"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-400">Stare emoțională după</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value ?? undefined}
                >
                  <FormControl>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                      <SelectValue placeholder="Cum te-ai simțit după?" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {EMOTIONAL_STATES.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-zinc-100">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <label className="text-sm font-medium text-zinc-400 block mb-2">
              Greșeli comise
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MISTAKE_TYPES.map((m) => {
                const isChecked = (selectedMistakes ?? []).includes(m.value as never);
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => toggleMistake(m.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors border",
                      isChecked
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    )}
                  >
                    {isChecked ? (
                      <CheckSquare className="h-4 w-4 shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 shrink-0" />
                    )}
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <FormField
            control={form.control}
            name="postNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-400">Note post-trade</FormLabel>
                <FormControl>
                  <textarea
                    rows={3}
                    placeholder="Ce s-a întâmplat? Cum s-a mișcat piața?"
                    className="w-full rounded-md bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="postLessons"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-400">Lecții învățate</FormLabel>
                <FormControl>
                  <textarea
                    rows={2}
                    placeholder="Ce ai învățat din acest trade?"
                    className="w-full rounded-md bg-zinc-800 border border-zinc-700 text-zinc-100 px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {isSubmitting ? "Se salvează..." : "Salvează jurnal"}
        </Button>
      </form>
    </Form>
  );
}
