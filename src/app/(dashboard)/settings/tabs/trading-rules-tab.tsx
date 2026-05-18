"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { tradingRulesSchema, type TradingRulesInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

const DAYS = [
  { value: 1, label: "Lu" },
  { value: 2, label: "Ma" },
  { value: 3, label: "Mi" },
  { value: 4, label: "Jo" },
  { value: 5, label: "Vi" },
  { value: 6, label: "Sâ" },
  { value: 0, label: "Du" },
];

interface TradingRulesTabProps {
  initialMaxDailyLossPct?: number;
  initialMaxDrawdownPct?: number;
  initialMaxTradesPerDay?: number;
  initialDefaultRiskPct?: number;
  initialNoTradeDays?: number[];
}

export function TradingRulesTab({
  initialMaxDailyLossPct = 5,
  initialMaxDrawdownPct = 10,
  initialMaxTradesPerDay = 5,
  initialDefaultRiskPct = 1,
  initialNoTradeDays = [5, 0],
}: TradingRulesTabProps) {
  const { toast } = useToast();

  const form = useForm<TradingRulesInput>({
    resolver: zodResolver(tradingRulesSchema),
    defaultValues: {
      maxDailyLossPct: initialMaxDailyLossPct,
      maxDrawdownPct: initialMaxDrawdownPct,
      maxTradesPerDay: initialMaxTradesPerDay,
      defaultRiskPct: initialDefaultRiskPct,
      noTradeDays: initialNoTradeDays,
      noTradeHoursStart: null,
      noTradeHoursEnd: null,
    },
  });

  const isLoading = form.formState.isSubmitting;
  const noTradeDays = form.watch("noTradeDays");

  function toggleDay(day: number) {
    const current = form.getValues("noTradeDays");
    if (current.includes(day)) {
      form.setValue("noTradeDays", current.filter((d) => d !== day));
    } else {
      form.setValue("noTradeDays", [...current, day]);
    }
  }

  async function onSubmit(data: TradingRulesInput) {
    const res = await fetch("/api/user/trading-rules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      toast({ title: "Eroare", description: "Nu s-a putut salva.", variant: "destructive" });
      return;
    }

    toast({ title: "Salvat", description: "Regulile de trading au fost actualizate." });
  }

  return (
    <div className="space-y-4">
      <Card className="bg-zinc-900/80 border-zinc-800/80 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-base">Limite de risc</CardTitle>
          <CardDescription className="text-zinc-500">
            Configurează limitele pentru prop firm și protecția contului.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="defaultRiskPct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Risc implicit (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="10"
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          className="bg-zinc-900 border-zinc-700 text-white focus:border-indigo-500 num"
                        />
                      </FormControl>
                      <FormDescription className="text-zinc-600 text-xs">
                        Riscul implicit per tranzacție
                      </FormDescription>
                      <FormMessage className="text-rose-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxTradesPerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Max. tranzacții/zi</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          max="50"
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          className="bg-zinc-900 border-zinc-700 text-white focus:border-indigo-500 num"
                        />
                      </FormControl>
                      <FormMessage className="text-rose-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxDailyLossPct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Pierdere zilnică maximă (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="100"
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          className="bg-zinc-900 border-zinc-700 text-white focus:border-indigo-500 num"
                        />
                      </FormControl>
                      <FormDescription className="text-zinc-600 text-xs">
                        Ex: 5% pentru regulile FTMO
                      </FormDescription>
                      <FormMessage className="text-rose-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxDrawdownPct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Drawdown maxim (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="100"
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          className="bg-zinc-900 border-zinc-700 text-white focus:border-indigo-500 num"
                        />
                      </FormControl>
                      <FormDescription className="text-zinc-600 text-xs">
                        Ex: 10% pentru regulile FTMO
                      </FormDescription>
                      <FormMessage className="text-rose-400" />
                    </FormItem>
                  )}
                />
              </div>

              {/* No-trade days */}
              <div className="space-y-2">
                <label className="text-sm text-zinc-300 font-medium">
                  Zile fără tranzacții
                </label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map((day) => {
                    const isBlocked = noTradeDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={cn(
                          "w-10 h-10 rounded-lg text-sm font-medium transition-all border",
                          isBlocked
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                            : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                        )}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-zinc-600 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Zilele marcate cu roșu declanșează alerte dacă încerci să tranzacționezi.
                </p>
              </div>

              {/* No-trade hours */}
              <div className="space-y-2">
                <label className="text-sm text-zinc-300 font-medium">
                  Ore fără tranzacții
                </label>
                <div className="flex items-center gap-3">
                  <FormField
                    control={form.control}
                    name="noTradeHoursStart"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            type="time"
                            placeholder="00:00"
                            className="bg-zinc-900 border-zinc-700 text-white focus:border-indigo-500 num"
                          />
                        </FormControl>
                        <FormMessage className="text-rose-400" />
                      </FormItem>
                    )}
                  />
                  <span className="text-zinc-500 text-sm shrink-0">până la</span>
                  <FormField
                    control={form.control}
                    name="noTradeHoursEnd"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            type="time"
                            placeholder="13:00"
                            className="bg-zinc-900 border-zinc-700 text-white focus:border-indigo-500 num"
                          />
                        </FormControl>
                        <FormMessage className="text-rose-400" />
                      </FormItem>
                    )}
                  />
                </div>
                <p className="text-xs text-zinc-600">
                  Fus orar: Europe/Bucharest (ora locală)
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvează regulile
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
