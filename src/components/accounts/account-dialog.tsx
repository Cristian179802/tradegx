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
  Loader2, ChevronLeft, CheckCircle2, AlertCircle,
  Upload, FileText, X, User2, ChevronRight,
  Copy, Check, Download, Plug,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "method" | "ea" | "csv" | "form";
type AccountTyp = "DEMO" | "CHALLENGE" | "LIVE";

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

const CURRENCIES = ["USD", "EUR", "GBP", "RON", "CHF", "JPY", "CAD", "AUD"] as const;

const ACCOUNT_TYPES = [
  { value: "DEMO",      label: "Demo",      color: "text-zinc-300",    bg: "bg-zinc-700/40 border-zinc-600" },
  { value: "CHALLENGE", label: "Challenge", color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/40" },
  { value: "LIVE",      label: "Live",      color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/40" },
] as const;

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
        copied
          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
          : "bg-indigo-500/15 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/25",
        className
      )}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? "Copiat!" : "Copiază codul EA"}
    </button>
  );
}

// ─── Step: Choose Method ──────────────────────────────────────────────────────

function StepMethod({ onSelect }: { onSelect: (s: Step) => void }) {
  return (
    <div className="space-y-3">
      {/* EA — PRIMARY */}
      <button
        onClick={() => onSelect("ea")}
        className="w-full flex items-center gap-4 p-4 rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-500/8 to-violet-500/5 hover:border-indigo-400/70 hover:from-indigo-500/15 transition-all text-left group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
          <Plug className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="flex-1 relative">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-zinc-100">MT4 / MT5 / cTrader</span>
            <Badge className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] px-1.5 py-0">Recomandat</Badge>
            <Badge className="bg-zinc-700/60 border border-zinc-700 text-zinc-400 text-[10px] px-1.5 py-0">Gratuit</Badge>
          </div>
          <p className="text-xs text-zinc-500">Copiezi un cod în MT4/MT5 — tranzacțiile se sincronizează singure.</p>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors shrink-0" />
      </button>

      {/* CSV */}
      <button
        onClick={() => onSelect("csv")}
        className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all text-left group"
      >
        <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
          <Upload className="w-5 h-5 text-zinc-500" />
        </div>
        <div className="flex-1">
          <span className="font-bold text-zinc-300">Import CSV / HTML</span>
          <p className="text-xs text-zinc-500 mt-0.5">Exportă istoricul din MT4/MT5 și importă fișierul.</p>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
      </button>

      {/* Manual */}
      <button
        onClick={() => onSelect("form")}
        className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all text-left group"
      >
        <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
          <User2 className="w-5 h-5 text-zinc-500" />
        </div>
        <div className="flex-1">
          <span className="font-bold text-zinc-300">Manual</span>
          <p className="text-xs text-zinc-500 mt-0.5">Adaugă tranzacțiile manual, una câte una.</p>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
      </button>
    </div>
  );
}

// ─── Step: EA Connect (ultra-simple) ─────────────────────────────────────────

interface EAData { eaMQ4: string; eaMQ5: string; appDomain: string; }

