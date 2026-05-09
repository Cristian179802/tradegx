"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tradingAccountSchema, TradingAccountInput } from "@/lib/validations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useToast } from "@/components/ui/use-toast";

interface AccountDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  account?: {
    id: string;
    name: string;
    type: string;
    broker?: string | null;
    accountNumber?: string | null;
    currency: string;
    balance: string | number;
    leverage: number;
    maxDailyLossPct?: string | number | null;
    maxDrawdownPct?: string | number | null;
  } | null;
}

const CURRENCIES = ["USD", "EUR", "GBP", "RON", "CHF", "JPY"] as const;
const ACCOUNT_TYPES = [
  { value: "DEMO", label: "Demo" },
  { value: "CHALLENGE", label: "Challenge" },
  { value: "LIVE", label: "Live" },
] as const;

export function AccountDialog({
  open,
  onClose,
  onSuccess,
  account,
}: AccountDialogProps) {
  const { toast } = useToast();
  const isEdit = !!account;

  const form = useForm<TradingAccountInput>({
    resolver: zodResolver(tradingAccountSchema),
    defaultValues: {
      name: account?.name ?? "",
      type: (account?.type as TradingAccountInput["type"]) ?? "DEMO",
      broker: account?.broker ?? "",
      accountNumber: account?.accountNumber ?? "",
      currency: (account?.currency as TradingAccountInput["currency"]) ?? "USD",
      balance: account ? Number(account.balance) : 10000,
      leverage: account?.leverage ?? 100,
      maxDailyLossPct: account?.maxDailyLossPct
        ? Number(account.maxDailyLossPct)
        : undefined,
      maxDrawdownPct: account?.maxDrawdownPct
        ? Number(account.maxDrawdownPct)
        : undefined,
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: TradingAccountInput) {
    const url = isEdit ? `/api/accounts/${account!.id}` : "/api/accounts";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
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

    toast({
      title: isEdit ? "Cont actualizat" : "Cont creat",
      description: isEdit
        ? "Contul a fost actualizat cu succes."
        : "Contul de trading a fost creat.",
    });
    onSuccess();
    onClose();
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            {isEdit ? "Editează cont" : "Adaugă cont de trading"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-zinc-300">Nume cont</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Goat Funded $25K"
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Tip</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {ACCOUNT_TYPES.map((t) => (
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
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Monedă</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c} className="text-zinc-100">
                            {c}
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
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Balanță ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
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
                name="leverage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Levier</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="broker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Broker</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Goat Funded"
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Nr. cont</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 12345678"
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxDailyLossPct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Max pierdere zilnică (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 5"
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : undefined
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
                name="maxDrawdownPct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Max drawdown (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 10"
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-zinc-700 text-zinc-300"
              >
                Anulează
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSubmitting
                  ? isEdit
                    ? "Se salvează..."
                    : "Se creează..."
                  : isEdit
                  ? "Salvează"
                  : "Creează cont"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
