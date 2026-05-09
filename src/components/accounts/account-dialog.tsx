"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tradingAccountSchema, TradingAccountInput } from "@/lib/validations";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  Loader2, ChevronLeft, RefreshCw, Wifi, WifiOff,
  CheckCircle2, AlertCircle, ArrowRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConnectionType = "metaapi" | "ctrader" | "manual";

interface MetaApiAccountOption {
  id: string;
  name: string;
  login: string;
  server: string;
  platform: string;
  connectionStatus: string;
  balance: number;
  currency: string;
}

interface AccountDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  account?: {
    id: string; name: string; type: string; broker?: string | null;
    accountNumber?: string | null; currency: string; balance: string | number;
    leverage: number; maxDailyLossPct?: string | number | null;
    maxDrawdownPct?: string | number | null;
  } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = ["USD", "EUR", "GBP", "RON", "CHF", "JPY"] as const;
const ACCOUNT_TYPES = [
  { value: "DEMO",      label: "Demo",      color: "text-zinc-400",   bg: "bg-zinc-700/30 border-zinc-600" },
  { value: "CHALLENGE", label: "Challenge", color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/30" },
  { value: "LIVE",      label: "Live",      color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/30" },
] as const;

const CONNECTION_OPTIONS = [
  {
    id: "metaapi" as ConnectionType,
    icon: "🔄",
    name: "MetaAPI",
    subtitle: "MT4 / MT5",
    description: "Conectare automată cu broker-ul tău. Sync instant al tranzacțiilor.",
    badge: "Recomandat",
    badgeColor: "bg-indigo-500/20 border-indigo-500/30 text-indigo-300",
  },
  {
    id: "ctrader" as ConnectionType,
    icon: "🖥️",
    name: "cTrader",
    subtitle: "FIX API / Manual",
    description: "Adaugă cont cTrader manual. Import tranzacții prin CSV.",
    badge: null,
    badgeColor: "",
  },
  {
    id: "manual" as ConnectionType,
    icon: "✏️",
    name: "Manual",
    subtitle: "Demo / Challenge / Live",
    description: "Creează cont manual. Ideal pentru prop firms și conturi demo.",
    badge: null,
    badgeColor: "",
  },
] as const;

// ─── Step 1: Connection Type ──────────────────────────────────────────────────

function StepConnection({ onSelect }: { onSelect: (type: ConnectionType) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400 mb-4">Cum vrei să adaugi contul de trading?</p>
      {CONNECTION_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/60 transition-all text-left group"
        >
          <span className="text-3xl shrink-0">{opt.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-zinc-100">{opt.name}</span>
              <span className="text-xs text-zinc-600">{opt.subtitle}</span>
              {opt.badge && (
                <Badge className={cn("text-[10px] px-1.5 py-0 border", opt.badgeColor)}>
                  {opt.badge}
                </Badge>
              )}
            </div>
            <p className="text-xs text-zinc-500 truncate">{opt.description}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 shrink-0 transition-colors" />
        </button>
      ))}
    </div>
  );
}

// ─── Step 2a: MetaAPI account picker ─────────────────────────────────────────

function StepMetaApi({
  onSelect,
  onBack,
}: {
  onSelect: (acc: MetaApiAccountOption) => void;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const [accounts, setAccounts] = React.useState<MetaApiAccountOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/metaapi/accounts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Eroare");
      setAccounts(data.accounts ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-sm font-semibold text-zinc-200">Selectează contul MT4/MT5</p>
        <button onClick={load} className="ml-auto text-zinc-600 hover:text-zinc-300 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
          <span className="text-sm text-zinc-500 ml-2">Se încarcă conturile MetaAPI...</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-rose-300 font-medium">MetaAPI neconectat</p>
            <p className="text-xs text-rose-400/70 mt-1">{error}</p>
            <a href="/settings?tab=api-keys" className="text-xs text-indigo-400 hover:underline mt-1 inline-block">
              Configurează MetaAPI în Setări →
            </a>
          </div>
        </div>
      )}

      {!loading && !error && accounts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-zinc-500">Niciun cont MT4/MT5 găsit.</p>
          <p className="text-xs text-zinc-600 mt-1">
            Adaugă un cont pe{" "}
            <a href="https://app.metaapi.cloud" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
              app.metaapi.cloud
            </a>
          </p>
        </div>
      )}

      {!loading && accounts.map((acc) => (
        <button
          key={acc.id}
          onClick={() => onSelect(acc)}
          className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-indigo-500/40 hover:bg-zinc-800/60 transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400">
              {acc.platform?.toUpperCase() === "MT5" ? "5" : "4"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-100">{acc.name}</span>
                <Badge className={cn(
                  "text-[10px] px-1.5 py-0 border",
                  acc.connectionStatus === "CONNECTED"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-zinc-800 border-zinc-700 text-zinc-500"
                )}>
                  {acc.connectionStatus === "CONNECTED"
                    ? <><Wifi className="w-2.5 h-2.5 mr-0.5 inline" />Live</>
                    : <><WifiOff className="w-2.5 h-2.5 mr-0.5 inline" />Offline</>}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500">{acc.login} · {acc.server}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-mono font-bold text-zinc-200">
              {acc.balance?.toLocaleString("ro-RO", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-zinc-600">{acc.currency}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Step 2b/c: Manual/cTrader form ──────────────────────────────────────────

function StepForm({
  connectionType,
  prefill,
  isEdit,
  onBack,
  onSubmit,
  isSubmitting,
}: {
  connectionType: ConnectionType;
  prefill?: Partial<TradingAccountInput>;
  isEdit: boolean;
  onBack?: () => void;
  onSubmit: (data: TradingAccountInput) => Promise<void>;
  isSubmitting: boolean;
}) {
  const form = useForm<TradingAccountInput>({
    resolver: zodResolver(tradingAccountSchema),
    defaultValues: {
      name: prefill?.name ?? "",
      type: prefill?.type ?? "DEMO",
      broker: prefill?.broker ?? "",
      accountNumber: prefill?.accountNumber ?? "",
      currency: prefill?.currency ?? "USD",
      balance: prefill?.balance ?? 10000,
      leverage: prefill?.leverage ?? 100,
      maxDailyLossPct: prefill?.maxDailyLossPct ?? undefined,
      maxDrawdownPct: prefill?.maxDrawdownPct ?? undefined,
    },
  });

  const watchType = form.watch("type");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {onBack && (
          <button type="button" onClick={onBack}
            className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors text-sm mb-2">
            <ChevronLeft className="w-4 h-4" />
            Înapoi
          </button>
        )}

        {/* Account type selector */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300">Tip cont</FormLabel>
              <div className="grid grid-cols-3 gap-2">
                {ACCOUNT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => field.onChange(t.value)}
                    className={cn(
                      "py-2.5 rounded-xl border text-sm font-semibold transition-all",
                      field.value === t.value
                        ? `${t.bg} ${t.color} ring-1 ring-inset ring-current`
                        : "bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-zinc-600"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300">Nume cont</FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    watchType === "CHALLENGE"
                      ? "Ex: FTMO $25K Challenge"
                      : watchType === "LIVE"
                      ? "Ex: IC Markets Live"
                      : "Ex: Cont Demo USD"
                  }
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          {/* Broker */}
          <FormField
            control={form.control}
            name="broker"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300">Broker / Prop firm</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: FTMO, IC Markets"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Account number */}
          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300">Nr. cont / Login</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 12345678"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Balance */}
          <FormField
            control={form.control}
            name="balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300">Balanță inițială</FormLabel>
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

          {/* Currency */}
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
                      <SelectItem key={c} value={c} className="text-zinc-100">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Leverage */}
          <FormField
            control={form.control}
            name="leverage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300">Levier</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(parseInt(v))}
                  defaultValue={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {[10, 20, 30, 50, 100, 200, 400, 500].map((l) => (
                      <SelectItem key={l} value={String(l)} className="text-zinc-100">
                        1:{l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Prop firm limits — show for Challenge */}
        {watchType === "CHALLENGE" && (
          <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Reguli Prop Firm
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="maxDailyLossPct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300 text-xs">Max pierdere zilnică (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number" step="0.1"
                        placeholder="Ex: 5 (FTMO)"
                        className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                    <FormLabel className="text-zinc-300 text-xs">Max drawdown (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number" step="0.1"
                        placeholder="Ex: 10 (FTMO)"
                        className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <p className="text-[11px] text-amber-500/60">
              TradeGX te va alerta când te apropii de limitele prop firm-ului.
            </p>
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={onBack}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            Anulează
          </Button>
          <Button type="submit" disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-500 text-white">
            {isSubmitting
              ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Se creează...</>
              : isEdit ? "Salvează" : "Creează cont"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────

export function AccountDialog({ open, onClose, onSuccess, account }: AccountDialogProps) {
  const { toast } = useToast();
  const isEdit = !!account;

  type Step = "connection" | "metaapi-pick" | "form";
  const [step, setStep] = React.useState<Step>(isEdit ? "form" : "connection");
  const [connectionType, setConnectionType] = React.useState<ConnectionType>("manual");
  const [prefill, setPrefill] = React.useState<Partial<TradingAccountInput>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [metaApiSync, setMetaApiSync] = React.useState<{ id: string; tradingAccountId?: string } | null>(null);

  // Reset on open/close
  React.useEffect(() => {
    if (open) {
      setStep(isEdit ? "form" : "connection");
      setPrefill(
        isEdit && account
          ? {
              name: account.name,
              type: account.type as any,
              broker: account.broker ?? "",
              accountNumber: account.accountNumber ?? "",
              currency: account.currency as any,
              balance: Number(account.balance),
              leverage: account.leverage,
              maxDailyLossPct: account.maxDailyLossPct ? Number(account.maxDailyLossPct) : undefined,
              maxDrawdownPct: account.maxDrawdownPct ? Number(account.maxDrawdownPct) : undefined,
            }
          : {}
      );
    }
  }, [open, isEdit, account]);

  function handleConnectionSelect(type: ConnectionType) {
    setConnectionType(type);
    if (type === "metaapi") {
      setStep("metaapi-pick");
    } else {
      setPrefill({ type: type === "ctrader" ? "LIVE" : "DEMO" });
      setStep("form");
    }
  }

  function handleMetaApiPick(acc: MetaApiAccountOption) {
    setMetaApiSync({ id: acc.id });
    setPrefill({
      name: acc.name,
      type: "LIVE",
      broker: acc.server?.split("-")[0] ?? "",
      accountNumber: acc.login,
      currency: (acc.currency as any) ?? "USD",
      balance: acc.balance ?? 10000,
      leverage: 100,
    });
    setStep("form");
  }

  async function handleSubmit(data: TradingAccountInput) {
    setIsSubmitting(true);
    try {
      const url = isEdit ? `/api/accounts/${account!.id}` : "/api/accounts";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          brokerSource: connectionType === "metaapi" ? "METAAPI"
            : connectionType === "ctrader" ? "CTRADER"
            : "MANUAL",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Eroare", description: err.error ?? "A apărut o eroare", variant: "destructive" });
        return;
      }

      const created = await res.json();

      // If MetaAPI, trigger sync immediately
      if (metaApiSync?.id && created?.id) {
        toast({ title: "Cont creat! Se sincronizează tranzacțiile..." });
        fetch("/api/integrations/metaapi/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            metaApiAccountId: metaApiSync.id,
            tradingAccountId: created.id,
            daysBack: 90,
          }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.imported > 0) {
              toast({ title: "Sync complet!", description: d.message });
            }
          })
          .catch(() => {});
      } else {
        toast({
          title: isEdit ? "Cont actualizat" : "Cont creat cu succes!",
          description: isEdit ? "Modificările au fost salvate." : `${data.name} a fost adăugat.`,
        });
      }

      onSuccess();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  const TITLES: Record<Step, string> = {
    "connection": "Adaugă cont de trading",
    "metaapi-pick": "Selectează cont MT4/MT5",
    "form": isEdit ? "Editează cont" : "Configurează contul",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">{TITLES[step]}</DialogTitle>
        </DialogHeader>

        {step === "connection" && (
          <StepConnection onSelect={handleConnectionSelect} />
        )}

        {step === "metaapi-pick" && (
          <StepMetaApi
            onSelect={handleMetaApiPick}
            onBack={() => setStep("connection")}
          />
        )}

        {step === "form" && (
          <StepForm
            connectionType={connectionType}
            prefill={prefill}
            isEdit={isEdit}
            onBack={isEdit ? undefined : () => {
              if (connectionType === "metaapi") setStep("metaapi-pick");
              else setStep("connection");
            }}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
