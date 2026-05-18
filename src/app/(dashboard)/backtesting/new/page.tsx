"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TrendingUp, Activity, RefreshCw, BarChart2, Wand2,
  ArrowLeft, ArrowRight, Play, Check, ChevronDown, Plus, X, ChevronUp,
} from "lucide-react";
import type { CustomCondition, IndicatorRef, IndicatorRefType, ConditionOperator } from "@/lib/backtest-engine";

// ─── Constants ────────────────────────────────────────────────────────────────

const STRATEGY_TYPES = [
  {
    id: "EMA_CROSSOVER",
    name: "EMA Crossover",
    icon: TrendingUp,
    color: "#6366f1",
    badgeClass: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    desc: "Fast/Slow EMA crossover cu filtru de trend pe EMA lungă. Semnale clare, potrivit pentru trending markets.",
    details: [
      "Fast EMA (9) peste Slow EMA (21) → BUY",
      "Filtru opțional EMA 200 pentru direcție trend",
      "Filtru RSI pentru evitarea zone extreme",
      "Confirmare MACD opțională, Stop Loss ATR",
    ],
  },
  {
    id: "SESSION_BREAKOUT",
    name: "Session Breakout",
    icon: Activity,
    color: "#f59e0b",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    desc: "Break al range-ului sesiunii (Asian/London/NY). Clasic SMC — tranzacționează breakout-ul cu bias directional.",
    details: [
      "Calculează high/low sesiunii selectate",
      "Filtru range minim (pips) pentru sesiuni liniștite",
      "Opțiune retest al nivelului de breakout",
      "Filtru RSI pentru confirmare impuls",
    ],
  },
  {
    id: "RSI_REVERSAL",
    name: "RSI Reversal",
    icon: RefreshCw,
    color: "#a78bfa",
    badgeClass: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    desc: "Mean reversion pe RSI oversold/overbought. RSI iese din zone extreme → entry în direcția revenirii.",
    details: [
      "RSI (14) iese din zona oversold (<30) → BUY",
      "Confirmare Stochastic pentru filtrare semnale false",
      "Filtru Bollinger Bands — intrare la extreme",
      "Filtru EMA opțional pentru direcție",
    ],
  },
  {
    id: "TREND_FOLLOWING",
    name: "Trend Following",
    icon: BarChart2,
    color: "#34d399",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    desc: "Urmărire trend cu pullback la EMA + confirmare ADX. Entry la revenirea prețului la EMA în trend puternic.",
    details: [
      "ADX > 25 → trend puternic confirmat",
      "Confluență DI+ / DI− pentru direcție",
      "A doua EMA lentă pentru confluență",
      "Confirmare MACD opțională",
    ],
  },
  {
    id: "CUSTOM",
    name: "Personalizată",
    icon: Wand2,
    color: "#ec4899",
    badgeClass: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    desc: "Construiești tu regulile. Combini orice indicatori după logica ta — EMA, MACD, Stochastic, Bollinger, RSI, ATR, ADX, DI+/DI−.",
    details: [
      "EMA, SMA, RSI, ATR, MACD, Bollinger Bands",
      "Stochastic %K/%D, ADX, DI+, DI−",
      "Operatori: crossover, above/below, procent",
      "Filtru trend, SL/TP configurabile",
    ],
  },
] as const;

const SYMBOLS = [
  "EURUSD","GBPUSD","USDJPY","USDCHF","AUDUSD","NZDUSD","USDCAD",
  "EURGBP","EURJPY","GBPJPY","EURCAD","XAUUSD","XAGUSD","US30","NAS100","SP500","BTCUSD",
];

const TIMEFRAMES = [
  { value: "M15", label: "M15 — 15 minute" },
  { value: "M30", label: "M30 — 30 minute" },
  { value: "H1",  label: "H1 — 1 oră" },
  { value: "H4",  label: "H4 — 4 ore" },
  { value: "D1",  label: "D1 — Zilnic" },
];

const COLORS = ["#6366f1","#f59e0b","#a78bfa","#34d399","#f43f5e","#38bdf8","#fb923c","#ec4899"];

const DEFAULT_RULES: Record<string, Record<string, unknown>> = {
  EMA_CROSSOVER: {
    fastPeriod: 9, slowPeriod: 21, trendPeriod: 200,
    atrPeriod: 14, slMultiplier: 1.5, rrRatio: 2.0,
    rsiFilter: 0, rsiPeriod: 14, macdConfirm: false, trailingStop: false,
  },
  SESSION_BREAKOUT: {
    session: "LONDON", slMultiplier: 1.0, rrRatio: 2.0,
    atrPeriod: 14, minRangePips: 0, retestEntry: false, rsiFilter: 0,
  },
  RSI_REVERSAL: {
    rsiPeriod: 14, oversold: 30, overbought: 70, emaFilter: 50,
    atrPeriod: 14, slMultiplier: 1.5, rrRatio: 2.0,
    stochConfirm: false, stochK: 14, stochD: 3, stochOversold: 20, stochOverbought: 80,
    bollFilter: false, bollPeriod: 20,
  },
  TREND_FOLLOWING: {
    emaPeriod: 50, emaSlow: 0, adxPeriod: 14, adxThreshold: 25, pullbackBars: 3,
    atrPeriod: 14, slMultiplier: 1.5, rrRatio: 2.0,
    requireDiCross: false, macdFilter: false, macdFast: 12, macdSlow: 26, macdSignal: 9,
  },
  CUSTOM: {
    entryLong:  [{ id: "l1", left: { type: "EMA", period: 9 }, op: "crosses_above", right: { type: "EMA", period: 21 } }],
    entryShort: [{ id: "s1", left: { type: "EMA", period: 9 }, op: "crosses_below", right: { type: "EMA", period: 21 } }],
    slMultiplier: 1.5, rrRatio: 2.0,
    trendFilter: { enabled: false, type: "EMA", period: 200 },
    atrPeriod: 14,
  },
};

// ─── Indicator / Operator metadata ───────────────────────────────────────────

interface IndicatorOpt {
  value: IndicatorRefType;
  label: string;
  group: string;
  hasPeriod?: boolean;
  period1Label?: string;
  period1Default?: number;
  hasPeriod2?: boolean;
  period2Label?: string;
  period2Default?: number;
  period2Step?: number;
  period2Min?: number;
  period2Max?: number;
  hasPeriod3?: boolean;
  period3Label?: string;
  period3Default?: number;
  hasValue?: boolean;
}

