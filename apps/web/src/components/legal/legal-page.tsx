import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";

// ── Wrapper comun pentru paginile legale/publice (terms, privacy, contact) ──

export async function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  const t = await getTranslations("legalCommon");
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Header */}
      <header className="border-b border-zinc-800/50">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 h-14">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-indigo-500/30 transition-colors overflow-hidden">
              <Image src="/logo.jpg" alt="TradeGx" width={28} height={28} className="object-contain" style={{ mixBlendMode: "screen" }} />
            </div>
            <span className="font-black text-zinc-300 text-sm">
              Trade<span className="gradient-text-indigo">Gx</span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> {t("backToSite")}
          </Link>
        </div>
      </header>

      {/* Conținut */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black tracking-tight mb-2">{title}</h1>
        {updated && (
          <p className="text-xs text-zinc-600 mb-10">{t("lastUpdated", { date: updated })}</p>
        )}
        <div className="space-y-8">{children}</div>
      </main>

      {/* Footer minimal */}
      <footer className="border-t border-zinc-800/50 py-8 px-6 mt-12">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-600">
          <p>&copy; {new Date().getFullYear()} TradeGx</p>
          <div className="flex gap-5">
            <Link href="/terms" className="hover:text-zinc-400 transition-colors">{t("ftTerms")}</Link>
            <Link href="/privacy" className="hover:text-zinc-400 transition-colors">{t("ftPrivacy")}</Link>
            <Link href="/contact" className="hover:text-zinc-400 transition-colors">{t("ftContact")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-base font-bold text-zinc-100 mb-3">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-zinc-400">{children}</div>
    </section>
  );
}
