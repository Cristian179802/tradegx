import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { verifyShareToken } from "@/lib/share";
import { TrendingUp, TrendingDown, ArrowRight, ShieldCheck } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getTranslations("sharePage");
  return { title: tr("metaTitle"), robots: { index: false, follow: false } };
}

// Etichetele universale de setup; „Altul" se traduce la randare.
const SETUP_LABELS: Record<string, string> = {
  ORDER_BLOCK: "Order Block", FAIR_VALUE_GAP: "Fair Value Gap", LIQUIDITY_SWEEP: "Liquidity Sweep",
  BOS: "Break of Structure", CHOCH: "Change of Character", BREAKER: "Breaker Block",
  MITIGATION: "Mitigation", REJECTION: "Rejection", TREND_FOLLOW: "Trend Follow",
  SCALP: "Scalp",
};

async function InvalidLink() {
  const tr = await getTranslations("sharePage");
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="text-center">
        <h1 className="text-xl font-bold text-zinc-200">{tr("invalidTitle")}</h1>
        <p className="text-sm text-zinc-500 mt-2">{tr("invalidDesc")}</p>
        <Link href="/" className="inline-flex items-center gap-2 mt-5 text-sm text-indigo-400 hover:text-indigo-300">
          {tr("goToApp")} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default async function SharedTradePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { t } = await searchParams;
  const tr = await getTranslations("sharePage");
  const locale = await getLocale();

  if (!t || !verifyShareToken(id, t)) return <InvalidLink />;

  const trade = await prisma.trade.findUnique({
    where: { id },
    select: {
      symbol: true, direction: true, instrumentType: true,
      entryPrice: true, exitPrice: true, entryTime: true, exitTime: true,
      pnlPercent: true, riskMoney: true, pnlMoney: true,
      setupType: true, killzone: true, timeframe: true, status: true,
      durationMinutes: true, tags: true,
    },
  });

  if (!trade) return <InvalidLink />;

  const isBuy = trade.direction === "BUY";
  const pnlPct = trade.pnlPercent != null ? Number(trade.pnlPercent) : null;
  const isProfit = pnlPct != null && pnlPct >= 0;
  // R:R doar procentual / raport — fără sume în bani (date private)
  const rr = trade.riskMoney && trade.pnlMoney && Number(trade.riskMoney) > 0
    ? Math.abs(Number(trade.pnlMoney) / Number(trade.riskMoney)).toFixed(2)
    : null;

  const fmtPrice = (p: { toString(): string } | null) => (p != null ? Number(p).toFixed(5) : "—");
  const fmtDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString(locale === "ro" ? "ro-RO" : "en-US", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const duration = trade.durationMinutes
    ? trade.durationMinutes < 60 ? `${trade.durationMinutes}m`
      : `${Math.floor(trade.durationMinutes / 60)}h ${trade.durationMinutes % 60}m`
    : "—";

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center px-4 py-10"
         style={{ background: "radial-gradient(ellipse at top, rgba(99,102,241,0.08), transparent 60%), #09090b" }}>
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black">T</div>
        <span className="text-lg font-black tracking-tight text-zinc-100">
          Trade<span className="gradient-text-indigo">Gx</span>
        </span>
      </Link>

      {/* Card trade */}
      <div className="w-full max-w-lg rounded-3xl border border-zinc-800/80 bg-zinc-900/70 overflow-hidden shadow-2xl shadow-black/40">
        {/* Header */}
        <div className={`relative p-6 overflow-hidden ${
          isProfit ? "bg-gradient-to-br from-emerald-500/10 to-transparent"
          : pnlPct != null ? "bg-gradient-to-br from-rose-500/10 to-transparent"
          : "bg-gradient-to-br from-indigo-500/10 to-transparent"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl border flex flex-col items-center justify-center ${
                isBuy ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30"
              }`}>
                {isBuy ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-rose-400" />}
                <span className={`text-[9px] font-black ${isBuy ? "text-emerald-400" : "text-rose-400"}`}>{trade.direction}</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">{trade.symbol}</h1>
                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                  <span>{trade.instrumentType}</span>
                  {trade.timeframe && (<><span>·</span><span>{trade.timeframe}</span></>)}
                </div>
              </div>
            </div>
            {pnlPct != null && (
              <div className="text-right">
                <p className={`text-3xl font-black num ${isProfit ? "text-emerald-400" : "text-rose-400"}`}>
                  {isProfit ? "+" : ""}{pnlPct.toFixed(2)}%
                </p>
                {rr && <span className="text-[11px] text-zinc-500 num">R:R 1:{rr}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Detalii */}
        <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-4">
          {[
            { label: tr("lEntryPrice"), value: fmtPrice(trade.entryPrice) },
            { label: tr("lExitPrice"), value: fmtPrice(trade.exitPrice) },
            { label: tr("lEntryDate"), value: fmtDate(trade.entryTime) },
            { label: tr("lDuration"), value: duration },
            { label: tr("lSetup"), value: trade.setupType ? (trade.setupType === "OTHER" ? tr("setupOther") : (SETUP_LABELS[trade.setupType] ?? trade.setupType)) : "—" },
            { label: tr("lKillzone"), value: trade.killzone ?? "—" },
          ].map((row) => (
            <div key={row.label}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">{row.label}</p>
              <p className="text-sm font-semibold text-zinc-200 num mt-0.5">{row.value}</p>
            </div>
          ))}
        </div>

        {trade.tags && trade.tags.length > 0 && (
          <div className="px-6 pb-5 flex flex-wrap gap-1.5">
            {trade.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Notă confidențialitate */}
        <div className="px-6 pb-4 flex items-center gap-1.5 text-[10px] text-zinc-600">
          <ShieldCheck className="w-3 h-3" />
          {tr("privacyNote")}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 text-center">
        <p className="text-sm text-zinc-400">{tr("ctaQuestion")}</p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 mt-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
        >
          {tr("ctaButton")} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