const INDICATOR_OPTS: IndicatorOpt[] = [
  // Moving averages
  { value: "EMA",        label: "EMA",        group: "Medii",    hasPeriod: true, period1Label: "Perioadă", period1Default: 14 },
  { value: "SMA",        label: "SMA",        group: "Medii",    hasPeriod: true, period1Label: "Perioadă", period1Default: 14 },
  // Oscillators
  { value: "RSI",        label: "RSI",        group: "Oscilatori", hasPeriod: true, period1Label: "Perioadă", period1Default: 14 },
  { value: "STOCH_K",   label: "Stoch %K",   group: "Oscilatori", hasPeriod: true, period1Label: "%K", period1Default: 14, hasPeriod2: true, period2Label: "%D", period2Default: 3, period2Min: 1, period2Max: 20, period2Step: 1 },
  { value: "STOCH_D",   label: "Stoch %D",   group: "Oscilatori", hasPeriod: true, period1Label: "%K", period1Default: 14, hasPeriod2: true, period2Label: "%D", period2Default: 3, period2Min: 1, period2Max: 20, period2Step: 1 },
  // Trend
  { value: "ADX",       label: "ADX",        group: "Trend",    hasPeriod: true, period1Label: "Perioadă", period1Default: 14 },
  { value: "DI_PLUS",   label: "DI+",        group: "Trend",    hasPeriod: true, period1Label: "Perioadă", period1Default: 14 },
  { value: "DI_MINUS",  label: "DI−",        group: "Trend",    hasPeriod: true, period1Label: "Perioadă", period1Default: 14 },
  // MACD
  { value: "MACD_LINE", label: "MACD Linie", group: "MACD",     hasPeriod: true, period1Label: "Fast", period1Default: 12, hasPeriod2: true, period2Label: "Slow", period2Default: 26, period2Min: 5, period2Max: 200, period2Step: 1, hasPeriod3: true, period3Label: "Signal", period3Default: 9 },
  { value: "MACD_SIGNAL",label:"MACD Signal",group: "MACD",     hasPeriod: true, period1Label: "Fast", period1Default: 12, hasPeriod2: true, period2Label: "Slow", period2Default: 26, period2Min: 5, period2Max: 200, period2Step: 1, hasPeriod3: true, period3Label: "Signal", period3Default: 9 },
  { value: "MACD_HIST", label: "MACD Hist",  group: "MACD",     hasPeriod: true, period1Label: "Fast", period1Default: 12, hasPeriod2: true, period2Label: "Slow", period2Default: 26, period2Min: 5, period2Max: 200, period2Step: 1, hasPeriod3: true, period3Label: "Signal", period3Default: 9 },
  // Bollinger
  { value: "BOLL_UPPER",label: "Boll Sus",   group: "Bollinger", hasPeriod: true, period1Label: "Perioadă", period1Default: 20, hasPeriod2: true, period2Label: "StdDev", period2Default: 2, period2Min: 0.5, period2Max: 5, period2Step: 0.1 },
  { value: "BOLL_MIDDLE",label:"Boll Mid",   group: "Bollinger", hasPeriod: true, period1Label: "Perioadă", period1Default: 20, hasPeriod2: true, period2Label: "StdDev", period2Default: 2, period2Min: 0.5, period2Max: 5, period2Step: 0.1 },
  { value: "BOLL_LOWER",label: "Boll Jos",   group: "Bollinger", hasPeriod: true, period1Label: "Perioadă", period1Default: 20, hasPeriod2: true, period2Label: "StdDev", period2Default: 2, period2Min: 0.5, period2Max: 5, period2Step: 0.1 },
  // Volatility
  { value: "ATR",       label: "ATR",        group: "Volatilitate", hasPeriod: true, period1Label: "Perioadă", period1Default: 14 },
  // Price
  { value: "CLOSE",     label: "Close",      group: "Preț" },
  { value: "HIGH",      label: "High",       group: "Preț" },
  { value: "LOW",       label: "Low",        group: "Preț" },
  { value: "OPEN",      label: "Open",       group: "Preț" },
  { value: "PREV_CLOSE",label: "Prev Close", group: "Preț anterior" },
  { value: "PREV_HIGH", label: "Prev High",  group: "Preț anterior" },
  { value: "PREV_LOW",  label: "Prev Low",   group: "Preț anterior" },
  // Constant
  { value: "VALUE",     label: "Valoare fixă", group: "Constant", hasValue: true },
];

const OPERATOR_OPTS: { value: ConditionOperator; label: string; hasPct?: boolean }[] = [
  { value: "crosses_above",  label: "încrucișează ↑" },
  { value: "crosses_below",  label: "încrucișează ↓" },
  { value: "is_above",       label: "este >" },
  { value: "is_below",       label: "este <" },
  { value: "is_above_by_pct",label: "este > cu %", hasPct: true },
  { value: "is_below_by_pct",label: "este < cu %", hasPct: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 8); }

function Slider({ label, name, value, min, max, step, description, onChange }: {
  label: string; name: string; value: number; min: number; max: number; step: number;
  description?: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm text-zinc-300 font-medium">{label}</label>
        <span className="text-sm font-bold text-indigo-300 num bg-indigo-500/10 px-2 py-0.5 rounded-md">{value}</span>
      </div>
      <input type="range" name={name} min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-indigo-500" />
      {description && <p className="text-[11px] text-zinc-600 mt-1">{description}</p>}
    </div>
  );
}

function NumberInput({ label, name, value, min, max, step, description, onChange }: {
  label: string; name: string; value: number; min: number; max: number; step: number;
  description?: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-sm text-zinc-300 font-medium block mb-1">{label}</label>
      <input type="number" name={name} min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || min)}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 num" />
      {description && <p className="text-[11px] text-zinc-600 mt-1">{description}</p>}
    </div>
  );
}

