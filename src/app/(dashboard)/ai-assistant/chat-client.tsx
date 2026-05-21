"use client";

import * as React from "react";
import {
  Brain, Send, BarChart3, Shield, TrendingUp, BookOpen,
  Sparkles, Copy, Check, RefreshCw, ChevronRight,
  Zap, Target, AlertTriangle, Trophy, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TraderStatsType } from "@/app/api/ai-assistant/chat/route";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  timestamp: Date;
}

type CoachMode = "general" | "performance" | "risk" | "psychology" | "strategy";

// ─── Constants ────────────────────────────────────────────────────────────────

const MODES: { id: CoachMode; label: string; icon: React.ElementType; color: string; desc: string }[] = [
  { id: "general",     label: "Coach General",    icon: Brain,     color: "violet",  desc: "Analiză completă și sfaturi generale" },
  { id: "performance", label: "Performanță",       icon: BarChart3, color: "indigo",  desc: "Deep dive în statisticile tale" },
  { id: "risk",        label: "Risk Management",   icon: Shield,    color: "amber",   desc: "Position sizing și protecția capitalului" },
  { id: "psychology",  label: "Psihologie",        icon: Brain,     color: "purple",  desc: "Disciplină, FOMO, revenge trading" },
  { id: "strategy",    label: "Strategii SMC",     icon: TrendingUp,color: "emerald", desc: "Order Blocks, FVG, Liquidity" },
];

const QUICK_PROMPTS: { category: string; icon: React.ElementType; color: string; prompts: string[] }[] = [
  {
    category: "Analiză",
    icon: BarChart3,
    color: "indigo",
    prompts: [
      "Analizează complet performanța mea din ultimele 30 de zile",
      "Care este cel mai slab aspect al trading-ului meu?",
      "De ce profit factor-ul meu este scăzut?",
      "Compară câștigurile cu pierderile mele",
    ],
  },
  {
    category: "Risk",
    icon: Shield,
    color: "amber",
    prompts: [
      "Cum să îmbunătățesc managementul riscului?",
      "Calculează risk-ul optim per trade pentru contul meu",
      "Analizează distribuția pierderilor mele",
      "Sunt over-leveraged pe vreun instrument?",
    ],
  },
  {
    category: "Psihologie",
    icon: Brain,
    color: "purple",
    prompts: [
      "Ce greșeli psihologice fac cel mai des?",
      "Cum să evit revenge trading?",
      "De ce tai profiturile prea devreme?",
      "Cum îmbunătățesc disciplina și răbdarea?",
    ],
  },
  {
    category: "Strategie",
    icon: TrendingUp,
    color: "emerald",
    prompts: [
      "Care este cel mai profitabil setup al meu?",
      "La ce ore și sesiuni obțin cele mai bune rezultate?",
      "Ce instrumente ar trebui să evit?",
      "Analizează setups-urile mele SMC/ICT",
    ],
  },
];

// ─── Markdown Renderer ────────────────────────────────────────────────────────

