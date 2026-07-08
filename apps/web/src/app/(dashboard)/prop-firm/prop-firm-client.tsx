"use client";

import { useTranslations, useLocale } from "next-intl";
import * as React from "react";
import {
  Shield, Target, TrendingDown, CalendarCheck, Settings2, Loader2,
  CheckCircle2, XCircle, Clock, AlertTriangle, Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Rules {
  propFirm: string | null;
  profitTarget: number | null;
  maxDailyLossPct: number | null;
  maxDrawdownPct: number | null;
  minTradingDays: number | null;
}
interface Progress {
  netPnl: number; profitPct: number; dailyLossPct: number; maxDrawdownPct: number; tradingDays: number;
}
interface Account {
  id: string; name: string; type: string; currency: string;
  initialBalance: number; balance: number;
  rules: Rules; progress: Progress;
  status: "PASSED" | "FAILED" | "IN_PROGRESS" | "NO_RULES";
}

// Presetări reguli — valori reprezentative (verifică regulile exacte ale programului tău)
const PRESETS: { name: string; profitTarget: number | null; maxDailyLossPct: number | null; maxDrawdownPct: number | null; minTradingDays: number | null }[] = [
  { name: "FTMO",        profitTarget: 10, maxDailyLossPct: 5, maxDrawdownPct: 10, minTradingDays: 4 },
  { name: "The5ers",     profitTarget: 8,  maxDailyLossPct: 5, maxDrawdownPct: 10, minTradingDays: 3 },
  { name: "FundedNext",  profitTarget: 8,  maxDailyLossPct: 5, maxDrawdownPct: 10, minTradingDays: 5 },
  { name: "MyFundedFX",  profitTarget: 8,  maxDailyLossPct: 5, maxDrawdownPct: 12, minTradingDays: 0 },
  { name: "Custom",      profitTarget: null, maxDailyLossPct: null, maxDrawdownPct: null, minTradingDays: null },
];

const STATUS_CFG = {
  PASSED:      { label: "passed", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", Icon: CheckCircle2 },
  FAILED:      { label: "failed",    cls: "bg-rose-500/15 text-rose-300 border-rose-500/30",          Icon: XCircle },
  IN_PROGRESS: { label: "inProgress", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30", Icon: Clock },
  NO_RULES:    { label: "noRules",    cls: "bg-zinc-700/40 text-zinc-400 border-zinc-600/40",     Icon: Settings2 },
};

function money(n: number, c: string, locale: string) {
  return new Intl.NumberFormat(locale === "ro" ? "ro-RO" : "en-US", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);
}

// Bară "progres spre obiectiv" (verde, bine să umpli)
function GoalBar({ value, target, unit = "%" }: { value: number; target: number | null; unit?: string }) {
  const t = useTranslations("propFirmPage");
  if (target == null) return <p className="text-[11px] text-zinc-600">{t("noLimitSet")}</p>;
  const pct = target > 0 ? Math.max(0, Math.min(100, (value / target) * 100)) : 0;
  const done = value >= target;
  return (
    <>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: done ? "linear-gradient(90deg,#059669,#34d399)" : "linear-gradient(90deg,#4f46e5,#818cf8)" }} />
      </div>
      <p className="text-[11px] text-zinc-500 mt-1">{value}{unit} {t("of")} {target}{unit} {done && <span className="text-emerald-400">✓</span>}</p>
    </>
  );
}

// Bară "consum spre limită" (roșu, rău să umpli — alertă la apropiere)
function LimitBar({ value, limit, unit = "%" }: { value: number; limit: number | null; unit?: string }) {
  const t = useTranslations("propFirmPage");
  if (limit == null) return <p className="text-[11px] text-zinc-600">{t("noLimitSet")}</p>;
  const pct = limit > 0 ? Math.max(0, Math.min(100, (value / limit) * 100)) : 0;
  const danger = pct >= 80;
  const breached = value >= limit;
  return (
    <>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: breached || danger ? "linear-gradient(90deg,#e11d48,#fb7185)" : "linear-gradient(90deg,#f59e0b,#fbbf24)" }} />
      </div>
      <p className={cn("text-[11px] mt-1", danger ? "text-rose-400" : "text-zinc-500")}>
        {value}{unit} {t("of")} {limit}{unit} {breached ? <span className="text-rose-400">{t("breached")}</span> : danger ? <span className="text-rose-400">{t("warning")}</span> : ""}
      </p>
    </>
  );
}

