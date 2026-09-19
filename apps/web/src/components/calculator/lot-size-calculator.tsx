"use client";

import { useTranslations, useLocale } from "next-intl";
import * as React from "react";
import Decimal from "decimal.js";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Calculator, TrendingUp } from "lucide-react";
import { pipValue, perecheDeConversie, pipSize } from "@tradegx/core";
import { RollingNumber } from "@/components/ui/rolling-number";

interface Account {
  id: string;
  name: string;
  balance: string | number;
  currency: string;
  defaultRiskPct?: number | null;
}

interface LotSizeCalculatorProps {
  accounts: Account[];
  defaultRiskPct?: number;
}

// Valorile pip erau scrise de mână aici: USDJPY 6.9, USDCHF 10.9, USDCAD 7.7.
// Au fost corecte la un curs de acum câteva luni. Valoarea unui pip depinde de
// cursul zilei, iar tabelul nu avea cum să știe asta — pe un calculator de lot,
// eroarea se plătește direct. Acum se cere prețul și se calculează.

export function LotSizeCalculator({ accounts, defaultRiskPct = 1 }: LotSizeCalculatorProps) {
  const t = useTranslations("calc");
  // Locale EXPLICIT pentru cifre. Componenta e client dar se randeaza si pe
  // server, iar `toLocaleString()` fara argument foloseste locale-ul
  // sistemului: Node pune alt separator de mii decat browserul, hidratarea
  // esueaza si React arunca #418. Erau 5 aparitii in jurnalul de productie,
  // toate pe pagina asta.
  const locale = useLocale();
  const nrLocal = locale === "en" ? "en-US" : "ro-RO";
  const [accountId, setAccountId] = React.useState(accounts[0]?.id ?? "");
  const [riskPct, setRiskPct] = React.useState(String(defaultRiskPct));
  const [riskMode, setRiskMode] = React.useState<"percent" | "money">("percent");
  const [riskMoney, setRiskMoney] = React.useState("");
  const [stopLossPips, setStopLossPips] = React.useState("");
  const [symbol, setSymbol] = React.useState("EURUSD");
  const [customPipValue, setCustomPipValue] = React.useState("");

  const account = accounts.find((a) => a.id === accountId);
  const balance = account ? new Decimal(Number(account.balance)) : new Decimal(0);
  const moneda = account?.currency ?? "USD";

  // ── Valoarea pipului, din preț ─────────────────────────────────────────────
  //
  // Două cotații, în cel mai rău caz: simbolul însuși și — doar pentru perechi
  // încrucișate (EURGBP pe cont în dolari) — perechea de conversie.
  const [pret, setPret] = React.useState<number | null>(null);
  const [cursuri, setCursuri] = React.useState<Record<string, number>>({});
  const [ceremPret, setCeremPret] = React.useState(false);

  React.useEffect(() => {
    const sim = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (sim.length < 3) return;

    let anulat = false;
    const ceasornic = setTimeout(async () => {
      setCeremPret(true);
      const iaPret = async (s: string): Promise<number | null> => {
        try {
          const r = await fetch(`/api/charts/quote?symbol=${s}`);
          if (!r.ok) return null;
          const j = await r.json();
          return typeof j.price === "number" ? j.price : null;
        } catch {
          return null;
        }
      };

      const p = await iaPret(sim);
      if (anulat) return;
      setPret(p);

      const conv = perecheDeConversie(sim, moneda);
      if (conv) {
        const c = await iaPret(conv);
        if (anulat) return;
        setCursuri(c == null ? {} : { [conv]: c });
      } else {
        setCursuri({});
      }
      if (!anulat) setCeremPret(false);
    }, 400);

    return () => { anulat = true; clearTimeout(ceasornic); setCeremPret(false); };
  }, [symbol, moneda]);

  const pipCalculat = React.useMemo(
    () => pipValue({ symbol, price: pret ?? undefined, accountCurrency: moneda, rates: cursuri }),
    [symbol, pret, moneda, cursuri],
  );

  // Derived calculations
  const result = React.useMemo(() => {
    const slPips = parseFloat(stopLossPips);
    if (!slPips || slPips <= 0) return null;

    let riskAmount: Decimal;
    if (riskMode === "percent") {
      const pct = parseFloat(riskPct);
      if (!pct || pct <= 0) return null;
      riskAmount = balance.mul(new Decimal(pct).div(100));
    } else {
      const money = parseFloat(riskMoney);
      if (!money || money <= 0) return null;
      riskAmount = new Decimal(money);
    }

    const pipVal = customPipValue ? parseFloat(customPipValue) : pipCalculat;
    if (!pipVal || pipVal <= 0) return null;

    // lotSize = riskAmount / (slPips * pipValuePerLot)
    const lotSize = riskAmount.div(new Decimal(slPips).mul(new Decimal(pipVal)));

    const riskPercent = balance.gt(0)
      ? riskAmount.div(balance).mul(100)
      : new Decimal(0);

    return {
      lotSize: lotSize.toDecimalPlaces(2),
      riskAmount: riskAmount.toDecimalPlaces(2),
      riskPercent: riskPercent.toDecimalPlaces(2),
      pipValue: new Decimal(pipVal),
    };
  }, [balance, riskPct, riskMoney, riskMode, stopLossPips, customPipValue, pipCalculat]);

  const riskPctNum = parseFloat(riskPct) || 0;
  const riskColor = riskPctNum <= 1 ? "emerald" : riskPctNum <= 2 ? "amber" : "rose";

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Inputs */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <Calculator className="h-4 w-4 text-indigo-400" />
          {t("paramsTitle")}
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Account */}
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1">
              {t("account")}
            </label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="bg-zinc-800/80 border-zinc-700 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id} className="text-zinc-100">
                    {a.name} ({Number(a.balance).toLocaleString(nrLocal)} {a.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-600 mt-1">
              {t("balanceLabel")} <span className="text-zinc-400 num">{balance.toNumber().toLocaleString(nrLocal)} {account?.currency}</span>
            </p>
          </div>

          {/* Symbol */}
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1">Symbol</label>
            <Input
              placeholder="EURUSD"
              className="bg-zinc-800 border-zinc-700 text-zinc-100 uppercase input-cyber"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            />
          </div>

          {/* Risk mode toggle */}
          <div className="col-span-full">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">{t("riskMode")}</label>
            <div className="flex gap-2 mb-3">
              {(["percent", "money"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setRiskMode(m)}
                  className={cn(
                    "flex-1 py-2.5 text-sm rounded-xl border font-semibold transition-all",
                    riskMode === m
                      ? "bg-indigo-500/15 border-indigo-500/50 text-indigo-300"
                      : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  )}
                >
                  {m === "percent" ? t("percent") : t("fixed")}
                </button>
              ))}
            </div>
            {/* Quick presets */}
            {riskMode === "percent" && (
              <div className="flex gap-1.5 mb-3">
                {[0.5, 1, 1.5, 2, 3].map((v) => (
                  <button key={v} type="button"
                    onClick={() => setRiskPct(String(v))}
                    className={cn("flex-1 py-1.5 text-xs rounded-lg border font-bold transition-all",
                      riskPct === String(v)
                        ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                        : "bg-zinc-800/50 border-zinc-700/50 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400"
                    )}>
                    {v}%
                  </button>
                ))}
              </div>
            )}

            {riskMode === "percent" ? (
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="1"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 num pr-8 input-cyber"
                  value={riskPct}
                  onChange={(e) => setRiskPct(e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">%</span>
              </div>
            ) : (
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="250"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 num pr-8 input-cyber"
                  value={riskMoney}
                  onChange={(e) => setRiskMoney(e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
              </div>
            )}
          </div>

          {/* Stop Loss Pips */}
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1">{t("slPips")}</label>
            <Input
              type="number"
              step="0.1"
              placeholder="20"
              data-testid="calc-sl-pips"
              className="bg-zinc-800 border-zinc-700 text-zinc-100 num input-cyber"
              value={stopLossPips}
              onChange={(e) => setStopLossPips(e.target.value)}
            />
            {symbol && (
              <p className="text-xs text-zinc-600 mt-1">
                {t("pipEquals", { val: String(pipSize(symbol)), symbol })}
              </p>
            )}
          </div>

          {/* Valoarea pipului: calculată din preț, sau cerută dacă n-o putem ști */}
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1">
              {t("pipValueLabel", { moneda })}{" "}
              {pipCalculat != null && (
                <span className="text-zinc-600 font-normal">
                  {t("pipAuto", { val: pipCalculat.toFixed(2) })}
                </span>
              )}
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder={pipCalculat != null ? pipCalculat.toFixed(2) : "—"}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 num input-cyber"
              value={customPipValue}
              onChange={(e) => setCustomPipValue(e.target.value)}
            />
            {customPipValue ? (
              <p className="text-[11px] text-zinc-600 mt-1">{t("pipManual")}</p>
            ) : ceremPret ? (
              <p className="text-[11px] text-zinc-600 mt-1">{t("pipLoading")}</p>
            ) : pipCalculat != null && pret != null ? (
              <p className="text-[11px] text-zinc-600 mt-1">
                {t("pipFromPrice", { pret: pret.toLocaleString(nrLocal, { maximumFractionDigits: 5 }) })}
              </p>
            ) : (
              <p className="text-[11px] text-amber-400/80 mt-1">
                {t("pipUnknown", { symbol: symbol.toUpperCase(), moneda })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Result */}
      {result ? (
        <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/8 to-violet-500/5 p-6 cyber-card">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">{t("result")}</h3>
          </div>

          {/* Main result */}
          <div data-testid="calc-result" className="text-center mb-6 py-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <p className="text-xs text-zinc-600 uppercase tracking-wider mb-1">{t("recommended")}</p>
            <p
              data-testid="calc-lot-size"
              data-value={result.lotSize.toFixed(2)}
              className="text-5xl font-black text-white num tracking-tight"
            >
              <RollingNumber value={result.lotSize.toFixed(2)} duration={420} stagger={30} />
            </p>
            <p className="text-sm text-zinc-500 mt-1">{t("standardLots")}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={cn("rounded-xl p-4 border text-center",
              riskColor === "emerald" ? "bg-emerald-500/8 border-emerald-500/20"
              : riskColor === "amber" ? "bg-amber-500/8 border-amber-500/20"
              : "bg-rose-500/8 border-rose-500/20")}>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">{t("riskUsd")}</p>
              <p className={cn("text-xl font-black num",
                riskColor === "emerald" ? "text-emerald-400 neon-emerald"
                : riskColor === "amber" ? "text-amber-400 neon-amber"
                : "text-rose-400 neon-rose")}>
                <RollingNumber value={`$${result.riskAmount.toFixed(2)}`} duration={420} stagger={30} />
              </p>
            </div>
            <div className={cn("rounded-xl p-4 border text-center",
              riskColor === "emerald" ? "bg-emerald-500/8 border-emerald-500/20"
              : riskColor === "amber" ? "bg-amber-500/8 border-amber-500/20"
              : "bg-rose-500/8 border-rose-500/20")}>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">{t("riskPct")}</p>
              <p className={cn("text-xl font-black num",
                riskColor === "emerald" ? "text-emerald-400 neon-emerald"
                : riskColor === "amber" ? "text-amber-400 neon-amber"
                : "text-rose-400 neon-rose")}>
                <RollingNumber value={`${result.riskPercent.toFixed(2)}%`} duration={420} stagger={30} />
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-indigo-500/15 text-[11px] text-zinc-600 text-center font-mono">
            {result.riskAmount.toFixed(2)}$ ÷ ({stopLossPips}p × {result.pipValue.toFixed(2)}$/lot) = <span className="text-indigo-400 font-bold">{result.lotSize.toFixed(2)} {t("lots")}</span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-10 text-center">
          <Calculator className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 font-medium">{t("emptyTitle")}</p>
          <p className="text-xs text-zinc-700 mt-1">{t("emptyHint")}</p>
        </div>
      )}
    </div>
  );
}