function MarkdownContent({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  const inlineFormat = (str: string): React.ReactNode => {
    const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={i} className="font-bold text-zinc-100">{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*"))
        return <em key={i} className="italic text-zinc-300">{part.slice(1, -1)}</em>;
      if (part.startsWith("`") && part.endsWith("`"))
        return <code key={i} className="bg-zinc-700/60 text-emerald-300 px-1 rounded text-[11px] font-mono">{part.slice(1, -1)}</code>;
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      elements.push(<h3 key={key++} className="text-sm font-bold text-zinc-100 mt-3 mb-1">{inlineFormat(line.slice(4))}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={key++} className="text-base font-bold text-zinc-100 mt-3 mb-1.5">{inlineFormat(line.slice(3))}</h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={key++} className="text-lg font-bold text-white mt-3 mb-2">{inlineFormat(line.slice(2))}</h1>);
    } else if (line.startsWith("━")) {
      elements.push(<hr key={key++} className="border-zinc-700/50 my-2" />);
    } else if (line.match(/^[-•]\s/)) {
      elements.push(
        <div key={key++} className="flex gap-2 items-start my-0.5">
          <span className="text-violet-400 mt-0.5 shrink-0">•</span>
          <span>{inlineFormat(line.slice(2))}</span>
        </div>
      );
    } else if (line.match(/^\d+\.\s/)) {
      const num = line.match(/^(\d+)\./)?.[1];
      elements.push(
        <div key={key++} className="flex gap-2 items-start my-0.5">
          <span className="text-violet-400 font-bold shrink-0 text-xs">{num}.</span>
          <span>{inlineFormat(line.replace(/^\d+\.\s/, ""))}</span>
        </div>
      );
    } else if (line === "") {
      elements.push(<div key={key++} className="h-1.5" />);
    } else {
      elements.push(<p key={key++} className="leading-relaxed">{inlineFormat(line)}</p>);
    }
  }

  return <div className="text-sm text-zinc-300 space-y-0.5">{elements}</div>;
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, onCopy, onRegenerate }: {
  msg: Message;
  onCopy: (text: string) => void;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const isAI = msg.role === "assistant";

  const handleCopy = () => {
    onCopy(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("flex gap-3 group", isAI ? "justify-start" : "justify-end")}>
      {isAI && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-violet-500/20">
          <Brain className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={cn("max-w-[82%] flex flex-col gap-1", isAI ? "items-start" : "items-end")}>
        <div className={cn(
          "rounded-2xl px-4 py-3 relative",
          isAI
            ? "bg-zinc-800/80 border border-zinc-700/50 rounded-tl-sm shadow-sm"
            : "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-sm shadow-md shadow-indigo-500/20"
        )}>
          {isAI ? (
            <>
              <MarkdownContent text={msg.content} />
              {msg.streaming && (
                <span className="inline-block w-2 h-4 bg-violet-400 ml-0.5 animate-pulse rounded-sm align-middle" />
              )}
            </>
          ) : (
            <p className="text-sm text-white leading-relaxed">{msg.content}</p>
          )}
        </div>

        {/* Action buttons */}
        {isAI && !msg.streaming && msg.content.length > 0 && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-1">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copiat" : "Copiază"}
            </button>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Regenerează
              </button>
            )}
          </div>
        )}

        <span className="text-[9px] text-zinc-600 px-1">
          {msg.timestamp.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {!isAI && (
        <div className="w-8 h-8 rounded-xl bg-zinc-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-zinc-300">
          TU
        </div>
      )}
    </div>
  );
}

// ─── Mode-specific suggested prompts ─────────────────────────────────────────

const MODE_PROMPTS: Record<CoachMode, { icon: React.ElementType; prompts: string[] }> = {
  general: {
    icon: Brain,
    prompts: [
      "Analizează complet profilul meu de trader și spune-mi unde stau",
      "Care este cel mai important lucru pe care trebuie să-l îmbunătățesc acum?",
      "Rezumă-mi performanța și dă-mi un plan de acțiune pentru această săptămână",
      "Ce pattern de greșeli se repetă cel mai des în trading-ul meu?",
      "Sunt pregătit să trec la un cont live sau mai am de lucrat?",
    ],
  },
  performance: {
    icon: BarChart3,
    prompts: [
      "Fă un breakdown detaliat al statisticilor mele — ce funcționează și ce nu",
      "Pe ce instrument și sesiune obțin cele mai bune rezultate?",
      "Compară win rate-ul cu R:R-ul meu — sunt echilibrate?",
      "Care sunt cele mai profitabile setup-uri ale mele și de ce?",
      "Analizează distribuția P&L-ului — am câștiguri constante sau sporadice?",
    ],
  },
  risk: {
    icon: Shield,
    prompts: [
      "Calculează risk-ul optim per trade în funcție de contul meu actual",
      "Sunt over-leveraged pe vreun instrument din istoricul meu?",
      "Cum să setez un stop-loss mai bun fără să fiu oprit prematur?",
      "Analizează cele mai mari drawdown-uri ale mele — ce a mers prost?",
      "Care este dimensiunea maximă de poziție recomandată pentru contul meu?",
    ],
  },
  psychology: {
    icon: Brain,
    prompts: [
      "Ce greșeli psihologice fac cel mai des în trading-ul meu?",
      "Cum să recunosc și să opresc revenge trading în timp real?",
      "De ce tai profiturile prea devreme și cum să remediez asta?",
      "Cum să gestionez o serie de pierderi fără să îmi afecteze disciplina?",
      "Creează-mi un ritual de pre-trading pentru a intra cu mintea clară",
    ],
  },
  strategy: {
    icon: TrendingUp,
    prompts: [
      "Analizează setup-urile mele SMC/ICT — care au confluențe mai bune?",
      "Cum să identific Order Block-uri valide vs. invalide pe grafic?",
      "La ce killzone ar trebui să tranzacționez în funcție de simbolurile mele?",
      "Explică-mi cum să folosesc Fair Value Gap-urile ca entry mai precis",
      "Cum să combin BOS + ChoCH + OB pentru un setup de înaltă probabilitate?",
    ],
  },
};

