"use client";

import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Download, ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

interface ReportData {
  userName: string;
  currency: string;
  empty: boolean;
  summary: {
    totalTrades: number;
    winRate: number;
    totalPnl: number;
    profitFactor: number | null;
    avgWin: number;
    avgLoss: number;
    bestTrade: number;
    worstTrade: number;
    avgRR: number;
    maxDrawdown: number;
  };
  monthly: Array<{ month: string; pnl: number; trades: number }>;
  byInstrument: Array<{ label: string; winRate: number; total: number; pnl: number }>;
  bySetup: Array<{ label: string; winRate: number; total: number; pnl: number }>;
}

function money(n: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale === "ro" ? "ro-RO" : "en-US", {
    style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n);
}

export function ReportClient({ data }: { data: ReportData }) {
  const t = useTranslations("reportPage");
  const locale = useLocale();
  const months = t.raw("months") as string[];
  const monthLabel = (ym: string) => {
    const [y, m] = ym.split("-");
    return `${months[Number(m) - 1]} ${y}`;
  };

  // Titlul ferestrei devine numele fișierului PDF sugerat de browser
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    document.title = `${t("fileName")}-${today}`;
  }, [t]);

  const { summary: s, currency } = data;
  const generatedAt = new Date().toLocaleString(locale === "ro" ? "ro-RO" : "en-US", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-zinc-200 print:bg-white">
      {/* Bară de acțiuni — ascunsă la print */}
      <div className="print:hidden sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-5 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t("backToPanel")}
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
        >
          <Download className="w-4 h-4" /> {t("saveAsPdf")}
        </button>
      </div>

      {/* Pagina A4 */}
      <div className="mx-auto my-6 print:my-0 bg-white text-zinc-900 shadow-2xl print:shadow-none"
           style={{ width: "210mm", minHeight: "297mm", padding: "16mm" }}>

        {/* Antet */}
        <div className="flex items-start justify-between border-b-2 border-indigo-600 pb-5 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-lg">T</div>
              <span className="text-2xl font-black tracking-tight">
                Trade<span className="text-indigo-600">Gx</span>
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1 ml-0.5 uppercase tracking-widest font-semibold">Pro Trading Journal</p>
          </div>
          <div className="text-right">
            <h1 className="text-xl font-black text-zinc-800">{t("reportTitle")}</h1>
            <p className="text-sm text-zinc-600 mt-0.5">{data.userName}</p>
            <p className="text-xs text-zinc-400 mt-1">{t("generated")} {generatedAt}</p>
          </div>
        </div>

        {data.empty ? (
          <div className="text-center py-20">
            <p className="text-lg font-semibold text-zinc-700">{t("emptyTitle")}</p>
            <p className="text-sm text-zinc-500 mt-2">{t("emptyDesc")}</p>
          </div>
        ) : (
          <>
            {/* KPI principale */}
            <h2 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-3">{t("summaryGeneral")}</h2>
            <div className="grid grid-cols-4 gap-3 mb-7">
              {[
                { label: t("kNetProfit"), value: money(s.totalPnl, currency, locale), pos: s.totalPnl >= 0, big: true },
                { label: t("kWinRate"), value: `${s.winRate}%`, pos: s.winRate >= 50 },
                { label: t("kProfitFactor"), value: s.profitFactor !== null ? s.profitFactor.toFixed(2) : "—", pos: (s.profitFactor ?? 0) >= 1 },
                { label: t("kTotalTrades"), value: String(s.totalTrades), neutral: true },
                { label: t("kMaxDD"), value: `${s.maxDrawdown}%`, pos: s.maxDrawdown < 15 },
                { label: t("kAvgRR"), value: s.avgRR > 0 ? `${s.avgRR}R` : "—", pos: s.avgRR >= 1.5 },
                { label: t("kBestTrade"), value: money(s.bestTrade, currency, locale), pos: true },
                { label: t("kWorstTrade"), value: money(s.worstTrade, currency, locale), pos: false },
              ].map((kpi) => (
                <div key={kpi.label} className="border border-zinc-200 rounded-lg p-3 bg-zinc-50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{kpi.label}</p>
                  <p className={`text-lg font-black mt-1 ${
                    kpi.neutral ? "text-zinc-800" : kpi.pos ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Câștig vs pierdere medie */}
            <div className="grid grid-cols-2 gap-3 mb-7">
              <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">{t("avgWin")}</p>
                <p className="text-base font-black text-emerald-700 mt-0.5">{money(s.avgWin, currency, locale)}</p>
              </div>
              <div className="border border-rose-200 bg-rose-50 rounded-lg p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">{t("avgLoss")}</p>
                <p className="text-base font-black text-rose-700 mt-0.5">{money(s.avgLoss, currency, locale)}</p>
              </div>
            </div>

            {/* P&L lunar */}
            {data.monthly.length > 0 && (
              <div className="mb-7">
                <h2 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-3">{t("monthlyTitle")}</h2>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-zinc-300 text-left text-zinc-500">
                      <th className="py-2 font-bold">{t("colMonth")}</th>
                      <th className="py-2 font-bold text-center">{t("colTrades")}</th>
                      <th className="py-2 font-bold text-right">{t("colNetPnl")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.monthly.map((m) => (
                      <tr key={m.month} className="border-b border-zinc-100">
                        <td className="py-1.5 font-medium">{monthLabel(m.month)}</td>
                        <td className="py-1.5 text-center text-zinc-600">{m.trades}</td>
                        <td className={`py-1.5 text-right font-bold ${m.pnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {m.pnl >= 0 ? "+" : ""}{money(m.pnl, currency, locale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Performanță pe instrument */}
            {data.byInstrument.length > 0 && (
              <div className="mb-7">
                <h2 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-3">{t("instrumentTitle")}</h2>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-zinc-300 text-left text-zinc-500">
                      <th className="py-2 font-bold">{t("colInstrument")}</th>
                      <th className="py-2 font-bold text-center">{t("colTrades")}</th>
                      <th className="py-2 font-bold text-center">{t("colWinRate")}</th>
                      <th className="py-2 font-bold text-right">{t("colNetPnl")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byInstrument.map((r) => (
                      <tr key={r.label} className="border-b border-zinc-100">
                        <td className="py-1.5 font-medium">{r.label}</td>
                        <td className="py-1.5 text-center text-zinc-600">{r.total}</td>
                        <td className="py-1.5 text-center text-zinc-600">{r.winRate}%</td>
                        <td className={`py-1.5 text-right font-bold ${r.pnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {r.pnl >= 0 ? "+" : ""}{money(r.pnl, currency, locale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Performanță pe setup */}
            {data.bySetup.length > 0 && (
              <div className="mb-7">
                <h2 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-3">{t("setupTitle")}</h2>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-zinc-300 text-left text-zinc-500">
                      <th className="py-2 font-bold">{t("colSetup")}</th>
                      <th className="py-2 font-bold text-center">{t("colTrades")}</th>
                      <th className="py-2 font-bold text-center">{t("colWinRate")}</th>
                      <th className="py-2 font-bold text-right">{t("colNetPnl")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bySetup.map((r) => (
                      <tr key={r.label} className="border-b border-zinc-100">
                        <td className="py-1.5 font-medium">{r.label}</td>
                        <td className="py-1.5 text-center text-zinc-600">{r.total}</td>
                        <td className="py-1.5 text-center text-zinc-600">{r.winRate}%</td>
                        <td className={`py-1.5 text-right font-bold ${r.pnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {r.pnl >= 0 ? "+" : ""}{money(r.pnl, currency, locale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Subsol */}
        <div className="mt-auto pt-6 border-t border-zinc-200 text-center">
          <p className="text-[10px] text-zinc-400">
            {t("footer")}
          </p>
        </div>
      </div>

      {/* Hint pentru print */}
      <div className="print:hidden text-center pb-8 -mt-2">
        <p className="text-xs text-zinc-500 flex items-center justify-center gap-1.5">
          <Printer className="w-3.5 h-3.5" />
          {t("printHint")}
        </p>
      </div>
    </div>
  );
}
