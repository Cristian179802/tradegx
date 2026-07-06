"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { Shield, TrendingDown, AlertTriangle, Target, DollarSign, BarChart3, CheckCircle2, XCircle, Zap } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface AccountData {
  id: string; name: string; type: string; currency: string;
  balance: string; initialBalance: string;
  maxDailyLossPct: string | null; maxDrawdownPct: string | null;
}

interface RiskData {
  accounts: AccountData[];
  user: { defaultRiskPct: string; maxTradesPerDay: number; noTradeDays: number[] };
  todayPnl: number;
  todayTradeCount: number;
  weekPnl: number;
}

// Lot size calculator function (position sizing math)
function calcLotSize(balance: number, riskPct: number, slPips: number, pipValue: number = 10): number {
  const riskAmount = balance * (riskPct / 100);
  const lots = riskAmount / (slPips * pipValue);
  return Math.round(lots * 100) / 100;
}

// Max risk amount in $ and % — eticheta se traduce la randare (tLabel)
function getRiskStatus(
  pnl: number,
  balance: number,
  maxDailyLossPct: number | null,
  tLabel: (pct: number) => string
) {
  if (!maxDailyLossPct) return { pct: 0, safe: true, label: "—" };
  const maxLoss = balance * (maxDailyLossPct / 100);
  const used = Math.abs(Math.min(pnl, 0));
  const pct = maxLoss > 0 ? (used / maxLoss) * 100 : 0;
  return {
    pct: Math.min(pct, 100),
    safe: pct < 70,
    label: tLabel(pct),
  };
}

