import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("authMeta") };
}

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("auth");
  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="hero-grid-bg absolute inset-0 opacity-30" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/6 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/3 rounded-full blur-3xl" />
      </div>

      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      {/* Logo */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 relative flex items-center justify-center shrink-0 rounded-xl bg-zinc-900/80 border border-zinc-800 group-hover:border-indigo-500/30 transition-colors overflow-hidden">
            <Image src="/logo.jpg" alt="TradeGX" width={32} height={32} className="object-contain" style={{ mixBlendMode: "screen" }} />
          </div>
          <span className="font-black text-white tracking-tight">
            Trade<span className="gradient-text-indigo">GX</span>
          </span>
        </Link>

        {/* Right side: language switcher + badges */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-600">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/60 border border-zinc-800 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {t("sslEncryption")}
            </span>
            <span className="px-2.5 py-1 bg-zinc-900/60 border border-zinc-800 rounded-full">
              {t("proTrialFree")}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-6">
        <p className="text-zinc-700 text-xs">
          &copy; {new Date().getFullYear()} TradeGX. {t("allRights")}
        </p>
      </div>
    </div>
  );
}
