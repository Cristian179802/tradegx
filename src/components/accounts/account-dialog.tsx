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
  Upload, FileText, X,
  User2, ChevronRight,
  Copy, Check, Download, Terminal, Plug,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConnectionMethod = "ea" | "csv" | "manual";
type Platform = "mt4" | "mt5" | "ctrader";
type Step = "method" | "ea-form" | "ea-code" | "csv" | "form";
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


// ─── Utility ──────────────────────────────────────────────────────────────────

function CopyButton({ text, label = "Copiază" }: { text: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={cn(
        "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all",
        copied
          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
      )}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copiat!" : label}
    </button>
  );
}

// ─── Step: Choose Method ──────────────────────────────────────────────────────

function StepMethod({ onSelect }: { onSelect: (m: ConnectionMethod) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400 mb-5">
        Alege cum vrei să conectezi contul de trading:
      </p>

      {/* ── EA Sync — PRIMARY ────────────────────────────────────────── */}
      <button
        onClick={() => onSelect("ea")}
        className="w-full flex items-center gap-4 p-4 rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-500/8 to-violet-500/5 hover:border-indigo-400/70 hover:from-indigo-500/15 hover:to-violet-500/10 transition-all text-left group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
          <Plug className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="flex-1 relative">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-sm font-bold text-zinc-100">Conectare directă MT4 / MT5</span>
            <Badge className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] px-1.5 py-0">
              Recomandat
            </Badge>
            <Badge className="bg-zinc-700/60 border border-zinc-700 text-zinc-400 text-[10px] px-1.5 py-0">
              Gratuit
            </Badge>
          </div>
          <p className="text-xs text-zinc-500">
            Instalezi un fișier mic în MT4/MT5 — tranzacțiile se sincronizează automat, în timp real,
            cu orice broker.
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors shrink-0" />
      </button>

      {/* ── CSV import ───────────────────────────────────────────────── */}
      <button
        onClick={() => onSelect("csv")}
        className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all text-left group"
      >
        <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
          <Upload className="w-5 h-5 text-zinc-500" />
        </div>
        <div className="flex-1">
          <span className="text-sm font-bold text-zinc-300">Import CSV / HTML</span>
          <p className="text-xs text-zinc-500 mt-0.5">
            Exportă istoricul din MT4/MT5/cTrader și importă fișierul.
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
      </button>

      {/* ── Manual ───────────────────────────────────────────────────── */}
      <button
        onClick={() => onSelect("manual")}
        className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all text-left group"
      >
        <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
          <User2 className="w-5 h-5 text-zinc-500" />
        </div>
        <div className="flex-1">
          <span className="text-sm font-bold text-zinc-300">Manual</span>
          <p className="text-xs text-zinc-500 mt-0.5">Creează cont și adaugă tranzacțiile manual.</p>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
      </button>
    </div>
  );
}

// ─── Step: EA Setup — Part 1 (create account) ────────────────────────────────