export function RiskManagerClient({ data }: { data: RiskData }) {
  const t = useTranslations("riskManager");
  const [selectedAccount, setSelectedAccount] = React.useState<AccountData | null>(data.accounts[0] ?? null);
  const [riskPct, setRiskPct] = React.useState(parseFloat(data.user.defaultRiskPct) || 1);
  const [slPips, setSlPips] = React.useState(20);
  const [accountSize, setAccountSize] = React.useState(
    selectedAccount ? parseFloat(selectedAccount.balance) : 10000
  );

  React.useEffect(() => {
    if (selectedAccount) setAccountSize(parseFloat(selectedAccount.balance));
  }, [selectedAccount]);

  const riskAmount = accountSize * (riskPct / 100);
  const lotSize = calcLotSize(accountSize, riskPct, slPips);
  const tpAmount = riskAmount * 2; // default 1:2 RR

  const dayOfWeek = new Date().getDay();
  const isNoTradeDay = data.user.noTradeDays.includes(dayOfWeek);

  const dailyLossStatus = selectedAccount
    ? getRiskStatus(data.todayPnl, parseFloat(selectedAccount.balance),
        selectedAccount.maxDailyLossPct ? parseFloat(selectedAccount.maxDailyLossPct) : null,
        (pct) => t("pctUsed", { pct: pct.toFixed(0) }))
    : null;

  const drawdownStatus = selectedAccount
    ? (() => {
        const initial = parseFloat(selectedAccount.initialBalance);
        const current = parseFloat(selectedAccount.balance);
        const dd = ((initial - current) / initial) * 100;
        const maxDD = selectedAccount.maxDrawdownPct ? parseFloat(selectedAccount.maxDrawdownPct) : null;
        return {
          dd: Math.max(dd, 0),
          maxDD,
          pct: maxDD ? (Math.max(dd, 0) / maxDD) * 100 : 0,
          safe: !maxDD || dd < maxDD * 0.7,
        };
      })()
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight neon-indigo">{t("title")}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{t("subtitle")}</p>
        </div>
        {isNoTradeDay && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <XCircle className="h-4 w-4" />
            <span className="text-sm font-semibold">{t("noTradeDay")}</span>
          </div>
        )}
      </div>

      {/* Account Selector */}
      {data.accounts.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {data.accounts.map((acc) => (
            <button key={acc.id}
              onClick={() => setSelectedAccount(acc)}
              className={cn(
                "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all",
                selectedAccount?.id === acc.id
                  ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
              )}>
              {acc.name}
              <span className="ml-1.5 text-[10px] opacity-70">{acc.type}</span>
            </button>
          ))}
        </div>
      )}

      {/* Status Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Today P&L */}
        <div className={cn(
          "rounded-2xl border bg-zinc-900/80 p-4 card-3d",
          data.todayPnl >= 0 ? "border-emerald-500/20" : "border-rose-500/20"
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">P&L Azi</span>
            <DollarSign className={cn("h-3.5 w-3.5", data.todayPnl >= 0 ? "text-emerald-500" : "text-rose-500")} />
          </div>
          <p className={cn("text-xl font-black num", data.todayPnl >= 0 ? "text-emerald-400 neon-emerald" : "text-rose-400 neon-rose")}>
            {data.todayPnl >= 0 ? "+" : ""}{formatCurrency(data.todayPnl, selectedAccount?.currency ?? "USD")}
          </p>
        </div>

        {/* Trades today */}
        <div className={cn(
          "rounded-2xl border bg-zinc-900/80 p-4 card-3d",
          data.todayTradeCount >= data.user.maxTradesPerDay ? "border-rose-500/20" : "border-zinc-800"
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Trades azi</span>
            <BarChart3 className="h-3.5 w-3.5 text-zinc-500" />
          </div>
          <p className={cn("text-xl font-black num", data.todayTradeCount >= data.user.maxTradesPerDay ? "text-rose-400" : "text-zinc-100")}>
            {data.todayTradeCount} <span className="text-sm font-medium text-zinc-600">/ {data.user.maxTradesPerDay}</span>
          </p>
        </div>

        {/* Daily Loss Limit */}
        <div className={cn(
          "rounded-2xl border bg-zinc-900/80 p-4 card-3d",
          dailyLossStatus && !dailyLossStatus.safe ? "border-rose-500/30" : "border-zinc-800"
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{t("dailyLossLimit")}</span>
            <AlertTriangle className={cn("h-3.5 w-3.5", dailyLossStatus && !dailyLossStatus.safe ? "text-rose-400" : "text-zinc-600")} />
          </div>
          {dailyLossStatus && selectedAccount?.maxDailyLossPct ? (
            <>
              <p className={cn("text-xl font-black num", dailyLossStatus.safe ? "text-zinc-100" : "text-rose-400")}>
                {dailyLossStatus.pct.toFixed(0)}%
              </p>
              <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", dailyLossStatus.safe ? "bg-emerald-500" : "bg-rose-500")}
                  style={{ width: `${dailyLossStatus.pct}%`, boxShadow: dailyLossStatus.safe ? "0 0 6px #10b981" : "0 0 6px #f43f5e" }}
                />
              </div>
            </>
          ) : (
            <p className="text-zinc-600 text-sm">Nelimitat</p>
          )}
        </div>

        {/* Drawdown */}
        <div className={cn(
          "rounded-2xl border bg-zinc-900/80 p-4 card-3d",
          drawdownStatus && !drawdownStatus.safe ? "border-amber-500/30" : "border-zinc-800"
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Drawdown</span>
            <TrendingDown className={cn("h-3.5 w-3.5", drawdownStatus && !drawdownStatus.safe ? "text-amber-400" : "text-zinc-600")} />
          </div>
          {drawdownStatus ? (
            <>
              <p className={cn("text-xl font-black num", drawdownStatus.safe ? "text-zinc-100" : "text-amber-400")}>
                -{drawdownStatus.dd.toFixed(1)}%
              </p>
              {drawdownStatus.maxDD && (
                <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", drawdownStatus.safe ? "bg-amber-500/70" : "bg-amber-500")}
                    style={{ width: `${Math.min(drawdownStatus.pct, 100)}%`, boxShadow: "0 0 6px #f59e0b" }} />
                </div>
              )}
            </>
          ) : (
            <p className="text-zinc-600 text-sm">—</p>
          )}
        </div>
      </div>

      {/* Position Size Calculator — main tool */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-indigo-500/20 bg-zinc-900/80 p-5 space-y-5 cyber-card">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
              <Target className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-200">{t("calcTitle")}</h2>
              <p className="text-[11px] text-zinc-600">{t("lotSizing")}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Account balance */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-zinc-400 font-medium">Capital cont</label>
                <span className="text-xs text-zinc-200 num font-bold">{formatCurrency(accountSize, selectedAccount?.currency ?? "USD")}</span>
              </div>
              <input type="number" value={accountSize} min={100} max={10000000} step={1000}
                onChange={(e) => setAccountSize(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_1px_rgba(99,102,241,0.3)] num transition-all" />
            </div>

            {/* Risk % */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-zinc-400 font-medium">{t("riskPerTrade")}</label>
                <span className="text-xs font-bold text-indigo-300 num bg-indigo-500/10 px-2 py-0.5 rounded-md">{riskPct}%</span>
              </div>
              <input type="range" min={0.1} max={5} step={0.1} value={riskPct}
                onChange={(e) => setRiskPct(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-indigo-500" />
              <div className="flex justify-between mt-1">
                {[0.5, 1, 1.5, 2, 3].map((v) => (
                  <button key={v} onClick={() => setRiskPct(v)}
                    className={cn("text-[10px] px-2 py-0.5 rounded border transition-colors",
                      riskPct === v ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-300" : "border-zinc-700 text-zinc-600 hover:text-zinc-400"
                    )}>
                    {v}%
                  </button>
                ))}
              </div>
            </div>

            {/* SL in pips */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-zinc-400 font-medium">Stop Loss (pips)</label>
                <span className="text-xs font-bold text-zinc-300 num">{slPips} pips</span>
              </div>
              <input type="range" min={5} max={200} step={5} value={slPips}
                onChange={(e) => setSlPips(parseInt(e.target.value))}
                className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-violet-500" />
              <div className="flex justify-between mt-1">
                {[10, 20, 30, 50, 100].map((v) => (
                  <button key={v} onClick={() => setSlPips(v)}
                    className={cn("text-[10px] px-2 py-0.5 rounded border transition-colors",
                      slPips === v ? "border-violet-500/50 bg-violet-500/15 text-violet-300" : "border-zinc-700 text-zinc-600 hover:text-zinc-400"
                    )}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
          <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            {t("resultsTitle")}
          </h2>

          <div className="space-y-3">
            {/* Risk amount */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-500/15">
              <div>
                <p className="text-[10px] text-zinc-600 uppercase tracking-wide font-bold">{t("maxRisk")}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{t("maxRiskSub")}</p>
              </div>
              <p className="text-xl font-black text-rose-400 num neon-rose">
                -{formatCurrency(riskAmount, selectedAccount?.currency ?? "USD")}
              </p>
            </div>

            {/* Lot Size */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
              <div>
                <p className="text-[10px] text-zinc-600 uppercase tracking-wide font-bold">{t("recVolume")}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{t("recVolumeSub")}</p>
              </div>
              <p className="text-2xl font-black text-indigo-300 num" style={{ textShadow: "0 0 12px rgba(99,102,241,0.6)" }}>
                {lotSize}
              </p>
            </div>

            {/* TP at 1:2 */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
              <div>
                <p className="text-[10px] text-zinc-600 uppercase tracking-wide font-bold">{t("tp2")}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{t("tp2Sub")}</p>
              </div>
              <p className="text-xl font-black text-emerald-400 num neon-emerald">
                +{formatCurrency(tpAmount, selectedAccount?.currency ?? "USD")}
              </p>
            </div>

            {/* Pip value */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
              <div>
                <p className="text-[10px] text-zinc-600 uppercase tracking-wide font-bold">Valoare 1 pip / lot</p>
              </div>
              <p className="text-base font-bold text-zinc-300 num">$10.00</p>
            </div>
          </div>

          {/* Risk quality indicator */}
          <div className={cn(
            "flex items-center gap-2.5 p-3 rounded-xl border text-sm",
            riskPct <= 1 ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-400" :
            riskPct <= 2 ? "border-amber-500/25 bg-amber-500/5 text-amber-400" :
            "border-rose-500/25 bg-rose-500/5 text-rose-400"
          )}>
            {riskPct <= 1 ? <CheckCircle2 className="h-4 w-4 shrink-0" /> :
             riskPct <= 2 ? <AlertTriangle className="h-4 w-4 shrink-0" /> :
             <XCircle className="h-4 w-4 shrink-0" />}
            <p className="text-xs font-medium">
              {riskPct <= 1 ? "Risc conservator — management optim" :
               riskPct <= 2 ? "Risc moderat — acceptabil, fii atent" :
               "Risc ridicat — poate duce la pierderi mari"}
            </p>
          </div>
        </div>
      </div>

      {/* Prop Firm Rules Checker */}
      {selectedAccount && (
        <div className="rounded-2xl border border-amber-500/20 bg-zinc-900/80 p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
              <Shield className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-200">{t("rulesTitle")}</h2>
              <p className="text-[11px] text-zinc-600">{t("accountStatus", { name: selectedAccount.name, type: selectedAccount.type })}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              {
                label: t("dailyLoss"),
                check: !dailyLossStatus || dailyLossStatus.pct < 100,
                value: dailyLossStatus ? `${dailyLossStatus.pct.toFixed(0)}%` : "—",
                limit: selectedAccount.maxDailyLossPct ? `Max ${selectedAccount.maxDailyLossPct}%` : "Nelimitat",
              },
              {
                label: t("totalDd"),
                check: !drawdownStatus || drawdownStatus.dd < (drawdownStatus.maxDD ?? 999),
                value: drawdownStatus ? `-${drawdownStatus.dd.toFixed(1)}%` : "0%",
                limit: selectedAccount.maxDrawdownPct ? `Max ${selectedAccount.maxDrawdownPct}%` : "Nelimitat",
              },
              {
                label: t("tradesPerDay"),
                check: data.todayTradeCount <= data.user.maxTradesPerDay,
                value: `${data.todayTradeCount}/${data.user.maxTradesPerDay}`,
                limit: t("limitOf", { n: data.user.maxTradesPerDay }),
              },
            ].map((rule) => (
              <div key={rule.label} className={cn(
                "rounded-xl border p-3",
                rule.check ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/10"
              )}>
                <div className="flex items-center gap-1.5 mb-2">
                  {rule.check
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    : <XCircle className="h-3.5 w-3.5 text-rose-400" />}
                  <span className="text-xs font-semibold text-zinc-300">{rule.label}</span>
                </div>
                <p className={cn("text-lg font-black num", rule.check ? "text-emerald-400" : "text-rose-400")}>{rule.value}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{rule.limit}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
