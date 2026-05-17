"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tradingAccountSchema, TradingAccountInput } from "@/lib/validations";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
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
  Loader2, ChevronLeft, ArrowRight, CheckCircle2, AlertCircle,
  Upload, FileText, X, Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConnectionType = "mt45" | "ctrader" | "manual";
type Step = "connection" | "import" | "form";

interface AccountDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  account?: {
    id: string; name: string; type: string; broker?: string | null;
    accountNumber?: string | null; currency: string;
    balance: string | number; leverage: number;
    maxDailyLossPct?: string | number | null;
    maxDrawdownPct?: string | number | null;
  } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = ["USD", "EUR", "GBP", "RON", "CHF", "JPY"] as const;

const ACCOUNT_TYPES = [
  { value: "DEMO",      label: "Demo",      color: "text-zinc-400",    bg: "bg-zinc-700/30 border-zinc-600" },
  { value: "CHALLENGE", label: "Challenge", color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30" },
  { value: "LIVE",      label: "Live",      color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
] as const;

// ─── Step 1: Choose Connection ────────────────────────────────────────────────

function StepConnection({
  onSelect,
}: {
  onSelect: (t: ConnectionType) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400 mb-5">
        Cum vrei să adaugi contul de trading?
      </p>

      {/* MT4/MT5 */}
      <button
        onClick={() => onSelect("mt45")}
        className="w-full flex items-center gap-4 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/60 hover:bg-indigo-500/10 transition-all text-left group"
      >
        <div className="w-11 h-11 rounded-xl bg-indigo-500/20 flex items-center justify-center text-xl shrink-0">
          📊
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold text-zinc-100">MetaTrader 4 / 5</span>
            <Badge className="bg-indigo-500/20 border-indigo-500/30 text-indigo-300 text-[10px] px-1.5 py-0">
              Recomandat
            </Badge>
          </div>
          <p className="text-xs text-zinc-500">
            Exportă istoricul din MT4/MT5 și importă automat. Simplu, fără conturi externe.
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors shrink-0" />
      </button>

      {/* cTrader */}
      <button
        onClick={() => onSelect("ctrader")}
        className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all text-left group"
      >
        <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center text-xl shrink-0">
          🖥️
        </div>
        <div className="flex-1">
          <div className="mb-0.5">
            <span className="text-sm font-bold text-zinc-100">cTrader</span>
          </div>
          <p className="text-xs text-zinc-500">
            Export CSV din cTrader → import instant în TradeGX.
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
      </button>

      {/* Manual */}
      <button
        onClick={() => onSelect("manual")}
        className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all text-left group"
      >
        <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center text-xl shrink-0">
          ✏️
        </div>
        <div className="flex-1">
          <div className="mb-0.5">
            <span className="text-sm font-bold text-zinc-100">Manual</span>
          </div>
          <p className="text-xs text-zinc-500">
            Creează cont și adaugă tranzacțiile manual sau prin jurnal.
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
      </button>
    </div>
  );
}

// ─── Step 2: Import (MT4/MT5 or cTrader) ─────────────────────────────────────

function StepImport({
  connectionType,
  onBack,
  onSuccess,
  onClose,
}: {
  connectionType: ConnectionType;
  onBack: () => void;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [accountName, setAccountName] = React.useState("");
  const [accountType, setAccountType] = React.useState<"DEMO" | "CHALLENGE" | "LIVE">("LIVE");
  const [currency, setCurrency] = React.useState("USD");
  const [balance, setBalance] = React.useState("");
  const [broker, setBroker] = React.useState("");
  const [maxDailyLoss, setMaxDailyLoss] = React.useState("");
  const [maxDrawdown, setMaxDrawdown] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{
    imported: number; skipped: number; format: string; warnings: string[];
  } | null>(null);
  const [error, setError] = React.useState("");

  const isMT = connectionType === "mt45";

  const instructions = isMT
    ? [
        { step: "1", text: "Deschide MT4/MT5" },
        { step: "2", text: 'Click dreapta pe tab-ul "Account History"' },
        { step: "3", text: '"Save as Report" → salvează ca HTML sau CSV' },
        { step: "4", text: "Încarcă fișierul mai jos ↓" },
      ]
    : [
        { step: "1", text: "Deschide cTrader" },
        { step: "2", text: "History → Closed Positions" },
        { step: "3", text: 'Click "Export" → CSV' },
        { step: "4", text: "Încarcă fișierul mai jos ↓" },
      ];

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  }

  function removeFile() {
    setFile(null);
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("accountName", accountName || (isMT ? "MT4/MT5 Import" : "cTrader Import"));
      fd.append("accountType", accountType);
      fd.append("currency", currency);
      fd.append("balance", balance || "0");
      fd.append("broker", broker);

      const res = await fetch("/api/accounts/import", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Eroare la import");
        return;
      }

      setResult({
        imported: data.imported,
        skipped: data.skipped,
        format: data.format,
        warnings: data.warnings ?? [],
      });

      toast({
        title: `✅ ${data.imported} tranzacții importate!`,
        description: `Format detectat: ${data.format}`,
      });

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch {
      setError("Eroare de rețea. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-base font-bold text-zinc-100">
            {result.imported} tranzacții importate!
          </p>
          <p className="text-sm text-zinc-400">Format: {result.format}</p>
          {result.skipped > 0 && (
            <p className="text-xs text-zinc-500">{result.skipped} duplicate sărite</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
      >
        <ChevronLeft className="w-4 h-4" />Înapoi
      </button>

      {/* Instructions */}
      <div className="bg-zinc-800/40 rounded-xl p-4 space-y-2.5">
        <p className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">
          Cum exporti din {isMT ? "MT4/MT5" : "cTrader"}
        </p>
        {instructions.map((ins) => (
          <div key={ins.step} className="flex items-center gap-3">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0">
              {ins.step}
            </span>
            <p className="text-xs text-zinc-400">{ins.text}</p>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
            dragging
              ? "border-indigo-500/60 bg-indigo-500/10"
              : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/30"
          )}
        >
          <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-zinc-300">
            Trage fișierul aici sau <span className="text-indigo-400">click</span>
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            {isMT ? "HTML sau CSV din MT4/MT5" : "CSV din cTrader"}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={isMT ? ".html,.htm,.csv,.txt" : ".csv,.txt"}
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-700 rounded-xl p-3">
          <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">{file.name}</p>
            <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <button onClick={removeFile} className="text-zinc-600 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Account details */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Detalii cont
        </p>

        {/* Account type */}
        <div className="grid grid-cols-3 gap-2">
          {ACCOUNT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setAccountType(t.value as any)}
              className={cn(
                "py-2 rounded-xl border text-sm font-semibold transition-all",
                accountType === t.value
                  ? `${t.bg} ${t.color} ring-1 ring-inset ring-current`
                  : "bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-zinc-600"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <label className="text-sm text-zinc-300">Nume cont</label>
            <Input
              placeholder={isMT ? "Ex: FTMO $100K MT5" : "Ex: IC Markets cTrader"}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-zinc-300">Broker</label>
            <Input
              placeholder="Ex: FTMO"
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-zinc-300">Monedă</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="col-span-2 space-y-1.5">
            <label className="text-sm text-zinc-300">Balanță cont (opțional)</label>
            <Input
              type="number"
              step="0.01"
              placeholder="Ex: 100000"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
        </div>

        {/* Prop firm limits for Challenge */}
        {accountType === "CHALLENGE" && (
          <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Reguli Prop Firm</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Pierdere zilnică max (%)</label>
                <Input
                  type="number" step="0.1" placeholder="Ex: 5"
                  value={maxDailyLoss} onChange={(e) => setMaxDailyLoss(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Drawdown max (%)</label>
                <Input
                  type="number" step="0.1" placeholder="Ex: 10"
                  value={maxDrawdown} onChange={(e) => setMaxDrawdown(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 bg-zinc-800/40 rounded-lg px-3 py-2.5">
        <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-zinc-600 leading-relaxed">
          Formatul este detectat automat. Funcționează cu HTML și CSV din MT4, MT5 și cTrader.
          Tranzacțiile duplicate sunt sărite automat.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      {/* Submit */}
      <Button
        onClick={handleImport}
        disabled={!file || loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Se procesează...</>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Importă tranzacțiile
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Step 2: Manual form ──────────────────────────────────────────────────────

function StepForm({
  prefill,
  isEdit,
  onBack,
  onClose,
  onSuccess,
}: {
  prefill?: Partial<TradingAccountInput & { id?: string }>;
  isEdit: boolean;
  onBack?: () => void;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
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

  const { isSubmitting } = form.formState;
  const watchType = form.watch("type");

  async function onSubmit(data: TradingAccountInput) {
    const url = isEdit ? `/api/accounts/${prefill?.id}` : "/api/accounts";
    const method = isEdit ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({ title: "Eroare", description: err.error ?? "A apărut o eroare", variant: "destructive" });
      return;
    }
    toast({ title: isEdit ? "Cont actualizat" : "Cont creat!", description: data.name });
    onSuccess();
    onClose();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {onBack && (
          <button type="button" onClick={onBack}
            className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" />Înapoi
          </button>
        )}

        <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-zinc-300">Tip cont</FormLabel>
            <div className="grid grid-cols-3 gap-2">
              {ACCOUNT_TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => field.onChange(t.value)}
                  className={cn(
                    "py-2.5 rounded-xl border text-sm font-semibold transition-all",
                    field.value === t.value
                      ? `${t.bg} ${t.color} ring-1 ring-inset ring-current`
                      : "bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-zinc-600"
                  )}>
                  {t.label}
                </button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-zinc-300">Nume cont</FormLabel>
            <FormControl>
              <Input
                placeholder={watchType === "CHALLENGE" ? "Ex: FTMO $25K" : watchType === "LIVE" ? "Ex: IC Markets Live" : "Ex: Cont Demo"}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="broker" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300">Broker</FormLabel>
              <FormControl>
                <Input placeholder="Ex: FTMO" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="accountNumber" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300">Nr. cont</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 12345678" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="balance" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300">Balanță</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="currency" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300">Monedă</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100"><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c} className="text-zinc-100">{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="leverage" render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel className="text-zinc-300">Levier</FormLabel>
              <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={String(field.value)}>
                <FormControl>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100"><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {[10, 20, 30, 50, 100, 200, 400, 500].map((l) => (
                    <SelectItem key={l} value={String(l)} className="text-zinc-100">1:{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {watchType === "CHALLENGE" && (
          <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Reguli Prop Firm</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="maxDailyLossPct" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300 text-xs">Pierdere zilnică max (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="Ex: 5"
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                      {...field} value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="maxDrawdownPct" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300 text-xs">Drawdown max (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="Ex: 10"
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                      {...field} value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                  </FormControl>
                </FormItem>
              )} />
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          {onBack && (
            <Button type="button" variant="outline" onClick={onBack}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Anulează
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white">
            {isSubmitting
              ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Se salvează...</>
              : isEdit ? "Salvează modificările" : "Creează cont"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────

export function AccountDialog({ open, onClose, onSuccess, account }: AccountDialogProps) {
  const isEdit = !!account;
  const [step, setStep] = React.useState<Step>(isEdit ? "form" : "connection");
  const [connectionType, setConnectionType] = React.useState<ConnectionType>("mt45");

  React.useEffect(() => {
    if (open) setStep(isEdit ? "form" : "connection");
  }, [open, isEdit]);

  const TITLES: Record<Step, string> = {
    connection: "Adaugă cont de trading",
    import: connectionType === "ctrader" ? "Import cTrader" : "Import MT4 / MT5",
    form: isEdit ? "Editează cont" : "Cont manual",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">{TITLES[step]}</DialogTitle>
        </DialogHeader>

        {step === "connection" && (
          <StepConnection
            onSelect={(t) => {
              setConnectionType(t);
              setStep(t === "manual" ? "form" : "import");
            }}
          />
        )}

        {step === "import" && (
          <StepImport
            connectionType={connectionType}
            onBack={() => setStep("connection")}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        )}

        {step === "form" && (
          <StepForm
            prefill={isEdit ? { ...account, id: account?.id } as any : undefined}
            isEdit={isEdit}
            onBack={isEdit ? undefined : () => setStep("connection")}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