function StepEAForm({
  onBack,
  onAccountCreated,
}: {
  onBack: () => void;
  onAccountCreated: (accountId: string) => void;
}) {
  const { toast } = useToast();
  const [name, setName]           = React.useState("");
  const [broker, setBroker]       = React.useState("");
  const [accountNumber, setAccNr] = React.useState("");
  const [type, setType]           = React.useState<AccountTyp>("LIVE");
  const [currency, setCurrency]   = React.useState("USD");
  const [leverage, setLeverage]   = React.useState("100");
  const [maxDailyLoss, setMDL]    = React.useState("");
  const [maxDD, setMaxDD]         = React.useState("");
  const [loading, setLoading]     = React.useState(false);
  const [error, setError]         = React.useState("");

  async function handleCreate() {
    if (!name.trim()) { setError("Introduceți un nume pentru cont."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          broker: broker || "MT4/MT5",
          accountNumber: accountNumber || "",
          currency,
          balance: 0,
          leverage: parseInt(leverage),
          maxDailyLossPct: maxDailyLoss ? parseFloat(maxDailyLoss) : undefined,
          maxDrawdownPct:  maxDD        ? parseFloat(maxDD)        : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Eroare la creare cont."); return; }
      toast({ title: "Cont creat! Generez codul EA..." });
      onAccountCreated(data.id);
    } catch {
      setError("Eroare de rețea.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
        <ChevronLeft className="w-4 h-4" />Înapoi
      </button>

      {/* Explainer */}
      <div className="flex items-start gap-3 bg-indigo-500/8 border border-indigo-500/20 rounded-xl p-3.5">
        <Terminal className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-indigo-300 mb-0.5">Cum funcționează EA Sync</p>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Vei instala un fișier mic (Expert Advisor) în MT4/MT5. Acesta rulează în fundal și
            trimite automat fiecare tranzacție închisă direct în Apex Trader — în timp real.
            <strong className="text-zinc-400"> Nu necesită nicio configurare de server.</strong>
          </p>
        </div>
      </div>

      {/* Account type */}
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
          Tip cont
        </label>
        <div className="grid grid-cols-3 gap-2">
          {ACCOUNT_TYPES.map((t) => (
            <button key={t.value} onClick={() => setType(t.value)}
              className={cn("py-2.5 rounded-xl border text-sm font-semibold transition-all",
                type === t.value ? `${t.bg} ${t.color}`
                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300")}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm text-zinc-300">Nume cont <span className="text-zinc-600 text-xs">(ex: FTMO $100K)</span></label>
          <Input placeholder={type === "CHALLENGE" ? "Ex: FTMO $25K" : type === "LIVE" ? "Ex: IC Markets Live" : "Ex: Cont Demo"}
            value={name} onChange={(e) => setName(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-300">Broker <span className="text-zinc-600 text-xs">(opțional)</span></label>
            <Input placeholder="Ex: FTMO, ICMarkets" value={broker}
              onChange={(e) => setBroker(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-300">Nr. cont MT <span className="text-zinc-600 text-xs">(opțional)</span></label>
            <Input placeholder="Ex: 12345678" value={accountNumber}
              onChange={(e) => setAccNr(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 font-mono" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-300">Monedă</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-300">Levier</label>
            <select value={leverage} onChange={(e) => setLeverage(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              {[10, 20, 30, 50, 100, 200, 400, 500].map((l) => (
                <option key={l} value={String(l)}>1:{l}</option>
              ))}
            </select>
          </div>
        </div>

        {type === "CHALLENGE" && (
          <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-3 space-y-3">
            <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Reguli Prop Firm</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Pierdere zilnică max (%)</label>
                <Input type="number" step="0.1" placeholder="5" value={maxDailyLoss}
                  onChange={(e) => setMDL(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Max drawdown (%)</label>
                <Input type="number" step="0.1" placeholder="10" value={maxDD}
                  onChange={(e) => setMaxDD(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" />
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      <Button onClick={handleCreate} disabled={loading || !name.trim()}
        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold h-11 shadow-lg shadow-indigo-500/20">
        {loading
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Se creează contul...</>
          : <>Continuă — generează codul EA <ChevronRight className="w-4 h-4 ml-1" /></>}
      </Button>
    </div>
  );
}

// ─── Step: EA Setup — Part 2 (show code) ─────────────────────────────────────

interface EAInfo {
  token: string;
  webhookUrl: string;
  eaMQ4: string;
  eaMQ5: string;
  appDomain: string;
}

function StepEACode({
  accountId,
  onDone,
}: {
  accountId: string;
  onDone: () => void;
}) {
  const [ea, setEa] = React.useState<EAInfo | null>(null);
  const [platform, setPlatform] = React.useState<"mt4" | "mt5">("mt5");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    setLoading(true);
    fetch(`/api/accounts/${accountId}/ea`)
      .then((r) => r.json())
      .then((d) => { setEa(d); setLoading(false); })
      .catch(() => { setError("Nu s-a putut genera codul EA."); setLoading(false); });
  }, [accountId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-sm text-zinc-400">Se generează codul EA...</p>
      </div>
    );
  }

  if (error || !ea) {
    return (
      <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <p className="text-sm text-rose-300">{error || "Eroare necunoscută."}</p>
      </div>
    );
  }

  const code = platform === "mt4" ? ea.eaMQ4 : ea.eaMQ5;
  const ext  = platform === "mt4" ? "mq4" : "mq5";

  function downloadEA() {
    const blob = new Blob([code], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ApexTrader_Sync.${ext}`;
    a.click();
  }

  const steps = platform === "mt4" ? [
    { title: "Deschide folderul MT4", detail: `File → Open Data Folder → MQL4 → Experts` },
    { title: `Creează fișier nou`, detail: `Salvează codul de mai jos ca "ApexTrader_Sync.mq4"` },
    { title: "Compilează și permite WebRequest", detail: `Tools → Options → Expert Advisors → Allow WebRequest → adaugă: ${ea.appDomain}` },
    { title: "Atașează EA la orice chart", detail: "Drag & drop din Navigator → Experts → ApexTrader_Sync" },
    { title: "Tranzacțiile se sincronizează automat! ✅", detail: "De fiecare dată când închizi o tranzacție, apare în Apex Trader." },
  ] : [
    { title: "Deschide folderul MT5", detail: `File → Open Data Folder → MQL5 → Experts` },
    { title: `Creează fișier nou`, detail: `Salvează codul de mai jos ca "ApexTrader_Sync.mq5"` },
    { title: "Compilează și permite WebRequest", detail: `Tools → Options → Expert Advisors → Allow WebRequest → adaugă: ${ea.appDomain}` },
    { title: "Atașează EA la orice chart", detail: "Drag & drop din Navigator → Expert Advisors → ApexTrader_Sync" },
    { title: "Tranzacțiile se sincronizează automat! ✅", detail: "De fiecare dată când închizi o tranzacție, apare în Apex Trader." },
  ];

  return (
    <div className="space-y-4">
      {/* Platform switch */}
      <div className="grid grid-cols-2 gap-2">
        {(["mt4", "mt5"] as const).map((p) => (
          <button key={p} onClick={() => setPlatform(p)}
            className={cn("py-2.5 rounded-xl border text-sm font-bold transition-all",
              platform === p
                ? "bg-indigo-500/15 border-indigo-500/50 text-indigo-300"
                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300")}>
            {p.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((s, i) => (
          <div key={i} className="flex gap-3 items-start">
            <span className={cn(
              "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5",
              i === steps.length - 1
                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                : "bg-indigo-500/20 border border-indigo-500/30 text-indigo-300"
            )}>
              {i === steps.length - 1 ? "✓" : i + 1}
            </span>
            <div>
              <p className={cn("text-xs font-semibold", i === steps.length - 1 ? "text-emerald-400" : "text-zinc-200")}>{s.title}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{s.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Code block */}
      <div className="rounded-xl border border-zinc-700 overflow-hidden">
        <div className="flex items-center justify-between bg-zinc-800 px-3 py-2 border-b border-zinc-700">
          <span className="text-[11px] font-mono text-zinc-500">ApexTrader_Sync.{ext}</span>
          <div className="flex gap-2">
            <CopyButton text={code} label="Copiază codul" />
            <button
              onClick={downloadEA}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all"
            >
              <Download className="w-3 h-3" />
              Descarcă .{ext}
            </button>
          </div>
        </div>
        <div className="bg-zinc-900/80 overflow-y-auto max-h-40">
          <pre className="text-[10px] text-zinc-400 p-3 font-mono leading-relaxed whitespace-pre-wrap">
            {code.slice(0, 600)}
            {code.length > 600 && "\n... (copiază sau descarcă fișierul complet)"}
          </pre>
        </div>
      </div>

      <Button onClick={onDone}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold h-10">
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Am instalat EA-ul — Deschide contul
      </Button>

      <p className="text-center text-[11px] text-zinc-600">
        Tranzacțiile vor apărea după ce EA-ul detectează prima închidere de poziție.
      </p>
    </div>
  );
}

// ─── Step: CSV Import ─────────────────────────────────────────────────────────

function StepCSV({ onBack, onSuccess, onClose }: { onBack: () => void; onSuccess: () => void; onClose: () => void; }) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile]           = React.useState<File | null>(null);
  const [dragging, setDragging]   = React.useState(false);
  const [accountName, setAccName] = React.useState("");
  const [accountType, setType]    = React.useState<AccountTyp>("LIVE");
  const [currency, setCurrency]   = React.useState("USD");
  const [balance, setBalance]     = React.useState("");
  const [broker, setBroker]       = React.useState("");
  const [platform, setPlatform]   = React.useState<"mt4" | "mt5" | "ctrader">("mt5");
  const [loading, setLoading]     = React.useState(false);
  const [result, setResult]       = React.useState<{ imported: number; skipped: number; format: string } | null>(null);
  const [error, setError]         = React.useState("");

  async function handleImport() {
    if (!file) return;
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("accountName", accountName || `${platform.toUpperCase()} Import`);
      fd.append("accountType", accountType);
      fd.append("currency", currency);
      fd.append("balance", balance || "0");
      fd.append("broker", broker);
      const res = await fetch("/api/accounts/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Eroare la import"); return; }
      setResult({ imported: data.imported, skipped: data.skipped, format: data.format });
      toast({ title: `✅ ${data.imported} tranzacții importate!` });
      setTimeout(() => { onSuccess(); onClose(); }, 2000);
    } catch { setError("Eroare de rețea."); }
    finally { setLoading(false); }
  }

  if (result) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-zinc-100">{result.imported} tranzacții importate!</p>
          <p className="text-sm text-zinc-500">{result.skipped > 0 ? `${result.skipped} duplicate sărite · ` : ""}Format: {result.format}</p>
        </div>
      </div>
    );
  }

  const instructions: Record<typeof platform, string[]> = {
    mt4: ['MT4 → "Account History" → Click dreapta → "Save as Report" → HTML sau CSV'],
    mt5: ['MT5 → "History" → Click dreapta → "Save as Report" → HTML sau CSV'],
    ctrader: ["cTrader → History → Closed Positions → Export → CSV"],
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
        <ChevronLeft className="w-4 h-4" />Înapoi
      </button>
      <div className="grid grid-cols-3 gap-2">
        {(["mt4", "mt5", "ctrader"] as const).map((p) => (
          <button key={p} onClick={() => setPlatform(p)}
            className={cn("py-2 rounded-xl border text-sm font-bold transition-all",
              platform === p ? "bg-indigo-500/15 border-indigo-500/50 text-indigo-300"
                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300")}>
            {p === "ctrader" ? "cTrader" : p.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="bg-zinc-800/50 rounded-xl px-4 py-3 text-xs text-zinc-400 leading-relaxed">
        {instructions[platform]}
      </div>
      {!file ? (
        <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
          onClick={() => fileInputRef.current?.click()}
          className={cn("border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
            dragging ? "border-indigo-500/60 bg-indigo-500/10" : "border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/30")}>
          <Upload className="w-7 h-7 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-zinc-300">Trage fișierul sau <span className="text-indigo-400">apasă</span></p>
          <p className="text-xs text-zinc-600 mt-1">.html, .htm, .csv acceptate</p>
          <input ref={fileInputRef} type="file" className="hidden" accept=".html,.htm,.csv,.txt"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
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
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <label className="text-xs text-zinc-400">Nume cont <span className="text-zinc-600">(opțional)</span></label>
          <Input placeholder={`${platform.toUpperCase()} Cont`} value={accountName}
            onChange={(e) => setAccName(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-400">Broker</label>
          <Input placeholder="Ex: FTMO" value={broker}
            onChange={(e) => setBroker(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-400">Monedă</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {ACCOUNT_TYPES.map((t) => (
          <button key={t.value} onClick={() => setType(t.value)}
            className={cn("py-2 rounded-xl border text-sm font-semibold transition-all",
              accountType === t.value ? `${t.bg} ${t.color}` : "bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-zinc-600")}>
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
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Se procesează...</>
          : <><Upload className="w-4 h-4 mr-2" />Importă tranzacțiile</>}
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
    const method = isEdit ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
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
              {ACCOUNT_TYPES.map((t) => (
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
              <Input placeholder={watchType === "CHALLENGE" ? "Ex: FTMO $25K" : watchType === "LIVE" ? "Ex: IC Markets Live" : "Ex: Cont Demo"}
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
                  {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
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
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c} className="text-zinc-100">{c}</SelectItem>)}
                </SelectContent>
              </Select>
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
  const [eaAccountId, setEaAccountId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setStep(isEdit ? "form" : "method");
      setEaAccountId(null);
    }
  }, [open, isEdit]);

  const TITLES: Partial<Record<Step, string>> = {
    method:    "Adaugă cont de trading",
    "ea-form": "Conectare MT4 / MT5 — Detalii cont",
    "ea-code": "Instalează Expert Advisor",
    csv:       "Import fișier",
    form:      isEdit ? "Editează cont" : "Cont manual",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800/80 sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50">
        <DialogHeader>
          <DialogTitle className="text-zinc-100 text-base">{TITLES[step]}</DialogTitle>
        </DialogHeader>

        {step === "method" && (
          <StepMethod
            onSelect={(m) => {
              if (m === "ea")  setStep("ea-form");
              else if (m === "csv") setStep("csv");
              else              setStep("form");
            }}
          />
        )}

        {step === "ea-form" && (
          <StepEAForm
            onBack={() => setStep("method")}
            onAccountCreated={(id) => { setEaAccountId(id); setStep("ea-code"); }}
          />
        )}

        {step === "ea-code" && eaAccountId && (
          <StepEACode
            accountId={eaAccountId}
            onDone={() => { onSuccess(); onClose(); }}
          />
        )}

        {step === "csv" && (
          <StepCSV onBack={() => setStep("method")} onSuccess={onSuccess} onClose={onClose} />
        )}

        {step === "form" && (
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