function AccountCard({ acc, onSaved }: { acc: Account; onSaved: () => void }) {
  const t = useTranslations("propFirmPage");
  const locale = useLocale();
  const { toast } = useToast();
  const [editing, setEditing] = React.useState(acc.status === "NO_RULES");
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    propFirm: acc.rules.propFirm ?? "",
    profitTarget: acc.rules.profitTarget?.toString() ?? "",
    maxDailyLossPct: acc.rules.maxDailyLossPct?.toString() ?? "",
    maxDrawdownPct: acc.rules.maxDrawdownPct?.toString() ?? "",
    minTradingDays: acc.rules.minTradingDays?.toString() ?? "",
  });

  function applyPreset(name: string) {
    const p = PRESETS.find((x) => x.name === name)!;
    setForm({
      propFirm: name,
      profitTarget: p.profitTarget?.toString() ?? "",
      maxDailyLossPct: p.maxDailyLossPct?.toString() ?? "",
      maxDrawdownPct: p.maxDrawdownPct?.toString() ?? "",
      minTradingDays: p.minTradingDays?.toString() ?? "",
    });
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/propfirm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: acc.id,
          propFirm: form.propFirm || null,
          profitTarget: form.profitTarget ? Number(form.profitTarget) : null,
          maxDailyLossPct: form.maxDailyLossPct ? Number(form.maxDailyLossPct) : null,
          maxDrawdownPct: form.maxDrawdownPct ? Number(form.maxDrawdownPct) : null,
          minTradingDays: form.minTradingDays ? Number(form.minTradingDays) : null,
        }),
      });
      if (!res.ok) throw new Error();
      toast({ title: t("savedTitle"), description: t("savedDesc") });
      setEditing(false);
      onSaved();
    } catch {
      toast({ title: t("errTitle"), description: t("errDesc"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const st = STATUS_CFG[acc.status];
  const p = acc.progress;
  const r = acc.rules;

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden premium-card",
      acc.status === "FAILED" ? "border-rose-500/30" : acc.status === "PASSED" ? "border-emerald-500/30" : "border-zinc-800/70"
    )} style={{ background: "linear-gradient(135deg, rgba(24,24,28,0.97) 0%, rgba(15,15,18,0.99) 100%)" }}>
      {/* Header */}
      <div className="flex items-center justify-between p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/12 border border-indigo-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-zinc-100">{acc.name}</p>
              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border",
                acc.type === "CHALLENGE" ? "text-amber-300 bg-amber-500/10 border-amber-500/25" : "text-emerald-300 bg-emerald-500/10 border-emerald-500/25")}>
                {acc.type}
              </span>
              {r.propFirm && <span className="text-[10px] text-zinc-500 font-semibold">{r.propFirm}</span>}
            </div>
            <p className="text-[11px] text-zinc-600 mt-0.5">
              {t("soldOf", { balance: money(acc.balance, acc.currency, locale), initial: money(acc.initialBalance, acc.currency, locale) })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border", st.cls)}>
            <st.Icon className="w-3.5 h-3.5" /> {t(st.label)}
          </span>
          <button onClick={() => setEditing((v) => !v)} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1" title={t("configRules")}>
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tracking */}
      {acc.status !== "NO_RULES" && !editing && (
        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 mb-1.5">
              <Target className="w-3 h-3" /> {t("ruleProfitTarget")}
            </div>
            <GoalBar value={p.profitPct} target={r.profitTarget} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-400/80 mb-1.5">
              <TrendingDown className="w-3 h-3" /> {t("ruleDailyLoss")}
            </div>
            <LimitBar value={p.dailyLossPct} limit={r.maxDailyLossPct} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-400/80 mb-1.5">
              <AlertTriangle className="w-3 h-3" /> {t("ddTotalMax")}
            </div>
            <LimitBar value={p.maxDrawdownPct} limit={r.maxDrawdownPct} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400/80 mb-1.5">
              <CalendarCheck className="w-3 h-3" /> {t("ruleDays")}
            </div>
            <GoalBar value={p.tradingDays} target={r.minTradingDays} unit="" />
          </div>
        </div>
      )}

      {/* Editor reguli */}
      {editing && (
        <div className="px-5 pb-5 border-t border-zinc-800/60 pt-4 space-y-4">
          <div>
            <label className="text-[11px] text-zinc-500 font-medium block mb-1.5">{t("preset")}</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((pre) => (
                <button key={pre.name} onClick={() => applyPreset(pre.name)}
                  className={cn("px-2.5 py-1 text-xs rounded-lg border transition-colors",
                    form.propFirm === pre.name ? "bg-indigo-600/30 border-indigo-500/50 text-indigo-300" : "border-zinc-700 text-zinc-500 hover:text-zinc-300")}>
                  {pre.name}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { k: "profitTarget", label: t("profitTarget") },
              { k: "maxDailyLossPct", label: t("dailyLossMax") },
              { k: "maxDrawdownPct", label: t("ddMax") },
              { k: "minTradingDays", label: t("minDays") },
            ].map((f) => (
              <div key={f.k}>
                <label className="text-[10px] text-zinc-500 block mb-1">{f.label}</label>
                <input type="number" value={(form as never)[f.k]}
                  onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 num" />
              </div>
            ))}
          </div>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {t("saveRules")}
          </button>
        </div>
      )}
    </div>
  );
}

export function PropFirmClient() {
  const t = useTranslations("propFirmPage");
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/propfirm", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">{t("title")}</h1>
        </div>
        <p className="text-sm text-zinc-500">{t("subtitle")}</p>
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-44 rounded-2xl bg-zinc-800/40 animate-pulse" />)}</div>
      ) : accounts.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/80 p-10 text-center">
          <Shield className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-300">{t("noChallengeAccount")}</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            {t("empty")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((a) => <AccountCard key={a.id} acc={a} onSaved={load} />)}
        </div>
      )}

      <p className="text-[11px] text-zinc-600 flex items-center gap-1.5">
        <AlertTriangle className="w-3 h-3" />
        {t("disclaimer")}
      </p>
    </div>
  );
}
