"use client";

import * as React from "react";
import {
  TrendingUp, TrendingDown, Target, Shield, Crosshair, ChevronDown,
  Sparkles, Clock, Activity, AlertTriangle, CheckCircle2, Loader2, Brain, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TelegramChannelCard } from "@/components/telegram-channel-card";

interface Signal {
  id: string;
  symbol: string;
  instrumentType: string;
  direction: "BUY" | "SELL";
  timeframe: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  takeProfit2: number | null;
  riskReward: number;
  confidence: number;
  setupType: string | null;
  bias: string | null;
  session: string | null;
  rationale: string;
  confirmation: string;
  invalidation: string | null;
  status: string;
  createdAt: string;
}

const SETUP_LABELS: Record<string, string> = {
  ORDER_BLOCK: "Order Block", FAIR_VALUE_GAP: "Fair Value Gap", LIQUIDITY_SWEEP: "Liquidity Sweep",
  BOS: "Break of Structure", CHOCH: "Change of Character", BREAKER: "Breaker Block",
  MITIGATION: "Mitigation", REJECTION: "Rejection", TREND_FOLLOW: "Trend Follow",
  SCALP: "Scalp", OTHER: "Setup",
};
const SESSION_LABELS: Record<string, string> = {
  ASIAN: "Sesiune Asia", LONDON: "Sesiune Londra", NEW_YORK: "Sesiune New York", OVERLAP: "Overlap LDN/NY",
};
const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "Activ", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  TP_HIT: { label: "TP atins", cls: "bg-emerald-600/20 text-emerald-300 border-emerald-500/40" },
  SL_HIT: { label: "SL atins", cls: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
  EXPIRED: { label: "Expirat", cls: "bg-zinc-700/40 text-zinc-500 border-zinc-600/40" },
};

function fmtPrice(n: number) {
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return n.toFixed(n < 10 ? 5 : 3);
}

