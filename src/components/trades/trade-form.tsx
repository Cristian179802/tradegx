"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tradeSchema, TradeInput } from "@/lib/validations";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  name: string;
  currency: string;
  balance: string | number;
}

interface InitialTrade {
  id: string;
  accountId: string;
  symbol: string;
  instrumentType: string;
  direction: string;
  entryPrice: string | number;
  entryTime: string;
  exitPrice?: string | number | null;
  exitTime?: string | null;
  lotSize: string | number;
  stopLoss?: string | number | null;
  takeProfit?: string | number | null;
  pnlMoney?: string | number | null;
  commission?: string | number | null;
  swap?: string | number | null;
  setupType?: string | null;
  killzone?: string | null;
  timeframe?: string | null;
  status: string;
  tags: string[];
}

interface TradeFormProps {
  accounts: Account[];
  defaultAccountId?: string;
  initialTrade?: InitialTrade;
}

const INSTRUMENT_TYPES = [
  { value: "FOREX", label: "Forex" },
  { value: "CRYPTO", label: "Crypto" },
  { value: "METALS", label: "Metale" },
  { value: "INDICES", label: "Indici" },
  { value: "COMMODITIES", label: "Mărfuri" },
  { value: "STOCKS", label: "Acțiuni" },
  { value: "CFD", label: "CFD" },
] as const;

const SETUP_TYPES = [
  { value: "ORDER_BLOCK", label: "Order Block" },
  { value: "FAIR_VALUE_GAP", label: "Fair Value Gap" },
  { value: "LIQUIDITY_SWEEP", label: "Liquidity Sweep" },
  { value: "BOS", label: "BOS" },
  { value: "CHOCH", label: "CHoCH" },
  { value: "BREAKER", label: "Breaker Block" },
  { value: "MITIGATION", label: "Mitigation" },
  { value: "REJECTION", label: "Rejection" },
  { value: "TREND_FOLLOW", label: "Trend Follow" },
  { value: "SCALP", label: "Scalp" },
  { value: "OTHER", label: "Altul" },
] as const;

const KILLZONES = [
  { value: "ASIAN", label: "Asian (00:00-08:00)" },
  { value: "LONDON", label: "London (08:00-12:00)" },
  { value: "NEW_YORK", label: "New York (13:00-17:00)" },
  { value: "LONDON_CLOSE", label: "London Close (16:00-17:00)" },
] as const;

const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN1"] as const;

