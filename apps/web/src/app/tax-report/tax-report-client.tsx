"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Download, ArrowLeft, Landmark, AlertTriangle, Loader2 } from "lucide-react";

interface TaxData {
  year: number;
  years: number[];
  currency: string;
  empty: boolean;
  summary: { totalTrades: number; grossGain: number; grossLoss: number; net: number; taxable: number; estTax: number };
  monthly: Array<{ month: number; trades: number; pnl: number }>;
  byInstrument: Array<{ label: string; winRate: number; total: number; pnl: number }>;
}

function money(n: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale === "ro" ? "ro-RO" : "en-US", {
    style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n);
}

export function TaxReportClient({ data }: { data: TaxData }) {
  const t = useTranslations("taxReport");
  const locale = useLocale();
  const months = t.raw("months") as string[];
  const { summary: s, currency, year } = data;
  const pageRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = `${t("navTitle")}-${year}`;
  }, [t, year]);

  async function downloadPdf() {
    if (busy) return;
    setBusy(true);
    try {
      // PDF generat pe server (font încorporat → diacritice RO perfecte, fișier vectorial).
      const res = await fetch(`/tax-report/pdf?year=${year}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TradeGx-${t("navTitle").replace(/\s+/g, "-")}-${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert(t("pdfError"));
    } finally {
      setBusy(false);
    }
  }

  const generatedAt = new Date().toLocaleString(locale === "ro" ? "ro-RO" : "en-US", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-zinc-200 print:bg-white">
      {/* Bară de acțiuni — ascunsă la print */}
      <div className="print:hidden sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
        <Link href="/analytics" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t("back")}
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{t("yearLabel")}</span>
          <div className="flex gap-1">
            {data.years.map((y) => (
              <Link
                key={y}
                href={`/tax-report?year=${y}`}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                  y === year ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                             : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {y}
              </Link>
            ))}
          </div>
        </div>
        <button
          onClick={downloadPdf}
          disabled={busy}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-60 disabled:cursor-wait"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {busy ? t("generating") : t("saveAsPdf")}
        </button>
      </div>

      {/* Pagina A4 */}
      <div ref={pageRef} className="mx-auto my-6 print:my-0 bg-white text-zinc-900 shadow-2xl print:shadow-none"
           style={{ width: "210mm", minHeight: "297mm", padding: "16mm" }}>

        {/* Antet */}
        <div className="flex items-start justify-between border-b-2 border-indigo-600 pb-5 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-lg">T</div>
              <span className="text-2xl font-black tracking-tight">Trade<span className="text-indigo-600">Gx</span></span>
            </div>
            <p className="text-xs text-zinc-500 mt-1 ml-0.5 uppercase tracking-widest font-semibold">Pro Trading Journal</p>
          </div>
          <div className="text-right">
            <h1 className="text-xl font-black text-zinc-800 flex items-center gap-2 justify-end">
              <Landmark className="w-5 h-5 text-indigo-600" /> {t("title", { year })}
            </h1>
            <p className="text-sm text-zinc-600 mt-0.5">{t("subtitle")}</p>
            <p className="text-xs text-zinc-400 mt-1">{t("generated")} {generatedAt}</p>
          </div>
        </div>

        {data.empty ? (
          <div className="text-center py-20">
            <p className="text-lg font-semibold text-zinc-700">{t("empty", { year })}</p>
            <p className="text-sm text-zinc-500 mt-2">{t("emptyDesc")}</p>
          </div>
        ) : (
          <>
            {/* Sumar */}
            <h2 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-3">{t("summaryTitle", { year })}</h2>
            <div className="grid grid-cols-4 gap-3 mb-7">
              {[
                { label: t("kTotalTrades"), value: String(s.totalTrades), cls: "text-zinc-800" },
                { label: t("kGrossGain"), value: money(s.grossGain, currency, locale), cls: "text-emerald-600" },
                { label: t("kGrossLoss"), value: `-${money(s.grossLoss, currency, locale)}`, cls: "text-rose-600" },
                { label: t("kNetResult"), value: `${s.net >= 0 ? "+" : ""}${money(s.net, currency, locale)}`, cls: s.net >= 0 ? "text-emerald-600" : "text-rose-600" },
              ].map((k) => (
                <div key={k.label} className="border border-zinc-200 rounded-lg p-3 bg-zinc-50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{k.label}</p>
                  <p className={`text-lg font-black mt-1 ${k.cls}`}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Estimare impozit */}
            <h2 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-3">{t("taxTitle")}</h2>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="border border-indigo-200 bg-indigo-50 rounded-lg p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">{t("taxableBase")}</p>
                <p className="text-base font-black text-indigo-800 mt-0.5">{money(s.taxable, currency, locale)}</p>
              </div>
              <div className="border border-amber-200 bg-amber-50 rounded-lg p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">{t("estTax")}</p>
                <p className="text-base font-black text-amber-800 mt-0.5">{money(s.estTax, currency, locale)}</p>
              </div>
            </div>
            {s.taxable <= 0 && <p className="text-xs text-zinc-500 mb-2">{t("noGain")}</p>}
            <p className="text-[10px] text-zinc-500 leading-relaxed mb-7">{t("taxNote")}</p>

            {/* Lunar */}
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
                        <td className="py-1.5 font-medium">{months[m.month]}</td>
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

            {/* Pe instrument */}
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

            {/* Disclaimer */}
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 flex items-start gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-black uppercase tracking-wide text-amber-700">{t("disclaimerTitle")}</p>
                <p className="text-[11px] text-zinc-600 leading-relaxed mt-0.5">{t("disclaimer")}</p>
              </div>
            </div>
          </>
        )}

        {/* Subsol */}
        <div className="mt-auto pt-6 border-t border-zinc-200 text-center">
          <p className="text-[10px] text-zinc-400">{t("footer")}</p>
        </div>
      </div>
      <div className="pb-8" />
    </div>
  );
}