function StepEA({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [platform, setPlatform] = React.useState<"mt4" | "mt5">("mt5");
  const [ea, setEa] = React.useState<EAData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/me/ea")
      .then(r => r.json())
      .then(d => { setEa(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const code = platform === "mt4" ? ea?.eaMQ4 : ea?.eaMQ5;
  const ext  = platform === "mt4" ? "mq4" : "mq5";
  const folder = platform === "mt4" ? "MQL4" : "MQL5";

  function downloadEA() {
    if (!code) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
    a.download = `ApexTrader.${ext}`;
    a.click();
  }

  const steps = [
    {
      num: "1",
      text: platform === "mt4"
        ? `MT4 → File → Open Data Folder → MQL4 → Experts → salvează fișierul ca "ApexTrader.mq4"`
        : `MT5 → File → Open Data Folder → MQL5 → Experts → salvează fișierul ca "ApexTrader.mq5"`,
    },
    {
      num: "2",
      text: `Tools → Options → Expert Advisors → bifează "Allow WebRequest" → adaugă: ${ea?.appDomain ?? "domeniul aplicației"}`,
    },
    {
      num: "3",
      text: `Drag & drop "ApexTrader" din Navigator → Expert Advisors pe orice grafic. ✅ Gata!`,
    },
  ];

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
        <ChevronLeft className="w-4 h-4" />Înapoi
      </button>

      {/* Platform selector */}
      <div className="grid grid-cols-2 gap-2">
        {(["mt4", "mt5"] as const).map(p => (
          <button key={p} onClick={() => setPlatform(p)}
            className={cn("py-3 rounded-xl border text-sm font-bold transition-all",
              platform === p
                ? "bg-indigo-500/15 border-indigo-500/50 text-indigo-300"
                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300")}>
            {p.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Copy + Download */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      ) : code ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <CopyBtn text={code} className="flex-1 justify-center" />
            <button onClick={downloadEA}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 text-sm transition-all">
              <Download className="w-4 h-4" />
              .{ext}
            </button>
          </div>
          {/* Preview */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800">
              <span className="text-[10px] font-mono text-zinc-600">ApexTrader.{ext}</span>
            </div>
            <pre className="text-[10px] text-zinc-500 font-mono p-3 leading-relaxed overflow-hidden max-h-24 select-none">
              {code.slice(0, 300)}…
            </pre>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-sm text-rose-400">
          Eroare la generarea codului. Reîncarcă pagina.
        </div>
      )}

      {/* Steps */}
      <div className="space-y-2.5">
        {steps.map((s) => (
          <div key={s.num} className="flex gap-3 items-start">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              {s.num}
            </span>
            <p className="text-xs text-zinc-400 leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>

      <Button onClick={onDone}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold h-10">
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Am instalat — Închide
      </Button>

      <p className="text-center text-[10px] text-zinc-600">
        Contul apare automat după prima tranzacție închisă în MT4/MT5.
      </p>
    </div>
  );
}

// ─── Step: CSV Import ─────────────────────────────────────────────────────────

function StepCSV({ onBack, onSuccess, onClose }: { onBack: () => void; onSuccess: () => void; onClose: () => void }) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile]         = React.useState<File | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [accountName, setName]  = React.useState("");
  const [type, setType]         = React.useState<AccountTyp>("LIVE");
  const [currency, setCur]      = React.useState("USD");
  const [broker, setBroker]     = React.useState("");
  const [platform, setPlat]     = React.useState<"mt4" | "mt5" | "ctrader">("mt5");
  const [loading, setLoading]   = React.useState(false);
  const [done, setDone]         = React.useState(false);
  const [error, setError]       = React.useState("");

  async function handleImport() {
    if (!file) return;
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("accountName", accountName || `${platform.toUpperCase()} Import`);
      fd.append("accountType", type);
      fd.append("currency", currency);
      fd.append("balance", "0");
      fd.append("broker", broker);
      const res = await fetch("/api/accounts/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Eroare la import"); return; }
      setDone(true);
      toast({ title: `✅ ${data.imported} tranzacții importate!` });
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch { setError("Eroare de rețea."); }
    finally { setLoading(false); }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-emerald-400" />
        </div>
        <p className="font-bold text-zinc-100">Import realizat cu succes!</p>
      </div>
    );
  }

  const hint: Record<typeof platform, string> = {
    mt4: 'MT4 → Account History → click dreapta → "Save as Report" → HTML sau CSV',
    mt5: 'MT5 → History → click dreapta → "Save as Report" → HTML sau CSV',
    ctrader: "cTrader → History → Closed Positions → Export → CSV",
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
        <ChevronLeft className="w-4 h-4" />Înapoi
      </button>

      <div className="grid grid-cols-3 gap-2">
        {(["mt4", "mt5", "ctrader"] as const).map(p => (
          <button key={p} onClick={() => setPlat(p)}
            className={cn("py-2 rounded-xl border text-sm font-bold transition-all",
              platform === p ? "bg-indigo-500/15 border-indigo-500/50 text-indigo-300"
                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300")}>
            {p === "ctrader" ? "cTrader" : p.toUpperCase()}
          </button>
        ))}
      </div>

      <p className="text-xs text-zinc-500 bg-zinc-800/50 rounded-xl px-4 py-3 leading-relaxed">{hint[platform]}</p>

      {/* Drop zone */}
      {!file ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
          onClick={() => fileInputRef.current?.click()}
          className={cn("border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
            dragging ? "border-indigo-500/60 bg-indigo-500/10" : "border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/30")}>
          <Upload className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-300">Trage fișierul sau <span className="text-indigo-400">apasă</span></p>
          <p className="text-xs text-zinc-600 mt-1">.html · .htm · .csv</p>
          <input ref={fileInputRef} type="file" className="hidden" accept=".html,.htm,.csv,.txt"
            onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-700 rounded-xl p-3">
          <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">{file.name}</p>
            <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <button onClick={() => setFile(null)} className="text-zinc-600 hover:text-zinc-300"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Optional extras */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-400">Broker <span className="text-zinc-600">(opțional)</span></label>
          <Input placeholder="Ex: FTMO" value={broker} onChange={e => setBroker(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-400">Monedă</label>
          <select value={currency} onChange={e => setCur(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ACCOUNT_TYPES.map(t => (
          <button key={t.value} onClick={() => setType(t.value)}
            className={cn("py-2 rounded-xl border text-sm font-semibold transition-all",
              type === t.value ? `${t.bg} ${t.color}` : "bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-zinc-600")}>
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      <Button onClick={handleImport} disabled={!file || loading}
        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold h-10 shadow-lg shadow-indigo-500/20">
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Se procesează...</> : <><Upload className="w-4 h-4 mr-2" />Importă</>}
      </Button>
    </div>
  );
}

// ─── Step: Manual Form ────────────────────────────────────────────────────────

function StepForm({ prefill, isEdit, onBack, onClose, onSuccess }: {
  prefill?: Partial<TradingAccountInput & { id?: string }>;
  isEdit: boolean; onBack?: () => void; onClose: () => void; onSuccess: () => void;
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
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({ title: "Eroare", description: err.error ?? "A apărut o eroare", variant: "destructive" });
      return;
    }
    toast({ title: isEdit ? "Cont actualizat" : "Cont creat!", description: data.name });
    onSuccess(); onClose();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {onBack && (
          <button type="button" onClick={onBack}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" />Înapoi
          </button>
        )}

        <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-zinc-300 text-xs uppercase tracking-wider">Tip cont</FormLabel>
            <div className="grid grid-cols-3 gap-2">
              {ACCOUNT_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => field.onChange(t.value)}
                  className={cn("py-2.5 rounded-xl border text-sm font-semibold transition-all",
                    field.value === t.value ? `${t.bg} ${t.color}` : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600")}>
                  {t.label}
                </button>
              ))}
            </div>
          </FormItem>
        )} />

        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-zinc-300">Nume cont</FormLabel>
            <FormControl>
              <Input
                placeholder={watchType === "CHALLENGE" ? "Ex: FTMO $25K" : watchType === "LIVE" ? "Ex: IC Markets Live" : "Ex: Cont Demo"}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" {...field} />
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
            </FormItem>
          )} />
          <FormField control={form.control} name="accountNumber" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300">Nr. cont</FormLabel>
              <FormControl>
                <Input placeholder="12345678" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 font-mono" {...field} />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="balance" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300">Balanță</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
              </FormControl>
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
                  {CURRENCIES.map(c => <SelectItem key={c} value={c} className="text-zinc-100">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormItem>
          )} />
          <FormField control={form.control} name="leverage" render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel className="text-zinc-300">Levier</FormLabel>
              <Select onValueChange={v => field.onChange(parseInt(v))} defaultValue={String(field.value)}>
                <FormControl>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100"><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {[10, 20, 30, 50, 100, 200, 400, 500].map(l => (
                    <SelectItem key={l} value={String(l)} className="text-zinc-100">1:{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <Input type="number" step="0.1" placeholder="5"
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                      {...field} value={field.value ?? ""}
                      onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="maxDrawdownPct" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300 text-xs">Drawdown max (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="10"
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
                      {...field} value={field.value ?? ""}
                      onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                  </FormControl>
                </FormItem>
              )} />
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          {onBack && (
            <Button type="button" variant="outline" onClick={onBack}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">Anulează</Button>
          )}
          <Button type="submit" disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20">
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
  const [step, setStep] = React.useState<Step>(isEdit ? "form" : "method");

  React.useEffect(() => {
    if (open) setStep(isEdit ? "form" : "method");
  }, [open, isEdit]);

  const TITLES: Record<Step, string> = {
    method: "Adaugă cont de trading",
    ea:     "Conectare MT4 / MT5",
    csv:    "Import fișier",
    form:   isEdit ? "Editează cont" : "Cont manual",
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800/80 sm:max-w-md max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50">
        <DialogHeader>
          <DialogTitle className="text-zinc-100 text-base">{TITLES[step]}</DialogTitle>
        </DialogHeader>

        {step === "method" && <StepMethod onSelect={setStep} />}
        {step === "ea"     && <StepEA onBack={() => setStep("method")} onDone={() => { onSuccess(); onClose(); }} />}
        {step === "csv"    && <StepCSV onBack={() => setStep("method")} onSuccess={onSuccess} onClose={onClose} />}
        {step === "form"   && (
          <StepForm
            prefill={isEdit ? { ...account, id: account?.id } as any : undefined}
            isEdit={isEdit}
            onBack={isEdit ? undefined : () => setStep("method")}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
