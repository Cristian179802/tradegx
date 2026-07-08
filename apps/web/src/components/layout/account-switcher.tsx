"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  ChevronDown, Check, Plus, Settings2, TrendingUp, TrendingDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";
import { AccountDialog } from "@/components/accounts/account-dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TradingAccount {
  id: string;
  name: string;
  type: "DEMO" | "CHALLENGE" | "LIVE";
  broker: string | null;
  balance: string | number;
  currency: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, {
  dot: string;
  badge: string;
  label: string;
  glow: string;
  pulse: boolean;
}> = {
  DEMO: {
    dot: "bg-zinc-400",
    badge: "text-zinc-300 bg-zinc-800/80 border-zinc-700",
    label: "DEMO",
    glow: "shadow-zinc-500/10",
    pulse: false,
  },
  CHALLENGE: {
    dot: "bg-amber-400",
    badge: "text-amber-300 bg-amber-500/15 border-amber-500/30",
    label: "CHALLENGE",
    glow: "shadow-amber-500/10",
    pulse: false,
  },
  LIVE: {
    dot: "bg-emerald-400",
    badge: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
    label: "LIVE",
    glow: "shadow-emerald-500/20",
    pulse: true,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBalance(balance: string | number, currency: string, locale: string): string {
  const num = typeof balance === "string" ? parseFloat(balance) : balance;
  return new Intl.NumberFormat(locale === "ro" ? "ro-RO" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

// ─── Trigger pill 3D ──────────────────────────────────────────────────────────

function AccountPill({ account }: { account: TradingAccount }) {
  const locale  = useLocale();
  const cfg     = TYPE_CONFIG[account.type];
  const balance = typeof account.balance === "string" ? parseFloat(account.balance) : account.balance;
  const isPositive = balance >= 10000;

  const [tilt, setTilt]       = useState({ x: 0, y: 0 });
  const [light, setLight]     = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el   = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px   = (e.clientX - rect.left) / rect.width;   // 0–1
    const py   = (e.clientY - rect.top)  / rect.height;  // 0–1
    setTilt({ x: (py - 0.5) * 10, y: -(px - 0.5) * 14 });
    setLight({ x: px * 100, y: py * 100 });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
    setLight({ x: 50, y: 50 });
    setHovered(false);
  }

  // Culori accent per tip cont
  const accent =
    account.type === "LIVE"      ? { r: 52,  g: 211, b: 153 } :   // emerald
    account.type === "CHALLENGE" ? { r: 251, g: 191, b: 36  } :   // amber
                                   { r: 161, g: 161, b: 170 };    // zinc

  const accentRgb  = `${accent.r},${accent.g},${accent.b}`;
  const balGrad    =
    account.type === "LIVE"      ? "linear-gradient(90deg,#6ee7b7,#34d399)" :
    account.type === "CHALLENGE" ? "linear-gradient(90deg,#fde68a,#f59e0b)" :
                                   "linear-gradient(90deg,#e4e4e7,#a1a1aa)";

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="cursor-pointer select-none"
      style={{
        transform: `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovered ? 1.04 : 1})`,
        transition: hovered
          ? "transform 0.06s linear"
          : "transform 0.35s cubic-bezier(.22,.68,0,1.2)",
      }}
    >
      <div
        className="relative flex items-center gap-3 h-10 px-4 rounded-xl overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse at ${light.x}% ${light.y}%,
              rgba(${accentRgb},0.08) 0%, transparent 65%),
            linear-gradient(145deg,
              rgba(28,28,40,0.98) 0%,
              rgba(14,14,22,0.99) 55%,
              rgba(20,20,32,0.98) 100%)
          `,
          boxShadow: `
            0 0 0 1px rgba(${accentRgb},${hovered ? 0.3 : 0.12}),
            0 0 0 1px rgba(255,255,255,0.04),
            0 2px 0 rgba(255,255,255,0.05) inset,
            0 -1px 0 rgba(0,0,0,0.6) inset,
            0 8px 24px rgba(0,0,0,0.45),
            ${hovered ? `0 0 28px rgba(${accentRgb},0.18)` : "0 0 0 transparent"}
          `,
        }}
      >
        {/* Top bevel — crea iluzia de muchie 3D */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent pointer-events-none" />

        {/* Shimmer holografic la hover */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: hovered ? 1 : 0,
            background: `linear-gradient(
              105deg,
              transparent 20%,
              rgba(${accentRgb},0.06) 45%,
              rgba(255,255,255,0.04) 50%,
              rgba(${accentRgb},0.06) 55%,
              transparent 80%
            )`,
          }}
        />

        {/* Badge tip cont */}
        <div
          className={cn(
            "relative z-10 flex items-center gap-1.5 px-2.5 py-[5px] rounded-lg",
            "text-[9px] font-black tracking-[0.1em] leading-none shrink-0",
            account.type === "DEMO"
              ? "bg-zinc-700/50 text-zinc-300 border border-zinc-600/25"
              : account.type === "CHALLENGE"
              ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
              : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
          )}
          style={{
            boxShadow: `0 1px 0 rgba(255,255,255,0.06) inset, 0 -1px 0 rgba(0,0,0,0.3) inset`,
          }}
        >
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot, cfg.pulse && "animate-pulse")} />
          {cfg.label}
        </div>

        {/* Separator vertical */}
        <div className="h-5 w-px shrink-0 bg-gradient-to-b from-transparent via-zinc-600/50 to-transparent" />

        {/* Info cont */}
        <div className="flex flex-col gap-[3px] min-w-0 flex-1">
          <span className="text-[10px] font-semibold text-zinc-400 leading-none truncate max-w-[110px]">
            {account.name}
          </span>
          <span
            className="text-[13px] font-mono font-bold leading-none"
            style={{
              background: balGrad,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: hovered ? "brightness(1.15)" : "brightness(1)",
              transition: "filter 0.2s",
            }}
          >
            {formatBalance(account.balance, account.currency, locale)}
          </span>
        </div>

        {/* Trend */}
        {isPositive
          ? <TrendingUp  className="w-3.5 h-3.5 text-emerald-400/80 shrink-0" />
          : <TrendingDown className="w-3.5 h-3.5 text-rose-400/80 shrink-0" />
        }

        {/* Chevron */}
        <ChevronDown
          className="w-3.5 h-3.5 shrink-0 transition-all duration-200"
          style={{ color: hovered ? `rgb(${accentRgb})` : "#71717a" }}
        />

        {/* Bottom reflection */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-700/25 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AccountSwitcher() {
  const t = useTranslations("accountSwitcher");
  const locale = useLocale();
  const { activeAccountId, setActiveAccountId } = useAuthStore();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<TradingAccount | null>(null);

  const loadAccounts = useCallback(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data: TradingAccount[]) => {
        if (Array.isArray(data)) {
          setAccounts(data);
          if (data.length > 0 && !activeAccountId) {
            setActiveAccountId(data[0].id);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const active = accounts.find((a) => a.id === activeAccountId) ?? accounts[0];

  if (loading) {
    return <div className="h-9 w-52 rounded-xl bg-zinc-800/60 animate-pulse" />;
  }

  if (!active) {
    return (
      <>
        <button
          onClick={() => { setEditAccount(null); setDialogOpen(true); }}
          className="flex items-center gap-2 h-9 px-4 rounded-xl border border-dashed border-zinc-700 hover:border-zinc-500 text-zinc-500 hover:text-zinc-300 text-xs transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("addAccount")}
        </button>

        <AccountDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSuccess={() => { loadAccounts(); setDialogOpen(false); }}
          account={null}
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="outline-none focus:outline-none">
            <AccountPill account={active} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="center"
          sideOffset={6}
          className="w-72 bg-zinc-900/95 border-zinc-800 text-zinc-300 backdrop-blur-sm p-1.5"
        >
          <DropdownMenuLabel className="text-zinc-500 text-[10px] font-semibold uppercase tracking-widest px-2 pt-1 pb-2">
            {t("yourAccounts")}
          </DropdownMenuLabel>

          {accounts.map((account) => {
            const cfg = TYPE_CONFIG[account.type];
            return (
              <DropdownMenuItem
                key={account.id}
                onClick={() => setActiveAccountId(account.id)}
                className={cn(
                  "flex items-center gap-3 cursor-pointer rounded-lg px-2 py-2.5",
                  "hover:bg-zinc-800 focus:bg-zinc-800 focus:text-zinc-100",
                  account.id === activeAccountId && "bg-zinc-800/60",
                )}
              >
                {/* Dot */}
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    cfg.dot,
                    cfg.pulse && account.id === activeAccountId && "animate-pulse",
                  )}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-zinc-100 truncate">
                      {account.name}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn("text-[9px] px-1 py-0 h-3.5 shrink-0 leading-none", cfg.badge)}
                    >
                      {cfg.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-zinc-400 font-mono">
                      {formatBalance(account.balance, account.currency, locale)}
                    </span>
                    {account.broker && (
                      <span className="text-xs text-zinc-600 truncate">· {account.broker}</span>
                    )}
                  </div>
                </div>

                {/* Checkmark */}
                {account.id === activeAccountId && (
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                )}
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator className="bg-zinc-800 my-1.5" />

          {/* Add new account */}
          <DropdownMenuItem
            onClick={() => { setEditAccount(null); setDialogOpen(true); }}
            className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-2 hover:bg-zinc-800 focus:bg-zinc-800 text-zinc-400 hover:text-zinc-200 focus:text-zinc-200"
          >
            <div className="w-6 h-6 rounded-md bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200">{t("addNewAccount")}</p>
              <p className="text-[10px] text-zinc-500">{t("addNewSub")}</p>
            </div>
          </DropdownMenuItem>

          {/* Manage accounts */}
          <DropdownMenuItem
            onClick={() => {
              const acc = accounts.find((a) => a.id === activeAccountId) ?? accounts[0];
              if (acc) { setEditAccount(acc); setDialogOpen(true); }
            }}
            className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-2 hover:bg-zinc-800 focus:bg-zinc-800 text-zinc-400 hover:text-zinc-200 focus:text-zinc-200"
          >
            <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
              <Settings2 className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-300">{t("manageAccounts")}</p>
              <p className="text-[10px] text-zinc-500">{t("manageSub")}</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* AccountDialog — shared for add + edit */}
      <AccountDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditAccount(null); }}
        onSuccess={() => { loadAccounts(); setDialogOpen(false); setEditAccount(null); }}
        account={editAccount as any}
      />
    </>
  );
}