function SignalCard({ s }: { s: Signal }) {
  const [open, setOpen] = React.useState(false);
  const isBuy = s.direction === "BUY";
  const statusCfg = STATUS_CFG[s.status] ?? STATUS_CFG.ACTIVE;
  const confColor = s.confidence >= 80 ? "text-emerald-400" : s.confidence >= 70 ? "text-amber-400" : "text-zinc-400";
  const confBar = s.confidence >= 80 ? "bg-emerald-500" : s.confidence >= 70 ? "bg-amber-500" : "bg-zinc-500";

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden transition-all duration-300 premium-card",
      isBuy ? "border-emerald-500/25 hover:border-emerald-400/50" : "border-rose-500/25 hover:border-rose-400/50"
    )}
      style={{ background: "linear-gradient(135deg, rgba(24,24,28,0.97) 0%, rgba(15,15,18,0.99) 100%)" }}>
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-2xl border flex flex-col items-center justify-center shrink-0",
              isBuy ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30"
            )}>
              {isBuy ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-rose-400" />}
              <span className={cn("text-[9px] font-black mt-0.5", isBuy ? "text-emerald-400" : "text-rose-400")}>{s.direction}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white tracking-tight">{s.symbol}</h3>
                <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{s.timeframe}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {s.setupType && (
                  <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                    {SETUP_LABELS[s.setupType] ?? s.setupType}
                  </span>
                )}
                {s.session && (
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />{SESSION_LABELS[s.session] ?? s.session}
                  </span>
                )}
              </div>
            </div>
          </div>
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0", statusCfg.cls)}>
            {statusCfg.label}
          </span>
        </div>

        {/* Încredere */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Încredere AI</span>
            <span className={cn("text-xs font-black num", confColor)}>{s.confidence}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-700", confBar)} style={{ width: `${s.confidence}%` }} />
          </div>
        </div>

        {/* Niveluri */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="rounded-xl bg-zinc-800/40 border border-zinc-700/40 px-3 py-2">
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-indigo-400/80"><Crosshair className="w-2.5 h-2.5" />Entry</div>
            <p className="text-sm font-black text-zinc-100 num mt-0.5">{fmtPrice(s.entryPrice)}</p>
          </div>
          <div className="rounded-xl bg-rose-500/8 border border-rose-500/20 px-3 py-2">
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-rose-400/80"><Shield className="w-2.5 h-2.5" />SL</div>
            <p className="text-sm font-black text-rose-300 num mt-0.5">{fmtPrice(s.stopLoss)}</p>
          </div>
          <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 px-3 py-2">
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400/80"><Target className="w-2.5 h-2.5" />TP</div>
            <p className="text-sm font-black text-emerald-300 num mt-0.5">{fmtPrice(s.takeProfit)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 text-xs">
          <span className="text-zinc-500">R:R <span className="text-zinc-200 font-bold num">1:{s.riskReward}</span></span>
          {s.takeProfit2 && (
            <span className="text-zinc-500">TP2 <span className="text-emerald-400/80 font-bold num">{fmtPrice(s.takeProfit2)}</span></span>
          )}
          {s.bias && (
            <span className={cn("font-semibold", isBuy ? "text-emerald-400" : "text-rose-400")}>{s.bias}</span>
          )}
        </div>

        {/* Toggle detalii */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/8 hover:bg-indigo-500/15 border border-indigo-500/20 rounded-xl py-2 transition-all"
        >
          {open ? "Ascunde analiza" : "Vezi analiza completă"}
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {/* Detalii expandate */}
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-zinc-800/60 pt-4 animate-fade-in">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              <Brain className="w-3 h-3 text-indigo-400" /> Analiză & raționament
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">{s.rationale}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Confirmare înainte de intrare
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">{s.confirmation}</p>
          </div>
          {s.invalidation && (
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                <AlertTriangle className="w-3 h-3 text-amber-400" /> Invalidare
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">{s.invalidation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SignalsClient({ initialSignals, date }: { initialSignals: Signal[]; date: string }) {
  const [signals, setSignals] = React.useState<Signal[]>(initialSignals);
  const [generating, setGenerating] = React.useState(false);
  const triggered = React.useRef(false);

  const generate = React.useCallback(async () => {
    if (triggered.current) return;
    triggered.current = true;
    setGenerating(true);
    try {
      const res = await fetch("/api/signals", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setSignals(data.signals ?? []);
      }
    } finally {
      setGenerating(false);
    }
  }, []);

  // Generează automat dacă nu există semnale pentru azi
  React.useEffect(() => {
    if (initialSignals.length === 0) generate();
  }, [initialSignals.length, generate]);

  const dateLabel = new Date(date).toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Semnale AI</h1>
            <span className="text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
              HPS
            </span>
          </div>
          <p className="text-sm text-zinc-500 capitalize">{dateLabel} · maxim 3 setup-uri de înaltă probabilitate</p>
        </div>
        {signals.length > 0 && (
          <button
            onClick={() => { triggered.current = false; generate(); }}
            disabled={generating}
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-700/60 rounded-xl px-3 py-2 transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", generating && "animate-spin")} />
            Reîmprospătează
          </button>
        )}
      </div>

      {/* Disclaimer */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-300 mb-1">Atenție — acestea nu sunt sfaturi financiare</p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Semnalele sunt generate de inteligență artificială pe baza analizei tehnice și au caracter pur
              <span className="text-zinc-300 font-medium"> educativ și informativ</span>. Nu constituie consiliere
              financiară, de investiții sau o recomandare de a tranzacționa. Tranzacționarea pe piețele financiare implică
              un <span className="text-amber-300 font-medium">risc ridicat de pierdere a capitalului</span>. Niciun semnal nu
              are o rată de succes de 100% — performanțele trecute nu garantează rezultate viitoare. Fă-ți propria analiză,
              gestionează-ți riscul și nu tranzacționa niciodată cu bani pe care nu îți permiți să îi pierzi. Deciziile de
              tranzacționare îți aparțin în totalitate.
            </p>
          </div>
        </div>
      </div>

      {/* Invitație canal Telegram */}
      <TelegramChannelCard variant="full" />

      {/* Conținut */}
      {generating && signals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Brain className="w-7 h-7 text-indigo-400 animate-pulse" />
            </div>
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin absolute -bottom-1 -right-1" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-zinc-200">AI-ul analizează piețele...</p>
            <p className="text-xs text-zinc-500 mt-1">Identifică cele mai bune setup-uri ale zilei. Durează ~10-20 secunde.</p>
          </div>
        </div>
      ) : signals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center">
            <Activity className="w-6 h-6 text-zinc-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-300">Niciun setup de înaltă probabilitate astăzi</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-md">
              AI-ul nu a identificat condiții de piață suficient de clare. Calitate peste cantitate — uneori cea mai bună tranzacție e să aștepți.
            </p>
          </div>
          <button
            onClick={() => { triggered.current = false; generate(); }}
            className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Încearcă din nou
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {signals.map((s) => <SignalCard key={s.id} s={s} />)}
        </div>
      )}
    </div>
  );
}