// ─── Welcome Screen ───────────────────────────────────────────────────────────

function WelcomeScreen({ stats, onPrompt, onModeSelect }: {
  stats: TraderStatsType;
  onPrompt: (p: string) => void;
  onModeSelect: (m: CoachMode) => void;
}) {
  const [activeMode, setActiveMode] = React.useState<CoachMode>("general");

  const handleModeClick = (id: CoachMode) => {
    setActiveMode(id);
    onModeSelect(id);
  };

  const activeModeData = MODES.find(m => m.id === activeMode)!;
  const { prompts: modePrompts } = MODE_PROMPTS[activeMode];

  return (
    <div className="flex flex-col items-center justify-start py-8 px-4 gap-8">
      {/* Avatar + greeting */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-xl shadow-violet-500/30">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-zinc-950 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-zinc-100">Bună, {stats.userName}!</h2>
          <p className="text-sm text-zinc-500 mt-0.5">TradeGX AI Coach — pregătit să te ajut</p>
        </div>
      </div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-4 gap-2 w-full max-w-lg">
        {[
          { label: "Win Rate",     value: `${stats.winRate}%`, ok: parseFloat(stats.winRate) >= 50, icon: Target },
          { label: "Profit Factor",value: stats.profitFactor,  ok: parseFloat(stats.profitFactor) >= 1.2, icon: Zap },
          { label: "P&L Cont",     value: `${stats.accountPnl >= 0 ? "+" : ""}$${stats.accountPnl.toFixed(0)}`, ok: stats.accountPnl >= 0, icon: TrendingUp },
          { label: "Total Trades", value: String(stats.totalTrades), ok: true, icon: BarChart3 },
        ].map(({ label, value, ok, icon: Icon }) => (
          <div key={label} className={cn(
            "rounded-xl p-3 border text-center",
            ok ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"
          )}>
            <Icon className={cn("w-3.5 h-3.5 mx-auto mb-1", ok ? "text-emerald-400" : "text-rose-400")} />
            <p className={cn("text-sm font-bold num", ok ? "text-emerald-300" : "text-rose-300")}>{value}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Coaching modes */}
      <div className="w-full max-w-lg">
        <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-semibold mb-2 text-center">Alege modul de coaching</p>
        <div className="grid grid-cols-5 gap-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            const isActive = activeMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleModeClick(m.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all text-center group",
                  isActive
                    ? `bg-${m.color}-500/10 border-${m.color}-500/30`
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800/80"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                  isActive ? `bg-${m.color}-500/20` : `bg-${m.color}-500/10 group-hover:bg-${m.color}-500/20`
                )}>
                  <Icon className={cn("w-3.5 h-3.5", `text-${m.color}-400`)} />
                </div>
                <span className={cn(
                  "text-[10px] transition-colors leading-tight",
                  isActive ? "text-zinc-200 font-medium" : "text-zinc-500 group-hover:text-zinc-300"
                )}>
                  {m.label}
                </span>
                {isActive && (
                  <div className={cn("w-1 h-1 rounded-full", `bg-${m.color}-400`)} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode-specific suggested prompts */}
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-semibold">
            Întrebări — {activeModeData.label}
          </p>
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide",
            `bg-${activeModeData.color}-500/10 text-${activeModeData.color}-400`
          )}>
            <activeModeData.icon className="w-2.5 h-2.5" />
            {activeModeData.desc}
          </div>
        </div>
        <div className="space-y-1.5">
          {modePrompts.map((p) => (
            <button
              key={p}
              onClick={() => onPrompt(p)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-zinc-900 border transition-all text-left group",
                `border-zinc-800 hover:border-${activeModeData.color}-500/30 hover:bg-${activeModeData.color}-500/5`
              )}
            >
              <Sparkles className={cn("w-3.5 h-3.5 shrink-0", `text-${activeModeData.color}-500`)} />
              <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">{p}</span>
              <ChevronRight className={cn("w-3 h-3 text-zinc-700 ml-auto transition-colors", `group-hover:text-${activeModeData.color}-400`)} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Stats Sidebar ────────────────────────────────────────────────────────────

function StatsSidebar({ stats, mode, onModeChange }: {
  stats: TraderStatsType;
  mode: CoachMode;
  onModeChange: (m: CoachMode) => void;
}) {
  const pf = parseFloat(stats.profitFactor);
  const wr = parseFloat(stats.winRate);
  const pnlOk = stats.accountPnl >= 0;

  return (
    <div className="space-y-3">
      {/* Mode selector */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2.5">Modul de coaching</p>
        <div className="space-y-1">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button key={m.id} onClick={() => onModeChange(m.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all",
                  active ? `bg-${m.color}-500/10 border border-${m.color}-500/20` : "hover:bg-zinc-800/60 border border-transparent"
                )}>
                <Icon className={cn("w-3.5 h-3.5 shrink-0", active ? `text-${m.color}-400` : "text-zinc-600")} />
                <div className="min-w-0">
                  <p className={cn("text-xs font-medium", active ? "text-zinc-100" : "text-zinc-400")}>{m.label}</p>
                  {active && <p className="text-[10px] text-zinc-600 truncate">{m.desc}</p>}
                </div>
                {active && <div className={cn("w-1.5 h-1.5 rounded-full ml-auto shrink-0", `bg-${m.color}-400`)} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Context card - what AI knows */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Context AI</p>
        </div>
        <div className="space-y-2">
          {[
            { label: "Win Rate",      value: `${stats.winRate}%`,  good: wr >= 50,  warn: wr >= 45 },
            { label: "Profit Factor", value: stats.profitFactor,   good: pf >= 1.5, warn: pf >= 1.0 },
            { label: "P&L Cont",      value: `${pnlOk ? "+" : ""}$${stats.accountPnl.toFixed(0)} (${stats.accountPnlPct}%)`, good: pnlOk, warn: false },
            { label: "R:R Mediu",     value: stats.avgRR,          good: parseFloat(stats.avgRR) >= 1.5, warn: parseFloat(stats.avgRR) >= 1.0 },
            { label: "Tranzacții",    value: String(stats.totalTrades), good: true, warn: false },
            { label: "Top Symbol",    value: stats.topSymbol,      good: true, warn: false },
            { label: "Best Setup",    value: stats.bestSetup,      good: true, warn: false },
          ].map(({ label, value, good, warn }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">{label}</span>
              <span className={cn(
                "text-[11px] font-semibold num",
                good ? "text-emerald-400" : warn ? "text-amber-400" : "text-rose-400"
              )}>{value}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-700 mt-3 leading-relaxed">
          AI are acces la toate aceste date în timp real.
        </p>
      </div>

      {/* Alerts */}
      {(wr < 45 || pf < 1.0 || stats.accountPnl < 0) && (
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">Atenție</p>
          </div>
          <div className="space-y-1">
            {wr < 45 && <p className="text-[11px] text-rose-300">Win rate sub 45% — analizează cu AI</p>}
            {pf < 1.0 && <p className="text-[11px] text-rose-300">Profit factor sub 1.0 — piezi bani</p>}
            {stats.accountPnl < 0 && <p className="text-[11px] text-rose-300">Cont în pierdere față de depozit</p>}
          </div>
        </div>
      )}

      {/* Win streak */}
      {stats.longestWinStreak >= 3 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <p className="text-[10px] font-semibold text-amber-400">Serie câștigătoare</p>
          </div>
          <p className="text-[11px] text-zinc-400">Cea mai bună serie: <span className="text-amber-300 font-bold">{stats.longestWinStreak} trade-uri</span></p>
        </div>
      )}

      {/* Tips */}
      <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">Sfat sesiune</p>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          {pf < 1.2
            ? "Profit factor scăzut sugerează că lași pierderile să crească sau tai câștigurile prea devreme. Întreabă AI despre trailing stop."
            : wr < 50
            ? "Win rate sub 50% e OK dacă R:R e mare. Cere AI să analizeze distribuția R:R-ului tău."
            : "Performanță solidă! Cere AI să identifice ce setup-uri trebuie scalate mai agresiv."}
        </p>
      </div>
    </div>
  );
}

// ─── Main Chat Client ─────────────────────────────────────────────────────────

export function AIChatClient({ stats }: { stats: TraderStatsType }) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [mode, setMode] = React.useState<CoachMode>("general");
  const [showQuickPrompts, setShowQuickPrompts] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  React.useEffect(() => { scrollToBottom(); }, [messages]);

  const uid = () => Math.random().toString(36).slice(2, 9);

  async function sendMessage(content: string) {
    if (!content.trim() || isStreaming) return;
    setInput("");
    setShowQuickPrompts(false);

    const userMsg: Message = { id: uid(), role: "user", content: content.trim(), timestamp: new Date() };
    const aiId = uid();
    const aiMsg: Message = { id: aiId, role: "assistant", content: "", streaming: true, timestamp: new Date() };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setIsStreaming(true);

    abortRef.current = new AbortController();

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai-assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, mode }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Eroare necunoscută" }));
        setMessages(prev => prev.map(m => m.id === aiId
          ? { ...m, content: `⚠️ ${err.error}`, streaming: false }
          : m));
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: fullText } : m));
      }

      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, streaming: false } : m));
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages(prev => prev.map(m => m.id === aiId
          ? { ...m, content: "⚠️ Conexiunea a eșuat. Verifică cheia API Anthropic.", streaming: false }
          : m));
      }
    } finally {
      setIsStreaming(false);
    }
  }

  async function regenerateLast() {
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    if (!lastUser) return;
    const idx = messages.map(m => m.role).lastIndexOf("assistant");
    if (idx < 0) return;
    setMessages(prev => prev.filter((_, i) => i < idx));
    await sendMessage(lastUser.content);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text).catch(() => {});

  const activeMode = MODES.find(m => m.id === mode)!;

  return (
    <div className="flex gap-5 h-[calc(100vh-8.5rem)]">
      {/* ── Chat area ── */}
      <div className="flex-1 min-w-0 flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-violet-500/20 bg-zinc-900/90 backdrop-blur-sm shrink-0" style={{ background: "linear-gradient(90deg, rgba(139,92,246,0.06) 0%, rgba(9,9,11,0.95) 100%)" }}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30" style={{ boxShadow: "0 0 16px rgba(139,92,246,0.4)" }}>
            <Brain className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold gradient-text-cyber">TradeGX AI Coach</p>
            <p className="text-[10px] text-zinc-500">
              {isStreaming ? (
                <span className="text-violet-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse inline-block" />
                  Generează răspuns...
                </span>
              ) : "Online · Claude Opus"}
            </p>
          </div>

          {/* Mode badge */}
          <div className={cn(
            "ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium",
            `bg-${activeMode.color}-500/10 border-${activeMode.color}-500/20 text-${activeMode.color}-300`
          )}>
            <activeMode.icon className="w-3.5 h-3.5" />
            {activeMode.label}
          </div>

          {messages.length > 0 && (
            <button onClick={() => setMessages([])}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors text-[10px] border border-zinc-800 hover:border-zinc-600 ml-1">
              New chat
            </button>
          )}
        </div>

        {/* Messages / Welcome */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {messages.length === 0 ? (
            <WelcomeScreen
              stats={stats}
              onPrompt={sendMessage}
              onModeSelect={(m) => { setMode(m); }}
            />
          ) : (
            messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                onCopy={copyToClipboard}
                onRegenerate={i === messages.length - 1 && msg.role === "assistant" ? regenerateLast : undefined}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts */}
        {showQuickPrompts && (
          <div className="border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-sm px-4 py-3">
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {QUICK_PROMPTS.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.category} className="shrink-0">
                    <p className={cn("text-[9px] font-semibold uppercase tracking-wide mb-1.5", `text-${cat.color}-400`)}>
                      {cat.category}
                    </p>
                    <div className="space-y-1">
                      {cat.prompts.map((p) => (
                        <button key={p} onClick={() => sendMessage(p)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-[11px] text-zinc-400 hover:text-zinc-200 transition-all whitespace-nowrap max-w-[220px] truncate">
                          <Icon className={cn("w-3 h-3 shrink-0", `text-${cat.color}-500`)} />
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-4 border-t border-zinc-800 bg-zinc-900 shrink-0">
          <div className="flex items-end gap-2">
            <button
              onClick={() => setShowQuickPrompts(!showQuickPrompts)}
              className={cn(
                "p-2 rounded-lg border transition-colors shrink-0 mb-0.5",
                showQuickPrompts
                  ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                  : "border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
              )}
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <div className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden focus-within:border-violet-500/50 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Întreabă ceva despre trading-ul tău... (Enter = trimite)"
                disabled={isStreaming}
                rows={1}
                className="w-full bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none px-4 py-3 max-h-32 overflow-y-auto"
                style={{ minHeight: "44px" }}
              />
            </div>

            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                input.trim() && !isStreaming
                  ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              )}
            >
              {isStreaming ? (
                <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[10px] text-zinc-700">Shift+Enter = linie nouă</p>
            <p className="text-[10px] text-zinc-700">Powered by Claude Opus</p>
          </div>
        </div>
      </div>

      {/* ── Stats Sidebar ── */}
      <div className="w-64 shrink-0 overflow-y-auto space-y-3 pb-4">
        <StatsSidebar stats={stats} mode={mode} onModeChange={setMode} />
      </div>
    </div>
  );
}
