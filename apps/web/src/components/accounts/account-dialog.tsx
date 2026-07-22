"use client";

import { useTranslations } from "next-intl";
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

type Step = "method" | "ea" | "metaapi" | "csv" | "form";
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
    lastSyncedAt?: string | null;
    brokerSource?: string | null;
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
  const t = useTranslations("accountDialog");
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
      {copied ? t("copied") : t("copyEaCode")}
    </button>
  );
}

// ─── Step: Choose Method ──────────────────────────────────────────────────────

function StepMethod({ onSelect }: { onSelect: (s: Step) => void }) {
  const t = useTranslations("accountDialog");
  return (
    <div className="space-y-3">
      {/* EA — PRIMARY */}
      <button
        onClick={() => onSelect("ea")}
        className="w-full flex items-start gap-4 p-5 rounded-2xl border-2 border-indigo-500/50 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 hover:border-indigo-400/80 hover:from-indigo-500/18 transition-all text-left group relative overflow-hidden"
      >
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-2xl">
          🔌
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-bold text-white text-base">{t("eaTitle")}</span>
            <Badge className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] px-1.5 py-0">{t("recommended")}</Badge>
            <Badge className="bg-zinc-700/60 border border-zinc-700 text-zinc-400 text-[10px] px-1.5 py-0">{t("free")}</Badge>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {t("eaDesc")}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-indigo-400 transition-colors shrink-0 mt-1" />
      </button>

      {/* MetaAPI — conectare automată cu credențiale */}
      <button
        onClick={() => onSelect("metaapi")}
        className="w-full flex items-start gap-4 p-5 rounded-2xl border-2 border-sky-500/40 bg-gradient-to-br from-sky-500/10 to-cyan-500/5 hover:border-sky-400/70 hover:from-sky-500/16 transition-all text-left group relative overflow-hidden"
      >
        <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0 text-2xl">
          ⚡
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-bold text-white text-base">{t("metaapiTitle")}</span>
            <Badge className="bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[10px] px-1.5 py-0">{t("cloud247")}</Badge>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {t("metaapiDesc")}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-sky-400 transition-colors shrink-0 mt-1" />
      </button>

      {/* CSV + Manual — secundare, mai mici */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onSelect("csv")}
          className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 text-lg">📄</div>
          <div>
            <p className="font-semibold text-zinc-300 text-sm">{t("csvTitle")}</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">{t("csvSub")}</p>
          </div>
        </button>

        <button
          onClick={() => onSelect("form")}
          className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 text-lg">✏️</div>
          <div>
            <p className="font-semibold text-zinc-300 text-sm">{t("manualTitle")}</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">{t("manualSub")}</p>
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── Step: EA Connect ─────────────────────────────────────────────────────────

interface EAData { eaMQ4: string; eaMQ5: string; appDomain: string; webhookUrl: string; token: string; }

function StepEA({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const t = useTranslations("accountDialog");
  const [platform, setPlatform]   = React.useState<"mt4" | "mt5">("mt5");
  const [ea, setEa]               = React.useState<EAData | null>(null);
  const [loading, setLoading]     = React.useState(true);
  const [downloaded, setDl]       = React.useState(false);
  const [hasCompiled, setHasComp] = React.useState<boolean | null>(null);
  const [testState, setTestState] = React.useState<"idle" | "testing" | "ok" | "error">("idle");
  const [testMsg, setTestMsg]     = React.useState("");

  React.useEffect(() => {
    fetch("/api/me/ea")
      .then(r => r.json())
      .then(d => { setEa(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function testConnection() {
    setTestState("testing"); setTestMsg("");
    try {
      // Server-side test — avoids browser CORS/network restrictions
      const res = await fetch("/api/me/test-ea", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setTestState("ok");
        const s = data.body?.status;
        setTestMsg(t("webhookOk", { detail: s === "created" ? t("wCreated") : s === "updated" ? t("wUpdated") : t("wStatus", { status: data.status }) }));
      } else {
        setTestState("error");
        const detail = data.error ?? data.body?.error ?? JSON.stringify(data.body ?? data);
        setTestMsg(`❌ ${data.status ?? res.status}: ${detail}`);
      }
    } catch (e) {
      setTestState("error");
      setTestMsg(`❌ ${e instanceof Error ? e.message : t("errUnknown")}`);
    }
  }

  // Check if pre-compiled file exists in /public/ea/
  React.useEffect(() => {
    const ext = platform === "mt4" ? "ex4" : "ex5";
    fetch(`/ea/TradeGx.${ext}`, { method: "HEAD" })
      .then(r => setHasComp(r.ok))
      .catch(() => setHasComp(false));
  }, [platform]);

  const code = platform === "mt4" ? ea?.eaMQ4 : ea?.eaMQ5;
  const ext  = platform === "mt4" ? "mq4" : "mq5";
  const cext = platform === "mt4" ? "ex4" : "ex5";

  function downloadEA() {
    setDl(true);
    if (hasCompiled) {
      // Download pre-compiled binary — no compilation needed
      window.open(`/ea/TradeGx.${cext}`, "_blank");
    } else if (code) {
      // Fallback: download source
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
      a.download = `TradeGx.${ext}`;
      a.click();
    }
  }

  const fileLabel = hasCompiled ? `TradeGx.${cext}` : `TradeGx.${ext}`;
  const fileNote  = hasCompiled ? t("fileNoteReady") : t("fileNoteSource");

  const richTags = {
    b: (c: React.ReactNode) => <b>{c}</b>,
    s: (c: React.ReactNode) => <span className="text-zinc-500 text-[10px]">{c}</span>,
  };
  const steps = [
    { icon: "📂", text: t.rich(platform === "mt4" ? "step1Mt4" : "step1Mt5", { file: fileLabel, ...richTags }) },
    { icon: "🔄", text: t.rich("step2", richTags) },
    { icon: "⚙️", text: t.rich("step3", richTags) },
    { icon: "🖱️", text: t.rich("step4", richTags) },
  ];

  return (
    <div className="flex flex-col gap-2.5">
      {/* Back + tabs on same row */}
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors text-xs shrink-0">
          <ChevronLeft className="w-3.5 h-3.5" />{t("back")}
        </button>
        <div className="flex-1 grid grid-cols-2 gap-1.5">
          {(["mt4", "mt5"] as const).map(p => (
            <button key={p} onClick={() => { setPlatform(p); setDl(false); }}
              className={cn("py-1.5 rounded-lg border text-xs font-bold transition-all",
                platform === p
                  ? "bg-indigo-500/15 border-indigo-500/50 text-indigo-300"
                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300")}>
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
        </div>
      ) : ea ? (<>

        {/* ── Credentials ─────────────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            {t("yourData", { platform: platform.toUpperCase() })}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-600 w-14 shrink-0">URL</span>
            <code className="flex-1 text-[10px] text-indigo-300 bg-zinc-800 px-2 py-1.5 rounded-lg font-mono truncate min-w-0">
              {ea.webhookUrl}
            </code>
            <CopyBtn text={ea.webhookUrl} className="shrink-0 px-2 py-1.5 text-[10px] gap-1" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-600 w-14 shrink-0">Token</span>
            <code className="flex-1 text-[10px] text-emerald-300 bg-zinc-800 px-2 py-1.5 rounded-lg font-mono truncate min-w-0">
              {ea.token}
            </code>
            <CopyBtn text={ea.token} className="shrink-0 px-2 py-1.5 text-[10px] gap-1" />
          </div>
        </div>

        {/* ── Test Connection ──────────────────────────────────────── */}
        <button
          onClick={testConnection}
          disabled={testState === "testing"}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all",
            testState === "ok"    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300" :
            testState === "error" ? "bg-rose-500/15 border-rose-500/30 text-rose-300" :
            "bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
          )}
        >
          {testState === "testing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plug className="w-3.5 h-3.5" />}
          {testState === "testing" ? t("testing") : testState === "idle" ? t("testConn") : testMsg}
        </button>

        {/* ── Download ─────────────────────────────────────────────── */}
        <button
          onClick={downloadEA}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all",
            downloaded
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
              : "bg-indigo-500/10 border-indigo-500/40 text-indigo-200 hover:bg-indigo-500/20 hover:border-indigo-400/60 active:scale-[0.98]"
          )}
        >
          {downloaded ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          {downloaded ? t("downloaded") : t("downloadFile", { file: fileLabel })}
          <span className="text-[10px] font-normal opacity-50 ml-1">{fileNote}</span>
        </button>

        {/* ── Steps ────────────────────────────────────────────────── */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-2">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{t("install4")}</p>
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-sm leading-none mt-0.5 shrink-0">{s.icon}</span>
              <p className="text-xs text-zinc-300 leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>

      </>) : (
        <div className="text-center py-4 text-sm text-rose-400">{t("errReload")}</div>
      )}

      <Button onClick={onDone}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold h-9 text-sm">
        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
        {t("installed")}
      </Button>

      <p className="text-center text-[10px] text-zinc-600">
        {t("appearsAuto", { platform: platform.toUpperCase() })}
      </p>
    </div>
  );
}

// ─── Step: MetaAPI Connect (login/parolă/server) ─────────────────────────────

function StepMetaApi({ onBack, onSuccess, onClose }: { onBack: () => void; onSuccess: () => void; onClose: () => void }) {
  const t = useTranslations("accountDialog");
  const { toast } = useToast();
  const [platform, setPlatform] = React.useState<"mt4" | "mt5">("mt5");
  const [login, setLogin]       = React.useState("");
  const [password, setPassword] = React.useState("");
  const [server, setServer]     = React.useState("");
  const [name, setName]         = React.useState("");
  const [type, setType]         = React.useState<AccountTyp>("LIVE");
  const [currency, setCurrency] = React.useState("USD");
  const [loading, setLoading]   = React.useState(false);
  const [error, setError]       = React.useState("");

  async function connect() {
    if (!login.trim() || !password || !server.trim()) {
      setError(t("credsRequired"));
      return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/integrations/metaapi/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: login.trim(), password, server: server.trim(), platform,
          name: name.trim() || undefined, accountType: type, currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? t("connectErr")); return; }
      toast({ title: t("connectedTitle"), description: data.message ?? t("syncingDesc") });
      onSuccess(); onClose();
    } catch {
      setError(t("netErr"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
        <ChevronLeft className="w-4 h-4" />{t("back")}
      </button>

      {/* Platformă */}
      <div className="grid grid-cols-2 gap-2">
        {(["mt4", "mt5"] as const).map(p => (
          <button key={p} onClick={() => setPlatform(p)}
            className={cn("py-2 rounded-xl border text-sm font-bold transition-all",
              platform === p ? "bg-sky-500/15 border-sky-500/50 text-sky-300"
                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300")}>
            {p.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Credențiale */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">{t("loginLabel")}</label>
            <Input value={login} onChange={e => setLogin(e.target.value)} inputMode="numeric"
              placeholder="12345678" className="bg-zinc-800 border-zinc-700 text-zinc-100 font-mono placeholder:text-zinc-600" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">{t("passwordLabel")}</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" />
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-400 block mb-1">{t("serverLabel")}</label>
          <Input value={server} onChange={e => setServer(e.target.value)}
            placeholder={t("serverPlaceholder")}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 font-mono placeholder:text-zinc-600" />
          <p className="text-[10px] text-zinc-600 mt-1">{t("serverHint")}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">{t("nameLabel")}</label>
            <Input value={name} onChange={e => setName(e.target.value)}
              placeholder={t("namePlaceholderMeta")} className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">{t("currencyLabel")}</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-sky-500">
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        {/* Tip cont */}
        <div className="grid grid-cols-3 gap-2">
          {ACCOUNT_TYPES.map(t => (
            <button key={t.value} onClick={() => setType(t.value)}
              className={cn("py-2 rounded-xl border text-sm font-semibold transition-all",
                type === t.value ? `${t.bg} ${t.color}` : "bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-zinc-600")}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notă securitate */}
      <div className="flex items-start gap-2 bg-sky-500/8 border border-sky-500/20 rounded-xl px-3 py-2.5">
        <AlertCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          {t.rich("securityNote", { b: (c) => <b className="text-sky-300">{c}</b> })}
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      <Button onClick={connect} disabled={loading}
        className="w-full bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-semibold h-10 shadow-lg shadow-sky-500/20">
        {loading
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("connecting")}</>
          : <><Plug className="w-4 h-4 mr-2" />{t("connectAccount")}</>}
      </Button>
    </div>
  );
}

// ─── Step: CSV Import ─────────────────────────────────────────────────────────

function StepCSV({ onBack, onSuccess, onClose }: { onBack: () => void; onSuccess: () => void; onClose: () => void }) {
  const t = useTranslations("accountDialog");
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
      if (!res.ok) { setError(data.error ?? t("importErr")); return; }
      setDone(true);
      toast({ title: t("importedToast", { n: data.imported }) });
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch { setError(t("netErrShort")); }
    finally { setLoading(false); }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-emerald-400" />
        </div>
        <p className="font-bold text-zinc-100">{t("importDone")}</p>
      </div>
    );
  }

  const hint: Record<typeof platform, string> = {
    mt4: t("hintMt4"),
    mt5: t("hintMt5"),
    ctrader: t("hintCtrader"),
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
        <ChevronLeft className="w-4 h-4" />{t("back")}
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
          <p className="text-sm text-zinc-300">{t.rich("dropOrClick", { a: (c) => <span className="text-indigo-400">{c}</span> })}</p>
          <p className="text-xs text-zinc-600 mt-1">{t("fileTypes")}</p>
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
          <label className="text-xs text-zinc-400">{t("brokerLabel")} <span className="text-zinc-600">{t("optional")}</span></label>
          <Input placeholder={t("brokerPlaceholder")} value={broker} onChange={e => setBroker(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-400">{t("currency")}</label>
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
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("processing")}</> : <><Upload className="w-4 h-4 mr-2" />{t("importBtn")}</>}
      </Button>
    </div>
  );
}

// ─── Step: Manual Form ────────────────────────────────────────────────────────

function StepForm({ prefill, isEdit, locked, onBack, onClose, onSuccess }: {
  prefill?: Partial<TradingAccountInput & { id?: string }>;
  isEdit: boolean; locked?: boolean; onBack?: () => void; onClose: () => void; onSuccess: () => void;
}) {
  const t = useTranslations("accountDialog");
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
      toast({ title: t("errTitle"), description: err.error ?? t("errGeneric"), variant: "destructive" });
      return;
    }
    toast({ title: isEdit ? t("accUpdated") : t("accCreated"), description: data.name });
    onSuccess(); onClose();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {onBack && (
          <button type="button" onClick={onBack}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" />{t("back")}
          </button>
        )}

        <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-zinc-300 text-xs uppercase tracking-wider">{t("accountType")}</FormLabel>
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
            <FormLabel className="text-zinc-300">{t("accountName")}</FormLabel>
            <FormControl>
              <Input
                placeholder={watchType === "CHALLENGE" ? t("namePhChallenge") : watchType === "LIVE" ? t("namePhLive") : t("namePhDemo")}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="broker" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300">{t("broker")}</FormLabel>
              <FormControl>
                <Input placeholder={t("brokerPh")} className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600" {...field} />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="accountNumber" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300">{t("accountNumber")}</FormLabel>
              <FormControl>
                <Input placeholder="12345678" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 font-mono" {...field} />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="balance" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300 flex items-center gap-1.5">
                {t("balance")}
                {locked && <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 rounded px-1.5 py-0.5">AUTO</span>}
              </FormLabel>
              <FormControl>
                <Input type="number" step="0.01"
                  disabled={locked}
                  readOnly={locked}
                  className={cn("bg-zinc-800 border-zinc-700 text-zinc-100",
                    locked && "opacity-60 cursor-not-allowed")}
                  {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
              </FormControl>
              {locked && (
                <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                  {t("balanceLocked")}
                </p>
              )}
            </FormItem>
          )} />
          <FormField control={form.control} name="currency" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300">{t("currency")}</FormLabel>
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
              <FormLabel className="text-zinc-300">{t("leverage")}</FormLabel>
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
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">{t("propRules")}</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="maxDailyLossPct" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300 text-xs">{t("maxDailyLoss")}</FormLabel>
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
                  <FormLabel className="text-zinc-300 text-xs">{t("maxDrawdown")}</FormLabel>
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
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">{t("cancel")}</Button>
          )}
          <Button type="submit" disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20">
            {isSubmitting
              ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />{t("saving")}</>
              : isEdit ? t("saveChanges") : t("createAccount")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────

export function AccountDialog({ open, onClose, onSuccess, account }: AccountDialogProps) {
  const isEdit = !!account;
  // An auto-synced account (EA / MetaApi) owns its balance — lock that field.
  const isLocked = !!account && (
    account.lastSyncedAt != null ||
    (account.brokerSource != null && account.brokerSource !== "MANUAL")
  );
  const t = useTranslations("accountDialog");
  const [step, setStep] = React.useState<Step>(isEdit ? "form" : "method");

  React.useEffect(() => {
    if (open) setStep(isEdit ? "form" : "method");
  }, [open, isEdit]);

  const TITLES: Record<Step, string> = {
    method:  t("titleMethod"),
    ea:      t("titleEa"),
    metaapi: t("titleMetaapi"),
    csv:     t("titleCsv"),
    form:    isEdit ? t("titleFormEdit") : t("titleFormNew"),
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800/80 sm:max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl shadow-black/50">
        <DialogHeader>
          <DialogTitle className="text-zinc-100 text-base">{TITLES[step]}</DialogTitle>
        </DialogHeader>

        {step === "method"  && <StepMethod onSelect={setStep} />}
        {step === "ea"      && <StepEA onBack={() => setStep("method")} onDone={() => { onSuccess(); onClose(); }} />}
        {step === "metaapi" && <StepMetaApi onBack={() => setStep("method")} onSuccess={onSuccess} onClose={onClose} />}
        {step === "csv"     && <StepCSV onBack={() => setStep("method")} onSuccess={onSuccess} onClose={onClose} />}
        {step === "form"   && (
          <StepForm
            prefill={isEdit ? { ...account, id: account?.id } as any : undefined}
            isEdit={isEdit}
            locked={isLocked}
            onBack={isEdit ? undefined : () => setStep("method")}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
