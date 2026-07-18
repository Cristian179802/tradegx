import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { AuthBackdrop, AuthHudStrip, AuthFrame } from "@/components/auth/auth-scene";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("authMeta") };
}

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("auth");
  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col relative overflow-hidden">
      {/* Scena VFX: constelație de date + aurore + grilă + HUD */}
      <AuthBackdrop />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 relative flex items-center justify-center shrink-0 rounded-xl bg-zinc-900/80 border border-zinc-800 group-hover:border-indigo-500/30 transition-colors overflow-hidden">
            <Image src="/logo.jpg" alt="TradeGX" width={32} height={32} className="object-contain" style={{ mixBlendMode: "screen" }} />
          </div>
          <span className="font-black text-white tracking-tight">
            Trade<span className="gradient-text-indigo">GX</span>
          </span>
        </Link>

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

      {/* Readout HUD */}
      <div className="relative z-10 -mt-2 mb-2">
        <AuthHudStrip />
      </div>

      {/* Card cu cadru holografic */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <AuthFrame>{children}</AuthFrame>
        </div>
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
