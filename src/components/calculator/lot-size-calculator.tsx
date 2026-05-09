"use client";

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

// Approximate pip values per standard lot in USD (updated manually)
const PIP_VALUES: Record<string, number> = {
  EURUSD: 10, GBPUSD: 10, AUDUSD: 10, NZDUSD: 10, USDCAD: 7.7,
  USDCHF: 10.9, USDJPY: 6.9, EURGBP: 12.5, EURJPY: 6.9, GBPJPY: 6.9,
  XAUUSD: 10, XAGUSD: 50, BTCUSD: 1, ETHUSD: 1,
  DEFAULT: 10,
};

function getPipValue(symbol: string): number {
  const upper = symbol.toUpperCase().replace(/[^A-Z]/g, "");
  return PIP_VALUES[upper] ?? PIP_VALUES.DEFAULT;
}

function isJPYPair(symbol: string): boolean {
  return symbol.toUpperCase().includes("JPY");
}

export function LotSizeCalculator({ accounts, defaultRiskPct = 1 }: LotSizeCalculatorProps) {
  const [accountId, setAccountId] = React.useState(accounts[0]?.id ?? "");
  const [riskPct, setRiskPct] = React.useState(String(defaultRiskPct));
  const [riskMode, setRiskMode] = React.useState<"percent" | "money">("percent");
  const [riskMoney, setRiskMoney] = React.useState("");
  const [stopLossPips, setStopLossPips] = React.useState("");
  const [symbol, setSymbol] = React.useState("EURUSD");
  const [customPipValue, setCustomPipValue] = React.useState("");

  const account = accounts.find((a) => a.id === accountId);
  const balance = account ? new Decimal(Number(account.balance)) : new Decimal(0);

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

    const pipVal = customPipValue
      ? parseFloat(customPipValue)
      : getPipValue(symbol);

    if (!pipVal) return null;

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
  }, [balance, riskPct, riskMoney, riskMode, stopLossPips, symbol, customPipValue]);

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Inputs */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
        <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Calculator className="h-4 w-4 text-indigo-400" />
          Parametri
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Account */}
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1">
              Cont trading
            </label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id} className="text-zinc-100">
                    {a.name} ({Number(a.balance).toLocaleString()} {a.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-600 mt-1">
              Balanță: <span className="text-zinc-400 num">{balance.toNumber().toLocaleString()} {account?.currency}</span>
            </p>
          </div>

          {/* Symbol */}
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1">Symbol</label>
            <Input
              placeholder="EURUSD"
              className="bg-zinc-800 border-zinc-700 text-zinc-100 uppercase"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            />
          </div>

          {/* Risk mode toggle */}
          <div className="col-span-full">
            <label className="text-xs font-medium text-zinc-400 block mb-1">Mod risc</label>
            <div className="flex gap-2 mb-3">
              {(["percent", "money"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setRiskMode(m)}
                  className={cn(
                    "flex-1 py-2 text-sm rounded-md border transition-colors",
                    riskMode === m
                      ? "bg-indigo-500/20 border-indigo-500 text-indigo-400"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  )}
                >
                  {m === "percent" ? "Procent (%)" : "Sumă ($)"}
                </button>
              ))}
            </div>

            {riskMode === "percent" ? (
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="1"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 num pr-8"
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
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 num pr-8"
                  value={riskMoney}
                  onChange={(e) => setRiskMoney(e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
              </div>
            )}
          </div>

          {/* Stop Loss Pips */}
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1">Stop Loss (pips)</label>
            <Input
              type="number"
              step="0.1"
              placeholder="20"
              className="bg-zinc-800 border-zinc-700 text-zinc-100 num"
              value={stopLossPips}
              onChange={(e) => setStopLossPips(e.target.value)}
            />
            {symbol && (
              <p className="text-xs text-zinc-600 mt-1">
                1 pip = {isJPYPair(symbol) ? "0.01" : "0.0001"} pentru {symbol}
              </p>
            )}
          </div>

          {/* Custom pip value */}
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1">
              Valoare pip / lot standard ($){" "}
              <span className="text-zinc-600 font-normal">
                (auto: {getPipValue(symbol)}$)
              </span>
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder={String(getPipValue(symbol))}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 num"
              value={customPipValue}
              onChange={(e) => setCustomPipValue(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Result */}
      {result ? (
        <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-indigo-300">Rezultat</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Volum (loturi)</p>
              <p className="text-3xl font-bold text-white num">
                {result.lotSize.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Risc ($)</p>
              <p className="text-2xl font-semibold text-rose-400 num">
                ${result.riskAmount.toFixed(2)}
              </p>
            </div>
            <div className="text-center col-span-2 sm:col-span-1">
              <p className="text-xs text-zinc-500 mb-1">Risc (%)</p>
              <p className="text-2xl font-semibold text-amber-400 num">
                {result.riskPercent.toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-indigo-500/20 text-xs text-zinc-500 text-center">
            Formula: {result.riskAmount.toFixed(2)}$ ÷ ({stopLossPips} pips × {result.pipValue.toFixed(2)}$/pip) = {result.lotSize.toFixed(2)} loturi
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-8 text-center">
          <Calculator className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">Introdu parametrii pentru a calcula volumul</p>
        </div>
      )}
    </div>
  );
}
