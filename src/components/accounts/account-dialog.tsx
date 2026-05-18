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
  Upload, FileText, X, Info, Wifi, WifiOff, Eye, EyeOff,
  Shield, Zap, Link2, Server, Hash, Lock, User2, ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConnectionMethod = "direct" | "csv" | "manual";
type Platform = "mt4" | "mt5" | "ctrader";
type Step = "method" | "platform" | "connect" | "connecting" | "success" | "csv" | "form";
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

// Popular brokers for autocomplete
const POPULAR_SERVERS = [
  "ICMarkets-Live", "ICMarkets-Demo", "FTMO-Server", "FTMO-Demo",
  "Pepperstone-Live", "Pepperstone-Demo", "Exness-Real", "Exness-Demo",
  "XM.COM-Real", "XM.COM-Demo3", "FusionMarkets-Live", "FusionMarkets-Demo",
  "MyFundedFX-Live", "GoatFundedTrader-Live", "E8-Live", "FundingPips-Live",
];

// ─── Step: Choose Method ──────────────────────────────────────────────────────

function StepMethod({ onSelect }: { onSelect: (m: ConnectionMethod) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400 mb-5">Cum vrei să conectezi contul de trading?</p>

      {/* Direct connection — PRIMARY */}
      <button
        onClick={() => onSelect("direct")}
        className="w-full flex items-center gap-4 p-4 rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-500/8 to-violet-500/5 hover:border-indigo-400/70 hover:from-indigo-500/15 hover:to-violet-500/10 transition-all text-left group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 relative">
          <Wifi className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="flex-1 relative">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold text-zinc-100">Conectare directă MT4/MT5</span>
            <Badge className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] px-1.5 py-0">
              Recomandat
            </Badge>
          </div>
          <p className="text-xs text-zinc-500">
            Introdu login-ul, parola de investitor și serverul — ca pe MyFXBook. Fără export manual.
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors shrink-0" />
      </button>

      {/* CSV import */}
      <button
        onClick={() => onSelect("csv")}
        className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all text-left group"
      >
        <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
          <Upload className="w-5 h-5 text-zinc-500" />
        </div>
        <div className="flex-1">
          <div className="mb-0.5">
            <span className="text-sm font-bold text-zinc-300">Import CSV / HTML</span>
          </div>
          <p className="text-xs text-zinc-500">Exportă istoricul din MT4/MT5/cTrader și importă fișierul.</p>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
      </button>

      {/* Manual */}
      <button
        onClick={() => onSelect("manual")}
        className="w-full flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all text-left group"
      >
        <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
          <User2 className="w-5 h-5 text-zinc-500" />
        </div>
        <div className="flex-1">
          <div className="mb-0.5">
            <span className="text-sm font-bold text-zinc-300">Manual</span>
          </div>
          <p className="text-xs text-zinc-500">Creează cont și adaugă tranzacțiile manual.</p>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
      </button>
    </div>
  );
}

// ─── Step: Direct Connect Form ────────────────────────────────────────────────

