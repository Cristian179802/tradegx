"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, Loader2, Copy, Check, Smartphone, KeyRound, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function SecurityTab({ initialEnabled, initialBackupCount }: { initialEnabled: boolean; initialBackupCount: number }) {
  const t = useTranslations("settings.security");
  const { toast } = useToast();

  const [enabled, setEnabled] = React.useState(initialEnabled);
  const [backupCount, setBackupCount] = React.useState(initialBackupCount);
  const [phase, setPhase] = React.useState<"idle" | "setup">("idle");
  const [setup, setSetup] = React.useState<{ secret: string; qr: string } | null>(null);
  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [backupCodes, setBackupCodes] = React.useState<string[] | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  async function post(url: string, body?: object) {
    const res = await fetch(url, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json().catch(() => ({}));
  }

  async function startSetup() {
    setBusy(true);
    const json = await post("/api/2fa/setup");
    setBusy(false);
    if (json.ok) { setSetup({ secret: json.secret, qr: json.qr }); setPhase("setup"); setCode(""); }
    else toast({ title: t("errGeneric"), variant: "destructive" });
  }

  async function confirmEnable() {
    if (!/^\d{6}$/.test(code.trim())) { toast({ title: t("invalidCode"), variant: "destructive" }); return; }
    setBusy(true);
    const json = await post("/api/2fa/enable", { code: code.trim() });
    setBusy(false);
    if (json.ok) {
      setBackupCodes(json.backupCodes); setEnabled(true); setBackupCount(json.backupCodes.length);
      setPhase("idle"); setSetup(null); setCode("");
      toast({ title: t("enabledToast") });
    } else toast({ title: t("invalidCode"), variant: "destructive" });
  }

  async function disable() {
    setBusy(true);
    const json = await post("/api/2fa/disable", { password, code: code.trim() });
    setBusy(false);
    if (json.ok) {
      setEnabled(false); setBackupCodes(null); setPassword(""); setCode(""); setBackupCount(0);
      toast({ title: t("disabledToast") });
    } else toast({ title: t(json.code === "invalid_password" ? "invalidPassword" : "invalidCode"), variant: "destructive" });
  }

  async function regenerate() {
    setBusy(true);
    const json = await post("/api/2fa/backup", { code: code.trim() });
    setBusy(false);
    if (json.ok) { setBackupCodes(json.backupCodes); setBackupCount(json.backupCodes.length); setCode(""); toast({ title: t("backupRegenerated") }); }
    else toast({ title: t("invalidCode"), variant: "destructive" });
  }

  function copyBackup() {
    if (!backupCodes) return;
    navigator.clipboard.writeText(backupCodes.join("\n")).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const card = "rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6";

  // ── Ecran: coduri de rezervă (afișate o singură dată) ──
  if (backupCodes) {
    return (
      <div className={card}>
        <div className="flex items-center gap-2 mb-2">
          <KeyRound className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-zinc-100">{t("backupTitle")}</h3>
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/90 leading-relaxed">{t("backupWarning")}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {backupCodes.map((c) => (
            <div key={c} className="font-mono text-sm text-zinc-200 bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2 text-center tracking-wider">{c}</div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button onClick={copyBackup} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-2">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? t("copied") : t("copy")}
          </Button>
          <Button onClick={() => setBackupCodes(null)} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white">
            {t("savedIt")}
          </Button>
        </div>
      </div>
    );
  }

  // ── Ecran: configurare (QR + verificare) ──
  if (phase === "setup" && setup) {
    return (
      <div className={card}>
        <div className="flex items-center gap-2 mb-1">
          <Smartphone className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-zinc-100">{t("setupTitle")}</h3>
        </div>
        <p className="text-sm text-zinc-500 mb-5">{t("setupDesc")}</p>

        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setup.qr} alt="QR" width={200} height={200} className="rounded-xl border border-zinc-700 bg-white p-2 shrink-0" />
          <div className="flex-1 w-full">
            <p className="text-xs text-zinc-500 mb-1.5">{t("manualKey")}</p>
            <code className="block text-xs font-mono text-zinc-300 bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2 break-all mb-4">{setup.secret}</code>
            <p className="text-xs text-zinc-400 mb-1.5">{t("enterCode")}</p>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="000000"
              className="bg-zinc-900 border-zinc-700 text-white text-center text-lg font-mono tracking-[0.4em] max-w-[200px]"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={confirmEnable} disabled={busy} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {t("verifyEnable")}
          </Button>
          <Button onClick={() => { setPhase("idle"); setSetup(null); setCode(""); }} variant="ghost" className="text-zinc-500">
            {t("cancel")}
          </Button>
        </div>
      </div>
    );
  }

  // ── Ecran: stare (activat / dezactivat) ──
  return (
    <div className={card}>
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className={`w-5 h-5 ${enabled ? "text-emerald-400" : "text-zinc-500"}`} />
        <h3 className="text-base font-bold text-zinc-100">{t("title")}</h3>
        {enabled && <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-2 py-0.5">{t("active")}</span>}
      </div>
      <p className="text-sm text-zinc-500 mb-5 max-w-xl">{t("subtitle")}</p>

      {!enabled ? (
        <Button onClick={startSetup} disabled={busy} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          {t("enable")}
        </Button>
      ) : (
        <div className="space-y-6">
          <p className="text-xs text-zinc-500">{t("backupRemaining", { n: backupCount })}</p>

          {/* Regenerare coduri */}
          <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/40 p-4">
            <p className="text-sm font-semibold text-zinc-200 mb-1">{t("regenTitle")}</p>
            <p className="text-xs text-zinc-500 mb-3">{t("regenDesc")}</p>
            <div className="flex gap-2 items-center flex-wrap">
              <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="000000"
                className="bg-zinc-900 border-zinc-700 text-white text-center font-mono tracking-widest max-w-[140px]" />
              <Button onClick={regenerate} disabled={busy || code.length !== 6} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-2">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                {t("regenBtn")}
              </Button>
            </div>
          </div>

          {/* Dezactivare */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.04] p-4">
            <p className="text-sm font-semibold text-rose-300 mb-1">{t("disableTitle")}</p>
            <p className="text-xs text-zinc-500 mb-3">{t("disableDesc")}</p>
            <div className="grid sm:grid-cols-2 gap-2 mb-3 max-w-md">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("password")}
                className="bg-zinc-900 border-zinc-700 text-white" />
              <Input value={code} onChange={(e) => setCode(e.target.value.trim())} placeholder={t("codeOrBackup")}
                className="bg-zinc-900 border-zinc-700 text-white font-mono" />
            </div>
            <Button onClick={disable} disabled={busy || !password || !code} variant="outline"
              className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10 gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {t("disableBtn")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