function Toggle({ label, value, onChange, description }: {
  label: string; value: boolean; onChange: (v: boolean) => void; description?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-zinc-300 font-medium">{label}</p>
        {description && <p className="text-[11px] text-zinc-600">{description}</p>}
      </div>
      <button onClick={() => onChange(!value)}
        className={cn("relative w-9 h-5 rounded-full transition-colors shrink-0 ml-3", value ? "bg-indigo-500" : "bg-zinc-700")}>
        <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", value ? "translate-x-4" : "translate-x-0.5")} />
      </button>
    </div>
  );
}

function AdvancedSection({ children, label = "Filtre avansate" }: { children: React.ReactNode; label?: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-t border-zinc-800 pt-3">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-full mb-0">
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        <span className="font-medium uppercase tracking-wide">{label}</span>
      </button>
      {open && <div className="mt-3 space-y-4">{children}</div>}
    </div>
  );
}

// ─── Parameter Forms ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EmaCrossoverForm({ rules, onChange }: { rules: Record<string, any>; onChange: (r: Record<string, any>) => void }) {
  const set = (k: string, v: number | boolean) => onChange({ ...rules, [k]: v });
  return (
    <div className="space-y-5">
      <Slider label="EMA Rapidă" name="fastPeriod" value={rules.fastPeriod} min={3} max={50} step={1}
        description="Semnale pe încrucișare cu EMA lentă" onChange={(v) => set("fastPeriod", v)} />
      <Slider label="EMA Lentă" name="slowPeriod" value={rules.slowPeriod} min={10} max={200} step={1}
        description="Definește trendul pe termen mediu" onChange={(v) => set("slowPeriod", v)} />
      <Slider label="Filtru Trend EMA (0 = off)" name="trendPeriod" value={rules.trendPeriod} min={0} max={500} step={10}
        description="0 = dezactivat; intră BUY doar dacă Close > EMA(trendPeriod)" onChange={(v) => set("trendPeriod", v)} />
      <Slider label="Multiplicator SL (ATR)" name="slMultiplier" value={rules.slMultiplier} min={0.5} max={4} step={0.5}
        onChange={(v) => set("slMultiplier", v)} />
      <Slider label="Risk:Reward Ratio" name="rrRatio" value={rules.rrRatio} min={1} max={5} step={0.5}
        onChange={(v) => set("rrRatio", v)} />

      <AdvancedSection>
        <Slider label="Perioadă ATR" name="atrPeriod" value={rules.atrPeriod ?? 14} min={5} max={50} step={1}
          description="ATR pentru calculul Stop Loss" onChange={(v) => set("atrPeriod", v)} />
        <Slider label="Filtru RSI (0 = off)" name="rsiFilter" value={rules.rsiFilter ?? 0} min={0} max={50} step={5}
          description="Intră BUY doar dacă RSI < X (evită zone supraevaluate)" onChange={(v) => set("rsiFilter", v)} />
        {(rules.rsiFilter ?? 0) > 0 && (
          <Slider label="Perioadă RSI" name="rsiPeriod" value={rules.rsiPeriod ?? 14} min={5} max={30} step={1}
            onChange={(v) => set("rsiPeriod", v)} />
        )}
        <Toggle label="Confirmare MACD" value={!!rules.macdConfirm}
          description="Intră BUY doar dacă MACD(12,26,9) > linia de semnal"
          onChange={(v) => set("macdConfirm", v)} />
        <Toggle label="Trailing Stop" value={!!rules.trailingStop}
          description="Stop Loss se mișcă cu prețul în loc de SL fix"
          onChange={(v) => set("trailingStop", v)} />
      </AdvancedSection>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SessionBreakoutForm({ rules, onChange }: { rules: Record<string, any>; onChange: (r: Record<string, any>) => void }) {
  const set = (k: string, v: number | string | boolean) => onChange({ ...rules, [k]: v });
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm text-zinc-300 font-medium block mb-2">Sesiune</label>
        <div className="grid grid-cols-2 gap-2">
          {(["ASIAN","LONDON","NEW_YORK","ALL"] as const).map((s) => (
            <button key={s} onClick={() => set("session", s)}
              className={cn("py-2 rounded-lg border text-xs font-medium transition-colors", rules.session === s
                ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600")}>
              {s === "NEW_YORK" ? "NEW YORK" : s === "ALL" ? "TOATE" : s}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-zinc-600 mt-1.5">Asian: 00-09 UTC · London: 07-16 UTC · NY: 12-21 UTC</p>
      </div>
      <Slider label="Multiplicator SL (ATR)" name="slMultiplier" value={Number(rules.slMultiplier)} min={0.5} max={4} step={0.5}
        onChange={(v) => set("slMultiplier", v)} />
      <Slider label="Risk:Reward Ratio" name="rrRatio" value={Number(rules.rrRatio)} min={1} max={5} step={0.5}
        onChange={(v) => set("rrRatio", v)} />

      <AdvancedSection>
        <Slider label="Perioadă ATR" name="atrPeriod" value={rules.atrPeriod ?? 14} min={5} max={50} step={1}
          description="Folosit pentru dimensionarea SL" onChange={(v) => set("atrPeriod", v)} />
        <Slider label="Range minim sesiune (pips, 0 = off)" name="minRangePips" value={rules.minRangePips ?? 0} min={0} max={100} step={5}
          description="Sari sesiunile cu range prea mic (volatilitate redusă)" onChange={(v) => set("minRangePips", v)} />
        <Toggle label="Retest la intrare" value={!!rules.retestEntry}
          description="Așteaptă retestul nivelului de breakout înainte de entry"
          onChange={(v) => set("retestEntry", v)} />
        <Slider label="Filtru RSI (0 = off)" name="rsiFilter" value={rules.rsiFilter ?? 0} min={0} max={50} step={5}
          description="Intră BUY dacă RSI > (100-X), SELL dacă RSI < X" onChange={(v) => set("rsiFilter", v)} />
      </AdvancedSection>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RsiReversalForm({ rules, onChange }: { rules: Record<string, any>; onChange: (r: Record<string, any>) => void }) {
  const set = (k: string, v: number | boolean) => onChange({ ...rules, [k]: v });
  return (
    <div className="space-y-5">
      <Slider label="Perioadă RSI" name="rsiPeriod" value={rules.rsiPeriod} min={5} max={30} step={1}
        onChange={(v) => set("rsiPeriod", v)} />
      <Slider label="Nivel Oversold" name="oversold" value={rules.oversold} min={10} max={45} step={5}
        description="Sub acest nivel RSI → oversold (semnale BUY)" onChange={(v) => set("oversold", v)} />
      <Slider label="Nivel Overbought" name="overbought" value={rules.overbought} min={55} max={90} step={5}
        description="Peste acest nivel RSI → overbought (semnale SELL)" onChange={(v) => set("overbought", v)} />
      <Slider label="Filtru EMA (0 = off)" name="emaFilter" value={rules.emaFilter} min={0} max={200} step={10}
        description="Tranzacționează BUY doar dacă Close > EMA(n)" onChange={(v) => set("emaFilter", v)} />
      <Slider label="Multiplicator SL (ATR)" name="slMultiplier" value={rules.slMultiplier} min={0.5} max={4} step={0.5}
        onChange={(v) => set("slMultiplier", v)} />
      <Slider label="Risk:Reward Ratio" name="rrRatio" value={rules.rrRatio} min={1} max={5} step={0.5}
        onChange={(v) => set("rrRatio", v)} />

      <AdvancedSection>
        <Slider label="Perioadă ATR" name="atrPeriod" value={rules.atrPeriod ?? 14} min={5} max={50} step={1}
          onChange={(v) => set("atrPeriod", v)} />
        <Toggle label="Confirmare Stochastic" value={!!rules.stochConfirm}
          description="Necesită Stochastic în zona corespunzătoare pentru confirmare"
          onChange={(v) => set("stochConfirm", v)} />
        {!!rules.stochConfirm && (
          <div className="grid grid-cols-2 gap-4 pl-2 border-l-2 border-zinc-700">
            <Slider label="Stoch %K" name="stochK" value={rules.stochK ?? 14} min={3} max={30} step={1}
              onChange={(v) => set("stochK", v)} />
            <Slider label="Stoch %D" name="stochD" value={rules.stochD ?? 3} min={1} max={10} step={1}
              onChange={(v) => set("stochD", v)} />
            <Slider label="Stoch Oversold" name="stochOversold" value={rules.stochOversold ?? 20} min={5} max={35} step={5}
              onChange={(v) => set("stochOversold", v)} />
            <Slider label="Stoch Overbought" name="stochOverbought" value={rules.stochOverbought ?? 80} min={65} max={95} step={5}
              onChange={(v) => set("stochOverbought", v)} />
          </div>
        )}
        <Toggle label="Filtru Bollinger Bands" value={!!rules.bollFilter}
          description="Intră BUY numai când prețul este sub banda inferioară BB"
          onChange={(v) => set("bollFilter", v)} />
        {!!rules.bollFilter && (
          <Slider label="Perioadă Bollinger" name="bollPeriod" value={rules.bollPeriod ?? 20} min={10} max={50} step={5}
            description="Perioadă SMA pentru calculul benzilor Bollinger"
            onChange={(v) => set("bollPeriod", v)} />
        )}
      </AdvancedSection>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TrendFollowingForm({ rules, onChange }: { rules: Record<string, any>; onChange: (r: Record<string, any>) => void }) {
  const set = (k: string, v: number | boolean) => onChange({ ...rules, [k]: v });
  return (
    <div className="space-y-5">
      <Slider label="Perioadă EMA" name="emaPeriod" value={rules.emaPeriod} min={10} max={200} step={5}
        description="EMA principală — pullback-ul la aceasta declanșează entry" onChange={(v) => set("emaPeriod", v)} />
      <Slider label="Perioadă ADX" name="adxPeriod" value={rules.adxPeriod} min={5} max={30} step={1}
        onChange={(v) => set("adxPeriod", v)} />
      <Slider label="Prag ADX (trend minim)" name="adxThreshold" value={rules.adxThreshold} min={15} max={50} step={5}
        description="Intră doar dacă ADX > acest prag (trend puternic)" onChange={(v) => set("adxThreshold", v)} />
      <Slider label="Bare pullback maxime" name="pullbackBars" value={rules.pullbackBars} min={1} max={15} step={1}
        description="Numărul de lumânări din ultimul pullback spre EMA" onChange={(v) => set("pullbackBars", v)} />
      <Slider label="Multiplicator SL (ATR)" name="slMultiplier" value={rules.slMultiplier} min={0.5} max={4} step={0.5}
        onChange={(v) => set("slMultiplier", v)} />
      <Slider label="Risk:Reward Ratio" name="rrRatio" value={rules.rrRatio} min={1} max={5} step={0.5}
        onChange={(v) => set("rrRatio", v)} />

      <AdvancedSection>
        <Slider label="EMA Lentă pentru confluență (0 = off)" name="emaSlow" value={rules.emaSlow ?? 0} min={0} max={500} step={10}
          description="A doua EMA mai lentă — prețul trebuie să fie și deasupra acesteia" onChange={(v) => set("emaSlow", v)} />
        <Slider label="Perioadă ATR" name="atrPeriod" value={rules.atrPeriod ?? 14} min={5} max={50} step={1}
          onChange={(v) => set("atrPeriod", v)} />
        <Toggle label="Necesită DI+ > DI− pentru BUY" value={!!rules.requireDiCross}
          description="Adaugă confirmare direcțională din sistemul Directional Index"
          onChange={(v) => set("requireDiCross", v)} />
        <Toggle label="Filtru MACD" value={!!rules.macdFilter}
          description="Necesită ca MACD Linie să fie deasupra/sub linia de semnal"
          onChange={(v) => set("macdFilter", v)} />
        {!!rules.macdFilter && (
          <div className="grid grid-cols-3 gap-4 pl-2 border-l-2 border-zinc-700">
            <Slider label="MACD Fast" name="macdFast" value={rules.macdFast ?? 12} min={3} max={30} step={1}
              onChange={(v) => set("macdFast", v)} />
            <Slider label="MACD Slow" name="macdSlow" value={rules.macdSlow ?? 26} min={10} max={100} step={1}
              onChange={(v) => set("macdSlow", v)} />
            <Slider label="MACD Signal" name="macdSignal" value={rules.macdSignal ?? 9} min={3} max={20} step={1}
              onChange={(v) => set("macdSignal", v)} />
          </div>
        )}
      </AdvancedSection>
    </div>
  );
}

// ─── Custom Strategy: Indicator Ref Editor ────────────────────────────────────

function getIndicatorDefaults(type: IndicatorRefType): IndicatorRef {
  const opt = INDICATOR_OPTS.find((o) => o.value === type);
  return {
    type,
    period:  opt?.hasPeriod  ? (opt.period1Default ?? 14) : undefined,
    period2: opt?.hasPeriod2 ? (opt.period2Default ?? 3)  : undefined,
    period3: opt?.hasPeriod3 ? (opt.period3Default ?? 9)  : undefined,
    value:   opt?.hasValue   ? 50 : undefined,
  };
}

function IndicatorEditor({
  ref: ref_,
  onChange,
}: {
  ref: IndicatorRef;
  onChange: (r: IndicatorRef) => void;
}) {
  const opt = INDICATOR_OPTS.find((o) => o.value === ref_.type);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Type select */}
      <div className="relative">
        <select
          value={ref_.type}
          onChange={(e) => onChange(getIndicatorDefaults(e.target.value as IndicatorRefType))}
          className="appearance-none bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-pink-500 pr-6 cursor-pointer"
        >
          {/* Group by category */}
          {Array.from(new Set(INDICATOR_OPTS.map((o) => o.group))).map((grp) => (
            <optgroup key={grp} label={grp}>
              {INDICATOR_OPTS.filter((o) => o.group === grp).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
      </div>

      {/* Period 1 */}
      {opt?.hasPeriod && (
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-zinc-600 mb-0.5">{opt.period1Label}</span>
          <input
            type="number"
            value={ref_.period ?? opt.period1Default ?? 14}
            min={1} max={500}
            onChange={(e) => onChange({ ...ref_, period: parseInt(e.target.value) || 1 })}
            className="w-12 bg-zinc-800 border border-zinc-700 rounded-md px-1.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-pink-500 num text-center"
          />
        </div>
      )}

      {/* Period 2 */}
      {opt?.hasPeriod2 && (
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-zinc-600 mb-0.5">{opt.period2Label}</span>
          <input
            type="number"
            value={ref_.period2 ?? opt.period2Default ?? 3}
            min={opt.period2Min ?? 1}
            max={opt.period2Max ?? 500}
            step={opt.period2Step ?? 1}
            onChange={(e) => onChange({ ...ref_, period2: parseFloat(e.target.value) || (opt.period2Min ?? 1) })}
            className="w-12 bg-zinc-800 border border-zinc-700 rounded-md px-1.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-pink-500 num text-center"
          />
        </div>
      )}

      {/* Period 3 */}
      {opt?.hasPeriod3 && (
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-zinc-600 mb-0.5">{opt.period3Label}</span>
          <input
            type="number"
            value={ref_.period3 ?? opt.period3Default ?? 9}
            min={1} max={50}
            onChange={(e) => onChange({ ...ref_, period3: parseInt(e.target.value) || 1 })}
            className="w-12 bg-zinc-800 border border-zinc-700 rounded-md px-1.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-pink-500 num text-center"
          />
        </div>
      )}

      {/* Constant value */}
      {opt?.hasValue && (
        <input
          type="number"
          value={ref_.value ?? 50}
          step={0.1}
          onChange={(e) => onChange({ ...ref_, value: parseFloat(e.target.value) || 0 })}
          className="w-16 bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-pink-500 num text-center"
        />
      )}
    </div>
  );
}

// ─── Custom Strategy: Condition Row ──────────────────────────────────────────

function ConditionRow({
  condition,
  onChange,
  onRemove,
}: {
  condition: CustomCondition;
  onChange: (c: CustomCondition) => void;
  onRemove: () => void;
}) {
  const opDef = OPERATOR_OPTS.find((o) => o.value === condition.op);

  return (
    <div className="flex items-start gap-2 flex-wrap bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2.5">
      {/* Left indicator */}
      <IndicatorEditor ref={condition.left} onChange={(r) => onChange({ ...condition, left: r })} />

      {/* Operator */}
      <div className="flex flex-col items-center">
        <span className="text-[9px] text-zinc-600 mb-0.5">operator</span>
        <div className="relative">
          <select
            value={condition.op}
            onChange={(e) => {
              const newOp = e.target.value as ConditionOperator;
              const newOpDef = OPERATOR_OPTS.find((o) => o.value === newOp);
              onChange({ ...condition, op: newOp, pctValue: newOpDef?.hasPct ? (condition.pctValue ?? 1.0) : undefined });
            }}
            className="appearance-none bg-zinc-900 border border-zinc-600 rounded-md px-2 py-1.5 text-xs font-medium text-zinc-300 focus:outline-none focus:border-pink-500 pr-5 cursor-pointer"
          >
            {OPERATOR_OPTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {/* Pct value (shown when pct operator) */}
      {opDef?.hasPct && (
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-zinc-600 mb-0.5">% val</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={condition.pctValue ?? 1.0}
              min={0.01} max={100} step={0.1}
              onChange={(e) => onChange({ ...condition, pctValue: parseFloat(e.target.value) || 0.1 })}
              className="w-14 bg-zinc-800 border border-zinc-700 rounded-md px-1.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-pink-500 num text-center"
            />
            <span className="text-xs text-zinc-500">%</span>
          </div>
        </div>
      )}

      {/* Right indicator */}
      <IndicatorEditor ref={condition.right} onChange={(r) => onChange({ ...condition, right: r })} />

      {/* Remove */}
      <button
        onClick={onRemove}
        className="ml-auto p-1 rounded-md hover:bg-rose-500/10 text-zinc-600 hover:text-rose-400 transition-colors self-center"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Custom Strategy Form ─────────────────────────────────────────────────────

interface CustomRulesState {
  entryLong: CustomCondition[];
  entryShort: CustomCondition[];
  slMultiplier: number;
  rrRatio: number;
  trendFilter: { enabled: boolean; type: "EMA" | "SMA"; period: number };
  atrPeriod: number;
}

function CustomStrategyForm({
  rules,
  onChange,
}: {
  rules: CustomRulesState;
  onChange: (r: CustomRulesState) => void;
}) {
  const addLong = () =>
    onChange({
      ...rules,
      entryLong: [
        ...rules.entryLong,
        { id: uid(), left: { type: "EMA", period: 9 }, op: "crosses_above", right: { type: "EMA", period: 21 } },
      ],
    });
  const addShort = () =>
    onChange({
      ...rules,
      entryShort: [
        ...rules.entryShort,
        { id: uid(), left: { type: "EMA", period: 9 }, op: "crosses_below", right: { type: "EMA", period: 21 } },
      ],
    });

  const updateLong  = (i: number, c: CustomCondition) => { const arr = [...rules.entryLong];  arr[i] = c; onChange({ ...rules, entryLong: arr }); };
  const updateShort = (i: number, c: CustomCondition) => { const arr = [...rules.entryShort]; arr[i] = c; onChange({ ...rules, entryShort: arr }); };
  const removeLong  = (i: number) => onChange({ ...rules, entryLong:  rules.entryLong.filter((_, j) => j !== i) });
  const removeShort = (i: number) => onChange({ ...rules, entryShort: rules.entryShort.filter((_, j) => j !== i) });

  return (
    <div className="space-y-4">
      {/* BUY conditions */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Condiții BUY</span>
            <span className="text-[10px] text-zinc-600">toate (AND)</span>
          </div>
          <button onClick={addLong} className="flex items-center gap-1 text-[11px] text-emerald-500 hover:text-emerald-300 transition-colors">
            <Plus className="h-3 w-3" /> Adaugă
          </button>
        </div>
        {rules.entryLong.length === 0 ? (
          <div className="text-center py-4 text-xs text-zinc-600 border border-dashed border-zinc-700/50 rounded-lg">
            Nicio condiție — nu va genera semnale BUY
          </div>
        ) : (
          rules.entryLong.map((c, i) => (
            <ConditionRow key={c.id} condition={c} onChange={(nc) => updateLong(i, nc)} onRemove={() => removeLong(i)} />
          ))
        )}
      </div>

      {/* SELL conditions */}
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wide">Condiții SELL</span>
            <span className="text-[10px] text-zinc-600">toate (AND)</span>
          </div>
          <button onClick={addShort} className="flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-300 transition-colors">
            <Plus className="h-3 w-3" /> Adaugă
          </button>
        </div>
        {rules.entryShort.length === 0 ? (
          <div className="text-center py-4 text-xs text-zinc-600 border border-dashed border-zinc-700/50 rounded-lg">
            Nicio condiție — nu va genera semnale SELL
          </div>
        ) : (
          rules.entryShort.map((c, i) => (
            <ConditionRow key={c.id} condition={c} onChange={(nc) => updateShort(i, nc)} onRemove={() => removeShort(i)} />
          ))
        )}
      </div>

      {/* Exit & Risk */}
      <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-4 space-y-4">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Exit & Risk</span>
        <div className="grid grid-cols-2 gap-4">
          <Slider label="Multiplicator SL (ATR)" name="slMultiplier" value={rules.slMultiplier} min={0.5} max={4} step={0.5}
            description="Stop Loss = ATR × multiplicator" onChange={(v) => onChange({ ...rules, slMultiplier: v })} />
          <Slider label="Risk:Reward Ratio" name="rrRatio" value={rules.rrRatio} min={1} max={5} step={0.5}
            description="Take Profit = Risk × R:R" onChange={(v) => onChange({ ...rules, rrRatio: v })} />
        </div>
        <Slider label="Perioadă ATR" name="atrPeriod" value={rules.atrPeriod} min={5} max={50} step={1}
          description="ATR pentru calculul SL dinamic" onChange={(v) => onChange({ ...rules, atrPeriod: v })} />

        {/* Trend filter */}
        <div className="border-t border-zinc-700/50 pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-zinc-300 font-medium">Filtru de trend</span>
              <p className="text-[11px] text-zinc-600">Tranzacționează BUY/SELL numai în direcția trending</p>
            </div>
            <button
              onClick={() => onChange({ ...rules, trendFilter: { ...rules.trendFilter, enabled: !rules.trendFilter.enabled } })}
              className={cn(
                "relative w-9 h-5 rounded-full transition-colors shrink-0 ml-3",
                rules.trendFilter.enabled ? "bg-pink-500" : "bg-zinc-700"
              )}
            >
              <span className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                rules.trendFilter.enabled ? "translate-x-4" : "translate-x-0.5"
              )} />
            </button>
          </div>
          {rules.trendFilter.enabled && (
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <div className="flex gap-2">
                {(["EMA","SMA"] as const).map((t) => (
                  <button key={t} onClick={() => onChange({ ...rules, trendFilter: { ...rules.trendFilter, type: t } })}
                    className={cn("px-2.5 py-1 rounded text-xs font-medium border transition-colors",
                      rules.trendFilter.type === t
                        ? "border-pink-500 bg-pink-500/20 text-pink-300"
                        : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                    )}>
                    {t}
                  </button>
                ))}
              </div>
              <input type="number" value={rules.trendFilter.period} min={10} max={500}
                onChange={(e) => onChange({ ...rules, trendFilter: { ...rules.trendFilter, period: parseInt(e.target.value) || 200 } })}
                className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-100 focus:outline-none focus:border-pink-500 num text-center" />
              <span className="text-xs text-zinc-600">
                {rules.trendFilter.type}({rules.trendFilter.period}) — Close trebuie să fie deasupra/sub MA
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Strategy preview */}
      <div className="rounded-lg bg-zinc-900/60 border border-zinc-800 p-3 text-[11px] text-zinc-500 leading-relaxed">
        <span className="text-zinc-400 font-medium">Rezumat: </span>
        {rules.entryLong.length > 0
          ? `BUY când ${rules.entryLong.map(c =>
              `${c.left.type}${c.left.period ? `(${c.left.period})` : ""} ${c.op.replace(/_/g," ")} ${c.right.type}${c.right.period ? `(${c.right.period})` : c.right.value != null ? `=${c.right.value}` : ""}${c.pctValue != null ? ` cu ${c.pctValue}%` : ""}`
            ).join(" ȘI ")}`
          : "Niciun semnal BUY"}
        {rules.entryShort.length > 0
          ? ` · SELL când ${rules.entryShort.map(c =>
              `${c.left.type}${c.left.period ? `(${c.left.period})` : ""} ${c.op.replace(/_/g," ")} ${c.right.type}${c.right.period ? `(${c.right.period})` : c.right.value != null ? `=${c.right.value}` : ""}${c.pctValue != null ? ` cu ${c.pctValue}%` : ""}`
            ).join(" ȘI ")}`
          : " · Niciun semnal SELL"}
        {" · "}<span className="text-zinc-400">SL: {rules.slMultiplier}×ATR({rules.atrPeriod}), TP: {rules.rrRatio}×Risk</span>
        {rules.trendFilter.enabled && (
          <span className="text-zinc-400"> · Trend: {rules.trendFilter.type}({rules.trendFilter.period})</span>
        )}
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function NewStrategyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const existingStrategyId = searchParams.get("strategyId");

  const [step, setStep] = React.useState<1 | 2 | 3>(existingStrategyId ? 3 : 1);
  const [selectedType, setSelectedType] = React.useState<string>("EMA_CROSSOVER");
  const [rules, setRules] = React.useState<Record<string, unknown>>(DEFAULT_RULES.EMA_CROSSOVER);
  const [strategyName, setStrategyName] = React.useState("");
  const [selectedColor, setSelectedColor] = React.useState(COLORS[0]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [savedStrategyId, setSavedStrategyId] = React.useState<string | null>(existingStrategyId);

  const [symbol, setSymbol] = React.useState("EURUSD");
  const [timeframe, setTimeframe] = React.useState("H1");
  const [startDate, setStartDate] = React.useState(() => {
    const d = new Date(); d.setFullYear(d.getFullYear() - 2); return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [initialBalance, setInitialBalance] = React.useState(10000);
  const [riskPerTrade, setRiskPerTrade] = React.useState(1.0);
  const [commission, setCommission] = React.useState(7);
  const [isRunning, setIsRunning] = React.useState(false);

  function selectType(id: string) {
    setSelectedType(id);
    setRules(DEFAULT_RULES[id] ?? {});
    const typeDef = STRATEGY_TYPES.find((s) => s.id === id);
    setStrategyName(`${typeDef?.name ?? id} Strategy`);
    if (typeDef) setSelectedColor(typeDef.color);
  }

  async function saveAndContinue() {
    if (!strategyName.trim()) {
      toast({ title: "Adaugă un nume strategiei", variant: "destructive" });
      return;
    }
    if (selectedType === "CUSTOM") {
      const r = rules as unknown as CustomRulesState;
      if (r.entryLong.length === 0 && r.entryShort.length === 0) {
        toast({ title: "Adaugă cel puțin o condiție BUY sau SELL", variant: "destructive" });
        return;
      }
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/backtesting/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: strategyName, type: selectedType, color: selectedColor, rules }),
      });
      if (!res.ok) throw new Error("Eroare la salvare");
      const data = await res.json();
      setSavedStrategyId(data.id);
      setStep(3);
    } catch {
      toast({ title: "Eroare", description: "Nu s-a putut salva strategia", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  async function runBacktest() {
    if (!savedStrategyId) return;
    setIsRunning(true);
    try {
      const res = await fetch("/api/backtesting/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategyId: savedStrategyId,
          symbol, timeframe,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          initialBalance, riskPerTrade, commission,
          spread: symbol.includes("JPY") ? 0.02 : 0.0002,
        }),
      });
      const data = await res.json();
      if (data.backtestId) {
        toast({ title: data.status === "COMPLETED" ? "Backtest complet!" : "Backtest creat", description: data.status === "COMPLETED" ? "Rezultatele sunt gata." : "Verifică statusul." });
        router.push(`/backtesting/results/${data.backtestId}`);
      } else {
        toast({ title: "Eroare backtest", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Eroare de rețea", variant: "destructive" });
    } finally {
      setIsRunning(false);
    }
  }

  const selectedStratDef = STRATEGY_TYPES.find((s) => s.id === selectedType)!;
  const isCustom = selectedType === "CUSTOM";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/backtesting")} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-black text-zinc-100">
            {existingStrategyId ? "Rulează Backtest" : "Strategie Nouă"}
          </h1>
          <p className="text-sm text-zinc-500">
            {step === 1 ? "Alege tipul de strategie" : step === 2 ? "Configurează parametrii" : "Configurează și rulează backtestul"}
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      {!existingStrategyId && (
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors",
                step > s ? "bg-indigo-600 text-white" : step === s ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40" : "bg-zinc-800 text-zinc-600"
              )}>
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && <div className={cn("flex-1 h-px", step > s ? "bg-indigo-500/40" : "bg-zinc-800")} />}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* STEP 1 — Choose Type */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {STRATEGY_TYPES.map((st) => {
              const Icon = st.icon;
              const isSelected = selectedType === st.id;
              const isCustomCard = st.id === "CUSTOM";
              return (
                <button
                  key={st.id}
                  onClick={() => selectType(st.id)}
                  className={cn(
                    "text-left p-5 rounded-xl border transition-all",
                    isCustomCard && "md:col-span-2",
                    isSelected
                      ? "border-indigo-500/60 bg-indigo-500/5 ring-1 ring-indigo-500/30"
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                  )}
                  style={isSelected ? {
                    borderColor: `${st.color}60`,
                    background: `${st.color}08`,
                    boxShadow: `0 0 0 1px ${st.color}30`,
                  } : {}}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${st.color}20`, border: `1px solid ${st.color}30` }}>
                      <Icon className="h-4.5 w-4.5" style={{ color: st.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-zinc-100">{st.name}</p>
                        {isCustomCard && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded border bg-pink-500/20 text-pink-300 border-pink-500/30 font-medium">
                            Builder vizual
                          </span>
                        )}
                        {isSelected && !isCustomCard && (
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", st.badgeClass)}>Selectat</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mb-3 leading-relaxed">{st.desc}</p>
                  {isCustomCard ? (
                    <div className="flex flex-wrap gap-2">
                      {st.details.map((d) => (
                        <span key={d} className="text-[11px] px-2 py-0.5 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400">
                          {d}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {st.details.map((d) => (
                        <li key={d} className="flex items-start gap-1.5 text-[11px] text-zinc-600">
                          <span className="text-emerald-500 mt-0.5">•</span> {d}
                        </li>
                      ))}
                    </ul>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white gap-2">
              Continuă <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2 — Configure Parameters */}
      {step === 2 && (
        <div className={cn(isCustom ? "space-y-5" : "grid md:grid-cols-2 gap-6")}>
          {isCustom ? (
            <>
              <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5">
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-zinc-800">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#ec489920" }}>
                    <Wand2 className="h-4 w-4" style={{ color: "#ec4899" }} />
                  </div>
                  <span className="text-sm font-semibold text-zinc-200">Constructor de strategie</span>
                  <span className="text-xs text-zinc-600 ml-1">— definești regulile tu</span>
                </div>
                <CustomStrategyForm
                  rules={rules as unknown as CustomRulesState}
                  onChange={(r) => setRules(r as unknown as Record<string, unknown>)}
                />
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 flex gap-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Nume strategie *</label>
                    <input type="text" value={strategyName} onChange={(e) => setStrategyName(e.target.value)}
                      placeholder="ex: EMA 9/21 + RSI personalizat"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-pink-500" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-2">Culoare</label>
                  <div className="flex flex-wrap gap-2 max-w-[120px]">
                    {COLORS.map((c) => (
                      <button key={c} onClick={() => setSelectedColor(c)}
                        className={cn("w-7 h-7 rounded-full transition-all", selectedColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110" : "hover:scale-105")}
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${selectedStratDef.color}20` }}>
                    <selectedStratDef.icon className="h-4 w-4" style={{ color: selectedStratDef.color }} />
                  </div>
                  <span className="text-sm font-semibold text-zinc-200">{selectedStratDef.name}</span>
                  <span className="text-xs text-zinc-600 ml-1">— parametri de bază + filtre avansate</span>
                </div>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {selectedType === "EMA_CROSSOVER"    && <EmaCrossoverForm    rules={rules as any} onChange={(r) => setRules(r as Record<string, unknown>)} />}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {selectedType === "SESSION_BREAKOUT" && <SessionBreakoutForm rules={rules as any} onChange={(r) => setRules(r as Record<string, unknown>)} />}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {selectedType === "RSI_REVERSAL"     && <RsiReversalForm     rules={rules as any} onChange={(r) => setRules(r as Record<string, unknown>)} />}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {selectedType === "TREND_FOLLOWING"  && <TrendFollowingForm  rules={rules as any} onChange={(r) => setRules(r as Record<string, unknown>)} />}
              </div>

              <div className="space-y-4">
                <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-zinc-200">Salvează strategia</h3>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Nume strategie *</label>
                    <input type="text" value={strategyName} onChange={(e) => setStrategyName(e.target.value)}
                      placeholder="ex: EMA 9/21 H1 — EURUSD"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-2">Culoare identificare</label>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map((c) => (
                        <button key={c} onClick={() => setSelectedColor(c)}
                          className={cn("w-7 h-7 rounded-full transition-all", selectedColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110" : "hover:scale-105")}
                          style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4">
                  <p className="text-xs text-zinc-500 mb-3 font-medium">PREVIEW STRATEGIE</p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: selectedColor }} />
                    <span className="text-sm font-semibold text-zinc-200">{strategyName || "—"}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(rules).slice(0, 6).map(([k, v]) => (
                      <span key={k} className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">
                        {k}: {typeof v === "object" ? "…" : String(v)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className={cn("flex items-center justify-between", isCustom ? "" : "md:col-span-2")}>
            <Button variant="outline" onClick={() => setStep(1)} className="border-zinc-700 text-zinc-400 gap-2">
              <ArrowLeft className="h-4 w-4" /> Înapoi
            </Button>
            <Button onClick={saveAndContinue} disabled={isSaving || !strategyName.trim()}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white gap-2">
              {isSaving ? "Se salvează..." : <>Salvează & Continuă <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 — Run Config */}
      {step === 3 && (
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-6 space-y-6">
          <h2 className="text-base font-semibold text-zinc-200 pb-3 border-b border-zinc-800">
            Configurare Backtest
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5 font-medium uppercase tracking-wide">Symbol</label>
              <div className="relative">
                <select value={symbol} onChange={(e) => setSymbol(e.target.value)}
                  className="w-full appearance-none bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 pr-8">
                  {SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5 font-medium uppercase tracking-wide">Timeframe</label>
              <div className="relative">
                <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full appearance-none bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 pr-8">
                  {TIMEFRAMES.map((tf) => <option key={tf.value} value={tf.value}>{tf.label}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5 font-medium uppercase tracking-wide">Data start</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500" />
              <div className="flex gap-1.5 mt-1.5">
                {[1, 2, 3, 5].map((y) => (
                  <button key={y} onClick={() => { const d = new Date(); d.setFullYear(d.getFullYear() - y); setStartDate(d.toISOString().slice(0, 10)); }}
                    className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-500 hover:text-indigo-300 hover:border-indigo-500/40 transition-colors">
                    -{y}A
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5 font-medium uppercase tracking-wide">Data end</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500" />
            </div>
            <NumberInput label="Capital inițial (USD)" name="initialBalance" value={initialBalance} min={100} max={10000000} step={1000} onChange={setInitialBalance} />
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Risk per trade</label>
                <span className="text-sm font-bold text-indigo-300 num bg-indigo-500/10 px-2 py-0.5 rounded-md">{riskPerTrade}%</span>
              </div>
              <input type="range" min={0.1} max={5} step={0.1} value={riskPerTrade}
                onChange={(e) => setRiskPerTrade(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-indigo-500" />
              <p className="text-[11px] text-zinc-600 mt-1">Risc ${(initialBalance * riskPerTrade / 100).toFixed(0)} per trade</p>
            </div>
            <NumberInput label="Comision per lot (USD)" name="commission" value={commission} min={0} max={100} step={1} description="De ex: 7 USD/lot (round-trip = 14)" onChange={setCommission} />
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <div className="text-xs text-zinc-600">
              Date preluate live din Yahoo Finance · {symbol} · {timeframe}
            </div>
            <Button onClick={runBacktest} disabled={isRunning || !savedStrategyId}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white gap-2 px-8 h-11 text-base font-semibold shadow-lg shadow-indigo-500/20">
              {isRunning ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Se rulează...</>
              ) : (
                <><Play className="h-5 w-5" />Rulează Backtestul</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