function toLocalDateTimeString(date: Date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TradeForm({ accounts, defaultAccountId, initialTrade }: TradeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!initialTrade;
  const [isOpen, setIsOpen] = React.useState(false);

  const form = useForm<TradeInput>({
    resolver: zodResolver(tradeSchema),
    defaultValues: initialTrade
      ? {
          accountId: initialTrade.accountId,
          symbol: initialTrade.symbol,
          instrumentType: initialTrade.instrumentType as TradeInput["instrumentType"],
          direction: initialTrade.direction as TradeInput["direction"],
          entryPrice: Number(initialTrade.entryPrice),
          entryTime: toLocalDateTimeString(new Date(initialTrade.entryTime)),
          exitPrice: initialTrade.exitPrice != null ? Number(initialTrade.exitPrice) : undefined,
          exitTime: initialTrade.exitTime ? toLocalDateTimeString(new Date(initialTrade.exitTime)) : undefined,
          lotSize: Number(initialTrade.lotSize),
          stopLoss: initialTrade.stopLoss != null ? Number(initialTrade.stopLoss) : undefined,
          takeProfit: initialTrade.takeProfit != null ? Number(initialTrade.takeProfit) : undefined,
          pnlMoney: initialTrade.pnlMoney != null ? Number(initialTrade.pnlMoney) : undefined,
          commission: initialTrade.commission != null ? Number(initialTrade.commission) : 0,
          swap: initialTrade.swap != null ? Number(initialTrade.swap) : 0,
          setupType: initialTrade.setupType as TradeInput["setupType"] ?? undefined,
          killzone: initialTrade.killzone as TradeInput["killzone"] ?? undefined,
          timeframe: (initialTrade.timeframe ?? "H1") as TradeInput["timeframe"],
          status: initialTrade.status as TradeInput["status"],
          tags: initialTrade.tags,
          notes: "",
        }
      : {
          accountId: defaultAccountId ?? accounts[0]?.id ?? "",
          symbol: "",
          instrumentType: "FOREX",
          direction: "BUY",
          entryPrice: undefined as unknown as number,
          entryTime: toLocalDateTimeString(),
          exitPrice: undefined,
          exitTime: undefined,
          lotSize: undefined as unknown as number,
          stopLoss: undefined,
          takeProfit: undefined,
          pnlMoney: undefined,
          commission: 0,
          swap: 0,
          setupType: undefined,
          killzone: undefined,
          timeframe: "H1",
          status: "CLOSED",
          tags: [],
          notes: "",
        },
  });

  const { watch, formState: { isSubmitting } } = form;
  const direction = watch("direction");
  const status = watch("status");

  async function onSubmit(data: TradeInput) {
    const payload = {
      ...data,
      entryTime: new Date(data.entryTime).toISOString(),
      exitTime: data.exitTime ? new Date(data.exitTime).toISOString() : null,
    };

    const res = isEdit
      ? await fetch(`/api/trades/${initialTrade!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/trades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({
        title: "Eroare",
        description: err.error ?? "A apărut o eroare",
        variant: "destructive",
      });
      return;
    }

    const trade = await res.json();
    toast({
      title: isEdit ? "Trade actualizat" : "Trade salvat",
      description: `${data.symbol} ${data.direction} ${isEdit ? "actualizat" : "adăugat"}.`,
    });
    router.push(`/trades/${trade.id}`);
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section: Cont & Instrument */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
          <h3 className="text-sm font-medium text-zinc-300">Cont și instrument</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Cont de trading</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                        <SelectValue placeholder="Selectează contul" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id} className="text-zinc-100">
                          {a.name}
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
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Symbol</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: EURUSD, XAUUSD"
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 uppercase"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instrumentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Tip instrument</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {INSTRUMENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="text-zinc-100">
                          {t.label}
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Status</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      setIsOpen(v === "OPEN");
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="CLOSED" className="text-zinc-100">Închis</SelectItem>
                      <SelectItem value="OPEN" className="text-zinc-100">Deschis</SelectItem>
                      <SelectItem value="CANCELLED" className="text-zinc-100">Anulat</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Direction toggle */}
          <FormField
            control={form.control}
            name="direction"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-400">Direcție</FormLabel>
                <div className="flex gap-2">
                  {(["BUY", "SELL"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => field.onChange(d)}
                      className={cn(
                        "flex-1 rounded-md py-2 text-sm font-semibold transition-colors border",
                        direction === d && d === "BUY"
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : direction === d && d === "SELL"
                          ? "bg-rose-500/20 border-rose-500 text-rose-400"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      )}
                    >
                      {d === "BUY" ? "BUY ▲" : "SELL ▼"}
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Section: Preturi & timing */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
          <h3 className="text-sm font-medium text-zinc-300">Prețuri și timing</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="entryPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Preț intrare</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder="1.08500"
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 num"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="entryTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Data/Ora intrare</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      className="bg-zinc-800 border-zinc-700 text-zinc-100"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isOpen && (
              <>
                <FormField
                  control={form.control}
                  name="exitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400">Preț ieșire</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="1.09000"
                          className="bg-zinc-800 border-zinc-700 text-zinc-100 num"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : null
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exitTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400">Data/Ora ieșire</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          className="bg-zinc-800 border-zinc-700 text-zinc-100"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
        </div>

        {/* Section: Risc & Lot */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
          <h3 className="text-sm font-medium text-zinc-300">Management risc</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="lotSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Volum (loturi)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.10"
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 num"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stopLoss"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Stop Loss</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Opțional"
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 num"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="takeProfit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Take Profit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Opțional"
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 num"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isOpen && (
              <FormField
                control={form.control}
                name="pnlMoney"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-400">P&L ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 125.50"
                        className="bg-zinc-800 border-zinc-700 text-zinc-100 num"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="commission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Comision ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 num"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="swap"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Swap ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 num"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Section: Setup & Journal */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
          <h3 className="text-sm font-medium text-zinc-300">Setup și jurnal</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="setupType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Tip setup</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                        <SelectValue placeholder="Selectează" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {SETUP_TYPES.map((s) => (
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
              name="killzone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Killzone</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                        <SelectValue placeholder="Selectează" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {KILLZONES.map((k) => (
                        <SelectItem key={k.value} value={k.value} className="text-zinc-100">
                          {k.label}
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
              name="timeframe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Timeframe</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                        <SelectValue placeholder="Selectează" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {TIMEFRAMES.map((tf) => (
                        <SelectItem key={tf} value={tf} className="text-zinc-100">
                          {tf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-400">Note pre-trade</FormLabel>
                <FormControl>
                  <textarea
                    rows={3}
                    placeholder="Descrie setup-ul, motivul intrării..."
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

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="border-zinc-700 text-zinc-300"
          >
            Anulează
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSubmitting ? "Se salvează..." : isEdit ? "Actualizează trade" : "Salvează trade"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