function StepConnect({
  onBack,
  onSuccess,
  onClose,
}: {
  onBack: () => void;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [platform, setPlatform] = React.useState<Platform>("mt5");
  const [accountType, setAccountType] = React.useState<AccountTyp>("LIVE");
  const [login, setLogin] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [server, setServer] = React.useState("");
  const [accountName, setAccountName] = React.useState("");
  const [currency, setCurrency] = React.useState("USD");
  const [maxDailyLoss, setMaxDailyLoss] = React.useState("");
  const [maxDrawdown, setMaxDrawdown] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [serverSuggestions, setServerSuggestions] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [connectStep, setConnectStep] = React.useState(0);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState<{ imported: number; message: string } | null>(null);
  const [leverage, setLeverage] = React.useState("100");

  const CONNECT_STEPS = [
    "Verificare date...",
    "Se conectează la broker...",
    "Sincronizare tranzacții...",
    "Salvare cont...",
  ];

  function filterServers(val: string) {
    setServer(val);
    if (val.length > 1) {
      setServerSuggestions(POPULAR_SERVERS.filter(s => s.toLowerCase().includes(val.toLowerCase())).slice(0, 5));
    } else {
      setServerSuggestions([]);
    }
  }

  async function handleConnect() {
    if (!login || !password || !server) {
      setError("Login, parolă și server sunt obligatorii.");
      return;
    }
    setError("");
    setLoading(true);
    setConnectStep(0);

    // Animate progress steps
    const stepInterval = setInterval(() => {
      setConnectStep(p => Math.min(p + 1, CONNECT_STEPS.length - 1));
    }, 1800);

    try {
      const res = await fetch("/api/integrations/metaapi/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login,
          password,
          server,
          platform,
          name: accountName || `${platform.toUpperCase()} ${server.split("-")[0]} ${login}`,
          accountType,
          currency,
          leverage: parseInt(leverage),
          maxDailyLossPct: maxDailyLoss ? parseFloat(maxDailyLoss) : undefined,
          maxDrawdownPct: maxDrawdown ? parseFloat(maxDrawdown) : undefined,
        }),
      });

      clearInterval(stepInterval);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Eroare la conectarea contului.");
        setLoading(false);
        return;
      }

      setConnectStep(CONNECT_STEPS.length - 1);
      setSuccess({ imported: data.imported ?? 0, message: data.message });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2500);
    } catch {
      clearInterval(stepInterval);
      setError("Eroare de rețea. Încearcă din nou.");
      setLoading(false);
    }
  }

  // ── Success screen ──
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <div className="text-center space-y-1.5">
          <p className="text-lg font-bold text-zinc-100">Cont conectat cu succes!</p>
          {success.imported > 0 && (
            <p className="text-sm text-emerald-400 font-semibold">
              {success.imported} tranzacții importate din ultimele 90 de zile
            </p>
          )}
          <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">{success.message}</p>
        </div>
      </div>
    );
  }

  // ── Connecting screen ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-2 border-indigo-500/30 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-2 border-t-indigo-500 border-r-indigo-500/50 border-b-transparent border-l-transparent animate-spin" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Wifi className="w-7 h-7 text-indigo-400" />
          </div>
        </div>
        <div className="w-full max-w-xs space-y-2.5">
          {CONNECT_STEPS.map((step, i) => (
            <div key={i} className={cn(
              "flex items-center gap-3 transition-all duration-500",
              i < connectStep ? "opacity-40" : i === connectStep ? "opacity-100" : "opacity-20"
            )}>
              <div className={cn(
                "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all",
                i < connectStep
                  ? "bg-emerald-500/20 border-emerald-500/50"
                  : i === connectStep
                  ? "border-indigo-500 bg-indigo-500/20"
                  : "border-zinc-700"
              )}>
                {i < connectStep
                  ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  : i === connectStep
                  ? <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
                  : null
                }
              </div>
              <span className={cn(
                "text-sm",
                i <= connectStep ? "text-zinc-300" : "text-zinc-600"
              )}>{step}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-600 text-center max-w-xs">
          Prima conectare poate dura până la 30 secunde. Nu închide fereastra.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
        <ChevronLeft className="w-4 h-4" />Înapoi
      </button>

      {/* Security note */}
      <div className="flex items-start gap-2.5 bg-indigo-500/8 border border-indigo-500/20 rounded-xl px-3.5 py-3">
        <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-indigo-300 mb-0.5">Conexiune securizată prin MetaAPI</p>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Folosim <strong className="text-zinc-400">parola de investitor (read-only)</strong> — nu poate plasa tranzacții.
            Datele sunt criptate și nu sunt stocate direct pe serverele noastre.
          </p>
        </div>
      </div>

      {/* Platform tabs */}
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Platformă</label>
        <div className="grid grid-cols-3 gap-2">
          {(["mt4", "mt5", "ctrader"] as Platform[]).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={cn(
                "py-2.5 rounded-xl border text-sm font-bold transition-all",
                platform === p
                  ? "bg-indigo-500/15 border-indigo-500/50 text-indigo-300"
                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              )}
            >
              {p === "mt4" ? "MT4" : p === "mt5" ? "MT5" : "cTrader"}
            </button>
          ))}
        </div>
      </div>

      {/* Account type */}
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Tip cont</label>
        <div className="grid grid-cols-3 gap-2">
          {ACCOUNT_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setAccountType(t.value)}
              className={cn(
                "py-2.5 rounded-xl border text-sm font-semibold transition-all",
                accountType === t.value
                  ? `${t.bg} ${t.color}`
                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Connection fields */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm text-zinc-300 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-zinc-500" />
            Număr cont (Login)
          </label>
          <Input
            placeholder="Ex: 12345678"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="bg-zinc-800/80 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-indigo-500/20 font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm text-zinc-300 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-zinc-500" />
            Parolă investitor (read-only)
          </label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Parola de investor/read-only"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-800/80 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-indigo-500/20 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5 relative">
          <label className="text-sm text-zinc-300 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-zinc-500" />
            Server broker
          </label>
          <Input
            placeholder="Ex: ICMarkets-Live, FTMO-Server"
            value={server}
            onChange={(e) => filterServers(e.target.value)}
            onBlur={() => setTimeout(() => setServerSuggestions([]), 200)}
            className="bg-zinc-800/80 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-indigo-500/20"
          />
          {serverSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden">
              {serverSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                  onClick={() => { setServer(s); setServerSuggestions([]); }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Optional fields - collapsible */}
      <details className="group">
        <summary className="cursor-pointer list-none flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-400 transition-colors select-none">
          <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
          Setări avansate (opțional)
        </summary>
        <div className="mt-3 space-y-3 pl-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Nume cont</label>
              <Input
                placeholder="Ex: FTMO $100K"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Monedă</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400">Levier</label>
            <select
              value={leverage}
              onChange={(e) => setLeverage(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {[10, 20, 30, 50, 100, 200, 400, 500].map((l) => (
                <option key={l} value={String(l)}>1:{l}</option>
              ))}
            </select>
          </div>

          {accountType === "CHALLENGE" && (
            <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-3 space-y-3">
              <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Reguli Prop Firm</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Pierdere zilnică max (%)</label>
                  <Input type="number" step="0.1" placeholder="Ex: 5" value={maxDailyLoss}
                    onChange={(e) => setMaxDailyLoss(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Drawdown max (%)</label>
                  <Input type="number" step="0.1" placeholder="Ex: 10" value={maxDrawdown}
                    onChange={(e) => setMaxDrawdown(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" />
                </div>
              </div>
            </div>
          )}
        </div>
      </details>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      <Button
        onClick={handleConnect}
        disabled={!login || !password || !server || loading}
        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-lg shadow-indigo-500/20 h-11"
      >
        <Wifi className="w-4 h-4 mr-2" />
        Conectează contul
      </Button>

      <p className="text-center text-[11px] text-zinc-600">
        Nu ai parola de investitor? În MT5: Setări → Schimbă parolă → Parola investitor
      </p>
    </div>
  );
}

// ─── Step: CSV Import ─────────────────────────────────────────────────────────

function StepCSV({
  onBack,
  onSuccess,
  onClose,
}: {
  onBack: () => void;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [accountName, setAccountName] = React.useState("");
  const [accountType, setAccountType] = React.useState<AccountTyp>("LIVE");
  const [currency, setCurrency] = React.useState("USD");
  const [balance, setBalance] = React.useState("");
  const [broker, setBroker] = React.useState("");
  const [platform, setPlatform] = React.useState<"mt4" | "mt5" | "ctrader">("mt5");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ imported: number; skipped: number; format: string } | null>(null);
  const [error, setError] = React.useState("");

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0]; if (f) setFile(f);
  }

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
          <p className="text-sm text-zinc-400">Format: {result.format}</p>
        </div>
      </div>
    );
  }

  const instructions: Record<typeof platform, string[]> = {
    mt4: ["Deschide MT4", 'Click dreapta pe "Account History"', '"Save as Report" → HTML sau CSV', "Încarcă fișierul mai jos"],
    mt5: ["Deschide MT5", '"History" → Click dreapta', '"Save as Report" → HTML sau CSV', "Încarcă fișierul mai jos"],
    ctrader: ["Deschide cTrader", "History → Closed Positions", '"Export" → CSV', "Încarcă fișierul mai jos"],
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
        <ChevronLeft className="w-4 h-4" />Înapoi
      </button>

      <div className="grid grid-cols-3 gap-2">
        {(["mt4", "mt5", "ctrader"] as const).map((p) => (
          <button key={p} onClick={() => setPlatform(p)}
            className={cn("py-2 rounded-xl border text-sm font-bold transition-all",
              platform === p ? "bg-indigo-500/15 border-indigo-500/50 text-indigo-300" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300")}>
            {p === "ctrader" ? "cTrader" : p.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="bg-zinc-800/40 rounded-xl p-3.5 space-y-2">
        {instructions[platform].map((ins, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <p className="text-xs text-zinc-400">{ins}</p>
          </div>
        ))}
      </div>

      {!file ? (
        <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)} onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn("border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all",
            dragging ? "border-indigo-500/60 bg-indigo-500/10" : "border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/30")}>
          <Upload className="w-7 h-7 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-zinc-300">Trage fișierul sau <span className="text-indigo-400">alege</span></p>
          <p className="text-xs text-zinc-600 mt-1">HTML sau CSV din {platform.toUpperCase()}</p>
          <input ref={fileInputRef} type="file" className="hidden" accept=".html,.htm,.csv,.txt" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
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
          <label className="text-xs text-zinc-400">Nume cont</label>
          <Input placeholder="Ex: FTMO $100K MT5" value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
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
        <div className="col-span-2 space-y-1.5">
          <label className="text-xs text-zinc-400">Balanță cont (opțional)</label>
          <Input type="number" step="0.01" placeholder="Ex: 100000" value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ACCOUNT_TYPES.map((t) => (
          <button key={t.value} onClick={() => setAccountType(t.value)}
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
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-10">
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Se procesează...</> : <><Upload className="w-4 h-4 mr-2" />Importă tranzacțiile</>}
      </Button>
    </div>
  );
}

// ─── Step: Manual Form ────────────────────────────────────────────────────────

function StepForm({
  prefill, isEdit, onBack, onClose, onSuccess,
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
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white">
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

  const TITLES: Partial<Record<Step, string>> = {
    method: "Adaugă cont de trading",
    platform: "Alege platforma",
    connect: "Conectare directă MT4/MT5",
    connecting: "Se conectează...",
    success: "Succes!",
    csv: "Import fișier",
    form: isEdit ? "Editează cont" : "Cont manual",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800/80 sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50">
        <DialogHeader>
          <DialogTitle className="text-zinc-100 text-base">{TITLES[step]}</DialogTitle>
        </DialogHeader>

        {step === "method" && (
          <StepMethod onSelect={(m) => {
            if (m === "direct") setStep("connect");
            else if (m === "csv") setStep("csv");
            else setStep("form");
          }} />
        )}

        {step === "connect" && (
          <StepConnect onBack={() => setStep("method")} onSuccess={onSuccess} onClose={onClose} />
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
